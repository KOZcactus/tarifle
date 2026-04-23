import { describe, expect, it, vi, beforeEach } from "vitest";
import type { RecipeType, Difficulty } from "@prisma/client";

// Prisma + next-intl'i mock'luyoruz; menu-planner sadece prisma.recipe.findMany
// çağırır ve dietConfigBySlug'u (real module, saf fonksiyon) import eder.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    recipe: { findMany: vi.fn() },
  },
}));

import { RuleBasedMenuPlanner } from "@/lib/ai/menu-planner";
import { prisma } from "@/lib/prisma";
import type { WeeklyMenuInput } from "@/lib/ai/types";

type FindManyMock = ReturnType<typeof vi.fn>;
const findManyMock = (
  prisma as unknown as { recipe: { findMany: FindManyMock } }
).recipe.findMany;

interface FakeRecipe {
  id: string;
  slug: string;
  title: string;
  emoji: string | null;
  imageUrl: string | null;
  cuisine: string | null;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  hungerBar: number | null;
  difficulty: Difficulty;
  type: RecipeType;
  ingredients: Array<{ name: string; isOptional: boolean }>;
  category: { name: string };
  tags: Array<{ tag: { slug: string } }>;
}

function mk(
  slug: string,
  type: RecipeType,
  opts: Partial<FakeRecipe> = {},
): FakeRecipe {
  return {
    id: `id-${slug}`,
    slug,
    title: `Title ${slug}`,
    emoji: null,
    imageUrl: null,
    cuisine: opts.cuisine ?? "tr",
    totalMinutes: opts.totalMinutes ?? 20,
    servingCount: 4,
    averageCalories: 200,
    hungerBar: 5,
    difficulty: "EASY",
    type,
    ingredients: opts.ingredients ?? [
      { name: "tuz", isOptional: false },
      { name: "un", isOptional: false },
    ],
    category: opts.category ?? { name: "Genel" },
    tags: opts.tags ?? [],
    ...opts,
  };
}

/**
 * Mock factory: accepts a recipe pool, returns findMany mockImplementation
 * that respects the where.type filter the planner passes.
 */
function mockPool(recipes: FakeRecipe[]) {
  findManyMock.mockImplementation(async (args: unknown) => {
    const where = (args as { where?: { type?: { in?: RecipeType[] } } })?.where;
    const typesIn = where?.type?.in ?? null;
    if (!typesIn) return recipes;
    return recipes.filter((r) => typesIn.includes(r.type));
  });
}

function buildRichPool(): FakeRecipe[] {
  const recipes: FakeRecipe[] = [];
  const categories = ["Kahvaltı", "Yumurta", "Hamur"];
  const cuisines = ["tr", "it", "fr", "gr", "jp", "in", "mx"];
  for (let i = 0; i < 12; i++) {
    recipes.push(
      mk(`b-${i}`, "KAHVALTI", {
        category: { name: categories[i % categories.length] },
        cuisine: cuisines[i % cuisines.length],
        totalMinutes: 15,
        ingredients: [
          { name: "tuz", isOptional: false },
          { name: "un", isOptional: false },
        ],
      }),
    );
  }
  const lunchCats = ["Çorba", "Salata", "Yemek"];
  const lunchTypes: RecipeType[] = ["CORBA", "SALATA", "YEMEK"];
  for (let i = 0; i < 14; i++) {
    recipes.push(
      mk(`l-${i}`, lunchTypes[i % lunchTypes.length], {
        category: { name: lunchCats[i % lunchCats.length] },
        cuisine: cuisines[i % cuisines.length],
        totalMinutes: 30,
        ingredients: [
          { name: "tuz", isOptional: false },
          { name: "un", isOptional: false },
        ],
      }),
    );
  }
  const dinnerCats = ["Yemek", "Güveç", "Izgara"];
  for (let i = 0; i < 14; i++) {
    recipes.push(
      mk(`d-${i}`, "YEMEK", {
        category: { name: dinnerCats[i % dinnerCats.length] },
        cuisine: cuisines[i % cuisines.length],
        totalMinutes: 45,
        ingredients: [
          { name: "tuz", isOptional: false },
          { name: "un", isOptional: false },
        ],
      }),
    );
  }
  return recipes;
}

beforeEach(() => {
  findManyMock.mockReset();
});

