# Tarifle — Proje Durumu

> Son güncelleme: 13 Nisan 2026

## Yapılanlar

- [x] Proje planı dokümanı oluşturuldu (TARIFLE_ULTIMATE_PLAN.md)
- [x] Next.js 16 + TypeScript + Tailwind CSS projesi kuruldu
- [x] Klasör yapısı oluşturuldu (plandaki yapıya uygun)
- [x] Prisma schema yazıldı (17 model, 9 enum)
- [x] Tasarım token'ları tanımlandı (dark/light renk paleti)
- [x] Temel bileşenler oluşturuldu (Navbar, Footer, ThemeToggle)
- [x] Tip tanımları yazıldı (recipe, user, variation, api)
- [x] Validasyon şemaları yazıldı (Zod — login, register, variation, report)
- [x] Utility fonksiyonlar oluşturuldu (slugify, formatMinutes, cn)
- [x] Kategori ve etiket verileri tanımlandı
- [x] Ana sayfa placeholder'ı oluşturuldu
- [x] Config dosyaları hazırlandı (vitest, prettier, .env.example)

## Devam Edenler

- [ ] Build kontrolü ve hata düzeltme (MVP 0.1)

## Sıradaki İşler

- [ ] Veritabanı bağlantısı (Neon PostgreSQL)
- [ ] Prisma migration çalıştır
- [ ] Seed data oluştur (10 yemek + 5 içecek demo)
- [ ] Tarif kartı bileşeni (RecipeCard)
- [ ] Kategori sayfaları
- [ ] Tekil tarif sayfası (malzeme, adımlar, besin değerleri)
- [ ] Arama ve filtreleme sistemi
- [ ] SEO (meta tags, Open Graph, Schema.org Recipe)
- [ ] Responsive detay kontrolleri
- [ ] Vercel'e ilk deploy

## Karar Bekleyenler

- E-posta doğrulaması MVP'de zorunlu mu yoksa opsiyonel mi?
- AI video için aylık deneme bütçesi belirlenecek mi?
- İlk tarif veri setine kullanıcının özel tarifleri de eklensin mi?

## Bilinen Sorunlar

- [Henüz yok]

## Notlar

- Next.js 16.2.3, React 19.2.4, Tailwind CSS 4 kullanılıyor
- Prisma 7.7.0 (en güncel sürüm)
- Auth.js v5 beta kurulu, MVP 0.2'de aktif edilecek
