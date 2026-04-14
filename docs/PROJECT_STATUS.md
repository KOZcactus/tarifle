# Tarifle — Proje Durumu

> Son güncelleme: 14 Nisan 2026 (Faz 2 — AI Asistan kural tabanlı)

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

- [ ] Google OAuth bağlantısı (Google Cloud Console'dan credentials alınacak)
- [ ] E-posta doğrulama + Rozet sistemi — Faz 2
- [ ] Gelişmiş moderasyon — Faz 2
- [ ] Şablon video sistemi (Remotion) — Faz 2/3

## Karar Bekleyenler

- E-posta doğrulaması MVP'de zorunlu mu yoksa opsiyonel mi?
- AI video için aylık deneme bütçesi belirlenecek mi?
- İlk tarif veri setine kullanıcının özel tarifleri de eklensin mi?

## Bilinen Sorunlar

- Prisma 7 CLI komutları (migrate dev, db push) için `--url` flag gerekiyor
  (prisma.config.ts dotenv yüklemesi güvenilir değil)

## Teknik Notlar

- Next.js 16.2.3, React 19.2.4, Tailwind CSS 4
- Prisma 7.7.0 + @prisma/adapter-neon + @neondatabase/serverless
- Auth.js v5 (next-auth@5.0.0-beta.30) — JWT strategy, Credentials provider aktif
- Middleware'de Prisma import edilemez (Vercel Edge 1MB limiti) — auth kontrolleri sayfa seviyesinde
- Light mode varsayılan, dark mode `[data-theme="dark"]`
- Seed script: `npx tsx prisma/seed.ts` (DATABASE_URL env var gerekli)