describe("RuleBasedMenuPlanner", () => {
  it("returns exactly 21 slots (7 days × 3 meals)", async () => {
    mockPool(buildRichPool());
    const planner = new RuleBasedMenuPlanner();
    const input: WeeklyMenuInput = {
      ingredients: ["tuz", "un"],
      assumePantryStaples: true,
      seed: "fixed",
    };
    const res = await planner.plan(input);
    expect(res.slots).toHaveLength(21);
    const pairs = res.slots.map((s) => `${s.dayOfWeek}-${s.mealType}`);
    expect(new Set(pairs).size).toBe(21); // unique day-meal pairs
  });

  it("never repeats the same recipe across the week", async () => {
    mockPool(buildRichPool());
    const planner = new RuleBasedMenuPlanner();
    const res = await planner.plan({
      ingredients: ["tuz", "un"],
      assumePantryStaples: true,
      seed: "unique-check",
    });
    const filled = res.slots
      .map((s) => s.recipe?.slug)
      .filter((s): s is string => Boolean(s));
    expect(new Set(filled).size).toBe(filled.length);
  });

  it("respects category cap (max 2 per category across the week)", async () => {
    mockPool(buildRichPool());
    const planner = new RuleBasedMenuPlanner();
    const res = await planner.plan({
      ingredients: ["tuz", "un"],
      assumePantryStaples: true,
      seed: "cat-cap",
    });
    const categoryCount = new Map<string, number>();
    for (const s of res.slots) {
      if (!s.recipe) continue;
      categoryCount.set(
        s.recipe.categoryName,
        (categoryCount.get(s.recipe.categoryName) ?? 0) + 1,
      );
    }
    for (const [, count] of categoryCount) {
      expect(count).toBeLessThanOrEqual(2);
    }
  });

  it("respects cuisine cap (max 3 per cuisine across the week)", async () => {
    mockPool(buildRichPool());
    const planner = new RuleBasedMenuPlanner();
    const res = await planner.plan({
      ingredients: ["tuz", "un"],
      assumePantryStaples: true,
      seed: "cuisine-cap",
    });
    const cuisineCount = new Map<string, number>();
    for (const s of res.slots) {
      if (!s.recipe?.cuisine) continue;
      cuisineCount.set(
        s.recipe.cuisine,
        (cuisineCount.get(s.recipe.cuisine) ?? 0) + 1,
      );
    }
    for (const [, count] of cuisineCount) {
      expect(count).toBeLessThanOrEqual(3);
    }
  });

  it("produces identical output for the same seed (determinism)", async () => {
    const pool = buildRichPool();
    mockPool(pool);
    const planner = new RuleBasedMenuPlanner();
    const run1 = await planner.plan({
      ingredients: ["tuz", "un"],
      assumePantryStaples: true,
      seed: "repeat-me",
    });
    mockPool(pool); // re-init mock
    const run2 = await planner.plan({
      ingredients: ["tuz", "un"],
      assumePantryStaples: true,
      seed: "repeat-me",
    });
    const slugs1 = run1.slots.map((s) => s.recipe?.slug ?? "NULL");
    const slugs2 = run2.slots.map((s) => s.recipe?.slug ?? "NULL");
    expect(slugs1).toEqual(slugs2);
  });

  it("returns 21 null slots + informative commentary when pool is empty", async () => {
    mockPool([]);
    const planner = new RuleBasedMenuPlanner();
    const res = await planner.plan({
      ingredients: ["tuz", "un"],
      assumePantryStaples: true,
      seed: "empty-pool",
    });
    expect(res.slots).toHaveLength(21);
    expect(res.slots.every((s) => s.recipe === null)).toBe(true);
    expect(res.unfilledCount).toBe(21);
    expect(res.commentary).toMatch(/slot/);
  });

  it("honors custom maxBreakfastMinutes by excluding longer recipes", async () => {
    // Pool: breakfasts at 15 min OK, but one 40 min breakfast that must skip
    const pool: FakeRecipe[] = [
      ...buildRichPool(),
      mk("b-long", "KAHVALTI", {
        totalMinutes: 40,
        category: { name: "Uzun" },
        cuisine: "us",
      }),
    ];
    findManyMock.mockImplementation(async (args: unknown) => {
      const where = args as {
        where?: {
          type?: { in?: RecipeType[] };
          totalMinutes?: { lte?: number };
        };
      };
      const typesIn = where?.where?.type?.in ?? null;
      const maxMin = where?.where?.totalMinutes?.lte ?? Number.POSITIVE_INFINITY;
      return pool.filter(
        (r) =>
          (!typesIn || typesIn.includes(r.type)) && r.totalMinutes <= maxMin,
      );
    });
    const planner = new RuleBasedMenuPlanner();
    const res = await planner.plan({
      ingredients: ["tuz", "un"],
      assumePantryStaples: true,
      maxBreakfastMinutes: 20,
      seed: "max-min",
    });
    // The 40-min breakfast should never appear in any breakfast slot
    const breakfastSlugs = res.slots
      .filter((s) => s.mealType === "BREAKFAST")
      .map((s) => s.recipe?.slug);
    expect(breakfastSlugs).not.toContain("b-long");
  });

  it("provider identifier is rule-based", async () => {
    mockPool(buildRichPool());
    const planner = new RuleBasedMenuPlanner();
    const res = await planner.plan({
      ingredients: ["tuz", "un"],
      assumePantryStaples: true,
      seed: "provider",
    });
    expect(res.provider).toBe("rule-based");
  });
});
