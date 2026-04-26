/**
 * Mod I batch verify raporlarini okuyup A/B/C kategorize eder.
 *
 * Kategori kurallari (Batch 1 manuel triajdan tureyen):
 *  A_KESIN: STRICT, veya:
 *    - ingJacc >= 0.7 + durationDiff <= 30% + calDiff <= 25%
 *    - titleJacc >= 0.6 + ingJacc >= 0.5 + durationDiff <= 25% + calDiff <= 20%
 *    - ingJacc = 1.00 (her ne olursa olsun, kimliksel duplicate)
 *  B_RISK: LOOSE'lardan:
 *    - titleJacc >= 0.5 + ingJacc >= 0.5 + durationDiff <= 35% + calDiff <= 30%
 *  C_ATLA: digerleri (gercek varyant veya zayif eslesme)
 *
 * Cikti: docs/mod-i-batch-N-classify.md ve mod-i-batch-N-rollback.txt
 * (A_KESIN slug'lari, rollback-batch.ts --slugs-file icin hazir).
 *
 * Usage:
 *   npx tsx scripts/classify-mod-i-pairs.ts --batch 2
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname2, "..", ".env") });

interface Cluster {
  cuisine: string;
  type: string;
  canonicalSlug: string;
  canonicalTitle: string;
  duplicateSlugs: string[];
  duplicateTitles: string[];
  confidence: "high" | "medium" | "low";
  reason: string;
}

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

function normalize(text: string): string {
  return text
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
      .filter((w) => w.length >= 4 && !STOP_WORDS.has(w)),
  );
}

function ingNormalize(name: string): string {
  return normalize(name).split(" ")[0] ?? "";
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  if (a.size === 0 || b.size === 0) return 0;
  const inter = [...a].filter((x) => b.has(x)).length;
  const uni = new Set([...a, ...b]).size;
  return inter / uni;
}

interface DbRecipe {
  id: string;
  slug: string;
  title: string;
  totalMinutes: number;
  averageCalories: number | null;
  isFeatured: boolean;
  ingredients: { name: string }[];
  stepCount: number;
  bookmarkCount: number;
  collectionItemCount: number;
  variationCount: number;
  videoJobCount: number;
}

interface PairAnalysis {
  cluster: Cluster;
  duplicateSlug: string;
  duplicateTitle: string;
  canonical: DbRecipe;
  duplicate: DbRecipe;
  titleJacc: number;
  ingJacc: number;
  stepDiff: number;
  durationDiff: number;
  calDiff: number;
  category: "A_KESIN" | "B_RISK" | "C_ATLA";
  reason: string;
}

function classify(
  titleJ: number,
  ingJ: number,
  stepDiff: number,
  durationDiff: number,
  calDiff: number,
): { category: "A_KESIN" | "B_RISK" | "C_ATLA"; reason: string } {
  // A_KESIN tetikleyiciler
  if (ingJ === 1.0) {
    return { category: "A_KESIN", reason: "ingredient set kimlik (Jacc=1.00)" };
  }
  if (
    titleJ >= 0.6 &&
    ingJ >= 0.6 &&
    stepDiff <= 2 &&
    calDiff <= 0.3 &&
    durationDiff <= 0.3
  ) {
    return { category: "A_KESIN", reason: "STRICT (titleJ+ingJ+step+cal+dur OK)" };
  }
  if (ingJ >= 0.7 && durationDiff <= 0.3 && calDiff <= 0.25) {
    return { category: "A_KESIN", reason: "ingJacc yuksek + duration/cal yakin" };
  }
  if (
    titleJ >= 0.6 &&
    ingJ >= 0.5 &&
    durationDiff <= 0.25 &&
    calDiff <= 0.2 &&
    stepDiff <= 2
  ) {
    return { category: "A_KESIN", reason: "title yuksek + ingredient orta + metric yakin" };
  }
  // B_RISK
  if (
    titleJ >= 0.5 &&
    ingJ >= 0.5 &&
    durationDiff <= 0.35 &&
    calDiff <= 0.3 &&
    stepDiff <= 3
  ) {
    return { category: "B_RISK", reason: "title+ing orta, manuel review" };
  }
  // Coğrafi prefix duplicate (titleJ=1.00 + ingJ orta) - genelde aynı tarif
  if (titleJ >= 0.95 && ingJ >= 0.4 && durationDiff <= 0.3) {
    return { category: "B_RISK", reason: "title kimlik + ingredient orta (coğrafi prefix dup)" };
  }
  return { category: "C_ATLA", reason: "varyant veya zayif eslesme" };
}

async function main() {
  const argv = process.argv.slice(2);
  const batchIdx = argv.indexOf("--batch");
  if (batchIdx < 0 || !argv[batchIdx + 1]) {
    console.error("Kullanim: --batch N");
    process.exit(1);
  }
  const batch = argv[batchIdx + 1]!;
  const jsonPath = path.resolve(process.cwd(), `docs/mod-i-batch-${batch}.json`);
  if (!fs.existsSync(jsonPath)) {
    console.error(`JSON yok: ${jsonPath}`);
    process.exit(1);
  }
  const clusters: Cluster[] = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const allSlugs = new Set<string>();
  for (const c of clusters) {
    allSlugs.add(c.canonicalSlug);
    for (const d of c.duplicateSlugs) allSlugs.add(d);
  }

  const databaseUrl = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });
  console.log(`DB: ${new URL(databaseUrl).host}`);
  console.log(`Cluster: ${clusters.length}, slug: ${allSlugs.size}`);

  const rows = await prisma.recipe.findMany({
    where: { slug: { in: [...allSlugs] } },
    select: {
      id: true,
      slug: true,
      title: true,
      totalMinutes: true,
      averageCalories: true,
      isFeatured: true,
      ingredients: { select: { name: true } },
      _count: {
        select: {
          steps: true,
          bookmarks: true,
          collectionItems: true,
          variations: true,
          videoJobs: true,
        },
      },
    },
  });
  const map = new Map<string, DbRecipe>();
  for (const r of rows) {
    map.set(r.slug, {
      id: r.id,
      slug: r.slug,
      title: r.title,
      totalMinutes: r.totalMinutes,
      averageCalories: r.averageCalories,
      isFeatured: r.isFeatured,
      ingredients: r.ingredients,
      stepCount: r._count.steps,
      bookmarkCount: r._count.bookmarks,
      collectionItemCount: r._count.collectionItems,
      variationCount: r._count.variations,
      videoJobCount: r._count.videoJobs,
    });
  }

  const analysis: PairAnalysis[] = [];
  for (const c of clusters) {
    const canonical = map.get(c.canonicalSlug);
    if (!canonical) continue;
    for (let i = 0; i < c.duplicateSlugs.length; i++) {
      const dupSlug = c.duplicateSlugs[i]!;
      const dupTitle = c.duplicateTitles[i] ?? "?";
      const dup = map.get(dupSlug);
      if (!dup) continue;
      const tA = titleTokens(canonical.title);
      const tB = titleTokens(dup.title);
      const titleJ = jaccard(tA, tB);
      const iA = new Set(canonical.ingredients.map((x) => ingNormalize(x.name)).filter(Boolean));
      const iB = new Set(dup.ingredients.map((x) => ingNormalize(x.name)).filter(Boolean));
      const ingJ = jaccard(iA, iB);
      const stepDiff = Math.abs(canonical.stepCount - dup.stepCount);
      const durationDiff =
        canonical.totalMinutes && dup.totalMinutes
          ? Math.abs(canonical.totalMinutes - dup.totalMinutes) /
            Math.max(canonical.totalMinutes, dup.totalMinutes)
          : 0;
      const cA = canonical.averageCalories ?? 0;
      const cB = dup.averageCalories ?? 0;
      const calDiff = cA && cB ? Math.abs(cA - cB) / Math.max(cA, cB) : 0;
      const cls = classify(titleJ, ingJ, stepDiff, durationDiff, calDiff);
      analysis.push({
        cluster: c,
        duplicateSlug: dupSlug,
        duplicateTitle: dupTitle,
        canonical,
        duplicate: dup,
        titleJacc: titleJ,
        ingJacc: ingJ,
        stepDiff,
        durationDiff,
        calDiff,
        category: cls.category,
        reason: cls.reason,
      });
    }
  }

  // Markdown output
  const groups = {
    A_KESIN: analysis.filter((a) => a.category === "A_KESIN"),
    B_RISK: analysis.filter((a) => a.category === "B_RISK"),
    C_ATLA: analysis.filter((a) => a.category === "C_ATLA"),
  };

  const lines: string[] = [];
  lines.push(`# Mod I Batch ${batch} otomatik kategori raporu`);
  lines.push("");
  lines.push(`Toplam: ${analysis.length} duplicate onerisi`);
  lines.push(`- A_KESIN: ${groups.A_KESIN.length}`);
  lines.push(`- B_RISK: ${groups.B_RISK.length}`);
  lines.push(`- C_ATLA: ${groups.C_ATLA.length}`);
  lines.push("");

  for (const [name, list] of Object.entries(groups)) {
    lines.push(`## ${name} (${list.length})`);
    lines.push("");
    if (list.length === 0) {
      lines.push("(yok)");
      lines.push("");
      continue;
    }
    for (const a of list) {
      lines.push(
        `- \`${a.duplicateSlug}\` -> \`${a.cluster.canonicalSlug}\` ` +
          `[${a.cluster.cuisine}/${a.cluster.type}] ` +
          `titleJ=${a.titleJacc.toFixed(2)} ingJ=${a.ingJacc.toFixed(2)} ` +
          `step=${a.stepDiff} dur=${(a.durationDiff * 100).toFixed(0)}% ` +
          `cal=${(a.calDiff * 100).toFixed(0)}% [${a.reason}]`,
      );
    }
    lines.push("");
  }

  const outMd = path.resolve(process.cwd(), `docs/mod-i-batch-${batch}-classify.md`);
  fs.writeFileSync(outMd, lines.join("\n"));

  // Auto rollback list (A_KESIN only)
  const rollbackList = groups.A_KESIN.map((a) => a.duplicateSlug);
  const outTxt = path.resolve(
    process.cwd(),
    `docs/mod-i-batch-${batch}-auto-rollback.txt`,
  );
  fs.writeFileSync(
    outTxt,
    rollbackList.length > 0 ? rollbackList.join("\n") + "\n" : "",
  );

  console.log(`A_KESIN: ${groups.A_KESIN.length}`);
  console.log(`B_RISK:  ${groups.B_RISK.length}`);
  console.log(`C_ATLA:  ${groups.C_ATLA.length}`);
  console.log(`Yazildi: ${outMd}`);
  console.log(`Auto rollback list: ${outTxt} (${rollbackList.length} slug)`);

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
