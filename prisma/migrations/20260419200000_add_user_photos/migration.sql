-- CreateEnum
CREATE TYPE "RecipePhotoStatus" AS ENUM ('VISIBLE', 'HIDDEN');

-- CreateTable
CREATE TABLE "site_settings" (
    "key" VARCHAR(64) NOT NULL,
    "value" TEXT NOT NULL,
    "updatedBy" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "site_settings_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "recipe_photos" (
    "id" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "userId" TEXT,
    "imageUrl" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "publicId" VARCHAR(255) NOT NULL,
    "width" INTEGER,
    "height" INTEGER,
    "caption" VARCHAR(200),
    "status" "RecipePhotoStatus" NOT NULL DEFAULT 'VISIBLE',
    "reportCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipe_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "recipe_photos_publicId_key" ON "recipe_photos"("publicId");

-- CreateIndex
CREATE INDEX "recipe_photos_recipeId_status_createdAt_idx" ON "recipe_photos"("recipeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "recipe_photos_userId_idx" ON "recipe_photos"("userId");

-- CreateIndex
CREATE INDEX "recipe_photos_status_createdAt_idx" ON "recipe_photos"("status", "createdAt");

-- AddForeignKey
ALTER TABLE "recipe_photos" ADD CONSTRAINT "recipe_photos_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "recipes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recipe_photos" ADD CONSTRAINT "recipe_photos_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
