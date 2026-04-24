-- CreateTable UserPantryItem (oturum 17 sonu)
-- Kullanıcının "dolabı" kalıcı. AI Asistan + v4 menü planlayıcı
-- "Dolabımı getir" entegrasyonu + son kullanma tarihi bazlı öncelik.

CREATE TABLE "user_pantry_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "ingredientName" VARCHAR(80) NOT NULL,
    "displayName" VARCHAR(100),
    "quantity" DECIMAL(7,2),
    "unit" VARCHAR(30),
    "expiryDate" DATE,
    "note" VARCHAR(200),
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pantry_items_pkey" PRIMARY KEY ("id")
);

-- Aynı user aynı ingredient'ı iki kere ekleyemez (upsert pattern).
CREATE UNIQUE INDEX "user_pantry_items_userId_ingredientName_key"
  ON "user_pantry_items"("userId", "ingredientName");

-- Son kullanma tarihine göre sort + yaklaşan filter için.
CREATE INDEX "user_pantry_items_userId_expiryDate_idx"
  ON "user_pantry_items"("userId", "expiryDate");

-- Son eklenen tuç ilk sıralama için.
CREATE INDEX "user_pantry_items_userId_addedAt_idx"
  ON "user_pantry_items"("userId", "addedAt");

-- Cascade: User silinirse pantry item'lar da silinir.
ALTER TABLE "user_pantry_items"
  ADD CONSTRAINT "user_pantry_items_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
