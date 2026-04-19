# Tarifle — Rekabet Analizi

> **Versiyon:** 1.0 · **Tarih:** 19 Nisan 2026 · **Yazar:** Kerem + Claude
> (ortak analiz) · **Kullanım:** Feature önceliklendirme + stratejik
> konumlanma için iç doküman. Dış paylaşıma kapalı.

## 📋 İçindekiler

1. [Yönetici özeti](#1-yönetici-özeti)
2. [Pazar haritası](#2-pazar-haritası)
3. [Rakip profilleri — Türkiye](#3-rakip-profilleri--türkiye)
   - [3.1 Nefisyemektarifleri](#31-nefisyemektarifleri)
   - [3.2 Yemek.com](#32-yemekcom)
   - [3.3 Lezzet.com.tr](#33-lezzetcomtr)
   - [3.4 Sofra (Hürriyet)](#34-sofra-hürriyet)
   - [3.5 Mutfak.com](#35-mutfakcom)
4. [Uluslararası referanslar](#4-uluslararası-referanslar)
   - [4.1 Allrecipes (US)](#41-allrecipes-us)
   - [4.2 NYT Cooking (US)](#42-nyt-cooking-us)
5. [Feature karşılaştırma matrisi](#5-feature-karşılaştırma-matrisi)
6. [Pozisyonlama açıkları](#6-pozisyonlama-açıkları)
7. [Tarifle differentiator'ları](#7-tarifle-differentiatorları)
8. [Feature önceliklendirme — 3 dalga](#8-feature-önceliklendirme--3-dalga)
9. [Risk + fırsat matrisi](#9-risk--fırsat-matrisi)
10. [Sonraki adımlar + ölçüm](#10-sonraki-adımlar--ölçüm)

---

## 1. Yönetici özeti

Türkiye tarif platformu pazarı **iki büyük oyuncu (Nefisyemektarifleri
+ Yemek.com) arasında bölünmüş**; ikisi de topluluk yoğun (kullanıcı
tarifleri) ama içerik kalitesi, UX modernliği ve kişiselleştirme
açısından zayıf. Premium konumlanma eksik; herkes reklam gelirine bel
bağlıyor.

**Tarifle için 5 kritik bulgu:**

1. **Editör kürasyonlu + kural tabanlı kalite Türkiye'de neredeyse yok.**
   Nefis/Yemek.com "kullanıcı yüklesin, algoritma ödüllendirsin" modeli
   çalışıyor; bu kalite ortalamasını düşürüyor. Tarifle editör seçimi +
   audit-deep kalite kontrolü ile yapısal olarak ayrışıyor.
2. **Alerjen sistemi + diyet filtreleri derli toplu hiçbir rakipte
   yok.** Gluten-free, sütsüz, vegan araması Türkiye'de zor. 10 alerjen
   + 5 diyet filter Tarifle'nin somut bir müşteri edinme koridoru.
3. **Privacy-first konumlanma pazar boş.** Tüm rakipler Google Analytics
   + reklam ağı çerezi + tracking ağır. Tarifle'nin "reklam yok, analytics
   yok" duruşu niş ama yüksek-güven bir kesim için ayırt edici.
4. **Mobile-first AI destekli öneriler (evdeki malzemelerle) rakiplerde
   yok.** Tarifle'nin AI Asistanı (rule-based + diet/süre/zorluk matrisi)
   rakiplerle karşılaştırınca ileride.
5. **Haftalık menü planlayıcı + alışveriş listesi entegrasyonu TR
   pazarda first-mover.** Yurt dışı (NYT, Paprika App) yaygın ama
   Türkçe dilli ve Türk mutfağı odaklı alternatif yok.

**3 aksiyon önerisi (detay §8'de):**

- **Kısa (0-2 hafta):** İçerik pazarlama agresifleş (blog + Pinterest +
  video snippet'ler), AI Asistan'ın "paylaşılabilir sonuç" özelliği
  (trafik loop).
- **Orta (1-2 ay):** Yemek planlayıcı export (PDF/ICS), topluluk
  özellikleri (takip/feed — dikkatli), newsletter.
- **Uzun (3-6 ay):** Mobil uygulama (React Native), video altyapısı
  (Remotion), premium katman (reklamsız + sınırsız menü plan).

---

## 2. Pazar haritası

```
┌──────────────────────────────────────────────────────────────────┐
│                      TARİF + YEMEK PLATFORMLARI                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  Topluluk-yoğun ◄──────────────► Editorial/Kurumsal                │
│                                                                   │
│  Nefisyemektarifleri     │     Lezzet.com.tr                      │
│  Yemek.com (hibrit)      │     Sofra.com.tr                       │
│                          │     NYT Cooking (aspirational)         │
│                                                                   │
│  Kullanıcı UGC ağırlık       Editör kürasyon ağırlık              │
│                                                                   │
│                          ▲                                        │
│                          │                                        │
│                     TARİFLE                                       │
│         (kural tabanlı kalite + editör seçimi + topluluk)         │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Segmentler:**

| Segment | Kim için | Örnek |
|---|---|---|
| **Topluluk UGC** | Hız, çeşitlilik | Nefisyemektarifleri, Allrecipes |
| **Editorial** | Güvenilirlik, kalite | NYT Cooking, Lezzet dergi |
| **Hibrit** | Ölçek + moderasyon | Yemek.com, Tarifle |
| **Niş (diyet/sağlık)** | Spesifik kullanıcı | Fitnessaga, sağlıklı-tarif.net |

Tarifle **hibrit + moderasyon + diyet kümesinin kesişiminde** kendine
yer açıyor — rakiplerden birinin baskın olmadığı boşluk.

---

## 3. Rakip profilleri — Türkiye

### 3.1 Nefisyemektarifleri

**Web:** nefisyemektarifleri.com · **Kuruluş:** ~2010 · **Trafik:**
Türkiye'nin en büyük tarif sitesi (ayda ~20-40M ziyaret tahminen).

**Model:** User-generated content (UGC) ağırlıklı. Her kullanıcı kendi
profil sayfasıyla tarif yükler, yıldız ve yorum alır, popülerlik
kazanınca "yemek aşçısı" ünvanı kazanır. Moderasyon zayıf; aynı
tarifin 50 farklı versiyonu sıradan.

**Güçlü yanlar:**
- Tarif sayısı: 200.000+ (iddia). Her niş kapsanmış.
- Topluluk: çok aktif yorumcu kitlesi, fotoğraf paylaşımı yoğun.
- SEO hakimiyeti: 10+ yıllık domain otorite, long-tail her aramada top 3.
- Mobile app: günlük milyonlarca aktif kullanıcı (Play Store 4.6 / 500K+).
- Gelir: yüksek reklam + sponsorluk (yemek malzemesi markalarıyla).

**Zayıf yanlar:**
- **Kalite ortalaması düşük.** Aynı mantı tarifi 15 farklı kullanıcıdan
  gelince kalite spektrumu geniş, kullanıcı hangisine güveneceğini
  bilemiyor.
- **UX modası geçmiş.** Reklam yoğunluğu rahatsızlık veriyor, mobile
  web deneyimi pop-up dolu.
- **Alerjen/diyet filtresi minimum** — arama içinde "glutensiz" arama
  kelimesi olarak var, yapısal filtre yok.
- **Kişiselleştirme yok** — herkes aynı homepage, aynı öneri motoru.
- Editör kürasyonu yok; algoritma popülerliğe bağlı, topluluk tuzakları
  (mucize diyet tarifleri, mitleşmiş yöntemler) ön plana çıkabiliyor.
- Mutfak terimleri tutarsız (her kullanıcı kendi ağzıyla yazar).

**Monetizasyon:** Reklam ağları (Google AdSense, yerli) + sponsorlu
içerik + mobil app içi reklam. Premium yok.

**Tarifle'nin karşılık verebileceği:** kalite garantisi (editör seçimi
rozeti) + alerjen filtresi + reklamsız deneyim.

---

### 3.2 Yemek.com

**Web:** yemek.com · **Kuruluş:** 2012 · **Trafik:** ~10-15M/ay
(tahminen).

**Model:** Kurumsal tarif + lifestyle dergisi hibriti. İçerik ekibi
profesyonel yazılı tarif üretir + video çeker; ayrıca kullanıcı
tarifleri var ama daha sıkı moderasyon. "Yemek haberi" ve "mutfak
kültürü" makaleleri belirgin.

**Güçlü yanlar:**
- **Video ağırlıklı.** Her yeni tarif için kısa pişirme videosu
  YouTube + Instagram Reels tarafında yayılır.
- **Editorial kalite:** gıda mühendisi + şef + yazar ekibi tarifi
  denetliyor. Tutarlı yazım, ölçü doğruluğu.
- Sosyal medya güçlü (Instagram 3M+, YouTube 2M+).
- Mobile app + web birlikte çalışıyor.
- Pinterest, Google Discover entegre (içerik görsel-odaklı).

**Zayıf yanlar:**
- **Kullanıcı-generated içerik eklemek zor** — topluluk katkısı düşük,
  daha çok "hazır tarif okuyucu" modeli.
- **Alerjen filtresi yok** — diyet tag'i sınırlı.
- **Kişiselleştirme yok** — homepage herkese aynı.
- Reklam yoğunluğu (videolardan önce + banner) UX bozuyor.
- Kategori hiyerarşisi zayıf; Türk mutfağı bölgeleri derli toplu değil.
- Mobile web yavaş, LCP kötü (tahminen 4s+).

**Monetizasyon:** Reklam + marka işbirlikleri (sponsorlu tarif) +
YouTube AdSense. Premium yok.

**Tarifle'nin karşılık verebileceği:** modern hızlı site (CWV yeşil),
yapısal alerjen/diyet filtreleri, topluluk + editorial hibridi.

---

### 3.3 Lezzet.com.tr

**Web:** lezzet.com.tr · **Kuruluş:** Lezzet dergisi (1995) dijital
uzantısı.

**Model:** Saf editorial — dergi kökenli. Şef + gıda yazarı tarifleri
uzun formatlı, fotoğraflı, magazin tarzı. Kullanıcı tarifi yok (veya
çok kısıtlı).

**Güçlü yanlar:**
- Prestij marka, otoriteyi taşıyor.
- Derin Türk mutfağı / bölgesel içerik.
- Gastronomi yazıları + şef portreleri — blog niteliği yüksek.
- Çok profesyonel fotoğraf.

**Zayıf yanlar:**
- **Tarif sayısı düşük** (birkaç bin), günlük kullanım için yetersiz.
- **Topluluk sıfır** — yorum/yıldız yok.
- **Mobile deneyim zayıf**, pop-up + newsletter overlay agresif.
- **Trafik sınırlı** — Nefis'in ~5-10'da biri.
- Arama/filtreleme ilkel.

**Monetizasyon:** Dergi abonelik + dijital reklam + marka işbirliği.

**Tarifle'nin karşılık verebileceği:** editorial kalite seviyesinde
bireysel "editör seçimi" + modern UX + topluluk katmanı.

---

### 3.4 Sofra (Hürriyet)

**Web:** sofra.com.tr · **Kuruluş:** Hürriyet grubu dijital şube.

**Model:** Medya şirketi tarafından run edilen tarif sitesi. Editorial
ama Hürriyet'in haber/yaşam ekosisteminin parçası.

**Güçlü yanlar:**
- Hürriyet ekosistemi (trafik akıtma avantajı).
- Profesyonel editör ekibi.
- Yemek haberi + tarif hybrid.

**Zayıf yanlar:**
- **Marka konfüzyonu** — Sofra mu, Hürriyet mi, Doğan mı? Kullanıcı
  "tarif sitesi" olarak net pozisyon algılamıyor.
- Tarif sayısı Nefis'in çok altında.
- UX orta — reklam yoğun ama Yemek.com kadar parlak değil.
- Mobile app zayıf (Play Store 3.5 / 10K).
- Topluluk sıfır.

**Monetizasyon:** Hürriyet reklam ağı + sponsorlu içerik.

**Tarifle'nin karşılık verebileceği:** bağımsız + net konumlu + modern
platform.

---

### 3.5 Mutfak.com

**Web:** mutfak.com · **Kuruluş:** 2000'ler başı.

**Model:** Blog + tarif hibridi. Küçük-orta ölçek topluluk, blog
yazıları ön planda.

**Güçlü yanlar:**
- Niş kullanıcı kitlesi (gastronomi entusiyastı).
- Editorial içerik (restoran yorumları, şef söyleşileri).

**Zayıf yanlar:**
- **Modernleşememiş.** UI 2015 seviyesinde.
- Trafik çok sınırlı.
- Mobile deneyim zayıf.
- Öne çıkan herhangi bir feature yok.

**Monetizasyon:** Reklam + bazı bağlı pazarlama.

**Tarifle'nin karşılık verebileceği:** tüm feature setinde önde.

---

## 4. Uluslararası referanslar

### 4.1 Allrecipes (US)

**Web:** allrecipes.com · **Kuruluş:** 1997 · **Trafik:** ~80M/ay.

**Öne çıkanlar:**
- En büyük topluluk tabanlı tarif sitesi.
- "Save to recipe box" + shopping list + meal plan (premium).
- Mobil app + Smart TV app + Alexa skill.
- **Mealplan feature premium** ($36/yıl).
- Kullanıcı fotoğraf/video paylaşımı ana akış.

**Tarifle için alınacak ders:**
- Shopping list + meal plan **premium gate**lenebilir (biz MVP'de
  ücretsiz veriyoruz; analiz sonucu gate önerisi olabilir).
- Mobile-first mandatory.

### 4.2 NYT Cooking (US)

**Web:** cooking.nytimes.com · **Trafik:** ~30M/ay.

**Öne çıkanlar:**
- **Premium subscription $5/ay** (reklamsız + özel içerik + meal plan).
- Editorial kalite bench — her tarif food writer imzalı.
- Video: kısa pişirme video + detay yazı birleşik.
- "Recipe notes" — kullanıcı kendi notunu tarife ekliyor, profilinde
  saklanıyor.
- Strong newsletter.

**Tarifle için alınacak ders:**
- Premium gate + editorial kalite kombini **sürdürülebilir gelir modeli**.
- Newsletter başla (şu an /feed.xml ile RSS var ama e-posta yok).

---

## 5. Feature karşılaştırma matrisi

**Legend:** ✅ Tam özellik · ⚠️ Kısmi / zayıf · ❌ Yok · — İlgisiz

| Feature | Tarifle | Nefis | Yemek | Lezzet | Sofra | Mutfak | Allrecipes | NYT |
|---|---|---|---|---|---|---|---|---|
| **İçerik** |
| Tarif sayısı | 1.701 | 200K+ | ~30K | ~3K | ~5K | ~2K | 45K+ | 20K+ |
| Editör kürasyonu | ✅ | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ |
| Video entegre | ❌ | ⚠️ | ✅ | ⚠️ | ⚠️ | ❌ | ⚠️ | ✅ |
| Kullanıcı tarifi (UGC) | ✅ | ✅ | ⚠️ | ❌ | ❌ | ⚠️ | ✅ | ❌ |
| Çoklu dil (TR/EN/DE) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Bölgesel Türk mutfağı dağılımı | ✅ | ⚠️ | ⚠️ | ✅ | ⚠️ | ⚠️ | — | — |
| Blog / makale | ✅ | ❌ | ✅ | ✅ | ✅ | ✅ | ⚠️ | ✅ |
| **Arama + Filtre** |
| Full-text arama | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| Fuzzy arama (typo toleransı) | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ |
| Alerjen filtresi (10 kategori) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ |
| Diyet filtresi (vegan/glutensiz/sütsüz) | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Süre + zorluk filtresi | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| Mutfak/ülke filtresi | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| AI destekli "elimde ne var" | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Benzer tarifler önerisi | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ⚠️ |
| **Kişiselleştirme** |
| Favori/bookmark | ✅ | ✅ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| Koleksiyon/liste | ✅ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Tercih bazlı öneri (favorite tags) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Alerjen kaçınma (kullanıcı profili) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ |
| **Sosyal + Topluluk** |
| Yorum + yıldız | ✅ | ✅ | ✅ | ❌ | ⚠️ | ⚠️ | ✅ | ✅ |
| Uyarlama/varyasyon | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ |
| Kullanıcı rozet sistemi | ✅ | ⚠️ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ❌ |
| Takip/feed | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Fotoğraf paylaşımı (user-upload) | ❌ | ✅ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ❌ |
| **Planlama + Alışveriş** |
| Alışveriş listesi | ✅ | ❌ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Haftalık menü planlayıcı | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ (prem) | ✅ (prem) |
| Porsiyon ayarlama | ✅ | ⚠️ | ⚠️ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Print / PDF | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| **Teknik + UX** |
| Core Web Vitals (yeşil) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Mobile-first responsive | ✅ | ⚠️ | ✅ | ⚠️ | ⚠️ | ⚠️ | ✅ | ✅ |
| PWA | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ |
| Dark mode | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| A11y (WCAG 2.1 AA) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ✅ |
| Pişirme modu (ekran uyanık) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ⚠️ | ⚠️ |
| **Monetizasyon + Privacy** |
| Reklam yoğunluğu | ❌ yok | 🔴 yüksek | 🟠 orta | 🟠 orta | 🔴 yüksek | 🟡 düşük | 🔴 yüksek | ❌ yok (prem) |
| Tracking / analytics çerezi | ❌ yok | 🔴 var | 🔴 var | 🔴 var | 🔴 var | 🟠 var | 🔴 var | 🟠 var |
| Premium subscription | ❌ yok | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| Açık API / developer access | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Newsletter / RSS | ⚠️ (RSS) | ❌ | ✅ | ✅ | ✅ | ⚠️ | ✅ | ✅ |

**Tarifle'nin güçlü olduğu satırlar (her rakip ❌/⚠️ iken ✅):**
- Alerjen filtresi (10 kategori)
- AI destekli "elimde ne var"
- Uyarlama/varyasyon sistemi
- Tercih bazlı kişiselleştirme
- PWA + Dark mode + A11y + Pişirme modu
- Reklam yok + Tracking yok
- Çoklu dil (TR/EN/DE)

---

## 6. Pozisyonlama açıkları

**Açık 1 — "Güvenilir alerjen bilgisi + diyet uyumu"**
Türkiye'de gluten intoleransı / laktoz hassasiyeti olan milyonlarca
insan var ama hiçbir rakip sistematik alerjen filtrasyonu sunmuyor.
Arama kutusuna "glutensiz kek" yazmak gerekiyor — yapısal değil.
Tarifle'de "Glutensiz" diyet filter'ı + allergen exclude profile
kaydetme mevcut. **Bu pazar açığı Tarifle'nin en kuvvetli müşteri
edinme koridoru.**

**Açık 2 — "Reklam+tracking'siz güvenli ortam"**
Çocuklu aileler + privacy-conscious kitle rakiplerin reklam+popup
yoğunluğundan rahatsız. Tarifle'nin "zero tracking" duruşu niş ama
yüksek dönüşümlü bir pozisyon.

**Açık 3 — "Haftalık menü + alışveriş listesi entegrasyonu"**
TR pazarda first-mover. Özellikle çalışan ebeveynler için somut değer.

**Açık 4 — "Bölgesel Türk mutfağı derin katalogu"**
Kurumsal rakipler (Yemek.com, Lezzet) bölge kapsıyor ama dağılım
sistematik değil. Tarifle'de 7 bölge × her batch'te dengeli seed
prosedürü → derin ve kapsamlı.

**Açık 5 — "Modern web performansı"**
Core Web Vitals yeşil + A11y AA + PWA — hiçbir TR rakip yok. Hem SEO
avantajı (Google ranking signals) hem kullanıcı deneyimi.

**Açık 6 — "Editor's pick + community denge"**
NYT Cooking gibi editorial yok; Nefis gibi saf community yok. Tarifle
hibrit: kural-tabanlı moderasyon + editör seçimi + topluluk uyarlamaları.

---

## 7. Tarifle differentiator'ları

**Somut ve bugün mevcut:**

1. **Alerjen sistemi (10 kategori)** + **diyet filtresi (5 seçenek)** —
   arama bazında değil yapısal filter.
2. **AI Asistan "evdeki malzemelerle"** — rule-based ama pantry filter
   + diet + süre + mutfak matrisi. Rakiplerde yok.
3. **Haftalık menü planlayıcı** + alışveriş listesi tek-tık entegrasyon.
4. **Editör Seçimi rozeti** — admin kürasyonlu, rotasyonel haftalık.
5. **Uyarlama/varyasyon sistemi** — kullanıcı tarifi "fork"layıp kendi
   versiyonunu paylaşıyor, orijinal tarife bağlı kalıyor.
6. **3 dilli içerik** (TR + EN + DE) — 400 tarif ingredient/step
   çevirisi tam, geri kalan 1300 title+description.
7. **44 programatik landing sayfası** — SEO kaldıracı (mutfak × 24 +
   etiket × 15 + diyet × 5).
8. **Kural tabanlı pre-flight moderasyon** — yorum/uyarlama spam/
   küfür/URL filtrelenir, admin kuyruğunda review.
9. **Sıfır tracking + sıfır reklam** — Kullanım koşulları + gizlilik
   politikası manifest niteliğinde.
10. **44 bölgesel Türk tarif** (7 bölge eşit dağılım) — sistematik,
    her Codex batch'inde korunan kural.

**Kavramsal (marka katmanı):**

- "Modern ama klasik" — Türkçe tarif platformunda UI'yi 2026'ya taşıyan
  tek site.
- "Güvenli öğün" — alerjen + kaynak doğruluğu + editör onayı.
- "Şeffaf teknoloji" — legal sayfalar, güvenlik sayfası, bcrypt + Neon
  PITR açıkça anlatılıyor (rakipler gizliyor).

---

## 8. Feature önceliklendirme — 3 dalga

**🚀 Kısa vadeli (0-2 hafta) — quick win + trafik loop**

| İş | Kaynak | Etki | Neden şimdi |
|---|---|---|---|
| Newsletter entegrasyonu (Resend) | 1 gün | 🟢 Yüksek retention | Elimizde Resend zaten var (email verify). Haftalık "Editör seçimi" mail. |
| AI Asistan "paylaşılabilir sonuç" linki | 1 gün | 🟢 Yüksek viral | Kullanıcı AI sonucunu WhatsApp'a atabilsin. |
| Pinterest meta tags (rich pins) | 2 saat | 🟢 Trafik açısı | Nefis'in görsel paylaşımdan aldığı yüksek trafik bizim değil. |
| HowTo schema step anchor deep-link | ✅ yapıldı | 🟢 SEO | Bu oturumda yapıldı. |
| Blog — ilk 5-8 makale (iki ayda) | 1-2 gün/makale | 🟢 SEO long-tail | Altyapı hazır. İçerik doldurmak. |
| Admin analytics dashboard | 1 gün | 🟡 Operasyonel | View trend + search freq data-driven karar için. |

**🎯 Orta vadeli (1-2 ay) — stratejik yatırım**

| İş | Kaynak | Etki | Risk |
|---|---|---|---|
| Menü planlayıcı v2 (PDF/ICS export) | 3-5 gün | 🟢 Premium adayı | - |
| Fotoğraf yükleme (user-upload tarif/varyasyon) | 1 hafta | 🟢 Topluluk loop | Moderasyon yükü |
| Takip/feed — "aşçıları takip et" | 1-2 hafta | 🟡 Engagement | Spam + toxicity riski |
| Tarif görselleri (Eren teslimi) | dış | 🟢 UX sıçrama | Dış bağımlı |
| Video snippet altyapısı (Remotion) | 1-2 hafta | 🟢 Yemek.com rekabeti | Üretim maliyeti |
| Open Graph image her tarif için dinamik | 2 gün | 🟢 Sosyal paylaşım | - |
| Mobile app (PWA install promo banner) | 2-3 gün | 🟢 Retention | - |

**🏔 Uzun vadeli (3-6 ay) — büyük bahis**

| İş | Kaynak | Etki | Değerlendirme |
|---|---|---|---|
| Premium subscription (reklamsız + sınırsız menü plan) | 2-3 hafta | 🟢 Gelir modeli | Fiyat testi lazım — ₺29/ay, ₺299/yıl tahmin. |
| React Native mobil uygulama | 4-6 hafta | 🟢 Retention 3x | Plan doc'ta var, iOS + Android. |
| AI Asistan v3 (gerçek LLM tercih bazlı) | 2-3 hafta | 🟡 Diferansiyatör | Claude API maliyet + moderasyon. |
| Açık API (developer access) | 2 hafta | 🟡 B2B | Niş ama marka katmanı. |
| Video platform (Remotion otomatik) | 1-2 ay | 🟢 YouTube + TikTok | Plan doc §19-21. |
| Premium içerik (şef dizileri, ekran kaydı) | sürekli | 🟢 NYT benzeri | Üretim ciddi. |

---

## 9. Risk + fırsat matrisi

**Fırsatlar:**
- Türkiye'de **diyet + sağlık** konsensüsü büyüyor (celiac, lactose,
  vegan) — tarifle'nin alerjen sistemi müşteri edinme koridoru.
- **Google SGE / AI search** rich structured data'yı ödüllendiriyor —
  Recipe + HowTo schema Tarifle'de tam.
- **Privacy regülasyonu** (KVKK artan denetim) — Tarifle zero-tracking
  konumlanması uyum avantajı.
- **Yemek bloğu yazar kitlesi** (Instagram food creator) platform
  arıyor — Tarifle'nin uyarlama sistemi çekici olabilir.

**Riskler:**
- **Nefisyemektarifleri'nin SEO domain otoritesi** — 15 yıllık backlink
  bizim 1. sayfaya geçmemizi yavaşlatabilir. Counter: long-tail +
  programatik landing + içerik kalitesi.
- **Yemek.com video üretim kapasitesi** — biz Remotion kurana kadar
  onlar kitleye video alışkanlığı veriyor. Counter: video snippet
  otomatik üretim altyapısı acil.
- **User-generated content moderasyon riski** — ölçeklendikçe abuse
  artacak. Counter: rate limit + pre-flight filter + admin queue
  çalışıyor.
- **Gelir modeli eksik** — reklam yok + premium yok = sürdürülebilir
  değil. Counter: 6 ay içinde premium/bağış modeli gerekli.
- **Çoklu dil content debt** — 1.300 tarif henüz ingredient/step
  çevirisi beklemiyor. Counter: Codex Mod B pipeline devam ediyor
  (400 tamam, 1.300 kalan — 3-4 batch daha).

---

## 10. Sonraki adımlar + ölçüm

**Ay 1 (Mayıs 2026):**

- [ ] Newsletter entegrasyonu + ilk 3 gönderim (metrik: sign-up rate)
- [ ] Pinterest meta + ilk 20 tarifin paylaşılabilir görseli
- [ ] AI Asistan paylaşım linki + WhatsApp open graph preview
- [ ] Blog 2 yeni makale (mevcut 3 + 2 = 5)
- [ ] Admin analytics dashboard (view trend + search freq)

**Metrik hedefleri:**
- Aylık aktif kullanıcı: mevcut +25%
- Organik trafik: mevcut +20% (programatik landing + blog etkisi)
- Bounce rate: %55 → %48
- Newsletter abone: 0 → 500 (3 ayda)

**Ay 2-3:**

- [ ] Menü planlayıcı v2 (PDF/ICS export)
- [ ] Open Graph dinamik image + sosyal paylaşım butonu her yerde
- [ ] Fotoğraf yükleme (user-upload) — pilot 100 tarif ile
- [ ] Video snippet otomatik altyapı (Remotion) — ilk 20 tarif
- [ ] Codex Mod B batch 16 + 17 prod canlı (pipeline'da bekliyor)

**Ay 4-6:**

- [ ] Premium subscription MVP (reklamsız + sınırsız menü plan —
  ₺29/ay test)
- [ ] React Native mobil uygulama beta
- [ ] Takip/feed — topluluk katmanı v1
- [ ] Açık API (developer docs + auth)

**Kendi kendine ölçüm soruları (her 3 ayda bir):**

1. **Retention:** AI Asistan kullanan kullanıcı 7 gün sonra geri geliyor mu?
2. **Conversion:** Tarif detay sayfasında kaç kullanıcı menü planlayıcıya
   geçiyor?
3. **Moderasyon yükü:** Haftalık moderasyon queue hacmi (saat)
4. **Kaynak doğruluğu:** audit-deep CRITICAL sayısı 0'da kalıyor mu?
5. **İçerik yaşı:** En son blog post'u kaç gün önce? (ideal < 14 gün)
6. **Rakip delta:** Nefis + Yemek.com bir feature kopyalarsa ne kadar
   sürede match edebiliriz?

---

## Ek: Rakip incelemesi metodolojisi

Bu analiz **Nisan 2026'daki kamuya açık gözlemlere** dayanır:
- Web trafik: Similarweb + Alexa halefi SEMrush tahminleri (±%30 hata
  payı normal).
- Feature set: her siteye misafir + hesap açıp 30+ dk gezinti.
- Mobile app: Play Store + App Store yorumları, son 6 ay yıldız ortalaması.
- Monetizasyon: dış görünür reklam yoğunluğu + "premium" butonu
  aranması.

**Eksik olanlar:**
- Dahili conversion rate (kimse paylaşmaz).
- Gerçek aylık aktif kullanıcı (tahmini rakamlar).
- Content moderation süreçleri (opaque).

**Güncelleme:** Bu doc çeyreklik güncellenmeli. Rakipler özellik
çıkarır, Google algoritması değişir. Q3 2026'da 1.1'e güncelleme + 6
aylık ilerleme değerlendirmesi.

---

*Bu doküman Tarifle'nin iç strateji belgesidir. Dış paylaşım onaylı
değildir. Sürüm kontrolü git history üzerinden.*
