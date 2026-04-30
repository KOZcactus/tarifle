/**
 * Codex Mod R için tarif image queue üretici (oturum 33 yeni).
 *
 * Codex Mod R'a "Batch N" tetiklediğimizde, önce bu script imageUrl null
 * olan tariflerden N×size kadarını alıp queue JSON'a yazar. Codex bu
 * JSON'u okur, her tarif için image üretip public/recipe-images/generated/
 * altına kaydeder. Batch sonrası apply-recipe-images.ts ile DB update.
 *
 * Filtreleme + sıralama (default):
 * 1. imageUrl IS NULL (zaten görseli olanı atla)
 * 2. ORDER BY isFeatured DESC, viewCount DESC, createdAt ASC
 *
 * Pilot Batch 0 (5 tarif): farklı kategoriden 1'er tarif (et + corba +
 * tatli + kahvalti + kokteyl). --pilot flag ile.
 *
 * Usage:
 *   npx tsx scripts/dump-recipe-image-queue.ts --batch 0 --pilot
 *   npx tsx scripts/dump-recipe-image-queue.ts --batch N --size 20
 *   npx tsx scripts/dump-recipe-image-queue.ts --batch N --size 20 --filter featured
 *   npx tsx scripts/dump-recipe-image-queue.ts --batch N --size 20 --filter category:et-yemekleri
 *   npx tsx scripts/dump-recipe-image-queue.ts --batch N --size 20 --filter cuisine:tr
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
neonConfig.webSocketConstructor = ws;
// Default: PROD DB (apply prod'a gidiyor, dump dev'den olunca drift bug
// queue Batch 3 slug'larını yine seçer, Codex tekrar üretir, idempotent
// skip + boşa effort). Oturum 34 root cause fix.
// Override için --dev flag (dev DB'si üzerinden test).
const useDev = process.argv.includes("--dev");
const envFile = useDev ? ".env.local" : ".env.production.local";
dotenv.config({ path: path.resolve(envFile), override: true });

interface QueueEntry {
  slug: string;
  title: string;
  type: string;
  cuisine: string | null;
  categorySlug: string;
  ingredients: string[];
  servingSuggestion: string | null;
  tipNote: string | null;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const batchIdx = args.indexOf("--batch");
  const sizeIdx = args.indexOf("--size");
  const filterIdx = args.indexOf("--filter");
  const pilot = args.includes("--pilot");
  return {
    batch: batchIdx >= 0 ? parseInt(args[batchIdx + 1] ?? "0", 10) : 0,
    size: sizeIdx >= 0 ? parseInt(args[sizeIdx + 1] ?? "20", 10) : 20,
    filter: filterIdx >= 0 ? args[filterIdx + 1] : null,
    pilot,
  };
}

async function main() {
  const { batch, size, filter, pilot } = parseArgs();
  const url = process.env.DATABASE_URL!;
  console.log("DB:", new URL(url).host);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });

  let entries: QueueEntry[] = [];

  if (pilot) {
    // Pilot Batch 0: 5 farklı kategoriden 1'er featured tarif
    const cats = ["et-yemekleri", "corbalar", "tatlilar", "kahvaltiliklar", "kokteyller"];
    for (const catSlug of cats) {
      const r = await prisma.recipe.findFirst({
        where: {
          imageUrl: null,
          category: { slug: catSlug },
          isFeatured: true,
        },
        orderBy: [{ viewCount: "desc" }, { createdAt: "asc" }],
        select: {
          slug: true, title: true, type: true, cuisine: true,
          category: { select: { slug: true } },
          ingredients: { select: { name: true }, orderBy: { sortOrder: "asc" } },
          servingSuggestion: true, tipNote: true,
        },
      });
      if (r) {
        entries.push({
          slug: r.slug, title: r.title, type: r.type,
          cuisine: r.cuisine, categorySlug: r.category.slug,
          ingredients: r.ingredients.map((i) => i.name),
          servingSuggestion: r.servingSuggestion, tipNote: r.tipNote,
        });
      } else {
        // Featured yoksa featured filtrini gevşet
        const fallback = await prisma.recipe.findFirst({
          where: { imageUrl: null, category: { slug: catSlug } },
          orderBy: [{ viewCount: "desc" }, { createdAt: "asc" }],
          select: {
            slug: true, title: true, type: true, cuisine: true,
            category: { select: { slug: true } },
            ingredients: { select: { name: true }, orderBy: { sortOrder: "asc" } },
            servingSuggestion: true, tipNote: true,
          },
        });
        if (fallback) {
          entries.push({
            slug: fallback.slug, title: fallback.title, type: fallback.type,
            cuisine: fallback.cuisine, categorySlug: fallback.category.slug,
            ingredients: fallback.ingredients.map((i) => i.name),
            servingSuggestion: fallback.servingSuggestion, tipNote: fallback.tipNote,
          });
        }
      }
    }
  } else {
    // Standart batch
    const where: Record<string, unknown> = { imageUrl: null };
    if (filter) {
      if (filter === "featured") where["isFeatured"] = true;
      else if (filter.startsWith("category:")) where["category"] = { slug: filter.split(":")[1] };
      else if (filter.startsWith("cuisine:")) where["cuisine"] = filter.split(":")[1];
      else if (filter.startsWith("type:")) where["type"] = filter.split(":")[1];
    }
    const recipes = await prisma.recipe.findMany({
      where,
      orderBy: [{ isFeatured: "desc" }, { viewCount: "desc" }, { createdAt: "asc" }],
      take: size,
      select: {
        slug: true, title: true, type: true, cuisine: true,
        category: { select: { slug: true } },
        ingredients: { select: { name: true }, orderBy: { sortOrder: "asc" } },
        servingSuggestion: true, tipNote: true,
      },
    });
    entries = recipes.map((r) => ({
      slug: r.slug, title: r.title, type: r.type,
      cuisine: r.cuisine, categorySlug: r.category.slug,
      ingredients: r.ingredients.map((i) => i.name),
      servingSuggestion: r.servingSuggestion, tipNote: r.tipNote,
    }));
  }

  // Klasör hazır mı?
  const outDir = path.resolve("docs/recipe-image-prompts");
  fs.mkdirSync(outDir, { recursive: true });
  const outFile = path.resolve(outDir, `queue-batch-${batch}.json`);
  fs.writeFileSync(outFile, JSON.stringify(entries, null, 2), "utf-8");

  console.log(`\n✅ Queue yazıldı: ${outFile}`);
  console.log(`   ${entries.length} tarif, batch ${batch}${pilot ? " (pilot)" : ""}${filter ? `, filter '${filter}'` : ""}`);
  for (const e of entries) {
    console.log(`   - ${e.slug} (${e.type}/${e.cuisine ?? "?"})`);
  }
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
