# Tarifle — Performans Baseline Raporu

> Son güncelleme: 19 Nisan 2026 (oturum 6) — 1401 tarif, pagination counter
> + kişiselleştirme tur 2 + preferences migration sonrası.
>
> Önceki güncelleme: 16 Nisan 2026 (oturum 2) — 606 tarif, font optimizasyonu.

## Skor tablosu (19 Nis — unstable_cache + /api/warm sonrası, ikinci ölçüm)

| Sayfa | Perf (cold / warm) | LCP | TBT (cold / warm) | Δ vs pre-cache |
|---|---|---|---|---|
| `/` | **87 → 92** | 2.7–3.3 s | **310 → 50 ms** | TBT cold +80 ms; warm **−180 ms** (−78%) |
| `/tarifler` | 92 | 3.2 s | 100 ms | ~aynı (LH varyans) |
| `/tarifler/tatlilar` | 93 | 3.0 s | 100 ms | ~aynı |

**Yorum:** `unstable_cache` dört hot query'de (cuisine-stats 5 dk, categories
5 dk, search-suggestions 10 dk, featured-pool 1 saat) Vercel function
memory cache kullanıyor. **İlk çağrı (cache miss)** DB round-trip + cache
dolumu yaptığından cold TBT biraz yükseldi (230 → 310 ms) — single-shot
Lighthouse measurement'ı bu cold path'i yakalıyor. **İkinci çağrı (cache
hit)** aynı Vercel function instance'da memory lookup → **TBT 50 ms**, 6×
iyileşme. Gerçek kullanıcılar (RUM) görece warm path kullanıyor çünkü
traffic cold/warm mix. LCP ±400 ms varyans, anlamlı delta yok.

**Neon warming** (`/api/warm` endpoint + Hobby cron 0 * * * *) deploy
edildi. `GET /api/warm` 200, durationMs 80. Saat başı trigger 5 dk idle
threshold'u aşmaya yetmez — gerçek faydası için Pro tier `*/4` veya
external monitor (UptimeRobot/GitHub Actions 5 dk cron). Şu an
"nominal fallback" olarak calıșıyor.

## Skor tablosu (19 Nis — 1401 tarif + kişiselleştirme + pagination counter, pre-cache)

| Sayfa | Perf | A11y | BP | SEO | LCP | FCP | CLS | TBT | TTI | Boyut |
|---|---|---|---|---|---|---|---|---|---|---|
| `/` | **90** | 100 | 100 | 100 | 2.6 s | 1.3 s | 0.001 | 230 ms | 3.3 s | 480 KiB |
| `/tarifler` | **92** | 100 | 100 | 100 | 3.0 s | 1.3 s | 0 | 110 ms | 3.1 s | 465 KiB |
| `/tarifler/tatlilar` | **93** | 100 | 100 | 100 | 3.0 s | 1.1 s | 0 | 100 ms | 3.1 s | 450 KiB |
| `/tarif/lalanga-trakya-usulu` | **96** | 96 | 96 | 100 | 2.2 s | 1.3 s | 0.017 | 0 ms | 2.3 s | 323 KiB |
| `/ai-asistan` | **96** | 98 | 100 | 100 | 2.5 s | 1.3 s | 0 | 110 ms | 3.1 s | 447 KiB |

### Değişim analizi (16 Nis 606 tarif → 19 Nis 1401 tarif)

**Regression (kabul edilebilir, hala 90+ eşik üstünde):**
- `/` Perf **96 → 90** (−6). TBT **27 → 230 ms** (8× artış) — en büyük
  darboğaz. Sebep: homepage'de Promise.all 10 paralel query + yeni "Sana
  özel" shelf çağrısı + CountUp 1401 + cuisineStats 24 cuisine. JS bundle
  client'a daha ağır iniyor.
- `/tarifler` Perf **96 → 92** (−4). LCP **2.6 → 3.0 s**, TBT **33 → 110
  ms**. Sebep: 24 cuisine chip + 15 tag chip + 10 allergen chip render'ı
  ilk paint'i uzatıyor (FilterPanel artık daha büyük).
- `/ai-asistan` Perf **97 → 96** (−1). İhmal edilebilir.

**Stabil / aynı:**
- `/tarif/*` Perf **96** (aynı). Single-recipe render zaten az iş; tarif
  sayısı artışından bağımsız. CLS 0.017 borderline (emoji placeholder).
