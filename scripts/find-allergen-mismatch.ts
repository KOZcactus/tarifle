import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { computeAllergenConfidence } from "@/lib/recipe/allergen-confidence";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      allergens: true,
      ingredients: { select: { name: true } },
    },
  });
  const extraInf: { slug: string; title: string; extra: string[] }[] = [];
  const extraDec: { slug: string; title: string; extra: string[] }[] = [];
  for (const r of recipes) {
    const c = computeAllergenConfidence(r.allergens, r.ingredients);
    if (c.extraInferred.length > 0) {
      extraInf.push({ slug: r.slug, title: r.title, extra: c.extraInferred });
    }
    if (c.extraDeclared.length > 0) {
      extraDec.push({ slug: r.slug, title: r.title, extra: c.extraDeclared });
    }
  }
  console.log(`Total: ${recipes.length}`);
  console.log(`Extra inferred (potential missing tag): ${extraInf.length}`);
  console.log(extraInf.slice(0, 5));
  console.log(`Extra declared (matcher cannot find): ${extraDec.length}`);
  console.log(extraDec.slice(0, 5));
  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
