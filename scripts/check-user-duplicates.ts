/**
 * Kullanicinin verdigi spesifik duplicate'leri DB'den teyit et:
 * ANZAC, Afyon Patatesli Bukme, Afyon Patates Asi, Ali Nazik,
 * Alfajores, Amasya Baklali Dolma, Antalya Hibes.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const QUERIES = [
  "ANZAC",
  "Afyon Patatesli Bükme",
  "Afyon Patates Aşı",
  "Ali Nazik",
  "Alfajores",
  "Amasya Baklalı Dolma",
  "Antalya Hibeş",
  "Anticucho",
];

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  for (const q of QUERIES) {
    const rows = await prisma.recipe.findMany({
      where: {
        status: "PUBLISHED",
        title: { contains: q, mode: "insensitive" },
      },
      select: {
        slug: true,
        title: true,
        cuisine: true,
        type: true,
        totalMinutes: true,
        averageCalories: true,
        isFeatured: true,
        _count: { select: { ingredients: true, steps: true } },
      },
    });
    console.log(`══ "${q}" → ${rows.length} match ══`);
    rows.forEach((r) => {
      const star = r.isFeatured ? "⭐" : "  ";
      console.log(
        `  ${star} [${r.slug}] "${r.title}" (${r.cuisine ?? "?"}, ${r.type}, ${r._count.ingredients}ing/${r._count.steps}step, ${r.totalMinutes}dk, ${r.averageCalories ?? "?"}kcal)`,
      );
    });
    console.log("");
  }

  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
