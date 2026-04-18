-- AddUserPreferences migration
--
-- Add three additive columns to `users` table so the user can configure
-- personalisation preferences from /ayarlar. All default to empty array —
-- no data backfill needed, no downtime. Columns are filter inputs only
-- (listing/discover UX will consume them in a later pass).
--
--   favoriteTags         TEXT[]        → Tag.slug strings ("vejetaryen", …)
--   allergenAvoidances   "Allergen"[]  → enum values to avoid
--   favoriteCuisines     TEXT[]        → cuisine codes ("tr", "it", …)

ALTER TABLE "users"
  ADD COLUMN "favoriteTags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN "allergenAvoidances" "Allergen"[] NOT NULL DEFAULT ARRAY[]::"Allergen"[],
  ADD COLUMN "favoriteCuisines" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
