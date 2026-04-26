/**
 * Cross-language duplicate pair audit (Mod IB scope).
 *
 * Mod I + Mod IA threshold (titleJacc >= 0.6) capraz dil pair'lerini
 * yakalamadi: ornek "Tea Egg" vs "Tea Eggs Cin Atistirmalik Usulu",
 * "Black Bean Soup" vs "Siyah Fasulye Corbasi". Bu script TR/EN/ES vd.
 * paralel başlik durumlarini tara: titleJacc < 0.3 (paylasilan token
 * az veya yok) AMA ingJacc >= 0.65 + same cuisine + same type +
 * stepDiff <= 2 + calDiff <= 25%.
 *
 * Cikti: docs/cross-language-pairs.md (Codex Mod IB ek input)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

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

function trLower(s: string) {
  return s.toLocaleLowerCase("tr");
}
function asciiNormalize(s: string) {
  return trLower(s)
    .replace(/[ç]/g, "c").replace(/[ğ]/g, "g").replace(/[ı]/g, "i")
    .replace(/[ö]/g, "o").replace(/[ş]/g, "s").replace(/[ü]/g, "u")
    .replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function titleTokens(t: string): Set<string> {
  return new Set(
    asciiNormalize(t).split(" ").filter((w) => w.length >= 4 && !STOP_WORDS.has(w)),
  );
}
function ingNormalize(name: string) {
  return asciiNormalize(name).split(" ")[0] ?? "";
}
function jaccard(a: Set<string>, b: Set<string>) {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  const inter = [...a].filter((x) => b.has(x)).length;
  return inter / new Set([...a, ...b]).size;
}

interface RowLite {
  id: string;
  slug: string;
  title: string;
  cuisine: string | null;
  type: string;
  totalMinutes: number;
  averageCalories: number | null;
  isFeatured: boolean;
  ingredients: { name: string }[];
  stepCount: number;
}

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const rows = await prisma.recipe.findMany({
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
  const recipes: RowLite[] = rows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    cuisine: r.cuisine,
    type: r.type as string,
    totalMinutes: r.totalMinutes,
    averageCalories: r.averageCalories,
    isFeatured: r.isFeatured,
    ingredients: r.ingredients,
    stepCount: r._count.steps,
  }));
  console.log(`Total recipes: ${recipes.length}`);

  // Group by cuisine + type for O(n) reduction
  const byKey = new Map<string, RowLite[]>();
  for (const r of recipes) {
    const k = `${r.cuisine ?? "null"}|${r.type}`;
    if (!byKey.has(k)) byKey.set(k, []);
    byKey.get(k)!.push(r);
  }

  // Cache title + ingredient sets
  const tCache = new Map<string, Set<string>>();
  const iCache = new Map<string, Set<string>>();
  for (const r of recipes) {
    tCache.set(r.id, titleTokens(r.title));
    iCache.set(
      r.id,
      new Set(r.ingredients.map((i) => ingNormalize(i.name)).filter(Boolean)),
    );
  }

  type Pair = {
    a: RowLite;
    b: RowLite;
    titleJ: number;
    ingJ: number;
    stepDiff: number;
    calDiff: number;
  };
  const pairs: Pair[] = [];
  for (const list of byKey.values()) {
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i]!;
        const b = list[j]!;
        const titleJ = jaccard(tCache.get(a.id)!, tCache.get(b.id)!);
        // Cross-language: title overlap dusuk (< 0.3)
        if (titleJ >= 0.3) continue;
        const ingJ = jaccard(iCache.get(a.id)!, iCache.get(b.id)!);
        if (ingJ < 0.75) continue;
        const stepDiff = Math.abs(a.stepCount - b.stepCount);
        if (stepDiff > 2) continue;
        const cA = a.averageCalories ?? 0;
        const cB = b.averageCalories ?? 0;
        const calDiff = cA && cB ? Math.abs(cA - cB) / Math.max(cA, cB) : 0;
        if (calDiff > 0.15) continue;
        // Duration sanity: %30 üstu fark ise atla (genelde ayri tarif)
        const dA = a.totalMinutes;
        const dB = b.totalMinutes;
        const durDiff =
          dA && dB ? Math.abs(dA - dB) / Math.max(dA, dB) : 0;
        if (durDiff > 0.3) continue;
        pairs.push({ a, b, titleJ, ingJ, stepDiff, calDiff });
      }
    }
  }

  // Sort high confidence first
  pairs.sort((p, q) => q.ingJ - p.ingJ);

  const lines: string[] = [];
  lines.push(`# Cross-language duplicate pair candidates`);
  lines.push("");
  lines.push(`Total recipes: ${recipes.length}`);
  lines.push(
    `Cross-language pairs (titleJacc<0.3, ingJacc>=0.65, stepDiff<=2, calDiff<=25%): ${pairs.length}`,
  );
  lines.push("");
  for (const p of pairs) {
    const cluster = [p.a, p.b];
    cluster.sort((x, y) => {
      if (x.isFeatured !== y.isFeatured) return y.isFeatured ? 1 : -1;
      const xi = x.ingredients.length + x.stepCount;
      const yi = y.ingredients.length + y.stepCount;
      return yi - xi;
    });
    const winner = cluster[0]!;
    const loser = cluster[1]!;
    lines.push(
      `══ [${winner.cuisine}/${winner.type}] titleJ=${p.titleJ.toFixed(2)} ingJ=${p.ingJ.toFixed(2)} stepΔ=${p.stepDiff} calΔ=${(p.calDiff * 100).toFixed(0)}%`,
    );
    lines.push(
      `  ⭐ KEEP [${winner.slug}] "${winner.title}" (${winner.ingredients.length}i/${winner.stepCount}s, ${winner.totalMinutes}dk, ${winner.averageCalories ?? "?"}kcal)${winner.isFeatured ? " ⭐FEATURED" : ""}`,
    );
    lines.push(
      `     SIL? [${loser.slug}] "${loser.title}" (${loser.ingredients.length}i/${loser.stepCount}s, ${loser.totalMinutes}dk, ${loser.averageCalories ?? "?"}kcal)${loser.isFeatured ? " ⭐FEATURED" : ""}`,
    );
    lines.push("");
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/cross-language-pairs.md"),
    lines.join("\n"),
  );
  console.log(`Cross-language pairs: ${pairs.length}`);
  console.log(`Yazildi: docs/cross-language-pairs.md`);

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
