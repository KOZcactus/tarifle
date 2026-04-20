import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BLOG_CATEGORIES, getAllBlogPosts } from "@/lib/blog";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.blog");
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/blog" },
  };
}

/**
 * Blog listing page. File-based content (content/blog/*.mdx), tarihe göre
 * desc sort. Kategori chip'leri + kartlar + reading time.
 *
 * Şu an sayfalama yok, içerik ölçeği (30-50 yazı) küçük. 100+'a çıkarsa
 * ?page=N paginasyonu eklenir.
 */
export default async function BlogListingPage() {
  const [posts, t, tCat] = await Promise.all([
    getAllBlogPosts(),
    getTranslations("blog"),
    getTranslations("blog.categories"),
  ]);

  // Kategori başına kaç yazı var (chip count badge için).
  const countByCategory = new Map<string, number>();
  for (const p of posts) {
    if (p.category) {
      countByCategory.set(
        p.category,
        (countByCategory.get(p.category) ?? 0) + 1,
      );
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <header className="mb-10">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">
          {t("pageTitle")}
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted">
          {t("subtitle")}
        </p>
      </header>

      {/* Kategori chip'leri, mevcut kategori konfig'inden, yazı sayısı
          badge'i ile. Şu an link yok (filtreleme v2); sadece info. */}
      <div className="mb-8 flex flex-wrap gap-2">
        {BLOG_CATEGORIES.map((c) => {
          const count = countByCategory.get(c.slug) ?? 0;
          return (
            <span
              key={c.slug}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-card px-3 py-1 text-xs text-text-muted"
            >
              <span aria-hidden="true">{c.emoji}</span>
              {tCat(c.slug)}
              <span className="tabular-nums text-text-muted/60">{count}</span>
            </span>
          );
        })}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <h2 className="font-heading text-xl font-semibold">
            {t("emptyTitle")}
          </h2>
          <p className="mt-2 text-sm text-text-muted">{t("emptyBody")}</p>
        </div>
      ) : (
        <ul className="space-y-6">
          {posts.map((post) => {
            const category = BLOG_CATEGORIES.find(
              (c) => c.slug === post.category,
            );
            return (
              <li key={post.slug}>
                <Link
                  href={`/blog/${post.slug}`}
                  className="group block rounded-xl border border-border bg-bg-card p-5 transition-colors hover:border-primary hover:bg-bg-elevated sm:p-6"
                >
                  <div className="flex items-start gap-4">
                    <span
                      aria-hidden="true"
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-2xl"
                    >
                      {post.coverEmoji ?? "📝"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex flex-wrap items-center gap-2 text-xs text-text-muted">
                        {category && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 font-medium text-primary">
                            {category.emoji} {tCat(category.slug)}
                          </span>
                        )}
                        <time
                          dateTime={post.date}
                          className="tabular-nums"
                        >
                          {formatDate(post.date)}
                        </time>
                        <span aria-hidden="true">·</span>
                        <span>
                          {t("readingMinutes", { minutes: post.readingMinutes })}
                        </span>
                      </div>
                      <h2 className="font-heading text-lg font-semibold text-text transition-colors group-hover:text-primary sm:text-xl">
                        {post.title}
                      </h2>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-text-muted">
                        {post.description}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatDate(isoDate: string): string {
  const d = new Date(isoDate);
  return new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(d);
}
