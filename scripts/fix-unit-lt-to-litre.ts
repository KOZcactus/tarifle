/**
 * Standardize volume unit: "lt" → "litre" across all RecipeIngredient rows.
 * Audit detected 15 "lt" + 34 "litre" co-existing; picking "litre" (more
 * common, reads cleaner in UI).
 *
 *   npx tsx scripts/fix-unit-lt-to-litre.ts              # dry run
 *   npx tsx scripts/fix-unit-lt-to-litre.ts --apply      # write
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

async function main(): Promise<void> {
  console.log(
    `🔧 fix-unit-lt-to-litre (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const rows = await prisma.recipeIngredient.findMany({
    where: { unit: "lt" },
    select: {
      id: true,
      name: true,
      amount: true,
      recipe: { select: { slug: true } },
    },
    orderBy: { recipe: { slug: "asc" } },
  });

  console.log(`--- ${rows.length} rows with unit="lt" ---`);
  for (const r of rows) {
    console.log(
      `  ${r.recipe.slug.padEnd(32)} "${r.name}" ${r.amount} lt → litre`,
    );
  }

  if (APPLY && rows.length > 0) {
    await prisma.recipeIngredient.updateMany({
      where: { unit: "lt" },
      data: { unit: "litre" },
    });
    console.log(`\n✅ Updated ${rows.length} ingredient row(s)`);
  } else if (!APPLY) {
    console.log(`\n(dry run — re-run with --apply to write)`);
  }
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
