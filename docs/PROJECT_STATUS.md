# Tarifle — Proje Durumu

> Son güncelleme: 17 Nisan 2026 (Admin ops v6 — moderasyon log + tag/kategori CRUD, admin kapandı)

## 17 Nisan 2026 — Admin ops v6 moderasyon log + taxonomy

3 yeni admin sayfası, admin paneli kapandı:

- **`/admin/moderasyon-logu`** — ModerationAction timeline. Filtre (hedef türü + işlem), 50/sayfa pagination. Hedef label'ları N+1 önleyen `getModerationLogTargets` ile toplu çekilir; silinmiş hedef için italic "(silinmiş)" fallback. Her satırda moderator → admin kullanıcı detayına drill-down, hedef → ilgili admin/public sayfaya.
- **`/admin/etiketler`** — Tag CRUD. Inline rename (pencil icon → Enter/Esc), create form (name + optional slug, otomatik slugify), delete yalnız usage=0. Total usage + orphan count header'da.
- **`/admin/kategoriler`** — Category CRUD. Inline emoji/name/sortOrder ayrı ayrı edit, create form (emoji + name + slug + sortOrder), delete recipe_count=0 AND children=0 şartıyla. Alt kategori sayısı inline gösterilir.

Schema: ModerationAction'a 3 index (createdAt DESC + moderatorId+createdAt + targetType+action+createdAt) — migration `20260417150000_moderation_log_indexes`. Server actions: 6 yeni (tag/category create/update/delete), Zod whitelist + unique conflict detection + recipe_count guard. Layout nav 5 → 8 tab, flex-wrap.

Test: 16 yeni (Zod validation + TR slugify). 438 unit toplam PASS.

## 17 Nisan 2026 — Admin ops v5 inline edit + CSV export

**Inline edit:** Admin detay sayfalarında tıkla-düzenle akışı, popup yok. Recipe: emoji/title/description (Ctrl+Enter), status dropdown (HIDDEN geçişinde confirm), isFeatured toggle. User: role dropdown (yalnız ADMIN session) + isVerified toggle. Server actions Zod whitelist + ModerationAction audit (diff summary). Self-demotion guard.

