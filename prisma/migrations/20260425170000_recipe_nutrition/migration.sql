-- RecipeNutrition tablosu (oturum 20 Faz 2, DIET_SCORE_PLAN B*).
-- Recipe-level per-porsiyon sugar / fiber / sodium / satFat aggregate.

CREATE TABLE "recipe_nutrition" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "sugarPerServing" DECIMAL(6,2),
  "fiberPerServing" DECIMAL(6,2),
  "sodiumPerServing" DECIMAL(7,2),
  "satFatPerServing" DECIMAL(6,2),
  "matchedRatio" DECIMAL(4,3),
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "recipe_nutrition_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recipe_nutrition_recipeId_key"
  ON "recipe_nutrition"("recipeId");

ALTER TABLE "recipe_nutrition"
  ADD CONSTRAINT "recipe_nutrition_recipeId_fkey"
  FOREIGN KEY ("recipeId") REFERENCES "recipes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
