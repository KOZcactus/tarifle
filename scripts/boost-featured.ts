/**
 * Boost isFeatured coverage %9.4 → ~%12.0 (target +65 new featured).
 *
 * Strateji:
 *   - Underrepresented category/cuisine'lere öncelik (her bucket'ın
 *     featured rate'ini ~%12'ye çıkarma hedefi)
 *   - "İkonik sinyal": Mod B tam çevirili (yüksek kalite), kısa klasik
 *     isim (1-3 kelime, TR cuisine), view count > 0
 *   - Per-cuisine/category cap: kova taşması önlenir
 *
 *   npx tsx scripts/boost-featured.ts            # dry run + preview
 *   npx tsx scripts/boost-featured.ts --apply    # dev write
 *   DATABASE_URL=<prod> npx tsx scripts/boost-featured.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

/** Target overall featured rate. */
const TARGET_RATE = 0.12;

/** Hard cap per cuisine (no single cuisine dominates editor's pick). */
const CUISINE_CAP = { tr: 40, default: 6 };

/** Minimum quality signal: Mod B must have ingredients OR steps filled. */
function isHighQuality(translations: unknown): boolean {
  if (!translations || typeof translations !== "object") return false;
  const t = translations as Record<string, unknown>;
  const en = (t.en as Record<string, unknown>) || {};
  const de = (t.de as Record<string, unknown>) || {};
  const enHasIng = Array.isArray(en.ingredients) && (en.ingredients as unknown[]).length > 0;
  const enHasSteps = Array.isArray(en.steps) && (en.steps as unknown[]).length > 0;
  const deHasIng = Array.isArray(de.ingredients) && (de.ingredients as unknown[]).length > 0;
  const deHasSteps = Array.isArray(de.steps) && (de.steps as unknown[]).length > 0;
  return enHasIng && enHasSteps && deHasIng && deHasSteps;
}

