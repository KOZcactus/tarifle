# Tarifle — Proje Durumu

> Son güncelleme: 15 Nisan 2026 (Codex batch öncesi DB hijyeni)

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

- [ ] **Codex batch review** — kardeş yarın başka PC'de `scripts/seed-recipes.ts`'ye 50+ tarif ekler, ilk batch'i review et (bkz. `docs/CODEX_HANDOFF.md` + Neon `codex-import` branch)
- [ ] **A11y follow-up**: form label audit (otomatik + elle), renk kontrastı WCAG AA aracı ile kontrol, screen reader (NVDA/VoiceOver) elle smoke test
- [ ] **Test coverage genişletme**: `lib/email/verification` + `lib/badges/service` için prisma mock'lu testler, E2E login-gerektiren akışlar (kayıt → doğrulama → rozet, uyarlama ekle → moderasyon onayla → bildirim)
- [ ] **CI E2E aktivasyonu**: Neon'da `e2e-ci` branch aç → GitHub Secrets `E2E_DATABASE_URL` + `E2E_AUTH_SECRET` ekle → CI workflow'undaki e2e job otomatik çalışır
- [ ] **Prisma migration baseline temizlik**: `db push` kullandığımız değişiklikleri (moderationFlags, Notification) proper migration olarak formalize et

### Orta vadeli (Faz 2 kalanı)

- [ ] **AI Asistan v2**: ingredient synonym/token tablosu (e.g. "domates" ⇔ "çeri domates" eşleştirmesi)
- [ ] **AI-destekli moderasyon**: Claude Haiku ile ön-sınıflandırma (opsiyonel, kural-tabanlı yeterli gelirse geri al)
- [ ] **Şablon video sistemi** (Remotion) — büyük scope, Faz 2/3 arası

### Uzun vadeli (Faz 3)

- [ ] **Mobil uygulama** (React Native)
- [ ] **Premium üyelik** (reklamsız + sınırsız AI)
- [ ] **Çoklu dil** (EN, DE)
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
