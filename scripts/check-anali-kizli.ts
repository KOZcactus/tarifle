/**
 * Spesifik pair audit: "Adana Analı Kızlı" / "Analı Kızlı" + benzer
 * cografi prefix'li TR pair'lerini DB'den getir.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const candidates = await prisma.recipe.findMany({
    where: {
      status: "PUBLISHED",
      OR: [
        { title: { contains: "analı kızlı", mode: "insensitive" } },
        { title: { contains: "anali kizli", mode: "insensitive" } },
        { slug: { contains: "anali-kizli" } },
      ],
    },
    select: {
      id: true,
      slug: true,
      title: true,
      cuisine: true,
      type: true,
      averageCalories: true,
      totalMinutes: true,
      _count: { select: { ingredients: true, steps: true } },
    },
  });

  console.log(`\n"Analı Kızlı" eşleşen ${candidates.length} tarif:\n`);
  for (const r of candidates) {
    console.log(
      `  ${r.title} [${r.slug}] (${r.cuisine}/${r.type}, ${r._count.ingredients}i/${r._count.steps}s, ${r.totalMinutes}dk, ${r.averageCalories ?? "?"}kcal)`,
    );
  }

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
