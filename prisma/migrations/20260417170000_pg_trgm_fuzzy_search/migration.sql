-- Fuzzy search eklemesi (17 Nis 2026):
-- FTS (websearch_to_tsquery + tsvector) typo'ya karşı tolerant değil —
-- "domatez" için hiç sonuç dönmüyor. pg_trgm trigram similarity ile
-- fallback path yazıyoruz. Title + slug üzerinden GIN index, user'ın
-- tek-kelime yazım yanlışlarını bile yakalar.

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Title ve slug üzerinde trigram GIN index (similarity lookup için).
-- description/ingredients üzerinde indekslemiyoruz — hem maliyet daha
-- yüksek hem de FTS zaten o alanlarda güçlü. Title/slug'da 2-3 edit
-- distance içinde kalan "near miss" için yeterli.
CREATE INDEX "recipes_title_trgm_idx"
  ON "recipes" USING GIN ("title" gin_trgm_ops);

CREATE INDEX "recipes_slug_trgm_idx"
  ON "recipes" USING GIN ("slug" gin_trgm_ops);

-- Ingredient name üzerinde de trigram — "kerik" yazan kullanıcıya "kekik"
-- önerilsin. recipe_ingredients tablosu nispeten küçük (~7000 satır @
-- 1100 recipe × ~7 ingredient ort.), GIN index ekstra 1-2 MB.
CREATE INDEX "recipe_ingredients_name_trgm_idx"
  ON "recipe_ingredients" USING GIN ("name" gin_trgm_ops);
