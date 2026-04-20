import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getRecipeBySlug } from "@/lib/queries/recipe";
import { loadGoogleFont } from "@/lib/og";
import { isValidLocale, type Locale } from "@/i18n/config";
import { pickRecipeTitle } from "@/lib/recipe/translate";

// Runtime: nodejs (default), getRecipeBySlug uses Prisma, which doesn't run
// on the edge. Matches opengraph-image.tsx's implicit runtime.
export const contentType = "image/png";

const SIZE = { width: 1000, height: 1500 };

/**
 * Pinterest-optimized 2:3 portrait share image (1000x1500).
 *
 * Why a separate route instead of adding another `generateImageMetadata` id
 * to opengraph-image.tsx: the OG `images` array is consumed by Facebook /
 * WhatsApp / Twitter crawlers that prefer 1.91:1 landscape. Adding a portrait
 * variant there would let those scrapers pick the wrong aspect. Pinterest
 * reads `media=` from the create-pin intent URL, so ShareMenu can hand it
 * this portrait URL explicitly without polluting the general OG surface.
 *
 * Vertical composition: emoji badge top, large title middle, meta chip row,
 * Tarifle wordmark footer. Same brand palette as the landscape OG image.
 */
function formatMinutesI18n(
  minutes: number,
  t: (
    key: "minutesShort" | "hoursShort" | "hoursMinutes",
    values?: Record<string, string | number>,
  ) => string,
): string {
  if (minutes < 60) return t("minutesShort", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return t("hoursShort", { n: hours });
  return t("hoursMinutes", { h: hours, m: remaining });
}

function Chip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: bg,
        color: fg,
        fontSize: 32,
        fontWeight: 700,
        padding: "14px 32px",
        borderRadius: 999,
      }}
    >
      {label}
    </div>
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const url = new URL(request.url);
  const rawLocale = url.searchParams.get("locale") ?? "tr";
  const locale: Locale = isValidLocale(rawLocale) ? rawLocale : "tr";

  const [recipe, tCard, tType] = await Promise.all([
    getRecipeBySlug(slug),
    getTranslations({ locale, namespace: "recipes.card" }),
    getTranslations({ locale, namespace: "aiCommentary.typeLabels" }),
  ]);

  const title = recipe
    ? pickRecipeTitle(recipe.title, recipe.translations, locale)
    : "Tarifle";
  const emoji = recipe?.emoji ?? "🍳";
  const eyebrow =
    recipe && tType.has(recipe.type)
      ? tType(recipe.type)
      : recipe?.category?.name ?? "Tarifler";
  const difficulty = recipe
    ? tCard(
        recipe.difficulty === "EASY"
          ? "difficultyEasy"
          : recipe.difficulty === "MEDIUM"
            ? "difficultyMedium"
            : "difficultyHard",
      )
    : "";
  const duration = recipe
    ? formatMinutesI18n(recipe.totalMinutes, (key, values) =>
        tCard(key, values ?? {}),
      )
    : "";
  const calories = recipe?.averageCalories ?? null;
  const brandTagline = locale === "en" ? "Make Eat" : "Make Eat";

  const titleText = `${title} ${eyebrow} ${difficulty} ${duration} ${
    calories ?? ""
  } kcal tarifle.app`;
  const [bricolageBold, bricolageRegular] = await Promise.all([
    loadGoogleFont("Bricolage Grotesque", titleText, 700),
    loadGoogleFont("Bricolage Grotesque", titleText, 500),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#f8f6f2",
          padding: "80px 72px",
          position: "relative",
          fontFamily: "Bricolage",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: 16,
            background: "linear-gradient(90deg, #e85d2c 0%, #d4a843 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#6b6b6b",
            fontSize: 28,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 3,
          }}
        >
          <span>{eyebrow}</span>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 56,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 360,
              height: 360,
              backgroundColor: "#f0ece4",
              borderRadius: 48,
              fontSize: 220,
              flexShrink: 0,
            }}
          >
            {emoji}
          </div>

          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1.08,
              letterSpacing: -1.2,
              textAlign: "center",
              display: "flex",
              justifyContent: "center",
              maxWidth: 880,
            }}
          >
            {title}
          </div>

          {recipe && (
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                justifyContent: "center",
              }}
            >
              <Chip label={difficulty} bg="#e85d2c" fg="#ffffff" />
              <Chip label={`⏱ ${duration}`} bg="#f0ece4" fg="#1a1a1a" />
              {calories !== null && (
                <Chip label={`~${calories} kcal`} bg="#f0ece4" fg="#1a1a1a" />
              )}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: "1px solid #ddd8cf",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span style={{ fontSize: 52, fontWeight: 700, color: "#e85d2c" }}>
              Tarifle
            </span>
            <span style={{ fontSize: 28, color: "#6b6b6b", fontWeight: 500 }}>
              {brandTagline}
            </span>
          </div>
          <span style={{ fontSize: 28, color: "#6b6b6b", fontWeight: 500 }}>
            tarifle.app
          </span>
        </div>
      </div>
    ),
    {
      ...SIZE,
      fonts: [
        { name: "Bricolage", data: bricolageBold, style: "normal", weight: 700 },
        {
          name: "Bricolage",
          data: bricolageRegular,
          style: "normal",
          weight: 500,
        },
      ],
      emoji: "twemoji",
      headers: {
        // Pinterest scraper hits this once per pin; long-cache is safe because
        // the layout is deterministic per (slug, locale) and recipe mutations
        // are rare.
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    },
  );
}
