/**
 * Backfill-10 Codex teslim 19 slug'u DB'de farklı suffix ile duruyor
 * (34 missing slug restore'da DB versiyonları ocak/ev/bag/yayla/bahce
 * bölgesel suffix'lerle kaydedildi, ama CSV eski kısa form kullandı).
 * Fuzzy match ile remap et, JSON'ı in-place güncelle.
 *
 *   npx tsx scripts/remap-backfill10-slugs.ts           # dry
 *   npx tsx scripts/remap-backfill10-slugs.ts --apply   # rewrite JSON
 */
import * as fs from "node:fs";

const apply = process.argv.includes("--apply");
const JSON_PATH = "docs/translations-backfill-10.json";
const DB_SLUGS_PATH = "tmp-db-slugs-prod.txt";

const dbSlugs = new Set(
  fs.readFileSync(DB_SLUGS_PATH, "utf-8").split(/\r?\n/).filter(Boolean),
);

/** Manuel override: bölge+segment tam değişmiş (suffix drop yetmiyor). */
const MANUAL_MAP: Record<string, string> = {
  "uzumlu-tavuk-kapama-manisa-sultaniye-usulu":
    "uzumlu-tavuk-kapama-manisa-bag-usulu",
  "lorlu-firik-dolma-izmir-bostan-usulu":
    "lorlu-firik-dolma-izmir-ova-usulu",
};
const jsonArr = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8")) as {
  slug: string;
}[];

/** JSON slug formatı genelde "<isim>-<bölge>-usulu". DB'de bazılarında
 *  bölge ile usulu arasında ekstra segment (ocak/ev/bag/yayla/bahce vs).
 *  JSON slug'tan "-usulu" son ek'i kaldır, DB'deki o prefix ile başlayan
 *  VE "-usulu" ile biten slug'ı bul. Unique match bekleriz. */
function fuzzyMatch(jsonSlug: string): string | null {
  if (dbSlugs.has(jsonSlug)) return jsonSlug; // exact match
  const manual = MANUAL_MAP[jsonSlug];
  if (manual && dbSlugs.has(manual)) return manual;
  if (!jsonSlug.endsWith("-usulu")) return null;

  // Forward fuzzy: JSON kısa, DB uzun suffix (json prefix + ek segment + usulu).
  const prefixShort = jsonSlug.slice(0, -"-usulu".length);
  const forward = [...dbSlugs].filter(
    (s) => s.startsWith(prefixShort + "-") && s.endsWith("-usulu"),
  );
  if (forward.length >= 1) {
    return forward.sort((a, b) => a.length - b.length)[0] ?? null;
  }

  // Reverse fuzzy: JSON uzun (bölge + ekstra segment), DB kısa (bölge + usulu).
  // Son segmenti kaldırıp dene: "cevizli-tirit-samsun-ocak-usulu" →
  // prefix "cevizli-tirit-samsun", target "cevizli-tirit-samsun-usulu".
  const parts = prefixShort.split("-");
  for (let drop = 1; drop <= 2 && parts.length - drop > 1; drop++) {
    const shorterPrefix = parts.slice(0, -drop).join("-");
    const candidate = `${shorterPrefix}-usulu`;
    if (dbSlugs.has(candidate)) return candidate;
  }

  return null;
}

let remapped = 0;
let unchanged = 0;
let failed = 0;
const unmapped: string[] = [];

for (const r of jsonArr) {
  const match = fuzzyMatch(r.slug);
  if (match === null) {
    console.log(`  ❌ NO MATCH: ${r.slug}`);
    failed++;
    unmapped.push(r.slug);
    continue;
  }
  if (match === r.slug) {
    unchanged++;
    continue;
  }
  console.log(`  ${apply ? "✅" : "•"} ${r.slug}  →  ${match}`);
  r.slug = match;
  remapped++;
}

console.log(
  `\n${apply ? "applying" : "dry-run"}: ${remapped} remapped, ${unchanged} already match, ${failed} no-match`,
);
if (apply && remapped > 0) {
  fs.writeFileSync(JSON_PATH, JSON.stringify(jsonArr, null, 2), "utf-8");
  console.log(`  wrote: ${JSON_PATH}`);
}
if (failed > 0) {
  console.log(`\n  unmapped slug list:\n${unmapped.map((s) => "  " + s).join("\n")}`);
  process.exit(1);
}
