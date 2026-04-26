import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
  const slugs = [
    "butter-chicken",
    "delhi-butter-chicken",
    "kayseri-yaglamasi-sebit",
    "kayseri-katli-yaglama-tavasi",
  ];
  const rows = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true,
      title: true,
      isFeatured: true,
      averageCalories: true,
      totalMinutes: true,
      description: true,
      tipNote: true,
      servingSuggestion: true,
      _count: {
        select: {
          ingredients: true,
          steps: true,
          bookmarks: true,
          variations: true,
          cookedBy: true,
        },
      },
    },
  });
  for (const r of rows) {
    console.log(`\n=== ${r.title} [${r.slug}] ===`);
    console.log(
      `  featured=${r.isFeatured}, ${r._count.ingredients}i/${r._count.steps}s, ${r.totalMinutes}dk, ${r.averageCalories}kcal`,
    );
    console.log(`  bookmarks=${r._count.bookmarks}, variations=${r._count.variations}, cookedBy=${r._count.cookedBy}`);
    console.log(`  desc: ${r.description.slice(0, 80)}...`);
  }
  await prisma.$disconnect();
}

main().catch(console.error);
