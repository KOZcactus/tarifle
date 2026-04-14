import { ImageResponse } from "next/og";
import { getRecipeBySlug } from "@/lib/queries/recipe";
import { formatMinutes, getDifficultyLabel } from "@/lib/utils";
import { loadGoogleFont } from "@/lib/og";

export const alt = "Tarifle — tarif paylaşımı";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  const title = recipe?.title ?? "Tarifle";
  const emoji = recipe?.emoji ?? "🍳";
  const categoryName = recipe?.category?.name ?? "Tarifler";
  const difficulty = recipe ? getDifficultyLabel(recipe.difficulty) : "";
  const duration = recipe ? formatMinutes(recipe.totalMinutes) : "";
  const calories = recipe?.averageCalories ?? null;

  // Load a Turkish-capable subset of Bricolage Grotesque (bold) for the title
  // and the body copy. We pass the exact text so Google only returns those glyphs.
  const titleText = `${title} ${categoryName} ${difficulty} ${duration} ${calories ?? ""} kcal tarifle.app`;
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
        {/* Decorative corner accent */}
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

        {/* Top — category label */}
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
          <span>{categoryName}</span>
        </div>

        {/* Body */}
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            gap: 48,
            marginTop: 32,
          }}
        >
          {/* Emoji block */}
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

          {/* Title + chips */}
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

        {/* Footer — brand */}
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
              Make Eat
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