function isIconic(title: string, cuisine: string): boolean {
  // Kısa isim = tek-iki-üç kelime, bölgesel sıfat hariç
  const words = title
    .replace(/[,;:.]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 0);
  if (words.length <= 3 && cuisine === "tr") return true;
  if (words.length <= 2) return true; // international one-word classics
  return false;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("boost-featured");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const all = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        title: true,
        isFeatured: true,
        cuisine: true,
        viewCount: true,
        translations: true,
        category: { select: { slug: true } },
      },
    });

    const total = all.length;
    const currentFeatured = all.filter((r) => r.isFeatured).length;
    const target = Math.round(total * TARGET_RATE);
    const toAdd = Math.max(0, target - currentFeatured);

    console.log(`  total: ${total}, featured: ${currentFeatured} (%${((currentFeatured / total) * 100).toFixed(1)}), target: ${target} (%${(TARGET_RATE * 100).toFixed(0)}), to add: ${toAdd}`);

    // Build bucket state
    const bucketCounts = new Map<string, { f: number; t: number }>();
    const catCounts = new Map<string, { f: number; t: number }>();
    for (const r of all) {
      const cK = `cuisine:${r.cuisine}`;
      const catK = `cat:${r.category?.slug}`;
      const cc = bucketCounts.get(cK) ?? { f: 0, t: 0 };
      cc.t++;
      if (r.isFeatured) cc.f++;
      bucketCounts.set(cK, cc);
      const catC = catCounts.get(catK) ?? { f: 0, t: 0 };
      catC.t++;
      if (r.isFeatured) catC.f++;
      catCounts.set(catK, catC);
    }

    // Compute score per non-featured candidate
    const candidates = all
      .filter((r) => !r.isFeatured)
      .map((r) => {
        const cuisineStats = bucketCounts.get(`cuisine:${r.cuisine}`) ?? { f: 0, t: 1 };
        const catStats = catCounts.get(`cat:${r.category?.slug}`) ?? { f: 0, t: 1 };
        const cuisineRate = cuisineStats.f / cuisineStats.t;
        const catRate = catStats.f / catStats.t;

        let score = 0;
        // Underrepresented cuisine (< target rate)
        if (cuisineRate < TARGET_RATE) score += 2;
        if (cuisineRate < 0.06) score += 1; // severely under
        // Underrepresented category
        if (catRate < TARGET_RATE) score += 2;
        if (catRate < 0.05) score += 2; // severely under (icecekler, salatalar, smoothie)
        // Quality signal (Mod B full)
        if (isHighQuality(r.translations)) score += 3;
        // Iconic name (short title)
        if (isIconic(r.title, r.cuisine ?? "")) score += 1;
        // View count (minor, since data is sparse)
        if ((r.viewCount ?? 0) > 0) score += 1;
        return { r, score };
      })
      .sort((a, b) => b.score - a.score);

    // Greedy pick with caps
    const picks: typeof candidates = [];
    const pickedByCuisine = new Map<string, number>();
    const pickedByCat = new Map<string, number>();

    for (const c of candidates) {
      if (picks.length >= toAdd) break;
      const cuisine = c.r.cuisine ?? "?";
      const catSlug = c.r.category?.slug ?? "?";
      const cap = cuisine === "tr" ? CUISINE_CAP.tr : CUISINE_CAP.default;
      const cuisineUsed = pickedByCuisine.get(cuisine) ?? 0;
      if (cuisineUsed >= cap) continue;
      // Category cap: max 8 new per cat (no cat floods)
      const catUsed = pickedByCat.get(catSlug) ?? 0;
      if (catUsed >= 10) continue;
      picks.push(c);
      pickedByCuisine.set(cuisine, cuisineUsed + 1);
      pickedByCat.set(catSlug, catUsed + 1);
    }

    // Report
    let out = `  picked ${picks.length} / ${toAdd} target\n\n`;
    out += `  picks by cuisine:\n`;
    const byC = [...pickedByCuisine.entries()].sort((a, b) => b[1] - a[1]);
    for (const [c, n] of byC) out += `    ${c.padEnd(4)}  +${n}\n`;
    out += `\n  picks by category:\n`;
    const byCat = [...pickedByCat.entries()].sort((a, b) => b[1] - a[1]);
    for (const [c, n] of byCat) out += `    ${c.padEnd(28)}  +${n}\n`;

    out += `\n  score distribution:\n`;
    const scoreHist = new Map<number, number>();
    for (const p of picks) scoreHist.set(p.score, (scoreHist.get(p.score) ?? 0) + 1);
    const sortedScore = [...scoreHist.entries()].sort((a, b) => b[0] - a[0]);
    for (const [s, n] of sortedScore) out += `    score=${s}  ${n}x\n`;

    out += `\n  samples (top 20):\n`;
    for (const p of picks.slice(0, 20)) {
      out += `    [${p.score}] ${p.r.slug.padEnd(50)}  ${p.r.cuisine}/${p.r.category?.slug}\n`;
    }

    out += `\n  samples (bottom 10 of picks):\n`;
    for (const p of picks.slice(-10)) {
      out += `    [${p.score}] ${p.r.slug.padEnd(50)}  ${p.r.cuisine}/${p.r.category?.slug}\n`;
    }

    fs.writeFileSync("tmp-featured-boost.txt", out, "utf-8");
    console.log(out);

    if (apply) {
      let done = 0;
      for (const p of picks) {
        await prisma.recipe.update({
          where: { id: p.r.id },
          data: { isFeatured: true },
        });
        done++;
      }
      console.log(`\napplied: ${done} newly featured`);

      // Save pick list (for source patch script)
      const pickSlugs = picks.map((p) => p.r.slug);
      fs.writeFileSync(
        "tmp-featured-boost-slugs.json",
        JSON.stringify(pickSlugs, null, 2),
        "utf-8",
      );
      console.log(`saved pick list: tmp-featured-boost-slugs.json`);
    } else {
      console.log(`\nre-run with --apply to write.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
