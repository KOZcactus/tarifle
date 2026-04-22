# Tarifle Gelecek Planları

Bu dosya **sadece yapılmamış planlar** içerir. Bir madde bitince SİLİNİR
(değer-veren havuz kalır, değer-vermeyen arşiv oluşmaz).

**Bitmiş iş**:
- `docs/CHANGELOG.md`'ye özet eklenir (opsiyonel)
- `docs/PROJECT_STATUS.md`'nin "Yapılanlar" bölümüne tarih + commit ile
- Bu dosyadan silinir

**Prensip**: Her madde ya "Aktif (şu an çalışılıyor)" ya "Planlı
(site açılışı öncesi)" ya "Sonrası (site açılışı sonrası)" etiketli.

---

## 🎯 Aktif (şu an çalışılıyor / kısa vade)

### Faz 1 Leaderboard kalan parçalar (oturum 12'de altyapı canlı, sonraki iterasyon)

Tamamlananlar (oturum 12, commit `88da36b`):
- ✅ Prisma migration `20260422030000_add_faz1_badge_keys` (7 yeni BadgeKey)
- ✅ `src/lib/leaderboard/score.ts` skor util (raw SQL 5 CTE, 3 pencere)
- ✅ `src/app/leaderboard/page.tsx` SSR route (haftalık + aylık + all-time)
- ✅ Navbar "Liderlik" link
- ✅ Badge config (`src/lib/badges/config.ts`) 7 yeni metadata

Kalan:
- [ ] Profil sayfasına skor + rozet satırı (`src/app/profil/[username]/page.tsx`; `getUserScore` util hazır, ~45dk)
- [ ] Haftalık cron: pazartesi 06:00 UTC skor + WEEKLY/MONTHLY/ALL_TIME_TOP rozet atama
- [ ] Paylaşım kartı: "Top 10" Instagram-story boyutlu PNG (opsiyonel, Faz 1.1)

### Codex Mod C (Landing SEO copy), teslim bekleniyor

Brief `docs/CODEX_BATCH_BRIEF.md` §12. Beklenen:
- [ ] Codex teslim `docs/seo-copy-v1.json` (38 item: 17 kategori + 16 mutfak + 5 diyet)
- [ ] Landing sayfalarına inject kodu (~2 saat)
- [ ] Article + FAQPage JSON-LD entegrasyonu

### Codex Mod D (Top 200 editoryal revize), CSV hazırlanacak

