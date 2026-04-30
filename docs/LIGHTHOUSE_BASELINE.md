# Lighthouse Prod Baseline (Oturum 34)

Pre-launch performance baseline. Vercel deploy üzerinden çalışan
prod URL'lere karşı `npx lhci autorun --config=lighthouserc.prod.json`
ile 5 URL × 2 run = 10 run, ortalama değerler.

## Sonuçlar

| URL | Perf | A11y | BP | SEO | LCP(s) | CLS | TBT(ms) |
|---|---:|---:|---:|---:|---:|---:|---:|
| `/` | 89 | 100 | 100 | 100 | 1.55 | 0.000 | 5 |
| `/tarifler` | 95 | 100 | 100 | 100 | 1.02 | 0.000 | 0 |
| `/blog` | 99 | 96 | 100 | 100 | 0.75 | 0.018 | 0 |
| `/blog/diyet-skoru-nasil-hesaplanir` | 99 | 96 | 100 | 100 | 0.76 | 0.000 | 0 |
| `/yasal` | 99 | 100 | 100 | 100 | 0.69 | 0.014 | 0 |

## Threshold'lar (lighthouserc.prod.json)

| Kategori | Threshold | Min Skor (gerçek) | Sonuç |
|---|---|---|---|
| Performance | 85 | 89 (anasayfa) | ✅ PASS |
| Accessibility | 95 | 96 (blog) | ✅ PASS |
| Best Practices | 90 | 100 (hepsi) | ✅ PASS |
| SEO | 95 | 100 (hepsi) | ✅ PASS |

## Web Vitals (Core Web Vitals)

| Metrik | Hedef (Google) | En Yüksek | Durum |
|---|---|---|---|
| LCP (Largest Contentful Paint) | <2.5s | 1.55s | ✅ EXCELLENT |
| CLS (Cumulative Layout Shift) | <0.1 | 0.018 | ✅ EXCELLENT |
| TBT (Total Blocking Time) | <200ms | 5ms | ✅ EXCELLENT |

## Yorumlar

- **Anasayfa Perf 89** en düşük puan, büyük view + çok component
  (hero + featured carousel + cuisine grid + AI banner + populer
  + bayram ribbon + gece tatlısı). Yine de 85 threshold üstünde,
  CWV mükemmel. Optimization isteğe bağlı (image lazy load, code
  split, prefetch).
- **Tüm sayfalar BP 100/100** ve **SEO 100/100**. Pre-launch için
  sıfır blocker.
- **Accessibility 96/100** blog sayfalarında: minor color contrast
  veya form label issue olabilir. Manual `axe` audit ek değer.

## Re-run

```bash
# Prod'a karşı (önerilen, gerçek metrikler)
npx lhci autorun --config=lighthouserc.prod.json

# Lokal build'e karşı (CI uyumlu)
npm run lhci
```

Output `.lighthouseci/lhr-*.html` her run için detaylı rapor içerir.

## Tarih

İlk baseline: oturum 34 (30 Nis 2026), commit sonrası prod state.
