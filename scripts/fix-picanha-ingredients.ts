/**
 * Tek-seferlik fix (oturum 28): picanha tarifi nutrition matchedRatio=0
 * problemi. Ingredient adları NutritionData'da yok, eşleşme imkansız.
 *
 *   "Picanha dana eti" → "Dana eti (picanha)" (NutritionData 'dana eti'
 *      ile eşleşir, picanha disambiguator parantez içinde)
 *   "İri tuz" → "Tuz" (NutritionData 'tuz' eşleşmesi)
 *
 * Sonrasında compute-recipe-nutrition.ts ile recompute önerilir.
 *
 * Idempotent: zaten yeni ad varsa skip.
 *
 * Usage:
 *   npx tsx scripts/fix-picanha-ingredients.ts
 *   npx tsx scripts/fix-picanha-ingredients.ts --env prod --confirm-prod
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

const RENAMES: Array<{ from: string; to: string }> = [
  { from: "Picanha dana eti", to: "Dana eti (picanha)" },
  { from: "İri tuz", to: "Tuz" },
];

async function main(): Promise<void> {
  assertDbTarget("fix-picanha-ingredients");
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const recipe = await prisma.recipe.findUnique({
    where: { slug: "picanha" },
    select: {
      id: true,
      ingredients: { select: { id: true, name: true } },
    },
  });

  if (!recipe) {
    console.error("⚠️  picanha tarifi bulunamadı");
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;
  for (const rename of RENAMES) {
    const ing = recipe.ingredients.find((i) => i.name === rename.from);
    if (!ing) {
      const alreadyNew = recipe.ingredients.find((i) => i.name === rename.to);
      if (alreadyNew) {
        console.log(`⏭️  "${rename.from}" → "${rename.to}": zaten yeni ad, SKIP`);
        skipped += 1;
      } else {
        console.warn(`⚠️  "${rename.from}" bulunamadı, SKIP`);
        skipped += 1;
      }
      continue;
    }
    await prisma.recipeIngredient.update({
      where: { id: ing.id },
      data: { name: rename.to },
    });
    console.log(`✅ "${rename.from}" → "${rename.to}"`);
    updated += 1;
  }

  console.log("");
  console.log(`Updated: ${updated}, Skipped: ${skipped}`);
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
