-- Review system (17 Nis 2026): 1-5 yıldız + opsiyonel yorum.
-- Her kullanıcı her tarif için en fazla bir review. AggregateRating
-- JSON-LD hesaplaması için Recipe.reviews üzerinden avg(rating) + count.

-- Extend ReportTarget enum with REVIEW value (admin moderation hooks)
ALTER TYPE "ReportTarget" ADD VALUE IF NOT EXISTS 'REVIEW';

-- Create Review table
CREATE TABLE "reviews" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "status" "ContentStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reviews_pkey" PRIMARY KEY ("id")
);

-- One review per (user, recipe)
CREATE UNIQUE INDEX "reviews_userId_recipeId_key" ON "reviews"("userId", "recipeId");

-- Index for recipe detail page rendering (published reviews for a recipe)
CREATE INDEX "reviews_recipeId_status_idx" ON "reviews"("recipeId", "status");

-- Index for user profile "my reviews" section (newest first)
CREATE INDEX "reviews_userId_createdAt_idx" ON "reviews"("userId", "createdAt");

-- Foreign keys: cascade on delete so orphaned reviews disappear when a
-- user or recipe is removed.
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "reviews" ADD CONSTRAINT "reviews_recipeId_fkey"
    FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
