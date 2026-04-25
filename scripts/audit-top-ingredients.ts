/**
 * Top frequency ingredient'lari listele (oturum 20 Faz 2).
 * Mevcut NutritionData'da OLMAYAN top ingredient'lari oncelik sirasina
 * gore cikarir. Hand-curated USDA seed icin liste.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const limit = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "100", 10);

  const rows = (await prisma.$queryRawUnsafe(`
    SELECT LOWER(ri.name) AS name, COUNT(*)::int AS freq
    FROM recipe_ingredients ri
    LEFT JOIN nutrition_data nd ON LOWER(nd.name) = LOWER(ri.name)
    WHERE nd.id IS NULL
    GROUP BY LOWER(ri.name)
    ORDER BY freq DESC
    LIMIT ${limit}
  `)) as { name: string; freq: number }[];

  console.log("Top " + limit + " unmatched ingredient (NutritionData'da yok):");
  rows.forEach((r, i) => {
    console.log("  " + String(i + 1).padStart(3) + ". " + String(r.freq).padStart(4) + "x  " + r.name);
  });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
