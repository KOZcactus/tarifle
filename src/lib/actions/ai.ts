"use server";

import { unstable_cache } from "next/cache";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { getAiProvider } from "@/lib/ai/provider";
import { prisma } from "@/lib/prisma";
import type { AiSuggestResponse } from "@/lib/ai/types";
import { aiSuggestSchema } from "@/lib/validators";
import {
  checkRateLimit,
  getClientIp,
  rateLimitIdentifier,
} from "@/lib/rate-limit";

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function suggestRecipesAction(
  raw: unknown,
): Promise<ActionResult<AiSuggestResponse>> {
  // 30 requests / minute per identifier, the rule-based provider is cheap
  // today, but when we wire a real LLM later the same limit protects cost.
  // Logged-in users get a stable bucket; anonymous callers are keyed by IP.
  const session = await auth();
  const ip = session?.user?.id ? null : await getClientIp();
  const rate = await checkRateLimit(
    "ai-assistant",
    rateLimitIdentifier(session?.user?.id, ip),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

  const parsed = aiSuggestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }

  try {
    const provider = getAiProvider();
    const result = await provider.suggest(parsed.data);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Öneriler alınamadı.";
    return { success: false, error: message };
  }
}

// ── #13 Fırsat öneri: popüler ingredient + "N tarif açar" ──────

export interface IngredientCompletion {
  name: string;
  /** Bu ingredient eklenince eşleşebilecek toplam tarif sayısı (PUBLISHED). */
  recipeCount: number;
}

/**
 * Prod DB'deki en popüler ingredient'ları (tarif sayısı yüksek olanlar)
 * 1 saat cache'ler. 50 top ingredient cache + her çağrıda client'ın
 * mevcut listesi filtrelenip top N döndürülür. Rule-based, LLM yok.
 */
const getTopIngredientsCached = unstable_cache(
  async (): Promise<IngredientCompletion[]> => {
    // Raw SQL: DB'deki published tariflere sahip ingredient'ları
    // normalize (lower + TR ascii-fold yok, basit lower) + count + top 50.
    const rows = await prisma.$queryRaw<
      { name: string; cnt: bigint }[]
    >`
      SELECT lower(trim(i.name)) AS name,
             COUNT(DISTINCT i."recipeId")::bigint AS cnt
      FROM recipe_ingredients i
      JOIN recipes r ON r.id = i."recipeId"
      WHERE r.status = 'PUBLISHED'
      GROUP BY lower(trim(i.name))
      HAVING COUNT(DISTINCT i."recipeId") >= 5
      ORDER BY cnt DESC
      LIMIT 50
    `;
    return rows.map((r) => ({ name: r.name, recipeCount: Number(r.cnt) }));
  },
  ["ai-top-ingredients-v1"],
  { revalidate: 60 * 60, tags: ["recipes"] },
);

const completionsSchema = z.object({
  currentIngredients: z.array(z.string().min(1).max(80)).max(30),
});

/**
 * Fırsat öneri: kullanıcı pantry'si + filtre sonucunda 0 tarif çıktıysa
 * veya form boşsa, en popüler N ingredient'tan kullanıcıda olmayanları
 * dön. UI "+un (1200 tarifte), +yumurta (850 tarifte)" chip'i gösterir.
 *
 * Hafif action: cache'li, 1 saatte bir DB, rate-limit gevşek.
 */
export async function getIngredientCompletionsAction(
  raw: unknown,
): Promise<ActionResult<IngredientCompletion[]>> {
  const session = await auth();
  const ip = session?.user?.id ? null : await getClientIp();
  const rate = await checkRateLimit(
    "ai-assistant",
    rateLimitIdentifier(session?.user?.id, ip),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }
  const parsed = completionsSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? "Geçersiz veri.",
    };
  }
  try {
    const all = await getTopIngredientsCached();
    const userSet = new Set(
      parsed.data.currentIngredients.map((s) =>
        s.toLocaleLowerCase("tr").trim(),
      ),
    );
    const top = all
      .filter((r) => {
        const n = r.name.toLocaleLowerCase("tr");
        // Kullanıcı zaten ekledi veya benzer prefix (tavuk ↔ tavuk göğsü)
        for (const u of userSet) {
          if (n === u || n.includes(u) || u.includes(n)) return false;
        }
        return true;
      })
      .slice(0, 5);
    return { success: true, data: top };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Öneri hesaplanamadı.";
    return { success: false, error: message };
  }
}
