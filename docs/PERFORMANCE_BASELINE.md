# Tarifle — Performans Baseline Raporu

> Tarih: 16 Nisan 2026 (session 2) · Lighthouse v13.1 · Production (tarifle.app)
> 606 tarif canlı · headless Chrome, mobile emulation default

Bu dosya periyodik snapshot. Büyük feature veya batch sonrası karşılaştırma
için tekrar çalıştırılabilir:

```bash
npx -y lighthouse@latest <url> \
  --only-categories=performance,seo,accessibility,best-practices \
  --output=json --output-path=lh-X.json --chrome-flags="--headless=new"
```

## Skor tablosu (606 tarif — font optimizasyonu sonrası)

| Sayfa | Perf | A11y | BP | SEO | LCP | FCP | CLS | TBT | Boyut |
|---|---|---|---|---|---|---|---|---|---|
| `/` | **96** | 100 | 100 | 100 | 2.5 s | 1.2 s | 0 | 27 ms | 343 KiB |
| `/tarifler` | **96** | 100 | 100 | 100 | 2.6 s | 1.1 s | 0 | 33 ms | 334 KiB |
| `/tarif/adana-kebap` | **96** | 100 | 100 | 100 | 2.5 s | 1.0 s | 0 | 18 ms | 343 KiB |
| `/ai-asistan` | **97** | 98 | 100 | 100 | 2.6 s | 1.0 s | 0 | 12 ms | 329 KiB |

### Önceki baseline (406 tarif, font optimizasyonu öncesi)

| Sayfa | Perf | A11y | LCP | TBT | Boyut |
|---|---|---|---|---|---|
| `/` | 95 | 100 | 2.5 s | 10 ms | 342 KiB |
| `/tarifler` | 96 | 98 | 2.5 s | 20 ms | 339 KiB |
| `/tarif/adana-kebap` | 94 | 100 | 2.5 s | 40 ms | 342 KiB |
| `/ai-asistan` | 97 | 98 | 2.5 s | 10 ms | 329 KiB |

### Değişim analizi (406 → 606 tarif, font opt sonrası)

**İyileşen:**
- `/tarif/adana-kebap` Perf 94 → **96** (+2). TBT 40 → 18ms (font weight
  azaltma + adjustFontFallback etkisi).
- `/tarifler` A11y 98 → **100** (+2). heading-order + CuisineFilter
  contrast fix'leri önceki pass'te yapılmıştı, yeni ölçüm yansıttı.
- `/` Perf 95 → **96** (+1).

**Stabil:**
- LCP 2.5-2.6s aralığında. Font optimizasyonu LCP'yi değiştirmedi çünkü
  LCP element (H1 text) server response'tan sonra render oluyor; font
  download zaten `display: swap` ile non-blocking. LCP darboğazı font
  değil **TTFB + server rendering** — Neon serverless cold start + Vercel
  edge function boot süresi.
- Bundle boyutu 329-343 KiB (budget: 300-400 KiB altında ✅).
- CLS 0 tüm sayfalarda.

**Sonraki LCP iyileştirme fırsatları:**
- Vercel Edge Runtime (middleware → server component) — TTFB azaltma
- ISR / PPR (Partial Prerendering) — statik shell + dynamic data
- Image placeholder (hero'da görsel eklenirse `blur` placeholder)
- bf-cache fix — back/forward navigation'da instant LCP

## Web Vitals hedefleri

| Metrik | Hedef (Good) | Şu an | Durum |
|---|---|---|---|
| LCP | < 2.5 s | 2.5-2.6 s | ⚠ borderline |
| INP | < 200 ms | (RUM gerek) | — |
| CLS | < 0.1 | 0 | ✅ |
| FCP | < 1.8 s | 1.0-1.2 s | ✅ |
| TBT | < 200 ms | 12-33 ms | ✅ |

## Sonraki ölçüm önerileri

- 1000 tarife ulaşıldığında re-run
- ISR/PPR deneyimi sonrası
- Recipe image'lar yaygınlaştığında (LCP element değişebilir)
