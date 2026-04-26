/**
 * Mod IA Codex teslim sonrasi pair verify pipeline'i.
 * docs/mod-ia-batch-N.json'lardaki DUPLICATE pair'lari DB'ye karsi
 * dogrulayip kullaniciya kompakt karar listesi sunar.
 *
 * VARIANT atlanir. UNCERTAIN ayri bolumde gosterilir, kullanici manuel
 * karar verir.
 *
 * Cikti:
 *   - docs/mod-ia-verify-report.md (markdown rapor: DUPLICATE detay,
 *     UNCERTAIN listesi, VARIANT count)
 *   - docs/mod-ia-rollback.txt (DUPLICATE 'loser' slug listesi,
 *     rollback-batch.ts --slugs-file icin)
 *
 * Usage:
 *   npx tsx scripts/verify-mod-ia-pairs.ts
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

interface PairEntry {
  pair: [string, string];
  classification: "DUPLICATE" | "VARIANT" | "UNCERTAIN";
  winner?: string;
  loser?: string;
  reason: string;
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
  variationCount: number;
  cookedCount: number;
}

const STOP_WORDS = new Set([
  "ile", "ve", "icin", "bir", "tarifi", "usulu", "klasik",
  "the", "an", "of", "and", "with",
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

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const all: PairEntry[] = [];
  for (const n of [1, 2, 3]) {
    const data = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), `docs/mod-ia-batch-${n}.json`), "utf-8"),
    );
    for (const e of data) all.push(e as PairEntry);
  }
  console.log(`Toplam pair: ${all.length}`);

  // Slug evren topla
  const slugSet = new Set<string>();
  for (const e of all) {
    slugSet.add(e.pair[0]);
    slugSet.add(e.pair[1]);
  }
  const rows = await prisma.recipe.findMany({
    where: { slug: { in: [...slugSet] } },
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
          variations: true,
          cookedBy: true,
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
      variationCount: r._count.variations,
      cookedCount: r._count.cookedBy,
    });
  }

  const duplicates = all.filter((e) => e.classification === "DUPLICATE");
  const variants = all.filter((e) => e.classification === "VARIANT");
  const uncertains = all.filter((e) => e.classification === "UNCERTAIN");

  // Verify duplicates (metric)
  const verified: Array<{
    entry: PairEntry;
    winner: DbRecipe | null;
    loser: DbRecipe | null;
    titleJ: number;
    ingJ: number;
    stepDiff: number;
    calDiff: number;
    durationDiff: number;
    blockUserContent: string[];
  }> = [];

  for (const e of duplicates) {
    if (!e.winner || !e.loser) continue;
    const winner = map.get(e.winner) ?? null;
    const loser = map.get(e.loser) ?? null;
    if (!winner || !loser) {
      verified.push({
        entry: e,
        winner,
        loser,
        titleJ: 0,
        ingJ: 0,
        stepDiff: 0,
        calDiff: 0,
        durationDiff: 0,
        blockUserContent: [],
      });
      continue;
    }
    const tA = titleTokens(winner.title);
    const tB = titleTokens(loser.title);
    const titleJ = jaccard(tA, tB);
    const iA = new Set(winner.ingredients.map((x) => ingNormalize(x.name)).filter(Boolean));
    const iB = new Set(loser.ingredients.map((x) => ingNormalize(x.name)).filter(Boolean));
    const ingJ = jaccard(iA, iB);
    const stepDiff = Math.abs(winner.stepCount - loser.stepCount);
    const cA = winner.averageCalories ?? 0;
    const cB = loser.averageCalories ?? 0;
    const calDiff = cA && cB ? Math.abs(cA - cB) / Math.max(cA, cB) : 0;
    const dA = winner.totalMinutes;
    const dB = loser.totalMinutes;
    const durationDiff = dA && dB ? Math.abs(dA - dB) / Math.max(dA, dB) : 0;
    const blockUserContent: string[] = [];
    if (loser.variationCount > 0) blockUserContent.push(`${loser.variationCount} uyarlama`);
    if (loser.cookedCount > 0) blockUserContent.push(`${loser.cookedCount} pişirdi`);
    if (loser.isFeatured) blockUserContent.push("featured");
    verified.push({
      entry: e,
      winner,
      loser,
      titleJ,
      ingJ,
      stepDiff,
      calDiff,
      durationDiff,
      blockUserContent,
    });
  }

  // Markdown rapor
  const lines: string[] = [];
  lines.push(`# Mod IA verify raporu`);
  lines.push("");
  lines.push(`Toplam pair: ${all.length}`);
  lines.push(`- DUPLICATE: ${duplicates.length}`);
  lines.push(`- VARIANT (atla): ${variants.length}`);
  lines.push(`- UNCERTAIN (kullanici karari): ${uncertains.length}`);
  lines.push("");
  lines.push("## DUPLICATE (sil onerisi, dogrulanmis)");
  lines.push("");
  lines.push("| Sil | Canonical | titleJ | ingJ | stepΔ | durΔ | calΔ | User content |");
  lines.push("|---|---|---:|---:|---:|---:|---:|---|");
  const cleanLosers: string[] = [];
  for (const v of verified) {
    if (!v.winner || !v.loser) {
      lines.push(`| \`${v.entry.loser ?? "?"}\` | \`${v.entry.winner ?? "?"}\` | - | - | - | - | - | DB MISSING |`);
      continue;
    }
    const flag = v.blockUserContent.length > 0 ? `⚠️ ${v.blockUserContent.join(", ")}` : "ok";
    lines.push(
      `| \`${v.loser.slug}\` | \`${v.winner.slug}\` | ${v.titleJ.toFixed(2)} | ${v.ingJ.toFixed(2)} | ${v.stepDiff} | ${(v.durationDiff * 100).toFixed(0)}% | ${(v.calDiff * 100).toFixed(0)}% | ${flag} |`,
    );
    if (v.blockUserContent.length === 0) {
      cleanLosers.push(v.loser.slug);
    }
  }
  lines.push("");
  lines.push("## UNCERTAIN (kullanici karari)");
  lines.push("");
  for (const u of uncertains) {
    const a = map.get(u.pair[0]);
    const b = map.get(u.pair[1]);
    lines.push(
      `- \`${u.pair[0]}\` (${a ? `${a.ingredients.length}i/${a.stepCount}s/${a.totalMinutes}dk/${a.averageCalories}kcal` : "yok"})`,
    );
    lines.push(
      `  vs \`${u.pair[1]}\` (${b ? `${b.ingredients.length}i/${b.stepCount}s/${b.totalMinutes}dk/${b.averageCalories}kcal` : "yok"})`,
    );
    lines.push(`  ↳ ${u.reason}`);
  }
  lines.push("");
  lines.push("## VARIANT (atlandi)");
  lines.push("");
  lines.push(`Toplam ${variants.length} pair atlandi (gercek bolgesel/teknik varyant).`);

  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/mod-ia-verify-report.md"),
    lines.join("\n"),
  );
  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/mod-ia-rollback.txt"),
    cleanLosers.length > 0 ? cleanLosers.join("\n") + "\n" : "",
  );

  // Console summary
  console.log("");
  console.log(`DUPLICATE clean (user content yok, otomatik sil): ${cleanLosers.length}`);
  console.log(`DUPLICATE blocked (user content var, manuel): ${verified.length - cleanLosers.length}`);
  console.log(`UNCERTAIN: ${uncertains.length}`);
  console.log(`VARIANT atla: ${variants.length}`);
  console.log("");
  console.log(`Yazildi: docs/mod-ia-verify-report.md`);
  console.log(`Rollback list: docs/mod-ia-rollback.txt (${cleanLosers.length} slug)`);

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
