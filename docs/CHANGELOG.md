# Tarifle — Değişiklik Günlüğü

En başından bugüne yapılan her iş, başlık başlık, tek satırlık özetlerle.
Tam detay için `docs/PROJECT_STATUS.md` veya `git log`.

> Son güncelleme: 15 Nisan 2026

## İşaretler

- ✨ yeni özellik
- 🐛 bug fix
- 🔒 güvenlik / hardening
- 📝 dokümantasyon
- 🧹 refactor / temizlik
- ⚙️ config / chore
- 🎨 UI / UX polish
- 🧪 test / CI
- 💾 database / schema

---

## Bootstrap (MVP 0.1 — temel site)

- ⚙️ Next.js 16 + TypeScript + Tailwind 4 proje iskeleti kuruldu.
- 💾 Prisma 7 + Neon PostgreSQL bağlantısı, 17 model + 9 enum ile schema.
- 💾 17 kategori + 15 etiket + 15 demo tarif seed verisi.
- 🎨 Tasarım token'ları (light/dark), Navbar, Footer, ThemeToggle.
- ✨ Ana sayfa (hero + kategori grid + öne çıkan), Tarifler, Kategori, Tarif detay sayfaları.
- ✨ Arama + zorluk + kategori + süre + etiket filtreleri, sayfalama.
- ✨ SEO meta tag'leri, Open Graph, JSON-LD Schema.org Recipe.
- ✨ Hata sayfaları + KVKK/Gizlilik/Kullanım Şartları legal sayfaları.
- ⚙️ Vercel deploy + Cloudflare DNS (tarifle.app canonical, www → non-www 308).
- 💾 Final seed: 56 tarif (15 bootstrap + 41 ek batch).
- ✨ Gelişmiş filtreler + Keşfet sayfası kategoride tarif sayısı.

## MVP 0.2 — Kullanıcı sistemi

- ✨ Auth.js v5 (Credentials provider), JWT strategy, KVKK onay akışı.
- ✨ `/giris` + `/kayit` sayfaları, Google OAuth yapısı hazır.
- ✨ Profil sayfası (`/profil/[username]`), bookmark + beğeni + uyarlama görüntüleme.
- ✨ Uyarlama ekleme formu, varyasyon sort'u, author + like sistemi.
- 🐛 Middleware'den Prisma kaldırıldı (Edge 1MB limiti).
- 🐛 Postinstall ile `prisma generate` (Vercel build fix).

## MVP 0.3 — Moderasyon + kalite

- ✨ Pişirme modu (tam ekran, zamanlayıcı, Wake Lock API, klavye nav).
- ✨ Yazdırma görünümü, print-friendly CSS.
- 🔒 Alkollü içecek 18+ yaş gate'i (sessionStorage).
- 🔒 Keyword blacklist filtresi (Türkçe argo/küfür kontrolü).
- ✨ Raporlama sistemi (spam/argo/yanıltıcı/zararlı/diğer).
- ✨ Admin paneli: dashboard, raporlar, tarifler, kullanıcılar listesi.
- 🎨 "Varyasyon" → "Uyarlama" isim değişikliği (UI geneli).
- 🐛 Giriş yapanlara CTA gizle + navbar'a admin sekmesi.

## Faz 2 — Topluluk & AI paketleri

- ✨ **Favori koleksiyonları + alışveriş listesi**: schema (Collection / CollectionItem / ShoppingList / ShoppingListItem), `SaveMenu` buton, `/koleksiyon/[id]`, `/alisveris-listesi` sayfaları, isim-bazlı deduplication.
- ✨ **OG Image + sosyal paylaşım + PWA**: dinamik OG (Bricolage + twemoji), `ShareMenu` (Web Share API + WhatsApp/X/kopyala fallback), PWA manifest + ikon seti + shortcuts.
- ✨ **AI Asistan (kural tabanlı)**: `AiProvider` interface + `RuleBasedProvider` (TR-aware token-prefix matcher, pantry staples, skor = matchedRequired/totalRequired).
- ✨ **AI-gibi commentary**: senaryo bazlı 3-5 varyant + per-recipe notlar, seed-based deterministic, disclaimer yok.
- ✨ **E-posta doğrulama + rozet sistemi**: `EmailProvider` abstraction (Resend + Console), `/dogrula/[token]`, 4 rozet (EMAIL_VERIFIED / FIRST_VARIATION / POPULAR_VARIATION / RECIPE_COLLECTOR), profilde `BadgeShelf`.

## Security + review pass'ları

- 🔒 **Pass 1**: gizli koleksiyon OG leak fix, private variations leak fix, email normalize, `allowDangerousEmailAccountLinking: false`, Zod schemas on variation/report, composite indexler.
- 🔒 **Pass 2**: OAuth UX, email backfill scripti, schema index sadeleştirme.
- 🐛 **Pass 3**: küçük follow-up (PUBLISHED check, OAuth UX, COMMENT type).
- 💾 **Prisma migration baseline** alındı (db push → migrate workflow).

