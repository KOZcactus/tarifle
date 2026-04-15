# Tarifle — Performans Baseline Raporu

> Tarih: 16 Nisan 2026 · Lighthouse v12 (latest) · Production (tarifle.app)
> 406 tarif canlı durumda · headless Chrome, mobile emulation default

Bu dosya bir kerelik snapshot. Sonraki batch'ler büyük değişiklik yaratmadıkça
re-run gereği yok; ama hedef 1000+ tarife yaklaşıldığında veya yeni feature
sonrası karşılaştırma için tekrar çalıştırılabilir:

```bash
CHROME_PATH="..." npx -y lighthouse@latest <url> \
  --only-categories=performance,seo,accessibility,best-practices \
  --output=json --output-path=lh-X.json --chrome-flags="--headless=new"
```

## Skor tablosu

| Sayfa | Perf | A11y | BP | SEO | LCP | FCP | CLS | TBT | TTFB | Boyut |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | **95** | 100 | 100 | 100 | 2.5 s | 1.1 s | 0.001 | 10 ms | 50 ms | 342 KiB |
| `/tarifler` | **96** | 98 | 100 | 100 | 2.5 s | 1.1 s | 0 | 20 ms | 50 ms | 339 KiB |
| `/tarif/adana-kebap` | **94** | 100 | 100 | 100 | 2.5 s | 1.0 s | 0 | 40 ms | 50 ms | 342 KiB |
| `/ai-asistan` | **97** | 98 | 100 | 100 | 2.5 s | 1.0 s | 0 | 10 ms | 50 ms | 329 KiB |

## Değerlendirme

### Excellent
- **A11y / BP / SEO**: 98-100 hepsinde. WCAG 2.1 AA pass'i + sitemap/canonical/
  breadcrumb/JSON-LD entegrasyonları meyvesini veriyor.
- **CLS**: 0-0.001. RecipeCard'da `width`/`height` set'li, hero görselleri
  explicit boyut, layout shift yok.
- **TBT**: 10-40 ms (target <200). Client JS minimal, hydration hızlı.
- **TTFB**: 50 ms. Vercel edge + Neon serverless adapter sağlam.
- **Bundle**: 339-342 KiB total. Performance budget'imizin (300-400 KiB)
  altında.

### Borderline
- **LCP 2.5 s** — Google "Good" eşiğinin TAM sınırında (`<2.5 s = Good`,
  `2.5-4 s = Needs Improvement`). Tüm sayfalarda aynı değer çıkması
  font/CSS render-block timing'inin LCP'yi kontrol ettiğini gösteriyor;
  hero görsel veya RecipeCard image'ı LCP element değil (bunlar lazy
  yükleniyor). Optimizasyon ihtiyacı yakın gelecekte:
  - `font-display: swap` zaten aktif (custom font'lar Bricolage + Geist)
  - Fall-back metric font verisi `next/font` ile CLS şu an 0
  - Hero text'in font yüklenmesini beklemeden render etmek için
    fall-back font Bricolage'a daha yakın seçilebilir
  - Veya: Vercel Edge runtime'a hero için preload hint eklenebilir

### Düzeltildi (bu pass'te)
- **Heading order** in `/tarifler` ve `/tarifler/[kategori]`: H1 → H3
  atlama vardı (RecipeCard `<h3>` kullanıyor, page title `<h1>`). Görsel
  olarak değişmeyen `<h2 className="sr-only">` eklendi (ekran okuyucu
  için anlamlı).

### Düşük öncelik
- **bf-cache blocked** (back/forward cache restoration prevented):
  NextAuth session cookie + Cache-Control header etkileşimi sebep
  olabiliyor. Convenience feature, core perf değil. 1000 tarife
  yaklaşırken bakılabilir.

## Web Vitals hedefleri

| Metrik | Hedef (Good) | Şu an | Durum |
|---|---|---|---|
| LCP | < 2.5 s | 2.5 s | ⚠ borderline |
| INP | < 200 ms | (RUM gerek) | — |
| CLS | < 0.1 | 0-0.001 | ✅ |
| FCP | < 1.8 s | 1.0-1.1 s | ✅ |
| TTFB | < 800 ms | 50 ms | ✅ |
| TBT | < 200 ms | 10-40 ms | ✅ |

INP gerçek kullanıcı ölçümü (RUM) gerektiriyor — Vercel Analytics free tier
veya Search Console Experience sekmesi 28 gün sonra gösterecek.

## Sonraki ölçüm önerileri

- 1000 tarife ulaşıldığında re-run (LCP nasıl etkilendi?)
- Yeni hot-path feature sonrası (örn. cuisine filter, admin dashboard)
- Görsel ekleme (recipe imageUrl) yaygınlaştığında — şu an tariflerin
  çoğunda emoji fallback, gerçek görsel az
