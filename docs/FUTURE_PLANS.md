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

### Neon → Vercel Marketplace migration cleanup (30 Nis 2026 civarı)

Oturum 15'te standalone Neon (ep-broad-pond + ep-dry-bread) Vercel-managed
Neon'a (ep-icy-mountain + ep-jolly-haze) taşındı, tasarruf $20/ay = $240/yıl.
1 hafta paralel izleme dönemi sonrası cleanup:

- [ ] **Eski Neon standalone organization cancel** (console.neon.tech,
      billing durdur, fatura kesilir)
- [ ] Vercel env `DATABASE_URL_OLD` satırlarını sil (Production + Preview)
- [ ] `scripts/lib/db-env.ts` PROD_HOST_PREFIXES + DEV_HOST_PREFIXES
      dizilerinden eski prefix'leri çıkar (`ep-broad-pond`, `ep-dry-bread`),
      tek-prefix'e geri dön
- [ ] Lokal backup dosyalarını sil: `.env.local.bak-oturum15-neon-migration`,
      `.env.production.local.bak-oturum15-neon-migration`
- [ ] `scripts/tmp-migration/` dizinini temizle (prod.dump + dev.dump +
      connections.json + test-fetch scripts)
- [ ] İsterse Neon console'da yeni project'in password rotate (dump
      sırasında chat'e password yapıştırıldı, güvenli rotation hijyen)

Gating koşul: 1 hafta boyunca prod `tarifle.app` + dev smoke test temiz
olması + Sentry error hacminin baseline'da kalması. 30 Nis 2026 sonrası
trigger.



### Codex Mod E (step kalitesi sistematik revize)

Brief `docs/CODEX_BATCH_BRIEF.md` §14 (B6+ ince ayar oturum 14'te
tamamlandı, B16 dersleri §14.5 + §14.7'ye işlendi: UTF-8 no-BOM +
cümle tekrar yasağı). Pipeline oturdu, B1-B20 apply (~%72 catalog).
Sırada:
- [ ] **Codex teslim B21-B30** (10 batch, ~1000 tarif kalan)
- [ ] Apply akışı: dry-run → TR karakter scan → spot check → dev+prod
- [ ] Fix script gerekirse tek-seferlik auto-clean (B8 v3 + B12 v3 pattern)
- [ ] Cache invalidate: apply sonrası Vercel deploy otomatik (unstable_cache
      reset)

### Hero A/B test sonuçları (1-2 hafta sonra)

- [ ] Sentry tag `hero.variant: A|B` filter ile per-variant hata oranı
- [ ] Plausible/PostHog entegrasyonu (conversion attribution)
- [ ] Variant kazanan kararı, kaybedeni sil
- [ ] Oturum 14 değişikliği: hero içerik "24 mutfak, N farklı yemek çeşidi"
      vurgusu A/B A variant + B variant aynı şekilde etkilenir

### Vercel Fluid CPU 7-day teyit

- [ ] TTL artışı sonrası Dashboard Fluid Active CPU %50+ azalma gözlemi
- [ ] Oturum 12-13 TTL agresif artış + B1-B13 Mod E apply sonrası ek
      cache invalidation frequency etkisi

---

## 📋 Planlı (site açılışı öncesi, oturum 15-22)

### Teknik + kalite

- [ ] **AI Asistan v4**: "Haftalık menü önerisi" - kullanıcı pantry +
      prefs + kişi sayısı + süre → 7×3 öğün önerisi. Mevcut v3 tek
      tarif veriyor, v4 çok-öğün menü planı.
- [ ] **Admin Tarif Düzenle UX iyileştirmeleri**: drag-drop reorder
      (ingredient/step), çift onay modal silme için, gerçek zamanlı
      preview
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

### Blog kategorisi genişletme

Oturum 14'te 4 → 25 yazı eklendi, 11/7/7 denge. Sonraki aday konular:

- [ ] **Blog 26+**: Ramazan Sofrası (rehber 8), Yoğurt ve Tereyağı
      Yapımı (malzeme 8), Fırın Kullanımı Raf Isı (pişirme 12), Bayram
      Sofrası (rehber), Sarımsak Doğru Kullanımı (pişirme), Kahvaltı
      Sonrası Kahve/Çay Eşleştirme (rehber)
- [ ] Hedef: **30-40 blog yazısı** açılış öncesi (mevcut 25 + 5-15 yeni).
- [ ] **İç link ağı**: mevcut 25 yazının birbirine çapraz-referansları
      eklenebilir (Blog 19 kalıp boyutu → Blog 14 kek dönüşümü bağlantısı gibi)

### A11y + UX polish

- [ ] **Color contrast** WCAG AA detaylı tarama (Lighthouse 100 ulaştı
      ama spot check eksik)
- [ ] **Dark mode polish**: varsa kontrol, yoksa karar

### SEO

- [ ] **Schema.org Video** (ileride Remotion snippet eklenince)
- [ ] **Google Search Console**: her kategori/mutfak/diyet için CTR
      izlem, düşük CTR'lı başlık revize
- [ ] **Blog yazıları SEO izlem**: 25 yazının indekslenme + CTR takibi,
      düşük performanslı başlık revize

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
- [ ] Newsletter haftalık scheduled send (Resend bağlı, test başarılı,
      scheduler kurulumu kalıyor)
- [ ] Influencer pilot (5 mikro-influencer, affiliate code)
- [ ] App Store / Play Store hazırlığı (PWA → TWA Android, Capacitor iOS)
- [ ] Referral programı (kullanıcı davet = 1 ay Pro free)

---

## 🔎 Audit notları (küçük, post-launch)

- [ ] **Near-duplicate slug çifti:** `sakizli-badem-sutlac-cesme-usulu`
      (MEDIUM, 218 kcal, 5 ingredient, isFeatured) vs
      `sakizli-bademli-sutlac-cesme-usulu` (EASY, 228 kcal, 4 ingredient).
      Farklı tarifler ama isim ayrımı zayıf. Duplicate merge run'ına
      düşmemiş (içerik ayrı). Open: birleştirilsin mi yoksa isim netleş-
      tirilsin mi (ör. "hızlı" / "klasik" varyant etiketi). Oturum 15
      B14 apply sonrası spot bulundu.

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
- Tarif karşılaştırma sayfası (`/karsilastir?a=slug1&b=slug2`)
- Recipe remix feature (otomatik vegan/glutensiz/hızlı versiyon)

---

## 🟢 Oturum 15 erken (silinmeden önce referans)

- Tailwind 4 `dark:` variant, `[data-theme]` attribute'una bağlandı
  (commit `c409342`). OS dark modundaki ziyaretçilerde light toggle
  sonrası kart bg'lerinin lacivert kalıp içeriği gizlemesi çözüldü.
- Mod E B14 apply (commit `648276a`), 100 tarif + 492 step, dev+prod.
  TR char 1934, ASCII trap 0, "ya da" 15 (trend azalma). Mod E
  toplam B1-B14 = 1400 tarif (~%48 catalog).
- Mod E B15 v1 REJECT, paraphrase + template yasağı ihlali: 23 cümle
  2+ tarifte tekrar (en ağır 32x "Yemeği birkaç dakika dinlendirip
  sıcak servis edin."). Codex'e net feedback + self-check komutu
  verildi. v2 geldi, 100 tarif + 499 step, kontroller en iyi seviye:
  template dup 0, "ya da" 0, TR 2865 (batch'ler arası en yüksek),
  ASCII trap 0. Dev + prod apply. Mod E toplam B1-B15 = 1500 tarif
  (~%52 catalog).
- Mod E B16 apply, 100 tarif + 500 step. BOM auto-fix (UTF-8 BOM
  dosya başında geldi, Node parse blocker; sildik). Audit temiz:
  TR 3203 (yeni en yüksek), template dup yalnız 4 cümle 2x (3+ tarif
  yok), "ya da" 1, timer 95/100 tarif, ASCII trap 0. Codex B17'ye
  feedback: (a) UTF-8 no-BOM yaz, (b) aynı cümle 2 tarifte bile
  geçmesin. Mod E toplam B1-B16 = 1600 tarif (~%56 catalog).
- CODEX_BATCH_BRIEF §14.5 + §14.7 B16 dersleri (commit `2a48d49`):
  UTF-8 no-BOM zorunlu + cümle tekrar yasağı + self-check bash
  komutları.
- Neon → Vercel Marketplace migration (commit `1506441`): standalone
  Neon (ep-broad-pond + ep-dry-bread) Vercel-managed Neon'a
  (ep-icy-mountain + ep-jolly-haze) taşındı. Docker postgres:17 ile
  pg_dump + pg_restore (prod 2.5MB / dev 2.3MB), row count 1:1 eşleşti,
  22 migration history intact. `scripts/lib/prisma.ts` runtime URL
  seçimi (VERCEL_ENV check, Preview/Dev `DATABASE_URL_DEV`) integration
  çakışmasını atladı. Tasarruf $20/ay = $240/yıl. 1 hafta rezerv,
  30 Nis cleanup.
- Mod E B17 apply (yeni Neon üzerinden ilk apply, 100 tarif + 486
  step). Audit en iyi seviye: BOM yok, template dup 0, TR 3174,
  ASCII trap 0, "ya da" 7. Mod E B1-B17 = 1700 tarif (~%60 catalog).
- Mod E B18 apply (100 tarif + 504 step, step count rekor). Audit:
  BOM yok, template dup 0, TR 3204 (yeni rekor), "ya da" 4 (düşüyor),
  timer 96/100 tarif (yeni rekor). Mod E B1-B18 = 1800 tarif
  (~%64 catalog).
- Mod E B19 apply (100 tarif + 499 step). Audit: BOM yok, template
  dup 0, TR 3261 (yeni rekor), ASCII trap 0. "ya da" 6 (legitimate
  alternatifler), "malzemesini" 2 (false-positive: "iç malzemesini"
  = böreğin içi substantif, gramer doğru). Mod E B1-B19 = 1900 tarif
  (~%68 catalog).
- Mod E B20 üç tur rework: v1 REJECT (33 tarif template smuggling,
  `{TARIFADI} hazır olduğunda sıcak ya da ılık biçimde servis edin`
  ve `{TARIFADI} tarifini bekletmeden ya da kısa dinlenmeyle sofraya
  çıkarın` kalıpları; "ya da" 39). v2 REJECT (template + "ya da"
  düzeldi ama 1427 `?` karakteri, UTF-8 encoding bozulması, TR chars
  1521'e düştü). v3 temiz: TR 2945, `?` = 0, template dup 0, "ya da" 3,
  "malzemesini" 0. Apply dev+prod. Mod E B1-B20 = 2000 tarif (~%72
  catalog, yolun dörtte üçü).

---

## ✅ Oturum 14'te tamamlananlar (silinmeden önce burada referans)

Hızlı snapshot, detay PROJECT_STATUS.md'de:
- Admin "Tarif Düzenle" formu ✅
- AI Asistan v3 (reason chip + cuisine diversity) ✅
- Hero badge çeşitlilik vurgusu (24 mutfak) ✅
- Mod E Brief §14 B6+ ince ayar (paraphrase + type + servis esneklik) ✅
- Mod E B1-B13 apply (1300 tarif, ~%45 catalog) ✅
- Mod E B11-B30 CSV hazır (20 batch kuyruk) ✅
- Audit script --batches / --batch-offset / --slice-offset flag ✅
- 20 yeni blog yazısı (Blog 5-25, kategori 11/7/7) ✅
- Blog citation standardı 4 yazıya retro-apply ✅
- BLOG_CONTENT_GUIDE.md editöryal standart ✅
- feedback_output_format.md memory ✅
- Fix script disiplin (B8 v3 + B12 v3) ✅
- Cleanup + .gitignore lh-*.json ✅