## Launch hazırlık — pass 4–18

- 🐛 **Pass 4**: kayıt sonrası oturum bug fix (client-side signIn pattern), Resend production'a çekildi, no-op middleware silindi.
- 🔒 **Pass 5 (rate limiting)**: Upstash Redis, sliding window, 9 scope, fail-open, `getClientIp()` + `rateLimitIdentifier()`.
- ♿ **Pass 6 (a11y)**: `useDismiss` + `useFocusTrap` hook'ları, navbar/modal/menu'lerde ARIA, reduced motion media query.
- 🧪 **Pass 7 (lint + test altyapısı)**: Next 16 `eslint .`, ESLint rule override, React 19 purity fix, Vitest 5 dosya 49 test, blacklist prod bug fix (TR karakter).
- ✨ **Pass 8 (Google OAuth canlıda)**: Google Cloud Console kurulum, `buildAdapter()` helper (username + KVKK), www → non-www canonical fix.
- 🧪 **Pass 9 (E2E + CI)**: Playwright 8 smoke test, GitHub Actions `check` + `e2e` job, secret-gated e2e, concurrency control.
- ✨ **Pass 10 (bildirim sistemi)**: `Notification` model + 6 tip enum, trigger'lar (like/badge/hide/approve/report), navbar bell + `/bildirimler` sayfası.
- ✨ **Pass 11 (gelişmiş moderasyon)**: `lib/moderation/preflight.ts` 7 sinyal, `PENDING_REVIEW` + `moderationFlags`, `/admin/incelemeler` kuyruğu, 12 yeni test.
- ✨ **Pass 12–13 (UX + yapılandırılmış input)**: `/ayarlar` profil düzenleme, status rozetleri, belirgin düzenleme butonu, alfabetik default sort, "En çok uyarlama" chip, structured ingredient input (amount + unit + name).
- ✨ **Pass 14 (Google bağla)**: signed cookie + HMAC + `signIn("google")` client flow + email match gate.
- 🔒 **Pass 15 (URL bypass + şifre değiştir)**: URL obfuscation tespiti (spaced-dot, [dot], vb.), şifre değiştirme akışı, rate limit.
- ✨ **Pass 16 (şifre ekle)**: OAuth-only user'lar için, `passwordHash === null` server gate.
- ✨ **Pass 17 (Google unlink)**: `passwordHash` zorunlu, kilitlenme koruma.
- ✨ **Pass 18 (hesap silme)**: username echo + şifre verify + native confirm + transaction (cascading).

## 15 Nisan 2026 — launch hazırlık çarşafı

### Auth

- ✨ **Şifremi unuttum akışı**: `PasswordResetToken` modeli (1h TTL), `sendPasswordResetEmail` + `sendOAuthOnlyPasswordResetEmail`, `requestPasswordResetAction` + `resetPasswordAction`, `/sifremi-unuttum` + `/sifre-sifirla/[token]` sayfaları, login form'una link + success strip.
- 🔒 Email enumeration defense — istek sonucu her zaman generic success, hiç mail gitmese bile.

### Homepage

- ✨ **Bugünün tarifi widget'ı**: deterministic daily pick (`daysSinceEpoch % count`, `orderBy: slug`), 12-kural-bazlı curator note + 5 intro varyantı seed-based, turuncu gradient card.
- 🎨 **Ana sayfa sıralaması**: Hero → Öne Çıkan → Günün Tarifi → AI Asistan → Kategoriler.

### Liste + filtre

- ✨ **"En çok beğeni" sort**: `getRecipes` branch — `variations.likeCount` toplamı, tie-break title asc (TR collation). `compareByMostLiked` helper.

### Variation

- ✨ **Kullanıcı kendi uyarlamasını silebilir**: ownership gate + hard delete + AuditLog (`VARIATION_SELF_DELETE`). Tarif detay + profil iki yerden erişim.
- 🐛 **Düzenleme EKLENMEDİ** (bilinçli): edit + beğeni koruma = abuse vektörü.

### Alerjen sistemi

- 💾 **Allergen enum** (10 değer) + `Recipe.allergens Allergen[]` + GIN index.
- ✨ Retrofit inference (keyword match, TR-aware normalization, consonant softening için `fistik`/`fistig` çift form).
- 🎨 **Tarif detay**: `<details>` collapsible (özet: "Bu tarif alerjen madde içerebilir"), açılınca subtle chip row + "Alerjin varsa malzeme listesine bir de sen göz at."
- ✨ **`/tarifler` filter**: "Alerjen · içermesin" multi-select chip row.
- ⚙️ `scripts/retrofit-allergens.ts` (idempotent, `--dry-run` + `--force`).

### Vejetaryen + vegan

