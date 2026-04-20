import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { getRecipeBySlug } from "@/lib/queries/recipe";
import { loadGoogleFont } from "@/lib/og";
import { isValidLocale, type Locale } from "@/i18n/config";
import { pickRecipeTitle } from "@/lib/recipe/translate";

export const contentType = "image/png";
export const size = { width: 1200, height: 630 };

interface Props {
  params: Promise<{ slug: string }>;
  id: Promise<string>;
}

/**
 * Produce a TR and an EN version of the OG preview. OG crawlers (WhatsApp,
 * Twitter, Facebook) don't send the user's locale cookie, so a single
 * cached image can't adapt. Instead we expose two URLs, `.../opengraph-
 * image/tr` and `.../opengraph-image/en`, and `generateMetadata` on the
 * page picks the right one by reading the viewer's cookie at request time.
 */
export function generateImageMetadata() {
  return [
    { id: "tr", alt: "Tarifle, tarif paylaşımı", size, contentType },
    { id: "en", alt: "Tarifle, recipe share", size, contentType },
  ];
}

function formatMinutesI18n(
  minutes: number,
  t: (key: "minutesShort" | "hoursShort" | "hoursMinutes", values?: Record<string, string | number>) => string,
): string {
  if (minutes < 60) return t("minutesShort", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return t("hoursShort", { n: hours });
  return t("hoursMinutes", { h: hours, m: remaining });
}

export default async function Image({ params, id }: Props) {
  const { slug } = await params;
  const rawId = await id;
  const locale: Locale = isValidLocale(rawId) ? (rawId as Locale) : "tr";

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
    recipe && tType.has(recipe.type) ? tType(recipe.type) : recipe?.category?.name ?? "Tarifler";
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
    ? formatMinutesI18n(
        recipe.totalMinutes,
        (key, values) => tCard(key, values ?? {}),
      )
    : "";
  const calories = recipe?.averageCalories ?? null;
  const brandTagline = locale === "en" ? "Make Eat" : "Make Eat";

  const titleText = `${title} ${eyebrow} ${difficulty} ${duration} ${calories ?? ""} kcal tarifle.app`;
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
          padding: "60px 72px",
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
            height: 12,
            background: "linear-gradient(90deg, #e85d2c 0%, #d4a843 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            color: "#6b6b6b",
            fontSize: 24,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          <span>{eyebrow}</span>
        </div>

        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 48,
            marginTop: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 240,
              height: 240,
              backgroundColor: "#f0ece4",
              borderRadius: 32,
              fontSize: 140,
              flexShrink: 0,
            }}
          >
            {emoji}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 24,
            }}
          >
            <div
              style={{
                fontSize: 76,
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: 1.05,
                letterSpacing: -1,
                display: "flex",
              }}
            >
              {title}
            </div>

            {recipe && (
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <Chip label={difficulty} bg="#e85d2c" fg="#ffffff" />
                <Chip label={`⏱ ${duration}`} bg="#f0ece4" fg="#1a1a1a" />
                {calories !== null && (
                  <Chip label={`~${calories} kcal`} bg="#f0ece4" fg="#1a1a1a" />
                )}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 32,
            paddingTop: 24,
            borderTop: "1px solid #ddd8cf",
          }}
        >
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontSize: 40, fontWeight: 700, color: "#e85d2c" }}>
              Tarifle
            </span>
            <span style={{ fontSize: 22, color: "#6b6b6b", fontWeight: 500 }}>
              {brandTagline}
            </span>
          </div>
          <span style={{ fontSize: 22, color: "#6b6b6b", fontWeight: 500 }}>
            tarifle.app
          </span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Bricolage", data: bricolageBold, style: "normal", weight: 700 },
        { name: "Bricolage", data: bricolageRegular, style: "normal", weight: 500 },
      ],
      emoji: "twemoji",
    },
  );
}

function Chip({ label, bg, fg }: { label: string; bg: string; fg: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: bg,
        color: fg,
        fontSize: 26,
        fontWeight: 700,
        padding: "10px 24px",
        borderRadius: 999,
      }}
    >
      {label}
    </div>
  );
}
