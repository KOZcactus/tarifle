import { ImageResponse } from "next/og";
import { auth } from "@/lib/auth";
import { getViewableCollection } from "@/lib/queries/collection";
import { loadGoogleFont } from "@/lib/og";

export const alt = "Tarifle koleksiyon";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function Image({ params }: Props) {
  const { id } = await params;
  // IMPORTANT: use the auth-gated helper so private collections never leak
  // their name/emoji/owner/previews via the OG endpoint.
  const session = await auth();
  const collection = await getViewableCollection(id, session?.user?.id);

  const name = collection?.name ?? "Koleksiyon";
  const emoji = collection?.emoji ?? "📁";
  const owner = collection?.user.username ?? "";
  const itemCount = collection?.items.length ?? 0;
  const previewRecipes = collection?.items.slice(0, 4) ?? [];

  const text = `${name} ${owner} ${itemCount} tarif koleksiyon tarifle.app Make Eat`;
  const [bold, medium] = await Promise.all([
    loadGoogleFont("Bricolage Grotesque", text, 700),
    loadGoogleFont("Bricolage Grotesque", text, 500),
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
            background: "linear-gradient(90deg, #3b7ae8 0%, #e85d2c 100%)",
          }}
        />

        <div
          style={{
            display: "flex",
            color: "#6b6b6b",
            fontSize: 24,
            fontWeight: 500,
            textTransform: "uppercase",
            letterSpacing: 2,
          }}
        >
          Koleksiyon · @{owner}
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
          {/* Preview tiles — 2x2 via nested flex since Satori has no grid */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
              width: 260,
              height: 260,
              borderRadius: 32,
              overflow: "hidden",
              backgroundColor: "#ddd8cf",
              padding: 0,
              flexShrink: 0,
            }}
          >
            {[0, 2].map((rowStart) => (
              <div key={rowStart} style={{ display: "flex", gap: 8, flex: 1 }}>
                {[0, 1].map((col) => {
                  const r = previewRecipes[rowStart + col];
                  return (
                    <div
                      key={col}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: "#f0ece4",
                        fontSize: 64,
                        flex: 1,
                      }}
                    >
                      {r?.recipe.emoji ?? ""}
                    </div>
                  );
                })}
              </div>
            ))}
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
                alignItems: "baseline",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 80 }}>{emoji}</span>
              <span>{name}</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: "#3b7ae8",
                color: "#ffffff",
                fontSize: 26,
                fontWeight: 700,
                padding: "10px 24px",
                borderRadius: 999,
                alignSelf: "flex-start",
              }}
            >
              {itemCount} tarif
            </div>
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
        { name: "Bricolage", data: bold, style: "normal", weight: 700 },
        { name: "Bricolage", data: medium, style: "normal", weight: 500 },
      ],
      emoji: "twemoji",
    },
  );
}
