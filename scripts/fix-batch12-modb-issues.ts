/**
 * Fix 2 content inconsistencies surfaced by Codex during batch 12 Mod B
 * translation pass:
 *
 *   ovmac-corbasi-konya-usulu → tags include "vejetaryen" but ingredient
 *   list has "Et suyu" (beef/chicken stock). Remove vejetaryen tag.
 *
 *   summer-pudding → totalMinutes 30 but step 3 is a 4-hour fridge chill
 *   (timerSeconds: 14400). Chill time must be in totalMinutes → set to 270
 *   (20 prep + 10 cook + 240 chill).
 *
 * Idempotent. Dev-safe, prod requires --confirm-prod.
 *
 *   npx tsx scripts/fix-batch12-modb-issues.ts          # dry run
 *   npx tsx scripts/fix-batch12-modb-issues.ts --apply  # dev write
 *   DATABASE_URL=<prod> npx tsx scripts/fix-batch12-modb-issues.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

async function main(): Promise<void> {
  assertDbTarget("fix-batch12-modb-issues");
  console.log(
    `🔧 fix-batch12-modb-issues (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  // 1) ovmac-corbasi-konya-usulu, remove "vejetaryen" tag
  const ovmac = await prisma.recipe.findUnique({
    where: { slug: "ovmac-corbasi-konya-usulu" },
    include: { tags: { include: { tag: { select: { slug: true } } } } },
  });
  if (!ovmac) {
    console.error("❌ ovmac-corbasi-konya-usulu not in DB");
  } else {
    const currentTags = ovmac.tags.map((rt) => rt.tag.slug);
    console.log(`ovmac-corbasi-konya-usulu tags: [${currentTags.join(", ")}]`);
    if (currentTags.includes("vejetaryen")) {
      const vejetaryenTag = await prisma.tag.findUnique({
        where: { slug: "vejetaryen" },
        select: { id: true },
      });
      if (vejetaryenTag && APPLY) {
        await prisma.recipeTag.deleteMany({
          where: { recipeId: ovmac.id, tagId: vejetaryenTag.id },
        });
      }
      const after = currentTags.filter((s) => s !== "vejetaryen");
      console.log(`  → [${after.join(", ")}]  (et suyu içerir, vejetaryen değil)`);
    } else {
      console.log("  already clean");
    }
  }

  // 2) summer-pudding, totalMinutes 30 → 270 (4h chill dahil)
  const pudding = await prisma.recipe.findUnique({
    where: { slug: "summer-pudding" },
    select: { id: true, slug: true, totalMinutes: true, prepMinutes: true, cookMinutes: true },
  });
  if (!pudding) {
    console.error("❌ summer-pudding not in DB");
  } else {
    console.log(
      `summer-pudding prep=${pudding.prepMinutes} cook=${pudding.cookMinutes} total=${pudding.totalMinutes}`,
    );
    if (pudding.totalMinutes !== 270) {
      if (APPLY) {
        await prisma.recipe.update({
          where: { id: pudding.id },
          data: { totalMinutes: 270 },
        });
      }
      console.log(`  → total=270 (prep 20 + cook 10 + chill 240)`);
    } else {
      console.log("  already clean");
    }
  }

  if (!APPLY) console.log("\n(dry run, re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
