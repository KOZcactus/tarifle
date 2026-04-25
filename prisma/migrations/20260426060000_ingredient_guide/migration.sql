-- Mod H altyapisi (oturum 21): IngredientGuide tablosu
-- Codex top 50 ingredient icin "neden + yerine" notlari yazar, AI
-- Asistan v5 + tarif detay sayfasi kullanir.

CREATE TABLE "ingredient_guides" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "whyUsed" VARCHAR(500) NOT NULL,
    "substitutes" JSONB NOT NULL,
    "notes" VARCHAR(500),
    "source" VARCHAR(100),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ingredient_guides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ingredient_guides_name_key" ON "ingredient_guides"("name");
