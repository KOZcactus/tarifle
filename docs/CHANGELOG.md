# Tarifle — Değişiklik Günlüğü

Her iş, ait olduğu kategorinin altında tek satırlık özet. Yeni iş ilgili kategorinin **en altına** eklenir. Kronolojik takip için `docs/PROJECT_STATUS.md`.

> Son güncelleme: 15 Nisan 2026

## İşaretler

- ✨ yeni özellik
- 🐛 bug fix
- 🔒 güvenlik / hardening
- 📝 dokümantasyon
- 🧹 refactor / temizlik
- ⚙️ config / chore / ops tooling
- 🎨 UI / UX polish
- 🧪 test / CI
- 💾 database / schema
- ⚡ performans
- ♿ a11y

---

## Kullanıcı sistemi (auth, profil, hesap)

- ✨ Auth.js v5 + Credentials provider + JWT strategy + KVKK onay akışı.
- ✨ `/giris` + `/kayit` sayfaları; Google OAuth yapısı kuruldu.
- ✨ Profil sayfası (`/profil/[username]`) + author + bio + avatar.
- 🐛 Middleware'den Prisma kaldırıldı (Edge 1MB limit).
- 🐛 Kayıt sonrası oturum navbar bug fix — client-side signIn pattern.
- ✨ Google OAuth canlıya alındı (`buildAdapter()` + username + KVKK atomik create).
- ✨ `/ayarlar` sayfası — profil düzenleme (name, username, bio) + status rozetleri.
- ✨ Google hesabı bağla — signed cookie + HMAC + email match gate.
- ✨ Şifre değiştir — bcrypt verify + rate limit.
- ✨ Şifre ekle (OAuth-only user için) — `passwordHash === null` server gate.
- ✨ Google hesabı unlink — `passwordHash` zorunlu (kilitlenme koruma).
- ✨ Hesap silme — username echo + şifre verify + cascading transaction.
- ✨ Şifremi unuttum akışı — `PasswordResetToken` (1h TTL), email enumeration defense.
- ✨ `/ayarlar`'a LanguagePreferenceCard (🇹🇷/🇬🇧/🇩🇪, disabled + "Yakında").

## Tarif içeriği ve liste

