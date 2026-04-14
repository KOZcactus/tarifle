# Tarifle — Proje Durumu

> Son güncelleme: 14 Nisan 2026 (kayıt akışı bug fix + Resend canlıda)

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

- [x] `src/lib/rate-limit.ts` — Upstash `@upstash/ratelimit` + `@upstash/redis` sargısı.
  - 6 scope: register (3/10dk), login (5/1dk), resend-verification (1/60sn), report (10/1sa), variation-create (5/1sa), ai-assistant (30/1dk).
  - Sliding window algoritması, `tarifle:rl:<scope>` prefix.
  - `getClientIp()` helper → `x-forwarded-for`/`x-real-ip` okur, Vercel edge'in arkasında doğru IP verir.
  - `rateLimitIdentifier(userId, ip)` → auth'lu kullanıcıya `user:<id>`, anonim için `ip:<addr>`.
  - **Fail-open**: `UPSTASH_REDIS_REST_*` env yoksa tek seferlik warning log'u basar, `success: true` döner. Redis hatasında da fail-open (error log + pass).
- [x] Entegre edilen endpointler:
  - `registerUser` → IP-bazlı (anon form).
  - `authorize` (Credentials provider) → IP-bazlı, `null` döner (bad credentials ile aynı yol).
  - `resendVerificationEmailAction` → user-bazlı (eski in-process Map throttle yerine).
  - `createReport` → user-bazlı.
  - `createVariation` → user-bazlı.
  - `suggestRecipesAction` → user varsa user, yoksa IP.
- [x] `.env.example` güncel: `UPSTASH_REDIS_REST_URL`/`TOKEN` + Resend env'leri.
- [x] Preview ile smoke test: AI Asistan formu submit → sonuçlar geldi, server log'unda yalnız "rate limiting disabled" warning (env yok, beklenen), error yok.

**Prod aktivasyon**: Upstash hesabı açıp bir Redis DB oluşturulacak (console.upstash.com → Redis → Create → REST tab), URL+TOKEN `.env.local` ve Vercel env vars'a eklenecek. Vercel otomatik redeploy → limitler canlıda.

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

- [x] `AiProvider` interface — Claude/başka model eklendiğinde sadece factory değişecek
- [x] `RuleBasedProvider` — DB filtreleme + TR-aware malzeme eşleştirme
  - Token-prefix matching (substring false positive yok)
  - İsteğe bağlı malzemeler (isOptional) puana etki etmez
  - Pantry staples modu (tuz/karabiber/su/yağ)
  - Skor: matchedRequired / totalRequired (0-1)
- [x] `/ai-asistan` sayfası: chip input, tür/süre/zorluk filtreleri, pantry toggle
- [x] Sonuç kartları: %eşleşme rozeti, eksik malzeme listesi, "Tüm malzemeler elinde!" mesajı
- [x] **AI-hissi commentary** (`src/lib/ai/commentary.ts`):
  - Senaryoya göre 3-5 varyant (0 sonuç / 1 tam / 2 tam / 3+ tam / 1 eksik / genel)
  - Seed-based picking — aynı input aynı yorumu üretir ama farklı inputlar farklı hisseder
  - "Yapay zekasız" disclaimer'ı yok — kullanıcıya AI gibi sunulur
- [x] **Per-recipe notes**: "Zirvedeki seçenek", "En hızlı seçenek", "Sadece X eksik", "Sabır ister ama sonucu etkileyici" gibi roller
- [x] "Düşünüyor…" typing dots animasyonu form submit sırasında
- [x] Ana sayfa: AI Asistan banner (mavi gradient, hero altında)
- [x] Navbar: "AI Asistan" linki (desktop + mobile)
- [x] `scripts/test-ai.ts` — smoke test
- [x] **Karar**: Claude Haiku entegrasyonu şimdilik YAPILMAYACAK — kural tabanlı motor AI-gibi sunuluyor, masraf sıfır

## Devam Edenler

## Tamamlanan Seed Verisi

- 17 kategori, 15 etiket
- 56 tarif (15 ilk seed + 41 final seed)
- Kategoriler: Ana Yemek, Çorba, Salata, Meze, Aperatif, Tatlı, Kahvaltı, Hamur İşi, Baklagil, Pilav, Sos, Kokteyl, Soğuk İçecek, Sıcak İçecek, Smoothie, Pasta, Atıştırmalık

## Sıradaki İşler

- [ ] **Secret rotasyonu** (acil): DATABASE_URL şifresi + AUTH_SECRET sohbette paylaşıldı, ikisi de yenilenmeli. Neon → Reset password; `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` → yeni AUTH_SECRET; `.env.local` + Vercel güncelle. Yan etki: tüm aktif oturumlar düşer.
- [ ] **Upstash Redis provisioning**: hesap aç → Redis DB oluştur (region: eu-west-1 önerilir) → REST URL + TOKEN'ı `.env.local` + Vercel env vars'a ekle → rate limitler canlıda aktifleşir.
- [ ] **A11y follow-up** (form label audit, renk kontrastı WCAG AA aracı ile kontrol, screen reader elle smoke)
- [ ] **Test coverage genişletme**: `lib/email/verification` + `lib/badges/service` için prisma mock'lu testler, E2E akışı Playwright ile (kayıt → doğrulama → rozet), CI gate kurulumu (GitHub Actions: `lint + typecheck + test + build` pre-merge).
- [ ] **"Google hesabını bağla" özelliği**: Mevcut credentials user'ı (örn. ahmet, batu) varken aynı email ile Google OAuth denerse `OAuthAccountNotLinked` alır. /ayarlar sayfasında şifreyle doğruladıktan sonra Google'ı bağlama flow'u. `allowDangerousEmailAccountLinking: false` güvenlik duvarını koruyarak UX.
- [ ] AI Asistan v2: ingredient synonym/token tablosu
- [ ] Gelişmiş moderasyon — Faz 2 (AI destekli ön-sınıflandırma)
- [ ] Şablon video sistemi (Remotion) — Faz 2/3
- [ ] Bildirim sistemi — Faz 2 (rapor sonucu, varyasyon beğenisi için in-app)

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
