# Tarifle — Değişiklik Günlüğü

Her iş, ait olduğu kategorinin altında tek satırlık özet. Yeni iş ilgili kategorinin **en altına** eklenir. Kronolojik takip için `docs/PROJECT_STATUS.md`.

> Son güncelleme: 16 Nisan 2026 (session 4)

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
- ✨ **Dinamik `sitemap.xml`** (Next.js `app/sitemap.ts`) — 131 URL: 8 statik + 17 kategori + 106 PUBLISHED tarif. `lastModified` = `updatedAt`, hourly revalidate.
- ✨ **`robots.txt`** (Next.js `app/robots.ts`) — `/admin`, `/ayarlar`, `/api/*`, `/bildirimler`, token sayfaları disallow; sitemap referansı.
- ✨ **Per-recipe canonical** — `/tarif/[slug]` sayfasına `alternates.canonical` + tarifle özel `openGraph` + `twitter:card` meta. `/tarifler?q=…&kategori=…` kombinasyonları param-free `/tarifler` canonical'a işaret eder, filter varyantları ayrı indexlenmez.
- ✨ **BreadcrumbList JSON-LD** (Schema.org) — `/tarif/[slug]` (4 seviye: Ana Sayfa › Tarifler › Kategori › Tarif) ve `/tarifler/[kategori]` (3 seviye) sayfalarında. Google Search sonuç kartının altına breadcrumb şeridi çıkar → CTR artışı + rich results eligibility. `generateBreadcrumbJsonLd(items)` helper'ı `src/lib/seo.ts`'te, relative URL'leri SITE_URL ile prefix'ler.
- ✨ **Kategori sayfası canonical** — `/tarifler/[kategori]` `alternates.canonical` metadata'sı eklendi.
- 📝 `docs/SEO_SUBMISSION.md` — Google Search Console + Bing Webmaster Tools step-by-step submission rehberi (property verify, sitemap submit, URL inspection, CWV izleme, sitemap ping helper).
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
- 🐛 **42 boilerplate tipNote düzeltmesi** — Codex batch 7'de `.map()` ile atanan generic tipNote temizlendi. 24 tarif → null, 18 tarif → tarife özel. 42 servingSuggestion da tarife özel yazıldı.
- 🐛 **12 tarif ingredient group eklendi** — butter-chicken, bulgogi, banh-mi vb. sos/marine malzemeleri "Tavuk için" / "Marine için" / "Sos için" olarak gruplandı (60 malzeme).
- 🐛 **4 servingSuggestion düzeltmesi** — banh-xeo (limonlu sos→limon sıkarak), panna-cotta (orman meyveli sos→taze meyve/reçel), tamale (kırmızı biber sosu→salsa/ekşi krema), tavuk-katsu (katsu sos→hazır tonkatsu sosu).
- 🐛 Baklava + Revani tipnote netleşti ("sıcakken soğuk / soğumuşsa sıcak" iki ayrı cümle).
- ⚡ Full-text search — `searchVector` generated tsvector (A/B/C weighted) + `immutable_unaccent` + GIN index + `websearch_to_tsquery('turkish', ...)` + `ts_rank_cd` relevance sort. Kök eşleşme (mantılar→Mantı), aksan-bağımsız (manti→Mantı), ingredient adı fallback union.
- 🎨 `/tarifler` "En alakalı" sort chip (sadece query varken görünür, query'li aramalarda default).
- ✨ **Benzer tarifler** — tarif detay sayfası altında 6 kart'lık öneri şeridi. Kural tabanlı skorlama: aynı kategori +3, aynı type +2, her ortak tag +1, aynı difficulty +0.5. Score 0 → gizli (noise değil). 12 unit test (skor matrisi + tie-break + kenar durumlar).
- 🇹🇷 **CuisineFilter aktif** (`/tarifler?mutfak=jp`) — `cuisine String?` schema alanı + btree index + 19 kod (tr/it/fr/es/gr/jp/cn/kr/th/in/mx/us/me/ma/vn/br/cu/ru/hu). `inferCuisineFromRecipe()` slug segment + keyword inference, default "tr". Toggle chip UI, accent-blue active state. Retrofit ile 606 tarif etiketlendi. Placeholder → aktif dönüşüm.

## Uyarlama sistemi

- ✨ Uyarlama ekleme formu + beğeni sistemi.
- ✨ Uyarlama görüntüleme + sort (en yeni / en çok beğeni / en az malzeme).
- ✨ Yapılandırılmış malzeme input (amount + unit + name, backward-compat).
- ✨ VariationCard accordion (malzeme/adım/not açılır-kapanır).
- ✨ Admin inline "Gizle" butonu (moderasyon).
- ❤️ **LikeButton** — `toggleLikeAction` backend vardı ama UI yoktu, bu pass'te kapatıldı. Optimistic update + auth gate + 3 görsel state (red/gray/own-readonly). `getLikedVariationIds` helper N+1 önler. ♿ A11y bonus: VariationCard nested-interactive ihlali (button içinde button) restructure ile fix.
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
- ✨ **Cuisine filter** — dropdown default "🇹🇷 Türk", 20 mutfak + "Hepsi". DB-side `where.cuisine IN(...)` btree index. 5 malzeme girince yabancı tarifler baskın çıkma sorunu çözüldü.
- ✨ **Malzeme hariç tutma** — "Bu malzemeler olmasın" kırmızı chip input. `recipeContainsExcluded()` ile tarif disqualification. Alerji/tercih senaryoları.
- ⚡ **200-tarif cap kaldırıldı** — tüm PUBLISHED tarifler skorlanıyor. 706 tarifte <20ms.
- 🎨 Commentary cuisine-aware prefix ("Türk mutfağından...", "Japon mutfağından...").

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
- ⚡ **Tarif detay sayfası composite index** (migration `20260416000000_detail_page_indexes`) — `recipe_ingredients(recipeId, sortOrder)` + `recipe_steps(recipeId, stepNumber)`. Prisma/Postgres FK için otomatik index yaratmaz; 1000+ tarif × ~7 malzeme ölçeğinde seq scan yavaşlar. EXPLAIN ANALYZE ile tespit, migration ile fix: Seq Scan → Index Scan geçişi doğrulandı.
- 💾 **Cuisine alanı** (migration `20260416120000_add_cuisine_field`) — `Recipe.cuisine String? @db.VarChar(30)` + btree index. 19 cuisine kodu, Zod validated (enum değil — yeni mutfak kodu migration gerektirmez). `scripts/retrofit-cuisine.ts` ile 606 tarif etiketlendi.
- 📊 **Perf audit 606 tarif** — 11 hot-path sorgu EXPLAIN ANALYZE raporu. Hepsi <3.2ms. Cuisine btree Bitmap Index Scan aktif (1.63ms). 3 seq scan 606'da fine, 1000+'da tekrar bakılır.

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
- 🧪 Batch rollback helpers — 6 test (`extractBatchSlugsFromSeed` + BATCH N ↔ BATCH N SONU regex parsing, missing markers).
- 🧪 Similar recipes skorlama — 12 test (ağırlık matrisi: kategori +3, type +2, tag +1, difficulty +0.5; tie-break: score → newest → TR collation; score=0 elenir; self hariç tutulur).
- 🧪 BreadcrumbList JSON-LD — 6 test (Schema.org shape, 1-tabanlı position, SITE_URL prefix, absolute URL bypass, empty array, 4-seviye tarif senaryosu).
- 🧪 Featured rotation — 11 test (`getWeekIndex` epoch/hafta sınırı, rotation arithmetic + wrap-around).
- 🧪 RSS XML builder — 13 test (escapeXml, RFC 822 date, channel skeleton, atom:self-link, item render + escape, empty items).
- 🧪 **Collection flow E2E** (`collection-flow.spec.ts`) — login → tarif detay → SaveMenu → yeni koleksiyon oluştur → tarifi ekle → /profil → koleksiyona git → tarif görünür.
- 🧪 **AI Asistan flow E2E** (`ai-asistan-flow.spec.ts`, 2 test) — RuleBased provider hot path: 3 yaygın malzeme + pantry assumption → SuggestionCard veya boş eşleşme + commentary; boş submit safety.
- 🧪 **Shopping list flow E2E** (`shopping-list-flow.spec.ts`) — manuel madde ekle → page reload (optimistic temp-ID → server ID) → check → "Alındı" bölümüne geç → sil → liste boş.
- 🧪 **Variation flow E2E** (`variation-flow.spec.ts`) — login → "+ Uyarlama Ekle" → form doldur → submit → success → reload → variation listede → expand → kendi LikeButton "❤️ N" read-only → DeleteOwnVariationButton (window.confirm auto-accept) → kayboldu.
- 🧪 **Cooking mode E2E** (`cooking-mode-flow.spec.ts`) — tarif → "Pişirme Modunu Başlat" → fullscreen dialog → "Sonraki" → "Önceki" enabled → close.
- 🧪 **Cuisine inference** — 37 test (19 slug match + title/description keyword + default + priority + constants).
- 🧪 **Exclude matching** — 5 test (recipeContainsExcluded: exact, prefix, empty, non-match).
- 🧪 Toplam **348 unit + 18 E2E yeşil**.

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
- ⚙️ **Perf audit runner** (`scripts/perf-audit.ts`) — 10 hot-path sorgusunun EXPLAIN ANALYZE raporu, seq scan tespiti, süre/plan özeti. 1000 tarife gitmeden darboğaz görünür.
- 🧹 `scripts/seed-recipes.ts` refactor — DB init `main()` içine alındı, `recipes` export + entrypoint guard; validate-batch.ts side-effect olmadan import edebilsin diye. Codex'in array'e ekleme workflow'u değişmedi.
- ⚙️ **Batch rollback safety net** — `scripts/rollback-batch.ts` (`npm run content:rollback`), 3 girdi modu (`--slugs`, `--slugs-file`, `--batch N`). Default dry-run + impact raporu; `--confirm "rollback-batch-N"` echo-phrase ile gerçek silme. Uyarlaması olan tarifleri otomatik bloklar (`--force` override). Her silme `AuditLog(action=ROLLBACK_RECIPE)`.
- 🔒 **Validator CI step** — `.github/workflows/ci.yml` `check` job'una `npm run content:validate` adımı eklendi. Seed-recipes.ts'de format ihlali varsa CI main push + PR'ı kırmızıya düşürür, merge bloklanır.
- 🎨 **Emoji sync helper** — `scripts/sync-emojis.ts` (`npm run content:sync-emojis`). Source'taki recipe emoji'lerini production DB'ye UPDATE eder. Seed idempotent (slug skip) olduğu için kod tarafına emoji ekleyince DB'ye otomatik geçmiyor; bu script gap'i kapatır. Single transaction (60sn timeout — Neon RTT × 100 update için).
- 🧹 **Sitemap ping cleanup** — Google `/ping?sitemap=` 2023 deprecated (404), Bing 410. retrofit-all'dan adım kaldırıldı, ilgili `seo-ping.ts` + `ping-sitemap.ts` + 8 unit silindi. IndexNow değerlendirildi: Google desteklemiyor + TR'de Bing/Yandex payı düşük → YAGNI.
- ⚙️ **Cuisine retrofit** (`scripts/retrofit-cuisine.ts`) — title/slug/description keyword inference ile `Recipe.cuisine` doldurur. `retrofit-all.ts`'e 3. adım olarak eklendi (allergens → diet → cuisine). `--dry-run` + `--force` flag'li.

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
- ♿ Heading-order fix `/tarifler` + `/tarifler/[kategori]` — H1 → H3 atlamasını sr-only `<h2>` ile düzeltildi (Lighthouse a11y 98 → 100).
- ♿ CuisineFilter contrast fix — `opacity-70` text-muted'ı 3.04:1'e düşürüyordu, kaldırıldı; dashed border + "Yakında" badge yeterli sinyal.
- ♿ VariationCard nested-interactive fix — expand `<button>` içinde LikeButton `<button>` vardı, restructure ile sibling yapıldı (DOM seviyesinde kardeş).

## Performans

- ⚡ **LCP font optimizasyonu** — Bricolage Grotesque 5 weight (400-800) → 2 weight (600+700), ~60KB font tasarrufu. Geist Sans latin → latin-ext (TR karakter desteği). `adjustFontFallback: true` ile CLS azaltma.

## Polish & UX copy

- 🎨 "Varyasyon" → "Uyarlama" isim değişikliği (UI geneli).
- 🎨 Profil düzenleme butonu belirgin (bg-primary/10 pastel, hover solid).
- 🎨 VariationCard sade tasarım (Report/Gizle sadece açıkken).
- 🎨 Hesap silme metni sadeleşti ("Recipe anonim-kalır" vaadi çıkarıldı).
- 🎨 Bildirim navigation type-aware (HIDDEN → `/bildirimler`).
- 🎨 Alerjen panel collapse + kısa uyarı ("Alerjin varsa malzeme listesine bir de sen göz at.").
- 🎨 Bugünün Tarifi polish — "İleri" → "Zor" (`getDifficultyLabel` tutarlı), averageCalories chip.
- 🎨 Dil tercihi: navbar chip → `/ayarlar` kartına taşındı.
- 🎨 **Admin dashboard genişletildi** — 6 → 8 stat card (Bookmark + Koleksiyon eklendi) + Aktivite section (Bugün/Hafta/Ay yeni tarif sayısı) + Son seed batch tablo (Postgres `date_trunc('hour')` + `HAVING COUNT(*) > 5`) + kategori dağılımı bar chart (17 kategori, primary renkli). Manuel SQL bakmaktan kurtarır, batch akışı görselleşir.
- 🎨 **Homepage rotation + Yeni Eklenenler section** — `getFeaturedRecipes` haftalık deterministic offset (`getWeekIndex` ISO week index, slug-ordered pool wrap-around). `getRecentRecipes(14gün, 8 kart)` yeni query. Hero → Öne Çıkan → **Yeni Eklenenler** → Günün Tarifi → AI Banner → Kategoriler. Codex batch'leri spotlight'ta görünür.

## Dokümantasyon

- 📝 `docs/TARIFLE_ULTIMATE_PLAN.md` — tek kaynağı olan ana plan (~1928 satır).
- 📝 `docs/PROJECT_STATUS.md` — pass özeti + "Sıradaki İşler" aktif takip.
- 📝 `docs/RECIPE_FORMAT.md` — Codex için tarif şartnamesi.
- 📝 `docs/CODEX_HANDOFF.md` — yeni PC'de sıfırdan başlama akışı.
- 📝 `docs/CHANGELOG.md` — bu dosya, kategorik kronolojik referans.
- 📝 RECIPE_FORMAT "Dil ve anlatım kalitesi" bölümü — 7 yazım kuralı (muğlak ifadeler, belirsiz ölçüler, composite isimler yasak).
- 📝 `docs/SEO_SUBMISSION.md` — Google Search Console + Bing Webmaster step-by-step (DNS TXT verify, sitemap submit, URL inspection, sitemap ping helper).
- 📝 `docs/PERFORMANCE_BASELINE.md` — Lighthouse 4 sayfa rapor (Perf 94-97, A11y/BP/SEO 100, LCP 2.5s borderline). 1000 tarife yaklaşırken karşılaştırma referansı.
