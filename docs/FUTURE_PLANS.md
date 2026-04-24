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

### Legal + KVKK detay polish (launch öncesi, opsiyonel, 15-30 dk)

Oturum 19 G paketi audit'i: Kerem KVKK/Gizlilik/Kullanım Koşulları/Çerez
Politikası/Güvenlik/İletişim 6 sayfayı detaylı yazmış, 6698 referansı,
veri sorumlusu, hukuki sebepler, işleme amaçları net.

Minor polish noktaları (launch-blocker değil, Kerem kararı):

1. **Veri sorumlusu kurumsal kimlik**: şu an "Tarifle platformu" + Kerem
   iletişim email. Launch formalite için "Tarifle - [Kerem Öztürk,
   Şahsi]" veya "Tarifle - [LTD ŞTİ adı]" ünvan eklenebilir. KVKK
   uyumu zaten var, bu sadece görünüm.

2. **lastUpdate tarihi**: 19 Nisan 2026 (6 gün eski). Bu oturumda CSP
   Report-Only + X-Frame-Options + delete flow eklendi; bunlar gizlilik/
   güvenlik yazılarına yansımadı. Minor: "Güvenlik" sayfasına "Content-
   Security-Policy Report-Only mode aktif", "X-Frame-Options DENY"
   satırları eklenebilir. Ve lastUpdate → 25 Nisan 2026.

3. **İletişim email kurumsal**: koz.devs@gmail.com kişisel. Launch için
   kvkk@tarifle.app + iletisim@tarifle.app alias'ları Resend/Cloudflare
   Email Routing ile Kerem'in inbox'ına forward edilebilir. Güven sinyali.

### Blog internal link ağı genişletme (launch öncesi, 1-2 saat)

Oturum 19 H paketi audit'i: 36 blog yazısından sadece 4'ü (oturum 19'da
yazılan 32, 33, 34, 35, 36) başka bloga internal link veriyor. 32 eski
yazı birbirine referans vermiyor.

Overlapping domain analizi:
- Et güvenliği üçleme: soğuk-zincir + et-mühürleme + hijyen (3 yazı)
- Hamur üçleme: pilav + maya-kabartma + un-helvasi (lalanga?)
- Süt ürünleri dörtleme: yoğurt (fermentasyon) + tereyağı + peynir + zeytin ✅ (zaten link var)
- Kahvaltı: Turk-kahvaltisinin-mantigi + ilgili süt ürünleri + kahve-demleme

Her eski yazıya 1-3 internal link ekleme: 32 × 2 ort = ~64 link, 1-2
saat manuel iş. SEO on-page authority + reader journey.

Opsiyonel yaklaşım: blog detail sayfasına component seviyesinde "İlgili
Yazılar" widget (kategori + tag match). Daha az manuel iş + dinamik
update, ama editorial seçim kadar güçlü değil.

### DMARC kaydı ekle (launch öncesi, 5 dk DNS işi)

Oturum 19 cron + observability audit'inde tespit edildi: `_dmarc.tarifle.app`
TXT kaydı YOK (NXDOMAIN). Modern Gmail/Outlook DMARC olmayan domain'lerin
email'ini agresif filter'lar, inbox yerine spam veya direkt reject.

**Ship edilmiş tarafı**:
- Resend DKIM: `resend._domainkey.tarifle.app` p= public key ✅
- Resend SPF: `send.tarifle.app` TXT `v=spf1 include:amazonses.com ~all` ✅
- Resend bounce MX: `send.tarifle.app` 10 feedback-smtp.eu-west-1.amazonses.com ✅

**Eksik**: DMARC policy. Cloudflare DNS panel üzerinden eklenmeli (Kerem):

```
Host:  _dmarc
Type:  TXT
Value: v=DMARC1; p=none; rua=mailto:dmarc@tarifle.app; fo=1
TTL:   3600
```

`p=none` başlangıçta (monitor mode, mail bloklamaz sadece rapor alır).
1 ay izleme sonrası `p=quarantine`, 3 ay sonra `p=reject` geçişi.
rua@ adresine haftada 1-2 rapor gelir, deliverability doğrulama için.

Opsiyonel: `p=none` DMARC çoğu durumda launch için yeterli.

### E. Onboarding polish (launch sonrası, 1-2 saat)

Oturum 19 E paketi core ship edildi: **welcome email** register sonrası
fire-and-forget gidiyor (Dolap + AI Asistan + Favoriler/Koleksiyon 3
feature + blog referansı). Kalan polish işleri launch sonrası:

