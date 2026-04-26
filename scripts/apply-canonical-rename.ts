/**
 * Mod I sonrasi canonical slug + title rename uygulayicisi.
 * Kaynak: scripts/canonical-rename-list.json
 *
 * Her bir entry icin:
 *   1. Hedef proposedSlug DB'de var mi kontrol (catisma)
 *   2. Recipe.slug + Recipe.title update
 *   3. AuditLog kaydi (action=CANONICAL_RENAME)
 *
 * Kullanim:
 *   npx tsx scripts/apply-canonical-rename.ts                # dry-run
 *   npx tsx scripts/apply-canonical-rename.ts --apply         # dev
 *   npx tsx scripts/apply-canonical-rename.ts --apply --confirm-prod
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

interface RenameEntry {
  currentSlug: string;
  currentTitle: string;
  proposedSlug: string;
  proposedTitle: string;
  cuisine: string;
  type: string;
  reason: string;
}

async function main() {
  assertDbTarget("apply-canonical-rename");
  const APPLY = process.argv.includes("--apply");

  const listPath = path.resolve(process.cwd(), "scripts/canonical-rename-list.json");
  const entries: RenameEntry[] = JSON.parse(fs.readFileSync(listPath, "utf-8"));

  const databaseUrl = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  const prisma = new PrismaClient({ adapter });

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`Entries: ${entries.length}`);
  console.log("");

  let renamed = 0;
  let skipped = 0;
  let conflicts = 0;

  for (const e of entries) {
    const current = await prisma.recipe.findUnique({
      where: { slug: e.currentSlug },
      select: { id: true, slug: true, title: true },
    });
    if (!current) {
      console.log(`SKIP ${e.currentSlug} -> ${e.proposedSlug} (currentSlug DB'de yok)`);
      skipped++;
      continue;
    }
    const conflict = await prisma.recipe.findUnique({
      where: { slug: e.proposedSlug },
      select: { id: true },
    });
    if (conflict) {
      console.log(`CONFLICT ${e.currentSlug} -> ${e.proposedSlug} (proposedSlug zaten var, atla)`);
      conflicts++;
      continue;
    }
    if (!APPLY) {
      console.log(`DRY ${e.currentSlug} -> ${e.proposedSlug} | "${current.title}" -> "${e.proposedTitle}"`);
      continue;
    }
    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: current.id },
        data: {
          slug: e.proposedSlug,
          title: e.proposedTitle,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "CANONICAL_RENAME",
          targetType: "recipe",
          targetId: current.id,
          metadata: {
            oldSlug: e.currentSlug,
            newSlug: e.proposedSlug,
            oldTitle: current.title,
            newTitle: e.proposedTitle,
            reason: e.reason,
          },
        },
      });
    });
    renamed++;
    console.log(`OK ${e.currentSlug} -> ${e.proposedSlug}`);
  }

  console.log("");
  console.log(`Summary: ${renamed} renamed, ${skipped} skipped (not found), ${conflicts} conflict`);
  if (!APPLY) {
    console.log(`Dry-run, hicbir sey degismedi. --apply ile koş.`);
  }

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
