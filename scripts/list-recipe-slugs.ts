/**
 * Prints every existing recipe slug to stdout, one per line, alphabetical.
 *
 * Use this from the Codex machine before generating a new batch so the
 * assistant knows which slugs are already taken. Pipe into a file if you
 * want a snapshot:
 *
 *   npx tsx scripts/list-recipe-slugs.ts > docs/existing-slugs.txt
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { config } from "dotenv";

neonConfig.webSocketConstructor = ws;
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing from .env.local");
  process.exit(1);
}
const adapter = new PrismaNeon({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const recipes = await prisma.recipe.findMany({
    select: { slug: true, title: true, categoryId: true },
    orderBy: { slug: "asc" },
  });

  console.log(`# ${recipes.length} recipe slugs (as of ${new Date().toISOString().slice(0, 10)})\n`);
  for (const r of recipes) {
    console.log(r.slug);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
