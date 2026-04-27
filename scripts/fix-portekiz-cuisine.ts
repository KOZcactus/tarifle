/**
 * Tek-seferlik manuel duzeltme (oturum 27): Portekiz tariflerinin
 * cuisine alanini 'es' (Ispanyol) yerine 'pt' (Portekiz) yap.
 *
 * Codex Mod K Batch 19b v2'de 2 MAJOR_ISSUE'da bu cuisine mapping
 * gap'ini explicit isaret etti, ama 'pt' CUISINE_CODES'da olmadigi
 * icin otomatik fix yapamadi. CUISINE_CODES'a 'pt' eklendi (oturum
 * 27, 36 -> 37 cuisine), bu script o iki tarifi DB'de duzeltiyor.
 *
 * Tarifler:
 * - lisbon-nohutlu-morina-salatasi (Portekiz bacalhau salatasi)
 * - lizbon-portakalli-badem-keki (Lizbon klasigi)
 *
 * Idempotent: cuisine zaten 'pt' ise SKIP.
 *
 * Usage:
 *   npx tsx scripts/fix-portekiz-cuisine.ts
 *   npx tsx scripts/fix-portekiz-cuisine.ts --env prod --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const envIdx = process.argv.indexOf("--env");
const envTarget = envIdx >= 0 && process.argv[envIdx + 1] === "prod" ? "prod" : "dev";
const envFile = envTarget === "prod" ? ".env.production.local" : ".env.local";
dotenv.config({
  path: path.resolve(__dirname2, "..", envFile),
  override: true,
});

const SLUGS = [
  "lisbon-nohutlu-morina-salatasi",
  "lizbon-portakalli-badem-keki",
] as const;

async function main(): Promise<void> {
  assertDbTarget("fix-portekiz-cuisine");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const slug of SLUGS) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug },
      select: { id: true, cuisine: true },
    });
    if (!recipe) {
      console.error(`⚠️  ${slug}: bulunamadi`);
      notFound += 1;
      continue;
    }

    console.log(`${slug}: mevcut cuisine = ${recipe.cuisine ?? "(null)"}`);
    if (recipe.cuisine === "pt") {
      console.log(`⏭️  ${slug}: zaten 'pt', SKIP`);
      skipped += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: recipe.id },
        data: { cuisine: "pt" },
      });
      await tx.auditLog.create({
        data: {
          action: "MOD_K_CUISINE_FIX",
          userId: null,
          targetType: "Recipe",
          targetId: recipe.id,
          metadata: {
            slug,
            old: { cuisine: recipe.cuisine },
            new: { cuisine: "pt" },
            reason:
              "Mod K Batch 19b v2 MAJOR_ISSUE: Portekiz tarifi 'es' (Ispanyol) yaniltici, gercek 'pt'. CUISINE_CODES'a 'pt' eklendi (oturum 27, 36 -> 37 cuisine).",
          },
        },
      });
    });

    console.log(`✅ ${slug}: cuisine '${recipe.cuisine}' -> 'pt'`);
    updated += 1;
  }

  console.log("");
  console.log(`Summary: ${updated} updated, ${skipped} idempotent, ${notFound} not_found`);
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
