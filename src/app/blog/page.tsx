import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BLOG_CATEGORIES, getAllBlogPosts } from "@/lib/blog";
import {
  BlogListingClient,
  type BlogPostListItem,
  type BlogCategoryMeta,
} from "@/components/blog/BlogListingClient";

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
  const posts = await getAllBlogPosts();

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

  return <BlogListingClient posts={serializable} categories={categories} />;
}
