/**
 * Top frequency ingredient'lari listele (oturum 20 Faz 2, oturum 21 TR-fold).
 * Mevcut NutritionData'da OLMAYAN top ingredient'lari oncelik sirasina
 * gore cikarir. Hand-curated USDA seed icin liste.
 *
 * TR-aware fold (ı↔i, ş↔s, ç↔c, ğ↔g, ü↔u, ö↔o) compute pipeline ile ayni
 * mantik kullanir; gercek gap'i gosterir.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { asciiFold } from "../src/lib/nutrition/unit-convert";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const limit = parseInt(process.argv.find((a) => a.startsWith("--limit="))?.split("=")[1] ?? "100", 10);

  const ingRows = (await prisma.$queryRawUnsafe(`
    SELECT LOWER(name) AS name, COUNT(*)::int AS freq
    FROM recipe_ingredients
    GROUP BY LOWER(name)
    ORDER BY freq DESC
  `)) as { name: string; freq: number }[];

  const seeded = (await prisma.$queryRawUnsafe(`
    SELECT LOWER(name) AS name FROM nutrition_data
  `)) as { name: string }[];

  const seededFolded = new Set(seeded.map((r) => asciiFold(r.name.trim())));
  const unmatched = ingRows.filter(
    (r) => !seededFolded.has(asciiFold(r.name.trim())),
  );

  console.log(
    "Top " +
      limit +
      " unmatched ingredient (TR-fold sonrasi NutritionData'da YOK):",
  );
  unmatched.slice(0, limit).forEach((r, i) => {
    console.log(
      "  " +
        String(i + 1).padStart(3) +
        ". " +
        String(r.freq).padStart(4) +
        "x  " +
        r.name,
    );
  });
  console.log(
    "\nToplam farkli ingredient: " +
      ingRows.length +
      ", esleşen: " +
      (ingRows.length - unmatched.length) +
      ", unmatched: " +
      unmatched.length,
  );
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
