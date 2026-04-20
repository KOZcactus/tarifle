/**
 * Fix isFeatured ratio (6.4% → ~10%) + 3 tagless recipes.
 *
 * Adds ~26 featured recipes spread across underrepresented categories.
 * Also tags 3 tagless recipes (quindim, canjica, khanom-krok).
 *
 * Run:
 *   npx tsx scripts/fix-featured-and-tags.ts --dry-run
 *   npx tsx scripts/fix-featured-and-tags.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Featured selections ────────────────────────────────────
// Hand-picked iconic/representative recipes per category to feature.
// Selection criteria: recognizable, diverse cuisine, good quality.
const NEW_FEATURED_SLUGS: string[] = [
  // Aperatifler (need 4): 1→5
  "bruschetta", "sigara-boregi", "arancini", "empanada",
  // Atıştırmalıklar (need 3): 0→3
  "tostones", "elote", "baharatli-patlamis-misir",
  // Hamur İşleri (need 5): 2→7
  "su-boregi", "lahmacun", "acma", "banh-xeo", "msemen",
  // Kahvaltılıklar (need 3): 1→4
  "menemen", "cilbir", "chilaquiles",
  // Kahve & Sıcak İçecekler (need 3): 0→3
  "turk-kahvesi", "chai-latte", "vietnam-buzlu-kahvesi",
  // Kokteyller (need 3): 1→4
  "mojito", "margarita", "aperol-spritz",
  // Salatalar (need 4): 0→4
  "coban-salatasi", "sezar-salata", "akdeniz-salatasi", "roka-salatasi",
  // Sebze Yemekleri (need 2): 3→5
  "imam-bayildi", "karniyarik",
  // Smoothie & Shake (need 2): 0→2
  "mango-smoothie", "acai-bowl",
  // Soslar & Dippler (need 2): 0→2
  "humus", "cacik-dip",
  // Tatlılar (need 2): 6→8
  "baklava", "kunefe",
  // Çorbalar (need 1): 6→7
  "mercimek-corbasi",
  // İçecekler (need 3): 0→3
  "ayran", "limonata", "filtre-kahve",
];

// Remove duplicates (turk-kahvesi, acai-bowl appear in multiple lists)
const uniqueSlugs = [...new Set(NEW_FEATURED_SLUGS)];

// ─── Tag fixes ──────────────────────────────────────────────
const TAG_FIXES: Record<string, string[]> = {
  "quindim": ["vejetaryen"],
  "canjica": ["vejetaryen"],
  "khanom-krok": ["vejetaryen", "pratik"],
};

async function main(): Promise<void> {
  assertDbTarget("fix-featured-and-tags");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) { console.error("❌ DATABASE_URL yok"); process.exit(1); }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  });

  try {
    const host = new URL(databaseUrl).host;
    console.log(
      `\n🔧 fix-featured-and-tags ${DRY_RUN ? "(dry-run)" : "(apply)"} → ${host}\n`,
    );

    // ── Part 1: Featured ──
    console.log("═══ FEATURED ═══\n");
    let featuredCount = 0;
    let alreadyFeatured = 0;
    let notFound = 0;

    for (const slug of uniqueSlugs) {
      const r = await prisma.recipe.findUnique({
        where: { slug },
        select: { id: true, title: true, isFeatured: true, category: { select: { name: true } } },
      });
      if (!r) {
        console.log(`  ⚠ ${slug.padEnd(25)}, bulunamadı`);
        notFound++;
        continue;
      }
      if (r.isFeatured) {
        alreadyFeatured++;
        continue;
      }
      console.log(`  ✅ ${slug.padEnd(25)} → featured (${r.category.name})`);
      if (!DRY_RUN) {
        await prisma.recipe.update({ where: { id: r.id }, data: { isFeatured: true } });
      }
      featuredCount++;
    }

    console.log(`\n${DRY_RUN ? "Would feature" : "Featured"}: ${featuredCount} | Already: ${alreadyFeatured} | Not found: ${notFound}\n`);

    // ── Part 2: Tags ──
    console.log("═══ TAGS ═══\n");
    const tagMap = new Map<string, string>();
    const allTags = await prisma.tag.findMany();
    for (const t of allTags) tagMap.set(t.slug, t.id);

    let taggedCount = 0;
    for (const [slug, tagSlugs] of Object.entries(TAG_FIXES)) {
      const r = await prisma.recipe.findUnique({
        where: { slug },
        select: { id: true, title: true, tags: { select: { tag: { select: { slug: true } } } } },
      });
      if (!r) {
        console.log(`  ⚠ ${slug}, bulunamadı`);
        continue;
      }
      const existingTags = r.tags.map(t => t.tag.slug);
      const newTags = tagSlugs.filter(ts => !existingTags.includes(ts));
      if (newTags.length === 0) {
        console.log(`  ${slug.padEnd(25)}, zaten tag'li`);
        continue;
      }
      console.log(`  ✅ ${slug.padEnd(25)} → +${newTags.join(", ")}`);
      if (!DRY_RUN) {
        for (const ts of newTags) {
          const tagId = tagMap.get(ts);
          if (!tagId) { console.log(`    ⚠ tag "${ts}" bulunamadı`); continue; }
          await prisma.recipeTag.create({
            data: { recipeId: r.id, tagId },
          });
        }
      }
      taggedCount++;
    }

    console.log(`\n${DRY_RUN ? "Would tag" : "Tagged"}: ${taggedCount}\n`);

    // Final counts
    if (!DRY_RUN) {
      const total = await prisma.recipe.count({ where: { status: "PUBLISHED" } });
      const feat = await prisma.recipe.count({ where: { status: "PUBLISHED", isFeatured: true } });
      console.log(`Final: ${feat}/${total} featured (${(feat/total*100).toFixed(1)}%)`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => { console.error("❌", err); process.exit(1); });
