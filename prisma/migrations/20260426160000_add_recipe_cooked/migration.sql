-- "Pişirdim" rozet sistemi (oturum 23): RecipeCooked tablosu
-- Tarif detay sayfasinda toggle "Pişirdim ✓" + sosyal kanit count
-- "X kişi pişirdi", profil sayfasinda "Pişirdiklerim" tab.
-- Bookmark pattern'iyle aynı shape: kullanıcı tarif başına en fazla bir
-- kayıt (@@unique).

CREATE TABLE "recipe_cooked" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "cookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "servings" INTEGER,
    CONSTRAINT "recipe_cooked_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "recipe_cooked_userId_recipeId_key" ON "recipe_cooked"("userId", "recipeId");

CREATE INDEX "recipe_cooked_recipeId_idx" ON "recipe_cooked"("recipeId");

CREATE INDEX "recipe_cooked_userId_cookedAt_idx" ON "recipe_cooked"("userId", "cookedAt" DESC);

ALTER TABLE "recipe_cooked" ADD CONSTRAINT "recipe_cooked_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "recipe_cooked" ADD CONSTRAINT "recipe_cooked_recipeId_fkey"
    FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
