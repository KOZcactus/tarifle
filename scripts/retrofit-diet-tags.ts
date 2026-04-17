/**
 * Idempotent retrofit: scan every Recipe, infer whether it's vegetarian
 * and/or vegan from ingredients + allergens, and attach the `vejetaryen`
 * or `vegan` Tag accordingly. Also REMOVES incorrectly-applied diet tags
 * (e.g. a recipe tagged "vegan" that actually has meat — presumably a
 * hand-labeling error or edit drift).
 *
 *   npx tsx scripts/retrofit-diet-tags.ts             # apply
 *   npx tsx scripts/retrofit-diet-tags.ts --dry-run   # preview only
 *
 * Depends on allergens already being populated. Order of ops after a new
 * seed batch: retrofit-allergens.ts → retrofit-diet-tags.ts.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";
import { inferDietTags } from "../src/lib/diet-inference";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");

async function main() {
  assertDbTarget("retrofit-diet-tags");
  const vegetarianTag = await prisma.tag.findUnique({
    where: { slug: "vejetaryen" },
    select: { id: true },
  });
  const veganTag = await prisma.tag.findUnique({
    where: { slug: "vegan" },
    select: { id: true },
  });
  if (!vegetarianTag || !veganTag) {
    throw new Error(
      "Missing 'vejetaryen' or 'vegan' tag in DB. Seed them first via prisma/seed.ts.",
    );
  }

  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      slug: true,
      allergens: true,
      ingredients: { select: { name: true } },
      tags: {
        where: { tag: { slug: { in: ["vegan", "vejetaryen"] } } },
        select: { tagId: true, tag: { select: { slug: true } } },
      },
    },
    orderBy: { slug: "asc" },
  });

  let added = 0;
  let removed = 0;
  let noChange = 0;

  for (const r of recipes) {
    const inferred = inferDietTags(r.ingredients, r.allergens);
    const currentVeg = r.tags.some((t) => t.tag.slug === "vejetaryen");
    const currentVegan = r.tags.some((t) => t.tag.slug === "vegan");

    const ops: string[] = [];

    // Add missing tags
    if (inferred.vegetarian && !currentVeg) {
      ops.push("+vejetaryen");
      if (!DRY_RUN) {
        await prisma.recipeTag.create({
          data: { recipeId: r.id, tagId: vegetarianTag.id },
        });
      }
      added++;
    }
    if (inferred.vegan && !currentVegan) {
      ops.push("+vegan");
      if (!DRY_RUN) {
        await prisma.recipeTag.create({
          data: { recipeId: r.id, tagId: veganTag.id },
        });
      }
      added++;
    }

    // Remove incorrect tags — e.g. a meat recipe mis-labelled as vegan
    if (!inferred.vegetarian && currentVeg) {
      ops.push("-vejetaryen");
      if (!DRY_RUN) {
        await prisma.recipeTag.deleteMany({
          where: { recipeId: r.id, tagId: vegetarianTag.id },
        });
      }
      removed++;
    }
    if (!inferred.vegan && currentVegan) {
      ops.push("-vegan");
      if (!DRY_RUN) {
        await prisma.recipeTag.deleteMany({
          where: { recipeId: r.id, tagId: veganTag.id },
        });
      }
      removed++;
    }

    if (ops.length === 0) {
      noChange++;
      continue;
    }

    const flags = [
      inferred.vegetarian ? "V" : "-",
      inferred.vegan ? "Vg" : "-",
    ].join("/");
    console.log(
      `  ${r.slug.padEnd(30)} [${flags}] ${ops.join(" ")}`,
    );
  }

  const verb = DRY_RUN ? "Would apply" : "Applied";
  console.log(
    `\n${verb}: +${added} tag add, -${removed} tag remove | No change: ${noChange} | Total recipes: ${recipes.length}`,
  );
  if (DRY_RUN) console.log("(dry run — no writes)");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("retrofit-diet-tags failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
