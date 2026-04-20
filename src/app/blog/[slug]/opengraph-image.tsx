import { ImageResponse } from "next/og";
import { getTranslations } from "next-intl/server";
import { BLOG_CATEGORIES, getBlogPostBySlug } from "@/lib/blog";
import { loadGoogleFont } from "@/lib/og";

export const contentType = "image/png";
export const size = { width: 1200, height: 630 };
export const alt = "Tarifle, blog";

/**
 * Blog post OG image. Single landscape variant (blog yazıları dil-sabit
 * Türkçe kuruldu; tarif detayındaki gibi TR/EN ikili versiyon gerekmiyor).
 * Layout: kategori eyebrow + cover emoji + başlık + Tarifle wordmark.
 * Pinterest sayfayı tarardığı zaman Article JSON-LD + bu OG image rich pin
 * için yeterli sinyal veriyor.
 */
interface Props {
  params: Promise<{ slug: string }>;
}

export default async function Image({ params }: Props) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);

  // Blog icerigi dil-sabit TR; OG eyebrow da TR label kullanir.
  const tCat = await getTranslations({ locale: "tr", namespace: "blog.categories" });
  const title = post?.title ?? "Tarifle Blog";
  const emoji = post?.coverEmoji ?? "📖";
  const categoryMeta = post
    ? BLOG_CATEGORIES.find((c) => c.slug === post.category)
    : null;
  const eyebrow =
    categoryMeta && tCat.has(categoryMeta.slug)
      ? `${categoryMeta.emoji} ${tCat(categoryMeta.slug)}`
      : "Blog";
  const readingLabel = post ? `${post.readingMinutes} dk okuma` : "";

  const titleText = `${title} ${eyebrow} ${readingLabel} Tarifle tarifle.app`;
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
              width: 220,
              height: 220,
              backgroundColor: "#f0ece4",
              borderRadius: 32,
              fontSize: 130,
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
              gap: 20,
            }}
          >
            <div
              style={{
                fontSize: 68,
                fontWeight: 700,
                color: "#1a1a1a",
                lineHeight: 1.08,
                letterSpacing: -1,
                display: "flex",
              }}
            >
              {title}
            </div>
            {readingLabel && (
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 500,
                  color: "#6b6b6b",
                  display: "flex",
                }}
              >
                {readingLabel}
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
              Blog
            </span>
          </div>
          <span style={{ fontSize: 22, color: "#6b6b6b", fontWeight: 500 }}>
            tarifle.app/blog
          </span>
        </div>
      </div>
    ),
    {
      ...size,
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
    },
  );
}
