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

### Codex Mod E (step kalitesi sistematik revize), teslim bekleniyor

Brief `docs/CODEX_BATCH_BRIEF.md` §14 (oturum 13'te kuruldu). Audit %94
tarif sorunlu (catalog 2772, 2585+ flag), Mod A boilerplate izi. Sırada:
- [ ] Codex teslim `docs/step-revisions-batch-1.json` (top 100 step kalitesi)
- [ ] Apply: `scripts/apply-step-revisions.ts --batch 1 --apply` (dev+prod)
- [ ] Sırayla B2-B26 (~26 batch toplam)
- [ ] Cache invalidate: `/api/admin/revalidate?slug=X` veya 30dk TTL bekle

### Mod D Batch 28 son (catalog tükendi), yeni batch için catalog büyümesi gerek

- [ ] Mod A Batch 30+ ile catalog 2900+'a çıkarsa Mod D Batch 29 mümkün
- [ ] Veya Mod D pipeline'ı kapat (B1-B28 = ~%50 dokunma yeterli)

### Hero A/B test sonuçları (1-2 hafta sonra)

- [ ] Sentry tag `hero.variant: A|B` filter ile per-variant hata oranı
- [ ] Plausible/PostHog entegrasyonu (conversion attribution)
- [ ] Variant kazanan kararı, kaybedeni sil

### Vercel Fluid CPU 7-day teyit

- [ ] TTL artışı sonrası Dashboard Fluid Active CPU %50+ azalma gözlemi

---

## 📋 Planlı (site açılışı öncesi, oturum 14-22)

### Teknik + kalite

- [ ] **Admin "Tarif Düzenle" formu** (oturum 13 dersi: pide manuel fix
      script + cache invalidate + hot path öğretti). `/admin/tarifler/[slug]/duzenle`
      ingredient + step + tipNote + serv inline edit, save → otomatik
      `updateTag("recipes")` + `revalidatePath`.
- [ ] **Blog tarif kümesi** (P3-16): "30 dakikalık tavuk", "airfryer
      patates", "glutensiz kahvaltı", "karnıyarık yanında ne gider",
      "menü planlamanın 5 kuralı" tarzı 10-15 yazı ilk dalga
- [ ] **AI Asistan v3 sıkılaştırma**: mevcut pantry + prefs (oturum 13 tur 5),
      daha derin diyet/zaman/öneri çeşitliliği
- [ ] **Cache Components (PPR) full refactor** (oturum 12'de denendi,
      `cacheComponents: true` Tarifle'de 30+ `force-dynamic` export ile
      çakıştı, paradigm shift 8-12 saat). Site açılış sonrası dedicated
      sprint'te. Beklenen kazanç: Fluid Active CPU %40-50 azalma + perf
      score 73 → 90+.

### İçerik

- [ ] **Batch 30+**: Codex Mod A pipeline devam, hedef 3500+ tarif
      açılış öncesi
- [ ] **Mod B backfill temizlik**: eski batch'lerden kalan translation
      açığı varsa son pass (gen-modb-backfill-csv.ts tarama)
- [ ] **Fotoğraf dalgası**: top 100 tarife Cloudinary'den görsel yükle
      (placeholder emoji değil, gerçek foto)

### A11y + UX polish

- [ ] **Color contrast** WCAG AA detaylı tarama (Lighthouse 100 ulaştı
      ama spot check eksik)
- [ ] **Dark mode polish**: varsa kontrol, yoksa karar

### SEO

- [ ] **Schema.org Video** (ileride Remotion snippet eklenince)
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
- [ ] Newsletter aktivasyonu (Resend zaten bağlı, haftalık scheduled send;
      oturum 13 ilk test mail başarılı, scheduler kurulumu kalıyor)
- [ ] Influencer pilot (5 mikro-influencer, affiliate code)
- [ ] App Store / Play Store hazırlığı (PWA → TWA Android, Capacitor iOS)
- [ ] Referral programı (kullanıcı davet = 1 ay Pro free)

---

## 💡 Fikir havuzu (öncelikli değil, değerlendirilecek)

- Ses tanıma ile pişirme modu ("sıradaki adım", "tekrarla")
- Tarif tercümesi kullanıcı input ile (başka mutfak adaptasyonu)
- Besin değeri benim diyetime göre hedef skor (düşük-şeker, yüksek-lifli,
  vejeteryan dengeli)
- "Haftalık dolap taraması" quiz (kullanıcı 15 malzeme seçer, sistem
  haftalık menü önerir)
- Tarif "zorluk seviyesi kişiselleştirme" (yeni başlayan → orta →
  ileri, aynı tarif farklı detayla)
- Çoklu kullanıcı menü planlayıcı (aile üyeleri diyet kısıtı aggregate)

---

## ✅ Oturum 13'te tamamlananlar (silinmeden önce burada referans)

Hızlı snapshot, detay PROJECT_STATUS.md'de:
- Faz 1 Leaderboard döngüsü (Profile chip + cron + 7 rozet) ✅
- Privacy 3 toggle ✅
- Mod D Batch 1-22 prod ✅ (B23-B28 son, batch 29 catalog yetmez)
- Mod C inject 38 item ✅
- Personalization tur 4 + tur 5 ✅
- WCAG 96→100 ✅
- Sitemap v2 composite ✅
- Ingredient catalog %100 temiz ✅
- Admin Quality widget v2 ✅
- Newsletter ilk gerçek gönderim test ✅
- Sentry Replay ✅
- Hero A/B kurulumu ✅
- Akıllı alışveriş listesi 11 kategori ✅
- Playwright E2E + keyboard nav ✅
- Turbopack prod build ✅
- Lighthouse 3-run baseline ✅
- 23 lint warning → 0 ✅
- Reduced motion CountUp ✅
- Mod E pipeline kurulumu (audit + apply + brief + ilk batch CSV) ✅
