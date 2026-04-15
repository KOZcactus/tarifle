/**
 * Integration smoke for the "most-liked" sort: creates a throwaway user +
 * two throwaway variations with different like counts on two existing
 * recipes, queries getRecipes with sortBy="most-liked", asserts that the
 * higher-liked recipe lands above the other, then cleans up.
 *
 * Uses real Prisma against the configured DB (same pattern as
 * test-password-reset-flow.ts) — no HTTP layer needed.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const { getRecipes } = await import("../src/lib/queries/recipe");

  // Pick two published recipes we know exist from the seed set.
  const twoRecipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, title: true, slug: true },
    orderBy: { slug: "asc" },
    take: 2,
  });
  if (twoRecipes.length < 2) {
    throw new Error("Need at least 2 PUBLISHED recipes for this smoke test");
  }
  const [lowLiked, highLiked] = twoRecipes;
  console.log(
    `→ low: ${lowLiked!.title} (${lowLiked!.slug}), high: ${highLiked!.title} (${highLiked!.slug})`,
  );

  // Throwaway user that will author the test variations.
  const user = await prisma.user.create({
    data: {
      email: `most-liked-smoke-${Date.now()}@tarifle.test`,
      username: `liked${Date.now().toString().slice(-8)}`,
      name: "Most-Liked Smoke",
      kvkkAccepted: true,
      kvkkVersion: "1.0",
      kvkkDate: new Date(),
    },
    select: { id: true },
  });

  const lowVar = await prisma.variation.create({
    data: {
      recipeId: lowLiked!.id,
      authorId: user.id,
      miniTitle: "Low-like smoke",
      ingredients: [],
      steps: [],
      status: "PUBLISHED",
      likeCount: 2,
    },
    select: { id: true },
  });
  const highVar = await prisma.variation.create({
    data: {
      recipeId: highLiked!.id,
      authorId: user.id,
      miniTitle: "High-like smoke",
      ingredients: [],
      steps: [],
      status: "PUBLISHED",
      likeCount: 50,
    },
    select: { id: true },
  });
  console.log(
    `→ created variations: low likeCount=2, high likeCount=50`,
  );

  try {
    const { recipes } = await getRecipes({
      sortBy: "most-liked",
      limit: 100,
    });
    const highPos = recipes.findIndex((r) => r.id === highLiked!.id);
    const lowPos = recipes.findIndex((r) => r.id === lowLiked!.id);
    console.log(
      `→ positions: high=${highPos}, low=${lowPos} (total ${recipes.length})`,
    );
    if (highPos === -1 || lowPos === -1)
      throw new Error("both recipes should appear in results");
    if (highPos >= lowPos)
      throw new Error(
        `high-liked should come BEFORE low-liked (got high=${highPos}, low=${lowPos})`,
      );
    // Also: the high-liked recipe should be #1 overall (it has 50 likes and
    // no other recipe has any likes in seed data).
    if (highPos !== 0)
      throw new Error(`high-liked should be first, got pos=${highPos}`);
    console.log("→ high-liked recipe ranks first as expected");
  } finally {
    // Cleanup — delete variations first (FK to user), then user.
    await prisma.variation.deleteMany({
      where: { id: { in: [lowVar.id, highVar.id] } },
    });
    await prisma.user.delete({ where: { id: user.id } });
    console.log("→ cleaned up test variations + user");
  }

  console.log("\n✅ most-liked sort smoke passed");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ smoke failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
