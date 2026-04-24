import { recipes } from "./seed-recipes";

const MIN: Record<string, number> = {
  YEMEK: 5,
  CORBA: 5,
  SALATA: 5,
  TATLI: 5,
  KAHVALTI: 5,
  APERATIF: 4,
  KOKTEYL: 4,
  ICECEK: 3,
  ATISTIRMALIK: 4,
  SOS: 3,
};

const MAX = 12;

type Fail = {
  idx: number;
  slug: string;
  type: string;
  steps: number;
  min: number;
  reason: "under" | "over";
};

const fails: Fail[] = [];

recipes.forEach((r, idx) => {
  const min = MIN[r.type] ?? 5;
  const stepCount = r.steps.length;
  if (stepCount < min) {
    fails.push({ idx, slug: r.slug, type: r.type, steps: stepCount, min, reason: "under" });
  } else if (stepCount > MAX) {
    fails.push({ idx, slug: r.slug, type: r.type, steps: stepCount, min, reason: "over" });
  }
});

console.log(`Total recipes: ${recipes.length}`);
console.log(`Under-min: ${fails.filter(f => f.reason === "under").length}`);
console.log(`Over-max (${MAX}): ${fails.filter(f => f.reason === "over").length}`);
console.log("");

const byType: Record<string, { total: number; under: number; minHist: Record<number, number> }> = {};
recipes.forEach((r) => {
  const t = r.type;
  byType[t] ??= { total: 0, under: 0, minHist: {} };
  byType[t].total++;
  byType[t].minHist[r.steps.length] = (byType[t].minHist[r.steps.length] ?? 0) + 1;
  const min = MIN[t] ?? 5;
  if (r.steps.length < min) byType[t].under++;
});

console.log("Type özet:");
Object.entries(byType)
  .sort(([a], [b]) => a.localeCompare(b))
  .forEach(([type, stats]) => {
    const minReq = MIN[type] ?? 5;
    console.log(
      `  ${type.padEnd(14)} total=${String(stats.total).padStart(4)} under_min(${minReq})=${String(stats.under).padStart(3)} step_dist=${JSON.stringify(stats.minHist)}`
    );
  });
console.log("");

if (fails.length) {
  console.log("Detaylar (slug | type | step | min | reason):");
  fails.forEach((f) => {
    console.log(`  ${f.slug.padEnd(60)} ${f.type.padEnd(12)} steps=${f.steps} min=${f.min} ${f.reason}`);
  });
}

console.log("");
console.log("--- Batch segmentasyonu (batch 30a = 10 batch + 35a/b/36a = 3 batch) ---");
// 13 batch x 50 tarif = 650 tarif (30a-36a)
// 35a+35b+36a = 150 (working tree, henuz apply degil)
// 30a-34b = 10 batch x 50 = 500 (prod 3252'ye dahil)

const pre30a = recipes.slice(0, -650); // batch 1-29 + erken
const range30a34b = recipes.slice(-650, -150); // 10 batch, 500 tarif
const range35a36a = recipes.slice(-150); // 3 batch, 150 tarif (working tree)

const checkSeg = (label: string, seg: typeof recipes) => {
  const fails = seg.filter((r) => r.steps.length < (MIN[r.type] ?? 5));
  const step3 = seg.filter((r) => r.steps.length === 3).length;
  const step4 = seg.filter((r) => r.steps.length === 4).length;
  const step5plus = seg.filter((r) => r.steps.length >= 5).length;
  console.log(`\n${label}:`);
  console.log(`  total=${seg.length}  under_min=${fails.length}  3step=${step3}  4step=${step4}  5+step=${step5plus}`);
  // type breakdown of fails
  const typeBreak: Record<string, number> = {};
  fails.forEach((r) => { typeBreak[r.type] = (typeBreak[r.type] ?? 0) + 1; });
  console.log(`  fail_type_breakdown: ${JSON.stringify(typeBreak)}`);
  return fails;
};

const preFails = checkSeg("Pre-30a (batch 1-29, eski MVP + klasik)", pre30a);
const midFails = checkSeg("30a-34b (10 batch, oturum 16-17)", range30a34b);
void checkSeg("35a+35b+36a (3 batch, oturum 17 sonu, min step kurali VAR)", range35a36a);

// Kritik: sadece 4-step fails (retrofit kolay)
console.log("\n--- 30a-34b 4-step ihlalleri (retrofit adayi) ---");
const mid4step = midFails.filter((r) => r.steps.length === 4);
console.log(`4-step fails: ${mid4step.length}`);
mid4step.forEach((r) => {
  console.log(`  ${r.slug.padEnd(60)} ${r.type.padEnd(12)} steps=${r.steps.length}`);
});

// 3-step fails 30a-34b
console.log("\n--- 30a-34b 3-step ihlalleri (daha agresif retrofit) ---");
const mid3step = midFails.filter((r) => r.steps.length === 3);
console.log(`3-step fails: ${mid3step.length}`);
mid3step.slice(0, 30).forEach((r) => {
  console.log(`  ${r.slug.padEnd(60)} ${r.type.padEnd(12)} steps=${r.steps.length}`);
});

// Pre-30a sadece 4-step (retrofit adaylari, 3-step'leri brakitliyoruz)
console.log("\n--- Pre-30a 4-step ihlalleri (kolay retrofit adaylari, sayi) ---");
const pre4step = preFails.filter((r) => r.steps.length === 4);
console.log(`Pre-30a 4-step fails: ${pre4step.length}`);
// ilk 30 ornegi
pre4step.slice(0, 30).forEach((r) => {
  console.log(`  ${r.slug.padEnd(60)} ${r.type.padEnd(12)} steps=${r.steps.length}`);
});
