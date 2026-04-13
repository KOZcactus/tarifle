# Tarifle — Proje Durumu

> Son güncelleme: 14 Nisan 2026

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

## Devam Edenler

- [ ] Responsive tasarım iyileştirmeleri (MVP 0.1)
- [ ] Final seed data (50 yemek + 20 içecek — MVP 0.1)
- [ ] Gelişmiş filtreler (süre aralığı, kalori, etiket, çoklu kategori)

## Sıradaki İşler

- [ ] Vercel'e ilk deploy
- [ ] Auth.js v5 (e-posta + Google) — MVP 0.2
- [ ] Kullanıcı profil ve varyasyon sistemi — MVP 0.2
- [ ] Moderasyon ve raporlama — MVP 0.3

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
- Auth.js v5 beta kurulu, MVP 0.2'de aktif edilecek
- Light mode varsayılan, dark mode `[data-theme="dark"]`
- Seed script: `npx tsx prisma/seed.ts` (DATABASE_URL env var gerekli)
