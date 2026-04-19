-- CreateTable
CREATE TABLE "recipe_view_daily" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "recipe_view_daily_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_view_daily_recipeId_date_key" ON "recipe_view_daily"("recipeId", "date");

-- CreateIndex
CREATE INDEX "recipe_view_daily_date_idx" ON "recipe_view_daily"("date");

-- AddForeignKey
ALTER TABLE "recipe_view_daily" ADD CONSTRAINT "recipe_view_daily_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
