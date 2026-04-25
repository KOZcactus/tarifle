/**
 * Batch audit scripti, seed-recipes.ts'in son N tarifini A+ barometreden geçirir.
 *
 * Kullanım:
 *   npx tsx scripts/audit-batch-latest.ts --last 50
 *   npx tsx scripts/audit-batch-latest.ts --last 100 --label "Batch 37a"
 *
 * 16 gate kontrolü (Mod A Pass 1 + Mod F §15 A+ standartı):
 *   1. Step count type min/max ihlal
 *   2. Step dist varyasyon (min 3 distinct, dominant ≤%60)
 *   3. Type + cuisine dağılımı
 *   4. isFeatured oranı (hedef %5-10)
 *   5. Time consistency (prep + cook ≈ total ±5)
 *   6. EN/DE translation (title + description dolu)
 *   7. tipNote + servingSuggestion boş sayısı
 *   8. Em-dash / en-dash
 *   9. Muğlak ifade (§15.7.3 13 kelime)
 *  10. Pişirme step'inde timerSeconds eksik
 *  11. Step kelime sayısı (oturum 19 gevşetme: hard min 4)
 *  12. Template duplicate (aynı instruction ≥2 tarifte)
 *  13. Emoji çeşitlilik (unique/total)
 *  14. Calorie unique + range
 *  15. Allergen boş tarif
 *  16. Tag boş tarif + avg tag/recipe
 */
import { recipes } from "./seed-recipes";

interface CliArgs {
  last: number;
  label: string;
}

function parseArgs(argv: readonly string[]): CliArgs {
  const out: CliArgs = { last: 50, label: "" };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--last" && i + 1 < argv.length) {
      const v = Number(argv[i + 1]);
      if (!Number.isInteger(v) || v <= 0) {
        console.error(`--last integer > 0 olmali, gelen: ${argv[i + 1]}`);
        process.exit(1);
      }
      out.last = v;
      i++;
    } else if (arg === "--label" && i + 1 < argv.length) {
      out.label = argv[i + 1];
      i++;
    }
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const batch = recipes.slice(-args.last);
const label = args.label || `last ${args.last}`;

// Type bazli step count min/max (brief §15.5)
const MIN: Record<string, number> = {
  YEMEK: 5,
  CORBA: 5,
  SALATA: 5,
  TATLI: 5,
  KAHVALTI: 5,
  APERATIF: 4,
  ATISTIRMALIK: 4,
  KOKTEYL: 4,
  ICECEK: 3,
  SOS: 3,
};
const MAX: Record<string, number> = {
  YEMEK: 12,
  CORBA: 12,
  SALATA: 8,
  TATLI: 12,
  KAHVALTI: 8,
  APERATIF: 8,
  ATISTIRMALIK: 8,
  KOKTEYL: 6,
  ICECEK: 6,
  SOS: 6,
};

// Oturum 19 gevşetme: hard min 4 kelime, 5+ ideal.
const WORD_MIN = 4;
const WORD_MAX = 40;

console.log(`=== Batch audit (${label}, ${batch.length} tarif) ===\n`);

// 1. Step count dağılımı + min/max ihlal
const stepDist: Record<number, number> = {};
const stepFails: string[] = [];
batch.forEach((r) => {
  stepDist[r.steps.length] = (stepDist[r.steps.length] ?? 0) + 1;
  const min = MIN[r.type] ?? 5;
  const max = MAX[r.type] ?? 10;
  if (r.steps.length < min) stepFails.push(`UNDER ${r.slug} ${r.type} steps=${r.steps.length} min=${min}`);
  if (r.steps.length > max) stepFails.push(`OVER ${r.slug} ${r.type} steps=${r.steps.length} max=${max}`);
});
console.log(`Step count dist: ${JSON.stringify(stepDist)}`);
console.log(`Step min/max ihlaller: ${stepFails.length}`);
stepFails.slice(0, 5).forEach((f) => console.log(`  ${f}`));

// 2. Step dist varyasyon (min 3 distinct, dominant <=%60)
const distinctStepCounts = Object.keys(stepDist).length;
const dominantCount = Math.max(...Object.values(stepDist));
const dominantPct = (dominantCount / batch.length) * 100;
console.log(`Step varyasyon: ${distinctStepCounts} distinct, dominant ${dominantPct.toFixed(0)}%`);

// 3. Type dağılımı + cuisine
const typeDist: Record<string, number> = {};
batch.forEach((r) => (typeDist[r.type] = (typeDist[r.type] ?? 0) + 1));
console.log(`\nType dist: ${JSON.stringify(typeDist)}`);

