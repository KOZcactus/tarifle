"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { checkMultipleTexts } from "@/lib/moderation/blacklist";
import { computePreflightFlags } from "@/lib/moderation/preflight";
import { formatIngredient } from "@/lib/ingredients";
import { variationSchema } from "@/lib/validators";
import { awardFirstVariationBadge } from "@/lib/badges/service";
import { checkRateLimit, rateLimitIdentifier } from "@/lib/rate-limit";
import { notifyNewVariationFromFollowed } from "@/lib/notifications/service";

interface ActionResult {
  success: boolean;
  error?: string;
}

interface VariationResult {
  success: boolean;
  error?: string;
  /**
   * True when pre-flight heuristics flagged the submission and we saved it
   * as PENDING_REVIEW. The UI should tell the user their post is in review
   * rather than silently promising it's live.
   */
  pending?: boolean;
}

function splitLines(raw: string | null): string[] {
  if (!raw) return [];
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
}

/**
 * The new ingredient form posts a JSON-encoded array. We tolerate two legacy
 * shapes so old clients, or anyone scripting against the action, still
 * submit successfully: a raw `string[]` JSON blob, and a newline-separated
 * textarea body. `variationSchema` normalises both into the structured
 * `{amount, unit, name}` canonical form.
 */
function parseIngredientsField(raw: string | null): unknown[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  // Looks like JSON array → trust it and let Zod validate.
  if (trimmed.startsWith("[")) {
    try {
      const parsed: unknown = JSON.parse(trimmed);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Legacy textarea, newline-separated strings.
  return splitLines(trimmed);
}

export async function createVariation(formData: FormData): Promise<VariationResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısınız." };
  }

  // Iki katmanli rate limit: kisa pencere burst'i (3/saat) ve gunluk hacmi
  // (10/gun) ayri ayri kontrol et. Ikisinden hangisi trip ederse kullaniciya
  // o mesaj gider. Badge awarding buradan sonraya kaliyor, rate-limit
  // donunde kazara rozet verme riski yok.
  const rlId = rateLimitIdentifier(session.user.id);
  const burst = await checkRateLimit("variation-create", rlId);
  if (!burst.success) {
    return { success: false, error: burst.message ?? "Çok fazla istek." };
  }
  const daily = await checkRateLimit("variation-create-daily", rlId);
  if (!daily.success) {
    return { success: false, error: daily.message ?? "Günlük limitine ulaştın." };
  }

  const recipeSlug = (formData.get("recipeSlug") as string | null) ?? "";

  const parsed = variationSchema.safeParse({
    recipeId: formData.get("recipeId"),
    miniTitle: (formData.get("miniTitle") as string | null)?.trim(),
    description:
      (formData.get("description") as string | null)?.trim() || undefined,
    ingredients: parseIngredientsField(formData.get("ingredients") as string | null),
    steps: splitLines(formData.get("steps") as string | null),
    notes: (formData.get("notes") as string | null)?.trim() || undefined,
  });

  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Form bilgileri geçersiz.",
    };
  }

  const { recipeId, miniTitle, description, ingredients, steps, notes } =
    parsed.data;

  // Strict PUBLISHED check, DRAFT/PENDING_REVIEW/HIDDEN/REJECTED are all
  // invalid targets for community variations. Prevents users from attaching
  // content to in-review or admin-private recipes via crafted IDs.
  const recipe = await prisma.recipe.findUnique({
    where: { id: recipeId },
    select: { id: true, status: true },
  });
  if (!recipe || recipe.status !== "PUBLISHED") {
    return { success: false, error: "Tarif bulunamadı." };
  }

  // Flatten structured ingredients to plain text lines so the blacklist +
  // preflight heuristics (string-based) still work. We keep the structured
  // form for DB writes below, this is display-only.
  const ingredientLines = ingredients.map(formatIngredient);

  // Argo/küfür kontrolü
  const textsToCheck = [
    miniTitle,
    description ?? "",
    notes ?? "",
    ...ingredientLines,
    ...steps,
  ];
  const blacklistResult = checkMultipleTexts(textsToCheck);
  if (!blacklistResult.isClean) {
    return {
      success: false,
      error:
        "İçeriğiniz uygunsuz ifadeler içeriyor. Lütfen düzenleyip tekrar deneyin.",
    };
  }

  // Pre-flight heuristics (rule-based). Blacklist already caught outright
  // profanity above. These are softer signals, if any fire, the variation
  // is saved as PENDING_REVIEW so a moderator eyeballs it before it goes
  // live. Clean content goes straight to PUBLISHED as before.
  const preflight = computePreflightFlags({
    miniTitle,
    description,
    ingredients: ingredientLines,
    steps,
    notes,
  });
  const status = preflight.needsReview ? "PENDING_REVIEW" : "PUBLISHED";

  await prisma.variation.create({
    data: {
      recipeId,
      authorId: session.user.id,
      miniTitle,
      description: description ?? null,
      ingredients,
      steps,
      notes: notes ?? null,
      status,
      // Store the flag codes directly on the row so the admin queue can
      // render the reasons without joining to ModerationAction. Null for
      // clean auto-publish, comma-joined codes otherwise.
      moderationFlags: preflight.needsReview
        ? preflight.flags.join(",")
        : null,
    },
  });

  // Best-effort badge grant, never block the publish path.
  awardFirstVariationBadge(session.user.id).catch((err) => {
    console.error("[variation] badge grant failed:", err);
  });

  // Fan-out bildirimi, sadece PUBLISHED içerik için. PENDING_REVIEW'da
  // takipçilere haber vermiyoruz; admin approve ederse notifyVariation
  // ApprovedExt olarak eklenebilir (v2). Sorgular sıralı çünkü follower
  // sayısı genelde küçük (<200); Promise.allSettled spam güvenliği +
  // tek hata tüm akışı patlatmasın.
  if (status === "PUBLISHED") {
    fanOutVariationToFollowers({
      authorId: session.user.id,
      recipeSlug,
      miniTitle,
    }).catch((err) => {
      console.error("[variation] fan-out notification failed:", err);
    });
  }

  revalidatePath(`/tarif/${recipeSlug}`);
  return {
    success: true,
    // Signal to the UI so it can show "incelemeye alındı" vs the default
    // "yayınlandı" toast. Both are success; the copy should differ.
    pending: preflight.needsReview,
  };
}

