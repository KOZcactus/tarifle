/**
 * Move 3 CORBA-typed recipes from "baklagil-yemekleri" to "corbalar".
 * These are traditional legume soups (bissara, caldo de feijão, jókai
 * bableves) — naturally both legume dishes and soups, but "corbalar"
 * matches the type better for discovery.
 *
 *   npx tsx scripts/fix-corba-categories.ts              # dry run
 *   npx tsx scripts/fix-corba-categories.ts --apply      # write
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

const SLUGS = ["bissara", "caldo-de-feijao", "jokai-bableves"];

async function main(): Promise<void> {
  console.log(
    `🔧 fix-corba-categories (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const corbalar = await prisma.category.findUnique({
    where: { slug: "corbalar" },
    select: { id: true, slug: true },
  });
  if (!corbalar) {
    console.error("❌ Category 'corbalar' not found");
    process.exit(1);
  }

  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: SLUGS } },
    select: {
      id: true, slug: true, title: true, type: true,
      category: { select: { slug: true } },
    },
  });

  let willWrite = 0;
  for (const r of recipes) {
    if (r.category.slug === "corbalar") continue;
    willWrite++;
    console.log(
      `  ${r.slug.padEnd(24)} [${r.type}] ${r.category.slug} → corbalar`,
    );
    if (APPLY) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { categoryId: corbalar.id },
      });
    }
  }

  const verb = APPLY ? "Moved" : "Would move";
  console.log(`\n${verb}: ${willWrite} recipe(s)`);
  if (!APPLY) console.log("(dry run — re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