- ✨ **Diet inference** (`lib/diet-inference.ts`): vegetarian = no meat/poultry/seafood; vegan = vegetarian + no SUT/YUMURTA + no honey/gelatin. "bal" regex negative lookahead balkabağı için.
- 🐛 **Retrofit**: 42 yeni tag eklendi, 2 yanlış tag temizlendi (ezogelin + mercimek çorbası vegan etiketi yanlıştı, tereyağı vardı).
- 🎨 **UI**: tarif detayında yeşil `🌱` chip, `/tarifler`'de dedicated "DİYET" filter row, generic tag row'dan vegan/vejetaryen çıkarıldı.

### Codex 500-batch öncesi DB hijyeni

- 🔒 **Seed input validation** (`lib/seed/recipe-schema.ts`): Zod shape check, slug regex, enum guard'ları, prep+cook≈total soft-check. 500 row'dan 1 bozuksa sadece o reddedilir.
- ⚡ **GIN index on `Recipe.allergens`**: hasSome/hasNone filter'ları için ms-düzeyi.
- ⚙️ **Retrofit orchestrator** (`scripts/retrofit-all.ts`): tek komut allergens → diet tags sırayla.

### i18n minimal prep

- 💾 **`Recipe.translations Json?`**: JSONB bucket, locale-keyed (`{en?, de?, ...}`), opsiyonel. Faz 3'te UI toggle aktive edildiğinde kullanılır.
- 🧪 Seed validator opsiyonel `translations` alanı kabul ediyor.
- 🎨 **`/ayarlar` sayfasında `LanguagePreferenceCard`**: 🇹🇷/🇬🇧/🇩🇪 select disabled + "Yakında" rozeti.

### Bug fix'ler + polish

- 🔒 **Repo private yapıldı** + `.claude/settings.local.json` gitignore'a eklendi.
- 🎨 **Bugünün Tarifi polish**: "İleri" → "Zor" (`getDifficultyLabel` tutarlı), averageCalories chip eklendi.
- 🐛 **AI Asistan pantry bug fix**: "Sucuk" eski `isPantryStaple` algoritması ile "su" prefix'ine match'lüyordu → %100 false-positive. Yeni: exact token containment.
- ✨ **Malzeme grupları**: `RecipeIngredient.group String?` (nullable). `IngredientList` bucket-by-group render.
- 🐛 **Revani ve 6 tarif daha fix**: baklava, künefe, mantı, lahmacun, ali-nazik, hünkar beğendi, boza — composite isim temizliği ("Şerbet şekeri" → "Şeker" + group="Şerbet için") + 46 ingredient update.
- 🎨 **Alerjen uyarı metni sadeleştirildi**: "Alerjin varsa malzeme listesine bir de sen göz at."
- 🐛 **Tipnote düzeltmesi**: Baklava + Revani için "ya da tersi" muğlak ifadesi iki case'e ayrıldı ("sıcakken soğuk, soğumuşsa sıcak").
- 📝 **RECIPE_FORMAT "Dil ve anlatım kalitesi" bölümü**: muğlak koşullu ifadeler, belirsiz ölçüler, composite ingredient adları yasaklandı. Codex batch'ten önce kural netleşti.

## Ops tooling

- ⚙️ `scripts/list-users.ts`, `scripts/delete-user.ts`, `scripts/list-recipe-slugs.ts`, `scripts/seed-test-notifications.ts`, `scripts/smoke-rate-limit.ts`, `scripts/test-ai.ts`.
- 🧪 Integration smoke'ları: `scripts/test-password-reset-flow.ts`, `scripts/test-most-liked-sort.ts`, `scripts/test-delete-own-variation.ts`.
- ⚙️ Retrofit'ler: `scripts/retrofit-allergens.ts`, `scripts/retrofit-diet-tags.ts`, `scripts/retrofit-all.ts`, `scripts/fix-ingredient-groups.ts`, `scripts/fix-tipnotes.ts`, `scripts/check-password-reset-tokens.ts`.

## Dokümantasyon

- 📝 `docs/TARIFLE_ULTIMATE_PLAN.md` — tek kaynağı olan ana plan (~1928 satır).
- 📝 `docs/PROJECT_STATUS.md` — her pass sonrası kısa özet + "Sıradaki İşler" listesi.
- 📝 `docs/RECIPE_FORMAT.md` — Codex için tarif şartnamesi (17 kategori, 15 etiket, 10 alerjen, "X için" group convention, opsiyonel translations).
- 📝 `docs/CODEX_HANDOFF.md` — yeni bilgisayarda Codex'in sıfırdan başlama akışı.

## Test + kalite

- 🧪 **212 unit + 9 E2E** test (15 Nisan 2026 itibarıyla).
- 🧪 GitHub Actions CI her push'ta `lint + typecheck + vitest + build` koşuyor.
- ⚙️ Vercel auto-deploy main → tarifle.app.
