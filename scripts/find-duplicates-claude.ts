/**
 * Claude paralel duplicate audit. find-aggressive-duplicates.ts'in
 * genişletilmiş hali:
 *
 * 1. Aynı cuisine + aynı type ZORUNLU
 * 2. Title token overlap >= 1 (5+ char, generic değil), ANZAC Biscuit
 *    vs Bisküvisi gibi 1 ortak token yakalansın
 * 3. Ingredient set Jaccard >= 0.5 (gerçek tarif eşleşmesi)
 * 4. Step count |a - b| <= 2 (yakın yapı)
 * 5. averageCalories |a - b| <= %30 (büyük protein farkı dışla)
 *
 * Kombinasyon high precision: Codex Mod I'nin yakalayacağı duplicate'leri
 * önceden tespit + Codex'i doğrulayıcı olarak kullanmak.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const STOP_WORDS = new Set([
  "ile", "ve", "icin", "bir", "tarifi", "usulu", "klasik",
  "the", "an", "of", "and", "with",
  "corbasi", "corba", "pilav", "pilavi", "kebabi", "kebab", "tava",
  "salata", "salatasi", "guveci", "guvec", "boregi", "borek",
  "tatlisi", "tatli", "sote", "kavurma", "yemegi", "yemek",
  "dolmasi", "dolma", "sarmasi", "sarma", "bukmesi", "bukme",
  "asi", "asisi", "kapama", "kapamasi", "ekmegi", "ekmek",
  "tostu", "smoothie", "shake", "kup", "kase", "kasesi",
  "kahvalti", "kahvaltisi", "tabagi", "tabak", "kofte", "koftesi",
  "mezesi", "meze",
]);

function normalize(title: string): string {
  return title
    .toLocaleLowerCase("tr")
    .replace(/[ğ]/g, "g")
    .replace(/[ü]/g, "u")
    .replace(/[ş]/g, "s")
    .replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o")
    .replace(/[ç]/g, "c")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function titleTokens(title: string): Set<string> {
  return new Set(
    normalize(title)
      .split(" ")
      .filter((w) => w.length >= 5 && !STOP_WORDS.has(w)),
  );
}

function ingNormalize(name: string): string {
  return normalize(name).split(" ")[0];
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  const inter = [...a].filter((x) => b.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return inter / uni;
}

interface Recipe {
  id: string;
  slug: string;
  title: string;
  cuisine: string | null;
  type: string;
  totalMinutes: number;
  averageCalories: number | null;
  isFeatured: boolean;
  ingredients: { name: string }[];
  _count: { steps: number };
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
  const recipes: Recipe[] = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      cuisine: true,
      type: true,
      totalMinutes: true,
      averageCalories: true,
      isFeatured: true,
      ingredients: { select: { name: true } },
      _count: { select: { steps: true } },
    },
  });

  const titleTokenCache = new Map<string, Set<string>>();
  const ingTokenCache = new Map<string, Set<string>>();
  for (const r of recipes) {
    titleTokenCache.set(r.id, titleTokens(r.title));
    ingTokenCache.set(
      r.id,
      new Set(r.ingredients.map((i) => ingNormalize(i.name)).filter(Boolean)),
    );
  }

  type Pair = {
    a: Recipe;
    b: Recipe;
    titleShared: string[];
    ingJaccard: number;
    stepDiff: number;
    calDiff: number;
  };
  const pairs: Pair[] = [];

  for (let i = 0; i < recipes.length; i++) {
    for (let j = i + 1; j < recipes.length; j++) {
      const a = recipes[i];
      const b = recipes[j];
      if (a.cuisine !== b.cuisine) continue;
      if (a.type !== b.type) continue;
      const ta = titleTokenCache.get(a.id)!;
      const tb = titleTokenCache.get(b.id)!;
      const titleShared = [...ta].filter((x) => tb.has(x));
      // Strict: title Jaccard >= 0.6 OR (length 1-2 in both AND all overlap)
      const titleJ = jaccard(ta, tb);
      const bothShort = ta.size <= 2 && tb.size <= 2;
      const allOverlap = titleShared.length === Math.min(ta.size, tb.size);
      const titleStrict = titleJ >= 0.6 || (bothShort && allOverlap && titleShared.length >= 1);
      if (!titleStrict) continue;
      const ia = ingTokenCache.get(a.id)!;
      const ib = ingTokenCache.get(b.id)!;
      const ingJ = jaccard(ia, ib);
      if (ingJ < 0.6) continue;
      const stepDiff = Math.abs(a._count.steps - b._count.steps);
      if (stepDiff > 2) continue;
      const ca = a.averageCalories ?? 0;
      const cb = b.averageCalories ?? 0;
      const calDiff =
        ca && cb ? Math.abs(ca - cb) / Math.max(ca, cb) : 0;
      if (calDiff > 0.3) continue;
      pairs.push({ a, b, titleShared, ingJaccard: ingJ, stepDiff, calDiff });
    }
  }

  // PAIR-ONLY (transitive closure yok, false positive azaltir)
  const out: string[] = [];
  out.push(`Total recipes: ${recipes.length}`);
  out.push(`Strict pairs (titleJacc>=0.6 OR shortAllOverlap, ingJacc>=0.6, stepDiff<=2, calDiff<=30%): ${pairs.length}\n`);

  // Sort pairs: high confidence first (high ingJaccard + small calDiff)
  pairs.sort((p, q) => q.ingJaccard - p.ingJaccard);

  let suggestedSilCount = 0;
  const seenAsSil = new Set<string>();

  for (const p of pairs) {
    const cluster = [p.a, p.b];
    cluster.sort((x, y) => {
      if (x.isFeatured !== y.isFeatured) return y.isFeatured ? 1 : -1;
      const xi = x.ingredients.length + x._count.steps;
      const yi = y.ingredients.length + y._count.steps;
      return yi - xi;
    });
    const canonical = cluster[0];
    const dup = cluster[1];

    if (seenAsSil.has(dup.id)) continue;
    seenAsSil.add(dup.id);
    suggestedSilCount += 1;

    out.push(
      `══ [${canonical.cuisine}/${canonical.type}] titleJacc=${jaccard(titleTokenCache.get(canonical.id)!, titleTokenCache.get(dup.id)!).toFixed(2)} ingJacc=${p.ingJaccard.toFixed(2)} stepDiff=${p.stepDiff} calDiff=${(p.calDiff * 100).toFixed(0)}%`,
    );
    out.push(`  ⭐ KEEP [${canonical.slug}] "${canonical.title}" (${canonical.ingredients.length}i/${canonical._count.steps}s, ${canonical.totalMinutes}dk, ${canonical.averageCalories ?? "?"}kcal)`);
    out.push(`     SIL  [${dup.slug}] "${dup.title}" (${dup.ingredients.length}i/${dup._count.steps}s, ${dup.totalMinutes}dk, ${dup.averageCalories ?? "?"}kcal)`);
    out.push(`     shared title tokens: ${p.titleShared.join(", ")}`);
    out.push("");
  }

  out.push(`\n=== SUMMARY ===`);
  out.push(`Total strict pairs: ${pairs.length}`);
  out.push(`Unique SIL slug count: ${suggestedSilCount}`);
  out.push(`Estimated prod: ${recipes.length} -> ${recipes.length - suggestedSilCount}`);

  const outFile = path.resolve(process.cwd(), "docs/duplicate-suggestions.md");
  fs.writeFileSync(outFile, out.join("\n"));
  console.log(`✅ ${outFile} yazıldı.`);
  console.log(out.slice(0, 5).join("\n"));
  console.log(`\n${out.slice(-4).join("\n")}`);

  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
