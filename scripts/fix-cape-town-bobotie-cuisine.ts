/**
 * Tek-seferlik manuel duzeltme (oturum 25): cape-town-mercimek-bobotie
 * tarifinin cuisine alanini 'gb' (Ingiliz) yerine 'za' (Guney Afrika)
 * yap. Codex Mod K Batch 5b v2'de bu MAJOR_ISSUE'da cuisine mapping
 * gap'ini explicit isaret etti; CUISINE_CODES'a 'za' eklendi.
 *
 * Idempotent: cuisine zaten 'za' ise SKIP.
 *
 * Usage:
 *   npx tsx scripts/fix-cape-town-bobotie-cuisine.ts
 *   npx tsx scripts/fix-cape-town-bobotie-cuisine.ts --env prod --confirm-prod
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

async function main() {
  assertDbTarget("fix-cape-town-bobotie-cuisine");
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const slug = "cape-town-mercimek-bobotie";
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: { id: true, cuisine: true },
  });
  if (!recipe) {
    console.error(`${slug} bulunamadı`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log(`Mevcut cuisine: ${recipe.cuisine}`);
  if (recipe.cuisine === "za") {
    console.log("Zaten 'za', SKIP");
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.recipe.update({
      where: { id: recipe.id },
      data: { cuisine: "za" },
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
          new: { cuisine: "za" },
          reason:
            "Mod K Batch 5b v2 MAJOR_ISSUE: cape-town-bobotie Guney Afrika yemegi, 'gb' yaniltici. CUISINE_CODES'a 'za' eklendi (oturum 25, 35 -> 36 cuisine).",
        },
      },
    });
  });

  console.log("✅ Updated: cuisine 'gb' -> 'za' (Guney Afrika)");
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
