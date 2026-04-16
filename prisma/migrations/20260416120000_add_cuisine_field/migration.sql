-- AlterTable: add cuisine column to recipes
ALTER TABLE "recipes" ADD COLUMN "cuisine" VARCHAR(30);

-- CreateIndex: btree index for WHERE cuisine IN (...) filter
CREATE INDEX "recipes_cuisine_idx" ON "recipes"("cuisine");
