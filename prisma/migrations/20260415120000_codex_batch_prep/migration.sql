-- Consolidates all schema changes that accumulated via `prisma db push`
-- between 14–15 Nisan 2026 (Codex 500-batch hazırlık çarşafı).
--
-- The production DB already has every one of these changes applied via
-- db:push — this file is marked as applied (via `prisma migrate resolve
-- --applied`) without being re-executed. It exists so that:
--   1. `prisma migrate status` tamamlama sayfaya gelmiş olur,
--   2. fresh DB deploy (e.g. e2e test branch, future staging) aynı
--      schema'yı migrate ile kurabilsin,
--   3. dev/prod drift'i tracking'e girer.
--
-- Packaged together (not one migration each) because they shipped as a
-- single launch-prep pass; splitting retroactively just adds noise.
--
-- Değişiklik listesi:
--   1. Variation.moderationFlags        — pre-flight sinyalleri CSV alanı
--   2. NotificationType enum + Notification table — in-app bildirim sistemi
--   3. PasswordResetToken table         — "şifremi unuttum" akışı
--   4. Allergen enum                    — EU big-10 adapted
--   5. Recipe.allergens Allergen[]      — tarife bağlı alerjen seti
--   6. recipes_allergens_idx (GIN)      — array hasSome/hasNone filter hızı
--   7. Recipe.translations JSONB        — Faz 3 i18n bucket (nullable)
--   8. RecipeIngredient.group           — çok-bileşenli tariflerde bölüm ("Hamur için" vb.)

-- 1. Variation.moderationFlags
ALTER TABLE "variations" ADD COLUMN "moderationFlags" VARCHAR(200);

-- 2. NotificationType enum + Notification table
CREATE TYPE "NotificationType" AS ENUM (
  'VARIATION_LIKED',
  'VARIATION_APPROVED',
  'VARIATION_HIDDEN',
  'REPORT_RESOLVED',
  'BADGE_AWARDED',
  'SYSTEM'
);

CREATE TABLE "notifications" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" VARCHAR(200) NOT NULL,
  "body" TEXT,
  "link" VARCHAR(500),
  "isRead" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "notifications_userId_isRead_createdAt_idx"
  ON "notifications"("userId", "isRead", "createdAt");
CREATE INDEX "notifications_userId_createdAt_idx"
  ON "notifications"("userId", "createdAt");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_userId_fkey"
  FOREIGN KEY ("userId") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- 3. PasswordResetToken table
CREATE TABLE "password_reset_tokens" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "password_reset_tokens_token_key"
  ON "password_reset_tokens"("token");
CREATE UNIQUE INDEX "password_reset_tokens_identifier_token_key"
  ON "password_reset_tokens"("identifier", "token");
CREATE INDEX "password_reset_tokens_identifier_idx"
  ON "password_reset_tokens"("identifier");

-- 4. Allergen enum
CREATE TYPE "Allergen" AS ENUM (
  'GLUTEN',
  'SUT',
  'YUMURTA',
  'KUSUYEMIS',
  'YER_FISTIGI',
  'SOYA',
  'DENIZ_URUNLERI',
  'SUSAM',
  'KEREVIZ',
  'HARDAL'
);

-- 5. Recipe.allergens + 6. GIN index
ALTER TABLE "recipes"
  ADD COLUMN "allergens" "Allergen"[] NOT NULL DEFAULT ARRAY[]::"Allergen"[];

CREATE INDEX "recipes_allergens_idx" ON "recipes" USING GIN ("allergens");

-- 7. Recipe.translations (optional i18n bucket, Faz 3 prep)
ALTER TABLE "recipes" ADD COLUMN "translations" JSONB;

-- 8. RecipeIngredient.group
ALTER TABLE "recipe_ingredients" ADD COLUMN "group" VARCHAR(80);
