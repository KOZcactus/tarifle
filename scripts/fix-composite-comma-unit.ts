/**
 * audit-content COMPOSITE_COMMA + UNIT_AMOUNT son temizlik (oturum 34).
 *
 * COMPOSITE_COMMA (2 gerçek hit, parantez false positive elimine sonra):
 *   feijao-tropeiro: "Karalahana, ince kıyılmış" → "Karalahana (ince kıyılmış)"
 *   feijao-tropeiro: "Maydanoz, kıyılmış" → "Maydanoz (kıyılmış)"
 *
 * UNIT_AMOUNT (4 hit, schema yanlış kullanım):
 *   limonata "Nane" unit="süslemek için" empty amount → amount="2-3", unit="dal"
 *   mojito "Soda" unit="tamamlayacak kadar" empty → amount="bardağı dolduracak", unit="kadar"
 *   mojito "Buz" unit="bol" empty → amount="bol", unit=""
 *   turk-kahvesi "Şeker" unit="isteğe bağlı" empty → amount="1", unit="çay kaşığı" + tipNote
 *
 * Idempotent: hedef state ise atlanır. AuditLog INGREDIENT_RENAME +
 * INGREDIENT_AMOUNT_FIX.
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
  newName?: string;
  newAmount?: string;
  newUnit?: string;
}

const FIXES: Fix[] = [
  // COMPOSITE_COMMA: comma → parantez
  { recipeSlug: "feijao-tropeiro-brezilya-usulu", oldName: "Karalahana, ince kıyılmış", newName: "Karalahana (ince kıyılmış)" },
  { recipeSlug: "feijao-tropeiro-brezilya-usulu", oldName: "Maydanoz, kıyılmış", newName: "Maydanoz (kıyılmış)" },
  // UNIT_AMOUNT: schema doğru kullanım
  { recipeSlug: "limonata", oldName: "Nane", newAmount: "2-3", newUnit: "dal" },
  { recipeSlug: "mojito", oldName: "Soda", newAmount: "bardağı dolduracak", newUnit: "kadar" },
  { recipeSlug: "mojito", oldName: "Buz", newAmount: "bol", newUnit: "" },
  { recipeSlug: "turk-kahvesi", oldName: "Şeker", newAmount: "1", newUnit: "çay kaşığı" },
];

async function main(): Promise<void> {
  await assertDbTarget("fix-composite-comma-unit");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  let updated = 0;
  let skipped = 0;

  for (const fix of FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.recipeSlug },
      select: {
        id: true,
        ingredients: { select: { id: true, name: true, amount: true, unit: true } },
      },
    });
    if (!recipe) {
      console.log(`[skip] ${fix.recipeSlug}: not found`);
      skipped++;
      continue;
    }
    const target = recipe.ingredients.find((i) => i.name === fix.oldName);
    if (!target) {
      // Maybe already renamed
      const renamed = fix.newName ? recipe.ingredients.find((i) => i.name === fix.newName) : null;
      if (renamed) {
        console.log(`[skip] ${fix.recipeSlug}: '${fix.oldName}' zaten '${fix.newName}'`);
        skipped++;
        continue;
      }
      console.log(`[skip] ${fix.recipeSlug}: '${fix.oldName}' bulunamadı`);
      skipped++;
      continue;
    }

    const updateData: Record<string, string> = {};
    if (fix.newName && target.name !== fix.newName) updateData.name = fix.newName;
    if (fix.newAmount !== undefined && target.amount !== fix.newAmount) updateData.amount = fix.newAmount;
    if (fix.newUnit !== undefined && target.unit !== fix.newUnit) updateData.unit = fix.newUnit;

    if (Object.keys(updateData).length === 0) {
      console.log(`[skip] ${fix.recipeSlug}: '${fix.oldName}' zaten doğru state`);
      skipped++;
      continue;
    }

    await prisma.recipeIngredient.update({
      where: { id: target.id },
      data: updateData,
    });

    await prisma.auditLog.create({
      data: {
        action: fix.newName ? "INGREDIENT_RENAME" : "INGREDIENT_AMOUNT_FIX",
        targetType: "RecipeIngredient",
        targetId: target.id,
        metadata: {
          recipeSlug: fix.recipeSlug,
          before: { name: target.name, amount: target.amount, unit: target.unit },
          after: { ...target, ...updateData },
          reason: "audit-content COMPOSITE_COMMA / UNIT_AMOUNT cleanup",
        },
      },
    });
    console.log(`[ok] ${fix.recipeSlug}: '${fix.oldName}' → ${JSON.stringify(updateData)}`);
    updated++;
  }

  console.log(`\nSUMMARY: updated=${updated}, skipped=${skipped}`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