1. **İlk giriş guided tour** (30-45 dk): Kayıt sonrası ilk giriş
   algılanıp (User.tourCompletedAt NULL), anasayfada 3-4 step'li
   floating overlay tour (Dolap'a git → Favorilere kaydet → AI
   Asistan'ı dene). Skip edilebilir. Intro.js veya shepherd.js gibi
   kütüphane değil, custom lightweight.

2. **Profil eksik tamamla banner** (15-30 dk): Kullanıcı profilinde
   bio, avatar, diyet tercihleri boşsa üstte küçük banner: "Profilini
   tamamla → AI önerileri daha isabetli olur". Dismissable.

3. **Empty state CTA polish** (20 dk): /dolap boş → "İlk malzemeni ekle"
   büyük CTA + örnek 5 malzeme öneri. /favoriler boş → "İlk tarifini
   bookmark et" + popüler 3 tarif carousel. /koleksiyon boş → "İlk
   koleksiyonunu oluştur" + template öneri (hafta sonu / çocuk dostu).

4. **Welcome email i18n polish**: DE dosyası yok, sadece TR + EN
   eklendi. Codex veya sonraki iterasyon DE çevirisi yazabilir
   (messages/de.json yaratılmamış, gerektiğinde olur).


### Dark theme primary renk contrast detay audit (launch sonrası, 1 saat)

Oturum 19 a11y audit'inde tespit edildi: dark theme `--color-primary: #ff7a3d`
+ beyaz metin contrast ratio ~4.47, WCAG AA normal text sınırı 4.5 hemen
altında. Large text (≥14px bold, butonlar bu kategoride) için gereken 3.0
zaten karşılanıyor, launch-blocker değil.

Detay düzenleme seçenekleri:
- Option A: dark primary'yi biraz koyulaştır (`#c65414` contrast ≈4.59 ama
  renk mat, "marka sıcaklığı" etkilenir)
- Option B: primary button text rengini koyu yap (`color: #1a1a1a` primary
  bg üzerinde contrast ≈6.7 ✅), butonların visual weight değişir
- Option C: Large text kategorisi üzerinden AA kanıtla (button text 14px
  bold = WCAG large text, contrast 3.0 gate), mevcut durum yeterli belge
  gönder

Launch öncesi: Option C (documentation). Launch sonrası marka audit'inde
A veya B.


### CSP Report-Only → enforce geçiş (oturum 19'da ship edildi, izleme aşaması)

Oturum 19'da ship edildi:
- `Content-Security-Policy-Report-Only` header aktif (next.config.ts)
- `/api/csp-report` endpoint Sentry'ye violation forward
- Rate limit scope `csp-report`: 60/dk per IP
- İlk whitelist: Vercel Analytics + Sentry + Cloudinary + Google Fonts + Google OAuth avatar

Siteyi kırmaz (Report-Only), sadece rapor eder. Sonraki adımlar:

1. **1-2 hafta izle**: Sentry'de "csp-violation" etiketli issues toplansın
2. Analiz: hangi directive en çok blok ediyor, whitelist eksik mi, 3rd party'ler değişti mi
3. Gerçek blocked_uri'leri policy'ye ekle (örn. yeni CDN, yeni font provider)
4. **Enforce geçiş**: header name `Content-Security-Policy-Report-Only` → `Content-Security-Policy`, Report-Only kaldır
5. `'unsafe-inline'` + `'unsafe-eval'` son aşamada nonce-based'e taşınmalı (Next.js 16 nonce pattern, ayrı iş paketi)

İzleme süresince Sentry filter: `tag:csp.directive:*`.


### NPM audit 13 moderate vulnerability (postcss + uuid transient)

`npm audit`: 0 critical / 0 high, 13 moderate. Kök: `next@>=9.3.4` transient postcss
+ `svix → uuid`. Breaking fix: `next@9.3.3` (major downgrade) veya `resend@6.1.3`.
Launch öncesi yapılmaz. Sonraki Next major upgrade'te otomatik düzelir muhtemelen.

Monitor: her ay `npm audit` çalıştır, yeni critical/high çıkarsa derhal incelemek.





### Mod F Retrofit Step Count (oturum 18 devam, 6/27 bitti)

