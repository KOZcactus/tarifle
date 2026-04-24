import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BLOG_CATEGORIES, getAllBlogPosts } from "@/lib/blog";
import {
  BlogListingClient,
  type BlogPostListItem,
  type BlogCategoryMeta,
} from "@/components/blog/BlogListingClient";
import { SITE_URL } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.blog");
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/blog" },
  };
}

/**
 * Blog listing page. File-based content (content/blog/*.mdx), tarihe
 * göre desc sort. Client component sidebar (arama + kategori + ay
 * arşivi) + sağ tarafta filtrelenmiş liste.
 */
export default async function BlogListingPage() {
  const [posts, t] = await Promise.all([
    getAllBlogPosts(),
    getTranslations("blog"),
  ]);

  const serializable: BlogPostListItem[] = posts.map((p) => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    tags: p.tags ?? [],
    category: p.category,
    coverEmoji: p.coverEmoji,
    readingMinutes: p.readingMinutes,
  }));

  const categories: BlogCategoryMeta[] = BLOG_CATEGORIES.map((c) => ({
    slug: c.slug,
    emoji: c.emoji,
  }));

  // BreadcrumbList JSON-LD (oturum 19 H paketi): Google SERP rich result
  // Home > Blog 2-item breadcrumb yapisi.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: t("breadcrumbHome"),
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t("breadcrumbBlog"),
        item: `${SITE_URL}/blog`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <BlogListingClient posts={serializable} categories={categories} />
    </>
  );
}
