/**
 * One-shot helper: synchronize the batch-12 allergen DB fixes back into
 * scripts/seed-recipes.ts so source-of-truth and DB don't drift.
 *
 * Mirrors the FIXES array from fix-critical-allergens-batch12.ts. For each
 * slug, locates the recipe literal in seed-recipes.ts, unions the missing
 * allergen(s) into the existing `allergens: [...] as const` array in
 * canonical ORDER, and rewrites the file.
 *
 *   npx tsx scripts/sync-allergens-batch12-to-seed.ts
 *
 * Idempotent, running twice is a no-op.
 */
import * as fs from "node:fs";
import * as path from "node:path";

type Allergen =
  | "GLUTEN" | "SUT" | "YUMURTA" | "KUSUYEMIS" | "YER_FISTIGI"
  | "SOYA" | "DENIZ_URUNLERI" | "SUSAM" | "KEREVIZ" | "HARDAL";

const FIXES: readonly { slug: string; add: Allergen[] }[] = [
  { slug: "eriste-corbasi-kastamonu-usulu", add: ["SUT"] },
  { slug: "yumurtali-ispanak-kavurmasi-karadeniz-usulu", add: ["SUT"] },
  { slug: "biberli-ekmek-hatay-usulu", add: ["SUSAM"] },
  { slug: "acik-agiz-boregi-kayseri-usulu", add: ["SUT"] },
  { slug: "tandir-boregi-kars-usulu", add: ["YUMURTA"] },
  { slug: "harire-tatlisi-mardin-usulu", add: ["GLUTEN"] },
  { slug: "irmik-helvasi-maras-dondurmali", add: ["GLUTEN"] },
  { slug: "kabak-bastisi-gaziantep-usulu", add: ["GLUTEN"] },
  { slug: "girit-ezmesi-izmir-usulu", add: ["KUSUYEMIS"] },
  { slug: "karalahana-corbasi-ordu-usulu", add: ["SUT"] },
  { slug: "yuksuk-corbasi-adana-usulu", add: ["SUT"] },
  { slug: "hamsili-pilav-artvin-usulu", add: ["SUT"] },
  { slug: "sembusek-mardin-usulu", add: ["SUT"] },
  { slug: "hosmerim-balikesir-usulu", add: ["GLUTEN"] },
  { slug: "nevzine-kayseri-usulu", add: ["SUT"] },
  { slug: "paluze-kilis-usulu", add: ["GLUTEN"] },
];

const ORDER: readonly Allergen[] = [
  "GLUTEN", "SUT", "YUMURTA", "KUSUYEMIS", "YER_FISTIGI",
  "SOYA", "DENIZ_URUNLERI", "SUSAM", "KEREVIZ", "HARDAL",
];

function main(): void {
  const seedPath = path.resolve(process.cwd(), "scripts/seed-recipes.ts");
  let text = fs.readFileSync(seedPath, "utf8");
  let updated = 0;
  let alreadyClean = 0;
  const missing: string[] = [];

  for (const fix of FIXES) {
    // Locate recipe literal by slug. Each recipe is on a single long line in
    // batch 12, so match from slug up to the next `allergens: [...] as const`.
    const slugPattern = `slug: "${fix.slug}"`;
    const slugIdx = text.indexOf(slugPattern);
    if (slugIdx === -1) {
      missing.push(fix.slug);
      continue;
    }
    // Search forward for the allergens array that belongs to this recipe.
    // Use a bounded window (next 4000 chars) to avoid catching the wrong one.
    const window = text.slice(slugIdx, slugIdx + 6000);
    const allergenRe = /allergens:\s*\[([^\]]*)\]\s*as const/;
    const m = window.match(allergenRe);
    if (!m) {
      missing.push(`${fix.slug} (allergens array not found)`);
      continue;
    }
    const rawList = m[1];
    const current: Allergen[] = (rawList.match(/"([A-Z_]+)"/g) ?? []).map(
      (s) => s.replace(/"/g, "") as Allergen,
    );
    const set = new Set<Allergen>([...current, ...fix.add]);
    const ordered = ORDER.filter((a) => set.has(a));
    if (ordered.length === current.length) {
      alreadyClean++;
      continue;
    }
    const newArr = ordered.map((a) => `"${a}"`).join(", ");
    const newExpr = `allergens: [${newArr}] as const`;
    const oldExpr = m[0];
    const absoluteIdx = slugIdx + window.indexOf(oldExpr);
    text =
      text.slice(0, absoluteIdx) +
      newExpr +
      text.slice(absoluteIdx + oldExpr.length);
    updated++;
    console.log(
      `  ${fix.slug.padEnd(48)} [${current.join(",") || "∅"}] → [${ordered.join(",")}]`,
    );
  }

  fs.writeFileSync(seedPath, text, "utf8");
  console.log(
    `\nUpdated: ${updated} | Already clean: ${alreadyClean} | Missing: ${missing.length} | Total: ${FIXES.length}`,
  );
  if (missing.length) {
    console.error("Missing slugs:", missing);
    process.exit(1);
  }
}

main();