Retrofit pipeline A+ standardında stabil çalışıyor. Brief §15 self-check
5 gate (varyasyon / notes / timer / muğlak / kritik nokta %60) Retrofit-03+
için geçerli. Son 4 batch (03-06) her biri kritik nokta gate'i geçti.

**Tamamlanan (600 tarif retrofit, dev + prod)**:
- [x] Retrofit-01 100 APERATIF B+ (baseline, brief A+ öncesi)
- [x] Retrofit-02 100 APERATIF+ATISTIRMALIK A- (varyasyon + notes PASS,
      kritik nokta %10 gap'i brief §15.7.4 gate'ine dönüştü)
- [x] Retrofit-03 100 CORBA A+ (kritik nokta %65, ilk TAM A+)
- [x] Retrofit-04 100 CORBA A (3 kelime minor)
- [x] Retrofit-05 100 CORBA A- (15 kelime servis step'leri)
- [x] Retrofit-06 100 CORBA+KAHVALTI+ICECEK 🏆 A+ 0 sorun (kelime 0 ihlal,
      Codex kural disiplini tam)

**Kalan**: 21 batch, 2060 tarif. Tip dağılımı şu an kalan CSV'ler:
- `docs/retrofit-step-count-07.csv` .. `27.csv`
- KAHVALTI devam (~339), TATLI 449, SALATA 256, KOKTEYL 97,
  ATISTIRMALIK 70, YEMEK 919 (son dalga)

Codex'e tek tek tetik: `"Mod F. Retrofit-07"`, JSON gelince
`scripts/apply-retrofit.ts --batch 7 --apply` + prod.


### Mod A Batch 37a+ (launch hedefi 3500+)

Prod 3452 tarif, launch hedef **3500+** için 48 kısa. Codex 37a veya 37a/b
ile ~100 yeni tarif gelebilir. Brief §5 A+ standardı aktif (varyasyon +
timer + muğlak yasak + kritik nokta + web kaynak).

- [ ] Kerem Codex'e `"Mod A. Batch 37a"` tetikle
- [ ] seed-recipes.ts apply + Backfill-16 CSV üret

### Neon → Vercel Marketplace migration cleanup (30 Nis 2026, 6 gün kaldı)

### Neon → Vercel Marketplace migration cleanup (30 Nis 2026, 5 gün kaldı)

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

### Hero A/B test DURDURULDU (oturum 15)

Oturum 13'te kurulu A/B ("Bugün ne pişirsek?" vs "Aklındaki malzemeyle
yeni bir şey") launch öncesi trafikte anlamlı data üretmeden Kerem'in
cookie'sinde B'ye yapışıp kaldı, eski klasik A hero'yu hiç göremedi.
Mekaniği `src/lib/experiments/hero-tagline.ts` + `HeroVariantInit`
korundu ama `pickVariant` her zaman A döner. Launch sonrası trafik
yakalandığında (1000+ DAU) tekrar aktifleştirilebilir:

- [ ] Launch sonrası A/B yeniden aç (pickVariant'ın random kısmını
      restore et, cookie sticky)
- [ ] Plausible/PostHog entegrasyonu (conversion attribution)
- [ ] 2 hafta sonra Sentry `hero.variant: A|B` filter + variant
      kazanan kararı, kaybedeni sil

### Vercel Fluid CPU 7-day teyit

- [ ] TTL artışı sonrası Dashboard Fluid Active CPU %50+ azalma gözlemi
- [ ] Oturum 12-13 TTL agresif artış + B1-B13 Mod E apply sonrası ek
      cache invalidation frequency etkisi

---

## 📋 Planlı (site açılışı öncesi, oturum 16-22)

### Teknik + kalite

- [ ] **AI v5 LLM katmanı** (launch sonrası, Pro tier):
      - Tarif uyarlama asistanı ("bu tarifi vegan yap" / "gluten-free
        yap" / "3 kişilik yap" → Claude Haiku ile re-write)
      - Serbest metin sorgu ("akşama karides ve havucumla ne yapsam?")
      - Fotoğraftan malzeme tanıma (Vision API)
- [ ] **Cache Components (PPR) full refactor** (oturum 12'de denendi,
      `cacheComponents: true` Tarifle'de 30+ `force-dynamic` export ile
      çakıştı, paradigm shift 8-12 saat). Site açılış sonrası dedicated
      sprint'te. Beklenen kazanç: Fluid Active CPU %40-50 azalma + perf
      score 73 → 90+.
- [ ] **Brief kelime sayı min 4'e gevşet** (oturum 18 Retrofit-05 dersi,
      "Karabiberle servis edin" 3 kelime anlamlı ama kural 5+ reject;
      yapay uzatma faydasız). §15.7 kuralı güncelleme 5 dk iş.

### İçerik

- [ ] **Mod A Batch 37a+**: launch hedef 3500+ (şu an 3452, 48 kısa).
      Brief §5 A+ standardı aktif.
- [ ] **Fotoğraf dalgası**: top 100 tarife Cloudinary'den görsel yükle
      (placeholder emoji değil, gerçek foto)

### Blog kategorisi genişletme

Oturum 16'da 26 → 30 yazı eklendi, 12/9/9 ideal denge. Sonraki adaylar:

- [ ] **Blog 39+**: Un Çeşitleri (malzeme), Baharatlı Yemek Seviyeleri (rehber),
      Soğuk vs Sıcak Başlangıç (rehber), Ev Yapımı Ekmek Tipleri (malzeme),
      Damaklı Yemek Dengesi (rehber)
- [ ] Hedef: **35-40 blog yazısı** açılış öncesi (mevcut 38, launch minimum
      aşıldı) + opsiyonel 0-2 bonus
- [ ] **İç link ağı**: mevcut 30 yazının birbirine çapraz-referansları
      (Blog 19 kalıp boyutu → Blog 14 kek dönüşümü bağlantısı gibi)

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

## ✅ Oturum 18'de tamamlananlar (referans, detay PROJECT_STATUS.md)

**AI paketi 9 özellik A-I + voice pref (rule-based, sıfır LLM)**:
- A: Pişirdim → Pantry decrement (miktar döngüsü)
- B: Sesli tarif okuma TTS (Web Speech API TR-TR, kadın/erkek toggle)
- C: SKT süresi dolan öneri widget (zero-waste UX)
- D: Home dinamik "Şu saatte ne yesek" (TR timezone)
- E: "Beğenmedim, farklı dene" feedback (excludeSlugs)
- F: AI v3 miktar rozeti + shopping diff (v4 tutarlılık)
- G: Favori tarif → AI öneri boost (explicit + bookmark)
- H: Home 🎒 CTA + autoPantry flow (2 tık → 1 tık)
- I: Benzer tarifler filter chip (hızlı/az malzeme/az kalori)

**Mod F altyapı + 6 retrofit apply**: 600/2660 tarif (B+→A-→A+→A→A-→A+)
**Mod A seed**: 35a/35b/36a/36b (+200 tarif, 3252 → 3452)
**Mod B Backfill**: 11/12/13 apply (+250 çeviri, ~%93 tam)
**Backfill-14/15 CSV üretildi** (Codex'e bekliyor)
**Pantry miktar farkındalığı**: match util + rozet + SKT opt-in +
alışveriş→pantry senkron + Pişirdim→decrement (tüm döngü)
**Brief A+ standardı**: §5 Mod A + §15 Mod F, 5 self-check gate
**CI fix dalgası**: pantry test vi.hoisted + content:validate staple
severity + "biraz" muğlak fix + em-dash kod yorumu temizliği

## ✅ Oturum 16'da tamamlananlar (referans, detay PROJECT_STATUS.md)

- AI Asistan v4 TAM SHIP (core + UI + test + v4.1 cuisine + v4.2
  regenerate + macro + shopping + person count scaling + plan
  favorites + pantry history + autocomplete + preset chips) ✅
- Admin Tarif Düzenle: drag-drop reorder + çift onay modal silme +
  canlı preview pane ✅
- Mod A Batch 31a/31b + 32a apply (150 yeni tarif, 2872 → 3021) ✅
- Mod B Backfill-03/04/05/06/07/08 apply (485 çeviri) → **Mod B %100
  kapanış**, 3021/3021 tam çevirili ✅
- Blog 27-30 (4 yeni yazı, 12/9/9 ideal kategori denge) ✅
- Allergen 2 tur spot-fix + audit rule genişletme → prod RESULT PASS ✅
- PWA install events Sentry → Vercel Analytics taşındı (info-level
  spam durdu) ✅
- Tarif basit/lüks varyant paneli /tarif/[slug] ✅
- Codex Brief 2 önemli netleştirme (Backfill scope + renumber +
  translation script yasağı) ✅

**Kalan:** Batch 32b stub reject (gerçek içerikle re-teslim),
30 Nis Neon cleanup, Blog 31+, Codex 33a/33b+, v4.3 polish fikirleri.

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
- Mod E B21 apply (100 tarif + 487 step). Audit en iyi seviye:
  TR 4084 (yeni rekor), `?` = 0, template dup 0, "ya da" 4, "malze-
  mesini" 0, timer 97/100 tarif (yeni rekor). B20 derslerinden sonra
  Codex direkt temiz teslim etti. Mod E B1-B21 = 2100 tarif (~%76
  catalog).
- Mod E B22 apply (100 tarif + 486 step). Audit: TR 3872, `?` = 0,
  template dup 0, "ya da" 7, "malzemesini" 0, timer **99/100** (yeni
  rekor, neredeyse tüm tarifler timer'lı). Mod E B1-B22 = 2200 tarif
  (~%80 catalog, beşte dördü).
- Mod E B23 üç tur rework (v3.1 onay): v1 REJECT (tüm dosya ASCII-only,
  TR chars 0, B12 v1 tekrarı). v2 REJECT (TR 0 → 3022 yükseldi ama
  54 ASCII kalıntı, en düşük TR oran %2.4). v3 REJECT (TR 3956 iyi
  ama 3 kelime hâlâ corrupt: pisirdikten/yumusayan/yumusakligi).
  v3.1: Claude tarafında spot fix 3 kelime (1 dk iş), Codex v4 atmak
  yerine direkt düzelt + apply. Mod E B1-B23 = 2300 tarif (~%84).
- Mod E B24 apply (100 tarif + 501 step + 1 tarif 5 ingredient revize).
  Audit direkt temiz teslim: TR 4075, template dup 0, "ya da" 8,
  "malzemesini" 0, timer 99/100 tarif. Codex paralel session B23
  rework'ünden ayrı üretti. Mod E B1-B24 = 2400 tarif (~%87 catalog).
- Mod E B25 apply (100 tarif + 489 step + 1 tarif 7 ingredient revize
  muhammara-gaziantep). Audit: TR 3375, `?` = 0, template dup 0,
  ASCII corrupt 0, "malzemesini" 0, timer 91/100. "ya da" 16,
  hepsi legitimate alternatif (ızgara/tava, fırın/köz, soğuk/ılık,
  üçgen/bohça, rulo/zarf), smuggling yok. Mod E B1-B25 = 2500 tarif
  (~%91 catalog, on dokuzda on sekizi).
- Mod E B26 apply (100 tarif + 499 step). Audit: TR 3768, `?` = 0,
  ASCII corrupt 0, template dup 0, "malzemesini" 0, timer 87/100.
  "ya da" 25, hepsi legitimate alternatif (tava/ızgara, sac/tava,
  fırın/taş zemin, ılık/soğuk, rulo/üçgen, kaşık/asma yaprak); tarif
  adı değişken template smuggling yok, exact-match 0. Mod E B1-B26
  = 2600 tarif (~%94 catalog).
- Mod E B27 apply (100 tarif + 494 step). Audit: TR 3375, `?` = 0,
  ASCII corrupt 0, template dup 0, "malzemesini" 0, timer 81/100
  (son batch'lerde timer oranı azalma trend: B24=99, B25=91, B26=87,
  B27=81; kritik değil). "ya da" 15 (Codex kendi raporladığı sayıya
  eşit, disiplin oturdu). Mod E B1-B27 = 2700 tarif (~%98 catalog).
- Mod E B28 apply (100 tarif + 498 step). Audit: TR 3389, `?` = 0,
  ASCII corrupt 0, template dup 0, "malzemesini" 0, timer **95/100**
  (toparlandı, B27=81'den yükseldi). "ya da" 11 (düşüş trend devam).
  Mod E B1-B28 = 2800 tarif.
- Mod E B29 apply (100 tarif + 330 step, kısa tarifler: icecek /
  kokteyl / aperatif "few-steps" flag'li, type minimum eşiğine
  oturtuldu). Audit: TR 2500, `?` 0, ASCII corrupt 0, template
  dup 0, **"ya da" 0 (yeni rekor, ilk kez sıfır)**, "malzemesini" 0,
  timer 69/100 (kısa tariflerde timer az, normal). **Mod E B1-B29
  toplam 2900 tarif apply, Mod E pipeline kapandı.** B30 CSV (38
  marjinal tarif) Mod A numara çakışmasını önlemek için silindi.

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
