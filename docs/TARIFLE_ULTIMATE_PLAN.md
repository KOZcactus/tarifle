# Tarifle, Ultimate Proje Dokümanı

> Son güncelleme: **20 Nisan 2026** (oturum 8 sonu, topluluk loop tam, rekabet §8 kısa 6/6 + orta 5/5 ✅)
> Durum: MVP 0.1/0.2/0.3 + Faz 2 + Faz 3'ün büyük çoğunluğu **canlıda** (2320 tarif prod, 900/2020 Mod B tam çeviri, A11y AA tertemiz)
> Versiyon: 1.3
> İlişkili dokümanlar: `PROJECT_STATUS.md` (aktif takip + sıradaki işler, oturum 8 sonu detaylı dökümle), `CHANGELOG.md` (kategorik kronolojik özet), `CODEX_BATCH_BRIEF.md` (~800 satır, Codex Mod A/B talimatı + §9 geçmiş hatalar tablosu batch 23'e kadar güncel), `COMPETITIVE_ANALYSIS.md` (rekabet analizi v1.0, 3 dalga roadmap), `RECIPE_FORMAT.md` (tarif şartnamesi), `NEWSLETTER_CRON_SETUP.md` (3 scheduler seçeneği), `PROD_PROMOTE.md` (dev/prod Neon branch runbook), `CODEX_HANDOFF.md` (yeni PC akışı)

Bu doküman Tarifle projesinin tek kaynak belgesidir (Single Source of Truth). Yeni özellik eklerken, teknik karar değiştirirken veya yol haritasını güncellerken önce buraya bakılır ve buradan güncellenir.

> **Terminoloji (15 Nisan 2026):** UI'da "varyasyon" yerine **"uyarlama"** kullanılıyor, aşağıdaki metinde "varyasyon" geçen her yer UI'da "uyarlama" olarak okunur. Teknik isimler (Prisma `Variation` modeli, `variationId` field'ı, `/api/variations` endpoint'i) İngilizce haliyle kalır.

> **15 Nisan 2026 büyük revizyon notları**: Allergen + group + translations alanları schema'ya eklendi (Section 5, 10), renk paleti AA için koyulaştırıldı (Section 14.1), Faz 2 listesine 13 yeni tamamlanan kalem eklendi (Section 21), Önerilen Ek Özellikler tablosu güncellendi (Section 30), test sayıları 230 unit + 12 E2E (Section 24).
>
> **20 Nisan 2026 oturum 8 notları, Faz 3 büyük sıçrama**: 6 Codex batch Mod A ile 1701 → **2320 tarif**. Topluluk loop tam (Follow schema + `/akis` feed + fan-out notification + followers/following list + homepage "Önerilen Aşçılar" + collection public share + variation `/uyarlama/[id]` permalink + OG kartı). Paylaşım yüzeyi: Pinterest rich pin + AI Asistan paylaşım linki + PWA install banner + PDF export (`@react-pdf/renderer`) + llms.txt AI crawler brief. Admin ops: `/admin/analytics` (6 KPI + 4 Top 10 + search freq aktif) + bulk moderation (checkbox + sticky toolbar, 50 cap) + user-photos moderation sayfası. User photos: SiteSetting KV + RecipePhoto Cloudinary (feature flag default KAPALI; admin panelden toggle). Newsletter haftalık cron endpoint hazır (Kerem QStash schedule + env ile aktifleştirir). Search log canlı (SearchQuery model + `/admin/analytics` top 10). 18 formal migration (add_user_photos + add_follow + add_search_log oturum 8'de eklendi). Rekabet §8 kısa vadeli 6/6 + orta vadeli 5/5 ✅ (video snippet hariç). 557/557 test PASS, tsc/lint clean. Detaylı blok dökümü için `docs/PROJECT_STATUS.md` → "20 Nisan 2026 (oturum 8)".

---

## İçindekiler

1. [Proje Özeti](#1-proje-özeti)
2. [Marka Yönü](#2-marka-yönü)
3. [Hedef Kullanıcılar](#3-hedef-kullanıcılar)
4. [MVP Kapsamı](#4-mvp-kapsamı)
5. [Tarif İçerik Standardı](#5-tarif-i̇çerik-standardı)
6. [Kategoriler ve Etiketler](#6-kategoriler-ve-etiketler)
7. [Kullanıcı Akışları](#7-kullanıcı-akışları)
8. [UI ve Deneyim Prensipleri](#8-ui-ve-deneyim-prensipleri)
9. [Teknoloji Yığını](#9-teknoloji-yığını-tech-stack)
10. [Veritabanı Şeması](#10-veritabanı-şeması)
11. [API Endpoint'leri](#11-api-endpointleri)
12. [Sayfa Yapısı ve Sitemap](#12-sayfa-yapısı-ve-sitemap)
13. [Klasör Yapısı](#13-klasör-yapısı)
14. [Tasarım Sistemi](#14-tasarım-sistemi)
15. [Özellik Detayları](#15-özellik-detayları)
16. [Moderasyon ve İçerik Güvenliği](#16-moderasyon-ve-i̇çerik-güvenliği)
17. [KVKK ve Hukuki Notlar](#17-kvkk-ve-hukuki-notlar)
18. [Kalori Hesabı](#18-kalori-hesabı)
19. [AI Malzeme Önerisi](#19-ai-malzeme-önerisi-faz-2)
20. [Video Stratejisi](#20-video-stratejisi)
21. [Faz Planı](#21-faz-planı-yol-haritası)
22. [Git ve Çalışma Akışı](#22-git-ve-çalışma-akışı)
23. [Deploy Planı](#23-deploy-planı)
24. [Test ve Kalite Planı](#24-test-ve-kalite-planı)
25. [Ortam Değişkenleri](#25-ortam-değişkenleri-env)
26. [Performans Hedefleri](#26-performans-hedefleri)
27. [Güvenlik Kontrol Listesi](#27-güvenlik-kontrol-listesi)
28. [Script İsimleri](#28-script-i̇simleri-packagejson)
29. [Seed Data Planı](#29-seed-data-planı)
30. [Önerilen Ek Özellikler](#30-önerilen-ek-özellikler)
31. [Karar Bekleyen Sorular](#31-karar-bekleyen-sorular)
32. [Definition of Done](#32-definition-of-done)
33. [PROJECT_STATUS.md Formatı](#33-project_statusmd-formatı)
34. [İlk Uygulama Sırası](#34-i̇lk-uygulama-sırası)

---

## 1. Proje Özeti

**Tarifle**, yemek, içecek ve kokteyl tariflerini sade, hızlı okunur ve topluluk katkısına açık şekilde sunan modern bir tarif platformudur.

| Alan | Değer |
|------|-------|
| Proje Adı | Tarifle |
| Slogan | Make Eat |
| Varsayılan Tema | Dark Mode (kullanıcı isteğiyle Light Mode'a geçiş) |
| Dil | Türkçe (ileride çoklu dil eklenebilir) |
| Hedef Kitle | Evde yemek yapan, tarif arayan, toplulukla paylaşmak isteyen herkes |
| Giriş Yöntemi | E-posta + Şifre, Google OAuth |
| Alkollü İçerik | Evet, yaş uyarısı + sorumlu tüketim notu ile |

Ana fikir:

- Her bilindik yemeğin güvenilir bir genel tarifi olacak.
- Kullanıcılar aynı yemeğin altına kendi varyasyon tariflerini ekleyebilecek.
- Tarifler kısa, göz yormayan, anlaşılır ve pratik olacak.
- Tarif kartlarında süre, zorluk, kategori, ortalama kalori ve varyasyon sayısı görünecek.
- Üyelik olmadan tarif okunabilecek; tarif eklemek, beğenmek, kaydetmek ve yorumlamak için üyelik gerekecek.
- AI özellikleri maliyeti kontrollü olacak şekilde kademeli eklenecek.

---

## 2. Marka Yönü

Çalışma adı: **Tarifle**
Alt slogan: **Make Eat**

Önerilen marka yaklaşımı:

- Ana isim net şekilde "Tarifle" olacak.
- "Make Eat" ana logo yerine küçük alt slogan, rozet veya loading animasyonu metni olarak kullanılacak.
- Görsel kimlik sade, sıcak ama karışık olmayan bir mutfak hissi verecek.
- Logo fikri: konuşma balonu + kaşık/çatal + küçük check işareti. Hem tarif anlatma hem uygulanabilirlik hissi.
- Ton: samimi, kısa, temiz, abartısız. Kullanıcıya "bunu hemen yapabilirim" hissi vermeli.

---

## 3. Hedef Kullanıcılar

- Evde hızlıca yemek yapmak isteyen kişiler.
- Elindeki malzemeyle ne yapacağını arayan kullanıcılar.
- Kendi tarifini paylaşmak isteyen mutfak meraklıları.
- Kalori, süre ve zorluk bilgisiyle karar vermek isteyen kullanıcılar.
- İçecek, kahve, smoothie, mocktail ve kokteyl tarifleri arayan kullanıcılar.

---

## 4. MVP Kapsamı

MVP üç alt faza bölünür. Böylece ilk sürüm şişmez ve adım adım ilerlenir.

### MVP 0.1, Temel Site

- Next.js projesi kur (TypeScript + Tailwind + Prisma)
- Veritabanı şeması oluştur ve migrate et
- Dark/Light tema sistemi (next-themes)
- Navbar + Footer + Layout
- Ana sayfa tasarımı (hero, arama, kategoriler, öne çıkanlar)
- Kategori sayfaları
- Tekil tarif sayfası (malzeme, adımlar, besin değerleri)
- Arama (basit text arama) ve temel filtreleme (kategori, zorluk)
- Responsive tasarım (mobil uyumlu)
- SEO optimizasyonu (meta tags, Open Graph, Schema.org Recipe)
- Demo seed data: 10 yemek + 5 içecek tarifi (hızlı ayağa kalkma)
- Final seed data: 50 yemek + 20 içecek tarifi (deploy öncesi tamamlanır)
- Vercel'e deploy
- GitHub repo + branch stratejisi

> **Not:** MVP 0.1'de önce demo seed ile temel sayfalar ayağa kaldırılır, sonra seed tamamlanır ve gelişmiş filtreler (süre aralığı, kalori, etiket, çoklu kategori) eklenir.

### MVP 0.2, Kullanıcı Sistemi

- Kullanıcı kayıt/giriş (Auth.js v5, e-posta + Google)
- KVKK onay akışı
- Kullanıcı profil sayfası
- Varyasyon ekleme formu
- Beğeni sistemi
- Kaydetme (bookmark) sistemi
- Porsiyon ayarlama özelliği

### MVP 0.3, Moderasyon ve Kalite

- Argo filtreleme (keyword blacklist)
- Raporlama sistemi
- Moderasyon kuyruğu ve admin paneli (temel)
- Adım adım pişirme modu
- Yazdırma görünümü
- Alkollü içecek yaş uyarısı

### MVP Dışında Bırakılacaklar

- Otomatik AI video üretimi
- AI malzeme öneri sistemi
- Gelişmiş yemek planlayıcı
- Market sepeti entegrasyonu
- Tam otomatik kalori doğrulama sistemi
- Çoklu dil desteği
- PWA desteği
- Premium üyelik
- Mobil uygulama
- Bildirim sistemi
- Rozet sistemi
- Favori koleksiyonları

---

## 5. Tarif İçerik Standardı

### Ana Tariflerde Bulunacak Alanlar

| Alan | Açıklama | Örnek |
|------|----------|--------|
| Tarif adı | Net, bilinen isim | Karnıyarık |
| Kısa açıklama | 1-2 cümle tanıtım | Patlıcanla kıymalı klasik... |
| Kategori | Ana kategori | Et Yemekleri |
| Tür | yemek, tatlı, içecek, kokteyl, vb. | yemek |
| Emoji | Yemeği andıran 1-2 emoji | 🍆🥘 |
| Hazırlık süresi | Dakika | 15 dk |
| Pişirme süresi | Dakika | 30 dk |
| Toplam süre | Dakika | 45 dk |
| Zorluk | kolay, orta, zor | Orta |
| Ortalama kalori | Porsiyon başı, "yaklaşık" ibaresiyle | ~320 kcal |
| Porsiyon | Kaç kişilik | 4 |
| Protein/Karb/Yağ | Gram cinsinden | 18g / 22g / 15g |
| Malzemeler | Ölçülü liste | 300gr kıyma |
| Yapılış adımları | 4-8 kısa madde | 1. Patlıcanları yıkayın... |
| Püf noktası | İpucu | Kıymayı sürekli karıştırın |
| Servis önerisi | Yanında ne gider | Pilav ile servis edin |
| Varyasyon sayısı | Topluluk sayısı | 12 |
| Etiketler | Filtrelenebilir etiketler | Fırında, Misafirlik |
| **Alerjenler** | Allergen enum array (10 değer), kural-tabanlı inference'la doldurulur | `[GLUTEN, SUT]` |
| **Malzeme grupları** | Çok-bileşenli tariflerde `RecipeIngredient.group` | "Hamur için", "Şerbet için" |
| **Çeviriler** | Opsiyonel JSONB bucket, Faz 3 i18n için hazırlık | `{ en: { title, description, … } }` |

> **Not (Codex)**: yeni tarif eklerken `allergens` ve uygunsa `group` doldurulmalı. Detaylı kurallar `docs/RECIPE_FORMAT.md` "Dil ve anlatım kalitesi" bölümünde, muğlak ifadeler ("ya da tersi"), belirsiz ölçüler ("biraz"), composite isimler ("Şerbet şekeri") yasak. Codex batch sonrası `npx tsx scripts/retrofit-all.ts` allergen + diet etiketlerini otomatik doldurur.

### Kullanıcı Varyasyonlarında Bulunacak Alanlar

| Alan | Açıklama |
|------|----------|
| Mini başlık | Ör: "Anneannemin Karnıyarığı" |
| Kısa açıklama | Farkı anlatan 1-2 cümle |
| Malzemeler | JSON formatında liste |
| Yapılış adımları | JSON formatında liste |
| Ek notlar | Opsiyonel |
| Fotoğraf | Opsiyonel |
| Beğeni sayısı | Otomatik |
| Raporlama durumu | Otomatik |

### Tarif Yazım Kuralları

- Uzun paragraflar kullanılmayacak.
- Adımlar 4-8 kısa madde arasında tutulacak.
- Ölçüler mümkün olduğunca standart olacak: gram, ml, yemek kaşığı, tatlı kaşığı, su bardağı.
- Aşırı iddialı sağlık söylemleri kullanılmayacak.
- Tarifler kullanıcıyı yormayacak kadar kısa, uygulayabilecek kadar net olacak.
- Seed tarifler özgün yazılacak. Başka sitelerden tarif metni kopyalanmayacak.
- Ana tariflerde kaynak/ilham notu bulunabilir. Telifli tarif metinleri ve izinsiz görseller kopyalanmayacak.

---

## 6. Kategoriler ve Etiketler

### Kategori Seti

| Kategori | Emoji | Slug |
|----------|-------|------|
| Ana Yemekler | 🍲 | ana-yemekler |
| Et Yemekleri | 🥩 | et-yemekleri |
| Tavuk Yemekleri | 🐔 | tavuk-yemekleri |
| Balık ve Deniz Ürünleri | 🐟 | balik-deniz-urunleri |
| Sebze Yemekleri | 🥬 | sebze-yemekleri |
| Bakliyat | 🫘 | bakliyat |
| Çorbalar | 🍜 | corbalar |
| Pilav ve Makarna | 🍚 | pilav-makarna |
| Hamur İşleri | 🥟 | hamur-isleri |
| Kahvaltılıklar | ☕ | kahvaltiliklar |
| Mezeler | 🫒 | mezeler |
| Salatalar | 🥗 | salatalar |
| Tatlılar | 🍰 | tatlilar |
| Kurabiyeler | 🍪 | kurabiyeler |
| İçecekler | 🥤 | icecekler |
| Kahve ve Çay | ☕ | kahve-cay |
| Smoothie | 🥝 | smoothie |
| Mocktail | 🍹 | mocktail |
| Kokteyl | 🍸 | kokteyl |
| Soslar | 🥫 | soslar |
| Atıştırmalıklar | 🍿 | atistirmaliklar |

### Etiket Sistemi

Kategorilerden bağımsız, tarif başına çoklu seçilebilir etiketler:

| Etiket | Slug |
|--------|------|
| Pratik | pratik |
| Ekonomik | ekonomik |
| Fırında | firinda |
| Tencerede | tencerede |
| Airfryer | airfryer |
| Çocuklara Uygun | cocuklara-uygun |
| Misafirlik | misafirlik |
| Düşük Kalorili | dusuk-kalorili |
| Yüksek Protein | yuksek-protein |
| Vegan | vegan |
| Vejetaryen | vejetaryen |
| Glutensiz | glutensiz |
| Süt Ürünsüz | sut-urunsuz |
| Alkollü | alkollu |
| Alkolsüz | alkolsuz |

---

## 7. Kullanıcı Akışları

### Ziyaretçi Akışı

1. Siteye girer.
2. Arama yapar veya kategori seçer.
3. Tarif detayını okur.
4. Kullanıcı varyasyonlarını görür.
5. Tarif eklemek, beğenmek veya kaydetmek isterse giriş yapmaya yönlendirilir.

### Üye Kullanıcı Akışı

1. Giriş yapar.
2. Tarif beğenir veya kaydeder.
3. Bir ana tarifin altına kendi varyasyonunu ekler.
4. Profilinde tariflerini ve beğeni sayılarını görür.
5. İsterse tarifini düzenler.

### Admin/Moderatör Akışı

1. Raporlanan içerikleri inceler.
2. Yasaklı kelimeye takılan tarifleri kontrol eder.
3. Spam kullanıcıları sınırlar veya engeller.
4. Ana tarifleri ekler ve günceller.
5. Kategori, etiket ve içerik standardını korur.

---

## 8. UI ve Deneyim Prensipleri

### Genel Prensipler

- Arayüz sade olacak. Göz yormayan, hava alan layout.
- Ana deneyim arama ve tarif keşfi olacak.
- Kullanıcı aradığı tarifi 1-2 tıklamada bulabilmeli.
- Tarif kartları kalabalık görünmeyecek.
- Dark mode varsayılan olacak. Light mode geçişi görünür ama rahatsız etmeyen bir yerde olacak.
- Mobil deneyim birinci sınıf olacak. Dokunmatik hedefler min 44px.
- Tarif detayında gereksiz uzun metin kullanılmayacak.
- Varyasyonlar ayrı kartlar gibi okunabilir olacak.
- Beğeni, süre, zorluk, kalori gibi bilgiler küçük ama net görünecek.
- Erişilebilirlik: WCAG 2.1 AA, yeterli kontrast, klavye ile gezinme, doğru başlık hiyerarşisi.
- Micro-interactions: beğeni animasyonu (kalp dolma), kart hover efektleri, sayfa geçişleri.

### Ana Sayfa Wireframe

```
+------------------------------------------------------------------+
|  Tarifle                        [Ara...]     [D/L]   [Giris Yap] |
+------------------------------------------------------------------+
|                                                                    |
|   +============================================================+  |
|   |  Hero Bolumu                                                |  |
|   |  "Bugun ne pisirsek?"                                       |  |
|   |  [Arama cubugu, buyuk, odakli]                             |  |
|   |  Populer aramalar: #karniyarik #baklava #mojito             |  |
|   +============================================================+  |
|                                                                    |
|   One Cikan Tarifler (yatay kaydirma kartlari)                    |
|   +--------+ +--------+ +--------+ +--------+                    |
|   | Emoji  | | Emoji  | | Emoji  | | Emoji  |                    |
|   | Isim   | | Isim   | | Isim   | | Isim   |                    |
|   | Sure   | | Sure   | | Sure   | | Sure   |                    |
|   | Zorluk | | Zorluk | | Zorluk | | Zorluk |                    |
|   | Var.#  | | Var.#  | | Var.#  | | Var.#  |                    |
|   +--------+ +--------+ +--------+ +--------+                    |
|                                                                    |
|   Kategoriler (grid)                                               |
|   +---------+ +---------+ +---------+ +---------+                |
|   | Emoji   | | Emoji   | | Emoji   | | Emoji   |                |
|   | Kat.Adi | | Kat.Adi | | Kat.Adi | | Kat.Adi |                |
|   +---------+ +---------+ +---------+ +---------+                |
|                                                                    |
|   En Begenilen Varyasyonlar (bu hafta)                            |
|   AI Asistan Banner, "Elindeki malzemeleri yaz, tarif al!"       |
|   Mevsimsel Oneriler                                               |
|                                                                    |
+------------------------------------------------------------------+
|  Footer: Hakkimizda | KVKK | Kullanim Sartlari | Iletisim        |
+------------------------------------------------------------------+
```

### Tarif Detay Sayfası Wireframe

```
+------------------------------------------------------------------+
|  <- Geri    Tarifle                                               |
+------------------------------------------------------------------+
|                                                                    |
|  [Emoji] Karniyarik                                               |
|  -------------------------------------------------------          |
|  Ana Yemek > Et Yemekleri                                         |
|  Sure: 45dk | Zorluk: Orta | Kalori: ~320 kcal | 4 kisilik       |
|  12 varyasyon | 2.4k goruntulenme                                  |
|                                                                    |
|  +-----------------------------------------------------+         |
|  |      [Yemek Gorseli (MVP) / Video Player (Faz 2+)]   |         |
|  +-----------------------------------------------------+         |
|                                                                    |
|  [Kaydet]   [Paylas]   [Yazdir]                                   |
|                                                                    |
|  +---------------------+  +---------------------------+           |
|  | Malzemeler          |  | Yapilisi                  |           |
|  |                     |  |                           |           |
|  | [ ] 4 adet patlican |  | 1. Patlicanlari yikayin   |           |
|  | [ ] 300gr kiyma     |  |    ve alacali soyun.      |           |
|  | [ ] 2 adet sogan    |  |                           |           |
|  | [ ] 2 adet domates  |  | 2. Ortadan yarin ve      |           |
|  | [ ] 1 yk biber salca|  |    tuzlu suda bekletin.   |           |
|  |                     |  |                           |           |
|  | Kisi Sayisi:        |  | 3. Kiymayi soganla       |           |
|  | [-] 4 [+]           |  |    kavurun.               |           |
|  | (malzemeler otomatik|  |    Ipucu: Kiymayi         |           |
|  |  guncellenir)       |  |    surekli karistirin.    |           |
|  +---------------------+  +---------------------------+           |
|                                                                    |
|  +----------------------------------------------------------+    |
|  | Besin Degerleri (porsiyon basi)                            |    |
|  | Kalori: 320 kcal | Protein: 18g | Karb: 22g | Yag: 15g   |    |
|  +----------------------------------------------------------+    |
|                                                                    |
|  -------------------------------------------------------          |
|  Topluluk Varyasyonlari (12)                                      |
|  [En Begenilen v]  [En Yeni]  [En Eski]                          |
|                                                                    |
|  +----------------------------------------------------------+    |
|  | Kullanici · "Anneannemin Karniyarigi"                      |    |
|  | "Kiyma yerine mercimek kullaniyorum..."                    |    |
|  | 47 begeni  | 3 gun once                                   |    |
|  | [Tarifi Gor]  [Begen]  [Raporla]                           |    |
|  +----------------------------------------------------------+    |
|                                                                    |
|  [Kendi Varyasyonunu Ekle] (giris yapmis kullanicilar)            |
|                                                                    |
|  Benzer Tarifler                                                   |
|  +--------+ +--------+ +--------+                                 |
|  | Imam   | | Musakka| | Patl.  |                                 |
|  | Bayildi| |        | | Kebabi |                                 |
|  +--------+ +--------+ +--------+                                 |
+------------------------------------------------------------------+
```

### Tarif Kartı Bilgileri

Her tarif kartında görünecek bilgiler:

| Bilgi | Örnek | Açıklama |
|-------|--------|----------|
| Emoji | 🍆🥘 | Yemeği temsil eden 1-2 emoji |
| İsim | Karnıyarık | Tarif adı |
| Süre | 45 dk | Toplam süre |
| Zorluk | Orta | Kolay / Orta / Zor |
| Kalori | ~320 kcal | Porsiyon başı ortalama kalori |
| Tür Etiketi | Ana Yemek | Kategori türü |
| Varyasyon | 12 | Topluluk varyasyon sayısı |
| Görsel | Thumbnail | Yemek görseli |

---

## 9. Teknoloji Yığını (Tech Stack)

### 9.1 Frontend

| Teknoloji | Neden |
|-----------|-------|
| **Next.js 15+ (App Router)** | SSR/SSG, SEO, API routes, tek projede full-stack |
| **TypeScript** | Tip güvenliği, hata önleme |
| **Tailwind CSS** | Hızlı stillendirme, dark/light tema, responsive |
| **Framer Motion** | Sayfa geçişleri ve mikro animasyonlar |
| **next-themes** | Dark/Light mod yönetimi |
| **React Hook Form + Zod** | Form yönetimi ve validasyon |

### 9.2 Backend

| Teknoloji | Neden |
|-----------|-------|
| **Next.js Route Handlers** | Ayrı sunucu gerekmez, full-stack tek projede |
| **Prisma ORM** | Tip güvenli veritabanı sorguları, kolay migration |
| **Auth.js v5 (NextAuth)** | Google, e-posta ile giriş; oturum yönetimi |

### 9.3 Veritabanı

| Teknoloji | Neden |
|-----------|-------|
| **PostgreSQL** (Neon) | Serverless, ücretsiz tier, Vercel ile doğal entegrasyon |
| **Upstash Redis** (opsiyonel) | Önbellekleme, rate limiting |

### 9.4 Dosya/Medya Depolama

| Teknoloji | Neden |
|-----------|-------|
| **Cloudinary** | Görsel optimizasyon, otomatik resize, CDN, ücretsiz tier |
| Alternatif: **UploadThing** | Daha fazla kontrol gerekirse |

### 9.5 AI Araçları

| Özellik | Yaklaşım | Not |
|---------|----------|-----|
| Malzeme → Tarif Önerisi | AI provider soyutlaması ile (başlangıçta Claude Haiku) | Faz 2. Tek modele kilitlenmeyecek, `AiProvider` interface kullanılacak |
| Tarif Videosu | 3 fazlı strateji (aşağıda detay) | Faz 3 |
| İçerik Moderasyonu | Keyword filtre + opsiyonel AI | MVP'de sadece keyword |
| Kalori Hesaplama | Yerel besin değerleri tablosu | Dış API bağımlılığı yok |

### 9.6 Deployment & DevOps

| Teknoloji | Neden |
|-----------|-------|
| **Vercel** | Next.js ile doğal, otomatik deploy, preview URL'ler |
| **GitHub** | Versiyon kontrolü, branch stratejisi, CI/CD |
| **GitHub Actions** | Otomatik test, lint, deploy pipeline |

---

## 10. Veritabanı Şeması

Aşağıdaki şema Prisma modeline temel olacak alanları tanımlar. Uygulama sırasında relation field'lar (ör: `category Category @relation(...)`), index'ler ve cascade davranışları Prisma syntax'ına göre tamamlanacaktır.

### 10.1 users

```
id              String    @id @default(cuid())
name            String?   @db.VarChar(100)
username        String    @unique @db.VarChar(50)
email           String    @unique @db.VarChar(255)
emailVerified   DateTime?                      // Auth.js tarafindan yonetilir, e-posta dogrulama tarihi
passwordHash    String?   @db.VarChar(255)     // nullable, sosyal giris icin
avatarUrl       String?   @db.Text
bio             String?   @db.VarChar(300)
role            Role      @default(USER)       // enum: USER, MODERATOR, ADMIN
isVerified      Boolean   @default(false)      // admin onayı ile "guvenilir kullanici" rozeti (emailVerified'dan farkli)
kvkkAccepted    Boolean   @default(false)
kvkkVersion     String?   @db.VarChar(20)      // "1.0", "1.1" gibi
kvkkDate        DateTime?
termsVersion    String?   @db.VarChar(20)
marketingConsent Boolean  @default(false)
deletedAt       DateTime?                      // soft delete
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```

### 10.2 categories

```
id              String    @id @default(cuid())
name            String    @db.VarChar(100)     // "Et Yemekleri"
slug            String    @unique @db.VarChar(100)
emoji           String?   @db.VarChar(10)
description     String?   @db.Text
parentId        String?                        // self-referencing, alt kategori
sortOrder       Int       @default(0)
imageUrl        String?   @db.Text
createdAt       DateTime  @default(now())
```

### 10.3 tags

```
id              String    @id @default(cuid())
name            String    @unique @db.VarChar(50)  // "Pratik"
slug            String    @unique @db.VarChar(50)
createdAt       DateTime  @default(now())
```

### 10.4 recipes

```
id              String    @id @default(cuid())
title           String    @db.VarChar(200)     // "Karniyarik"
slug            String    @unique @db.VarChar(200)
description     String    @db.Text             // kisa tanitim
emoji           String?   @db.VarChar(20)
categoryId      String                         // FK -> categories
type            RecipeType                     // enum
difficulty      Difficulty                     // enum: EASY, MEDIUM, HARD
prepMinutes     Int                            // hazirlama suresi
cookMinutes     Int                            // pisirme suresi
totalMinutes    Int                            // toplam sure
servingCount    Int                            // kac kisilik
averageCalories Int?                           // porsiyon basi ortalama
protein         Decimal?  @db.Decimal(5,1)     // gram
carbs           Decimal?  @db.Decimal(5,1)     // gram
fat             Decimal?  @db.Decimal(5,1)     // gram
imageUrl        String?   @db.Text
videoUrl        String?   @db.Text             // AI uretimi veya sablon video
isFeatured      Boolean   @default(false)
status          RecipeStatus @default(PUBLISHED) // enum
viewCount       Int       @default(0)
tipNote         String?   @db.Text             // puf noktasi
servingSuggestion String? @db.Text             // servis onerisi
authorId        String?                        // FK -> users (null = sistem tarifi)
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```

### 10.5 recipe_ingredients

```
id              String    @id @default(cuid())
recipeId        String                         // FK -> recipes, ON DELETE CASCADE
name            String    @db.VarChar(200)     // "patlican"
amount          String    @db.VarChar(50)      // "3 adet" veya "1 su bardagi"
unit            String?   @db.VarChar(50)      // "adet", "gr", "ml"
sortOrder       Int       @default(0)
isOptional      Boolean   @default(false)
caloriePerUnit  Decimal?  @db.Decimal(7,2)     // detayli hesap icin
```

### 10.6 recipe_steps

```
id              String    @id @default(cuid())
recipeId        String                         // FK -> recipes, ON DELETE CASCADE
stepNumber      Int
instruction     String    @db.Text             // kisa, net, anlasilir
tip             String?   @db.Text             // "Ipucu: ..."
imageUrl        String?   @db.Text             // adim gorseli
timerSeconds    Int?                            // adim suresi
```

### 10.7 recipe_tags

```
id              String    @id @default(cuid())
recipeId        String                         // FK -> recipes
tagId           String                         // FK -> tags
@@unique([recipeId, tagId])
```

### 10.8 variations

```
id              String    @id @default(cuid())
recipeId        String                         // FK -> recipes
authorId        String                         // FK -> users
miniTitle       String    @db.VarChar(200)     // "Anneannemin Karniyarigi"
description     String?   @db.Text
ingredients     Json                           // [{name, amount, unit}]
steps           Json                           // [{stepNumber, instruction}]
// NOT: MVP'de varyasyon malzemeleri JSON tutulur.
// Varyasyonlar üzerinde gelişmiş kalori hesaplama, malzeme arama
// veya porsiyon ayarı gerektiğinde `variation_ingredients` ve
// `variation_steps` ayrı tablolara taşınabilir.
notes           String?   @db.Text             // ek notlar
imageUrl        String?   @db.Text
likeCount       Int       @default(0)
reportCount     Int       @default(0)
status          ContentStatus @default(PUBLISHED) // enum
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```

### 10.9 likes

> **Kapsam:** MVP'de beğeni sistemi sadece kullanıcı varyasyonları içindir. Ana tarifler sistem tarifi olduğu için beğenilmez. İleride ana tarifler de beğenilecekse `recipe_likes` ayrı tablo olarak eklenir; tek tabloda `targetType + targetId` yaklaşımı yerine ayrı tablolar tercih edilir (tip güvenliği ve sorgu kolaylığı için).

```
id              String    @id @default(cuid())
userId          String                         // FK -> users
variationId     String                         // FK -> variations
createdAt       DateTime  @default(now())
@@unique([userId, variationId])
```

### 10.10 bookmarks

```
id              String    @id @default(cuid())
userId          String                         // FK -> users
recipeId        String                         // FK -> recipes
createdAt       DateTime  @default(now())
@@unique([userId, recipeId])
```

### 10.11 comments

> **Kapsam:** Yorum sistemi MVP'de yoktur, Faz 2'de eklenecektir. Aşağıdaki şema ilerideki yapıyı gösterir. Yorumlar ana tarife bağlıdır. Varyasyonlara da yorum eklenecekse `variationId` opsiyonel FK olarak eklenir.

```
id              String    @id @default(cuid())
recipeId        String                         // FK -> recipes
variationId     String?                        // FK -> variations (opsiyonel, Faz 2)
authorId        String                         // FK -> users
content         String    @db.Text
status          ContentStatus @default(PUBLISHED)
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```

### 10.12 reports

```
id              String    @id @default(cuid())
reporterId      String                         // FK -> users
targetType      ReportTarget                   // enum: VARIATION, COMMENT
// MVP'de sadece VARIATION report aktif olacak. COMMENT report Faz 2'de eklenecek.
targetId        String                         // variation_id veya comment_id
reason          ReportReason                   // enum: SPAM, PROFANITY, MISLEADING, HARMFUL, OTHER
description     String?   @db.Text
status          ReportStatus @default(PENDING) // enum: PENDING, REVIEWED, DISMISSED
reviewedBy      String?                        // FK -> users
reviewedAt      DateTime?
createdAt       DateTime  @default(now())
```

### 10.13 moderation_actions

> **Tasarım notu:** `targetType + targetId` polymorphic yapıdır, DB seviyesinde gerçek FK koruması olmaz. Bu bilinçli bir tercih: moderasyon log'u birden fazla hedef türünü (variation, comment, user) tek tabloda tutabilmek için. MVP'de sadece variation ve user hedefleri aktif olacak. İleride `targetType` ve `action` alanları enum'a dönüştürülebilir.

```
id              String    @id @default(cuid())
moderatorId     String                         // FK -> users
targetType      String    @db.VarChar(50)      // "variation", "comment", "user"
targetId        String
action          String    @db.VarChar(20)      // APPROVE, HIDE, REJECT, WARN, BAN
reason          String?   @db.Text
createdAt       DateTime  @default(now())
```

### 10.14 audit_log

```
id              String    @id @default(cuid())
userId          String?                        // FK -> users (null = sistem)
action          String    @db.VarChar(100)     // "recipe.create", "user.ban", vb.
targetType      String?   @db.VarChar(50)
targetId        String?
metadata        Json?                          // ek detaylar
ipAddress       String?   @db.VarChar(45)
createdAt       DateTime  @default(now())
```

### 10.15 media_assets

```
id              String    @id @default(cuid())
uploaderId      String?                        // FK -> users
type            MediaType                      // enum: IMAGE, VIDEO
url             String    @db.Text
publicId        String?   @db.VarChar(255)     // Cloudinary public ID
width           Int?
height          Int?
sizeBytes       Int?
mimeType        String?   @db.VarChar(50)
createdAt       DateTime  @default(now())
```

### 10.16 video_jobs

```
id              String    @id @default(cuid())
recipeId        String                         // FK -> recipes
provider        String    @db.VarChar(50)      // "remotion", "kling", "runway"
status          VideoJobStatus                 // enum: QUEUED, PROCESSING, COMPLETED, FAILED
prompt          String?   @db.Text
inputImageUrl   String?   @db.Text
outputUrl       String?   @db.Text
errorMessage    String?   @db.Text
costEstimate    Decimal?  @db.Decimal(8,4)
durationSeconds Int?
createdAt       DateTime  @default(now())
updatedAt       DateTime  @updatedAt
```

### 10.17 nutrition_data

```
id              String    @id @default(cuid())
name            String    @unique @db.VarChar(200)  // "patlican"
caloriesPer100g Decimal   @db.Decimal(7,2)
proteinPer100g  Decimal   @db.Decimal(5,2)
carbsPer100g    Decimal   @db.Decimal(5,2)
fatPer100g      Decimal   @db.Decimal(5,2)
defaultUnit     String?   @db.VarChar(50)           // "adet", "gr"
gramsPerUnit    Decimal?  @db.Decimal(7,2)           // 1 adet = kac gram
source          String?   @db.VarChar(100)           // "TurkKomp", "USDA"
```

### Enum Değerleri

```prisma
enum Role {
  USER
  MODERATOR
  ADMIN
}

enum RecipeType {
  YEMEK
  TATLI
  ICECEK
  KOKTEYL
  APERATIF
  SALATA
  CORBA
  KAHVALTI
  ATISTIRMALIK
  SOS
}

enum Difficulty {
  EASY    // kolay
  MEDIUM  // orta
  HARD    // zor
}

enum RecipeStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  HIDDEN
  REJECTED
}

enum ContentStatus {
  DRAFT
  PENDING_REVIEW
  PUBLISHED
  HIDDEN
  REJECTED
}

enum ReportTarget {
  VARIATION
  COMMENT
}

enum ReportReason {
  SPAM
  PROFANITY
  MISLEADING
  HARMFUL
  OTHER
}

enum ReportStatus {
  PENDING
  REVIEWED
  DISMISSED
}

enum VideoJobStatus {
  QUEUED
  PROCESSING
  COMPLETED
  FAILED
}

enum MediaType {
  IMAGE
  VIDEO
}

// 15 Nis 2026, sonradan eklenenler:

enum BadgeKey {
  EMAIL_VERIFIED
  FIRST_VARIATION
  POPULAR_VARIATION
  RECIPE_COLLECTOR
}

enum NotificationType {
  VARIATION_LIKED
  VARIATION_APPROVED
  VARIATION_HIDDEN
  REPORT_RESOLVED
  BADGE_AWARDED
  SYSTEM
}

enum Allergen {
  GLUTEN
  SUT
  YUMURTA
  KUSUYEMIS
  YER_FISTIGI
  SOYA
  DENIZ_URUNLERI
  SUSAM
  KEREVIZ
  HARDAL
}
```

### 15 Nis 2026'da eklenen modeller

```prisma
// Rozet sistemi
model UserBadge {
  id        String   @id @default(cuid())
  userId    String
  key       BadgeKey
  awardedAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, key])
  @@index([userId])
}

// In-app bildirim
model Notification {
  id        String           @id @default(cuid())
  userId    String
  type      NotificationType
  title     String           @db.VarChar(200)
  body      String?          @db.Text
  link      String?          @db.VarChar(500)
  isRead    Boolean          @default(false)
  createdAt DateTime         @default(now())
  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, isRead, createdAt])
  @@index([userId, createdAt])
}

// Şifremi unuttum (1h TTL)
model PasswordResetToken {
  identifier String
  token      String   @unique
  expires    DateTime
  createdAt  DateTime @default(now())
  @@unique([identifier, token])
  @@index([identifier])
}

// Recipe'a eklenenler:
//   moderationFlags String? @db.VarChar(200)   (Variation üstünde, preflight CSV)
//   allergens       Allergen[] @default([])     (Recipe, GIN index ile)
//   translations    Json?                       (Recipe, Faz 3 i18n bucket)
//   group           String?  @db.VarChar(80)   (RecipeIngredient, "Hamur için" vb.)
//   @@index([allergens], type: Gin)             (Recipe, array filter performance)
```

### İlişki Özeti

```
users 1---N variations
users 1---N likes
users 1---N bookmarks
users 1---N comments
users 1---N reports
users 1---N moderation_actions
users 1---N audit_log

categories 1---N recipes
categories 1---N categories (self, parent_id)

recipes 1---N recipe_ingredients
recipes 1---N recipe_steps
recipes 1---N recipe_tags
recipes 1---N variations
recipes 1---N bookmarks
recipes 1---N comments
recipes 1---N video_jobs

tags 1---N recipe_tags

variations 1---N likes
variations 1---N reports
```

---

## 11. API Endpoint'leri

### 11.1 Tarifler

| Method | Endpoint | Açıklama | Auth | Request/Response |
|--------|----------|----------|------|------------------|
| GET | `/api/recipes` | Tüm tarifler (sayfalama + filtre) | Yok | `?page=1&limit=20&category=et-yemekleri&difficulty=EASY&type=YEMEK&tag=pratik&sort=newest&minTime=0&maxTime=60` |
| GET | `/api/recipes/[slug]` | Tekil tarif detayı | Yok | Tarif + malzemeler + adımlar + besin + etiketler |
| GET | `/api/recipes/search?q=...` | Tarif arama (debounced) | Yok | `?q=patlican&limit=10` |
| GET | `/api/recipes/featured` | Öne çıkan tarifler | Yok | `isFeatured=true` olanlar |
| GET | `/api/recipes/category/[slug]` | Kategoriye göre | Yok | Sayfalama + filtre |
| POST | `/api/recipes` | Yeni tarif ekle | Admin | Body: tarif + malzemeler + adımlar |
| PUT | `/api/recipes/[id]` | Tarif güncelle | Admin | Body: güncellenecek alanlar |

### 11.2 Varyasyonlar

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| GET | `/api/variations?recipeId=...&sort=likes` | Tarife ait varyasyonlar | Yok |
| POST | `/api/variations` | Yeni varyasyon ekle | User |
| PUT | `/api/variations/[id]` | Varyasyon düzenle | Sahip |
| DELETE | `/api/variations/[id]` | Varyasyon sil | Sahip/Admin |

### 11.3 Beğeni & Kaydetme

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/likes` | Beğen/Beğeniyi kaldır (toggle) | User |
| GET | `/api/likes/check?variationId=...` | Beğenildi mi kontrol | User |
| POST | `/api/bookmarks` | Kaydet/Kaldır (toggle) | User |
| GET | `/api/bookmarks` | Kaydedilen tarifler | User |

### 11.4 Kullanıcı & Auth

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/auth/[...nextauth]` | Giriş/Kayıt (Auth.js) | Yok |
| GET | `/api/users/[username]` | Profil bilgileri | Yok |
| PUT | `/api/users/me` | Profil güncelle | User |
| DELETE | `/api/users/me` | Hesabı sil (soft delete) | User |

### 11.5 Raporlama & Moderasyon

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/reports` | İçerik raporla | User |
| GET | `/api/admin/reports` | Rapor listesi | Mod/Admin |
| PUT | `/api/admin/reports/[id]` | Rapor incele/kapat | Mod/Admin |
| PUT | `/api/admin/variations/[id]/status` | Varyasyon durumunu değiştir | Mod/Admin |
| PUT | `/api/admin/users/[id]/role` | Kullanıcı rolü değiştir | Admin |
| PUT | `/api/admin/users/[id]/ban` | Kullanıcı engelle | Admin |

### 11.6 AI & Diğer

| Method | Endpoint | Açıklama | Auth |
|--------|----------|----------|------|
| POST | `/api/ai/suggest` | Malzeme → Tarif önerisi (Faz 2) | User |
| GET | `/api/categories` | Kategori listesi | Yok |
| GET | `/api/tags` | Etiket listesi | Yok |

### API Response Formatı

Tüm API yanıtları tutarlı envelope formatında:

```typescript
// Basarili
{
  success: true,
  data: T,
  meta?: { total: number, page: number, limit: number }
}

// Hata
{
  success: false,
  error: { message: string, code: string }
}
```

---

## 12. Sayfa Yapısı ve Sitemap

```
/                           -> Ana Sayfa
/tarifler                   -> Tum Tarifler (filtreleme + arama)
/tarifler/[kategori]        -> Kategori Sayfasi (or: /tarifler/et-yemekleri)
/tarif/[slug]               -> Tekil Tarif Sayfasi
/kesfet                     -> One Cikanlar, Trend, Mevsimsel
/ai-asistan                 -> Malzeme -> Tarif Oneri Sayfasi (Faz 2)
/profil/[username]          -> Kullanici Profil Sayfasi
/profil/ayarlar             -> Profil Duzenleme
/giris                      -> Giris Yap
/kayit                      -> Uye Ol
/hakkimizda                 -> Hakkimizda
/kvkk                       -> KVKK Aydinlatma Metni
/kullanim-sartlari          -> Kullanim Sartlari
/gizlilik                   -> Gizlilik Politikasi
/admin                      -> Admin Paneli (gizli, sadece admin/moderator)
/admin/tarifler             -> Tarif yonetimi
/admin/kullanicilar         -> Kullanici yonetimi
/admin/raporlar             -> Rapor inceleme
```

---

## 13. Klasör Yapısı

```
tarifle/
├── docs/
│   ├── TARIFLE_ULTIMATE_PLAN.md        <- Bu dokuman
│   └── PROJECT_STATUS.md               <- Proje durum takibi
├── prisma/
│   ├── schema.prisma                   <- Veritabani semasi
│   ├── seed.ts                         <- Seed data script
│   └── migrations/
├── public/
│   ├── images/
│   │   ├── logo-dark.svg
│   │   ├── logo-light.svg
│   │   └── og-image.png               <- Sosyal medya paylasim gorseli
│   ├── icons/
│   │   └── favicon.ico
│   └── fonts/
├── scripts/
│   ├── seed-recipes.ts                 <- Toplu tarif ekleme
│   └── ai-video-dry-run.ts            <- Video AI test script
├── src/
│   ├── app/                            <- Next.js App Router
│   │   ├── layout.tsx                  <- Root layout (tema, font, metadata)
│   │   ├── page.tsx                    <- Ana sayfa
│   │   ├── globals.css                 <- Global stiller
│   │   │
│   │   ├── (auth)/                     <- Kimlik dogrulama route grubu
│   │   │   ├── giris/page.tsx
│   │   │   └── kayit/page.tsx
│   │   │
│   │   ├── tarifler/
│   │   │   ├── page.tsx               <- Tum tarifler (arama + filtre)
│   │   │   └── [kategori]/page.tsx    <- Kategori sayfasi
│   │   │
│   │   ├── tarif/
│   │   │   └── [slug]/page.tsx        <- Tekil tarif sayfasi
│   │   │
│   │   ├── kesfet/
│   │   │   └── page.tsx
│   │   │
│   │   ├── ai-asistan/                <- Faz 2
│   │   │   └── page.tsx
│   │   │
│   │   ├── profil/
│   │   │   ├── [username]/page.tsx
│   │   │   └── ayarlar/page.tsx
│   │   │
│   │   ├── admin/
│   │   │   ├── page.tsx               <- Dashboard
│   │   │   ├── tarifler/page.tsx
│   │   │   ├── kullanicilar/page.tsx
│   │   │   └── raporlar/page.tsx
│   │   │
│   │   ├── (legal)/
│   │   │   ├── hakkimizda/page.tsx
│   │   │   ├── kvkk/page.tsx
│   │   │   ├── kullanim-sartlari/page.tsx
│   │   │   └── gizlilik/page.tsx
│   │   │
│   │   └── api/                        <- API Route Handlers
│   │       ├── auth/[...nextauth]/route.ts
│   │       ├── recipes/route.ts
│   │       ├── recipes/[slug]/route.ts
│   │       ├── recipes/search/route.ts
│   │       ├── recipes/featured/route.ts
│   │       ├── recipes/category/[slug]/route.ts
│   │       ├── variations/route.ts
│   │       ├── variations/[id]/route.ts
│   │       ├── likes/route.ts
│   │       ├── likes/check/route.ts
│   │       ├── bookmarks/route.ts
│   │       ├── users/[username]/route.ts
│   │       ├── users/me/route.ts
│   │       ├── reports/route.ts
│   │       ├── categories/route.ts
│   │       ├── tags/route.ts
│   │       ├── ai/suggest/route.ts
│   │       └── admin/
│   │           ├── reports/route.ts
│   │           ├── reports/[id]/route.ts
│   │           ├── variations/[id]/status/route.ts
│   │           ├── users/[id]/role/route.ts
│   │           └── users/[id]/ban/route.ts
│   │
│   ├── components/
│   │   ├── ui/                         <- Temel UI bilesenleri
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Skeleton.tsx
│   │   │   ├── Toast.tsx
│   │   │   └── ThemeToggle.tsx
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MobileMenu.tsx
│   │   │
│   │   ├── recipe/
│   │   │   ├── RecipeCard.tsx
│   │   │   ├── RecipeDetail.tsx
│   │   │   ├── RecipeSteps.tsx
│   │   │   ├── IngredientList.tsx
│   │   │   ├── NutritionInfo.tsx
│   │   │   ├── CookingMode.tsx
│   │   │   ├── ServingAdjuster.tsx
│   │   │   └── RecipeVideo.tsx
│   │   │
│   │   ├── variation/
│   │   │   ├── VariationCard.tsx
│   │   │   ├── VariationForm.tsx
│   │   │   └── VariationList.tsx
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── SearchResults.tsx
│   │   │
│   │   ├── profile/
│   │   │   ├── ProfileHeader.tsx
│   │   │   ├── ProfileRecipes.tsx
│   │   │   └── ProfileSettings.tsx
│   │   │
│   │   └── ai/                        <- Faz 2
│   │       ├── IngredientInput.tsx
│   │       └── AISuggestions.tsx
│   │
│   ├── features/
│   │   ├── auth/
│   │   │   └── auth.config.ts
│   │   ├── recipes/
│   │   │   ├── queries.ts
│   │   │   └── actions.ts
│   │   ├── variations/
│   │   │   ├── queries.ts
│   │   │   └── actions.ts
│   │   ├── moderation/
│   │   │   ├── blacklist.ts
│   │   │   ├── filter.ts
│   │   │   └── actions.ts
│   │   └── ai/
│   │       ├── provider.ts            <- AiProvider interface
│   │       └── suggest.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── auth.ts
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validators.ts
│   │
│   ├── hooks/
│   │   ├── useRecipes.ts
│   │   ├── useSearch.ts
│   │   ├── useAuth.ts
│   │   ├── useBookmarks.ts
│   │   └── useLikes.ts
│   │
│   ├── types/
│   │   ├── recipe.ts
│   │   ├── user.ts
│   │   ├── variation.ts
│   │   └── api.ts
│   │
│   ├── data/
│   │   ├── categories.ts
│   │   ├── tags.ts
│   │   ├── nutrition.ts               <- ~500 malzeme besin degeri
│   │   └── blacklist.ts
│   │
│   └── styles/
│       └── fonts.ts
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── .env.example
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── package.json
└── README.md
```

---

## 14. Tasarım Sistemi

### 14.1 Renk Paleti

> **15 Nis 2026, WCAG 2.1 AA pass:** Plandaki orijinal renkler text/buton kontrastını geçiremedi (axe-core ile 164 critical/serious node tespit). Token'lar koyulaştırıldı. Brand "orange family" içinde kaldı, marka tanınır. Aşağıdaki değerler **canlıdaki gerçek hex'lerdir**, `src/app/globals.css` referans.

```
Light Mode:
  Arka plan:         #f8f6f2
  Kart arka plani:   #f0ece4
  Yukseltilmis:      #e8e3da
  Vurgu (primary):   #a03b0f  (eski #e85d2c, white kontrast 6.7:1)
  Primary hover:     #7f2d08
  Ikincil:           #785012  (eski #d4a843, amber → tütün, AA için koyulaştırıldı)
  Taze aksent:       #146a36  (eski #1fa85a)
  Bilgi aksent:      #184aaa  (eski #3b7ae8)
  Metin:             #1a1a1a
  Alt metin:         #5a5a5a  (eski #6b6b6b)
  Basari:            #2e7d32  (eski #4caf50)
  Hata:              #c62828  (eski #d32f2f)
  Uyari:             #824200  (eski #f57c00)
  Border:            #ddd8cf
  Border hover:      #c8c1b5

Dark Mode:
  Arka plan:         #0f0f0f
  Kart arka plani:   #1a1a1a
  Yukseltilmis:      #222222
  Vurgu (primary):   #ff7a3d  (eski #ff6b35, buton white kontrastı için)
  Primary hover:     #ff9055
  Ikincil:           #ffc857
  Taze aksent:       #2fbf71
  Bilgi aksent:      #4f8dfd
  Metin:             #f5f5f5
  Alt metin:         #a0a0a0
  Border:            #2a2a2a
```

> **A11y notu:** Badge variant'larında tint opacity `/15` → `/10` indirildi (chip text kontrastı için). Footer logo `text-lg` → `text-xl` (large text kategorisi, 3:1 threshold yeterli). Regression guard: `tests/e2e/a11y-audit.spec.ts`, light + dark scan her CI push'unda. Yeni sayfa eklenince `PAGES_TO_SCAN` array'ine ekle yeterli.

> **Brand notu:** Primary turuncu yemek sıcaklığını verir; AA için koyulaştırılmış ton "olgun terracotta" hissi taşıyor, hâlâ tanınır turuncu. Yeşil aksent "taze malzeme/sağlıklı", mavi aksent linkler/info, ikincil amber-tütün heading vurgusu (Püf Noktası, Servis Önerisi panel başlıkları).

### 14.2 Tipografi

```
Basliklar:    "Bricolage Grotesque" veya "Cabinet Grotesk" (modern, sicak)
Govde Metni:  "Satoshi" veya "General Sans" (okunabilir, temiz)
Mono:         "JetBrains Mono" (kod, teknik notlar)
Emoji:        Sistem emoji (native)
```

### 14.3 Tasarım İlkeleri

1. **Sadelik:** Göz yormayan, hava alan layout. Kartlar arası yeterli boşluk.
2. **Tutarlılık:** Her kart, her sayfa aynı dili konuşur.
3. **Erişilebilirlik:** WCAG 2.1 AA standartları, kontrast oranları, klavye navigasyonu.
4. **Mobil Öncelik:** Responsive tasarım, dokunmatik hedefler min 44px.
5. **Micro-interactions:** Beğeni animasyonu (kalp dolma), kart hover efektleri, sayfa geçişleri.
6. **Hiyerarşi:** Ölçek kontrastı ile net hiyerarşi. Uniform değil, kasıtlı spacing.
7. **Derinlik:** Örtüşme, gölge veya hareketle katmanlama.

---

## 15. Özellik Detayları

### 15.1 Arama ve Filtreleme

- **Anlık arama** (debounced, 300ms), tarif adı, malzeme adı, kategori
- **Filtreler:**
  - Kategori (çoklu seçim)
  - Tür (yemek, içecek, tatlı, kokteyl, vb.)
  - Zorluk (kolay, orta, zor)
  - Süre aralığı (0-15dk, 15-30dk, 30-60dk, 60dk+)
  - Kalori aralığı
  - Etiketler (çoklu seçim)
- **Sıralama:** En yeni, en popüler, en çok varyasyon, en az kalori
- **Popüler aramalar:** Trend olan tarifler otomatik önerilir
- **URL state:** Filtre ve sıralama URL parametrelerine yazılır (paylaşılabilir)

### 15.2 Kullanıcı Sistemi

**Kayıt & Giriş:**
- E-posta + şifre ile kayıt
- Google ile tek tıkla giriş (OAuth)
- KVKK onayı zorunlu (kayıt sırasında checkbox + aydınlatma metni linki)
- Kayıt olmadan tarifler okunabilir; varyasyon ekleme, beğenme, kaydetme için üyelik şart

> **Auth.js uygulama notu:** E-posta/şifre girişi için Auth.js `Credentials` provider kullanılacak. Bu provider session/JWT yönetimini verir ama kullanıcı oluşturma, şifre hashleme (bcrypt), rate limiting ve brute force korumasını **kendimiz** kodlamamız gerekir. Auth.js bunları otomatik sağlamaz.

**Kullanıcı Profili (`/profil/[username]`):**
- Avatar, isim, bio
- Paylaştığı varyasyonlar listesi
- Toplam beğeni sayısı
- Kaydettiği tarifler (sadece kendisi görür)
- Katılım tarihi

**Rol Sistemi:**

| Rol | Yetki |
|-----|-------|
| `guest` | Tarif oku, arama, filtreleme |
| `user` | + varyasyon ekle, beğen, kaydet, raporla |
| `moderator` | + varyasyon onayla/reddet, rapor incele, kullanıcı uyar |
| `admin` | + kategori/tarif yönetimi, kullanıcı ban, sistem ayarları |

### 15.3 Topluluk Varyasyonları

- Ana tarifin altında kullanıcıların kendi versiyonları
- Her varyasyonda: mini başlık, kısa açıklama, malzeme listesi, yapılış adımları
- Opsiyonel: görsel ekleme (Cloudinary'e yüklenir)
- Beğeni sistemi (bir kullanıcı bir varyasyonu sadece 1 kez beğenebilir)
- Sıralama: en çok beğeni, en yeni, en eski
- Moderasyon: Otomatik argo filtresi + kullanıcı raporlama + moderatör incelemesi
- Yeni kullanıcıların ilk tarifleri moderasyon kuyruğuna düşebilir

### 15.4 Porsiyon Ayarlama

- Kişi sayısını değiştir → tüm malzeme miktarları otomatik güncellenir
- Kalori bilgisi de porsiyon sayısına göre güncellenir
- Oran hesabı basit çarpma/bölme ile yapılır

### 15.5 Adım Adım Pişirme Modu

- Tam ekran, büyük yazı, her adım tek tek
- Mutfakta telefona bakarken ideal
- Adımda süre varsa otomatik zamanlayıcı başlatma butonu
- Ekran kapanmasını engelleme (Wake Lock API)

### 15.6 Yazdırma Görünümü

- Tarifi temiz, mürekkep dostu formatta yazdır
- Sadece malzeme listesi ve adımlar
- Logo + tarif adı header'da

---

## 16. Moderasyon ve İçerik Güvenliği

### İçerik Durumları (Status Flow)

```
DRAFT -> PENDING_REVIEW -> PUBLISHED
                        -> REJECTED

PUBLISHED -> HIDDEN (moderator tarafindan)
HIDDEN    -> PUBLISHED (moderator tarafindan)
```

### Argo / Trol Önleme Kuralları

1. **Keyword Blacklist:** Türkçe ve İngilizce argo kelime listesi (regex tabanlı)
2. **Rate Limiting:** Yeni kullanıcılar günde max 3 varyasyon ekleyebilir
3. **Raporlama:** Kullanıcılar varyasyonları raporlayabilir (spam, argo, yanıltıcı, zararlı, diğer)
4. **Otomatik Gizleme:** 3+ rapor alan varyasyon otomatik gizlenir, moderatör inceleyene kadar
5. **Honeypot alanı:** Formlarda görünmez alan, botları tespit için
6. **IP bazlı rate limit:** Aynı IP'den kısa sürede çok fazla istek engellenir
7. **Büyük harf spam kontrolü:** %70'den fazla büyük harf içeren içerik uyarı alır
8. **Tekrar eden harf kontrolü:** "harikaaaaaaa" gibi içerikler filtrelenir
9. **Link spam:** İçerikte dış link sayısı sınırlandırılır

### Yasaklanacak İçerik

- Ağır argo ve hakaret
- Nefret söylemi
- Cinsel taciz içerikleri
- Tehdit
- Spam link
- Tarifle ilgisiz trol içerik
- Zararlı veya tehlikeli yiyecek/karışım tavsiyeleri

### Moderatör Aksiyonları

Tüm moderatör/admin aksiyonları `audit_log` tablosuna yazılır:

- İçeriği onayla (APPROVE)
- İçeriği gizle (HIDE)
- İçeriği reddet (REJECT)
- Kullanıcıyı uyar (WARN)
- Kullanıcıyı engelle (BAN)

---

## 17. KVKK ve Hukuki Notlar

> Bu bölüm hukuki danışmanlık değildir, uygulama gereksinimi olarak düşünülmelidir.

### Gerekenler

- Gizlilik politikası
- Kullanım şartları
- KVKK aydınlatma metni
- Açık rıza gerektiren konularda ayrı onay
- Çerez bildirimi (banner)
- Kullanıcı verisini silme talebi desteği
- Kullanıcı profilini ve içeriklerini yönetme
- Şifreler asla düz metin saklanmayacak (bcrypt)
- Minimum veri toplama
- Moderasyon ve güvenlik kayıtlarının saklama süresi belirlenecek

### Kayıt Sırasında

- Kullanım şartlarını kabul (zorunlu)
- Gizlilik/KVKK metnini okudum onayı (zorunlu)
- `kvkk_version` ve `terms_version` kaydedilir
- Pazarlama e-postası ayrı ve opsiyonel onay (`marketing_consent`)

### Kokteyl İçerikleri İçin

- Alkollü içerikler açıkça etiketlenecek (`alkollu` tag)
- Sorumlu tüketim notu gösterilecek
- Yaş uyarısı modalı gösterilecek (18+ onay)

### Veri Silme

- Kullanıcı hesabını silebilir (`/profil/ayarlar` üzerinden)
- Soft delete uygulanır (`deletedAt` alanı)
- Kullanıcının varyasyonları anonim hale getirilir veya silinir
- 30 gün içinde geri alınabilir, sonra kalıcı silinir

---

## 18. Kalori Hesabı

### İlk Sürüm Yaklaşımı

- Dış API kullanmadan basit ve açıklamalı ortalama kalori hesabı
- Sık kullanılan malzemeler için yerel besin değerleri tablosu (`nutrition_data` ~500 malzeme)
- Veri kaynağı: Türk Gıda Kompozisyon Veritabanı (TürkKomp) + USDA FoodData Central
- Gram/ml karşılıkları için dönüşüm tablosu (`gramsPerUnit`)
- Tarif detayında "yaklaşık" ibaresi gösterilecek
- Görsel: basit progress bar

### İleride Geliştirilecekler

- Kullanıcı porsiyon değiştirdiğinde kalori otomatik güncellensin
- Malzeme eşleştirme daha akıllı hale gelsin (fuzzy match)
- Admin panelinden malzeme kalori verisi düzenlenebilsin
- Gerekirse harici besin API'si araştırılsın

---

## 19. AI Malzeme Önerisi (Faz 2)

> Bu özellik MVP'de şart değil. İkinci fazda eklenecek.

### Özellik

1. Kullanıcı elindeki malzemeleri girer.
2. Yemek türü seçer: ana yemek, tatlı, içecek, kahvaltı vb.
3. Süre seçer: 15 dk, 30 dk, 60 dk.
4. Zorluk seçer.
5. Sistem önce veritabanındaki tarifleri filtreler (klasik arama + kurallar).
6. AI sadece sonuçları özetlemek veya eksik malzemeleri açıklamak için çağrılır.
7. AI yoksa fallback olarak kural tabanlı öneri çalışır.

### Maliyet Kontrolü

- Kullanıcı başına günde 10 sorgu limiti
- Aynı malzeme kombinasyonları cache'lenir (Redis)
- AI provider soyutlaması: `AiProvider` interface üzerinden, model değiştirilebilir
- Başlangıçta Claude Haiku (düşük maliyet, hızlı yanıt)
- Aylık kullanım limiti takip edilecek

### AiProvider Interface

```typescript
interface AiProvider {
  suggest(input: {
    ingredients: string[];
    type?: RecipeType;
    maxMinutes?: number;
    difficulty?: Difficulty;
  }): Promise<AiSuggestion[]>;
}
```

---

## 20. Video Stratejisi

Video özelliği güzel ama pahalı ve operasyonel olarak riskli olabilir. Üç aşamalı plan:

### Faz 1, Şablon Video (MVP sonrası)

- AI video üretmeden, tarif fotoğrafı, malzeme listesi ve adımlardan kısa bir video hazırlanır
- **Remotion** veya **FFmpeg** tabanlı sistem kullanılır
- Her tarifte aynı görsel dil korunur
- Maliyet çok düşük
- İlk ürün için en mantıklı seçenek

### Faz 2, AI Destekli Kapak/Görsel

- Tarifin fotoğrafı yoksa AI ile kapak görseli üretilebilir
- Video hala şablon tabanlı kalır
- Görsel düzen bozulmadan daha zengin içerik elde edilir

### Faz 3, AI Video

- Sadece admin onaylı veya popüler tariflerde çalışır
- Her tarif için otomatik üretim yapılmaz
- Video üretimi kuyruk sistemiyle çalışır (`video_jobs` tablosu)
- Aynı tarif için üretilen video tekrar kullanılmak üzere saklanır
- Kullanıcı tarafında "video hazırlanıyor" durumu gösterilir

### Video AI Seçenekleri

| Platform | Avantaj | Maliyet |
|----------|---------|---------|
| **fal.ai** (Kling modelleri) | Tek API'de çoklu model, 5-10 sn image-to-video | Token/saniye bazlı |
| **Runway** (Gen-4.5) | Yüksek kalite, tutarlı stil | Kredi/saniye, pahalı |
| **Remotion** | Şablon tabanlı, tam kontrol, sıfır AI maliyeti | Self-hosted |

### Video Kararı

- MVP'de AI video yok.
- İlk önce şablon video sistemi tasarlanacak.
- AI video sadece deneysel admin aracı olarak eklenecek.
- API anahtarı gelmeden kodda provider soyutlaması hazırlanacak.

---

## 21. Faz Planı (Yol Haritası)

### Faz 1, MVP

#### MVP 0.1: Temel Site
- [ ] GitHub repo oluştur (`tarifle`, private)
- [ ] `feat/project-bootstrap` branch aç
- [ ] Next.js + TypeScript projesini başlat
- [ ] Tailwind, lint, format ve test altyapısını kur
- [ ] Prisma + PostgreSQL şemasını oluştur
- [ ] Dark/Light tema sistemi (next-themes)
- [ ] Navbar + Footer + Layout
- [ ] Ana sayfa tasarımı
- [ ] Kategori sayfaları
- [ ] Tekil tarif sayfası (malzeme, adımlar, besin)
- [ ] Arama ve filtreleme
- [ ] SEO (meta tags, Open Graph, Schema.org Recipe)
- [ ] Demo seed data (10 yemek + 5 içecek, hızlı ayağa kalkma)
- [ ] Responsive tasarım
- [ ] İlk deploy (Vercel)
- [ ] Final seed data (50 yemek + 20 içecek, deploy sonrası tamamlanır)
- [ ] Gelişmiş filtreler (süre, kalori, etiket, çoklu kategori)

#### MVP 0.2: Kullanıcı Sistemi
- [ ] Auth.js v5 (e-posta + Google)
- [ ] KVKK onay akışı
- [ ] Profil sayfası
- [ ] Varyasyon ekleme formu
- [ ] Beğeni sistemi
- [ ] Bookmark sistemi
- [ ] Porsiyon ayarlama

#### MVP 0.3: Moderasyon ve Kalite
- [ ] Keyword blacklist filtresi
- [ ] Raporlama sistemi
- [ ] Admin paneli (temel)
- [ ] Adım adım pişirme modu
- [ ] Yazdırma görünümü
- [ ] Alkollü içecek yaş uyarısı

### Faz 2, Topluluk & AI

- [x] AI Asistan (malzeme → tarif önerisi), kural-tabanlı, AI-gibi sunuluyor
- [x] Favori koleksiyonları
- [x] Alışveriş listesi
- [x] Bildirim sistemi, in-app (bell + /bildirimler)
- [x] Sosyal paylaşım butonları, Web Share API + WhatsApp/X/kopyala fallback
- [x] Gelişmiş moderasyon, kural-tabanlı pre-flight (7 sinyal + PENDING_REVIEW kuyruğu); AI-destekli sonraki iterasyonda
- [x] E-posta doğrulama (Resend prod'da)
- [x] Kullanıcı rozet sistemi (4 tip: EMAIL_VERIFIED / FIRST_VARIATION / POPULAR_VARIATION / RECIPE_COLLECTOR)
- [ ] Şablon video sistemi (Remotion), Faz 2/3 arası
- [x] PWA desteği (manifest + ikonlar + shortcuts)
- [x] **Google OAuth** (canlıda, bağla/unlink dahil, plandaki MVP 0.2 Auth.js kısmı Faz 2'ye genişledi)
- [x] **Profil düzenleme + şifre yönetimi + hesap silme** (tam /ayarlar sayfası)
- [x] **Şifremi unuttum akışı** (PasswordResetToken, 1h TTL, email enumeration defense)
- [x] **Rate limiting** (Upstash Redis, 9 scope)
- [x] **A11y overhaul** (useDismiss/useFocusTrap hook'ları, ARIA, reduced motion)
- [x] **A11y WCAG 2.1 AA tertemiz** (axe-core/playwright regression guard, renk paleti AA için revizyon, light + dark)
- [x] **Structured ingredient input** (amount + unit + name, backward compat)
- [x] **Malzeme grupları** ("Hamur için" / "Şerbet için" gibi bölümler, RecipeIngredient.group)
- [x] **Alerjen sistemi** (10 enum + GIN index + UI: detayda collapsible panel + listede "içermesin" filter + retrofit script)
- [x] **Vegan/vejetaryen retrofit** (kural-tabanlı diet inference + dedicated DİYET filter + yeşil chip)
- [x] **Bugünün tarifi** widget (deterministic daily pick + 12-kural curator note)
- [x] **"En çok beğeni" sort** (variations.likeCount aggregation, TR collation tie-break)
- [x] **Kullanıcı kendi uyarlamasını silebilir** (ownership gate + hard delete + AuditLog; düzenleme bilinçli olarak EKLENMEDİ, abuse vektörü)
- [x] **i18n minimal prep** (Recipe.translations Json? + LanguagePreferenceCard "Yakında"), gerçek aktivasyon Faz 3
- [x] **CI pipeline** (GitHub Actions: lint + typecheck + vitest + build + a11y audit)
- [x] **E2E test altyapısı** (Playwright, 12 test: home + recipe-detail + auth-pages + notifications + auth-roundtrip + a11y light/dark)
- [x] **Codex 500-batch DB hijyeni** (seed Zod validation + retrofit-all orchestrator + GIN index + migration baseline temizliği)

### Faz 3, Premium & Genişleme

- [ ] AI tarif videoları (Remotion altyapı §19-21, henüz başlamadı)
- [x] **Çoklu dil desteği (EN, DE)**, TR + EN + DE tam canlı (19 Nis 2026 oturum 7). 1701/1701 tarif title+description, 600/1701 full Mod B (ingredients + steps + tipNote + servingSuggestion). Codex Mod B pipeline devam ediyor.
- [ ] Premium üyelik (reklamsız, sınırsız AI), rekabet analizi (`docs/COMPETITIVE_ANALYSIS.md`) bunu 3-6 ay içinde öneriyor; ₺29/ay MVP test planlanabilir
- [x] **Haftalık menü planlayıcı** (`/menu-planlayici`, 19 Nis 2026 oturum 7). 7 gün × 3 öğün grid + alışveriş listesi tek-tık entegrasyon + print view
- [x] **Yemek blog / makale bölümü** (`/blog`, 19 Nis 2026 oturum 7). MDX altyapısı (next-mdx-remote + gray-matter + reading-time) + 3 seed makale (mutfak-rehberi / pisirme-teknikleri / malzeme-tanima kategori).
- [ ] Mobil uygulama (React Native), 3-6 ay
- [ ] Açık API (developer access), 3-6 ay

**Faz 3'e eklenen yeni maddeler (19 Nis 2026 oturum 7):**

- [x] **Legal hub**, `/yasal` 6 sayfa (KVKK + Kullanım Koşulları + Gizlilik + Çerez Politikası + Güvenlik + İletişim Aydınlatma) + cookie banner + sürüm etiketi + 301 redirect
- [x] **44 programatik landing**, `/mutfak/24` + `/etiket/15` + `/diyet/5` (unique H1 + TR/EN açıklama + breadcrumb + sitemap + canonical alignment)
- [x] **Newsletter double-opt-in altyapı**, schema + Resend + footer form + confirm/unsubscribe API (gönderim cron v2)
- [x] **RSS feed** `/feed.xml` (son 50 tarif, alternate link auto-discovery)
- [x] **HowTo schema enrichment**, Recipe JSON-LD `supply` + `tool` + step `name`+URL anchor
- [x] **Benzer tarifler motor v2**, ingredient Jaccard + featured boost + pool 100
- [x] **AI Asistan v2**, pantry daralt + diversify + diet filter
- [x] **Kişiselleştirme tur 3**, `foryou` sort boost (favoriteTags intersection)
- [x] **Editör Seçimi rozeti**, isFeatured görsel ⭐ + shelf rebrand
- [x] **@kozcactus super-admin protection**, hardcoded allowlist
- [x] **/admin/yorumlar browse**, review audit (moderasyon kuyruğu ayrı)
- [x] **Rekabet analizi v1.0**, `docs/COMPETITIVE_ANALYSIS.md` (5 TR + 2 int'l rakip, feature matrix, 3 dalga roadmap)

---

## 22. Git ve Çalışma Akışı

### Branch Stratejisi

```
main (production)
  └── develop (gelistirme)
        ├── feat/project-bootstrap
        ├── feat/auth
        ├── feat/recipe-catalog
        ├── feat/recipe-variations
        ├── feat/search-filter
        ├── feat/like-bookmark
        ├── feat/profile
        ├── feat/moderation
        ├── feat/cooking-mode
        ├── feat/nutrition
        ├── feat/ai-assistant
        ├── feat/video-pipeline
        ├── feat/admin-panel
        ├── fix/...
        └── hotfix/...
```

### Kurallar

- Her yeni özellik `feat/` branch'inde geliştirilir
- Bug düzeltmeleri `fix/` ile başlar
- Acil düzeltmeler `hotfix/` ile `main`'den dallanır
- Pull request ile merge
- Commit mesajları anlaşılır olacak

### Commit Mesaj Formatı

```
feat: yeni ozellik
fix: hata duzeltme
refactor: kod yeniden yapilandirma
docs: dokumantasyon
test: test ekleme/duzeltme
chore: bakim isleri
perf: performans iyilestirme
ci: CI/CD degisiklikleri
```

---

## 23. Deploy Planı

| Alan | Teknoloji |
|------|-----------|
| Kod | GitHub (private repo) |
| Web deploy | Vercel |
| Database | Neon PostgreSQL |
| Dosya storage | Cloudinary |
| Cache | Upstash Redis (opsiyonel) |
| Ortam değişkenleri | Vercel env vars |
| CI/CD | GitHub Actions |

**Vercel neden uygun:**
- Next.js ile doğal çalışır
- GitHub branch/PR preview deploy kolay
- İlk ürün için hızlı ve sade

**Dikkat:**
- AI video üretimi Vercel serverless içinde uzun sürebilir. Video üretimi için queue/worker yaklaşımı gerekir.
- Büyük dosyalar Vercel içine değil Cloudinary'e yüklenmeli.

---

## 24. Test ve Kalite Planı

### Minimum Kalite Hedefleri

- TypeScript hatasız (`tsc --noEmit`)
- Lint hatasız (`next lint`)
- Tarif ekleme ve beğenme akışları testli
- Auth korumalı sayfalar testli
- Moderasyon kuralları unit testli
- Kritik kullanıcı akışları Playwright ile testli

### Test Türleri

| Tür | Araç | Kapsam |
|-----|------|--------|
| Unit | Vitest | Fonksiyonlar, utility'ler, moderasyon kuralları |
| Integration | Vitest | API endpoint'leri, veritabanı sorguları |
| E2E | Playwright | Kritik kullanıcı akışları |

### E2E Senaryoları

- Ziyaretçi tarif arar ve detay okur
- Kullanıcı giriş yapar
- Kullanıcı varyasyon ekler
- Kullanıcı tarif beğenir
- Kullanıcı profilinde tarifini görür
- Admin raporlanan içeriği gizler

### Hedef Test Kapsamı

- Kritik domain logic (moderasyon, kalori hesabı, auth, beğeni) %80+ kapsam
- UI bileşenleri kademeli olarak test kapsamına alınır
- Kritik kullanıcı akışları (auth, varyasyon ekleme, beğeni) %100 E2E testli

### 15 Nis 2026, mevcut durum

- **230 unit + 12 E2E test yeşil.**
- Unit: moderation blacklist (11), AI matcher (23, pantry regression dahil), rate-limit (8), email normalize (5), useDismiss (5), ingredients (?), link-intent (?), moderation preflight (12), profile validator (?), password change validator (?), password reset validator (9), recipe of the day commentary (18), recipe most-liked sort (6), allergens (19), diet inference (15), ingredient group bucketing (7), seed recipe schema (15), badges service (13, prisma+notification mock), email verification (5, prisma mock).
- E2E: home (3), recipe-detail (2), auth-pages (3), notifications (1), auth-roundtrip (1), a11y light + dark (2, axe-core/playwright, regression guard).
- CI her push'ta: `lint + typecheck + vitest + build + a11y audit`.
- Ops smoke scripts (CI'da değil, manuel): test-password-reset-flow, test-most-liked-sort, test-delete-own-variation, retrofit-allergens, retrofit-diet-tags, retrofit-all, fix-ingredient-groups, fix-tipnotes, smoke-rate-limit, list-users, delete-user, list-recipe-slugs.
- **Mocking pattern**: Prisma'ya bağımlı service'leri test ederken `vi.hoisted` + `vi.mock` (örnek: `tests/unit/badges-service.test.ts`).

---

## 25. Ortam Değişkenleri (.env)

```env
# Veritabani
DATABASE_URL="postgresql://user:pass@host:5432/tarifle?sslmode=require"

# Auth.js (env isimleri surume gore degisebilir, kurulurken resmi dokumana gore dogrulanacak)
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Cloudinary
CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# AI (Faz 2)
AI_PROVIDER="claude"  # veya "openai", "local"
ANTHROPIC_API_KEY="..."

# Redis (Opsiyonel)
UPSTASH_REDIS_REST_URL="..."
UPSTASH_REDIS_REST_TOKEN="..."

# Video AI (Faz 3)
FAL_API_KEY="..."
```

---

## 26. Performans Hedefleri

| Metrik | Hedef |
|--------|-------|
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 95 |
| First Contentful Paint (FCP) | < 1.5s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| Interaction to Next Paint (INP) | < 200ms |
| Total Blocking Time (TBT) | < 200ms |

### JS Bundle Bütçesi

| Sayfa Türü | JS (gzipped) | CSS |
|-----------|-------------|-----|
| Ana sayfa | < 150kb | < 30kb |
| Tarif detay | < 200kb | < 40kb |
| Admin paneli | < 300kb | < 50kb |

---

## 27. Güvenlik Kontrol Listesi

- [ ] HTTPS zorunlu (Vercel otomatik)
- [ ] CSRF koruması (Auth.js yerleşik)
- [ ] Rate limiting (API routes, IP + kullanıcı bazlı)
- [ ] SQL injection koruması (Prisma ORM parametreli sorgular)
- [ ] XSS koruması (React otomatik escape + sanitize)
- [ ] Dosya yükleme validasyonu (tip, boyut, içerik)
- [ ] Şifre hashleme (bcrypt)
- [ ] KVKK uyumu
- [ ] Çerez politikası
- [ ] Content Security Policy headers
- [ ] Input validation (Zod ile her endpoint'te)
- [ ] Honeypot alanları (bot tespiti)
- [ ] Ortam değişkenleri .env'de, asla kodda değil
- [ ] `Strict-Transport-Security` header
- [ ] `X-Content-Type-Options: nosniff` header
- [ ] `X-Frame-Options: DENY` header
- [ ] `Referrer-Policy: strict-origin-when-cross-origin` header

---

## 28. Script İsimleri (package.json)

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "next lint",
  "typecheck": "tsc --noEmit",
  "test": "vitest",
  "test:e2e": "playwright test",
  "test:coverage": "vitest --coverage",
  "db:generate": "prisma generate",
  "db:migrate": "prisma migrate dev",
  "db:push": "prisma db push",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio",
  "db:reset": "prisma migrate reset",
  "format": "prettier --write .",
  "format:check": "prettier --check .",
  "content:seed": "tsx scripts/seed-recipes.ts",
  "ai:video:dry-run": "tsx scripts/ai-video-dry-run.ts"
}
```

> **Uyarı:** `db:reset` sadece local development için kullanılacaktır. Production ortamında asla çalıştırılmayacak.

---

## 29. Seed Data Planı

Başlangıçta **50 yemek + 20 içecek** tarifi hedeflenir. Tüm tarifler özgün yazılacak.

### Örnek Tarifler

| Kategori | Tarifler |
|----------|---------|
| Et Yemekleri | Karnıyarık, Etli Nohut, Tas Kebabı, İzmir Köfte, Hünkar Beğendi |
| Tavuk Yemekleri | Tavuk Sote, Fırın Tavuk, Çerkez Tavuğu, Tavuk Şiş |
| Sebze Yemekleri | İmam Bayıldı, Zeytinyağlı Fasulye, Türlü, Kabak Mücver |
| Bakliyat | Kuru Fasulye, Barbunya, Nohut Yemeği |
| Çorbalar | Mercimek, Ezogelin, Yayla, Tarhana |
| Pilavlar & Makarnalar | Bulgur Pilavı, İç Pilav, Mantı |
| Hamur İşleri | Börek, Gözleme, Pide, Lahmacun |
| Kahvaltılık | Menemen, Çılbır, Peynirli Poğaça |
| Mezeler | Kısır, Cacık, Humus |
| Salatalar | Çoban Salatası, Piyaz |
| Tatlılar | Sütlaç, Revani, Brownie, Kazandibi |
| Soğuk İçecekler | Limonata, Smoothie, Ayran |
| Sıcak İçecekler | Türk Kahvesi, Salep, Soğuk Kahve |
| Kokteyller | Mojito, Margarita, Cosmopolitan |
| Mocktail | Alkolsüz Mojito, Shirley Temple |
| Soslar | Beşamel, Domates Sosu |

### Seed Data Formatı

Her seed tarif şu yapıda olacak:

```typescript
{
  title: "Karnıyarık",
  slug: "karniyarik",
  description: "Patlıcan ve kıymayla yapılan klasik Türk yemeği.",
  emoji: "🍆🥘",
  categorySlug: "et-yemekleri",
  type: "YEMEK",
  difficulty: "MEDIUM",
  prepMinutes: 15,
  cookMinutes: 30,
  totalMinutes: 45,
  servingCount: 4,
  averageCalories: 320,
  protein: 18,
  carbs: 22,
  fat: 15,
  tags: ["firinda", "misafirlik"],
  tipNote: "Patlıcanları çok fazla kızartmayın, fırında da pişebilir.",
  servingSuggestion: "Pilav ve cacıkla servis edin.",
  ingredients: [
    { name: "patlıcan", amount: "4", unit: "adet", sortOrder: 1 },
    { name: "kıyma", amount: "300", unit: "gr", sortOrder: 2 },
    // ...
  ],
  steps: [
    { stepNumber: 1, instruction: "Patlıcanları yıkayın ve alacalı soyun." },
    { stepNumber: 2, instruction: "Ortadan yarın ve tuzlu suda 15 dakika bekletin." },
    // ...
  ]
}
```

---

## 30. Önerilen Ek Özellikler

Bunlar MVP dışında, faz bazlı eklenecek:

| Özellik | Açıklama | Faz |
|---------|----------|-----|
| Tarif kaydetme / favorilere alma | Bookmark sistemi | MVP 0.2 ✅ |
| Porsiyon artırma/azaltma | Malzeme miktarları otomatik güncelleme | MVP 0.2 ✅ |
| Pişirme modu | Ekranda büyük adımlar, timer, ekran kapanmasını engelleme | MVP 0.3 ✅ |
| Alışveriş listesi oluşturma | Malzemeleri listeye ekle, WhatsApp'a gönder | Faz 2 ✅ |
| Alerjen etiketleri | Süt ürünü, gluten, kuruyemiş, yumurta vb. | Faz 2 ✅ (10 enum + GIN index + UI + retrofit script) |
| Beslenme etiketleri | Vegan, vejetaryen, yüksek protein, düşük kalori | MVP 0.1 ✅ + Faz 2 ✅ (vegan/vejetaryen retrofit + dedicated DİYET filter) |
| Tarif düzenleme geçmişi | Varyasyon edit history | **Eklenmedi** (15 Nis 2026, bilinçli karar: edit + beğeni koruma abuse vektörü; sil özelliği yeterli) |
| Kullanıcı rozetleri | İlk tarif, 10 beğeni, popüler tarif vb. | Faz 2 ✅ |
| "Bugün ne pişirsem?" | Hızlı öneri alanı | Faz 2 ✅ (ana sayfa Bugünün Tarifi widget, deterministic daily pick) |
| Schema.org Recipe | SEO için yapılandırılmış veri | MVP 0.1 ✅ |
| Yazdırılabilir tarif modu | Temiz format | MVP 0.3 ✅ |
| Tarif paylaşım linkleri | WhatsApp, Twitter, kopyala | Faz 2 ✅ |
| OG Image oluşturucu | Her tarif için otomatik sosyal medya görseli (Vercel OG) | Faz 2 ✅ |
| Adım zamanlayıcısı | "20 dakika pişirin" adımında otomatik timer | MVP 0.3 ✅ |
| Mevsimsel öneriler | Kış tarifleri, Ramazan menüsü gibi | Faz 2 (ileride) |
| Şifremi unuttum akışı | Email-based reset, 1h TTL | Faz 2 ✅ |
| Kullanıcı kendi uyarlamasını silebilir | Hard delete + AuditLog | Faz 2 ✅ |
| Malzeme grupları | Hamur için / Şerbet için bölümler | Faz 2 ✅ |
| Diğer dil desteği (EN/DE) | UI + tarif çevirileri | Faz 3 (schema hazır: `Recipe.translations Json?`) |
| Full-text arama (Postgres tsvector) | Türkçe kök eşleşme + GIN | Faz 2 sıradakiler (500+ tarifle hissedilir) |

---

## 31. Karar Bekleyen Sorular

Aşağıdaki kararlar netleştirilmiş durumda:

| Soru | Karar |
|------|-------|
| GitHub reposu private mı public mi? | **Private** |
| Repo adı | **tarifle** |
| Giriş yöntemi | **E-posta + Şifre + Google OAuth** |
| Kokteyl tariflerinde alkollü içerik | **Evet, yaş uyarısı + sorumlu tüketim notu ile** |
| Deploy | **Vercel + Neon PostgreSQL** |
| AI video | **MVP dışında, önce şablon video** |
| Site dili | **Başlangıçta sadece Türkçe** |
| İçerik | **Özgün seed tarifler** |
| Dosya storage | **Cloudinary** |
| AI provider | **Tek modele kilitlenmeyecek, interface üzerinden** |

### Açık Kalan Sorular

1. E-posta doğrulaması MVP'de zorunlu mu yoksa opsiyonel mi olsun?, **Karar: opsiyonel** (15 Nis 2026; doğrulanmamış kullanıcı her şeyi yapabiliyor, sadece EMAIL_VERIFIED rozeti eksik. Şifremi unuttum akışı bunu varsayıyor, verify olmadan da reset alabilir).
2. AI video için aylık deneme bütçesi belirlenecek mi?, Hâlâ açık (Faz 3 konusu)
3. İlk tarif veri setine kullanıcının özel tarifleri de eklensin mi?, Hâlâ açık (Codex 500-batch akışında değerlendirilebilir)
4. Gelişmiş moderasyonda AI (Claude Haiku) kullanımı?, **Karar: kural-tabanlı yeterli** (15 Nis 2026; preflight 7 sinyal + PENDING_REVIEW kuyruğu + URL bypass tespiti production'da çalışıyor; LLM masrafı şu an gereksiz, kalite gerektiğinde revisit edilir)

---

## 32. Definition of Done

Her feature tamamlanmış sayılması için:

- [ ] TypeScript hatası yok (`tsc --noEmit` geçiyor)
- [ ] Lint geçiyor (`next lint` hatasız)
- [ ] Mobil görünüm kontrol edildi (320px, 768px, 1024px, 1440px)
- [ ] Auth/role kontrolü var (gerekli sayfalarda)
- [ ] Boş state, loading state ve error state işleniyor
- [ ] Gerekli testler yazıldı (unit ve/veya integration)
- [ ] Dark ve Light mode'da görünüm kontrol edildi
- [ ] Erişilebilirlik kontrol edildi (klavye nav, kontrast)
- [ ] PROJECT_STATUS.md güncellendi
- [ ] Commit ve PR oluşturuldu

---

## 33. PROJECT_STATUS.md Formatı

Proje durumunu takip etmek için `docs/PROJECT_STATUS.md` dosyası kullanılır. Her feature tamamlandığında veya yeni karar alındığında güncellenir. Ana plan dokümanını kalabalıklaştırmadan güncel durumu gösterir.

```markdown
# Tarifle, Proje Durumu

> Son güncelleme: [tarih]

## Yapılanlar
- [x] Proje planı dokümanı oluşturuldu
- [x] GitHub repo oluşturuldu
- [x] ...

## Devam Edenler
- [ ] Ana sayfa tasarımı (MVP 0.1)
- [ ] ...

## Sıradaki İşler
- [ ] Kategori sayfaları
- [ ] Tekil tarif sayfası
- [ ] ...

## Karar Bekleyenler
- E-posta doğrulaması MVP'de zorunlu mu?
- ...

## Bilinen Sorunlar
- [Henüz yok]

## Notlar
- [Geliştirme sırasında öğrenilen, ileride işe yarayabilecek notlar]
```

---

## 34. İlk Uygulama Sırası

Önerilen teknik adımlar:

1. GitHub repo ve `feat/project-bootstrap` branch oluştur
2. Next.js + TypeScript projesini başlat
3. Tailwind, lint, format ve test altyapısını kur
4. Prisma + PostgreSQL şemasını oluştur
5. Seed tarif sistemini kur
6. Ana sayfa, kategori ve tarif detay sayfalarını yap
7. Arama ve filtreleme sistemini kur
8. Auth sistemini ekle
9. Varyasyon ekleme ve beğeni sistemini kur
10. Profil sayfasını yap
11. Moderasyon panelinin ilk sürümünü ekle
12. PROJECT_STATUS.md'yi güncelle

---

> **Bu doküman, projenin tek kaynak dokümanıdır (Single Source of Truth).** Her büyük karar bu dokümana referansla alınır ve güncel tutulur. Faz ilerledikçe tamamlanan maddeler işaretlenir, yeni fikirler eklenir.
