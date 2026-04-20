/**
 * Bing IndexNow / Google Search Console URL Submission listesi üretir.
 *
 * Öncelik sırası (yukarıdan aşağıya değer kaybı):
 *   1. Homepage + ana nav listing (10)
 *   2. Legal hub (6)
 *   3. Programatik landing, cuisine × 24 + diet × 5 + tag × 15 (44)
 *   4. Kategori sayfaları (17)
 *   5. Blog makaleler (3+)
 *   6. isFeatured=true tarifler (en yüksek konversiyon)
 *   7. viewCount desc popüler tarifler (doymuş ilgi sinyali)
 *   8. createdAt desc yeni tarifler (taze içerik)
 *
 * Default: 500 URL → `docs/search-submission-urls.txt`.
 *
 * Çalıştır:
 *   npx tsx scripts/gen-search-submission-urls.ts
 *   npx tsx scripts/gen-search-submission-urls.ts --limit 300
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { CUISINE_CODES, CUISINE_SLUG } from "../src/lib/cuisines";
import { DIETS } from "../src/lib/diets";

neonConfig.webSocketConstructor = ws;
const __d = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__d, "..", ".env.local") });

const BASE = "https://tarifle.app";
const DEFAULT_LIMIT = 500;

function parseLimit(): number {
  const idx = process.argv.indexOf("--limit");
  if (idx >= 0) {
    const val = parseInt(process.argv[idx + 1], 10);
    if (!isNaN(val) && val > 0) return val;
  }
  return DEFAULT_LIMIT;
}

async function main() {
  const limit = parseLimit();
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const urls: string[] = [];
  const seen = new Set<string>();
  const push = (path: string) => {
    const url = `${BASE}${path}`;
    if (!seen.has(url)) {
      seen.add(url);
      urls.push(url);
    }
  };

  // 1. Homepage + ana nav listing
  push("/");
  push("/tarifler");
  push("/kategoriler");
  push("/kesfet");
  push("/blog");
  push("/menu-planlayici");
  push("/ai-asistan");
  push("/akis");
  push("/hakkimizda");
  push("/iletisim");

  // 2. Legal hub
  push("/yasal");
  push("/yasal/kvkk");
  push("/yasal/gizlilik");
  push("/yasal/kullanim-kosullari");
  push("/yasal/cerez-politikasi");
  push("/yasal/guvenlik");
  push("/yasal/iletisim-aydinlatma");

  // 3. Programatik landing, cuisine × 24
  for (const code of CUISINE_CODES) {
    push(`/mutfak/${CUISINE_SLUG[code]}`);
  }

  // 4. Diet × 5
  for (const d of DIETS) {
    push(`/diyet/${d.slug}`);
  }

  // 5. Tag landing (15 popüler), DB'den recipeTag count desc
  const topTags = await prisma.tag.findMany({
    orderBy: { recipeTags: { _count: "desc" } },
    take: 15,
    select: { slug: true },
  });
  for (const t of topTags) {
    push(`/etiket/${t.slug}`);
  }

  // 6. Kategori landing (17)
  const categories = await prisma.category.findMany({
    orderBy: { sortOrder: "asc" },
    select: { slug: true },
  });
  for (const c of categories) {
    push(`/tarifler/${c.slug}`);
  }

  // 7. Blog makaleler, MDX filesystem (küçük, hard-code'u da sürdürülebilir)
  const blogSlugs = ["en-iyi-hamsi-tarifleri", "menemen-rehberi", "kis-corbalari"];
  for (const slug of blogSlugs) {
    push(`/blog/${slug}`);
  }

  const preRecipeCount = urls.length;
  console.log(`📍 Static + programatik: ${preRecipeCount} URL`);

  const remaining = Math.max(0, limit - preRecipeCount);
  if (remaining === 0) {
    console.log(`⚠️  Limit ${limit} dolu, tarif eklenmedi.`);
  } else {
    // 8. isFeatured=true (prioritize)
    const featured = await prisma.recipe.findMany({
      where: { status: "PUBLISHED", isFeatured: true },
      orderBy: { viewCount: "desc" },
      select: { slug: true },
      take: remaining,
    });
    for (const r of featured) push(`/tarif/${r.slug}`);

    // 9. Popular (viewCount desc), featured sonrası doldurmak için
    const afterFeatured = limit - urls.length;
    if (afterFeatured > 0) {
      const popular = await prisma.recipe.findMany({
        where: { status: "PUBLISHED", isFeatured: false },
        orderBy: { viewCount: "desc" },
        select: { slug: true },
        take: afterFeatured,
      });
      for (const r of popular) push(`/tarif/${r.slug}`);
    }

    // 10. Recent (createdAt desc), kalan alan varsa
    const afterPopular = limit - urls.length;
    if (afterPopular > 0) {
      const recent = await prisma.recipe.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        select: { slug: true },
        take: afterPopular * 2, // dedupe için buffer
      });
      for (const r of recent) {
        if (urls.length >= limit) break;
        push(`/tarif/${r.slug}`);
      }
    }
  }

  // Hard cap at limit
  const finalUrls = urls.slice(0, limit);

  const outPath = resolve(process.cwd(), "docs/search-submission-urls.txt");
  const header = [
    `# Tarifle, Search Engine Submission URL Listesi`,
    `# Üretim tarihi: ${new Date().toISOString()}`,
    `# Toplam: ${finalUrls.length} URL (target: ${limit})`,
    `#`,
    `# Öncelik: homepage → nav → legal → programatik landing → kategori →`,
    `# blog → isFeatured tarifler → popular (viewCount) → recent (createdAt)`,
    `#`,
    `# Kullanım:`,
    `#   Google Search Console: 10 URL/gün limit → günde bir satır blok`,
    `#   Bing Webmaster Tools:  100 URL/gün limit → bir bir submit`,
    `#`,
    `# İlk 80 URL = yapısal landing (statik değer). Sonra tarif URL'leri.`,
    ``,
  ].join("\n");

  writeFileSync(outPath, header + finalUrls.join("\n") + "\n", "utf8");

  // Kategori özeti
  const cats = {
    static: finalUrls.filter((u) =>
      /\/(yasal|hakkimizda|iletisim|kesfet|akis|blog|menu-planlayici|ai-asistan|kategoriler)|\/$/.test(
        u.replace(BASE, ""),
      ),
    ).length,
    landing: finalUrls.filter((u) =>
      /\/(mutfak|diyet|etiket|tarifler\/[^/]+)$/.test(u.replace(BASE, "")),
    ).length,
    recipes: finalUrls.filter((u) => u.includes("/tarif/")).length,
    blog: finalUrls.filter((u) => u.includes("/blog/")).length,
  };

  console.log(`\n✅ Yazıldı: ${outPath}`);
  console.log(`   Statik + hub: ~${cats.static}`);
  console.log(`   Landing (mutfak/diyet/etiket/kategori): ~${cats.landing}`);
  console.log(`   Blog makale: ${cats.blog}`);
  console.log(`   Tarif: ${cats.recipes}`);
  console.log(`   TOPLAM: ${finalUrls.length}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
