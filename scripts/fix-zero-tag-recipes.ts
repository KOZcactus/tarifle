/**
 * Fix 14 recipes that lost their only tag after fix-inconsistent-tags.ts
 * auto-corrected conflicting tags (Apr 2026 regression).
 *
 * Each recipe gets one audit-appropriate tag based on its attributes:
 * - High-protein (≥15g): "yuksek-protein"
 * - Long-cook desserts / showpiece dishes: "misafir-sofrasi"
 * - Soups: "kis-tarifi"
 *
 *   npx tsx scripts/fix-zero-tag-recipes.ts              # dry run
 *   npx tsx scripts/fix-zero-tag-recipes.ts --apply      # write
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

const FIXES: readonly { slug: string; tag: string; reason: string }[] = [
  { slug: "beef-chow-fun", tag: "yuksek-protein", reason: "25g protein" },
  { slug: "canjica", tag: "misafir-sofrasi", reason: "Brezilya şölen tatlısı" },
  { slug: "cocada", tag: "misafir-sofrasi", reason: "Hindistan cevizli tatlı" },
  { slug: "edirne-cigeri", tag: "yuksek-protein", reason: "28g protein" },
  { slug: "eksili-kofte", tag: "kis-tarifi", reason: "Kış çorbası" },
  { slug: "gaeng-daeng", tag: "yuksek-protein", reason: "22g protein" },
  { slug: "hamsi-tava", tag: "yuksek-protein", reason: "26g protein" },
  { slug: "ojja-merguez", tag: "yuksek-protein", reason: "22g protein" },
  { slug: "pad-see-ew", tag: "yuksek-protein", reason: "23g protein" },
  { slug: "pyttipanna", tag: "yuksek-protein", reason: "18g protein" },
  { slug: "quindim", tag: "misafir-sofrasi", reason: "Brezilya klasik tatlı" },
  { slug: "tonkatsu", tag: "yuksek-protein", reason: "31g protein" },
  { slug: "turos-csusza", tag: "yuksek-protein", reason: "24g protein" },
  { slug: "yakisoba", tag: "yuksek-protein", reason: "19g protein" },
];

async function main(): Promise<void> {
  assertDbTarget("fix-zero-tag-recipes");
  console.log(
    `🔧 fix-zero-tag-recipes (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const tagSlugs = [...new Set(FIXES.map((f) => f.tag))];
  const tags = await prisma.tag.findMany({
    where: { slug: { in: tagSlugs } },
    select: { id: true, slug: true },
  });
  const tagId = new Map(tags.map((t) => [t.slug, t.id]));
  const missingTags = tagSlugs.filter((s) => !tagId.has(s));
  if (missingTags.length > 0) {
    console.error(`❌ Tags missing: ${missingTags.join(", ")}`);
    process.exit(1);
  }

  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: FIXES.map((f) => f.slug) } },
    select: { id: true, slug: true, tags: { select: { tagId: true } } },
  });

  let willWrite = 0;
  let alreadyTagged = 0;

  for (const fix of FIXES) {
    const recipe = recipes.find((r) => r.slug === fix.slug);
    if (!recipe) {
      console.error(`❌ Slug not in DB: ${fix.slug}`);
      continue;
    }
    const targetTagId = tagId.get(fix.tag)!;
    const already = recipe.tags.some((t) => t.tagId === targetTagId);
    if (already) {
      alreadyTagged++;
      continue;
    }
    willWrite++;
    console.log(
      `  ${fix.slug.padEnd(28)} + ${fix.tag.padEnd(18)} (${fix.reason})`,
    );
    if (APPLY) {
      await prisma.recipeTag.create({
        data: { recipeId: recipe.id, tagId: targetTagId },
      });
    }
  }

  const verb = APPLY ? "Added" : "Would add";
  console.log(
    `\n${verb}: ${willWrite} tag link(s) | Already tagged: ${alreadyTagged}`,
  );
  if (!APPLY) console.log("(dry run — re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