/**
 * Author-initiated delete. Lets a user remove an uyarlama they added —
 * typical scenario: "yanlislikla ekledim". Hard delete (cascade removes
 * Like rows via FK); we stamp an AuditLog entry so the action is traceable
 * if support needs to reconstruct what happened.
 *
 * Authorization rule: session.user.id must equal variation.authorId. Anyone
 * else, including admins, uses the moderation queue (hide / reject) which
 * preserves the row for audit. An admin who also happens to be the author
 * still goes through this path; the ownership check is what matters.
 *
 * Not wired to report/notification cleanup explicitly: Report FK is a
 * logical reference (targetId/targetType strings), not a hard FK, so any
 * pending reports for the deleted variation will simply never resolve —
 * mods can ignore-or-close them in the admin queue. Acceptable: the
 * expected volume is near-zero (report AND own-delete is rare).
 */
export async function deleteOwnVariationAction(
  variationId: string,
): Promise<ActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, error: "Giriş yapmalısın." };
  }
  if (!variationId || typeof variationId !== "string") {
    return { success: false, error: "Geçersiz istek." };
  }

  const variation = await prisma.variation.findUnique({
    where: { id: variationId },
    select: {
      id: true,
      authorId: true,
      miniTitle: true,
      recipe: { select: { slug: true } },
    },
  });
  if (!variation) {
    return { success: false, error: "Uyarlama bulunamadı." };
  }
  if (variation.authorId !== session.user.id) {
    // Deliberately terse, don't confirm the variation exists to a non-owner.
    return { success: false, error: "Bu uyarlamayı silme yetkin yok." };
  }

  await prisma.$transaction([
    prisma.variation.delete({ where: { id: variation.id } }),
    prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "VARIATION_SELF_DELETE",
        targetType: "variation",
        targetId: variation.id,
        metadata: {
          miniTitle: variation.miniTitle,
          recipeSlug: variation.recipe.slug,
        },
      },
    }),
  ]);

  // Refresh the two surfaces where the deleted uyarlama would have been
  // visible, recipe detail (other visitors) and the author's profile.
  revalidatePath(`/tarif/${variation.recipe.slug}`);
  if (session.user.username) {
    revalidatePath(`/profil/${session.user.username}`);
  }

  return { success: true };
}

/**
 * Yeni PUBLISHED variation'ı yazarın tüm takipçilerine duyurur.
 * `createVariation` sonrası fire-and-forget çağrılır; tek notification
 * hatası tüm akışı batmasın diye `Promise.allSettled` ile izole.
 *
 * Scale notu: Takipçi sayısı <200 sayılır, tek-tek insert OK.
 * 1000+ takipçili hesap çıkınca Notification batch insert + queue
 * gerekir (v2 iş).
 */
async function fanOutVariationToFollowers(params: {
  authorId: string;
  recipeSlug: string;
  miniTitle: string;
}): Promise<void> {
  const author = await prisma.user.findUnique({
    where: { id: params.authorId },
    select: { username: true, name: true },
  });
  if (!author) return;

  const followers = await prisma.follow.findMany({
    where: { followingId: params.authorId },
    select: { followerId: true },
  });
  if (followers.length === 0) return;

  await Promise.allSettled(
    followers.map((f) =>
      notifyNewVariationFromFollowed({
        followerUserId: f.followerId,
        authorUsername: author.username,
        authorName: author.name,
        recipeSlug: params.recipeSlug,
        variationTitle: params.miniTitle,
      }),
    ),
  );
}