- ✨ Ana sayfa + Tarifler + Kategori + Tekil tarif sayfaları.
- ✨ Arama (başlık + açıklama + malzeme) + zorluk + kategori + süre filtreleri.
- ✨ Etiket sistemi + çoklu-etiket filter + sayfalama.
- ✨ SEO meta tag'leri + Open Graph + JSON-LD Schema.org Recipe.
- ✨ Porsiyon ayarlama — kişi sayısıyla malzeme miktarı otomatik güncellenir.
- 🎨 "Varyasyon" → "Uyarlama" isim değişikliği (UI geneli).
- ✨ Alfabetik default sort + chip row: "Alfabetik / En yeni / En popüler / En hızlı / En çok uyarlama".
- ✨ "En çok beğeni" sort — `variations.likeCount` toplamı, TR collation tie-break.
- 💾 Allergen enum (10 değer) + `Recipe.allergens Allergen[]` + GIN index.
- ✨ Alerjen etiketleri — rule-based inference + tarif detayında collapsible panel ("Alerjin varsa malzeme listesine bir de sen göz at.").
- ✨ `/tarifler` "Alerjen · içermesin" multi-select filter.
- ✨ Vegan/vejetaryen inference + retrofit + yeşil `🌱` chip + dedicated "DİYET" filter row.
- 💾 `RecipeIngredient.group String?` — "Hamur için" / "Şerbet için" / "Sos için" bölüm desteği.
- 🐛 8 tarif composite ingredient fix (revani + baklava + künefe + mantı + lahmacun + ali-nazik + hünkar beğendi + boza).
- 🐛 Baklava + Revani tipnote netleşti ("sıcakken soğuk / soğumuşsa sıcak" iki ayrı cümle).
- ⚡ Full-text search — `searchVector` generated tsvector (A/B/C weighted) + `immutable_unaccent` + GIN index + `websearch_to_tsquery('turkish', ...)` + `ts_rank_cd` relevance sort. Kök eşleşme (mantılar→Mantı), aksan-bağımsız (manti→Mantı), ingredient adı fallback union.
- 🎨 `/tarifler` "En alakalı" sort chip (sadece query varken görünür, query'li aramalarda default).

## Uyarlama sistemi

- ✨ Uyarlama ekleme formu + beğeni sistemi.
- ✨ Uyarlama görüntüleme + sort (en yeni / en çok beğeni / en az malzeme).
- ✨ Yapılandırılmış malzeme input (amount + unit + name, backward-compat).
- ✨ VariationCard accordion (malzeme/adım/not açılır-kapanır).
- ✨ Admin inline "Gizle" butonu (moderasyon).
- 🎨 Status rozetleri (Gizlendi / İncelemede / Reddedildi / Taslak) profilde.
- ✨ Kullanıcı kendi uyarlamasını silebilir — ownership gate + hard delete + AuditLog.
- 🐛 Düzenleme EKLENMEDİ (bilinçli — edit + beğeni koruma abuse vektörü).

## Bookmark, koleksiyon, alışveriş listesi

- ✨ Bookmark sistemi — optimistic UI.
- ✨ Favori koleksiyonları — `Collection` + `CollectionItem` schema.
- ✨ `SaveMenu` — Kaydet / Listeye ekle / Koleksiyon butonları.
- ✨ Koleksiyon detay sayfası — grid görünüm + düzenle/sil modal.
- ✨ `/alisveris-listesi` sayfası — kontrol et/sil, manuel madde, isim-bazlı dedup.

## AI Asistan

- ✨ `AiProvider` interface + `RuleBasedProvider` (DB filter + TR-aware matcher).
- ✨ Pantry staples modu (tuz / karabiber / su / yağ opt-in).
- ✨ AI-gibi commentary — senaryo bazlı 3-5 varyant + per-recipe notlar, seed-based deterministic, disclaimer yok.
- 🎨 "Düşünüyor…" typing dots + ana sayfa AI banner + navbar link.
- 🐛 Pantry staple false-positive fix — "sucuk" eski algoritmada "su" prefix'ine match'lüyordu → exact token containment.

## Bildirim sistemi

- 💾 `Notification` model + 6 tip enum (LIKED / APPROVED / HIDDEN / REPORT_RESOLVED / BADGE_AWARDED / SYSTEM).
- ✨ `toggleLike`, `grantBadge`, admin `hide`/`approve`, `reviewReport` trigger'ları.
- ✨ Navbar bell + unread count + dropdown (son 10, Escape + outside-click dismiss).
- ✨ `/bildirimler` sayfası — Tümü/Okunmamış filter, type chip'leri.
- 🎨 `resolveNotificationLink` type-aware router (HIDDEN → `/bildirimler`).

## Moderasyon ve güvenlik

- 🔒 Keyword blacklist — Türkçe argo/küfür kontrolü (normalized, TR karakter aware).
- ✨ Raporlama sistemi (spam/argo/yanıltıcı/zararlı/diğer).
- ✨ Admin paneli — dashboard + raporlar + tarifler + kullanıcılar.
- 🔒 Rate limiting — Upstash Redis, sliding window, 9 scope, fail-open.
- ✨ Gelişmiş moderasyon — `preflight.ts` 7 sinyal + `PENDING_REVIEW` + `/admin/incelemeler` kuyruğu.
- 🔒 URL bypass tespiti (spaced-dot, [dot], "nokta" kelime varyasyonları).
- 🔒 Email enumeration defense (şifremi unuttum akışında).
- 🔒 Repo private yapıldı + `.claude/settings.local.json` gitignore'a.

## Pişirme + print + yaş gate

- ✨ Pişirme modu — tam ekran, büyük yazı, Wake Lock API, klavye nav, zamanlayıcı.
- ✨ Yazdırma görünümü — print-friendly CSS, gereksiz öğeler gizli.
- 🔒 Alkollü içecek 18+ yaş gate (sessionStorage, `alkollu` tag'ine bağlı).

## Homepage

- ✨ Hero + arama + popüler aramalar + kategori grid + öne çıkan + CTA.
- ✨ AI Asistan banner (mavi gradient, navbar'la uyumlu).
- ✨ Bugünün tarifi widget — deterministic daily pick (`daysSinceEpoch % count`, `orderBy: slug`), 12-kural curator note + 5 intro varyantı seed-based.
- 🎨 Section sıralaması: Hero → Öne Çıkan → Günün Tarifi → AI Asistan → Kategoriler.

## Sosyal + PWA

- ✨ Dinamik OG Image — tarif, koleksiyon, site default (Bricolage Grotesque + twemoji, TR karakter).
- ✨ `ShareMenu` — Web Share API (mobil native) + WhatsApp / X / kopyala fallback.
- ✨ PWA manifest + ikon seti (32/180/192/512 + maskable) + shortcuts.

## Email + rozet

- ✨ E-posta doğrulama — `EmailProvider` abstraction (Resend prod + Console dev), 24h TTL token, `/dogrula/[token]`, `VerifyEmailBanner`.
- ✨ Rozet sistemi — 4 enum (EMAIL_VERIFIED / FIRST_VARIATION / POPULAR_VARIATION / RECIPE_COLLECTOR), profilde `BadgeShelf`.

## i18n (Faz 3 prep)

- 💾 `Recipe.translations Json?` — JSONB bucket, locale-keyed, opsiyonel.
- 🧪 Seed validator opsiyonel `translations` alanı kabul ediyor.
- 🎨 `/ayarlar` LanguagePreferenceCard disabled placeholder.

## Schema & DB

- 💾 Prisma 7 + Neon PostgreSQL + PrismaNeon adapter.
- 💾 17 model + 9 enum (baseline).
- 💾 Prisma migration baseline alındı (`db push` → `migrate` workflow).
- 💾 Composite indexler (Pass 1-2): Recipe(status+createdAt/totalMinutes/viewCount/type+difficulty), Variation/Report/Collection.
- 💾 `Variation.moderationFlags String?` (preflight signals CSV).
- 💾 `Notification` model + 2 composite index.
- 💾 `PasswordResetToken` model (1h TTL).
- 💾 `Allergen` enum + `Recipe.allergens Allergen[]` + GIN index.
- 💾 `Recipe.translations Json?` (Faz 3 prep).
- 💾 `RecipeIngredient.group String?` (bölüm desteği).
- 🧹 **Migration baseline temizliği** (15 Nis 2026): Pass 10'dan itibaren biriken 8 `db push` değişikliği `prisma/migrations/20260415120000_codex_batch_prep/migration.sql` altında formal migration oldu. Fresh DB deploy'u artık `prisma migrate deploy` ile tam schema kuruyor.
- 💾 **Full-text search** (migration `20260415180000_add_fulltext_search`) — `unaccent` extension + `immutable_unaccent(text)` SQL wrapper + `Recipe.searchVector` generated STORED tsvector (A/B/C weighted) + GIN index `recipes_search_gin`. `turkish` snowball dictionary ile morfolojik eşleşme; accent-insensitive search; schema'da `Unsupported("tsvector")?` olarak temsil edildi.

## Test & CI

- 🧪 Vitest altyapısı — 5 dosya, 49 test (bootstrap).
- 🧪 Playwright E2E + 8 smoke + secret-gated CI job.
- 🧪 GitHub Actions CI — `lint + typecheck + vitest + build` her push'ta, concurrency control.
- 🧪 Bildirim akış E2E + bell toggle bug fix.
- 🧪 Preflight moderasyon — 12 yeni test.
- 🧪 Password reset validator — 9 test.
- 🧪 Recipe of the day commentary — 18 test.
- 🧪 Allergens inference — 19 test.
- 🧪 Diet inference — 15 test.
- 🧪 Ingredient group bucketing — 7 test.
- 🧪 AI Asistan pantry regression — 3 test.
- 🧪 Seed recipe schema — 15 test.
- 🧪 Badge service unit (Prisma + notifications mock'lu) — 13 test (grant happy/P2002/error; per-badge award helper'ları; threshold edge'ler).
- 🧪 Email verification unit (Prisma mock'lu) — 5 test (consume not-found/expired/valid; tx shape; badge grant best-effort).
- 🧪 Auth round-trip E2E (`auth-roundtrip.spec.ts`) — login → ana sayfa → /ayarlar gate → /profil → çıkış yap → anonim state geri.
- 🧪 Batch pre-flight validator unit — 19 test (TR normalize + muğlak regex + macro consistency + alkol cross-check + slug dup).
- 🧪 Recipe search sanitize — 6 test (sanitizeQueryInput: trim, control char strip, TR char preservation, empty input).
- 🧪 Toplam **255 unit + 12 E2E yeşil**.

## Ops tooling

- ⚙️ Vercel auto-deploy + Cloudflare DNS (tarifle.app canonical, www → non-www 308).
- ⚙️ Postinstall ile `prisma generate` (Vercel build fix).
- ⚙️ `list-users.ts`, `delete-user.ts`, `list-recipe-slugs.ts` (Codex için slug snapshot).
- ⚙️ `seed-test-notifications.ts`, `smoke-rate-limit.ts`, `test-ai.ts`.
- ⚙️ Integration smoke'ları: `test-password-reset-flow.ts`, `test-most-liked-sort.ts`, `test-delete-own-variation.ts`.
- ⚙️ Retrofit'ler: `retrofit-allergens.ts`, `retrofit-diet-tags.ts`, `retrofit-all.ts` (tek komut orchestrator).
- ⚙️ İçerik fix'leri: `fix-ingredient-groups.ts`, `fix-tipnotes.ts`.
- ⚙️ Ops helper: `check-password-reset-tokens.ts`.
- ⚙️ **Batch pre-flight validator** — `scripts/validate-batch.ts` (`npm run content:validate`), Zod + semantik kontroller (muğlak ifade regex, kcal/makro uyumu, alkol tag cross-check, slug çakışması), DB'ye dokunmaz, Codex workflow'unda seed'den önce koşar.
- ⚙️ FTS doğrulama smoke-test: `scripts/verify-fts.ts` (stemming + unaccent + populated rows + EXPLAIN plan).
- 🧹 `scripts/seed-recipes.ts` refactor — DB init `main()` içine alındı, `recipes` export + entrypoint guard; validate-batch.ts side-effect olmadan import edebilsin diye. Codex'in array'e ekleme workflow'u değişmedi.

## A11y

- ♿ `useDismiss` + `useFocusTrap` hook'ları (dropdown, modal).
- ♿ Navbar / menu / modal ARIA attributes (role, aria-haspopup, aria-expanded, aria-controls).
- ♿ `prefers-reduced-motion` global media query — animasyonlar 0.01ms'e iner.
- ♿ Form autoFocus + Escape dismiss + focus-visible outline.
- ♿ WCAG 2.1 AA audit — 10 sayfa × 2 tema (light + dark) × `@axe-core/playwright`, 164 → 0 violation.
- 🐛 AI Asistan filtre select'lerine `htmlFor`/`id` label association eklendi (select-name critical fix).
- 🎨 Renk palet revizyonu — primary/secondary/accent-green/accent-blue/warning/success/error/text-muted daha koyu tonlara çekildi (4.5:1 kontrast için).
- 🎨 Badge tint `/15` → `/10` (chip text kontrastı yükseldi).
- 🎨 Footer logo `text-lg` → `text-xl` (large text kategorisine çıktı).
- 🧪 `tests/e2e/a11y-audit.spec.ts` — CI regression guard, her push'ta 20 sayfa/tema tarar.

## Polish & UX copy

- 🎨 "Varyasyon" → "Uyarlama" isim değişikliği (UI geneli).
- 🎨 Profil düzenleme butonu belirgin (bg-primary/10 pastel, hover solid).
- 🎨 VariationCard sade tasarım (Report/Gizle sadece açıkken).
- 🎨 Hesap silme metni sadeleşti ("Recipe anonim-kalır" vaadi çıkarıldı).
- 🎨 Bildirim navigation type-aware (HIDDEN → `/bildirimler`).
- 🎨 Alerjen panel collapse + kısa uyarı ("Alerjin varsa malzeme listesine bir de sen göz at.").
- 🎨 Bugünün Tarifi polish — "İleri" → "Zor" (`getDifficultyLabel` tutarlı), averageCalories chip.
- 🎨 Dil tercihi: navbar chip → `/ayarlar` kartına taşındı.

## Dokümantasyon

- 📝 `docs/TARIFLE_ULTIMATE_PLAN.md` — tek kaynağı olan ana plan (~1928 satır).
- 📝 `docs/PROJECT_STATUS.md` — pass özeti + "Sıradaki İşler" aktif takip.
- 📝 `docs/RECIPE_FORMAT.md` — Codex için tarif şartnamesi.
- 📝 `docs/CODEX_HANDOFF.md` — yeni PC'de sıfırdan başlama akışı.
- 📝 `docs/CHANGELOG.md` — bu dosya, kategorik kronolojik referans.
- 📝 RECIPE_FORMAT "Dil ve anlatım kalitesi" bölümü — 7 yazım kuralı (muğlak ifadeler, belirsiz ölçüler, composite isimler yasak).
