import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og";
import { SITE_DESCRIPTION } from "@/lib/constants";

export const alt = "Tarifle — Make Eat";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const text = `Tarifle Make Eat ${SITE_DESCRIPTION} tarifle.app Yemek Içecek Kokteyl Tarif`;
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
          justifyContent: "space-between",
          backgroundColor: "#f8f6f2",
          padding: 72,
          fontFamily: "Bricolage",
          position: "relative",
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

        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <span style={{ fontSize: 56, fontWeight: 700, color: "#e85d2c" }}>
            Tarifle
          </span>
          <span style={{ fontSize: 28, color: "#6b6b6b", fontWeight: 500 }}>
            Make Eat
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div
            style={{
              display: "flex",
              fontSize: 96,
              fontWeight: 700,
              color: "#1a1a1a",
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            Bugün ne pişirsek?
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 28,
              color: "#6b6b6b",
              fontWeight: 500,
              maxWidth: 900,
              lineHeight: 1.35,
            }}
          >
            Yemek, içecek ve kokteyl tariflerini keşfet. Topluluk uyarlamalarıyla ilham
            al.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <Pill label="🍳 Yemek" />
          <Pill label="🍰 Tatlı" />
          <Pill label="🥤 İçecek" />
          <Pill label="🍹 Kokteyl" />
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

function Pill({ label }: { label: string }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        backgroundColor: "#f0ece4",
        color: "#1a1a1a",
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
