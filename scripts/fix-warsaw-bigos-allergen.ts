/**
 * One-shot: warsaw-bigos GLUTEN over-tag geri al ([] yap).
 * allergen-source-guard kielbasa için implicit gluten yakalayamıyor.
 */
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import { assertDbTarget } from "./lib/db-env";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local") });

async function main() {
  assertDbTarget("fix-warsaw-bigos-allergen");
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
  const recipe = await prisma.recipe.findUnique({ where: { slug: "warsaw-bigos" }, select: { id: true, allergens: true } });
  if (!recipe) {
    console.log("warsaw-bigos not found");
    await prisma.$disconnect();
    return;
  }
  console.log("Before:", recipe.allergens);
  await prisma.recipe.update({ where: { id: recipe.id }, data: { allergens: [] } });
  const after = await prisma.recipe.findUnique({ where: { slug: "warsaw-bigos" }, select: { allergens: true } });
  console.log("After:", after?.allergens);
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
