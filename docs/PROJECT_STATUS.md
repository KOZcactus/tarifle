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
- [ ] **A11y overhaul** (Escape/focus trap/ARIA roles)
- [ ] **Lint + test altyapısı** (next 16 lint config kırık; vitest kurulu ama test dosyası yok — kritik paths için unit test yaz: `lib/ai/matcher`, `lib/moderation/blacklist`, `lib/email/verification`, `lib/badges/service`)
- [ ] **Google OAuth bağlantısı** (Google Cloud Console'dan credentials alınacak)
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
