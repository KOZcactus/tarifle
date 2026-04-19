import fs from "node:fs/promises";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";

/**
 * File-based blog content layer — `content/blog/*.mdx` okur,
 * frontmatter + body ayıklar, metadata döner. MDX render `next-mdx-remote`
 * üzerinden detail page içinde yapılır.
 *
 * Neden DB yerine file? Blog içeriği editorial; versiyon kontrol + PR
 * review + Git history tarif katmanından daha değerli. Yayın hızı
 * düşük (haftada 1-2 yazı), DB overhead'i gereksiz.
 *
 * Nasıl genişletilir (v2): frontmatter'a `status: draft|published`
 * alanı + `filter((p) => p.status === "published")`. MDX içinde Recipe
 * reference ("Bu yazıda bahsi geçen tarif: slug") için custom component.
 */

export interface BlogFrontmatter {
  title: string;
  description: string;
  date: string; // ISO date
  author?: string;
  tags: string[];
  category?: string; // "mutfak-rehberi" | "pisirme-teknikleri" | "malzeme-tanima"
  coverEmoji?: string;
  cover?: string; // public/ altında görsel yolu
}

export interface BlogPostMeta extends BlogFrontmatter {
  slug: string;
  readingMinutes: number;
  excerpt: string;
}

export interface BlogPost extends BlogPostMeta {
  /** Raw MDX source — `<MDXRemote source>` ile render edilir. */
  content: string;
}

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

async function readFileSafe(filePath: string): Promise<string | null> {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return null;
  }
}

function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx$/i, "");
}

function validateFrontmatter(
  slug: string,
  raw: Record<string, unknown>,
): BlogFrontmatter {
  const required = ["title", "description", "date"];
  for (const key of required) {
    if (typeof raw[key] !== "string" || (raw[key] as string).length === 0) {
      throw new Error(
        `Blog frontmatter "${key}" missing or not a string in ${slug}`,
      );
    }
  }
  const tags = Array.isArray(raw.tags)
    ? (raw.tags as unknown[]).filter((t): t is string => typeof t === "string")
    : [];
  return {
    title: raw.title as string,
    description: raw.description as string,
    date: raw.date as string,
    author: typeof raw.author === "string" ? raw.author : undefined,
    tags,
    category: typeof raw.category === "string" ? raw.category : undefined,
    coverEmoji: typeof raw.coverEmoji === "string" ? raw.coverEmoji : undefined,
    cover: typeof raw.cover === "string" ? raw.cover : undefined,
  };
}

/** İlk 160 karakterlik özet — frontmatter.description varsa onu, yoksa
 *  body'nin ilk paragrafını kullan. */
function buildExcerpt(frontmatterDesc: string, body: string): string {
  if (frontmatterDesc.length > 0) return frontmatterDesc;
  const firstParagraph = body.trim().split(/\n\s*\n/)[0] ?? "";
  const plain = firstParagraph.replace(/[#*`_>]/g, "").trim();
  return plain.length > 160 ? plain.slice(0, 157) + "…" : plain;
}

export async function getAllBlogSlugs(): Promise<string[]> {
  try {
    const files = await fs.readdir(BLOG_DIR);
    return files.filter((f) => f.endsWith(".mdx")).map(slugFromFilename);
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const filePath = path.join(BLOG_DIR, `${slug}.mdx`);
  const source = await readFileSafe(filePath);
  if (!source) return null;

  const { data, content } = matter(source);
  const frontmatter = validateFrontmatter(slug, data);
  const stats = readingTime(content);

  return {
    ...frontmatter,
    slug,
    readingMinutes: Math.max(1, Math.round(stats.minutes)),
    excerpt: buildExcerpt(frontmatter.description, content),
    content,
  };
}

export async function getAllBlogPosts(): Promise<BlogPostMeta[]> {
  const slugs = await getAllBlogSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      const post = await getBlogPostBySlug(slug);
      if (!post) return null;
      const { content: _content, ...meta } = post;
      return meta;
    }),
  );
  return posts
    .filter((p): p is BlogPostMeta => p !== null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

/** Kategori seti — sabit, yeni category frontmatter'ında kullanılırsa
 *  buraya eklenir. Listing page chip'leri bundan render edilir. */
export const BLOG_CATEGORIES = [
  { slug: "mutfak-rehberi", emoji: "🧭" },
  { slug: "pisirme-teknikleri", emoji: "🔥" },
  { slug: "malzeme-tanima", emoji: "🌿" },
] as const;

export type BlogCategorySlug = (typeof BLOG_CATEGORIES)[number]["slug"];
