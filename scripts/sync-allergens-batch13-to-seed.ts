/**
 * One-shot helper: synchronize the batch-13 allergen DB fixes back into
 * scripts/seed-recipes.ts so source-of-truth and DB don't drift.
 *
 *   npx tsx scripts/sync-allergens-batch13-to-seed.ts
 *
 * Idempotent — running twice is a no-op.
 */
import * as fs from "node:fs";
import * as path from "node:path";

type Allergen =
  | "GLUTEN" | "SUT" | "YUMURTA" | "KUSUYEMIS" | "YER_FISTIGI"
  | "SOYA" | "DENIZ_URUNLERI" | "SUSAM" | "KEREVIZ" | "HARDAL";

const FIXES: readonly { slug: string; add: Allergen[] }[] = [
  { slug: "nigde-sogurmeli-yumurta", add: ["SUT"] },
  { slug: "nohutlu-yahni-konya-usulu", add: ["SUT"] },
  { slug: "mafis-antalya-usulu", add: ["SUT"] },
  { slug: "hamsili-pilav-rize-usulu", add: ["KUSUYEMIS"] },
  { slug: "iskilip-dolmasi-corum-usulu", add: ["SUT"] },
  { slug: "sausage-rolls", add: ["HARDAL"] },
  { slug: "cornish-pasty", add: ["SUT"] },
  { slug: "anzac-biscuits", add: ["SUT"] },
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
    const slugPattern = `slug: "${fix.slug}"`;
    const slugIdx = text.indexOf(slugPattern);
    if (slugIdx === -1) {
      missing.push(fix.slug);
      continue;
    }
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
      `  ${fix.slug.padEnd(36)} [${current.join(",") || "∅"}] → [${ordered.join(",")}]`,
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
