/**
 * Composite ingredient name fix (oturum 34, audit-content CRITICAL).
 *
 * Composite name pattern: "Şerbet suyu" gibi tek field içinde grup ön
 * eki + ingredient karışık yazılmış. Audit önerisi: name="suyu",
 * group="Şerbet için" şeklinde ayır. Helper modülü oturum 34'te
 * opsiyonel 4. group field eklendi (string format "name|amount|unit|group").
 *
 * 3 CRITICAL hit:
 *   - adana-karakus-tatlisi: "Şerbet suyu" → name=Su, group=Şerbet için
 *   - izmir-sambali: "Şerbet şekeri" → name=Şeker, group=Şerbet için
 *   - tokyo-shoyu-ramen: "Marine yumurta" → name=Yumurta, group=Marine için
 *
 * Idempotent: hedef name + group zaten varsa atlar. AuditLog action
 * INGREDIENT_RENAME.
 *
 * Usage: npx tsx scripts/fix-composite-ingredients.ts (DEV)
 *        npx tsx scripts/fix-composite-ingredients.ts --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const isProd = process.argv.includes("--confirm-prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

interface Fix {
  recipeSlug: string;
  oldName: string;
  newName: string;
  newGroup: string;
}

const FIXES: Fix[] = [
  { recipeSlug: "adana-karakus-tatlisi", oldName: "Şerbet suyu", newName: "Su", newGroup: "Şerbet için" },
  { recipeSlug: "izmir-sambali", oldName: "Şerbet şekeri", newName: "Şeker", newGroup: "Şerbet için" },
  { recipeSlug: "tokyo-shoyu-ramen", oldName: "Marine yumurta", newName: "Yumurta", newGroup: "Marine için" },
];

async function main(): Promise<void> {
  await assertDbTarget("fix-composite-ingredients");

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  let updated = 0;
  let skipped = 0;

  for (const fix of FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.recipeSlug },
      select: { id: true, ingredients: { select: { id: true, name: true, group: true } } },
    });
    if (!recipe) {
      console.warn(`[skip] ${fix.recipeSlug} not found`);
      skipped++;
      continue;
    }
    const target = recipe.ingredients.find((i) => i.name === fix.oldName);
    if (!target) {
      const alreadyDone = recipe.ingredients.find(
        (i) => i.name === fix.newName && i.group === fix.newGroup,
      );
      if (alreadyDone) {
        console.log(`[skip] ${fix.recipeSlug}: zaten name='${fix.newName}' group='${fix.newGroup}'`);
        skipped++;
        continue;
      }
      console.warn(`[skip] ${fix.recipeSlug}: '${fix.oldName}' bulunamadı`);
      skipped++;
      continue;
    }

    await prisma.recipeIngredient.update({
      where: { id: target.id },
      data: { name: fix.newName, group: fix.newGroup },
    });

    await prisma.auditLog.create({
      data: {
        action: "INGREDIENT_RENAME",
        targetType: "RecipeIngredient",
        targetId: target.id,
        metadata: {
          recipeSlug: fix.recipeSlug,
          before: { name: fix.oldName },
          after: { name: fix.newName, group: fix.newGroup },
          reason: "audit-content CRITICAL composite-name fix",
        },
      },
    });

    console.log(`[ok] ${fix.recipeSlug}: '${fix.oldName}' → name='${fix.newName}' group='${fix.newGroup}'`);
    updated++;
  }

  console.log(`\nSUMMARY: updated=${updated}, skipped=${skipped}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
