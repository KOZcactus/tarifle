/**
 * Daha hassas duplicate tespit: ayni cuisine + token Jaccard >= 0.5
 * + en az 2 ortak ana kelime (>=4 char). Pairs only, transitive
 * closure yok (false positive cluster onleme).
 *
 * Kullanicinin verdigi ornekler hedef:
 * - ANZAC Biscuit / Biscuits / Bisküvisi
 * - Afyon Patatesli Bükme x2
 * - Ali Nazik vs Ali Nazik Kebabı
 * - Alfajores vs Alfajores Peruanos
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

// Stop words: tarif tipi suffix'leri + grammar particles. Bunlar yalnız
// kalırsa "ortak token" sayılmamalı. Nesneye ait gerçek anahtar
// kelimelere odakla (ANZAC, Afyon, Ali Nazik, Alfajores, Amasya, Hibeş).
const STOP_WORDS = new Set([
  "ile", "ve", "icin", "bir", "tarifi", "usulu", "klasik",
  "the", "an", "of", "and", "with",
  // Recipe type suffixes (TR)
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

function tokens(title: string): Set<string> {
  return new Set(
    normalize(title)
      .split(" ")
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w)),
  );
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
  _count: { ingredients: number; steps: number };
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
      _count: { select: { ingredients: true, steps: true } },
    },
  });

  const tokenCache = new Map<string, Set<string>>();
  for (const r of recipes) tokenCache.set(r.id, tokens(r.title));

  // Pairs with same cuisine + same type + jaccard >= 0.5 + intersection >= 2
  type Pair = { a: Recipe; b: Recipe; jaccard: number; shared: string[] };
  const pairs: Pair[] = [];

  for (let i = 0; i < recipes.length; i++) {
    for (let j = i + 1; j < recipes.length; j++) {
      const a = recipes[i];
      const b = recipes[j];
      if (a.cuisine !== b.cuisine) continue;
      if (a.type !== b.type) continue;
      const ta = tokenCache.get(a.id)!;
      const tb = tokenCache.get(b.id)!;
      const inter = [...ta].filter((x) => tb.has(x));
      if (inter.length < 2) {
        // Special: single-token both, exact match (Alfajores)
        if (ta.size === 1 && tb.size === 1 && inter.length === 1) {
          pairs.push({ a, b, jaccard: 1, shared: inter });
        }
        continue;
      }
      const jac = jaccard(ta, tb);
      if (jac >= 0.5) {
        pairs.push({ a, b, jaccard: jac, shared: inter });
      }
    }
  }

  // Build clusters using union-find ONLY among pairs
  const parent = new Map<string, string>();
  for (const r of recipes) parent.set(r.id, r.id);
  function find(x: string): string {
    while (parent.get(x) !== x) {
      parent.set(x, parent.get(parent.get(x)!)!);
      x = parent.get(x)!;
    }
    return x;
  }
  function union(x: string, y: string): void {
    const rx = find(x);
    const ry = find(y);
    if (rx !== ry) parent.set(rx, ry);
  }
  for (const p of pairs) union(p.a.id, p.b.id);

  const clusters = new Map<string, Recipe[]>();
  for (const r of recipes) {
    if (!parent.has(r.id)) continue;
    const root = find(r.id);
    if (!clusters.has(root)) clusters.set(root, []);
    clusters.get(root)!.push(r);
  }

  const dupClusters = [...clusters.values()].filter((c) => c.length >= 2);

  console.log(`Total recipes: ${recipes.length}`);
  console.log(`Tight pairs (Jaccard >=0.5, same cuisine+type): ${pairs.length}`);
  console.log(`Duplicate clusters: ${dupClusters.length}\n`);

  for (const cluster of dupClusters.sort((a, b) => b.length - a.length)) {
    const tokensCommon = cluster
      .map((r) => [...tokenCache.get(r.id)!])
      .reduce((acc, t) => acc.filter((x) => t.includes(x)));
    console.log(
      `══ ${cluster.length}x [${cluster[0].cuisine ?? "?"}/${cluster[0].type}] ${tokensCommon.join(" ")} ══`,
    );
    for (const r of cluster) {
      const cal = r.averageCalories ?? "?";
      const star = r.isFeatured ? "⭐" : "  ";
      console.log(
        `  ${star} [${r.slug}] "${r.title}" (${r._count.ingredients}ing/${r._count.steps}step, ${r.totalMinutes}dk, ${cal}kcal)`,
      );
    }
    console.log("");
  }

  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