const cuisineDist: Record<string, number> = {};
batch.forEach((r) => {
  const c = r.cuisine ?? "null";
  cuisineDist[c] = (cuisineDist[c] ?? 0) + 1;
});
console.log(`Cuisine dist: ${JSON.stringify(cuisineDist)}`);

// 4. isFeatured oranı (hedef %5-10)
const featured = batch.filter((r) => r.isFeatured).length;
const featuredPct = (featured / batch.length) * 100;
console.log(`\nFeatured: ${featured}/${batch.length} (${featuredPct.toFixed(0)}%, hedef %5-10)`);

// 5. Time consistency: prep + cook ≈ total (±5)
const timeInconsistent = batch.filter((r) => {
  const sum = (r.prepMinutes ?? 0) + (r.cookMinutes ?? 0);
  return Math.abs(sum - (r.totalMinutes ?? 0)) > 5;
});
console.log(`Time inconsistent (prep+cook vs total ±5): ${timeInconsistent.length}`);
timeInconsistent.slice(0, 3).forEach((r) =>
  console.log(`  ${r.slug} prep=${r.prepMinutes} cook=${r.cookMinutes} total=${r.totalMinutes}`),
);

// 6. Translations EN + DE var mı (title + description)
type TranslationShape = {
  en?: { title?: string; description?: string };
  de?: { title?: string; description?: string };
};
const missingTranslations = batch.filter((r) => {
  const tr = r.translations as TranslationShape | undefined;
  if (!tr) return true;
  if (!tr.en?.title || !tr.en?.description) return true;
  if (!tr.de?.title || !tr.de?.description) return true;
  return false;
});
console.log(`\nEN/DE translation eksik: ${missingTranslations.length}`);
missingTranslations.slice(0, 3).forEach((r) => console.log(`  ${r.slug}`));

// 7. tipNote + servingSuggestion
const missingTipNote = batch.filter((r) => !r.tipNote).length;
const missingServing = batch.filter((r) => !r.servingSuggestion).length;
console.log(`tipNote bos: ${missingTipNote}, servingSuggestion bos: ${missingServing}`);

// 8. Em-dash / en-dash
let emDashCount = 0;
let enDashCount = 0;
batch.forEach((r) => {
  const all = [
    r.title,
    r.description,
    r.tipNote ?? "",
    r.servingSuggestion ?? "",
    ...r.ingredients.map((i) => i.name),
    ...r.steps.map((s) => s.instruction),
  ].join(" ");
  if (all.includes("\u2014")) emDashCount++;
  if (all.includes("\u2013")) enDashCount++;
});
console.log(`\nEm-dash icer tarif: ${emDashCount}, en-dash: ${enDashCount}`);

// 9. Muğlak ifade (brief §15.7.3 listesi)
const VAGUE = [
  "kısa süre",
  "bir süre",
  "biraz bekle",
  "uygun kıvam",
  "dilediğin kadar",
  "yeterince",
  "uygun ölçüde",
  "iyice",
];
const vagueHits: string[] = [];
batch.forEach((r) => {
  r.steps.forEach((s) => {
    const txt = s.instruction.toLocaleLowerCase("tr");
    for (const v of VAGUE) {
      if (txt.includes(v)) {
        const hasMeasure = /\d|°C|dakika|saniye|gram|litre|adet|su bardağ|yemek kaşığ/i.test(s.instruction);
        if (!hasMeasure) {
          vagueHits.push(`${r.slug} step${s.stepNumber}: "${v}" in: ${s.instruction.slice(0, 80)}`);
          break;
        }
      }
    }
  });
});
console.log(`Muglak ifade (olcu yokken): ${vagueHits.length}`);
vagueHits.slice(0, 5).forEach((h) => console.log(`  ${h}`));

// 10. Step timerSeconds cover (pişirme verbi içeren step)
const COOK_VERBS = /(pişir|kavur|haşla|mühürle|kızart|mayala|fırınla|ızgara|közle|karamelize|eritin|dinlendir|bekletin)/i;
const missingTimers: string[] = [];
batch.forEach((r) => {
  r.steps.forEach((s) => {
    if (COOK_VERBS.test(s.instruction) && (s.timerSeconds === null || s.timerSeconds === undefined)) {
      missingTimers.push(`${r.slug} step${s.stepNumber}: ${s.instruction.slice(0, 60)}`);
    }
  });
});
console.log(`\nPisirme step'inde timer eksik: ${missingTimers.length}`);
missingTimers.slice(0, 5).forEach((m) => console.log(`  ${m}`));

