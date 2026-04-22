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

## 🎯 Aktif (şu an çalışılıyor)

### Faz 1 Rozet + Leaderboard altyapısı (oturum 12)

Ayrıntı `docs/TARIFLE_ULTIMATE_PLAN.md` §35. Uygulama adımları:

- [ ] Prisma schema: `Badge` + `UserBadge` + `UserScoreSnapshot` model
- [ ] Migration + seed 5 başlangıç rozeti
- [ ] `src/lib/leaderboard/score.ts` skor hesaplama util
- [ ] `src/app/leaderboard/page.tsx` SSR route (haftalık + aylık + all-time tabs)
- [ ] Profil sayfasına skor + rozet satırı (`src/app/profil/[username]/page.tsx`)
- [ ] Haftalık cron: pazartesi 06:00 UTC skor hesaplama + rozet atama
- [ ] Paylaşım kartı: "Top 10" Instagram-story boyutlu PNG (opsiyonel, Faz 1.1)

### Codex Mod C (Landing SEO copy)

Brief `docs/CODEX_BATCH_BRIEF.md` §12. Beklenen:
- [ ] Codex teslim `docs/seo-copy-v1.json` (38 item)
- [ ] Landing sayfalarına inject kodu (~2 saat)
- [ ] Article + FAQPage JSON-LD entegrasyonu

### Codex Mod D (Top 200 editoryal revize)

Brief `docs/CODEX_BATCH_BRIEF.md` §13 (eklenecek). Beklenen:
- [ ] Codex teslim `docs/editorial-revisions-batch-N.json` (100 item)
- [ ] Tarif update pipeline: tipNote + servingSuggestion DB update script
- [ ] dev/prod apply

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

- Akıllı alışveriş listesi (supermarket kategori bazlı gruplandırma)
- Ses tanıma ile pişirme modu ("sıradaki adım", "tekrarla")
- Tarif tercümesi kullanıcı input ile (başka mutfak adaptasyonu)
- Besin değeri benim diyetime göre hedef skor (düşük-şeker, yüksek-lifli,
  vejeteryan dengeli)
- "Haftalık dolap taraması" quiz (kullanıcı 15 malzeme seçer, sistem
  haftalık menü önerir)
- Tarif "zorluk seviyesi kişiselleştirme" (yeni başlayan → orta →
  ileri, aynı tarif farklı detayla)
- Çoklu kullanıcı menü planlayıcı (aile üyeleri diyet kısıtı aggregate)
