/**
 * Rename 2 recipes whose titles accidentally duplicated other recipes:
 * - baharatli-nohut-cipsi: "Fırında Nohut Cipsi" → "Baharatlı Fırında
 *   Nohut Cipsi" (other recipe at slug firinda-nohut-cipsi had same title)
 * - kavrulmus-hojicha-latte: "Hojicha Latte" → "Kavrulmuş Hojicha Latte"
 *   (other recipe at slug hojicha-latte had same title)
 *
 *   npx tsx scripts/fix-duplicate-titles.ts              # dry run
 *   npx tsx scripts/fix-duplicate-titles.ts --apply      # write
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

const FIXES: readonly { slug: string; newTitle: string }[] = [
  { slug: "baharatli-nohut-cipsi", newTitle: "Baharatlı Fırında Nohut Cipsi" },
  { slug: "kavrulmus-hojicha-latte", newTitle: "Kavrulmuş Hojicha Latte" },
];

async function main(): Promise<void> {
  console.log(
    `🔧 fix-duplicate-titles (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: FIXES.map((f) => f.slug) } },
    select: { id: true, slug: true, title: true },
  });

  let willWrite = 0;
  for (const fix of FIXES) {
    const r = recipes.find((x) => x.slug === fix.slug);
    if (!r) {
      console.error(`❌ Slug not in DB: ${fix.slug}`);
      continue;
    }
    if (r.title === fix.newTitle) {
      console.log(`  ${r.slug.padEnd(28)} already "${fix.newTitle}"`);
      continue;
    }
    willWrite++;
    console.log(`  ${r.slug.padEnd(28)} "${r.title}" → "${fix.newTitle}"`);
    if (APPLY) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { title: fix.newTitle },
      });
    }
  }

  const verb = APPLY ? "Updated" : "Would update";
  console.log(`\n${verb}: ${willWrite} recipe(s)`);
  if (!APPLY) console.log("(dry run — re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