// 11. Step kelime sayısı (oturum 19 gevşetme: hard min 4, max 40)
const wordCountFails: string[] = [];
batch.forEach((r) => {
  r.steps.forEach((s) => {
    const wc = s.instruction.split(/\s+/).filter(Boolean).length;
    if (wc < WORD_MIN || wc > WORD_MAX) {
      wordCountFails.push(`${r.slug} step${s.stepNumber} wc=${wc}: ${s.instruction.slice(0, 60)}`);
    }
  });
});
console.log(`Step kelime sayisi (${WORD_MIN}-${WORD_MAX} disi): ${wordCountFails.length}`);
wordCountFails.slice(0, 5).forEach((f) => console.log(`  ${f}`));

// 12. Template duplicate, aynı instruction 2+ tarifte
const instMap = new Map<string, Set<string>>();
batch.forEach((r) => {
  r.steps.forEach((s) => {
    if (!instMap.has(s.instruction)) instMap.set(s.instruction, new Set());
    instMap.get(s.instruction)!.add(r.slug);
  });
});
const tmplDups = Array.from(instMap.entries()).filter(([, set]) => set.size > 1);
console.log(`\nTemplate dup (cumle >=2 tarifte): ${tmplDups.length}`);
tmplDups.slice(0, 3).forEach(([txt, s]) => console.log(`  ${s.size}x: ${txt.slice(0, 80)}`));

// 13. Emoji çeşitlilik
const emojiDist: Record<string, number> = {};
batch.forEach((r) => {
  emojiDist[r.emoji ?? "null"] = (emojiDist[r.emoji ?? "null"] ?? 0) + 1;
});
const emojiUniqCount = Object.keys(emojiDist).length;
console.log(`\nEmoji unique: ${emojiUniqCount}/${batch.length}`);

// 14. Calorie dağılımı (farklı değer sayısı)
const calSet = new Set(batch.map((r) => r.averageCalories));
console.log(`Calorie unique: ${calSet.size}`);
const calVals = batch.map((r) => r.averageCalories ?? 0).filter((c) => c > 0);
if (calVals.length > 0) {
  console.log(`Calorie range: ${Math.min(...calVals)}-${Math.max(...calVals)}`);
}

// 15. Allergen empty oranı
const emptyAllergen = batch.filter((r) => r.allergens.length === 0).length;
console.log(`\nAllergen bos tarif: ${emptyAllergen}/${batch.length}`);

// 16. Tag dağılımı
const noTagCount = batch.filter((r) => r.tags.length === 0).length;
const tagsPerRecipe = batch.map((r) => r.tags.length);
const avgTag = tagsPerRecipe.reduce((a, b) => a + b, 0) / batch.length;
console.log(`Tag bos tarif: ${noTagCount}, avg tag/recipe: ${avgTag.toFixed(1)}`);

// === ÖZET ===
console.log(`\n=== OZET ===`);
const issues: string[] = [];
if (stepFails.length > 0) issues.push(`step min/max ihlal: ${stepFails.length}`);
if (distinctStepCounts < 3) issues.push(`step cesitlilik <3 distinct`);
if (dominantPct > 60) issues.push(`dominant step count ${dominantPct.toFixed(0)}% (>60%)`);
if (emDashCount > 0) issues.push(`em-dash: ${emDashCount}`);
if (enDashCount > 0) issues.push(`en-dash: ${enDashCount}`);
if (missingTranslations.length > 0) issues.push(`EN/DE eksik: ${missingTranslations.length}`);
if (vagueHits.length > 0) issues.push(`muglak ifade: ${vagueHits.length}`);
if (missingTimers.length > 5) issues.push(`pisirme timer eksik: ${missingTimers.length}`);
if (wordCountFails.length > 0) issues.push(`kelime sayisi ihlal: ${wordCountFails.length}`);
if (tmplDups.length > 0) issues.push(`template dup: ${tmplDups.length}`);
if (missingTipNote > 0) issues.push(`tipNote eksik: ${missingTipNote}`);
if (timeInconsistent.length > 0) issues.push(`time inconsistent: ${timeInconsistent.length}`);
if (featuredPct < 4 || featuredPct > 12) issues.push(`featured oran sapma: ${featuredPct.toFixed(0)}%`);

if (issues.length === 0) {
  console.log(`A+ SEVIYE, 0 ihlal`);
} else {
  console.log(`${issues.length} konu:`);
  issues.forEach((i) => console.log(`  - ${i}`));
}