**CSV export:** 3 route handler (`/api/admin/export/{recipes,users,reviews}`). RFC 4180 + UTF-8 BOM → Excel'de Türkçe doğru. Admin guard. Export butonları: ana dashboard üstü (3'lü) + liste sayfalarında. Tarifler 18 kolon (nutrition dahil), kullanıcılar 12 kolon, yorumlar 9 kolon (tüm statüler, moderation flag'leri dahil).

Test: 10 CSV unit (BOM, quoting, escape, TR karakter, null/Date/bool). 422 toplam.

## 17 Nisan 2026 — Admin ops v4 drill-down

`/admin/kullanicilar/[username]` ve `/admin/tarifler/[slug]` yeni detay sayfaları. Moderator-view: HIDDEN + PENDING_REVIEW içerik görünür, preflight flag chip'leri + hiddenReason inline. User detay: 7 stat card + rozetler + variation/review/report listeleri. Recipe detay: 6 stat card + beslenme + rating aggregate + distribution mini-bar + review/variation listeleri + son kaydedenler. Liste sayfalarında drill-down linkleri (name → user detay, title → recipe detay, public ↗ yan link). Yeni queries: getAdminUserDetail + getAdminRecipeDetail.

## 17 Nisan 2026 — Admin ops v3

Main dashboard'a 🏆 "En aktif kullanıcılar" (top 10, composite skor uy×3+yorum×2+bookmark) + 🚨 "En çok raporlanan içerik" (variation + review ayrı kolon) eklendi. `/admin/tarifler` ve `/admin/kullanicilar` URL-driven sort/filter/search/pagination aldı: kolon başlıklarına click → sort toggle (▼/▲), status/rol/e-posta doğrulama filter, ilike search, 50/sayfa pagination. Paylaşılan component: SortableHeader + PaginationBar (RSC-only, no-JS). Yeni query: getMostActiveUsers, getMostReportedVariations/Reviews, getAdminRecipesList, getAdminUsersList.

## 17 Nisan 2026 — Admin dashboard v2

13 stat card (önceden 10) + 4 yeni bölüm: 📈 kullanıcı büyüme (son 30 gün bar chart), ⭐ yorum yıldız dağılımı, 🔥 en çok görüntülenen tarifler (top 5), 👤 son kaydolan kullanıcılar (10). Review v2 entegre (toplam + ortalama rating + dağılım). Unified inceleme kuyruğu (variation + review PENDING tek sayı). Yeni alarmlar: e-posta doğrulama <60% highlight, görselsiz tarif >20% highlight. Yeni query helpers: getTopViewedRecipes, getRecentSignups, getUserGrowthDaily, getReviewDistribution.

## 17 Nisan 2026 — AI Asistan v2 synonym expansion

Kural-tabanlı matcher'ın data tabloları TR mutfağı için zenginleşti. Algoritma (2-step direct prefix → synonym fallback) aynı kaldı. Et ayrıştırıldı (önceden "kıyma ↔ dana eti" false-positive vardı; şimdi kıyma kendi grubu). Balık/karides/süt ürünleri/bitkisel yağ/otlar/sebzeler/baklagil/un-nişasta/sirke-limon/salça eklendi. Pantry: tereyağı + maydanoz + maya + sirke + limon suyu eklendi. Test: 29 → 69 (412 unit toplam PASS). Form akışı + provider interface etkilenmedi.

## 17 Nisan 2026 — Neon dev/prod branch + script guard

Önceden tek Neon branch hem prod hem dev olarak kullanılıyordu (hata payı sıfır). Artık iki branch:

| Katman | Production | Dev |
|---|---|---|
| Neon host | `ep-broad-pond` | `ep-dry-bread` |
| Vercel scope | Production | Preview + Development |
| Lokal env | `.env.production.local` (elle) | `.env.local` (default) |
| Script guard | `--confirm-prod` zorunlu | Serbest |

34 destructive script `scripts/lib/db-env.ts` guard'ı import eder: prod host + flag yoksa exit 1, flag varsa 3 sn uyarı. Runbook: `docs/PROD_PROMOTE.md`. Codex tarafı (codex-import child branch) hiç etkilenmiyor.

## 17 Nisan 2026 — Review sistemi v2

Review v1'in üstüne 5 katman: preflight (repeated_chars/caps/URL → PENDING_REVIEW), admin moderation (hideReview/approveReview + /admin/incelemeler Yorumlar section + /admin/raporlar Raporlanmış Yorumlar), profil "Yorumlarım" section (owner HIDDEN dahil + hiddenReason görünür), `REVIEW_HIDDEN`+`REVIEW_APPROVED` notification tipleri, ReportButton REVIEW hedefi. Schema: Review.moderationFlags + hiddenReason. Test: 11 unit + 1 E2E PASS, 374 unit toplam. Migration `20260417140000_review_moderation` dev branch'e uygulandı.



## 17 Nisan 2026 — DB derin doğruluk + Faz 3 başlangıç

🎯 **audit-deep.ts: 26 CRITICAL + 498 WARNING → 0/0 PASS. audit-content.ts: 0 CRITICAL / HIGH 13 (hepsi legitimate kısa içecek). Faz 3 Review/Rating sistemi canlı.**

~40 commit. Nutrition %100 coverage, 200+ DB kalite düzeltmesi, Review system full-stack.

### Ana başlıklar
- 🥗 **Nutrition backfill %54 → %100** (Codex backfill-6/7/8/9 merge, 400 tarif macro, backfill-10 gerekmedi)
- 🔧 **audit-deep WARNING 498 → 0**: 26 CRITICAL alerjen fix, 78 over-tagged temizlik, 42 yanlış tag removal, 14 YUMURTA data-driven cleanup, 76 tek-ingredient grup null, 13 partial grouping (7 transfer + 6 flatten), 276 boilerplate tipNote/servingSuggestion → null, timer regex bug (70 false positive), 3 CORBA kategori taşıma, unit standardize, 2 duplicate title rename, 3 TIME_GAP
- 🔍 **audit-content.ts yeni** (Claude) — içerik kalite audit: COMPOSITE_COMMA + STEP_INGREDIENT_MISSING + MISSING_GROUPS + VAGUE_LANGUAGE + TIME_GAP + diğer 7 kategori
- 🤝 **Codex2 ortak analiz** (bağımsız): 28 step-mismatch (tuz/karabiber/un eksik) + 24 composite row split ("Tuz, karabiber, pul biber" tek row → 3 ayrı) + 3 ek semantik bulgu (jokai Sıvı yağ, csalamade Şeker, banh-mi Sirke/Şeker/Kişniş)
- 🎯 **Tarif-özel fix'ler**: profiterol krema + step revise + grup, atom-sos adım sırası, patatas-bravas step 4 ekle, vietnam-yumurta-kahvesi netleştir, cao-lau/com-tam/bo-luc-lac sos ref uyum, kourabiethes/makroudh/lokma-tatlisi grup, dereotlu-kur-somon/kvass kür/ferment süresi, 5 "iyice" somut kriter, humus Pul biber + kladdkaka Un eksik ekle + GLUTEN
- ⚙️ **audit iyileştirmeleri**: asciiNormalize (ekmek→ekmegi inflected form), keyword listesi allergens.ts ile sync (kefir/filmjölk/gochujang/furikake/yengeç/dolmalık fıstık/tortilla/yulaf/vs), tolerance (kür 36h, eser kcal <10, boilerplate threshold 6)
- 📋 **Source sync**: 52 `seed-recipes.ts` tarif + 14 bootstrap `prisma/seed.ts` tarif DB snapshot'ına göre regenerate (ingredients + steps + cookMinutes + tipNote + servingSuggestion field-by-field)
- 🔒 **CI guard genişletildi**: `validate-batch.ts` + 2 yeni ERROR check (composite-comma + step-ingredient-mismatch). Yeni Codex batch'te pattern'lar merge öncesi bloklanır
- 🧩 **`src/lib/allergen-matching.ts` tek kaynak**: ALLERGEN_RULES + ingredientMatchesAllergen + inferAllergensFromIngredients unified. allergens.ts re-export eder

### 🎉 Faz 3 başlangıç — Review/Rating sistemi (full-stack)
- 💾 Schema: `Review` model (userId+recipeId+rating 1-5+comment nullable+status+timestamps, `@@unique([userId, recipeId])`), ReportTarget enum'a `REVIEW` değeri. Migration `20260417000000_review_system` applied.
- 🔒 Validation: `reviewSchema` (Zod) — rating 1-5 int + comment 10-800 char optional. `reportSchema.targetType` artık enum VARIATION|REVIEW.
- 🔒 Rate limit: `review-submit` scope (10 yorum/saat)
- ⚙️ Server actions: `submitReviewAction` (upsert pattern — edit aynı endpoint), `deleteOwnReviewAction` (ownership gate)
- 📊 Query: `getRecipeReviews` (published liste + aggregate: average/count/distribution), `getUserReviewForRecipe` (form prefill)
- 🎨 UI (4 component): `StarRating` (interactive + read-only, hover state, radiogroup ARIA), `ReviewForm` (yıldız + comment, 800 char counter, edit-aware), `ReviewsSection` (server RSC — summary card + histogram bars + login prompt + list), `DeleteOwnReviewButton`
- 🌐 SEO: `AggregateRating` JSON-LD koşullu (count > 0) — Google rich results eligibility. Fake rating abuse guard.
- 🧪 363 unit + build PASS

### 📝 Codex batch 11+ için docs güncellemesi
- `RECIPE_FORMAT.md` → 6 yeni "Veri doğruluğu" kuralı ("CI bloklar")
- `CODEX_HANDOFF.md` §6.7 + §6.8 — yanlış/doğru kod blokları + pre-flight zorunlu
- 5 kritik kural: virgül-composite YASAK, step-ingredient consistency, servingSuggestion sos refs, adım sırası mantıklı, step derived component açık

### Yeni ops tooling (~22 yeni script)
- 3 audit: `audit-content.ts`, `audit-step-ingredient-mismatch.ts`, `audit-composite-rows.ts`
- 17 fix: `fix-critical-allergens.ts` + `v2`, `fix-mayonez-yumurta.ts`, `fix-overtag-allergens.ts`, `fix-inconsistent-tags.ts`, `fix-zero-tag-recipes.ts`, `fix-boilerplate-to-null.ts`, `fix-unit-lt-to-litre.ts`, `fix-duplicate-titles.ts`, `fix-single-ingredient-groups.ts`, `fix-partial-grouping.ts`, `fix-corba-categories.ts`, `fix-kesin-batch.ts`, `fix-procedure-flow.ts`, `fix-vietnam-sauce-refs.ts`, `fix-final-polish.ts`, `fix-step-ingredient-mismatch.ts`, `fix-composite-row-split.ts`
- 2 sync: `sync-source-from-db.ts` (drift raporu), `patch-source-from-db.ts` (DB→source regenerate)

### Schema değişiklikleri (17 Nis)
- `Review` model + `reviews` tablo + 3 index
- `ReportTarget` enum + `REVIEW` değeri
- `User.reviews Review[]` relation
- `Recipe.reviews Review[]` relation

### Sonuç
- `audit-deep.ts`: 🟢 0 CRITICAL / 0 WARNING / 26 INFO — PASS
- `audit-content.ts`: 🟢 0 CRITICAL / HIGH 13 (8 kahve 2-ingredient + 5 smoothie ≤2 step, legitimate) / MEDIUM 127 / LOW 0
- `validate-batch.ts`: 0 ERROR (595 WARNING çoğu cuisine-null, retrofit otomatik doldurur)
- Build + typecheck: clean, 363 unit test green

### Sıradaki
- ⏳ **Codex batch 11** — kardeş Eren güncellenmiş docs ile 100 tarif yazacak (regional Türk zenginleştirme + smoothie/kahve + eksik mutfaklar)
- ⏳ **Review sistemi ikinci iterasyon** — admin moderation (Report targetType=REVIEW handler), profil "Yorumlarım" section, REVIEW_POSTED notification, preflight moderation, dedicated unit/E2E test
- ⏳ **Faz 3 devam**: i18n aktivasyonu (EN/DE), AI Asistan v2 ingredient synonym genişletme, video entegrasyonu

---

## 16 Nisan 2026 — mega session özeti

**🎉 1000 TARİF MİLESTONE TAMAMLANDI!** ~70 commit. Batch 6-10 merge (506→1000), AI Asistan 17 özellik, cuisine tam entegrasyon (20 kod), 92 tarif kalite fix, nutrition pipeline (%54 coverage), UI/UX büyük polish, SEO (FAQ schema + sitemap cuisine + dinamik title), admin dashboard, bf-cache, deep DB audit.

### Tarif büyümesi
- 📊 **506 → 1000**: batch 6 (+100), 7 (+100), 8 (+100), 9 (+100), 10 (+94). 20 mutfak aktif.
- 🥗 **Nutrition backfill**: 5 pass (~490 tarif macro), coverage **%54**. Devam ediyor.
- 🔍 **Deep DB audit** (`scripts/audit-deep.ts`): 7 alan, ~40 kontrol. 26 CRITICAL (eksik alerjen), 498 WARNING, yapısal sorun SIFIR.
- 🧪 **363 unit + 24 E2E** yeşil.

### AI Asistan — 17 iyileştirme
1-3: Cuisine filter + malzeme hariç tutma + 200-cap kaldırma
4-7: Pantry 15 + synonym + cuisine flag + commentary prefix
8-10: Sonuç 10 + arama geçmişi + filtre duyarlı commentary
11-14: Popüler chip + fallback combo + tag chip + progress bar
15: Malzeme autocomplete (689 isim, Türkçe fuzzy, keyboard nav)
16: Arama paylaş (URL kodlama + auto-submit)
17: Sonuç sıralama tercihi (eşleşme / hızlı / az eksik)

### Cuisine tam entegrasyon
- 💾 Schema `cuisine String?` + migration + 20 kod (tr→se)
- 🎨 CuisineFilter aktif (/tarifler + /tarifler/[kategori])
- 🎨 RecipeCard flag + tarif detay badge + "Bu mutfaktan diğer tarifler →" link
- ✨ Homepage + Keşfet "Mutfaklara Göz At" section
- 🌐 Sitemap cuisine landing pages (~18 URL)
- 📝 Meta description + JSON-LD recipeCuisine + FAQ schema dinamik
- 📊 Admin dashboard cuisine bar chart
- ⚡ Benzer tarifler cuisine-aware (+1.5 aynı mutfak bonus)
- 🧪 42 cuisine inference test

### UI / UX
- ✨ SearchBar autocomplete (tarif adı + malzeme, homepage + /tarifler + /kesfet)
- ✨ Homepage "🔥 En Popüler" section (viewCount top 8)
- ✨ Homepage 🎲 rastgele tarif shuffle (client-side, server action)
- ✨ Keşfet: popüler aramalar chip + popüler tarifler + mutfaklar + AI CTA + arama
- ✨ Tarif detay "🧠 Bu malzemelerle başka ne yapılır?" AI cross-link
- ✨ Tarif detay "Bu mutfaktan diğer tarifler →" keşif linki
- 🎨 `/tarifler` dinamik title ("Japon Tarifleri | Tarifle")
- 🎨 `/tarifler` aktif filtre chips (× ile kaldır + "Hepsini temizle")
- 🎨 `/tarifler` boş sonuç filtre gevşetme önerileri + AI cross-link
- 🎨 Kategori sayfası tam filtreleme (Allergen + Diet + Cuisine) + aktif chips
- 🎨 Kategori boş sonuç "Filtreleri temizle" önerileri
- 🎨 Navbar aktif sayfa highlight (desktop primary, mobil bg tint)
- 🎨 Hakkımızda dinamik istatistik kartları (revalidate 3600)
- 🎨 Hero tarif sayısı count-up animasyonu (easeOutExpo)
- 🎨 Tarif detay görüntülenme göz ikonu
- 🧹 Homepage 10→8 section ("Yeni Eklenenler" kaldırıldı, scroll optimize)
- 🧹 Keşfet rastgele tarif kaldırıldı (homepage'de zaten var)

### SEO
- 🌐 Sitemap cuisine landing pages (~18 URL)
- 📝 Meta description cuisine prefix
- 📝 JSON-LD recipeCuisine dinamik
- 📝 FAQ schema (tarif detay: 7 SSS + kategori: 2 SSS)
- 📝 `/tarifler` dinamik title

### Kalite + altyapı
- 🐛 92 tarif kalite audit (D:42 tipNote + B:12 group + A:4 serving fix)
- ✅ isFeatured %6.4 → %10.8
- ⚡ bf-cache restore handler + security headers
- ⚡ LCP font opt + Lighthouse re-baseline (Perf 96-97)
- ⚡ RSS feed 30→50
- 📊 Admin dashboard: 10 stat card + cuisine chart + nutrition coverage
- 📝 Codex HANDOFF kalite kuralları (6.5 tipNote + 6.6 group)
- ⚙️ AllergenFilter + DietFilter + CuisineFilter pathname-aware fix

### Sıradaki
- ✅ ~~Codex batch 10~~ — **1000 tarif tamamlandı!**
- ✅ ~~26 CRITICAL alerjen fix~~ — 17 Nis turunda kapatıldı
- ✅ ~~Codex nutrition backfill~~ — 17 Nis'te %100 coverage
- ✅ ~~498 WARNING değerlendirme~~ — 17 Nis'te 0'a indirildi
- ⏳ Faz 3 hazırlık: i18n, review/rating, video entegrasyonu

## 16 Nisan 2026 session 3 — batch 7 + kalite fix + cuisine genişletme

Codex batch 7 merge (**706 tarif**) + 92 tarif kalite audit + cuisine genişletme (20 kod) + RSS 50 + Lighthouse re-baseline. Detay session 4 özeti bu bölümü kapsar.

## 16 Nisan 2026 session 2 — cuisine schema + batch 6 + perf

Cuisine schema migration + CuisineFilter aktivasyonu + batch 6 merge (506→606) + LCP font optimizasyonu. Detay: session 3 özeti bu bölümü kapsar.

---

## 16 Nisan 2026 session 1 — günün toplu özeti

DB-odaklı pass: **3 Codex batch (300 yeni tarif → 506 toplam)** + SEO altyapısı + discovery + admin görünürlük + E2E coverage + Like UI. 15+ commit, hepsi main'de.

### Codex batch akışı (3 batch + 1 emoji retrofit)
- 🍳 **Batch 3** (`8ecbe0b`): 100 tarif, Codex kendiliğinden uluslararası geçiş başlattı (Macar Gulaşı, Stroganoff, Teriyaki, Cajun, Fajita, Miso Çorbası, Ratatouille). 206 → 306.
- 🌍 **Batch 4** (`8ecbe0b`): 100 tarif uluslararası odaklı (İtalyan/Yunan/İspanyol/Fransız/Japon/Meksika 8'er + Hint/Orta Doğu/Kore/Tay). 306 → 406. Uluslararası oran %19 → %31.8.
- 🌏 **Batch 5** (`2bd041f`): 100 tarif eksik mutfaklara (Kore 10, Tay 10, Çin 5+, Kuzey Afrika 7) + boş kategorileri dengeleme (smoothie 0→7, sıcak içecek 0→7, kokteyl 1→10, atıştırmalık 1→13). 406 → **506**. Uluslararası %38.7.
- 🎨 **Batch 4 emoji retrofit** (`39522a2` + sync-emojis): Codex batch 4'te 100 emoji eksik bırakmıştı; ayrı PR ile düzeltti. `scripts/sync-emojis.ts` source→DB UPDATE helper. Sonuç: **506/506 emoji dolu (%100)**.

### DB perf + altyapı
- ⚡ **Detail page composite indexes** (migration `20260416000000`): `recipe_ingredients(recipeId, sortOrder)` + `recipe_steps(recipeId, stepNumber)`. Prisma/Postgres FK için otomatik index yok; perf-audit.ts ile tespit edildi (1000+ tarif × 7 ing → seq scan büyür). Production'a uygulandı, Seq Scan → Index Scan geçişi doğrulandı.
- 📊 **`scripts/perf-audit.ts`** — 10 hot-path sorgu için EXPLAIN ANALYZE runner. Hepsi <0.3ms 506 tarifte. Allergen NOT hasSome + FTS GIN cost-model nedeniyle seq scan tercih ediyor (500-2000'e kadar fine).
- 🧹 **Sitemap ping cleanup**: Google `/ping` 2023 deprecated (404), Bing 410. retrofit-all'dan kaldırıldı (`847e135`); IndexNow değerlendirildi ama YAGNI (Google desteklemiyor, TR'de Bing/Yandex payı düşük).

### SEO + launch readiness
- 🌐 **Dinamik `sitemap.xml` + `robots.txt`** (Next.js convention): 506 tarif + 17 kategori + 8 statik = ~531 URL, hourly revalidate, force-dynamic.
- 🔗 **Per-recipe canonical + per-page canonical** (`/tarif/[slug]`, `/tarifler`, `/tarifler/[kategori]`).
- 🧭 **BreadcrumbList JSON-LD** (Schema.org rich results): tarif detayda 4 seviye, kategoride 3 seviye.
- 📡 **RSS 2.0 feed** (`/rss.xml`): son 30 tarif, RFC 822 tarihler, atom:self-link, auto-discovery `<link rel="alternate">` her sayfanın head'inde.
- 📝 **`docs/SEO_SUBMISSION.md`**: Google Search Console + Bing Webmaster step-by-step. Kerem ana PC'den uyguladı: GSC sitemap submit "Başarılı" (231 keşfedilen sayfa), Bing import + sitemap submit (331 URL).
- 🔧 **CI build fix** (`7b2b20c`): `/rss.xml` + `/sitemap.xml` route handler'ları placeholder DATABASE_URL ile prerender patlıyordu — `export const dynamic = "force-dynamic"` ile çözüldü.
- 📈 **Lighthouse baseline** (`docs/PERFORMANCE_BASELINE.md`): 4 sayfada Perf 94-97, A11y/BP/SEO 100, LCP 2.5s sınırda. Heading-order fix `/tarifler` + `/tarifler/[kategori]` (sr-only h2).
- 🍒 **AggregateRating bilinçli atlandı**: Google gerçek kullanıcı rating'i ister, bookmark/likeCount yetmiyor (structured data abuse riski).

### Discovery + ana sayfa
- ✨ **Benzer tarifler öneri motoru** (`src/lib/queries/similar-recipes.ts` + `SimilarRecipes.tsx`): tarif detay altında 6 kart şerit. Kural-tabanlı skor (kategori +3, type +2, ortak tag +1, difficulty +0.5). Score 0 elenir. Tie-break: newer → TR collation. Promise.all paralel yükleme. 12 unit test.
- 🎨 **Homepage `getFeaturedRecipes` rotation**: slug-ordered pool + ISO hafta offset (`getWeekIndex`), wrap-around. Bir hafta aynı 6, ertesi hafta farklı 6.
- ✨ **"Yeni Eklenenler" homepage section**: `getRecentRecipes(14gün, 8 kart)`. 506 tarifle batch'lerin yeni içerikleri spotlight'ta görünür.
- 🇹🇷 **CuisineFilter UI placeholder** (`/tarifler`): 14 mutfak chip (🇹🇷🇮🇹🇫🇷🇪🇸🇬🇷🇯🇵🇨🇳🇰🇷🇹🇭🇮🇳🇲🇽🇺🇸🌍🌍), "Yakında" badge. 1000 tarife yaklaşırken schema migration + retrofit ile aktive.

### Codex batch pipeline güçlendirme
- ✅ **Validator** (`scripts/validate-batch.ts`, `npm run content:validate`): Zod + semantik (muğlak ifade ERROR, kcal/makro WARNING, alkollü tag cross-check, slug çakışması). DB'siz. CI `check` job'una eklendi → format ihlali merge bloklar.
- 🧹 **Rollback safety net** (`scripts/rollback-batch.ts`): 3 girdi modu (`--slugs`, `--slugs-file`, `--batch N`) + 3 katman güvenlik (dry-run default, echo-confirm phrase, variation/videoJob block). AuditLog kaydı.
- 🎨 **Emoji sync** (`scripts/sync-emojis.ts`): source'taki emoji'leri DB'ye UPDATE eder. Codex emoji eksik bırakırsa düzeltme yolu. Transaction timeout 60sn (100 update için Neon RTT).

### Admin + UI
- 📊 **Admin dashboard genişletildi** (`fc7bddc`): 6 → 8 stat card (Bookmark + Koleksiyon eklendi) + Aktivite section (Bugün/Hafta/Ay) + Son seed batch tablo (date_trunc hour, count > 5) + kategori dağılımı bar chart (17 kategori, primary renkli).
- ❤️ **Like UI butonu** (`LikeButton`): backend → UI gap kapatıldı. `toggleLikeAction` server action vardı ama hiçbir UI'da yoktu. Optimistic update + auth gate + 3 görsel state. `getLikedVariationIds` helper N+1 önler. **A11y bonus fix**: VariationCard nested-interactive ihlali (button içinde button) — restructure ile sibling yapıldı.

### Test coverage
- 🧪 **Unit: 230 → 303** (+73). Yeni: validate-batch (19), recipe-search sanitize (6), seo-breadcrumb (6), similar-recipes (12), rollback-batch (6), seo-rss (13), recipe-featured-rotation (11), seo-ping silindi (-8 sonra ping kaldırıldı).
- 🧪 **E2E: 12 → 18** (+6). Yeni: collection-flow, ai-asistan-flow (2), shopping-list-flow, variation-flow, cooking-mode-flow.
- 🧪 **A11y regression aktif**: a11y-audit yine 0 violation (CuisineFilter contrast + heading-order + nested-interactive bu pass'te yakalandı, hepsi düzeltildi).

### Auth + observability
- 🔍 **Google OAuth fix doğrulandı**: 14 Nis Vercel log'undaki 6 hata fix öncesinden. Fix sonrası 2 yeni Google user başarıyla kayıt (keroli.aga + akindarkhes), username otomatik mint, KVKK true.

### Sıradaki tek opsiyonel iş
- ⏳ **Codex batch 7-10**: 1000 hedefe 4 batch kaldı. Codex artık `cuisine` alanını yazabilir.
- ✅ ~~Schema'da `cuisine` alanı~~ — session 2'de tamamlandı.
- ✅ ~~LCP optimizasyonu~~ — session 2'de tamamlandı.
- ⏳ **bf-cache fix**: NextAuth cookie + Cache-Control, low priority.

---

## 15 Nisan 2026 oturumu — günün toplu özeti

Public launch ve Codex 500-batch öncesi büyük bir kalite + altyapı pass'i. Tek günde 11 commit, hepsi main'de canlı.

### Kullanıcı tarafı yeni özellikler
- ✨ **Şifremi unuttum akışı** — `/sifremi-unuttum` + `/sifre-sifirla/[token]` + `PasswordResetToken` schema (1h TTL, email enumeration defense, OAuth-only user için bilgilendirme maili).
- ✨ **Bugünün tarifi widget'ı** — ana sayfada deterministic daily pick (UTC gün indeksi % tarif sayısı, slug-orderlı, 12 kural-bazlı curator note + 5 intro varyantı).
- ✨ **"En çok beğeni" sort** — `/tarifler` chip'ine 6. seçenek, in-memory aggregation + TR collation tie-break.
- ✨ **Kullanıcı kendi uyarlamasını silebilir** — ownership gate + hard delete + AuditLog. Tarif detay + profil iki yerden. **Düzenleme bilinçli olarak EKLENMEDİ** (edit + beğeni koruma = abuse vektörü).
- ✨ **Alerjen sistemi** — `Allergen` enum (10 değer) + `Recipe.allergens Allergen[]` + GIN index. Tarif detayında collapsible `<details>` (besin değerleri altında, "Alerjin varsa malzeme listesine bir de sen göz at."), `/tarifler`'de "içermesin" filter row.
- ✨ **Vegan/vejetaryen** — `lib/diet-inference.ts` + retrofit (42 yeni tag, 2 yanlış temizlik). Tarif detayında yeşil `🌱` chip, `/tarifler` dedicated "DİYET" filter.
- ✨ **Malzeme grupları** — `RecipeIngredient.group String?` "Hamur için / Şerbet için / Sos için". Revani + 6 tarif daha (baklava, künefe, mantı, lahmacun, ali-nazik, hünkar beğendi, boza) composite isim temizliği (46 ingredient update).
- 🎨 **Ana sayfa düzeni**: Hero → Öne Çıkan → Günün Tarifi → AI Asistan → Kategoriler.
- 🎨 **Bugünün Tarifi polish**: "İleri" → "Zor", `~XXX kcal` chip.
- 🎨 **Dil tercihi UI** — `/ayarlar` LanguagePreferenceCard (🇹🇷/🇬🇧/🇩🇪 disabled + "Yakında").

### Bug fix'ler
- 🐛 **AI Asistan pantry false-positive**: "Sucuk" eski algoritmada "su" prefix'ine match'lüyordu → %100 false-positive. `isPantryStaple` exact-token containment ile düzeltildi.
- 🐛 **Baklava + Revani tipnote**: "ya da tersi" muğlak ifadesi iki case'e ayrıldı.
- 🐛 **AI Asistan select-name**: filtre dropdown'larına `htmlFor`/`id` label association.

### A11y — WCAG 2.1 AA
- ♿ **`@axe-core/playwright` ile 10 sayfa × 2 tema (light + dark)**: 164 critical/serious node → **0**.
- 🎨 **Renk paletinde 9 token koyulaştırıldı** (primary `#e85d2c → #a03b0f`, secondary `#d4a843 → #785012`, accent-green/blue/warning/error/success/text-muted hepsi AA uyumlu). Brand turuncu ailede kaldı.
- 🎨 Badge tint `/15` → `/10`, footer logo `text-lg` → `text-xl` (large text kategorisi).
- 🧪 `tests/e2e/a11y-audit.spec.ts` — CI regression guard.

### Codex 500-batch öncesi DB hijyeni
- 🔒 **Seed input validation** (`lib/seed/recipe-schema.ts`) — Zod, slug regex, enum guard'ları, prep+cook≈total soft-check. 500'den 1 bozuksa diğerleri yine yazılır.
- ⚡ **GIN index on `Recipe.allergens`** — array hasSome/hasNone filter ms-düzeyi.
- ⚙️ **`scripts/retrofit-all.ts`** — tek komut allergens → diet tags orchestrator.
- 💾 **i18n minimal prep**: `Recipe.translations Json?` JSONB bucket, locale-keyed, opsiyonel. Faz 3'te aktive olur.
- 🧹 **Prisma migration baseline temizliği** — Pass 10'dan biriken 8 `db push` değişikliği `prisma/migrations/20260415120000_codex_batch_prep/migration.sql` altında formal migration. `prisma migrate resolve --applied` ile mevcut DB'de işaretlendi (re-run yok). Bundan sonra `db:migrate` kullanılacak.
- 🔍 **Full-text search** (`20260415180000_add_fulltext_search`) — `searchVector` generated tsvector (A/B/C weighted) + `immutable_unaccent` SQL wrapper + GIN index. `/tarifler` araması `websearch_to_tsquery('turkish', ...)` + `ts_rank_cd` ile; ingredient adı fallback union'u. Kök eşleşme (mantılar→Mantı), aksan-bağımsız (manti→Mantı).
- 🔒 **Batch pre-flight validator** (`npm run content:validate`) — Zod + semantik katman: muğlak ifade regex ban, kcal/makro uyumu, alkol tag cross-check, slug çakışması. DB'ye dokunmaz; seed'den önce koşulur.

### Test coverage genişletme
- 🧪 **`tests/unit/badges-service.test.ts`** (13 test, Prisma+notifications mock — `vi.hoisted` pattern).
- 🧪 **`tests/unit/email-verification.test.ts`** (5 test, consume akışı + tx shape + best-effort badge).
- 🧪 **`tests/e2e/auth-roundtrip.spec.ts`** (1 test, login → /ayarlar → profil → çıkış → state geri).
- 🧪 **`tests/unit/validate-batch.test.ts`** (19 test, TR normalize + muğlak regex + macro + alkol cross-check + slug dup).
- 🧪 **`tests/unit/recipe-search.test.ts`** (6 test, sanitizeQueryInput sınır durumlar).
- **Sonuç: 114 → 255 unit, 9 → 12 E2E test yeşil.**

### Dokümantasyon
- 📝 **`docs/CHANGELOG.md`** yeni — kategorik organize (17 başlık), her iş tek satır + emoji işaret. Her yeni iş ilgili kategorinin altına eklenir.
- 📝 **`RECIPE_FORMAT.md`** — yeni alanlar (allergens, group, translations) + "Dil ve anlatım kalitesi" bölümü 7 yazım kuralı (muğlak ifadeler / belirsiz ölçüler / composite isim YASAK).
- 📝 **`CODEX_HANDOFF.md`** — `retrofit-all.ts` adımı + en kritik 3 yazım kuralı özeti.
- 📝 Memory güncel: `feedback_project_status_format.md`, `feedback_time_framing.md` eklendi.

### Repo hijyeni
- 🔒 **Repo private yapıldı** (kullanıcı), `.claude/settings.local.json` + `.claude/launch.json` gitignore'a.
- ⚙️ Codex'in clone edebilmesi için kardeş **Collaborator** olarak eklenecek (kullanıcı yapacak).

### Sıradaki tek opsiyonel iş
- ✅ **Full-text search (Postgres `to_tsvector`)** — 15 Nisan 2026 akşam eklendi (aşağıda "DB pass — FTS + batch validator" bölümü).

---

## 16 Nisan 2026 — Perf audit + ping cleanup ✅

Codex batch 4'ü yazarken kısa bir bakım pass'i.

- 🧹 **Deprecated ping step temizliği**: retrofit-all pipeline'ından Google+Bing sitemap ping adımı kaldırıldı (Google `/ping?sitemap=` 2023 kapandı, Bing 410). `src/lib/seo-ping.ts`, `scripts/ping-sitemap.ts`, ilgili 8 unit test + `content:ping` shortcut silindi. IndexNow değerlendirildi ama Google desteklemediği ve TR'de Bing/Yandex payı düşük olduğu için YAGNI.
- 📊 **DB hot-path perf audit** (`scripts/perf-audit.ts`) — 306 tarif ölçeğinde 10 hot sorgu EXPLAIN ANALYZE'dan geçti. Hepsi < 0.3ms execution. 4 seq scan tespiti:
  - `/tarifler` base alphabetical → 306'da fine, 1000+'a bakılır
  - Allergen NOT hasSome → Postgres GIN NOT desteği zayıf, 2000+ tarifte denormalize bakılır
  - FTS tsvector → planner 306'da seq scan tercih (cost model), 500+'ta GIN'e geçecek
  - **Recipe ingredients/steps FK seq scan** → GERÇEK darboğaz: Prisma/Postgres FK'de otomatik index yok
- ⚡ **Fix**: `RecipeIngredient(recipeId, sortOrder)` + `RecipeStep(recipeId, stepNumber)` composite index (migration `20260416000000_detail_page_indexes`). Production'a uygulandı, Seq Scan → Index Scan doğrulandı. Tarif detay sayfası hot path artık 1000+ tarife ölçeklenebilir.

## 15 Nisan 2026 — SEO pass + Benzer tarifler + Breadcrumb ✅

Codex batch 1 main'de + production'da (106 tarif canlı). Codex batch 2'yi yazarken paralel bir pass: SEO altyapısı + discovery feature + rich results eligibility.

- 🌐 **Dinamik sitemap.xml + robots.txt** (Next.js convention): 131 URL (8 statik + 17 kategori + 106 tarif), hourly revalidate. `/admin`, `/api/*`, auth-gated yollar disallow.
- 🔗 **Per-recipe canonical + OG meta**: `/tarif/[slug]` sayfasında `alternates.canonical`, `openGraph`, `twitter:card`. `/tarifler?q=…&kategori=…` kombinasyonları param-free `/tarifler` canonical'a işaret eder, filter varyantları ayrı indexlenmez. `/tarifler/[kategori]` sayfasına da canonical eklendi. Detail page JSON-LD Recipe schema (nutrition + ingredients + steps + author) zaten sağlamdı.
- 🧭 **BreadcrumbList JSON-LD** (Schema.org): `/tarif/[slug]` (4 seviye) ve `/tarifler/[kategori]` (3 seviye) sayfalarına enjekte edildi. Google Search sonuç kartının altına "Ana Sayfa › Tarifler › Kategori › Tarif" şeridi çıkar → CTR artışı + rich results eligibility. `generateBreadcrumbJsonLd` helper'ı `src/lib/seo.ts`'te.
- ✨ **Benzer tarifler öneri motoru** (`src/lib/queries/similar-recipes.ts` + `SimilarRecipes.tsx`): tarif detay altında 6 kart'lık şerit. Kural tabanlı skor: aynı kategori +3, aynı type +2, ortak tag +1, aynı difficulty +0.5. Score 0 → gizli (noise önleme). Tie-break: newer → TR collation. Detail page `Promise.all` ile bookmark + collections + similar paralel yükleniyor, ek round-trip yok.
- 🧪 12 similar-recipes + 6 breadcrumb unit = 18 yeni. **279 unit + 12 E2E yeşil**.
- 📝 `docs/SEO_SUBMISSION.md` — Google Search Console + Bing Webmaster Tools submission rehberi (property verify, sitemap submit, URL inspection, CWV izleme, sitemap ping helper). Kerem Search Console'a ekleyene kadar sitemap passive; eklendikten sonra günler içinde indexleme.
- ✅ Browser verified: sitemap (106 tarif hepsi), robots.txt, canonical (`/tarifler?q=... → /tarifler`), similar section (Tas Kebabı → 6 et-yemekleri kart), breadcrumb JSON-LD (Tas Kebabı detail → 4 seviye, Et Yemekleri kategori → 3 seviye).

**AggregateRating bilinçli olarak atlanıldı**: Google Recipe rich results için gerçek kullanıcı rating'i gerekiyor. Bookmark/variation likeCount rating yerine geçmiyor; yanlış markup structured data abuse sayılır. Review system (Faz 3 kapsamı) eklenince `aggregateRating` + `review` array takılır.

## 15 Nisan 2026 — DB pass: FTS + batch validator + rollback ✅

Codex batch'i başlamadan önce DB odaklı üç iyileştirme, Claude ile paralel oturumda main'e düştü.

- 🔍 **Postgres full-text search** (migration `20260415180000_add_fulltext_search`): `searchVector` generated STORED tsvector kolonu (title=A, description=B, tipNote/servingSuggestion/slug=C) + `immutable_unaccent` SQL wrapper + GIN index. `websearch_to_tsquery('turkish', ...)` ile `/tarifler` arama kutusunun tamamı yeni `src/lib/search/recipe-search.ts` üzerinden geçiyor. Kök eşleşme (`mantılar → Mantı`), aksan-bağımsız arama (`manti → Mantı`), ingredient adı fallback union'u mevcut. Chip row'a "En alakalı" sort eklendi (sadece query varken).
- ✅ **Batch pre-flight validator** (`scripts/validate-batch.ts`, `npm run content:validate`): Zod'un üstüne semantik katman — muğlak ifade regex ban (`biraz/azıcık/ya da tersi/duruma göre/epey/yeteri kadar` ERROR; `iyice/güzelce` WARNING), kcal vs 4·P+4·C+9·F ±%15 tolerans (alkollü tarifte atlanır), alkollü malzeme ↔ `alkollu` tag cross-check, slug çakışması. DB'ye dokunmaz. `seed-recipes.ts` side-effect olmadan import edilebilsin diye DB init defer + `recipes` export + entrypoint guard. **CI'da `check` job'una eklendi** — format ihlali varsa merge bloklanır.
- 🧹 **Batch rollback safety net** (`scripts/rollback-batch.ts`, `npm run content:rollback`): 3 girdi modu (`--slugs`, `--slugs-file`, `--batch N`). Default dry-run + etki raporu; `--confirm "rollback-batch-N"` echo-phrase ile gerçek silme. Uyarlaması olan tarifleri otomatik bloklar (`--force` override). Her silme `AuditLog(action=ROLLBACK_RECIPE)`. 3 katman güvenlik: dry-run default, echo-confirm, variation/videoJob block.
- 🧪 Test: 19 validator + 6 FTS sanitize + 6 rollback helper unit eklendi. **261 unit + 12 E2E yeşil**.
- 📝 `CODEX_HANDOFF.md`: 5.2.5'te pre-flight validator adımı, 7'de rollback runbook.

## 15 Nisan 2026 — Test coverage genişletme ✅

İki eksik alan kapatıldı: badge service + email verification için Prisma-mock unit testler ve login round-trip için E2E.

- **`tests/unit/badges-service.test.ts`** (13 test): `vi.hoisted` + `vi.mock` ile prisma + notifications mock'lanıyor. `grantBadge` happy/P2002 dup/error path; `awardEmailVerifiedBadge` kullanıcı yok / var; `awardFirstVariationBadge` skip if existing / fresh insert; `maybeAwardPopularBadge` threshold (10); `maybeAwardCollectorBadge` threshold (5) + idempotent over-threshold.
- **`tests/unit/email-verification.test.ts`** (5 test): `consumeVerificationToken` not-found / expired / cleanup-error swallowing / valid path (transaction call shape) / badge grant best-effort (rejection swallowed).
- **`tests/e2e/auth-roundtrip.spec.ts`** (1 test): `createTestUser` helper ile pre-verified user → `/giris` UI form submit → ana sayfaya redirect → `/ayarlar` auth gate geçiyor → `/profil/[username]` render → navbar profile menü → "Çıkış Yap" → anonim state geri geliyor → `/ayarlar` redirect /giris. Pass 4 bug sınıfı için regression guard.
- **230 unit + 12 E2E yeşil.**

## 15 Nisan 2026 — Prisma migration baseline temizliği ✅

## 15 Nisan 2026 — Prisma migration baseline temizliği ✅

Pass 10'dan itibaren biriken 8 `db push` değişikliği artık formal migration olarak `prisma/migrations/20260415120000_codex_batch_prep/migration.sql` altında. `prisma migrate resolve --applied` ile mevcut DB'ye "uygulandı" olarak işaretlendi (SQL re-run edilmedi — prod değişmedi). Fresh bir DB deploy'unda (e2e branch, future staging) artık `prisma migrate deploy` tam schema kuruyor.

**Kapsadığı değişiklikler**: `Variation.moderationFlags` + `NotificationType` enum + `Notification` table + `PasswordResetToken` + `Allergen` enum + `Recipe.allergens` array + GIN index + `Recipe.translations` JSONB + `RecipeIngredient.group`.

**Durum**: `npx prisma migrate status` → "3 migrations found, Database schema is up to date!" — dev/prod drift yok.

## 15 Nisan 2026 — A11y audit: WCAG 2.1 AA tertemiz ✅

## 15 Nisan 2026 — A11y audit: WCAG 2.1 AA tertemiz ✅

- `@axe-core/playwright` kuruldu, **10 sayfa** tarandı (home, tarifler, tarif detay×2, AI asistan, auth sayfaları, keşfet, hakkımızda).
- İlk tarama: **164 node** critical/serious violation (hepsi renk kontrast + 1 select-name).
- **Select-name fix**: AI Asistan filtre select'leri (Tür/Süre/Zorluk) için `htmlFor`/`id` bağlantısı eklendi.
- **Renk palet revizyonu** — WCAG AA uyumu için token'lar koyulaştırıldı:
  - `--color-primary`: #e85d2c → **#a03b0f** (kontrast white 6.7:1)
  - `--color-primary-hover`: #d14e1f → **#7f2d08**
  - `--color-secondary`: #d4a843 → **#785012** (amber/tütün; text chip'lerde fail ediyordu)
  - `--color-accent-green`: #1fa85a → **#146a36**
  - `--color-accent-blue`: #3b7ae8 → **#184aaa**
  - `--color-text-muted`: #6b6b6b → **#5a5a5a**
  - `--color-success`: #4caf50 → **#2e7d32**
  - `--color-error`: #d32f2f → **#c62828**
  - `--color-warning`: #f57c00 → **#824200**
  - Dark mode primary: #ff6b35 → **#ff7a3d** (dark bg için accent-brightness koruyarak)
- **Badge tint opacity**: `/15` → `/10` (tint bg hafifledi, text kontrastı yükseldi).
- **Footer logo**: text-lg → text-xl (large text kategorisine çıktı).
- **Sonuç**: 164 → 0 critical/serious. Light + dark mode ayrı ayrı pass.
- **Regression guard**: `tests/e2e/a11y-audit.spec.ts` (2 test — light + dark). CI her push'ta çalışacak; yeni sayfa eklenince `PAGES_TO_SCAN` array'ine ekle yeterli.
- Brand tonu biraz koyulaştı — "orange family" içinde kaldı, marka tanınır.

## 15 Nisan 2026 — RECIPE_FORMAT dil kalitesi kuralları ✅

## 15 Nisan 2026 — Baklava/Revani tipnote + CHANGELOG işaretleri ✅

- **Tipnote fix (DB + seed kaynağı)**: "ya da tersi" muğlak ifadesi iki case'e ayrıldı. Baklava: "Fırından yeni çıkmışsa soğuk şerbet, soğumuşsa sıcak şerbet. İkisi birden sıcak olursa şerbet emmez." Revani de aynı mantık ("kek sıcakken/soğukken"). `scripts/fix-tipnotes.ts` idempotent.
- **CHANGELOG.md işaretleri**: 9 tip (✨ yeni / 🐛 bug / 🔒 güvenlik / 📝 docs / 🧹 refactor / ⚙️ chore / 🎨 UI / 🧪 test / 💾 database / ⚡ perf / ♿ a11y). Legend yukarıda. Bootstrap'tan bugüne tüm satırlar işaretlendi.

## 15 Nisan 2026 — Kalan tariflerde group + CHANGELOG ✅

## 15 Nisan 2026 — Kalan tariflerde group + CHANGELOG ✅

- Audit: seed'deki 56 tarifte composite isim / "(servis)" parantezi / duplicate token taraması → 7 tarif grup eklenmesi için uygun: **baklava, künefe, mantı, lahmacun, ali-nazik, hünkar beğendi, boza**. Sütlaç/yayla/mercimek/ezogelin/iskender tek-bölüm, grup abartı olur.
- Konsolide retrofit: `scripts/fix-ingredient-groups.ts` (revani-specific scripti sildik, yerine bu). Per-recipe mapping tablosu, idempotent, `--dry-run`. 46 ingredient güncellendi, 7 zaten hizalı.
- Seed kaynağı (scripts/seed-recipes.ts + prisma/seed.ts) da aynı sekilde güncel — re-seed'de future-proof.
- Boza "Leblebi (servis)" → name="Leblebi" + group="Servis için". AI Asistan artık temiz "leblebi" token üzerinden arama yapar.
- **Yeni**: `docs/CHANGELOG.md` — bootstrap'dan bugüne tüm işlerin başlık başlık tek-satır özeti. PROJECT_STATUS daha aktif takip için, CHANGELOG referans için.

## 15 Nisan 2026 — Malzeme grupları (Hamur için / Şerbet için) ✅

## 15 Nisan 2026 — Malzeme grupları (Hamur için / Şerbet için) ✅

Kullanıcı Revani'de "Şerbet şekeri" ve "Şerbet suyu" ingredient isimleriyle sorun tespit etti — bunlar composite isim değil; "Şeker" + "Su" olmalı, farklı bölümde.

- Schema: `RecipeIngredient.group String?` (nullable, VarChar 80, free-text). Çok-bileşenli tarifler için — "Hamur için", "Şerbet için", "Sos için". NULL = düz liste.
- Type + query + seed validator güncel. Validator: trim + min 1 + max 80.
- `IngredientList` component bucket-by-group render ediyor. Ungrouped → düz liste (backward compat). Grouped → turuncu uppercase heading + subtle separator aralarında. First-appearance order korunur.
- **Revani fix'lendi**: DB retrofit + seed kaynak güncellendi. "Şerbet şekeri" → "Şeker / Şerbet için", "Şerbet suyu" → "Su / Şerbet için". AI Asistan artık "şeker" arayan kullanıcıyı doğru eşleştirir.
- `RECIPE_FORMAT.md`: "X için" convention + yanlış kullanım örneği + basit tariflerde eklememeli uyarısı.
- 7 yeni unit (bucketing: order preservation, null fallback, trim, mixed grouped/ungrouped). **212 unit + 9 E2E yeşil.**

## 15 Nisan 2026 — AI Asistan %100 false-positive bug fix ✅

## 15 Nisan 2026 — AI Asistan %100 false-positive bug fix ✅

Kullanıcı tespit etti: "Sucuklu Yumurta" %100 eşleşme alıyordu, oysa sucuk kullanıcının malzeme listesinde yoktu.

**Root cause**: `isPantryStaple` içinde `ingredientMatches` kullanılıyordu; o fonksiyon user↔recipe match için bidirectional prefix match yapıyor. "sucuk".startsWith("su") → true → Sucuk pantry staple sanıldı → matched listesine girdi → score 3/3 = %100.

**Fix**: `isPantryStaple` için ayrı algoritma — recipe ingredient'ın HER token'ı pantry havuzunda olmalı (exact token containment). "sucuk" → [sucuk] → "sucuk" ∉ PANTRY_TOKEN_SET → not staple ✓. `ingredientMatches` dokunmadı — user matching'i bozmayacak.

- 3 yeni regression test: sucuk/yağmur/sumak/tuzlu-kraker pantry değil, "tuz, karabiber, kimyon" pantry değil (kimyon staple olmadığı için).
- Preview doğrulama: aynı malzemelerle Sucuklu Yumurta artık **%67 eşleşme**, "Eksik: Sucuk — Sadece Sucuk eksik." ✓
- **205 unit + 9 E2E yeşil**.

## 15 Nisan 2026 — i18n minimal schema prep ✅

## 15 Nisan 2026 — i18n minimal schema prep ✅

Tam i18n ertelendi (Faz 3), ama Codex batch öncesi **schema hazırlığı** yapıldı: yarın 500 tarif gelirken Codex dilerse EN çevirisi de gönderebilir, yoksa TR-only kalır. Retrofit ileride çok daha kolay.

- Schema: `Recipe.translations Json?` (JSONB, nullable). Shape: `{ en?: { title, description, tipNote, servingSuggestion, ingredients, steps }, de?: {...} }`. Locale keyed (ISO 639-1).
- Seed validator: opsiyonel `translations` field — Zod ile shape check, unknown locale reddediliyor, partial OK (sadece title EN de verse çalışır).
- Dil tercihi UI: navbar chip yerine `/ayarlar` sayfasında `LanguagePreferenceCard` (🇹🇷 Türkçe / 🇬🇧 English / 🇩🇪 Deutsch select, disabled + "Yakında" rozeti). Destructive DeleteAccountCard'dan önce, günlük ayarlar kümesi içinde. Faz 3'te aktif Server Action'a bağlanacak + User.locale persist edilecek.
- RECIPE_FORMAT.md + CODEX_HANDOFF.md güncel — Codex için opsiyonel field + "İskender/Baklava çevirmez" notu.
- 6 yeni unit. **202 unit + 9 E2E yeşil.**

**Karar — tam i18n neden ertelendi**: kapsam çok büyük (UI string extraction ~300-500, tarif içerik çevirisi kültürel, AI Asistan keyword mapping, allergen inference TR-only, URL yapısı, SEO hreflang, email şablonları — toplam 4-6 oturum). Türkçe MVP launch'u erteleyemeyiz. Plan Section 21 Faz 3'te zaten vardı, orada profesyonel tercüman + LLM hibriti ile yapılacak.

## 15 Nisan 2026 — Codex batch öncesi DB paketi ✅

## 15 Nisan 2026 — Codex batch öncesi DB paketi ✅

Yarınki 500-tarif batch için data integrity + performans + UX hazırlığı.

- **Seed input validation** (`lib/seed/recipe-schema.ts`): her tarif Zod ile pre-validate. 500 row'dan 1'i bozuksa sadece o reddedilir, 499'u yazılır. Slug regex (TR karakter yasak), enum guard'ları (Allergen/RecipeType/Difficulty), prep+cook≈total soft-check (15 dk fudge). 15 yeni unit test.
- **Retrofit orchestrator** (`scripts/retrofit-all.ts`): tek komut — önce allergens, sonra diet tags. `--dry-run` flag. Codex workflow'u basitleşti, 9. adım oldu.
- **GIN index on `Recipe.allergens`**: Postgres array hasSome/hasNone filter'ları için. 500 tarifte sequential scan vs GIN farkı ms-düzeyinde. `@@index([allergens], type: Gin)`.
- **Alerjen uyarı metni sadeleştirildi**: "Malzeme listesini kendin de kontrol et — etiketler kural tabanlı çıkarımla…" → **"Alerjin varsa malzeme listesine bir de sen göz at."** Kısa, samimi, jargonsuz.
- Seed script allergens field'ı passthrough (Codex-provided > retrofit inference); tag filtering type-narrowing fix.
- **196 unit + 9 E2E yeşil.**

## 15 Nisan 2026 — alerjen paneli collapse + diyet filtresi ✅

## 15 Nisan 2026 — alerjen paneli collapse + diyet filtresi ✅

- **Alerjen paneli relocate + collapse**: eski amber "⚠ İÇİNDEKİLER" block ingredient'lerin ÜSTÜNDEYDİ, her tarifte alerjen ikonları kullanıcıyı korkutuyordu. Native `<details>` ile collapsible hale getirildi, konum `NutritionInfo` altına alındı. Summary: "⚠ Bu tarif alerjen madde içerebilir" (neden "içerebilir": inference rule-based, çapraz bulaşma ve hazır soslar kaçabilir). Açılınca subtle tone chip row + uyarı.
- **Vejetaryen/vegan retrofit** (`scripts/retrofit-diet-tags.ts`): idempotent, allergen'lerden sonra koşulur. 42 yeni tag eklendi, 2 yanlış tag temizlendi (ezogelin + mercimek çorbası yanlışlıkla "vegan" etiketliymiş, tereyağı var — retrofit düzeltti).
- **Diet inference** (`lib/diet-inference.ts`): vegetarian = no meat/poultry/seafood; vegan = vegetarian + no SUT/YUMURTA allergen + no honey/gelatin. "bal" için regex + negative lookahead: `/\bbal(?!\s*kabag)\b/` — "balkabağı" (pumpkin) vegan, "bal" (honey) değil.
- **UI**:
  - Tarif detayında vegan/vejetaryen tag'leri **yeşil chip** (`🌱` emoji, `accent-green`) — generic `#hashtag` row'dan ayrı belirgin.
  - `/tarifler`'de dedicated **"DİYET"** filter row (`AllergenFilter`'in yanına). Generic tag list'ten vegan/vejetaryen çıkarıldı (duplikasyon olmasın).
- **Karar — uyarlama düzenleme EKLEN(MİYE)CEK**: edit ile beğeni korur → tarif sahibi 50 beğeni alıp içeriği spam'a çevirebilir → abuse vektörü. Sil özelliği yeterli. Kullanıcının önerisi.
- 15 yeni unit test (diet inference). **181 unit + 9 E2E yeşil.**
- `RECIPE_FORMAT.md` + `CODEX_HANDOFF.md` güncel — retrofit-diet-tags batch sonrasi 2. adım.

## 15 Nisan 2026 — alerjen etiketleri ✅

## 15 Nisan 2026 — alerjen etiketleri ✅

Codex yarın batch getirmeden önce schema + UI hazır. Mevcut 56 tarif retrofit ile etiketlendi.

- Schema: `Allergen` enum (10 değer — EU "big 10" adapted: GLUTEN/SUT/YUMURTA/KUSUYEMIS/YER_FISTIGI/SOYA/DENIZ_URUNLERI/SUSAM/KEREVIZ/HARDAL) + `Recipe.allergens Allergen[]`. `db push` ile uygulandı.
- `lib/allergens.ts`: TR label/emoji map + `inferAllergensFromIngredients` (kural tabanlı keyword match, TR normalisation — "ı" → "i", "ğ" → "g" + Turkish-aware lowercase). Consonant softening için inflected formlar da keyword'te ("fistik" + "fistig").
- **Retrofit script** (`scripts/retrofit-allergens.ts`): idempotent, `--dry-run` + `--force` flag'leri var. Mevcut 35 tarife inference çıktı, 21'i zaten temiz. `hasExisting` var ise skip (Codex'in explicit labeling'ini override etmez).
- UI: tarif detay sayfasında ingredient list'in üstünde amber "⚠ İÇİNDEKİLER" panel + chip row (`AllergenBadges`). `/tarifler`'de "Alerjen · içermesin" filter row (`AllergenFilter`, URL: `?alerjen=X&alerjen=Y`). Filter çalışıyor: Gluten+Süt hariç 56 → 23 tarif.
- `RECIPE_FORMAT.md` + `CODEX_HANDOFF.md` güncellendi — Codex her tarif için `allergens: [...]` alanı girsin, batch sonrası retrofit çalıştırsın.
- Unit test (19 yeni): enum label coverage + kural tabanlı inference (fıstık vs antep fıstığı ayrımı, Turkish normalization, canonical order). **166 unit + 9 E2E yeşil.**

**Not**: tone-of-safety kararı — over-flagging (false positive) safer than under (allergy user skips safe recipe = annoying; misses real allergen = dangerous). Inference kuralları conservative.

## 15 Nisan 2026 — kullanıcı kendi uyarlamasını silebilir ✅

## 15 Nisan 2026 — kullanıcı kendi uyarlamasını silebilir ✅

- `deleteOwnVariationAction`: ownership gate (session.user.id === variation.authorId) → hard delete + AuditLog(`VARIATION_SELF_DELETE`) tx. Admin moderation path'i (soft HIDDEN) bağımsız — author hard delete farklı bir semantik (yanlışlıkla ekleme).
- UI: `DeleteOwnVariationButton` component (native confirm + title echo + `stopPropagation` Link içine gömülebilsin diye). Tarif detay sayfasında sadece author'un açılmış VariationCard'ında + Profil sayfasında owner'ın variation row'larında.
- VariationCard logic: owner → sadece Sil; moderator (owner değil) → Gizle + Report; normal → Report. Kendi uyarlamana report/hide garipti, temizlendi.
- Integration smoke (`test-delete-own-variation.ts`): 2 test user, own-delete OK + cross-user gate reddediyor + AuditLog yazılıyor + cleanup.
- Ayrıca "Bugünün tarifi" polish: "İleri" → **"Zor"** (`getDifficultyLabel` helper, site tutarlılığı) + `~XXX kcal` chip (averageCalories null değilse).

## 15 Nisan 2026 — "En çok beğeni" sort ✅

## 15 Nisan 2026 — "En çok beğeni" sort ✅

- `/tarifler` chip row'una 6. seçenek: **En çok beğeni**. URL: `?siralama=most-liked`.
- `getRecipes` içinde yeni branch: filtrelenmiş tarifleri `variations.likeCount` ile çekip JS'te toplar + sıralar. Tie-break: `title.localeCompare(-, "tr")` — 0-like'lı uzun kuyruk alfabetik.
- `compareByMostLiked` helper pure function olarak çıkarıldı → 6 unit test (sum, tie-break TR collation, empty variations, 0-like alfabetik sıralama).
- Integration smoke (`scripts/test-most-liked-sort.ts`): throwaway user + 2 variation (likeCount 50 vs 2) → high-liked #1'e çıktı → cleanup. Geçti.
- Not: Raw SQL yerine in-memory aggregation tercih edildi — 56-500 tarif scope'unda yeterli + type-safe. Büyürse Recipe'e denormalize `totalLikeCount` alanı + toggleLike'da increment düşünülür. **147 unit + 9 E2E yeşil.**

## 15 Nisan 2026 — "Bugünün tarifi" widget'ı ✅

- Ana sayfada AI Asistan banner'ından sonra turuncu gradient "Bugünün tarifi" card'ı (emoji + başlık + intro+curator note + meta + CTA). Mobil/desktop/dark mode temiz.
- **Deterministic rotation**: UTC gün indeksi % tarif sayısı, `orderBy: { slug: "asc" }` (yeni seed'ler rotasyonu bozmasın diye createdAt yerine slug). 56 tarifle ~2 aylık döngü, herkes için aynı, cache-dostu.
- **Kural-tabanlı curator note** (`lib/ai/recipe-of-the-day-commentary.ts`): 12 kural (type: TATLI/KOKTEYL/CORBA/SALATA/KAHVALTI/ATISTIRMALIK + difficulty HARD + quick/very-quick + light/hearty + popular-variations + featured + fallback). 1-2 varyant per kural, seed-based pick. "AI'dan" disclaimer'ı yok (feedback_ai_positioning).
- **Intro varyantları**: 5 farklı açılış cümlesi ("Bugün için seçimimiz", "Bugün belki bunu denemek istersin"…), seed ile rotate.
- Test: 18 yeni unit (intro/curator/daysSinceEpoch, deterministik + fallback + kural uniqueness). **141 unit + 9 E2E yeşil.**

## 15 Nisan 2026 — şifremi unuttum akışı ✅

- Schema: `PasswordResetToken` modeli (identifier + token + expires + createdAt), TTL **1 saat** (verification'dan kısa, daha hassas). `db push` ile Neon'a uygulandı.
- `lib/email/password-reset.ts`: `sendPasswordResetEmail` + `sendOAuthOnlyPasswordResetEmail` + `consumePasswordResetToken` (transaction: passwordHash update + tüm token'ları sil = single-use + rotation korumalı).
- Server actions: `requestPasswordResetAction` (her zaman generic success → email enumeration defense) + `resetPasswordAction`. Rate limit: `password-reset-request` 3/1sa (email+IP) + `password-reset-consume` 10/1sa (IP).
- OAuth-only user'lar için ayrı bilgilendirme maili ("bu hesap Google ile bağlı, ayarlar'dan şifre ekle") — yine generic UI dönerek enumeration kapalı.
- Sayfalar: `/sifremi-unuttum` + `/sifre-sifirla/[token]`. Token validasyonu sayfa açılışında, consume sadece form submit'te — refresh token'ı yakmıyor.
- Login form'una "Şifremi unuttum" linki + `?reset=ok` success strip.
- `RESERVED_USERNAMES`'a `sifremi-unuttum` + `sifre-sifirla` eklendi.
- Validator (9 yeni unit test) + integration smoke script (`test-password-reset-flow.ts`): token → send → consume → passwordHash değişti → ikinci consume reddedildi → cleanup. **123 unit + 9 E2E test yeşil.**

## 14–15 Nisan 2026 özet — büyük oturum

Tek oturumda public launch hazırlık paketi bitti. 18 pass + UX polish'ler.
**114 unit + 9 E2E = 123 test yeşil**. Main'e push edilen özellikler:

### Altyapı / güvenlik (pass 7, 9, 15)
- Lint + test altyapısı: `eslint .` (Next 16 `next lint` kaldırıldı), Vitest 61+ test
- E2E Playwright (9 test) + GitHub Actions CI (`lint + typecheck + vitest + build`); e2e job secret-gated
- Rate limit genişletildi: `variation-create` (3/saat) + `variation-create-daily` (10/24sa) + `password-change` (5/saat) + `account-delete` (3/saat)
- URL obfuscation bypass tespiti (spaced-dot, [dot], (nokta), "dot"/"nokta" kelimeler)

### Gelişmiş moderasyon (pass 11)
- `lib/moderation/preflight.ts`: 7 sinyal (too_short/too_long/repeated_chars/excessive_caps/contains_url/missing_steps/too_many_steps)
- Variation submit akışı: blacklist hard-reject > preflight flag → `PENDING_REVIEW` + `moderationFlags` CSV
- Schema: `Variation.moderationFlags String?` (db push)
- `/admin/incelemeler` kuyruğu + flag chip'leri + accordion önizleme + Onayla/Gizle

### Bildirim sistemi (pass 10)
- Schema: `Notification` + `NotificationType` enum (6 tip: LIKED/APPROVED/HIDDEN/REPORT_RESOLVED/BADGE_AWARDED/SYSTEM)
- `lib/notifications/service.ts` tip-özel helper'lar (TR copy merkezi)
- Trigger'lar: `toggleLikeAction`, `grantBadge`, admin hide/approve, report resolve — hepsi fire-and-forget
- Navbar bell + unread count + dropdown (son 10, açılınca auto mark-read + optimistic/rollback)
- `/bildirimler` sayfası (Tümü/Okunmamış filtre, type chip'leri)
- `resolveNotificationLink` type-aware router (HIDDEN → /bildirimler, legacy kayıtlar da düzelir)

### Variation UX (pass 11, 13)
- `VariationCard` accordion (malzeme/adım/not açılır-kapanır), modasetör inline "Gizle"
- Variation başına 3 sort chip: En yeni / En çok beğeni / En az malzeme
- Count `_count.variations` artık sadece PUBLISHED sayar (HIDDEN dahil değil)
- **Structured ingredient input**: form `amount + unit + name` ayrı alanlar, `lib/ingredients.ts` legacy string[] ile uyumlu normalize

### /tarifler sıralama (pass 11, 12c)
- Default **alfabetik** (newest seed-batch clustering düzeldi)
- 5 chip: Alfabetik / En yeni / En popüler / En hızlı / En çok uyarlama

### Auth & profil (pass 12, 14, 16, 17, 18)
- `/ayarlar` sayfası — name, username (reserved list + regex + lowercase transform), bio
- Profil düzenle butonu belirgin (bg-primary/10 pastel, hover'da solid)
- Profil variation status rozetleri (Gizlendi/İncelemede/Reddedildi/Taslak)
- **Google hesabı bağla** — signed cookie + HMAC + `signIn("google")` client flow + email match gate
- **Google hesabı unlink** — `passwordHash` zorunlu, aksi halde kilitlenmeye karşı disabled
- **Şifre değiştir** — mevcut + yeni + tekrar, bcrypt verify, rate limit
- **Şifre ekle** — OAuth-only user için, `passwordHash === null` server gate
- **Hesap silme** — username echo + şifre verify + native confirm + transaction (cascading + manuel delete variations/reports/moderationActions + null set recipe.authorId/auditLog.userId/mediaAssets.uploaderId)

### UX polish
- Bildirim navigation type-aware (HIDDEN → /bildirimler)
- VariationCard sade tasarım (Report/Gizle sadece açıkken)
- Hesap silme metni sadeleşti (Recipe anonim-kalır vaadi çıkarıldı, Recipe user-created değil)

### Yeni scriptler (ops tooling)
- `scripts/list-users.ts` — provider + passwordHash + verified durumu
- `scripts/delete-user.ts` — email ile cascading cleanup
- `scripts/list-recipe-slugs.ts` — Codex için snapshot
- `scripts/seed-test-notifications.ts` — preview testi için
- `scripts/smoke-rate-limit.ts` — Upstash canlı sağlık kontrolü

---



## Yapılanlar

- [x] Proje planı dokümanı oluşturuldu (TARIFLE_ULTIMATE_PLAN.md)
- [x] Next.js 16 + TypeScript + Tailwind CSS projesi kuruldu
- [x] Klasör yapısı oluşturuldu (plandaki yapıya uygun)
- [x] Prisma 7 schema yazıldı (17 model, 9 enum)
- [x] Tasarım token'ları tanımlandı (dark/light renk paleti)
- [x] Temel bileşenler oluşturuldu (Navbar, Footer, ThemeToggle)
- [x] Tip tanımları yazıldı (recipe, user, variation, api)
- [x] Validasyon şemaları yazıldı (Zod v4 — login, register, variation, report)
- [x] Utility fonksiyonlar oluşturuldu (slugify, formatMinutes, cn)
- [x] Kategori ve etiket verileri tanımlandı
- [x] Config dosyaları hazırlandı (vitest, prettier, .env.example)
- [x] Neon PostgreSQL bağlantısı kuruldu (PrismaNeon adapter)
- [x] Veritabanı tabloları oluşturuldu (db push)
- [x] Demo seed data eklendi (17 kategori, 15 etiket, 15 tarif)
- [x] Data access layer oluşturuldu (queries/recipe.ts, queries/category.ts)
- [x] Ana sayfa (hero, arama, kategoriler, öne çıkanlar — DB'den)
- [x] Tarifler sayfası (arama + zorluk + kategori filtresi — DB'den)
- [x] Kategori sayfaları (DB'den)
- [x] Tekil tarif sayfası (malzeme, adımlar, besin, JSON-LD — DB'den)
- [x] Keşfet sayfası (öne çıkanlar, hızlı tarifler, kategoriler — DB'den)
- [x] Arama (başlık, açıklama, malzeme) ve temel filtreleme (kategori, zorluk)
- [x] SEO optimizasyonu (meta tags, Open Graph, Schema.org Recipe)
- [x] Light mode varsayılan tema olarak ayarlandı
- [x] Light mode kart arka planları sıcak krem tonuna güncellendi
- [x] Final seed data tamamlandı (56 tarif, 17 kategori, 15 etiket)
- [x] Gelişmiş filtreler eklendi (süre aralığı, etiket, sıralama)

## MVP 0.1 — Tamamlandı ✅

- [x] Vercel'e deploy edildi (tarifle.vercel.app)
- [x] Custom domain bağlandı (tarifle.app — Cloudflare DNS)

## MVP 0.2 — Tamamlandı ✅

- [x] Auth.js v5 ile e-posta + şifre giriş/kayıt sistemi
- [x] JWT tabanlı oturum yönetimi (Credentials provider)
- [x] Giriş ve kayıt sayfaları (`/giris`, `/kayit`)
- [x] Kullanıcı profil sayfası (`/profil/[username]`)
- [x] Bookmark (yer imi) sistemi — optimistic UI
- [x] Beğeni sistemi (varyasyonlar için)
- [x] Varyasyon görüntüleme ve ekleme formu
- [x] Navbar'da kullanıcı menüsü (avatar, dropdown)
- [x] Google OAuth yapısı hazır (credentials henüz bağlanmadı)

## MVP 0.3 — Tamamlandı ✅

- [x] Pişirme modu (adım adım, zamanlayıcı, Wake Lock API, klavye navigasyonu)
- [x] Yazdırma görünümü (print-friendly CSS, gereksiz öğeler gizlenir)
- [x] Alkollü içecek yaş uyarısı (18+ modal, sessionStorage ile)
- [x] Keyword blacklist filtresi (Türkçe argo/küfür kontrolü, uyarlama gönderiminde)
- [x] Raporlama sistemi (uyarlamaları bayrakla, sebep + açıklama)
- [x] Admin paneli — temel moderasyon (/admin)
  - Genel bakış (istatistikler)
  - Raporlar sayfası (rapor inceleme, uyarlama gizle/onayla)
  - Tarifler listesi
  - Kullanıcılar listesi
- [x] "Varyasyon" → "Uyarlama" isim değişikliği (tüm UI)
- [x] Tarif kartlarından "kişilik" kaldırıldı, uyarlama sayısı gösteriliyor

## Faz 2 — Favori Koleksiyonları + Alışveriş Listesi ✅

- [x] Schema: `Collection`, `CollectionItem`, `ShoppingList`, `ShoppingListItem` modelleri
- [x] Tarif sayfasında `SaveMenu`: Kaydet / Listeye ekle / Koleksiyon butonları
- [x] Koleksiyon dropdown: checkbox ile tarif ekle/çıkar, yeni koleksiyon oluşturma
- [x] Koleksiyon detay sayfası `/koleksiyon/[id]` — grid görünüm, düzenle/sil modal
- [x] Profil sayfasında "Koleksiyonlarım" bölümü (4 tarif thumbnail grid)
- [x] `/alisveris-listesi` sayfası — kontrol et/sil, manuel madde ekleme
- [x] "Listeye ekle" — tarifin malzemelerini merge ederek ekler (tr case-insensitive)
- [x] Navbar dropdown: "Alışveriş Listem" bağlantısı
- [x] İsim-bazlı deduplication (aynı malzeme iki kez eklenmez)

## Faz 2 — Sosyal Paylaşım + OG Image + PWA ✅

- [x] Dinamik OG Image: tarif (`/tarif/[slug]/opengraph-image`), koleksiyon, site default
  - Bricolage Grotesque font (woff) Google Fonts'tan runtime'da
  - Türkçe karakter desteği (latin-ext)
  - Twemoji ile emoji rendering
- [x] `ShareMenu` component: Web Share API (mobilde native) + fallback dropdown
  - WhatsApp deeplink (`wa.me`), X/Twitter intent URL, bağlantı kopyalama
- [x] PWA manifest (`src/app/manifest.ts`)
  - `standalone` display, Türkçe dil, theme/bg color tokenleri
  - Shortcuts: Tarifler, Keşfet, Alışveriş Listem (ana ekran kısayolları)
- [x] PWA ikonlar: `scripts/generate-icons.ts` ile Sharp'tan SVG → PNG
  - 192x192, 512x512, 180x180 (apple-touch), 32x32 (favicon), maskable 512
- [x] Root layout: viewport themeColor (light/dark), applicationName, appleWebApp, icons
- [x] SITE_URL fallback: `tarifle.com` → `tarifle.app`

## Review sonrası sertleştirmeler (GPT review pass 1) ✅

- [x] **P1 — Gizli koleksiyon OG/metadata sızıntısı kapatıldı**: `getViewableCollection(id, viewerId)` helper, OG + generateMetadata + page hepsi auth-gated
- [x] **Profil: gizli uyarlamalar sızıntısı**: `getUserVariations(userId, includeHidden)`, `getUserByUsername`'da public _count sadece PUBLISHED sayıyor
- [x] **Email normalization**: `src/lib/email.ts` — auth.ts + register action'da `normalizeEmail(email)`
- [x] **`allowDangerousEmailAccountLinking: false`** (Google provider)
- [x] **Variation action**: artık `variationSchema` kullanıyor, `recipeId` ile hedef tarif doğrulaması, form'a maxLength
- [x] **Report action**: `reportSchema` ile Zod validation, hedef varlık kontrolü, transaction içinde count artırımı, `@@unique([reporterId, targetType, targetId])` constraint, COMMENT açıkça reddediliyor
- [x] **AI provider**: deterministic `orderBy` (isFeatured, viewCount, createdAt)
- [x] **Composite indeksler**: Recipe(status+createdAt/totalMinutes/viewCount/type+difficulty), Variation(recipeId+status+likeCount, authorId+status+createdAt), Report(status+createdAt, targetType+targetId+status), Collection(userId+isPublic+sortOrder+createdAt), CollectionItem(collectionId+addedAt), ShoppingListItem(shoppingListId+isChecked+sortOrder+createdAt)
- [x] **`cn()` utility fix**: artık clsx kullanıyor (object/array inputlarını doğru handle ediyor)

**Sonraki review pass'larda**: rate limiting (Upstash Redis), a11y overhaul (Escape/focus trap), lint+test altyapısı, ingredient synonym/token tablosu.

## Pass 11 — Gelişmiş moderasyon (kural-tabanlı pre-flight) ✅

- [x] **`src/lib/moderation/preflight.ts`** — 7 sinyal: `too_short`, `too_long`, `repeated_chars` (5+ tekrarlı karakter), `excessive_caps` (>%70), `contains_url` (protokollü ya da `domain.tld` deseni), `missing_steps`, `too_many_steps`. Saf string heuristik, AI yok. `FLAG_LABELS` map'i admin UI için TR.
- [x] **`createVariation` action**: blacklist hâlâ hard-reject. Blacklist temizse pre-flight çağırılır → trip ederse `status = "PENDING_REVIEW"` + `moderationFlags = "code1,code2"`. Aksi halde `PUBLISHED` (önceki davranış).
- [x] **Schema ekleme**: `Variation.moderationFlags String?` (VarChar 200, nullable). `db push` ile uygulandı.
- [x] **Action result**: `pending: boolean` döner — `VariationForm` "Uyarlaman alındı ve gözden geçirilecek" mavi panelini gösterir, klasik "yayınlandı" yeşili pending değilken.
- [x] **`/admin/incelemeler`** — yeni admin sayfası: PENDING_REVIEW kuyruğu (en eski → en yeni), her variation için flag chip'leri (TR labels), açılır içerik önizleme (malzeme/adım/notlar), Onayla/Gizle butonları (mevcut `approveVariation`/`hideVariation` action'larını kullanıyor — bildirim sistemi otomatik tetikleniyor).
- [x] **Admin layout + overview**: Nav'a "İncelemeler" sekmesi, dashboard'a "İnceleme Bekliyor" kart (highlight when > 0).
- [x] **Unit testler** (12 yeni): clean variation, too_short, repeated_chars, doubled-char negative, excessive_caps + negative, URL detection (protokollü + plain), false-positive dot-in-text negative, missing_steps, too_many_steps, multi-signal aggregate.
- [x] **Doğrulama**: lint + typecheck + 61 vitest + 9 E2E hepsi pass.

## Pass 10 — In-app bildirim sistemi ✅

- [x] **Schema**: `Notification` modeli + `NotificationType` enum (VARIATION_LIKED / VARIATION_APPROVED / VARIATION_HIDDEN / REPORT_RESOLVED / BADGE_AWARDED / SYSTEM). İki composite index — (userId, isRead, createdAt) bell count için, (userId, createdAt) liste için.
- [x] **Service** (`src/lib/notifications/service.ts`): tip-spesifik helper'lar (`notifyVariationLiked`, `notifyBadgeAwarded`, ...), hepsi fire-and-forget pattern. TR copy merkezi — aynı tip bildirim her yerde aynı okunur.
- [x] **Trigger noktaları**: `toggleLikeAction` (self-like atlanır), `grantBadge` (badge service otomatik), `hideVariation` / `approveVariation` / `reviewReport` (admin). Hepsi async, action success'ını blocklamaz.
- [x] **UI**:
  - **NotificationBell** (client): navbar'da bell icon + unread count rozeti, dropdown son 10 bildirim, açılınca optimistic mark-as-read + rollback, Escape + outside-click (useDismiss). ARIA tam (aria-haspopup, aria-expanded, aria-controls, aria-label count ile).
  - **NotificationBellLoader** (server RSC): auth çekip bell'i beslememüş, anonim'e null döner. Navbar'ın client component olmasıyla RSC tree prop slot üzerinden birleşiyor.
  - **`/bildirimler`** sayfası: full inbox, Tümü/Okunmamış filtresi URL tabanlı, type chip'leri, absolute tarih.
- [x] **Server actions**: `markNotificationsReadAction` (IDs array), `markAllNotificationsReadAction`. User-scoped where clause — tampered submission'lar başkasının inbox'una dokunamaz.
- [x] **Doğrulama**: tsc + lint + vitest clean (49/49). Anonim homepage bell göstermiyor, `/bildirimler` → `/giris?callbackUrl=/bildirimler` redirect. Test bildirimleri için `scripts/seed-test-notifications.ts`.

## Pass 9 — E2E Playwright + GitHub Actions CI ✅

- [x] **Playwright kurulumu**: `@playwright/test` + Chromium. `playwright.config.ts` lokalde dev server'ı auto-boot eder, CI'da headless + retry 2.
- [x] **`tests/e2e/` — 8 smoke test, hepsi pass**:
  - `home.spec.ts` (3) — hero + featured + category grid render, AI banner → /ai-asistan, /tarifler listesi
  - `recipe-detail.spec.ts` (2) — ingredients/steps render, ShareMenu aria-expanded toggle + Escape ile kapatma
  - `auth-pages.spec.ts` (3) — /giris + /kayit formları, KVKK, Google button, sayfalar arası linkler
- [x] **Read-only E2E focus**: İlk iterasyon sadece DB'ye yazmayan akışlar. Register/login round-trip ayrı iterasyonda (E2E'nin kendi Neon branch'i + cleanup infrastructure gerektirir).
- [x] **`.github/workflows/ci.yml`** — 2 job:
  - `check` (her push + PR'da): lint + typecheck + vitest + build. Fake env var'larla (DATABASE_URL, AUTH_SECRET placeholder) çalışır — prod secret'ına gerek yok.
  - `e2e` (secret gated): `E2E_DATABASE_URL` + `E2E_AUTH_SECRET` GitHub Secrets'a eklendiğinde Playwright çalışır. Fork PR'larından çalışmaz (güvenlik). Report artifact olarak yüklenir.
- [x] **Concurrency control**: Aynı branch'e yeni commit gelince önceki run cancel. Resource tasarrufu.
- [x] **Playwright `playwright.config.ts`**: `reuseExistingServer: !CI` ile lokalde açık dev server'a bağlanır, CI'da fresh boot.
- [x] **Sıradaki iterasyon için hazırlık**: E2E'nin production'a yazmaması için `.github/workflows/ci.yml`'de `E2E_DATABASE_URL` secret placeholder'ı. İleride Neon'da `e2e-ci` branch açılıp o URL buraya konur — prod'dan izole E2E.

## Pass 8 — Google OAuth canlıda ✅

- [x] **Google Cloud Console OAuth 2.0 Client kuruldu**: tarifle.app + localhost:3000 authorized origins/redirects, Publish App ile production'a çekildi.
- [x] **Env vars**: `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` hem `.env.local` hem Vercel'e kondu. `AUTH_URL` Vercel'den silindi (Auth.js v5 VERCEL_URL'den otomatik türetiyor, hardcode breaking).
- [x] **Canonical domain fix**: Vercel'de `www.tarifle.app` → `tarifle.app`'e 308 redirect (önceki yön tersti → www'li redirect_uri Google Console'da kayıtlı olmadığı için `redirect_uri_mismatch`).
- [x] **"Username is missing" bug fix**: `PrismaAdapter`'in default `createUser`'i bizim schema'daki required `username` + KVKK alanlarını bilmiyordu. `buildAdapter()` helper yazıldı — spread edilen PrismaAdapter üzerine `createUser` override'ı, User'ı atomik olarak `username` + `kvkkAccepted` + `kvkkVersion` + `kvkkDate` + `emailVerified: new Date()` ile yaratıyor, dönüşte Auth.js'in beklediği `AdapterUser` format'ına (`image` ← `avatarUrl`) dönüştürüyor.
- [x] **Eski manuel create silindi**: signIn callback'teki `prisma.user.create()` ve events.createUser — ikisi de artık gereksiz, tüm logic adapter'da.
- [x] **Ops tooling**: `scripts/list-users.ts` (provider + passwordHash + verified durumu) ve `scripts/delete-user.ts` (email ile cascading silme) — ileride OAuth debug için.
- [x] **Canlı doğrulama**: `wessibf6@gmail.com` ile giriş denendi, DB'ye `providers: google` + `password: no` + auto-generated `username` ile temiz user eklendi.

## Pass 7 — Lint + test altyapısı ✅

- [x] **Next 16 lint fix**: `next lint` Next 16'da kaldırıldı; `package.json`'daki `"lint": "next lint"` → `"lint": "eslint ."`'e çevrildi. `eslint.config.mjs` zaten flat config formatındaydı.
- [x] **ESLint rule overrides** (`eslint.config.mjs`):
  - `@typescript-eslint/no-unused-vars` → `_`-prefixed pattern intentional (`argsIgnorePattern: "^_"` + vars + caughtErrors + destructuredArray). `const { email: _email, ...rest } = user` idiomatik destructure-to-exclude artık flag olmuyor.
  - `@next/next/no-img-element` → off (Cloudinary + `remotePatterns` config gelene kadar `recipe.imageUrl` user-uploaded URL'leri için `<img>` OK; config gelince kaldırılır).
- [x] **React 19 `react-hooks/set-state-in-effect` fix**: `AgeGate`, `ThemeToggle`, `ShareMenu` hepsinde SSR-hydration pattern'i (setMounted in effect) — canonical React 19 pattern olduğundan `// eslint-disable-next-line` + açıklama yorumu.
- [x] **CookingMode TDZ fix**: `goNext`/`goPrev` keyboard handler'dan önce `useCallback` ile deklare edildi. `useEffect` deps array'i doldu. React 19 `immutability` rule yakalamıştı.
- [x] **AiAssistantForm**: `'` yerine `&apos;` escape.
- [x] **error.tsx**: kullanılmayan `error` prop'u `console.error` ile log'lanıyor (boundary hatasını sessiz yutmasın).
- [x] **Final lint**: 0 error, 0 warning. Build de clean (1.7s).

### Vitest altyapı

- [x] **5 test dosyası, 49 test, hepsi pass**:
  - `moderation-blacklist.test.ts` (11) — normalize, TR karakter eşleşme, multi-word phrase, dedup
  - `ai-matcher.test.ts` (20) — prefix match, prefix/substring ayrımı, isOptional, pantry staples toggle
  - `rate-limit.test.ts` (8) — identifier priority, anonymous fail-open, env-missing fail-open, Upstash mock ile denied + error paths
  - `email-normalize.test.ts` (5) — lowercase, trim, Turkish-locale trap (ASCII I → i, ı değil)
  - `useDismiss.test.tsx` (5) — Escape, outside-click, inside-click ignore, `disableOutsideClick`, closed-state no-op
- [x] **Prod bug fix (testler yakaladı!)**: `lib/moderation/blacklist.ts` — blacklist entry'leri (piç, göt, geri zekalı, vb.) TR karakter içerdiği için, normalize edilmiş input'la karşılaştırıldığında sessizce eşleşmiyordu. Module load'da `NORMALIZED_BLACKLIST`, `SINGLE_WORDS` set'i, `MULTI_WORD_PHRASES` ön hesaplandı. Artık bütün TR entry'ler gerçekten bloke ediyor.

## Pass 6 — A11y overhaul (hook'lar + ARIA + reduced motion) ✅

- [x] **`src/hooks/useDismiss.ts`** — dropdown/menü için Escape + outside-click tek hook'ta. `disableOutsideClick` option'ı mobil menü gibi "scroll drag'ı dismiss olarak okuma" durumları için.
- [x] **`src/hooks/useFocusTrap.ts`** — gerçek modal diyaloglar için. Açılınca ilk focusable'a odaklanır, Tab/Shift+Tab container içinde döner, kapandığında odak eski elemana döner. `tabindex="-1"` mantığını doğru ele alır.
- [x] **Navbar** — profil dropdown ve mobil menüye `useDismiss` eklendi. Profil menüsü: `role="menu"`, her item `role="menuitem"`, toggle buton `aria-haspopup="menu"` + `aria-expanded` + `aria-controls="profile-menu"`. Mobil menü: `aria-expanded` + `aria-controls` + dinamik `aria-label` ("Menüyü aç"/"Menüyü kapat"). Outside-click mobil menüde kapatıldı (scroll drag'i dismiss etmesin).
- [x] **SaveMenu** — manuel outside-click hook'u kaldırıldı, `useDismiss` ile değiştirildi (artık Escape de kapatır). "Yeni koleksiyon oluştur" alt-formu da dropdown kapanırken resetleniyor.
- [x] **ShareMenu** — `useDismiss`, `isOpen: isOpen && !hasNativeShare` gating korundu (native share açıkken dropdown yok). Preview doğrulama: tık → `aria-expanded=true` + menü görünür, Escape → kapandı, outside-click → kapandı.
- [x] **CollectionActions (gerçek modal)** — `useFocusTrap` eklendi (önce focusable tabindex=-1 + başlangıç focusu ilk input'a), `aria-labelledby="collection-edit-title"` eklendi, önceki manuel Escape handler kaldı (hook ile çakışmasın diye bilinçli ikili).
- [x] **AgeGate** — `role="dialog"` + `aria-modal="true"` + `aria-labelledby` + `aria-describedby` + emoji `aria-hidden`. Escape eklenmedi (bilinçli — alkol yaş gate'i deliberately blocking).
- [x] **CookingMode** — root container'a `role="dialog"` + `aria-modal="true"` + dinamik `aria-label`. Escape + klavye nav zaten vardı.
- [x] **ReportButton** — `useEffect`'te Escape listener, select'e `autoFocus`, trigger butonuna `aria-label="Bu uyarlamayı rapor et"` + `aria-expanded` + focus-visible ring.
- [x] **VariationForm** — Escape (input içindeyken override eder, spellcheck/IME'yi bozmaz), başlık input'una `autoFocus`.
- [x] **`globals.css`** — `@media (prefers-reduced-motion: reduce)` bloku: tüm transition/animation 0.01ms, scroll-behavior auto. WCAG 2.1 SC 2.3.3. `:focus-visible` global zaten vardı (2px primary outline).

Kalan A11y işleri (gelecek pass'e):
- Form label/hint eşleşmeleri audit (çoğu OK ama kapsamlı bir gözden geçirme gerekir)
- Renk kontrastı WCAG AA için araç-destekli audit (light/dark mode)
- Screen reader smoke test (VoiceOver/NVDA ile elle — manual)

## Pass 5 — Rate limiting (Upstash Redis) ✅

- `src/lib/rate-limit.ts`: sliding window, `tarifle:rl:<scope>` prefix, **fail-open** (env yoksa warning + pass). `getClientIp()` + `rateLimitIdentifier()` helper'ları.
- Tüm sensitif endpointler entegre: register/login (IP), resend-verification/report/variation-create/password-*/account-delete/ai-assistant (user → IP fallback).
- **Prod canlı**: Upstash URL+TOKEN Vercel'de, limitler aktif. Detay scope tablosu için `src/lib/rate-limit.ts`.

## Pass 4 — Kayıt akışı bug fix + Resend prod ✅

- [x] **Register navbar bug**: Kayıttan sonra navbar "Giriş yap" göstermeye devam ediyor, F5 sonrası düzeliyordu.
  - Sebep: `registerUser` server action'ında `signIn("credentials", { redirectTo: "/" })` çağrısı `NEXT_REDIRECT` fırlatıyor; cookie set ama SessionProvider tazelenmiyor.
  - Çözüm: Server action sadece hesap+doğrulama maili yapar, signIn'i client'a bıraktık. `RegisterForm` artık LoginForm pattern'i uyguluyor: `signIn("credentials", { redirect: false })` + `router.refresh()` + `router.push("/")`.
  - Preview doğrulandı: `/api/auth/session` yeni kullanıcıyı dönüyor, navbar avatar anında logged-in state'e geçiyor.
- [x] **Resend production**: Domain tarifle.app verify edildi (Ireland region), DNS records Cloudflare'e one-click ile eklendi, API key üretildi ve hem `.env.local` hem Vercel env vars'a kondu. Mail gerçek kullanıcılara gidiyor.
- [x] **middleware.ts kaldırıldı**: no-op idi, Next 16 deprecation uyarısı veriyordu. Proxy'e rename yerine direkt sildik.

## Faz 2 — E-posta Doğrulama + Rozet Sistemi ✅

- [x] **Email provider abstraction** (`src/lib/email/`):
  - `EmailProvider` interface
  - `ResendEmailProvider` (production, RESEND_API_KEY ile aktif)
  - `ConsoleEmailProvider` (dev fallback, mail'i console'a basar)
  - `getEmailProvider()` factory: env'e bakar, otomatik seçim
- [x] **Verification flow**:
  - `sendVerificationEmail()` → token üret (24sa TTL, base64url, 32 byte), eskileri sil, mail gönder
  - `consumeVerificationToken()` → süre kontrolü, transaction içinde `emailVerified` set + token sil + EMAIL_VERIFIED badge
  - HTML email template (TR, branded, button + plain link fallback)
- [x] `/dogrula/[token]` sayfası (success / not-found / expired durumları, `noindex`)
- [x] Register'a kanca: kayıttan sonra fire-and-forget mail
- [x] `resendVerificationEmailAction` — 1 dk kullanıcı-bazlı in-process throttle (Redis sonra)
- [x] Profil sayfası: `VerifyEmailBanner` sahibe gösterir (email + "Tekrar gönder" buton)
- [x] **Rozet sistemi** (schema + migration `badge_system`):
  - `BadgeKey` enum: EMAIL_VERIFIED, FIRST_VARIATION, POPULAR_VARIATION, RECIPE_COLLECTOR
  - `UserBadge` model (`@@unique([userId, key])` idempotent)
  - `BADGES` config (label/description/emoji/tone)
- [x] Otomatik tetikleme (best-effort, action başarısını bloklamaz):
  - Email verification → EMAIL_VERIFIED
  - İlk variation create → FIRST_VARIATION
  - Like sonrası variation likeCount ≥ 10 → POPULAR_VARIATION (yazar için)
  - Collection count ≥ 5 → RECIPE_COLLECTOR
- [x] Profil sayfasında `BadgeShelf` vitrini (4 tone)

## Faz 2 — AI Asistan (kural tabanlı, AI-gibi) ✅

- `AiProvider` interface + `RuleBasedProvider`: TR-aware token-prefix matcher, pantry staples modu, skor = matchedRequired/totalRequired. `isOptional` puana etki etmez.
- `/ai-asistan` sayfası: chip input + tür/süre/zorluk/pantry filtreleri. Sonuç kartında %eşleşme + eksik malzeme listesi.
- `src/lib/ai/commentary.ts`: senaryo bazlı 3-5 varyant + per-recipe notlar (zirvedeki seçenek, en hızlı, sabır ister…). Seed-based deterministic.
- "Yapay zekasız" disclaimer'ı yok — kullanıcıya AI gibi sunulur. Ana sayfa banner + navbar link. `scripts/test-ai.ts` smoke.
- **Karar**: LLM entegrasyonu şimdilik yok — kural tabanlı motor yeterince AI-gibi, masraf sıfır.

## Devam Edenler

## Tamamlanan Seed Verisi

- 17 kategori, 15 etiket
- 56 tarif (15 ilk seed + 41 final seed)
- Kategoriler: Ana Yemek, Çorba, Salata, Meze, Aperatif, Tatlı, Kahvaltı, Hamur İşi, Baklagil, Pilav, Sos, Kokteyl, Soğuk İçecek, Sıcak İçecek, Smoothie, Pasta, Atıştırmalık

## Sıradaki İşler

### Yakın vadeli (launch öncesi / hemen sonrası)

- [ ] **Codex batch review** — kardeş başka PC'de `scripts/seed-recipes.ts`'ye 50+ tarif ekler, ilk batch'i review et. Hazır altyapı: Neon `codex-import` branch + `docs/CODEX_HANDOFF.md` + `docs/RECIPE_FORMAT.md` (allergens + group + translations + dil kalitesi 7 kuralı). Codex'ten sonra `npx tsx scripts/retrofit-all.ts` ile allergen + diyet etiketleri otomatik dolar.
- [ ] **CI E2E aktivasyonu**: Neon'da `e2e-ci` branch aç → GitHub Secrets `E2E_DATABASE_URL` + `E2E_AUTH_SECRET` ekle → CI workflow'undaki e2e job otomatik çalışır.
- [ ] **Full-text search (Postgres `to_tsvector`)** — 500 tarifte arama hızı + Türkçe kök eşleşme (LIKE scan yerine GIN tsvector). Şu an `contains` ile sequential scan; 500+ tarifle hissedilir hale gelir.

### Orta vadeli (Faz 2 kalanı)

- [ ] **AI Asistan v2**: ingredient synonym/token tablosu (e.g. "domates" ⇔ "çeri domates" eşleştirmesi)
- [ ] **AI-destekli moderasyon**: Claude Haiku ile ön-sınıflandırma (opsiyonel, kural-tabanlı yeterli gelirse geri al)
- [ ] **Şablon video sistemi** (Remotion) — büyük scope, Faz 2/3 arası
- [ ] **A11y manuel pass**: screen reader (NVDA/VoiceOver) elle smoke test (otomatik axe pass'i tertemiz, ama gerçek SR deneyimi insan değerlendirmesi gerektirir)

### Uzun vadeli (Faz 3)

- [ ] **Mobil uygulama** (React Native)
- [ ] **Premium üyelik** (reklamsız + sınırsız AI)
- [ ] **Çoklu dil — i18n aktivasyonu** (EN, DE — schema hazır, `Recipe.translations` JSONB + `LanguagePreferenceCard` placeholder; UI string catalog + provider entegrasyonu kalıyor)
- [ ] **AI tarif videoları** (runway/pika/özel)
- [ ] **Açık API**

## Karar Bekleyenler

- E-posta doğrulaması MVP'de zorunlu mu yoksa opsiyonel mi? (Şu an opsiyonel — doğrulanmamış kullanıcı her şeyi yapabiliyor, sadece rozet eksik)
- AI video için aylık deneme bütçesi belirlenecek mi?
- İlk tarif veri setine kullanıcının özel tarifleri de eklensin mi?
- Gelişmiş moderasyonda AI (Claude Haiku) kullanmadan kural-tabanlı mı gidelim?

## Bilinen Sorunlar

- Prisma 7 CLI komutları (migrate dev, db push) için `--config ./prisma/prisma.config.ts` flag gerekiyor
  (prisma.config.ts dotenv yüklemesi güvenilir değil)

## DB Migration Disiplini

- ✅ Baseline alındı: `prisma/migrations/0_init/migration.sql`, "applied" işaretli
- Bundan sonra schema değişikliklerinde:
  - `npm run db:migrate -- --name kisa_aciklama` → migration dosyası üretir + dev DB'ye uygular
  - Production deploy: `npm run db:migrate:deploy`
  - Status kontrolü: `npm run db:migrate:status`
- `npm run db:push` artık sadece "deneysel/prototype schema değişikliği" için

## Teknik Notlar

- Next.js 16.2.3, React 19.2.4, Tailwind CSS 4
- Prisma 7.7.0 + @prisma/adapter-neon + @neondatabase/serverless
- Auth.js v5 (next-auth@5.0.0-beta.30) — JWT strategy, Credentials provider aktif
- **middleware.ts kaldırıldı** (Next 16'da `proxy.ts` önerilir, bizde no-op'tu, tamamen sildik)
- Light mode varsayılan, dark mode `[data-theme="dark"]`
- Seed script: `npx tsx prisma/seed.ts` (DATABASE_URL env var gerekli)
- **Resend**: `RESEND_API_KEY` env'de → `ResendEmailProvider` aktif, yoksa `ConsoleEmailProvider` (dev fallback). From: `Tarifle <noreply@tarifle.app>`
- **Server action'dan signIn çağırmak sorunlu**: Auth.js v5'te `signIn("...", { redirectTo })` server action içinde NEXT_REDIRECT fırlatır; SessionProvider tazelenmez, client'ta "giriş yapılmamış" görünmeye devam eder. Her zaman client-side `signIn({ redirect: false })` + `router.refresh()` + `router.push(...)` pattern'ini kullan.
