/**
 * One-off: GSC + Bing URL Submission için en "alakalı" 100 URL listesi
 * üretir. Static sayfalar + tüm kategoriler + viewCount'a göre top tarifler
 * (tarif sayfaları için).
 *
 * Kullanım: npx tsx scripts/generate-top-urls.ts
 *
 * Çıktı: 100 satır URL (kopyala-yapıştır için).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const SITE = "https://tarifle.app";

async function main() {
  const staticPages = [
    `${SITE}/`,
    `${SITE}/tarifler`,
    `${SITE}/ai-asistan`,
    `${SITE}/kesfet`,
  ];

  const categories = await prisma.category.findMany({
    select: { slug: true },
    orderBy: { sortOrder: "asc" },
  });
  const categoryUrls = categories.map((c) => `${SITE}/tarifler/${c.slug}`);

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: { slug: true, viewCount: true, isFeatured: true, createdAt: true },
    // isFeatured önce, sonra viewCount, sonra en yeniler — en alakalı ilk.
    orderBy: [
      { isFeatured: "desc" },
      { viewCount: "desc" },
      { createdAt: "desc" },
    ],
  });

  // 100'e tamamla: 4 static + 17 category = 21 → 79 tarif gerek.
  const need = 100 - staticPages.length - categoryUrls.length;
  const recipeUrls = recipes
    .slice(0, need)
    .map((r) => `${SITE}/tarif/${r.slug}`);

  const all = [...staticPages, ...categoryUrls, ...recipeUrls];

  console.log(all.join("\n"));
  console.error(
    `\n(${all.length} URL: ${staticPages.length} statik + ${categoryUrls.length} kategori + ${recipeUrls.length} tarif)`,
  );
}

main().finally(() => prisma.$disconnect());
