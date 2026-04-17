/**
 * Production safety net for Codex batch seeds. Deletes a named set of
 * recipes (plus their ingredients/steps/tags/bookmarks/collectionItems
 * via ON DELETE CASCADE) in a single transaction, logs each removal to
 * AuditLog, and refuses to touch anything that has user-generated
 * content attached (variations, videoJobs) unless `--force` is passed.
 *
 * Why this exists: `prisma migrate reset` or Prisma Studio both work,
 * but neither is scoped OR auditable. Codex pushes 50-500 rows at a
 * time; if a batch turns out bad, we need "delete exactly THESE slugs,
 * nothing else, leave an audit trail" to be one command.
 *
 * THREE input modes (pick one):
 *   --slugs "adana-kebap,lahmacun"           comma-separated inline
 *   --slugs-file rollback.txt                one slug per line
 *   --batch 2                                parse scripts/seed-recipes.ts
 *                                            for `// ── BATCH 2 ──`
 *                                            marker, extract slugs from
 *                                            that section
 *
 * SAFETY:
 *   - Default is DRY-RUN — prints what would be deleted + impact
 *     summary (variation count, bookmark count, etc.) and exits.
 *   - Real deletion requires `--confirm "rollback-batch-N"` literal
 *     echo-phrase matching the operation context.
 *   - Recipes with existing variations or videoJobs BLOCK by default.
 *     `--force` overrides (in practice: almost never; a fresh batch
 *     shouldn't have these yet).
 *
 * AUDIT:
 *   Each delete writes an `AuditLog` row (action=ROLLBACK_RECIPE,
 *   targetType=recipe, targetId=<id>, metadata={ slug, title, ... }).
 *
 * USAGE:
 *   # preview batch 2 rollback (dry-run)
 *   npx tsx scripts/rollback-batch.ts --batch 2
 *
 *   # actually delete (after reviewing preview)
 *   npx tsx scripts/rollback-batch.ts --batch 2 --confirm "rollback-batch-2"
 *
 *   # specific slugs
 *   npx tsx scripts/rollback-batch.ts --slugs "bad-recipe-a,bad-recipe-b" \
 *     --confirm "rollback-batch-manual"
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname2, "..", ".env") });

// ─── CLI parsing ─────────────────────────────────────────

interface Args {
  slugs: string[];
  confirm: string | null;
  force: boolean;
  /**
   * Expected form of `--confirm` to accept the operation, e.g.
   * "rollback-batch-2". Caller echoes this verbatim. Prevents someone
   * from accidentally mashing `--confirm yes` on the wrong batch.
   */
  expectedConfirm: string;
}

function parseArgs(argv: string[]): Args {
  let slugs: string[] = [];
  let confirm: string | null = null;
  let force = false;
  let expectedConfirm = "rollback-batch-manual";

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--slugs" && argv[i + 1]) {
      slugs = argv[i + 1]!
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      i++;
    } else if (a === "--slugs-file" && argv[i + 1]) {
      const filePath = argv[i + 1]!;
      slugs = readSlugsFile(filePath);
      i++;
    } else if (a === "--batch" && argv[i + 1]) {
      const n = argv[i + 1]!;
      slugs = extractBatchSlugsFromSeed(n);
      expectedConfirm = `rollback-batch-${n}`;
      i++;
    } else if (a === "--confirm" && argv[i + 1]) {
      confirm = argv[i + 1]!;
      i++;
    } else if (a === "--force") {
      force = true;
    }
  }

  return { slugs, confirm, force, expectedConfirm };
}

function readSlugsFile(filePath: string): string[] {
  const abs = path.resolve(filePath);
  const text = fs.readFileSync(abs, "utf-8");
  return text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#"));
}

/**
 * Reads scripts/seed-recipes.ts and extracts slugs from inside a
 * `// ── BATCH N ──` .. `// ── BATCH N SONU ──` (or next batch marker,
 * or end-of-array) block. Regex-level parse — no AST, no evaluation —
 * which is fragile if Codex abuses the format but falls through
 * harmlessly (returns 0 slugs) rather than deleting wrong things.
 */
export function extractBatchSlugsFromSeed(batch: string): string[] {
  const seedPath = path.resolve(__dirname2, "seed-recipes.ts");
  const text = fs.readFileSync(seedPath, "utf-8");
  const startRx = new RegExp(`//\\s*──\\s*BATCH\\s+${batch}\\s*──`, "i");
  const endRx = new RegExp(
    `//\\s*──\\s*(BATCH\\s+\\d+\\s*──|BATCH\\s+${batch}\\s+SONU\\s*──)`,
    "i",
  );
  const startMatch = startRx.exec(text);
  if (!startMatch) return [];
  const afterStart = text.slice(startMatch.index + startMatch[0].length);
  // Skip the start marker's own match when looking for an end marker;
  // `endRx` would otherwise match "BATCH 2 SONU" correctly but also an
  // adjacent "BATCH 3" header, whichever comes first.
  const endMatch = endRx.exec(afterStart);
  const region = endMatch
    ? afterStart.slice(0, endMatch.index)
    : afterStart;
  const slugRx = /slug:\s*"([a-z0-9-]+)"/g;
  const slugs: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = slugRx.exec(region)) !== null) {
    if (m[1]) slugs.push(m[1]);
  }
  return slugs;
}

// ─── Core impact analysis ────────────────────────────────

interface ImpactRow {
  slug: string;
  id: string | null;
  title: string | null;
  variationCount: number;
  bookmarkCount: number;
  collectionItemCount: number;
  videoJobCount: number;
  notFound: boolean;
  blocks: boolean;
  blockReason: string | null;
}

