/**
 * Mod IB Codex teslim sonrasi pair verify pipeline.
 * docs/mod-ib-batch-{1,2}.json'lardaki DUPLICATE pair'lari DB'ye karsi
 * dogrula. swap_canonical=true olanlari "MANUAL_REVIEW" markasiyla ayir
 * (butter-chicken gibi featured + global slug durumlari, kullanici karari).
 *
 * Cikti:
 *   - docs/mod-ib-verify-report.md
 *   - docs/mod-ib-rollback.txt (auto-clean DUPLICATE loser slug listesi)
 *   - docs/mod-ib-manual-review.md (swap_canonical + user content blocked)
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
  classification: "DUPLICATE" | "VARIANT" | "ATLA";
  winner?: string;
  loser?: string;
  swap_canonical?: boolean;
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
  for (const n of [1, 2]) {
    const data = JSON.parse(
      fs.readFileSync(path.resolve(process.cwd(), `docs/mod-ib-batch-${n}.json`), "utf-8"),
    );
    for (const e of data) all.push(e as PairEntry);
  }
  console.log(`Toplam pair: ${all.length}`);

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
  const atlas = all.filter((e) => e.classification === "ATLA");

  const cleanLosers: string[] = [];
  const blockedManual: Array<{ entry: PairEntry; reason: string }> = [];
  const verifyDetail: string[] = [];
  verifyDetail.push("# Mod IB verify raporu");
  verifyDetail.push("");
  verifyDetail.push(`Toplam pair: ${all.length}`);
  verifyDetail.push(`- DUPLICATE: ${duplicates.length}`);
  verifyDetail.push(`- VARIANT (atla): ${variants.length}`);
  verifyDetail.push(`- ATLA (belirsiz): ${atlas.length}`);
  verifyDetail.push("");
  verifyDetail.push("## DUPLICATE detay (auto-clean / blocked)");
  verifyDetail.push("");
  verifyDetail.push("| Sil | Canonical | swap | titleJ | ingJ | stepΔ | calΔ | Block sebep |");
  verifyDetail.push("|---|---|:---:|---:|---:|---:|---:|---|");

  for (const e of duplicates) {
    if (!e.winner || !e.loser) {
      blockedManual.push({ entry: e, reason: "winner/loser eksik" });
      continue;
    }
    const winner = map.get(e.winner);
    const loser = map.get(e.loser);
    if (!winner || !loser) {
      verifyDetail.push(
        `| \`${e.loser}\` | \`${e.winner}\` | - | - | - | - | - | DB MISSING |`,
      );
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
    const blocks: string[] = [];
    if (e.swap_canonical) blocks.push("swap_canonical");
    if (loser.variationCount > 0) blocks.push(`${loser.variationCount} uyarlama`);
    if (loser.cookedCount > 0) blocks.push(`${loser.cookedCount} cooked`);
    if (loser.isFeatured) blocks.push("featured");
    const blocked = blocks.length > 0;

    verifyDetail.push(
      `| \`${loser.slug}\` | \`${winner.slug}\` | ${e.swap_canonical ? "🔄" : ""} | ${titleJ.toFixed(2)} | ${ingJ.toFixed(2)} | ${stepDiff} | ${(calDiff * 100).toFixed(0)}% | ${blocked ? blocks.join(", ") : "ok"} |`,
    );
    if (blocked) {
      blockedManual.push({ entry: e, reason: blocks.join(", ") });
    } else {
      cleanLosers.push(loser.slug);
    }
  }

  verifyDetail.push("");
  verifyDetail.push(`## Manuel review (${blockedManual.length} pair)`);
  verifyDetail.push("");
  for (const b of blockedManual) {
    verifyDetail.push(
      `- \`${b.entry.loser}\` → \`${b.entry.winner}\` ${b.entry.swap_canonical ? "🔄 SWAP" : ""} (${b.reason})`,
    );
    verifyDetail.push(`  ↳ ${b.entry.reason}`);
  }
  verifyDetail.push("");
  verifyDetail.push(`## VARIANT (atlandi)`);
  verifyDetail.push("");
  verifyDetail.push(`Toplam ${variants.length} pair atlandi.`);

  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/mod-ib-verify-report.md"),
    verifyDetail.join("\n"),
  );
  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/mod-ib-rollback.txt"),
    cleanLosers.length > 0 ? cleanLosers.join("\n") + "\n" : "",
  );

  console.log("");
  console.log(`DUPLICATE auto-clean (sil): ${cleanLosers.length}`);
  console.log(`DUPLICATE manual review: ${blockedManual.length}`);
  console.log(`VARIANT atla: ${variants.length}`);
  console.log(`ATLA: ${atlas.length}`);
  console.log("");
  console.log(`Yazildi: docs/mod-ib-verify-report.md`);
  console.log(`Rollback: docs/mod-ib-rollback.txt (${cleanLosers.length} slug)`);

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
