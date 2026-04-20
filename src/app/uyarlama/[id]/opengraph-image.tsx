import { ImageResponse } from "next/og";
import { getVariationById } from "@/lib/queries/variation";
import { loadGoogleFont } from "@/lib/og";

export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Tarifle, uyarlama paylaşımı";

interface Props {
  params: Promise<{ id: string }>;
}

/**
 * `/uyarlama/[id]/opengraph-image`, dinamik paylaşım kartı.
 *
 * Layout: eyebrow "UYARLAMA · <tarif adı>" + uyarlama başlığı büyük +
 * author satırı + Tarifle footer. Emoji kartın sol kutucuğunda büyük.
 * verification.ts'teki Outlook-safe table pattern'ine gerek yok (OG
 * image PNG, table arithmetic'i yok, Satori flexbox renderer).
 *
 * PUBLISHED olmayan uyarlamalar fallback kart gösterir (başlık yok,
 * generic "Tarifle uyarlaması"). Sayfa robots noindex olduğu için OG
 * image erişim engellemeye gerek yok; crawlerlar permission'a bakınca
 * sayfayı indexlemez zaten.
 */
export default async function Image({ params }: Props) {
  const { id } = await params;
  const variation = await getVariationById(id, null); // public-only view
  const isValid = variation !== null;

  const miniTitle = variation?.miniTitle ?? "Tarifle Uyarlaması";
  const recipeTitle = variation?.recipe.title ?? "Tarifle";
  const recipeEmoji = variation?.recipe.emoji ?? "🍳";
  const authorLabel =
    variation?.author.name ?? variation?.author.username ?? "Tarifle";

  const titleText = `${miniTitle} ${recipeTitle} ${authorLabel} Tarifle tarifle.app uyarlama`;
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
          <span>🔄 Uyarlama</span>
          {isValid && (
            <>
              <span style={{ opacity: 0.5 }}>·</span>
              <span
                style={{
                  textTransform: "none",
                  letterSpacing: 0,
                  color: "#1a1a1a",
                  fontWeight: 600,
                }}
              >
                {recipeTitle}
              </span>
            </>
          )}
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
            {recipeEmoji}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: 1.1,
                letterSpacing: -1,
                display: "flex",
              }}
            >
              {miniTitle}
            </div>
            {isValid && (
              <div
                style={{
                  fontSize: 24,
                  fontWeight: 500,
                  color: "#6b6b6b",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 38,
                    height: 38,
                    borderRadius: 19,
                    backgroundColor: "#e85d2c",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 18,
                  }}
                >
                  {authorLabel.charAt(0).toUpperCase()}
                </span>
                <span>{authorLabel}</span>
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
              topluluk uyarlaması
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