async function buildImpactReport(
  prisma: PrismaClient,
  slugs: string[],
): Promise<ImpactRow[]> {
  const rows: ImpactRow[] = [];
  for (const slug of slugs) {
    const r = await prisma.recipe.findUnique({
      where: { slug },
      select: {
        id: true,
        title: true,
        _count: {
          select: {
            variations: true,
            bookmarks: true,
            collectionItems: true,
            videoJobs: true,
          },
        },
      },
    });
    if (!r) {
      rows.push({
        slug,
        id: null,
        title: null,
        variationCount: 0,
        bookmarkCount: 0,
        collectionItemCount: 0,
        videoJobCount: 0,
        notFound: true,
        blocks: false,
        blockReason: null,
      });
      continue;
    }
    const variationCount = r._count.variations;
    const videoJobCount = r._count.videoJobs;
    const blocks = variationCount > 0 || videoJobCount > 0;
    rows.push({
      slug,
      id: r.id,
      title: r.title,
      variationCount,
      bookmarkCount: r._count.bookmarks,
      collectionItemCount: r._count.collectionItems,
      videoJobCount,
      notFound: false,
      blocks,
      blockReason: blocks
        ? [
            variationCount > 0 ? `${variationCount} uyarlama` : null,
            videoJobCount > 0 ? `${videoJobCount} video job` : null,
          ]
            .filter(Boolean)
            .join(", ")
        : null,
    });
  }
  return rows;
}

function printImpact(rows: ImpactRow[], force: boolean): void {
  console.log(`\n📋 Rollback kapsamı: ${rows.length} slug\n`);

  const notFound = rows.filter((r) => r.notFound);
  const blocked = rows.filter((r) => !r.notFound && r.blocks && !force);
  const ready = rows.filter(
    (r) => !r.notFound && (!r.blocks || force),
  );

  if (ready.length > 0) {
    console.log(`✅ Silinecek: ${ready.length} tarif`);
    for (const r of ready) {
      const side =
        r.bookmarkCount + r.collectionItemCount > 0
          ? ` (${r.bookmarkCount} bookmark + ${r.collectionItemCount} koleksiyon item cascade siliniyor)`
          : "";
      console.log(`   - ${r.title} (${r.slug})${side}`);
    }
  }

  if (blocked.length > 0) {
    console.log(`\n🚫 BLOKLU: ${blocked.length} tarif (user content var)`);
    for (const r of blocked) {
      console.log(`   - ${r.title} (${r.slug}) — ${r.blockReason}`);
    }
    console.log(
      `   --force ile zorlayabilirsin ama user içeriği kaybolur. Çok dikkatli ol.`,
    );
  }

  if (notFound.length > 0) {
    console.log(`\n⏭  Zaten yok: ${notFound.length} slug (skip)`);
    for (const r of notFound) console.log(`   - ${r.slug}`);
  }

  console.log();
}

// ─── Execution ──────────────────────────────────────────

async function executeRollback(
  prisma: PrismaClient,
  rows: ImpactRow[],
): Promise<number> {
  const toDelete = rows.filter((r) => !r.notFound && r.id);
  let deleted = 0;

  await prisma.$transaction(async (tx) => {
    for (const r of toDelete) {
      if (!r.id) continue;
      await tx.recipe.delete({ where: { id: r.id } });
      await tx.auditLog.create({
        data: {
          action: "ROLLBACK_RECIPE",
          targetType: "recipe",
          targetId: r.id,
          metadata: {
            slug: r.slug,
            title: r.title,
            bookmarksCascaded: r.bookmarkCount,
            collectionItemsCascaded: r.collectionItemCount,
            variationsDetached: r.variationCount,
            videoJobsDetached: r.videoJobCount,
          },
        },
      });
      deleted++;
    }
  });

  return deleted;
}

// ─── Main ────────────────────────────────────────────────

async function main(): Promise<void> {
  assertDbTarget("rollback-batch");
  const args = parseArgs(process.argv.slice(2));

  if (args.slugs.length === 0) {
    console.error(
      "❌ Hedef slug yok. --slugs, --slugs-file veya --batch N ile girdi ver.",
    );
    process.exit(1);
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL ortam değişkeni tanımlı değil.");
    process.exit(1);
  }

  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  try {
    const host = new URL(databaseUrl).host;
    console.log(`🔌 Bağlanılan DB host: ${host}`);

    const rows = await buildImpactReport(prisma, args.slugs);
    printImpact(rows, args.force);

    if (args.confirm === null) {
      console.log(
        `ℹ  Dry-run — veri silinmedi.\n` +
          `   Gerçekten silmek için: --confirm "${args.expectedConfirm}"${
            rows.some((r) => r.blocks) ? " --force" : ""
          }`,
      );
      return;
    }

    if (args.confirm !== args.expectedConfirm) {
      console.error(
        `❌ Confirm phrase eşleşmiyor.\n` +
          `   Beklenen: "${args.expectedConfirm}"\n` +
          `   Verilen:  "${args.confirm}"`,
      );
      process.exit(1);
    }

    const blockedWithoutForce = rows.filter(
      (r) => !r.notFound && r.blocks && !args.force,
    );
    if (blockedWithoutForce.length > 0) {
      console.error(
        `❌ ${blockedWithoutForce.length} tarif user content içeriyor ve --force verilmedi. İptal.`,
      );
      process.exit(1);
    }

    const deleted = await executeRollback(prisma, rows);
    console.log(`✅ ${deleted} tarif silindi, AuditLog kaydedildi.\n`);
  } finally {
    await prisma.$disconnect();
  }
}

const isEntrypoint =
  !!process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((err) => {
    console.error("❌ Rollback hatası:", err);
    process.exit(1);
  });
}
