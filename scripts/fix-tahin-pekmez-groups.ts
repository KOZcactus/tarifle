/**
 * Tek tarif manuel grup atama: tahin-pekmezli-nevzine-kup-kayseri-usulu.
 *
 * audit-content MISSING_GROUPS son 1 hit. Tarif kup format soğuk tatlı:
 * 5 ingredient (Bisküvi kırıntısı, Ceviz, Tahin, Üzüm pekmezi, Eritilmiş
 * tereyağı), iki bileşenli yapı (taban + sos).
 *
 * Manuel atama (kup tatlı yapısı):
 *   Bisküvi kırıntısı  → Taban için
 *   Eritilmiş tereyağı → Taban için
 *   Tahin              → Sos için
 *   Üzüm pekmezi       → Sos için
 *   Ceviz              → İç için (katlar arası)
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

const SLUG = "tahin-pekmezli-nevzine-kup-kayseri-usulu";
const MAPPING: Record<string, string> = {
  "Bisküvi kırıntısı": "Taban için",
  "Eritilmiş tereyağı": "Taban için",
  Tahin: "Sos için",
  "Üzüm pekmezi": "Sos için",
  Ceviz: "İç için",
};

async function main(): Promise<void> {
  await assertDbTarget("fix-tahin-pekmez-groups");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipe = await prisma.recipe.findUnique({
    where: { slug: SLUG },
    select: { id: true, ingredients: { select: { id: true, name: true, group: true } } },
  });
  if (!recipe) {
    console.error(`[fail] ${SLUG} not found`);
    process.exit(1);
  }

  let updated = 0;
  for (const ing of recipe.ingredients) {
    const target = MAPPING[ing.name];
    if (!target) {
      console.warn(`[skip] ${ing.name}: mapping yok`);
      continue;
    }
    if (ing.group === target) {
      console.log(`[skip] ${ing.name}: zaten '${target}'`);
      continue;
    }
    await prisma.recipeIngredient.update({
      where: { id: ing.id },
      data: { group: target },
    });
    await prisma.auditLog.create({
      data: {
        action: "INGREDIENT_GROUP_RETROFIT",
        targetType: "RecipeIngredient",
        targetId: ing.id,
        metadata: {
          recipeSlug: SLUG,
          ingredientName: ing.name,
          group: target,
          reason: "manuel atama, kup tatlısı yapısı (taban + sos + iç)",
        },
      },
    });
    console.log(`[ok] ${ing.name} → ${target}`);
    updated++;
  }
  console.log(`\nSUMMARY: ${updated} update`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
