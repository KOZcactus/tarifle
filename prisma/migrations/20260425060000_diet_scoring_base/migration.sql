-- Diyet skoru altyapi migration (oturum 20, DIET_SCORE_PLAN B* hibrit).
-- 3 degisiklik tek migration: User.dietProfile + User.showDietBadge,
-- NutritionData.sugar/fiber/sodium/satFat/glycemicIndex, RecipeDietScore modeli.

-- 1. User diyet profili + badge toggle (K2 default acik)
ALTER TABLE "users"
  ADD COLUMN "dietProfile" VARCHAR(50),
  ADD COLUMN "showDietBadge" BOOLEAN NOT NULL DEFAULT true;

-- 2. NutritionData diyet skoru ek alanlari (Faz 2 USDA enrichment icin)
ALTER TABLE "nutrition_data"
  ADD COLUMN "sugarPer100g" DECIMAL(5,2),
  ADD COLUMN "fiberPer100g" DECIMAL(5,2),
  ADD COLUMN "sodiumPer100g" DECIMAL(7,2),
  ADD COLUMN "satFatPer100g" DECIMAL(5,2),
  ADD COLUMN "glycemicIndex" INTEGER;

-- 3. RecipeDietScore tablosu (pre-compute, her recipe x dietSlug = 1 row)
CREATE TABLE "recipe_diet_scores" (
  "id" TEXT NOT NULL,
  "recipeId" TEXT NOT NULL,
  "dietSlug" VARCHAR(50) NOT NULL,
  "score" INTEGER NOT NULL,
  "breakdown" JSONB NOT NULL,
  "computedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "recipe_diet_scores_pkey" PRIMARY KEY ("id")
);

-- Unique (recipeId, dietSlug) upsert icin
CREATE UNIQUE INDEX "recipe_diet_scores_recipeId_dietSlug_key"
  ON "recipe_diet_scores"("recipeId", "dietSlug");

-- Listeleme "diyetime uygun sort" icin desc index
CREATE INDEX "recipe_diet_scores_dietSlug_score_idx"
  ON "recipe_diet_scores"("dietSlug", "score" DESC);

-- FK cascade, recipe silinince skor da silinsin
ALTER TABLE "recipe_diet_scores"
  ADD CONSTRAINT "recipe_diet_scores_recipeId_fkey"
  FOREIGN KEY ("recipeId") REFERENCES "recipes"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
