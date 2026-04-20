import { getTranslations } from "next-intl/server";
import { SITE_NAME, SITE_URL } from "@/lib/constants";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { CUISINE_FLAG } from "@/lib/cuisines";
import type { CuisineCode } from "@/lib/cuisines";
import type { RecipeCard } from "@/types/recipe";
import type { CuisineStat } from "@/lib/queries/cuisine-stats";
import type { ActiveSubscriber } from "@/lib/queries/newsletter";
import { getEmailProvider } from "./client";

/**
 * Weekly "Editör Seçimi" newsletter email.
 *
 * Layout:
 *   - eyebrow + title + greeting
 *   - featured grid (3-6 cards, emoji + title + CTA link per card)
 *   - "Bu haftanın yenileri" row (recent, 3-6 items)
 *   - "Bu hafta öne çıkan mutfaklar" row (top 4 cuisines with flag + count)
 *   - Closing CTA + unsubscribe footer
 *
 * Email HTML follows the Outlook-safe table pattern verification.ts uses
 * (inline styles, max-width 560, no external CSS). Plain-text fallback is
 * a newline-joined array.
 *
 * Locale-aware: subscriber.locale determines which title variant we render
 * (TR default, EN fallback; DE isn't a newsletter target right now). The
 * recipe title picker handles missing translations gracefully.
 */

export interface WeeklyNewsletterContent {
  featured: RecipeCard[];
  recent: RecipeCard[];
  topCuisines: CuisineStat[];
}

export async function sendWeeklyNewsletter(
  subscriber: ActiveSubscriber,
  content: WeeklyNewsletterContent,
): Promise<{ success: boolean; error?: string }> {
  const locale: Locale =
    subscriber.locale === "en" ? "en" : DEFAULT_LOCALE;

  const t = await getTranslations({ locale, namespace: "email.newsletterWeekly" });

  const unsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${subscriber.unsubscribeToken}`;
  const homeUrl = `${SITE_URL}/`;

  const featuredCards = content.featured.slice(0, 6);
  const recentCards = content.recent.slice(0, 6);
  const topCuisines = content.topCuisines.slice(0, 4);

  const subject = t("subject", { siteName: SITE_NAME });

  // ── Plain text ────────────────────────────────────────────
  const textLines: string[] = [
    t("greeting"),
    "",
    t("intro"),
    "",
    `, ${t("featuredHeading")},`,
  ];
  for (const recipe of featuredCards) {
    const title = recipe.title;
    textLines.push(
      `  ${recipe.emoji ?? "🍳"} ${title}`,
      `    ${SITE_URL}/tarif/${recipe.slug}`,
    );
  }
  if (recentCards.length > 0) {
    textLines.push("", `, ${t("recentHeading")},`);
    for (const recipe of recentCards) {
      const title = recipe.title;
      textLines.push(
        `  ${recipe.emoji ?? "🍳"} ${title}`,
        `    ${SITE_URL}/tarif/${recipe.slug}`,
      );
    }
  }
  if (topCuisines.length > 0) {
    textLines.push("", `, ${t("cuisinesHeading")},`);
    for (const c of topCuisines) {
      const flag = CUISINE_FLAG[c.code as CuisineCode] ?? "🌍";
      textLines.push(`  ${flag} ${c.label}: ${c.count} ${t("recipesWord")}`);
    }
  }
  textLines.push("", t("outro"), homeUrl, "", t("unsubscribeLine"), unsubUrl);
  const text = textLines.join("\n");

  // ── HTML ──────────────────────────────────────────────────
  const featuredHtml = featuredCards
    .map((r) => recipeCardHtml(r, locale))
    .join("");
  const recentHtml = recentCards.length
    ? `
        <h2 style="margin:32px 0 12px;font-size:18px;font-weight:700;color:#1a1a1a;">${t("recentHeading")}</h2>
        ${recentCards.map((r) => recipeCardHtml(r, locale)).join("")}
      `
    : "";
  const cuisinesHtml = topCuisines.length
    ? `
        <h2 style="margin:32px 0 12px;font-size:18px;font-weight:700;color:#1a1a1a;">${t("cuisinesHeading")}</h2>
        <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:#1a1a1a;">
          ${topCuisines
            .map((c) => {
              const flag = CUISINE_FLAG[c.code as CuisineCode] ?? "🌍";
              const cuisineUrl = `${SITE_URL}/mutfak/${c.code}`;
              return `<a href="${cuisineUrl}" style="color:#1a1a1a;text-decoration:none;margin-right:12px;display:inline-block;margin-bottom:6px;"><span style="margin-right:4px;">${flag}</span><strong>${escapeHtml(c.label)}</strong> <span style="color:#6b6b6b;">(${c.count})</span></a>`;
            })
            .join("")}
        </p>
      `
    : "";

  const html = `
<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#f8f6f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f2;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ddd8cf;">
        <tr><td style="padding:32px 32px 24px;">
          <p style="margin:0 0 4px;font-size:14px;color:#6b6b6b;letter-spacing:1px;text-transform:uppercase;">${escapeHtml(t("eyebrow"))}</p>
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.2;color:#1a1a1a;">${escapeHtml(t("title"))}</h1>
          <p style="margin:0 0 20px;font-size:15px;line-height:1.55;color:#1a1a1a;">${escapeHtml(t("intro"))}</p>

          <h2 style="margin:0 0 12px;font-size:18px;font-weight:700;color:#1a1a1a;">${escapeHtml(t("featuredHeading"))}</h2>
          ${featuredHtml}

          ${recentHtml}

          ${cuisinesHtml}

          <p style="margin:32px 0 16px;text-align:center;">
            <a href="${homeUrl}" style="display:inline-block;background:#e85d2c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">${escapeHtml(t("cta"))}</a>
          </p>

          <hr style="border:none;border-top:1px solid #ddd8cf;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:12px;color:#6b6b6b;line-height:1.55;">${escapeHtml(t("footer"))}</p>
          <p style="margin:0;font-size:11px;color:#a3a3a3;line-height:1.55;">
            ${escapeHtml(t("unsubscribeLine"))}
            <a href="${unsubUrl}" style="color:#e85d2c;text-decoration:underline;">${escapeHtml(t("unsubscribeCta"))}</a>
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#6b6b6b;">© Tarifle · tarifle.app</p>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const provider = getEmailProvider();
  return provider.send({
    to: subscriber.email,
    subject,
    text,
    html,
  });
}

function recipeCardHtml(recipe: RecipeCard, _locale: Locale): string {
  const title = recipe.title;
  const url = `${SITE_URL}/tarif/${recipe.slug}`;
  const emoji = recipe.emoji ?? "🍳";
  return `
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;background:#faf7f2;border:1px solid #ede6d8;border-radius:10px;">
      <tr>
        <td width="56" style="padding:14px 14px;font-size:28px;text-align:center;vertical-align:middle;background:#f0ece4;border-right:1px solid #ede6d8;">${emoji}</td>
        <td style="padding:12px 16px;">
          <a href="${url}" style="color:#1a1a1a;text-decoration:none;font-weight:600;font-size:15px;line-height:1.35;">${escapeHtml(title)}</a>
        </td>
      </tr>
    </table>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
