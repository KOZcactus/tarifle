/**
 * Mod I duplicate cluster verifier. Codex/ChatGPT'ten teslim edilen
 * docs/mod-i-batch-N.json dosyasındaki cluster önerilerini DB'ye karşı
 * deep verify eder.
 *
 * Her cluster için canonical ile her duplicate slug arasında:
 *  - title token Jaccard
 *  - ingredient name Jaccard
 *  - step count delta
 *  - totalMinutes delta yüzdesi
 *  - averageCalories delta yüzdesi
 *
 * Threshold etiketleme:
 *  - STRICT  (otomatik onay önerisi): titleJacc>=0.6 + ingJacc>=0.6
 *            + stepDiff<=2 + calDiff<=30%
 *  - LOOSE   (manuel review önerisi):  titleJacc>=0.3 + ingJacc>=0.5
 *            + stepDiff<=3 + calDiff<=40%
 *  - WEAK    (atla, varyant olabilir):
 *            yukarıdaki ikisini de geçemiyor
 *
 * Ek bayraklar:
 *  - confidence (json'da deklare edilen): high / medium / low
 *  - has user content (variation, bookmark, video job)
 *
 * Çıktı: docs/mod-i-batch-N-verify.md (markdown rapor) +
 *        docs/mod-i-batch-N-rollback.txt (sadece STRICT slug'ları,
 *        rollback-batch.ts --slugs-file için hazır)
 *
 * USAGE:
 *   npx tsx scripts/verify-mod-i-batch.ts --batch 1
 *   npx tsx scripts/verify-mod-i-batch.ts --json docs/mod-i-batch-1.json
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

interface Args {
  jsonPath: string;
  batchLabel: string;
  outDir: string;
}

function parseArgs(argv: string[]): Args {
  let jsonPath = "";
  let batchLabel = "";
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--batch" && argv[i + 1]) {
      batchLabel = argv[i + 1]!;
      jsonPath = path.resolve(
        process.cwd(),
        `docs/mod-i-batch-${batchLabel}.json`,
      );
      i++;
    } else if (a === "--json" && argv[i + 1]) {
      jsonPath = path.resolve(process.cwd(), argv[i + 1]!);
      const m = /mod-i-batch-(\w+)\.json/.exec(jsonPath);
      batchLabel = m?.[1] ?? "manual";
      i++;
    }
  }
  if (!jsonPath) {
    console.error("Hedef yok. --batch N veya --json path/to/file ver.");
    process.exit(1);
  }
  if (!fs.existsSync(jsonPath)) {
    console.error(`JSON dosya bulunamadi: ${jsonPath}`);
    process.exit(1);
  }
  const outDir = path.resolve(process.cwd(), "docs");
  return { jsonPath, batchLabel, outDir };
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
  cuisine: string | null;
  type: string;
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

interface PairResult {
  cluster: Cluster;
  canonical: DbRecipe | null;
  duplicate: DbRecipe | null;
  duplicateSlug: string;
  duplicateTitleJson: string;
  titleJacc: number;
  ingJacc: number;
  stepDiff: number;
  durationDiff: number;
  calDiff: number;
  sharedTitleTokens: string[];
  classification: "STRICT" | "LOOSE" | "WEAK" | "MISSING";
  hasUserContent: boolean;
  userContentNote: string;
}

function classifyPair(
  titleJ: number,
  ingJ: number,
  stepDiff: number,
  calDiff: number,
): "STRICT" | "LOOSE" | "WEAK" {
  if (titleJ >= 0.6 && ingJ >= 0.6 && stepDiff <= 2 && calDiff <= 0.3) {
    return "STRICT";
  }
  if (titleJ >= 0.3 && ingJ >= 0.5 && stepDiff <= 3 && calDiff <= 0.4) {
    return "LOOSE";
  }
  return "WEAK";
}

async function loadClusters(jsonPath: string): Promise<Cluster[]> {
  const text = fs.readFileSync(jsonPath, "utf-8");
  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed)) {
    throw new Error("Beklenen JSON array degil.");
  }
  return parsed as Cluster[];
}

function collectAllSlugs(clusters: Cluster[]): string[] {
  const set = new Set<string>();
  for (const c of clusters) {
    set.add(c.canonicalSlug);
    for (const d of c.duplicateSlugs) set.add(d);
  }
  return [...set];
}

async function fetchRecipes(
  prisma: PrismaClient,
  slugs: string[],
): Promise<Map<string, DbRecipe>> {
  const rows = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
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
      cuisine: r.cuisine,
      type: r.type as string,
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
  return map;
}

function buildPairs(
  clusters: Cluster[],
  map: Map<string, DbRecipe>,
): PairResult[] {
  const out: PairResult[] = [];
  for (const c of clusters) {
    const canonical = map.get(c.canonicalSlug) ?? null;
    for (let i = 0; i < c.duplicateSlugs.length; i++) {
      const dupSlug = c.duplicateSlugs[i]!;
      const dupTitleJson = c.duplicateTitles[i] ?? "?";
      const duplicate = map.get(dupSlug) ?? null;
      if (!canonical || !duplicate) {
        out.push({
          cluster: c,
          canonical,
          duplicate,
          duplicateSlug: dupSlug,
          duplicateTitleJson: dupTitleJson,
          titleJacc: 0,
          ingJacc: 0,
          stepDiff: 0,
          durationDiff: 0,
          calDiff: 0,
          sharedTitleTokens: [],
          classification: "MISSING",
          hasUserContent: false,
          userContentNote: "",
        });
        continue;
      }
      const tA = titleTokens(canonical.title);
      const tB = titleTokens(duplicate.title);
      const titleJ = jaccard(tA, tB);
      const sharedTitleTokens = [...tA].filter((x) => tB.has(x));
      const iA = new Set(
        canonical.ingredients.map((x) => ingNormalize(x.name)).filter(Boolean),
      );
      const iB = new Set(
        duplicate.ingredients.map((x) => ingNormalize(x.name)).filter(Boolean),
      );
      const ingJ = jaccard(iA, iB);
      const stepDiff = Math.abs(canonical.stepCount - duplicate.stepCount);
      const tA2 = canonical.totalMinutes;
      const tB2 = duplicate.totalMinutes;
      const durationDiff =
        tA2 && tB2 ? Math.abs(tA2 - tB2) / Math.max(tA2, tB2) : 0;
      const cA = canonical.averageCalories ?? 0;
      const cB = duplicate.averageCalories ?? 0;
      const calDiff =
        cA && cB ? Math.abs(cA - cB) / Math.max(cA, cB) : 0;
      const classification = classifyPair(titleJ, ingJ, stepDiff, calDiff);
      const userBlocks: string[] = [];
      if (duplicate.variationCount > 0) {
        userBlocks.push(`${duplicate.variationCount} uyarlama`);
      }
      if (duplicate.videoJobCount > 0) {
        userBlocks.push(`${duplicate.videoJobCount} video job`);
      }
      const hasUserContent = userBlocks.length > 0;
      out.push({
        cluster: c,
        canonical,
        duplicate,
        duplicateSlug: dupSlug,
        duplicateTitleJson: dupTitleJson,
        titleJacc: titleJ,
        ingJacc: ingJ,
        stepDiff,
        durationDiff,
        calDiff,
        sharedTitleTokens,
        classification,
        hasUserContent,
        userContentNote: userBlocks.join(", "),
      });
    }
  }
  return out;
}

function fmtPct(v: number): string {
  return `${(v * 100).toFixed(0)}%`;
}

function fmtRecipe(r: DbRecipe | null): string {
  if (!r) return "(bulunamadi)";
  const flag = r.isFeatured ? "⭐ " : "";
  return `${flag}${r.title} [${r.slug}] (${r.ingredients.length}i/${r.stepCount}s, ${r.totalMinutes}dk, ${r.averageCalories ?? "?"}kcal, ${r.bookmarkCount}🔖+${r.collectionItemCount}📁)`;
}

function buildMarkdown(
  args: Args,
  clusters: Cluster[],
  pairs: PairResult[],
): string {
  const lines: string[] = [];
  lines.push(`# Mod I Batch ${args.batchLabel} verify raporu`);
  lines.push("");
  lines.push(`Kaynak: \`${path.relative(process.cwd(), args.jsonPath)}\``);
  lines.push(`Cluster sayisi: ${clusters.length}`);
  lines.push(`Toplam duplicate slug onerisi: ${pairs.length}`);

  const byClass = {
    STRICT: pairs.filter((p) => p.classification === "STRICT"),
    LOOSE: pairs.filter((p) => p.classification === "LOOSE"),
    WEAK: pairs.filter((p) => p.classification === "WEAK"),
    MISSING: pairs.filter((p) => p.classification === "MISSING"),
  };
  const userBlocked = pairs.filter((p) => p.hasUserContent);

  lines.push("");
  lines.push("## Ozet");
  lines.push("");
  lines.push(`- STRICT (otomatik onay onerisi): **${byClass.STRICT.length}**`);
  lines.push(`- LOOSE (manuel review onerisi): **${byClass.LOOSE.length}**`);
  lines.push(`- WEAK (varyant olabilir, atlamak guvenli): **${byClass.WEAK.length}**`);
  lines.push(`- MISSING (DB'de yok): **${byClass.MISSING.length}**`);
  lines.push(`- User content blokeli: **${userBlocked.length}**`);
  lines.push("");

  for (const c of clusters) {
    lines.push(`---`);
    lines.push("");
    lines.push(`### [${c.cuisine}/${c.type}] Canonical: \`${c.canonicalSlug}\``);
    lines.push("");
    lines.push(`**Confidence (json):** ${c.confidence}`);
    lines.push(`**Reason:** ${c.reason}`);
    lines.push("");
    const canon = pairs.find((p) => p.cluster === c)?.canonical ?? null;
    lines.push(`**Canonical row:** ${fmtRecipe(canon)}`);
    lines.push("");
    const myPairs = pairs.filter((p) => p.cluster === c);
    for (const p of myPairs) {
      lines.push(`#### dup: \`${p.duplicateSlug}\``);
      if (p.classification === "MISSING") {
        if (!p.canonical) {
          lines.push(`- ❌ Canonical \`${c.canonicalSlug}\` DB'de yok.`);
        }
        if (!p.duplicate) {
          lines.push(`- ❌ Duplicate \`${p.duplicateSlug}\` DB'de yok (zaten silinmis olabilir).`);
        }
        lines.push("");
        continue;
      }
      const tag =
        p.classification === "STRICT"
          ? "✅ STRICT"
          : p.classification === "LOOSE"
            ? "⚠️ LOOSE"
            : "⛔ WEAK";
      lines.push(`- **${tag}**`);
      lines.push(`- DB row: ${fmtRecipe(p.duplicate)}`);
      lines.push(
        `- titleJacc=${p.titleJacc.toFixed(2)} ingJacc=${p.ingJacc.toFixed(2)} stepDiff=${p.stepDiff} durationDiff=${fmtPct(p.durationDiff)} calDiff=${fmtPct(p.calDiff)}`,
      );
      lines.push(
        `- shared title tokens: ${p.sharedTitleTokens.length > 0 ? p.sharedTitleTokens.join(", ") : "(yok)"}`,
      );
      if (p.hasUserContent) {
        lines.push(`- ⚠️ User content: ${p.userContentNote}`);
      }
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");
  lines.push("## Onay icin tavsiye");
  lines.push("");
  lines.push("**Otomatik onay (STRICT, user content yok):**");
  const autoApprove = byClass.STRICT.filter((p) => !p.hasUserContent);
  if (autoApprove.length === 0) {
    lines.push(`- (yok)`);
  } else {
    for (const p of autoApprove) {
      lines.push(`- \`${p.duplicateSlug}\` (canonical: \`${p.cluster.canonicalSlug}\`)`);
    }
  }
  lines.push("");
  lines.push("**Manuel review gerekli (LOOSE veya user content):**");
  const reviewList = [...byClass.LOOSE, ...byClass.STRICT.filter((p) => p.hasUserContent)];
  if (reviewList.length === 0) {
    lines.push(`- (yok)`);
  } else {
    for (const p of reviewList) {
      const why =
        p.classification === "LOOSE"
          ? "metric loose"
          : p.userContentNote;
      lines.push(`- \`${p.duplicateSlug}\` (${why})`);
    }
  }
  lines.push("");
  lines.push("**Atlanmasi onerilen (WEAK, muhtemel varyant):**");
  if (byClass.WEAK.length === 0) {
    lines.push(`- (yok)`);
  } else {
    for (const p of byClass.WEAK) {
      lines.push(`- \`${p.duplicateSlug}\``);
    }
  }
  lines.push("");
  return lines.join("\n");
}

function buildRollbackList(pairs: PairResult[]): string[] {
  return pairs
    .filter((p) => p.classification === "STRICT" && !p.hasUserContent)
    .map((p) => p.duplicateSlug);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL ortam degiskeni tanimli degil.");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const host = new URL(databaseUrl).host;
    console.log(`DB host: ${host}`);
    const clusters = await loadClusters(args.jsonPath);
    console.log(`Cluster sayisi: ${clusters.length}`);
    const allSlugs = collectAllSlugs(clusters);
    console.log(`Slug toplam (canonical + duplicate): ${allSlugs.length}`);
    const map = await fetchRecipes(prisma, allSlugs);
    console.log(`DB'de bulunan slug: ${map.size}`);
    const pairs = buildPairs(clusters, map);

    const md = buildMarkdown(args, clusters, pairs);
    const mdPath = path.resolve(
      args.outDir,
      `mod-i-batch-${args.batchLabel}-verify.md`,
    );
    fs.writeFileSync(mdPath, md);

    const rollbackSlugs = buildRollbackList(pairs);
    const rollbackPath = path.resolve(
      args.outDir,
      `mod-i-batch-${args.batchLabel}-rollback.txt`,
    );
    fs.writeFileSync(
      rollbackPath,
      rollbackSlugs.length > 0
        ? rollbackSlugs.join("\n") + "\n"
        : "# (STRICT slug yok)\n",
    );

    const counts = {
      STRICT: pairs.filter((p) => p.classification === "STRICT").length,
      LOOSE: pairs.filter((p) => p.classification === "LOOSE").length,
      WEAK: pairs.filter((p) => p.classification === "WEAK").length,
      MISSING: pairs.filter((p) => p.classification === "MISSING").length,
      UserContent: pairs.filter((p) => p.hasUserContent).length,
    };
    console.log("");
    console.log(`STRICT (auto-approve): ${counts.STRICT}`);
    console.log(`LOOSE  (manuel review): ${counts.LOOSE}`);
    console.log(`WEAK   (skip onerisi): ${counts.WEAK}`);
    console.log(`MISSING: ${counts.MISSING}`);
    console.log(`User content blokeli: ${counts.UserContent}`);
    console.log("");
    console.log(`Yazildi: ${mdPath}`);
    console.log(`Rollback list: ${rollbackPath} (${rollbackSlugs.length} slug)`);
  } finally {
    await prisma.$disconnect();
  }
}

const isEntrypoint =
  !!process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((err) => {
    console.error("Verify hatasi:", err);
    process.exit(1);
  });
}
