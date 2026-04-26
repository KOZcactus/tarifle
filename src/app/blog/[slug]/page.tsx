import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { getTranslations } from "next-intl/server";
import {
  BLOG_CATEGORIES,
  getAllBlogSlugs,
  getBlogPostBySlug,
} from "@/lib/blog";
import { mdxComponents } from "@/components/blog/mdxComponents";
import { SITE_URL } from "@/lib/constants";

// MDX remarkPlugins config: GFM table + strikethrough + autolink desteği.
// Tum bloglar bu config ile render olur, table syntax artik raw text yerine
// gercek HTML <table> uretir.
const mdxOptions = {
  mdxOptions: {
    remarkPlugins: [remarkGfm],
  },
};

interface BlogDetailPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const slugs = await getAllBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: BlogDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) return { title: "Bulunamadı" };

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      publishedTime: post.date,
      authors: post.author ? [post.author] : undefined,
      tags: post.tags,
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
    },
  };
}

export default async function BlogDetailPage({ params }: BlogDetailPageProps) {
  const { slug } = await params;
  const post = await getBlogPostBySlug(slug);
  if (!post) notFound();

  const [t, tCat] = await Promise.all([
    getTranslations("blog"),
    getTranslations("blog.categories"),
  ]);

  const category = BLOG_CATEGORIES.find((c) => c.slug === post.category);

  // Schema.org Article JSON-LD, Google Discover + rich results + Pinterest
  // Article rich pin. `image` alani explicit verildi (Pinterest scraper
  // bunu opengraph-image fallback'ten once goruyor).
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    image: [`${SITE_URL}/blog/${slug}/opengraph-image`],
    author: {
      "@type": "Organization",
      name: post.author ?? "Tarifle",
    },
    publisher: {
      "@type": "Organization",
      name: "Tarifle",
    },
    keywords: post.tags.join(", "),
  };

  // BreadcrumbList JSON-LD, Google SERP breadcrumb rich result + SEO.
  // HTML breadcrumb asagida zaten var, JSON-LD arama motorlari icin
  // structured data katmani (oturum 19 H paketi SEO gap fix).
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
      {
        "@type": "ListItem",
        position: 3,
        name: post.title,
        item: `${SITE_URL}/blog/${slug}`,
      },
    ],
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <nav aria-label="breadcrumb" className="mb-4 text-xs text-text-muted">
        <ol className="flex flex-wrap items-center gap-1">
          <li>
            <Link href="/" className="transition-colors hover:text-primary">
              {t("breadcrumbHome")}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li>
            <Link href="/blog" className="transition-colors hover:text-primary">
              {t("breadcrumbBlog")}
            </Link>
          </li>
          <li aria-hidden="true">›</li>
          <li className="font-medium text-text">{post.title}</li>
        </ol>
      </nav>

      <header className="mb-8 border-b border-border pb-6">
        {category && (
          <div className="mb-3">
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              {category.emoji} {tCat(category.slug)}
            </span>
          </div>
        )}
        <h1 className="font-heading text-3xl font-bold leading-tight sm:text-4xl">
          {post.title}
        </h1>
        <p className="mt-3 text-base leading-relaxed text-text-muted">
          {post.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-text-muted">
          {post.author && (
            <>
              <span>{post.author}</span>
              <span aria-hidden="true">·</span>
            </>
          )}
          <time dateTime={post.date} className="tabular-nums">
            {formatDate(post.date)}
          </time>
          <span aria-hidden="true">·</span>
          <span>
            {t("readingMinutes", { minutes: post.readingMinutes })}
          </span>
        </div>
      </header>

      <article className="prose-blog">
        <MDXRemote
          source={post.content}
          components={mdxComponents}
          options={mdxOptions}
        />
      </article>

      <footer className="mt-10 border-t border-border pt-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("tagsHeading")}
          </span>
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-bg-card px-2.5 py-0.5 text-xs text-text-muted"
            >
              #{tag}
            </span>
          ))}
        </div>
        <p className="mt-6 text-sm">
          <Link
            href="/blog"
            className="text-primary transition-colors hover:text-primary-hover"
          >
            ← {t("backToList")}
          </Link>
        </p>
      </footer>
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