Brief `docs/CODEX_BATCH_BRIEF.md` §13 (oturum 12'de eklendi). Beklenen:
- [ ] `scripts/gen-editorial-review-csv.ts` yeni script (viewCount desc top 200, 100'er batch)
- [ ] Codex teslim `docs/editorial-revisions-batch-N.json` (partial update, değişiklik önerileri)
- [ ] Tarif update pipeline: tipNote + servingSuggestion DB update script
- [ ] dev/prod apply

### Batch 30 Codex tam teslim

- [ ] Codex partial 30 tarif gönderdi (oturum 12 sonu), full 100'e tamamlaması bekleniyor
- [ ] Full teslim sonrası: dev seed + audit + CSV üret + Mod B brief

### Vercel Fluid CPU teyit

- [ ] TTL artışı sonrası Dashboard Fluid Active CPU %50+ azalma gözlemi (oturum 13 ilk iş)

---

## 📋 Planlı (site açılışı öncesi, oturum 13-22)

### Teknik + kalite

- [ ] **Top 200 tarif elle kalite kontrol** (Codex Mod D teslim sonrası
      manuel review + onay)
- [ ] **Blog tarif kümesi** (P3-16): "30 dakikalık tavuk", "airfryer
      patates", "glutensiz kahvaltı", "karnıyarık yanında ne gider",
      "menü planlamanın 5 kuralı" tarzı 10-15 yazı ilk dalga
- [ ] **23 lint warning cosmetic temizliği** (unused vars)
- [ ] **RecipeCard viewCount threshold** (detail page'de yapıldı, card'a da
      `viewCount < 30` hide)
- [ ] **Content Quality admin widget v2**: "Eksik tipNote", "Eksik
      ingredient image" filter
- [ ] **Performance audit**: Lighthouse 90+ hedefi, gerçek 3G simülasyon
- [ ] **Playwright E2E**: kritik user flow (arama → tarif detay → bookmark
      → koleksiyon)
- [ ] **Sentry replay entegrasyonu** (opsiyonel): kullanıcı hatası
      anında session replay
- [ ] **Cache Components (PPR) full refactor** (oturum 12'de denendi,
      `cacheComponents: true` Tarifle'de 30+ `force-dynamic` export ile
      çakıştı, paradigm shift 8-12 saat). Site açılış sonrası dedicated
      sprint'te. Beklenen kazanç: Fluid Active CPU %40-50 azalma.
- [ ] **Turbopack prod build** (`next build --turbopack`, Build Minutes
      (Fluid CPU değil) azaltır, developer-side deploy süresi kısalır).
      Risk: Sentry source map + @react-pdf outputFileTracingIncludes
      edge case'leri. Opt-in ileride.

### İçerik

- [ ] **Batch 30+**: Codex Mod A pipeline devam, hedef 3500+ tarif
      açılış öncesi
- [ ] **Mod B backfill temizlik**: eski batch'lerden kalan translation
      açığı varsa son pass (gen-modb-backfill-csv.ts tarama)
- [ ] **Ingredient standardı audit**: 1208 ingredient listesinde
      duplicate/yakın-duplicate temizliği (örn. "tavuk göğsü" vs "Tavuk
      göğsü" case, "kirmizi biber" vs "kırmızı biber" accent)
- [ ] **Fotoğraf dalgası**: top 100 tarife Cloudinary'den görsel yükle
      (placeholder emoji değil, gerçek foto)

### A11y + UX polish

- [ ] **Keyboard navigation** tam audit: hero prompt, recipe card, filter,
      search (Tab, Enter, Escape tüm flow)
- [ ] **Color contrast** WCAG AA doğrulama (devtools Lighthouse)
- [ ] **Reduced motion**: hero animation, carousel transitions `@media
      (prefers-reduced-motion: reduce)` ile durdur
- [ ] **Dark mode polish**: varsa kontrol, yoksa karar

### SEO

- [ ] **Schema.org Video** (ileride Remotion snippet eklenince)
- [ ] **Sitemap priority v2**: isFeatured + content-quality bazlı
- [ ] **Google Search Console**: her kategori/mutfak/diyet için CTR
      izlem, düşük CTR'lı başlık revize

---

## 🚀 Sonrası (site açılışı sonrası, oturum 22+)

### Topluluk seed (P2-12)

- [ ] 5-10 editör/aşçı daveti
- [ ] İlk hafta 2-3 uyarlama paylaşım planı
- [ ] "Uyarlamanı paylaş" kampanyası (rozet reward)
- [ ] Haftalık editör seçimi "topluluk_seçimi" skor bonusu

### Paid tier (Faz 2 - Pro)

- [ ] Stripe integration (TR TL kabul)
- [ ] Subscription state DB model (`UserSubscription`)
- [ ] Pro badge visual design
- [ ] Paywall UI (limit aşımında modal)
- [ ] Analytics: conversion funnel (free → trial → paid)
- [ ] İptal + iade akışı + KVKK data export

### Max tier (Faz 3)

- [ ] Max badge platin tasarım
- [ ] Editör 1-1 review mekanizması (calendar + video call)
- [ ] Video snippet upload (Remotion + Cloudinary)
- [ ] **Tarifle içerik üreticisi programı**: Top 50 all-time reklam
      geliri %30 pay. Ödeme altyapısı (Türkiye'de freelance ödeme yasal
      düzenleme).

### Growth

- [ ] Sosyal medya otomasyonu: Instagram Reels (Remotion), TikTok snippet,
      Pinterest pin jenerasyonu
- [ ] Newsletter aktivasyonu (Resend zaten bağlı, haftalık scheduled send)
- [ ] Influencer pilot (5 mikro-influencer, affiliate code)
- [ ] App Store / Play Store hazırlığı (PWA → TWA Android, Capacitor iOS)
- [ ] Referral programı (kullanıcı davet = 1 ay Pro free)

---

## 💡 Fikir havuzu (öncelikli değil, değerlendirilecek)

- ~~Akıllı alışveriş listesi (supermarket kategori bazlı gruplandırma)~~
  ✅ Oturum 13'te tamamlandı, 11 supermarket kategorisi rule-based.
- Ses tanıma ile pişirme modu ("sıradaki adım", "tekrarla")
- Tarif tercümesi kullanıcı input ile (başka mutfak adaptasyonu)
- Besin değeri benim diyetime göre hedef skor (düşük-şeker, yüksek-lifli,
  vejeteryan dengeli)
- "Haftalık dolap taraması" quiz (kullanıcı 15 malzeme seçer, sistem
  haftalık menü önerir)
- Tarif "zorluk seviyesi kişiselleştirme" (yeni başlayan → orta →
  ileri, aynı tarif farklı detayla)
- Çoklu kullanıcı menü planlayıcı (aile üyeleri diyet kısıtı aggregate)
