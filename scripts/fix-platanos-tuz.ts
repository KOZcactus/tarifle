/**
 * Tek tarif ingredient ek: platanos-maduros-fritos.
 *
 * audit-content INGREDIENT_COUNT son 1 hit (oturum 34). Tarif Karayipler
 * tarzı kızarmış olgun muz, klasik formülde 'Tuz' (1 tutam, servis için)
 * minimum 3. ingredient olarak yer alır. Mevcut 2 ingredient (Olgun muz,
 * Ayçiçek yağı) → 3 ingredient.
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

async function main(): Promise<void> {
  await assertDbTarget("fix-platanos-tuz");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipe = await prisma.recipe.findUnique({
    where: { slug: "platanos-maduros-fritos" },
    select: { id: true, ingredients: { select: { name: true, sortOrder: true } } },
  });
  if (!recipe) {
    console.error("[fail] platanos-maduros-fritos not found");
    process.exit(1);
  }

  if (recipe.ingredients.some((i) => i.name.toLowerCase() === "tuz")) {
    console.log("[skip] Tuz zaten mevcut");
    await prisma.$disconnect();
    return;
  }

  const maxSort = recipe.ingredients.reduce((m, i) => Math.max(m, i.sortOrder), 0);
  const created = await prisma.recipeIngredient.create({
    data: {
      recipeId: recipe.id,
      name: "Tuz",
      amount: "1",
      unit: "çimdik",
      sortOrder: maxSort + 1,
    },
  });

  await prisma.auditLog.create({
    data: {
      action: "INGREDIENT_RETROFIT",
      targetType: "RecipeIngredient",
      targetId: created.id,
      metadata: {
        recipeSlug: "platanos-maduros-fritos",
        added: { name: "Tuz", amount: "1", unit: "çimdik" },
        reason: "audit-content INGREDIENT_COUNT: klasik Karayipler servis tuzu",
      },
    },
  });

  console.log("[ok] platanos-maduros-fritos: +Tuz (1 çimdik, servis için)");
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
