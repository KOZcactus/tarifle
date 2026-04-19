-- AddMealPlanner migration
--
-- Weekly meal planner: 7 day × 3 meal grid. Users pick a recipe for each
-- slot, then bulk-push ingredient lists into their shopping list. Builds
-- on the existing ShoppingList infrastructure — no changes to shopping
-- tables needed.
--
-- Schema:
--   meal_plans        — one row per (user, weekStart). Unique constraint
--                       prevents two plans for the same week.
--   meal_plan_items   — slot-level rows. Unique (planId, dayOfWeek,
--                       mealType) so re-selecting a slot UPDATEs.
--   "MealType" enum   — BREAKFAST | LUNCH | DINNER.
--
-- Cascade rules: user/plan deletion cascades to items; recipe deletion
-- cascades to items (the recipe disappears from any plan containing it).

-- Enum for meal slots.
CREATE TYPE "MealType" AS ENUM ('BREAKFAST', 'LUNCH', 'DINNER');

-- Plans table.
CREATE TABLE "meal_plans" (
  "id"        TEXT NOT NULL,
  "userId"    TEXT NOT NULL,
  "weekStart" DATE NOT NULL,
  "name"      VARCHAR(100),
  "notes"     VARCHAR(500),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "meal_plans_pkey" PRIMARY KEY ("id")
);

-- Plan items — slot-level recipe selections.
CREATE TABLE "meal_plan_items" (
  "id"         TEXT NOT NULL,
  "mealPlanId" TEXT NOT NULL,
  "recipeId"   TEXT NOT NULL,
  "dayOfWeek"  INTEGER NOT NULL,
  "mealType"   "MealType" NOT NULL,
  "servings"   INTEGER DEFAULT 1,
  "createdAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "meal_plan_items_pkey" PRIMARY KEY ("id")
);

-- Uniques.
CREATE UNIQUE INDEX "meal_plans_userId_weekStart_key"
  ON "meal_plans"("userId", "weekStart");

CREATE UNIQUE INDEX "meal_plan_items_mealPlanId_dayOfWeek_mealType_key"
  ON "meal_plan_items"("mealPlanId", "dayOfWeek", "mealType");

-- Indexes.
CREATE INDEX "meal_plans_userId_weekStart_idx"
  ON "meal_plans"("userId", "weekStart");

CREATE INDEX "meal_plan_items_mealPlanId_idx"
  ON "meal_plan_items"("mealPlanId");

CREATE INDEX "meal_plan_items_recipeId_idx"
  ON "meal_plan_items"("recipeId");

-- Foreign keys.
ALTER TABLE "meal_plans"
  ADD CONSTRAINT "meal_plans_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meal_plan_items"
  ADD CONSTRAINT "meal_plan_items_mealPlanId_fkey"
  FOREIGN KEY ("mealPlanId") REFERENCES "meal_plans"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "meal_plan_items"
  ADD CONSTRAINT "meal_plan_items_recipeId_fkey"
  FOREIGN KEY ("recipeId") REFERENCES "recipes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
