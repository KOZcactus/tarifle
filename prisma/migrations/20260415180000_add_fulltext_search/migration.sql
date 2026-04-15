-- Full-text search for Recipe. Codex 500-batch sonrası /tarifler arama
-- kutusu `contains` ile sequential scan yapıyordu; tsvector + GIN ile
-- ms düzeyine iner.
--
-- Mimarî kararlar:
--
-- 1. **Generated STORED tsvector** — Postgres her INSERT/UPDATE'te
--    otomatik günceller. Uygulama kodunun manual sync ya da trigger'ı
--    yok; seed script, API update, admin moderation — hepsinde drift
--    riski sıfır.
--
-- 2. **Turkish snowball stemmer** (`to_tsvector('turkish', ...)`) —
--    morfolojik eşleşme: "mantı" ↔ "mantılar", "peynirli" → "peynir",
--    "pişir" ↔ "pişirmek". Türkçe yapım ve çekim eklerini normalize
--    eder. `simple` dict yapmaz.
--
-- 3. **unaccent (IMMUTABLE wrapper)** — "manti" yazıp "mantı"yı
--    bulma. Default `unaccent()` STABLE; generated column immutable
--    fonksiyon ister. Standard Postgres pattern: SQL wrapper'ı
--    IMMUTABLE olarak işaretle, dict ismini sabit geç.
--
-- 4. **Ağırlıklandırma** (A/B/C) — title en alakalı (A), description
--    orta (B), tipNote/servingSuggestion/slug düşük (C). `ts_rank_cd`
--    bu ağırlıkları skorda kullanır → "adana" araması "Adana Kebap"ı
--    tipNote'ta "adana" geçen başka tariften üstte gösterir.
--
-- 5. **Ingredient names NOT indexed here** — ayrı tabloda (cascade FK)
--    ve materialized view / trigger gerektirir. /tarifler arama path'i
--    şu an title/description/ingredients OR'u; bu migration sadece
--    title/description/... yolunu hızlandırır. Ingredient arama
--    `contains` üzerinden devam eder, 500 tarifte kabul edilebilir.
--    500+'a çıkınca ikinci pass ile genişletiriz.

-- pg_catalog'da mevcut ama explicit yükleme garanti — Neon bazı
-- extension'ları varsayılan devre dışı bırakıyor olabilir.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Generated column bir IMMUTABLE fonksiyon çağırmak zorunda.
-- Default public.unaccent() STABLE çünkü dict config'i runtime okuyor.
-- Standart workaround: SQL wrapper'ı IMMUTABLE'a işaretle, dict ismini
-- literal string olarak ver — o sayede planner "input değişmezse
-- output değişmez" garantisini alır.
CREATE OR REPLACE FUNCTION public.immutable_unaccent(text) RETURNS text
  LANGUAGE sql IMMUTABLE PARALLEL SAFE STRICT AS
$$ SELECT public.unaccent('public.unaccent', $1) $$;

ALTER TABLE "recipes" ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('turkish', public.immutable_unaccent(coalesce("title", ''))), 'A') ||
    setweight(to_tsvector('turkish', public.immutable_unaccent(coalesce("description", ''))), 'B') ||
    setweight(to_tsvector('turkish', public.immutable_unaccent(coalesce("tipNote", ''))), 'C') ||
    setweight(to_tsvector('turkish', public.immutable_unaccent(coalesce("servingSuggestion", ''))), 'C') ||
    setweight(to_tsvector('turkish', public.immutable_unaccent(coalesce("slug", ''))), 'C')
  ) STORED;

CREATE INDEX "recipes_search_gin" ON "recipes" USING GIN ("searchVector");
