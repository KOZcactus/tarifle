import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const slug = process.argv[2];
  if (!slug) {
    console.error("Kullanim: npx tsx scripts/inspect-recipe.ts <slug>");
    process.exit(1);
  }
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: {
      title: true,
      tipNote: true,
      servingSuggestion: true,
      ingredients: { select: { name: true, amount: true, unit: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      steps: { select: { stepNumber: true, instruction: true }, orderBy: { stepNumber: "asc" } },
    },
  });
  if (!recipe) {
    console.error("Tarif yok:", slug);
    process.exit(1);
  }
  console.log("=== TARIF ===");
  console.log("Title:", recipe.title);
  console.log("\n=== INGREDIENTS ===");
  recipe.ingredients.forEach((i) => console.log(`  ${i.sortOrder}. ${i.name} | ${i.amount} ${i.unit ?? ""}`));
  console.log("\n=== STEPS ===");
  recipe.steps.forEach((s) => console.log(`  ${s.stepNumber}. ${s.instruction}`));
  console.log("\n=== TIP / SERV ===");
  console.log("Tip:", recipe.tipNote);
  console.log("Serv:", recipe.servingSuggestion);
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
