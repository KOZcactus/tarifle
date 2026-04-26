/**
 * Mod M (Marine) apply pipeline: Codex teslim sonrasi verify PASS olan
 * entry'leri DB'ye uygular.
 *
 * Her entry icin:
 *   1. recipe.totalMinutes = prepMinutes + cookMinutes + marineMinutes
 *   2. recipe.tipNote = mevcut + " " + tipNote_addition (varsa)
 *   3. AuditLog kaydi (action=MARINE_APPLY)
 *
 * SKIP entry'leri ve issue olan entry'leri (verify-mod-m-pairs.ts BLOCKED)
 * atlar. Idempotent: aynicikti totalMinutes/tipNote ile yeniden koşturma
 * sorun cikarmaz (audit log her seferinde yazilir; istenirse --skip-existing-
 * audit ile suppress edilebilir, simdilik eklenmedi).
 *
 * Source seed-recipes.ts senkronu BU scriptte YAPILMAZ. Mod I/IB/IA
 * pattern'i ile ayri scripts (rename-source-slugs / smart-source-clean)
 * gibi sonradan calisir; bu scriptin kapsami DB update + AuditLog.
 *
 * Usage:
 *   npx tsx scripts/apply-mod-m-batch.ts                       # dry-run
 *   npx tsx scripts/apply-mod-m-batch.ts --apply               # dev
 *   npx tsx scripts/apply-mod-m-batch.ts --apply --confirm-prod
 *   npx tsx scripts/apply-mod-m-batch.ts --batch 1 --apply     # tek batch
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname2, "..", ".env") });

interface MarineEntry {
  slug: string;
  marineMinutes?: number;
  marineDescription?: string;
  tipNote_addition?: string;
  sources?: string[];
  confidence?: "high" | "medium" | "low";
  reason?: string;
  classification?: "SKIP";
}

const MARINE_MIN_MINUTES = 5;
const MARINE_MAX_MINUTES = 10080;

function parseBatchArg(): number[] | null {
  const idx = process.argv.indexOf("--batch");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1]
    .split(",")
    .map((s) => Number.parseInt(s.trim(), 10))
    .filter((n) => Number.isFinite(n) && n > 0);
}

function discoverBatchFiles(filter: number[] | null): string[] {
  const docsDir = path.resolve(process.cwd(), "docs");
  const all = fs
    .readdirSync(docsDir)
    .filter((f) => /^mod-m-batch-\d+\.json$/.test(f))
    .sort();
  if (!filter) return all.map((f) => path.join(docsDir, f));
  const set = new Set(filter);
  return all
    .filter((f) => {
      const m = f.match(/^mod-m-batch-(\d+)\.json$/);
      return m && set.has(Number.parseInt(m[1], 10));
    })
    .map((f) => path.join(docsDir, f));
}

function entryIsApplyable(e: MarineEntry): boolean {
  if (e.classification === "SKIP") return false;
  if (typeof e.marineMinutes !== "number") return false;
  if (e.marineMinutes < MARINE_MIN_MINUTES || e.marineMinutes > MARINE_MAX_MINUTES) return false;
  if (!Array.isArray(e.sources) || e.sources.length < 2) return false;
  if (!e.confidence) return false;
  return true;
}

function mergeTipNote(existing: string | null, addition: string | undefined): string {
  const base = (existing ?? "").trim();
  const add = (addition ?? "").trim();
  if (!add) return base;
  if (!base) return add;
  // Idempotent: addition zaten icinde varsa tekrarlama
  if (base.includes(add)) return base;
  return `${base} ${add}`;
}

async function main() {
  assertDbTarget("apply-mod-m-batch");
  const APPLY = process.argv.includes("--apply");

  const url = process.env.DATABASE_URL!;
  if (!url) {
    console.error("DATABASE_URL yok");
    process.exit(1);
  }
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);

  const filter = parseBatchArg();
  const files = discoverBatchFiles(filter);
  if (files.length === 0) {
    console.error("docs/mod-m-batch-N.json bulunamadi");
    await prisma.$disconnect();
    process.exit(1);
  }

  const all: MarineEntry[] = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(f, "utf-8"));
    if (!Array.isArray(data)) continue;
    for (const e of data) all.push(e as MarineEntry);
  }
  const applyable = all.filter(entryIsApplyable);
  console.log(`Toplam entry: ${all.length}, applyable: ${applyable.length}`);
  console.log("");

  let updated = 0;
  let skipped = 0;
  let notFound = 0;
  let blocked = 0;

  for (const e of applyable) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: e.slug },
      select: {
        id: true,
        slug: true,
        prepMinutes: true,
        cookMinutes: true,
        totalMinutes: true,
        tipNote: true,
        status: true,
      },
    });
    if (!recipe) {
      console.log(`NOT_FOUND ${e.slug}`);
      notFound++;
      continue;
    }
    if (recipe.status !== "PUBLISHED") {
      console.log(`BLOCKED ${e.slug} (status=${recipe.status})`);
      blocked++;
      continue;
    }
    const newTotal = recipe.prepMinutes + recipe.cookMinutes + (e.marineMinutes ?? 0);
    if (newTotal > MARINE_MAX_MINUTES) {
      console.log(`BLOCKED ${e.slug} (newTotal ${newTotal} > ${MARINE_MAX_MINUTES})`);
      blocked++;
      continue;
    }
    const newTipNote = mergeTipNote(recipe.tipNote, e.tipNote_addition);
    const noChange =
      recipe.totalMinutes === newTotal && recipe.tipNote === newTipNote;
    if (noChange) {
      console.log(`SKIP ${e.slug} (zaten guncel)`);
      skipped++;
      continue;
    }
    if (!APPLY) {
      console.log(
        `DRY ${e.slug} | total ${recipe.totalMinutes} -> ${newTotal} | tipNote ${recipe.tipNote ? "MERGE" : "SET"}`,
      );
      continue;
    }
    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: recipe.id },
        data: {
          totalMinutes: newTotal,
          tipNote: newTipNote,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "MARINE_APPLY",
          targetType: "recipe",
          targetId: recipe.id,
          metadata: {
            slug: e.slug,
            oldTotalMinutes: recipe.totalMinutes,
            newTotalMinutes: newTotal,
            marineMinutes: e.marineMinutes,
            marineDescription: e.marineDescription ?? null,
            tipNote_addition: e.tipNote_addition ?? null,
            sources: e.sources ?? [],
            confidence: e.confidence ?? null,
            reason: e.reason ?? null,
          },
        },
      });
    });
    updated++;
    console.log(`OK ${e.slug} (total ${recipe.totalMinutes} -> ${newTotal})`);
  }

  console.log("");
  console.log(`Summary: ${updated} updated, ${skipped} idempotent, ${notFound} not_found, ${blocked} blocked`);
  if (!APPLY) {
    console.log(`Dry-run. --apply ile DB'ye yaz.`);
  }
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