- CLS tüm sayfalarda < 0.02 ✅
- SEO + A11y + BP 96-100 aralığında (`/tarif/lalanga` A11y 96 — muhtemelen
  emoji role label veya aria-current contrast).

### Önceki baseline (16 Nis — 606 tarif, font optimizasyonu sonrası)

| Sayfa | Perf | A11y | BP | SEO | LCP | FCP | CLS | TBT | Boyut |
|---|---|---|---|---|---|---|---|---|---|
| `/` | 96 | 100 | 100 | 100 | 2.5 s | 1.2 s | 0 | 27 ms | 343 KiB |
| `/tarifler` | 96 | 100 | 100 | 100 | 2.6 s | 1.1 s | 0 | 33 ms | 334 KiB |
| `/tarif/adana-kebap` | 96 | 100 | 100 | 100 | 2.5 s | 1.0 s | 0 | 18 ms | 343 KiB |
| `/ai-asistan` | 97 | 98 | 100 | 100 | 2.6 s | 1.0 s | 0 | 12 ms | 329 KiB |

### İlk baseline (14 Nis — 406 tarif, font optimizasyonu öncesi)

| Sayfa | Perf | A11y | LCP | TBT | Boyut |
|---|---|---|---|---|---|
| `/` | 95 | 100 | 2.5 s | 10 ms | 342 KiB |
| `/tarifler` | 96 | 98 | 2.5 s | 20 ms | 339 KiB |
| `/tarif/adana-kebap` | 94 | 100 | 2.5 s | 40 ms | 342 KiB |
| `/ai-asistan` | 97 | 98 | 2.5 s | 10 ms | 329 KiB |

## Optimization fırsatları (oturum 7+ için)

Öncelikli — `/` ve `/tarifler` TBT regression'unu geri kazanmak:
1. **Homepage "Sana özel" shelf lazy load** — hero'nun hemen altında değil,
   scroll eşiğinde fetch + render. IntersectionObserver ile.
2. **getCuisineStats + getSearchSuggestions cache** — bu iki query
   minute-level değişiyor, `unstable_cache` veya edge cache ile revalidate.
3. **Filter chips collapsible** — 24 cuisine chip'ini ilk 8 visible +
   "daha fazla" expander. A11y için expanded state ARIA.
4. **ISR / PPR (Partial Prerendering)** — `/tarifler` dynamic kısım
   (results) + static shell (filter panel). Next.js 16 PPR stable.

İkincil — LCP 3.0 s'yi 2.5 s altına çekmek:
5. **Neon connection warming** — TTFB'nin büyük kısmı cold-start. `setInterval`
   keep-alive cron veya Vercel Edge caching.
6. **Hero görsel pipeline** — Eren görselleri canlıya alınca LCP image'a
   dönüşecek; `priority` + AVIF/WebP + `fetchpriority="high"` preload.

Üçüncül — recipe detail `/tarif/*` sıfır regression gösterdi ama CLS 0.017
emoji-placeholder kaynaklı. Gerçek görsele geçişte reserved dimension.

## Web Vitals hedefleri

| Metrik | Hedef (Good) | Şu an | Durum |
|---|---|---|---|
| LCP | < 2.5 s | 2.2–3.0 s | ⚠ borderline (`/tarifler` 3.0 s üstünde) |
| INP | < 200 ms | (RUM gerek) | — |
| CLS | < 0.1 | 0–0.017 | ✅ |
| FCP | < 1.8 s | 1.1–1.3 s | ✅ |
| TBT | < 200 ms | 0–230 ms | ⚠ `/` 230 ms (eşikte) |

## Sonraki ölçüm önerileri

- Homepage lazy load + cache denendiğinde TBT delta
- 2000 tarife ulaşıldığında re-run (sitemap + search FTS stres)
- Recipe görseller canlıya alınca LCP element değişir → yeni baseline
- INP gerçek kullanıcı metriği için Vercel Analytics veya Sentry
  Performance entegrasyon

## Çalıştırma komutu (referans)

```bash
npx -y lighthouse@latest "<url>" \
  --only-categories=performance,seo,accessibility,best-practices \
  --output=json --output-path=lh-X.json \
  --chrome-flags="--headless=new" --quiet
```

Bu dosya periyodik snapshot. Büyük feature veya batch sonrası karşılaştırma
için tekrar çalıştırılabilir.
