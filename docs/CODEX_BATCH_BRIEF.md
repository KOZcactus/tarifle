# Tarifle, Codex Oturum Talimatı (Yeni Tarif VEYA Çeviri Retrofit)

> Bu doküman birden fazla session boyunca kullanılır. Her oturumda ilk önce
> oku, sonra Kerem sana hangi modda çalışacağını (A ya da B) söyleyecek.
> Oturum sıfırdan başlasa bile bu tek dosya yeterli, proje tanıtımı + her
> iki iş tipi + çift kontrol + geçmişte yakalanan somut hataların tablosu.

---

## 🚀 HIZLI TETİKLEYİCİ, Kerem ne derse ne yap

| Kerem der | Sen anla | Git direkt | Çıktı |
|---|---|---|---|
| **"Mod A"**, "yeni batch", "batch N yaz", "100 tarif yaz" | **MOD A**, 100 yeni TR tarif yaz | §5 | `scripts/seed-recipes.ts` sonuna append + inline EN/DE title+description |
| **"Mod B"**, "batch N çevirisi", "translations-batch-N.csv işle" | **MOD B**, CSV'yi okuyup JSON üret | §6 | `docs/translations-batch-N.json` (ingredients/steps/tipNote/servingSuggestion EN+DE) |

**Default'lar (soru sorma, direkt başla):**

### Mod A default (Kerem sadece "Mod A" veya "batch N yaz" derse):
- **100 tarif** yaz (aksi belirtilmedikçe)
- Dağılım: **~70 TR + ~30 uluslararası**, uluslararasıda eksik mutfaklardan çeşitlilik
- TR'de **bölgesel çeşitlilik** zorunlu, sadece klasik değil, 7 bölgeden örnekler (Karadeniz, Ege, Güneydoğu, İç Anadolu, Doğu, Marmara, Akdeniz)
- **isFeatured: batch'te 5-10 tarif** (sadece ikonik olanlar)
- Eksik kategoriler için Kerem'e öncelik sor (kahvaltı/çorba/tatlı dengelensin)

### Mod B default (Kerem sadece "Mod B" veya "batch N çevirisi" derse):
- Kerem CSV dosya yolu verir: `docs/translations-batch-N.csv`
- Sen aynı isimli **JSON** üretirsin: `docs/translations-batch-N.json`
- Her tarif için **EN + DE ingredients + steps + tipNote + servingSuggestion** doldur (CSV'de hangisi eksikse)
- `title + description` JSON'a YAZMA, CSV'deki `en_title_current` sütunundan görürsün zaten dolu (Mod A'dan)
- Array uzunlukları TR'yle birebir eşleşmeli

### Mod B Backfill default (Kerem "Mod B. Backfill-NN" derse):
- Kerem CSV yolu verir: `docs/translations-backfill-NN.csv` (NN zero-padded 01..13)
- Sen aynı isimli **JSON** üretirsin: `docs/translations-backfill-NN.json`
- Mod B ile aynı kurallar geçerli (§6), tek fark:
  - Batch 0-11 dönemi eski tarifler, EN/DE çevirisi **hiç yok** (title+desc dahil bazılarında eksik).
  - CSV'deki `en_*_current` / `de_*_current` sütunları çoğunlukla boş, kafan karışmasın: **backfill'in işi zaten bu eksikleri kapatmak**.
  - "Alanlar boş = sahte çevirmem gerekmez" refleksi yanlış, CSV'deki `ingredients_tr` / `steps_tr` / `tipNote_tr` / `servingSuggestion_tr` sütunlarından **TR metinleri oku** ve onları native çevir.

**⚠️ Tek teslim kuralı (Mod A):** Kerem açıkça "kademeli gönder" veya "50'şer
ver" demiyorsa, **100 tarifi TEK seferde tamamla**. Ortada durma, "25 hazır,
devam edeyim mi?" diye sorma, Kerem zaten 100 istediğini biliyor, ara
teslim zaman kaybı. Context window sıkışırsa bile **aynı mesajda devam et**;
devam edemezsen sadece tek cümlelik "context doldu, kaldığım slug şu" bilgisi
bırak, sonra kal. Ama mümkün olduğunca **100'ü bitirene kadar durma**.

---

## 🎯 Mutlak öncelik: **DOĞRULUK > HIZ > KAPSAM**

- Şüphede kaldıysan **çevirme / yazma, issues alanına yaz**, Kerem/Claude review eder.
- Google Translate / DeepL düz çıktı **YASAK**. Native speaker seviyesi + kültürel bağlam zorunlu.
- Veri yanlışlığı "bilgi yokluğu"ndan daha kötüdür. Boş bırak, sahte doldurma.
- **Her çıktıyı 2 kere kontrol et** (§8 checklist).

---

## 1. Proje tanıtımı

**Tarifle** (https://tarifle.app), Türkçe modern tarif platformu. Yemek +
içecek + kokteyl. **1100 canlı tarif** (Nisan 2026). Faz 3 aktif. i18n TR +
EN soft launch canlı (DE retrofit tamamlandı).

**Tech stack** (bilmen yeterli):
- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 7 ORM, **Neon PostgreSQL** (dev + prod branch ayrı)
- Auth.js v5, Vercel deploy, Cloudflare DNS
- next-intl (cookie-based NEXT_LOCALE + User.locale DB)
- GitHub: **KOZcactus/tarifle** (private repo)

**Canlı durum:**
- **2320 tarif prod'da** (20 Nis 2026, batch 23 sonu), 24 mutfak kodu, 17 kategori, 10 allergen, 15 tag
- **2320/2320 tarif EN + DE `title + description` dolu** (Recipe.translations JSONB;
  1200/2320 tarif (batch 12-23) `ingredients + steps` Mod B ile tam çeviri canlı,
  iki-pass mimarisi sonuçlandı; batch 24+ için yeni Mod B batch'leri bekleniyor)
- Faz 3: admin paneli + Review v2 + Sentry + Fuzzy arama + kategori pagination
  + OG image i18n + SEO meta i18n, hepsi canlı

**Proje sahibi:** Kerem (koz.devs@gmail.com)

---

## 2. Ekip & roller

| Kim | Nerede | Ne yapar | Sen onun işine? |
|---|---|---|---|
| **Kerem** | Koordinatör | Her şeyi yönetir, "batch N hazır" / "Mod A/B" der | - |
| **Claude** (Anthropic) | Kerem'in makinesi | Kod yazar (src/, scripts/, messages/, prisma/), validation/seed/prod promote koşturur | **ASLA DOKUNMA** |
| **Sen** (bu Codex) | Kerem'in ChatGPT'si | Bu oturum modu neyse onu yaparsın (§5 veya §6) | - |
| **Codex2** | Eren'in ayrı makinesi | Başka iş (gelecekte video, görsel) | Farklı makine, çakışma yok |

---

## 3. Dosya çakışma kuralları (çok önemli)

### 🟢 Senin yazabileceğin dosyalar (SADECE):
- **Mod A (yeni tarif):** `scripts/seed-recipes.ts` (sadece
  `export const recipes = [...]` array'inin **sonuna** append)
- **Mod B (çeviri):** `docs/translations-batch-N.json` (yeni oluştur)

### 🔴 ASLA DOKUNMA:
- `src/`, frontend/backend kodu (Claude'un alanı)
- `scripts/` dışındaki tüm diğer scriptler (`scripts/seed-recipes.ts` dışında)
- `messages/`, i18n keys
- `prisma/`, schema + migrations
- `.env*`, secrets
- `docs/existing-slugs.txt`, Claude regen'liyor
- `docs/RECIPE_FORMAT.md`, `docs/CODEX_HANDOFF.md`, bunları **oku**, yazma

### ❌ Kesin yasaklar:
- `git commit`, `git push`, `git add`: **YOK**. Sen dosyayı yaz, bırak;
  Kerem/Claude halleder
- `npm run db:*`, `prisma migrate`, `--apply`, `--confirm-prod`: **HİÇBİR
  destructive komut**
- Prod DB erişimi, `.env.production.local` okuma
- Mevcut tarifleri silme/değiştirme (append-only)
- **Em-dash (— U+2014) yasak.** Tüm metinlerde (tarif description, tipNote,
  servingSuggestion, EN/DE çeviriler, issues detail field'ı vb.). Kullanıcı
  geri bildirimi: em-dash "AI yazdı" hissi veriyor. Yerine virgül, noktalı
  virgül, nokta veya parantez kullan. Hyphen (`-`) birleşik kelimede serbest
  (*"scale-to-zero"*); yasak olan sadece em-dash (—) ve en-dash (–).
  Teslim öncesi kendi JSON/seed'ine `—` grep at, varsa düzelt.

### ⚠️ Dosya encoding, batch 12'de yakalandı, TEKRARLAMA
`scripts/seed-recipes.ts` **her zaman UTF-8 (BOM yok) + LF satır sonu**
olarak kaydedilmeli. Batch 12 teslim sırasında Windows-1252 → UTF-8
round-trip ile **tüm dosya mojibake-korupt** geldi (ş→ÅŸ, ı→Ä±, emoji
ðŸ¥© dahil batch 1-11 ANA KATALOGU bozulmuştu). Batch 12 eklentilerin
temizdi çünkü sıfırdan yazmıştın, ama mevcut dosyayı okuyup kaydetme
adımında encoding koruması yoktu.

**Önleme:**
- Editörde "Save with Encoding → UTF-8 (no BOM)" + "Line Endings → LF" seç
- `file scripts/seed-recipes.ts` çıktısı `UTF-8 text` (BOM YOK) + teslim
  öncesi kontrol et
- Windows'tasan: VS Code alt-çubukta "UTF-8" + "LF" yazmalı (CRLF/UTF-8 BOM DEĞİL)
- Şüphedeysen: **sadece batch N bölümünü ayrı bir `batch-N.txt` olarak teslim
  et, Claude mevcut dosyaya append eder.** Mojibake riski sıfır olur.

---

## 4. Oturum modu

Üstteki "Hızlı tetikleyici" kartı modu seç + default'u belirler. Bu bölüm
mod akışının detayını sunar, tetikleyici yorum bırakmayan edge case'ler için
geri dönüş referansı.

### 🍳 Mod A, Yeni TR tarif yazma → §5

- **Tetikleyici cümleler:** "Mod A", "yeni batch", "batch N yaz", "N tarif yaz",
  "batch N için 100 tarif", "yeni tarif üret"
- **Beklenen default:** 100 tarif, 70 TR + 30 uluslararası, isFeatured 5-10
- **Çıktı:** `scripts/seed-recipes.ts` dosyasındaki `export const recipes = [...]`
  array'inin **sonuna append**, batch başlangıcına `// ── BATCH N ──` yorumu
- **Kerem farklı sayı verirse** (örn. "50 tarif", "20 tarif çorba"), default
  yerine o sayıyı kullan; dağılımı sor ya da Türk + eksik mutfaklardan seç

### 🌍 Mod B, Mevcut tarif çevirisi (retrofit) → §6

- **Tetikleyici cümleler:** "Mod B", "batch N çevirisi", "translations-batch-N.csv
  işle", "çeviri batch N"
- **Beklenen default:** CSV'yi oku → eksik alanları (ingredients + steps,
  kısmen tipNote/servingSuggestion) EN + DE olarak doldur → JSON üret
- **Çıktı:** `docs/translations-batch-N.json` (yeni dosya, CSV ile aynı N)
- **title + description JSON'a YAZMA**, Mod A'dan zaten dolu

### Ortak kurallar (her iki modda geçerli)

- §3 dosya çakışma + encoding disiplini
- §7 kalite çıtası (PROTECTED_TR_TOKENS, description formatı, dil tonları)
- §8 çift self-review (pass 1 içerik + pass 2 çeviri)
- §9 geçmişte yakalanmış hatalar tablosu, **tekrar etme**
- §10 kesin yasaklar (git, prod DB, encoding bozma)

---

## 5. Mod A, Yeni TR tarif yazma

### Scope (Kerem'in açık talimatı yoksa default'u uygula)

**Default scope (Kerem sadece "Mod A" / "batch N yaz" dediğinde):**
- **100 tarif**
- **~70 TR + ~30 uluslararası** (TR ağırlıklı, uluslararasıda §5 cuisine
  tablosundan eksik olan kodlardan, genelde `se/hu/pe/gb/pl/au` az olanlar,
  ya da `ru/vn/es/cu` gibi gelişmekte olanlar)
- **7 Türk bölgesi dengelensin** (Karadeniz, Ege, Güneydoğu, İç Anadolu,
  Doğu, Marmara, Akdeniz), sadece İstanbul/klasik değil, Rize-Antalya-Erzurum-
  Mardin gibi bölgesel çeşitlilik zorunlu
- **Kategori dağılımı**: kahvaltı 10-15, çorba 8-12, ana yemek 20-25, tatlı
  15-20, meze/salata 8-12, hamur işi 8-12, içecek 5-10, kokteyl 3-5 (dengeli
  karışım; belirli kategoride açık varsa Kerem sana "N tatlı yaz" gibi özel
  talimat verir)
- **isFeatured: 5-10** (toplam 100'ün %5-10'u; sadece gerçekten ikonik
  tarifler, ilk kez duyulacak "Cantık Pidesi" gibi değil, "Adana Kebap"
  kalibresi)

**Kerem özel talimat verirse** (örn. "50 tarif yaz", "20 tatlı istiyorum",
"sadece Türk", "10 kokteyl + 15 smoothie"), o talimatı uygula, default
dağılım geçersiz.

**Mevcut slug'ları tekrarlama:** `docs/existing-slugs.txt` zorunlu kontrol.
Slug'un alfabetik sıralı tam listesi (şu an 1300+ slug).

### Çıktı yeri ve teslim

`scripts/seed-recipes.ts` dosyasındaki `export const recipes: SeedRecipe[] = [...]`
array'inin **sonuna append**. Mevcut tarifleri silme. Batch başlangıcına
`// ── BATCH N ── (tarih: YYYY-MM-DD, N tarif, Codex)` yorumu koy.

**Marker karakteri kritik:** `──` (U+2500 × 2, box drawings light
horizontal) kullan. **Em-dash (`——`, U+2014 × 2) KULLANMA.** Export
script `export-recipes-for-translation-b.ts` regex'te `──` arıyor;
em-dash'li marker bulunamaz, batch 17 Mod B hazırlığında normalize
etmek gerekti. Kopyalarken karakteri kontrol et, VS Code'da
"Insert Unicode" veya mevcut batch marker'ı kopyala-yapıştır en
güvenlisi.

**Dosya encoding (kritik, batch 12'de yakalandı, §3'e bak):**
- UTF-8 (BOM YOK) + LF satır sonu olarak kaydet
- VS Code alt çubukta "UTF-8" + "LF" yazmalı (CRLF veya UTF-8 BOM DEĞİL)
- Şüphedeysen: batch'i ayrı bir `.txt` olarak ver, Claude append eder, sıfır
  risk

**Teslim, SADECE 100 bittiğinde yaz:**

100 tarif bitmeden teslim mesajı yazma. "26/100, devam edeyim mi?" gibi ara
sorular yasak, Kerem zaten 100 istediğini biliyor, sen tamamla, TESLİM ET.
`content:validate` gibi kendi self-check'lerini gizli yap (ara kontrol sana
ait, Kerem'e rapor değil).

Bittiğinde şu formatı kullan:
```
Batch N hazır, 100 tarif + EN/DE çeviri (title + description minimum).
- Eklendi: scripts/seed-recipes.ts (append only)
- Dağılım: 72 TR + 28 uluslararası (5 it + 4 fr + 3 jp + ...)
- 7 Türk bölgesi dengelendi: Karadeniz 10, Ege 8, Güneydoğu 12, ...
- Kategori: 12 kahvaltı, 10 çorba, 22 ana yemek, 18 tatlı, ...
- isFeatured: 8 tarif (X, Y, Z, ...)
- Self-review pass 1 + 2 temiz, 0 bulunan issue / şu slug'larda şu noktalar review gerek
```

### Recipe object format (birebir)

```typescript
{
  title: "Akçaabat Köftesi", slug: "akcaabat-koftesi", emoji: "🥩",
  description: "Trabzon'un meşhur Akçaabat köftesi; dana kıyma, bayat ekmek ve sarımsak ile yoğrulup mangalda pişirilen regional bir lezzet.",
  categorySlug: "et-yemekleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
  cuisine: "tr",
  prepMinutes: 25, cookMinutes: 15, totalMinutes: 40, servingCount: 4,
  averageCalories: 340, protein: 26, carbs: 8, fat: 22, isFeatured: false,
  tipNote: "Kıymayı 10 dakika yoğurun, iyice yapışkanlaşsın.",
  servingSuggestion: "Közlenmiş domates, biber ve piyaz ile servis edin.",
  tags: ["misafir-sofrasi", "yuksek-protein"],
  allergens: ["GLUTEN"],
  ingredients: [
    { name: "Dana kıyma", amount: "500", unit: "gr", sortOrder: 1 },
    { name: "Bayat ekmek içi", amount: "1", unit: "dilim", sortOrder: 2 },
    { name: "Soğan", amount: "1", unit: "adet", sortOrder: 3 },
    { name: "Sarımsak", amount: "3", unit: "diş", sortOrder: 4 },
    { name: "Tuz", amount: "1", unit: "tatlı kaşığı", sortOrder: 5 },
    { name: "Karabiber", amount: "1", unit: "çay kaşığı", sortOrder: 6 },
    { name: "Kimyon", amount: "1", unit: "çay kaşığı", sortOrder: 7 },
  ],
  steps: [
    { stepNumber: 1, instruction: "Bayat ekmeği suda yumuşatıp sıkın, kıymaya ekleyin." },
    { stepNumber: 2, instruction: "Rendelenmiş soğan, ezilmiş sarımsak ve baharatları ekleyip 10 dakika yoğurun.", timerSeconds: 600 },
    { stepNumber: 3, instruction: "Köfteleri parmak şeklinde uzun şekillendirin." },
    { stepNumber: 4, instruction: "Mangal közünde veya ızgarada 12-15 dakika çevire çevire pişirin.", timerSeconds: 900 },
  ],
  translations: {
    en: {
      title: "Akçaabat Köftesi",
      description: "A Black Sea Trabzon specialty, minced beef kneaded with stale bread crumb, onion, and garlic, grilled over charcoal until browned at the edges and juicy within.",
    },
    de: {
      title: "Akçaabat Köftesi",
      description: "Eine Schwarzmeer-Spezialität aus Trabzon: Rinderhack mit altbackener Brotkrume, Zwiebel und Knoblauch verknetet und über Holzkohle gegrillt, bis die Ränder knusprig und das Innere saftig sind.",
    },
  },
},
```

### Mod A Zorunlu kurallar (hepsi çiğnenirse seed başarısız olur)

**Slug (kritik):**
- Sadece `[a-z0-9-]`. Türkçe karakter YOK (`ğ→g, ş→s, ı→i, ö→o, ü→u, ç→c`)
- **Locative/dative eki EKLEME.** "Fırında X" için slug `firin-x` (kök).
  `firinda-x` kesinlikle YASAK.
- `docs/existing-slugs.txt`'te olmamalı (tekrar yok)

**Geçerli enum'lar:**
- **categorySlug (17):** `et-yemekleri, tavuk-yemekleri, sebze-yemekleri,
  corbalar, baklagil-yemekleri, salatalar, kahvaltiliklar, hamur-isleri,
  tatlilar, aperatifler, icecekler, kokteyller, kahve-sicak-icecekler,
  makarna-pilav, soslar-dippler, smoothie-shake, atistirmaliklar`
- **type (10):** `YEMEK, TATLI, ICECEK, KOKTEYL, APERATIF, SALATA, CORBA,
  KAHVALTI, ATISTIRMALIK, SOS`
- **difficulty:** `EASY, MEDIUM, HARD`
- **cuisine (24):** `tr, it, fr, es, gr, jp, cn, kr, th, in, mx, us, me, ma,
  vn, br, cu, ru, hu, se, pe, gb, pl, au`
- **tags (15):** `pratik, 30-dakika-alti, dusuk-kalorili, yuksek-protein,
  firinda, tek-tencere, misafir-sofrasi, cocuk-dostu, butce-dostu, vegan,
  vejetaryen, alkollu, alkolsuz, kis-tarifi, yaz-tarifi`
- **allergens (10):** `GLUTEN, SUT, YUMURTA, KUSUYEMIS, YER_FISTIGI, SOYA,
  DENIZ_URUNLERI, SUSAM, KEREVIZ, HARDAL`

**Allergen ingredient-implied (ZORUNLU, ihlalleri seed'de CRITICAL olur):**
- `GLUTEN`, un, bulgur, buğday, ekmek, makarna, yufka, kadayıf, tarhana,
  bayat ekmek, firik, dövme buğday, yulaf
- `SUT`, süt, yoğurt, peynir, tereyağı, krema, kaymak, labne, ayran, kefir
- `YUMURTA`, yumurta, ev yapımı mayonez
- `KUSUYEMIS`, ceviz, badem, fındık, Antep fıstığı, kaju, kestane
- `YER_FISTIGI`, yer fıstığı, fıstık ezmesi (KUSUYEMIS'ten AYRI)
- `SOYA`, soya sosu, tofu, edamame, miso
- `DENIZ_URUNLERI`, balık, karides, midye, ahtapot, kalamar, hamsi, somon,
  ton, yengeç
- `SUSAM`, susam, tahin, susam yağı
- **İstisna:** Hindistan cevizi sütü/badem sütü/yulaf sütü SUT DEĞİL.
  Badem sütü = KUSUYEMIS, yulaf sütü = GLUTEN.
- **Hindistan cevizi (coconut) KUSUYEMIS DEĞİLDİR.** "Ceviz" kelimesi
  geçse bile coconut palm family, tree-nut allergen kapsamı dışında.
  Hindistan cevizi + Hindistan cevizi sütü + rende hindistan cevizi →
  allergen `[]`. (Batch 16 Mod B'de yanlış flag edildi, coconut-lime
  / cinnamon-coconut tarifleri.)

**Time math:** `prepMinutes + cookMinutes ≈ totalMinutes` (±5 dk).
**Dinlendirme / soğutma / marinasyon / buzdolabı / fermentasyon süresi
totalMinutes'a DAHİL olmalı**, pişirme süresi değil ama kullanıcı
beklediği için total'de görünür. Örnek:
- Summer pudding: 20 prep + 10 cook + **240 chill** → `totalMinutes: 270`
- Yoğurt mayalama: 15 prep + 0 cook + **480 fermentasyon** → `totalMinutes: 495`
- Tahinli soğuk tavuk: 10 prep + 20 cook + **60 buzdolabı** → `totalMinutes: 90`

Step'lerdeki `timerSeconds` ile total mutabık olmalı (chill timer varsa
totalMinutes o saniyeyi kapsar).

**Vegetarian/vegan integrity:**
- `vejetaryen` tag → et/balık YOK. **Et suyu / tavuk suyu / kemik suyu /
  broth / stock da et**, vejetaryen değildir. Bunun yerine `sebze suyu`
  (vegetable stock) yazarsan vejetaryen OK.
- `vegan` tag → ek olarak süt/yumurta/bal/peynir/tereyağı YOK

**isFeatured:** Batch'te **%5-10 oran** (100 tarifte 5-10 featured).
Sadece ikonik/güçlü tariflerde `true`.

**Cuisine doğruluğu, EN ÇOK BURADA HATA YAPILDI:**

| Slug örneği | Yanlış yazılırsa | Doğru |
|---|---|---|
| `manti` | `cn` (Çin) | `tr`, Kayseri Türk mantısı |
| `erzurum-cag-kebabi` | `th` (Tay) | `tr`, Erzurum bölgesel Türk kebabı |
| `hasir-kunefe` | `th` | `tr`, Hatay künefe |
| `hosmerim` | `th` | `tr`, Türk sütlü tatlı |
| `karadeniz-hamsi-kayganasi` | `th` | `tr`, Karadeniz |
| `lor-mantisi` | `cn` | `tr`, Türk |
| `firinda-karniyarik` | `cn` | `tr`, Türk klasiği |
| `pazi-kavurmasi` | `th` | `tr` |
| `klasik-menemen` | `th` | `tr` |

**Kural:** Tarif adı Türkçe ve Türkiye'de kökeni varsa cuisine `tr`.
"Mantı"yı sırf "dumpling" benzediği için `cn` yapma, Kayseri 1250'lerden
beri Türk geleneği. **Description'a "Kayseri/Karadeniz/Hatay/Antep" yazıp
cuisine `cn/th` atama inconsistency = uzmanlık algısını düşürür.**

### Mod A translations kuralları (minimum kapsam, full çeviri ayrı pass)

Mod A'da inline çeviri **minimum**:

- `title`, zorunlu (SEO floor, PROTECTED_TR_TOKENS §7'ye tabi)
- `description`, zorunlu (SEO floor, 100-200 char, 3 element)

`tipNote`, `servingSuggestion`, `ingredients`, `steps` çevirileri **bu
pass'te gerekmez**, `Recipe.translations` schema fallback desteği var,
TR primary kalır. Örnek minimum:

```typescript
translations: {
  en: {
    title: "Akçaabat Köftesi",
    description: "A Black Sea Trabzon specialty, minced beef kneaded with stale bread crumb, onion, and garlic, grilled over charcoal until browned at the edges and juicy within.",
  },
  de: {
    title: "Akçaabat Köftesi",
    description: "Eine Schwarzmeer-Spezialität aus Trabzon: Rinderhack mit altbackener Brotkrume, Zwiebel und Knoblauch verknetet und über Holzkohle gegrillt, bis die Ränder knusprig und das Innere saftig sind.",
  },
},
```

**Neden minimum?** Full çeviri (`ingredients` + `steps` + `tipNote` +
`servingSuggestion`) **ayrı bir Mod B pass'i** olarak batch tamamlandıktan
sonra yapılır. İki ayrı oturumda:

1. **Mod A (TR-focus):** Codex TR tarif yazarken doğruluğa odaklanır:
   malzeme ölçüleri, adımlar, allergen-ingredient doğruluğu, cuisine
   atama, isFeatured dengesi. title+description SEO için inline çevrilir.
2. **Mod B (çeviri-focus, ikinci review):** Aynı batch için ayrı oturumda
   tam çeviri retrofit, `docs/translations-batch-N.json` formatında.
   Bu sırada her tarif IKINCI KEZ gözden geçirilir: TR içeriği doğru mu,
   çevirisi native mi, terminoloji tutarlı mı. İki-pass yapı doğruluğu
   iki kat artırır.

Bu "iki-pass mimarisi" batch 0-3 retrofit akışıyla aynı, ispatlanmış
pattern. Yeni tarifte de aynı disiplin.

(Mod A teslim mesajı formatı §5 başında "Çıktı yeri ve teslim" altında.)

---

## 6. Mod B, Mevcut tarif çevirisi (translation retrofit)

### Scope ve default (Kerem sadece "Mod B" / "batch N çevirisi" derse)

- **Girdi:** `docs/translations-batch-N.csv` (Kerem N numarasını verir; N
  yoksa en son var olan CSV'yi kullan)
- **Çıktı:** `docs/translations-batch-N.json` (aynı N, yeni dosya)
- **Kapsam:** CSV'deki her satır için EN + DE `ingredients + steps +
  tipNote + servingSuggestion` (hangileri CSV'de eksikse)
- **YAPMA:** `title + description` JSON'a ekleme, CSV'nin
  `en_title_current` / `de_title_current` sütunlarına bak, zaten dolu.
- **Array uzunlukları:** EN/DE `ingredients` array uzunluğu CSV'deki
  `ingredient_count` kadar; `steps` array uzunluğu `step_count` kadar.
  Uyumsuzluk olursa import script CRITICAL blocker atar.

### Genel akış (batch 12 ve sonrası için standart)

Mod B tarifin `translations` alanında **title + description'ın zaten dolu
olduğu** (Mod A tarafından yazılmış) durumu ele alır. Sen yalnızca **eksik
alanları** doldurursun, tipik olarak `ingredients + steps`, bazı
tariflerde `tipNote / servingSuggestion`.

CSV'de her tarif için şu sütunları göreceksin:
- TR tabanı: `slug, title, description, type, cuisine, difficulty,
  prep_minutes, cook_minutes, total_minutes, serving_count,
  average_calories, ingredients, ingredient_count, steps, step_count,
  allergens, tags, tipNote, servingSuggestion`
- EN mevcut durum: `en_title_current, en_description_current,
  en_tipNote_current, en_servingSuggestion_current,
  en_ingredients_present (0/1), en_steps_present (0/1)`
- DE mevcut durum: aynı sütunların `de_*` karşılıkları

**Dolu olanları yeniden yazma.** `en_title_current` string dolu ise title
hazır demektir; JSON'a `en.title` koyma. `en_ingredients_present = 1` ise
ingredients hazırdır; JSON'a koyma. Tek istisna: mevcut çeviri açıkça
bozuk/eksik görünüyorsa `issues` alanına yaz, Kerem/Claude review eder.

### JSON format

```json
[
  {
    "slug": "lalanga-trakya-usulu",
    "en": {
      "tipNote": "Resting the batter for 5 minutes helps it spread more evenly in the pan.",
      "servingSuggestion": "Serve warm with white cheese and honey on the side.",
      "ingredients": [
        { "sortOrder": 1, "name": "Flour" },
        { "sortOrder": 2, "name": "Yogurt" },
        { "sortOrder": 3, "name": "Egg" },
        { "sortOrder": 4, "name": "Butter" },
        { "sortOrder": 5, "name": "Salt" }
      ],
      "steps": [
        { "stepNumber": 1, "instruction": "Whisk flour, yogurt, eggs, and salt until smooth." },
        { "stepNumber": 2, "instruction": "Rest the batter for 5 minutes." },
        { "stepNumber": 3, "instruction": "Cook thin portions in butter for a total of 8 minutes." }
      ]
    },
    "de": {
      "tipNote": "Den Teig 5 Minuten ruhen zu lassen...",
      "servingSuggestion": "...",
      "ingredients": [
        { "sortOrder": 1, "name": "Mehl" },
        ...
      ],
      "steps": [
        { "stepNumber": 1, "instruction": "Mehl, Joghurt..." },
        ...
      ]
    }
  }
]
```

### Zorunlu disiplin

1. **`title` + `description` JSON'a YAZMA**, Mod A'dan zaten dolu, CSV
   `*_title_current` / `*_description_current` sütunlarıyla doğrula
2. `en_tipNote_current` dolu → JSON'a `tipNote` yazma
3. `en_servingSuggestion_current` dolu → JSON'a `servingSuggestion` yazma
4. `en_ingredients_present = 1` → JSON'a `ingredients` yazma
5. `en_steps_present = 1` → JSON'a `steps` yazma
6. DE için aynı kurallar
7. Bir lokalde hiçbir alan eksik değilse o lokal bundle'ı hiç yazma (sadece
   karşı lokalde eksik varsa tek taraflı `en` veya `de` item OK)

### ⚠️ Format ve boş-string kapanı (Backfill-01'de yakalandı, TEKRARLAMA)

1. **ingredients object array**, string array DEĞİL:
   - ❌ YANLIŞ: `"ingredients": ["4 eggplants", "300 g ground beef"]`
   - ✅ DOĞRU: `"ingredients": [{ "sortOrder": 1, "name": "Eggplants" }, { "sortOrder": 2, "name": "Ground beef" }]`
   - Miktar/birim TR tarafında saklı, sadece `name` çevir (ingredient
     adı, rakam / unit yok)
2. **steps object array**, string array DEĞİL:
   - ❌ YANLIŞ: `"steps": ["Wash the...", "Remove..."]`
   - ✅ DOĞRU: `"steps": [{ "stepNumber": 1, "instruction": "Wash the..." }, { "stepNumber": 2, "instruction": "Remove..." }]`
3. **BOŞ `name` BIRAKMA**, Zod `min(1)` reddedecek:
   - ❌ `{ "sortOrder": 5, "name": "" }` → CRITICAL
   - TR ingredient "Karanfil" ise EN `"Cloves"`, DE `"Nelken"` yaz,
     emin değilsen `issues` array'ine not düş
4. **`tipNote` + `servingSuggestion` düz string** (object değil):
   - ✅ `"tipNote": "Let yogurt warm to room temperature..."`
   - Array değil, sadece tek string
5. Dosya adı birebir CSV ile eşleşmeli:
   - `docs/translations-batch-N.json` (Mod B ana)
   - `docs/translations-backfill-NN.json` (Backfill, NN zero-padded 01..13)

### Array uzunluk kuralı (kritik)

- `ingredients` array **uzunluğu TR ingredient sayısıyla aynı olmak
  zorunda** (CSV'de `ingredient_count` sütunu gösterir). sortOrder'lar
  1..N sırasında ve TR ile aynı sette olmalı
- `steps` array uzunluğu TR step sayısıyla aynı olmak zorunda,
  stepNumber'lar 1..N
- Uyumsuzluk varsa `scripts/import-translations-b.ts` CRITICAL olarak
  blok atar (`--force` ile override mümkün ama Kerem onayı gerekir)

### ⚠️ Batch 21 dersleri, Mod B kalite çıtası (ZORUNLU)

Batch 21'in ilk teslimi 3 sebepten tümüyle reddedildi (dosya silindi,
baştan yazıldı). Aşağıdaki 3 kalıp teslim öncesi kendi kendini check
etmen gereken şeyler:

1. **Template string yapıştırma YASAK.** 100 tarifte 100 **farklı**
   `tipNote` + `servingSuggestion` yazacaksın. Batch 21 ilk teslimi 100
   tarifte 3 unique `servingSuggestion` (`"Serve warm."`, `"Serve hot."`,
   `"Serve cold."`) ve 81 tekrar eden generic `tipNote` (`"This small
   detail helps the dish keep a better texture and flavor."`) içeriyordu
  , bu işi yapmamış sayılır. Her tarife özgü **teknik veya kültürel
   ipucu** yaz: "Let the yoğurt sit at room temperature before mixing
   to avoid curdling", "Serve alongside a dollop of thick ayran and
   pickled biber". CSV'de `tipNote_tr` / `servingSuggestion_tr` boşsa
   sen de boş bırak VEYA orijinal tarifi baz alıp gerçek bir ipucu
   üret, template doldurma.

2. **EN/DE cümlede Türkçe kelime BIRAKMA.** Batch 21 ilk teslimi 105
   alanda Türkçe kelime leak ediyordu: EN blok içinde `"Zeytinyağı"`
   (olive oil), `"Sarımsak"` (garlic/Knoblauch), step içinde `"Saute
   soganı zeytinyagında for 4 minutes."` (pidgin), DE step `"Soganı
   zeytinyagında 4 Minuten anschwitzen."` (Türkçe accusative
   eki Almanca cümlede). Teslim öncesi kendi JSON'una mental grep at:
   `Zeytin|Sarım|soğan|sogan|soganı|suyu|katıp|soteleyip|karıştırın|
   ekleyin` → eşleşme varsa düzelt. Native speaker seviyesi + kültürel
   bağlam zorunlu.

3. **Step sayısını DEĞİŞTİRME.** Batch 21 ilk teslimi 100 tarifin
   hepsinde EN/DE step count = 3 idi (TR'de 4-7 adım vardı). Adımları
   birleştirip kısaltmak YASAK. `step_count` CSV'de kaç yazıyorsa EN/DE
   aynı sayıda adım olacak, her adım TR'nin karşılığı (birebir anlam,
   özgün sıralama).

**Mod B self-check (teslimden önce 30 sn):**
- JSON'daki `en.tipNote` set'inin size'ı tarif sayısına yakın mı?
  (100 tarif → 70+ unique beklenir, 5 altı = ciddi template fill)
- `en.servingSuggestion` aynı şekilde
- `en.ingredients[].name` + `en.steps[].instruction` → Türkçe harf
  (çğıöşü) var mı? Varsa düzelt (EN özel isim hariç: "karniyarik",
  "menemen" gibi yemek adı korunur ama yardımcı fiil/isim çevrilir)
- Her slug için `en.steps.length === tr_step_count_from_csv`?

Self-check'i teslim mesajına ekle: "grep temiz / unique tipNote=82 /
step count tümü eşleşiyor".

### Biçim detayları

- UTF-8 (BOM yok), 2-space indent, pretty-print
- `issues` optional, yoksa alanı hiç yazma
- Boş string `""` veya `null` göndermek "dokunma" sinyali (güvenli
  fallback), ama daha temizi field'ı hiç yazmamak

### Tarihçe: "Full-format" varyant (yalnızca batch 0-3 için kullanıldı)

Batch 0-3 tariflerinin `translations` alanı tamamen NULL idi. O batch'te
Codex Max sıfırdan EN+DE `title + description` üretti ve `scripts/
import-translations.ts` JSON'u overwrite etti. 1100/1100 tarif prod'da
tam çeviri olduğundan **bu eski akış artık kullanılmıyor**; referans
için bırakılmıştır. Yeni batch'lerde (12+) yukarıdaki partial-merge akışı
standarttır.

### Mod B audit (çift görev)

Her tarifi okurken pattern-match'le aşağıdaki bulguları `issues` array'ine
yaz. Bu bulgular Claude tarafından review edilip fix script ile DB'ye
uygulanır.

**Issue type enum (tutarlı kullan):**
- `ingredient-allergen-mismatch`, ingredient var allergen yok / tersi.
  **Allergen enum'una bağlı kal:** GLUTEN, SUT, YUMURTA, KUSUYEMIS,
  YER_FISTIGI, SOYA, DENIZ_URUNLERI, SUSAM, KEREVIZ, HARDAL. "KABUKLU_
  AGAC_YEMISI" değil KUSUYEMIS. Brief §5 allergen enum listesi tek
  referans.
- `time-inconsistency`, SADECE `prep+cook > total` durumunda yaz.
  `prep+cook < total` NORMAL → chill/rest/fermentasyon/buzdolabı/
  dondurma süresi total'e dahil (§5 time math kuralı). Örnekler
  normal: granita (190 total, 10 prep/cook), overnight oats (490
  total, 10 prep/cook), şerbet (200 total, 20 prep/cook). **Bunlar
  issue DEĞİL.** Batch 16 Mod B'de 3 false positive flag geldi.
- `vague-language`, "biraz, azıcık, duruma göre" somut kriter yok
- `composite-ingredient`, tek row'da "Tuz, karabiber, pul biber" gibi
  virgülle 2+ malzeme
- `step-ingredient-missing`, step'te anılan malzeme ingredient listesinde yok
- `calorie-anomaly`, <50 veya >1200 (alkol hariç, çay/kahve sade içecekler
  legitimate)
- `other`, başka şüphe, detail'de açıkla

**Özellikle dikkat et (geçmişte yakalanmış pattern'ler):**
- Cuisine assignment yanlışı (§5'teki Mantı→cn örneği). CSV'de
  `cuisine: 'tr'` ama "Fransız kökenli Crema Catalana" diyorsa flag
- Ingredient listesinde yoğurt/peynir var ama allergen'de SUT yok
- "Soğanla kavurun" step ama ingredient listesinde Soğan yok
- Slug "pulled-pork-sandvic" ama ingredient "dana döş", slug/content mismatch

### Mod B çıktı teslim

```
Batch N hazır, X tarif çevrildi, Y tanesinde issue alanı bulunuyor.
İlgili slug'lar: [kısa liste]
```

### Mod B için kademeli teslim, SADECE Kerem açıkça isterse

Normal akış: **tüm JSON'u tek seferde teslim et**. Kademeli teslim sadece
Kerem "100+100+100 kademeli ilet" gibi açık talimat verirse:
1. İlk 100'ü yaz → "İlk 100 hazır" de
2. Kerem/Claude dry-run → pattern sorunu varsa söyler
3. Devam et → 2. 100 append → "2. 100 hazır"
4. Aynı şekilde 3. 100 → "batch N hazır"

Aynı dosyaya append, slug sırasını koru. **Default akışta kademeli gönderme
yapma; Mod A da Mod B de tek teslim.**

---

## 7. Kalite çıtası (her iki mod için geçerli)

### Özgün TR isim koruma (PROTECTED_TR_TOKENS, AYNEN kalır)

Aşağıdakiler EN/DE title'da **birebir korun**. Generic çeviri ("Spicy Meat
Skewer", "Turkish Dumplings") **YASAK**.

**Etler/kebaplar:** Adana Kebap, Urfa Kebap, İskender, Döner, Şiş Kebap,
Köfte, Cağ Kebabı, Beyti, Tantuni, Çöp Şiş
**Hamur:** Lahmacun, Pide, Börek, Gözleme, Simit, Poğaça, Çiğköfte, Mantı,
Yufka
**Tatlı:** Baklava, Künefe, Kadayıf, Şekerpare, Lokum, Muhallebi, Güllaç,
Revani, Sütlaç, Aşure, Kazandibi, Tulumba, Halva, Helva, Lokma, Şambali
**Kahvaltı:** Menemen, Çılbır, Sucuk, Pastırma, Kaymak
**Ana yemek:** Dolma, Sarma, Yaprak Sarma, İmam Bayıldı, Türlü, Karnıyarık,
Hünkar Beğendi, Kumpir
**Pilav:** Pilav, Bulgur Pilavı
**Meze:** Cacık, Haydari, Muhammara, Tarhana, Acılı Ezme
**İçecek:** Ayran, Şalgam, Boza, Salep, Türk Kahvesi, Şerbet, Rakı, Limonata

### PROTECTED_ALIAS, dile özgü standart yazım (aliasları kabul edilir)

- **Pilav** → EN: `Pilaf` veya `Rice` (cuisine-specific, örn. Chinese fried
  rice); DE: `Pilaw`, `Pilaf`, `Reis`
- **Humus** → EN: `Hummus`; DE: `Hummus`
- **Yoğurt** → EN: `Yogurt`, `Yoghurt`; DE: `Joghurt`

### Jenerik kullanım istisnaları (TR kelime ama proper name DEĞİL)

Bazı TR kelimeler hem proper name hem jenerik yapı olabiliyor. Jenerik
bağlamda tam çevir:
- `mantar-dolmasi` → "Stuffed Mushrooms" ✓ (proper Dolma değil, stuffed construct)
- `kakaolu-enerji-lokmalari` → "Cocoa Energy Bites" ✓ (lokma = bite, tatlı değil)
- `misir-unlu-balik-koftesi` → "Fish Cakes with Cornmeal" ✓ (köfte = patty, bölgesel değil)

**Kural:** Slug'da kelime **baş kökte + bölgesel prefix**
(Akçaabat/Adana/İnegöl köftesi, lokma-tatlisi) → TR koru. Slug'da kelime
**jenerik modifier** (mantar dolması, enerji lokmaları) → tam çevir.

### Description kalite çıtası

- **100-150 karakter tercih**, max 200, min 60
- **Üç element** zorunlu: (1) ana malzeme/teknik + (2) bölge/köken/bağlam +
  (3) doku/tat/servis
- Active voice, duyu-hissettirici (aroma, doku, sıcaklık)
- Spesifik detay ("Gaziantep", "pişmiş tereyağında kavurulmuş", "lavaş arasında")

**Banned kalıplar (CRITICAL):**
- ❌ "A Turkish dish/recipe/food." (6 kelime, sıfır bilgi)
- ❌ "A delicious Turkish..." (generic opener)
- ❌ "Delicious and healthy recipe"
- ❌ "must-try", "traditional recipe"
- ❌ "A traditional/classic/simple X" opener + description <80 char

**Soft opener (long description'da OK):** "A traditional X" kullanabilirsin
ama description >80 char olmalı ve spesifik detay içermeli.

### Dil tonları

**EN:**
- US English, color (not colour), flavor (not flavour), caramelize (not caramelise)
- "Türkiye" tercih ("Turkey" değil, modern)
- Oxford comma tutarlı kullan
- Casual-friendly food blog tonu, overly formal değil

**DE:**
- Neutral-friendly ev mutfağı tonu
- Description'da **"man" formu** ("Man grillt...", "du" değil)
- Composite isimler (Linsensuppe, Reispudding, Joghurtsoße)
- "Türkei" tercih
- Umlaut doğru (ä, ö, ü, ß)

**İyi vs kötü description, Mercimek Çorbası örneği:**

❌ `"A traditional Turkish lentil soup."` (8 kelime, placeholder)

✅ `"A velvety red-lentil soup from Anatolian home cooking, simmered with onion, carrot, and cumin, blended smooth, finished with lemon and a spoonful of chili-infused butter."` (malzeme ✓, bölge ✓, doku ✓, servis ✓, 163 char)

---

## 8. Self-review, ZORUNLU çift kontrol

Her tarif/çeviri için iki pass yap. Herhangi bir madde ❌ ise **düzelt,
sahte geçme.**

### Pass 1, İçerik doğruluğu (Mod A için yazarken, Mod B için CSV verisini okurken)

1. ✅ Slug mevcut değil + doğru format (Türkçe karakter yok, locative eki yok)?
2. ✅ `prepMinutes + cookMinutes ≈ totalMinutes` (±5 dk)?
3. ✅ Her step'te anılan ingredient listede var?
4. ✅ Her yüksek-risk ingredient için doğru allergen (§5 tablo)?
5. ✅ **Cuisine doğru, "Mantı/Erzurum Cağ/Hasır Künefe" türü Türk mutfağı
   `tr`, yanlış `cn/th` değil** (§9 tablo)?
6. ✅ Kategori + type + difficulty mantıklı?
7. ✅ `vejetaryen` tag varsa et/balık yok, `vegan` varsa süt/yumurta yok?
8. ✅ averageCalories makul (çay/kahve sade 5-50, yemek 200-700,
   tatlı 150-500)?
9. ✅ `isFeatured` sadece en güçlü 5-10 tarifte `true` (batch %5-10)?
10. ✅ Description 100-150 char + 3 element + banned kalıp yok?

### Pass 2, Çeviri kalitesi (EN + DE)

1. ✅ EN + DE title + description dolu? (Mod A minimum; ingredients/steps
   çevirisi ayrı Mod B pass'inde)
2. ✅ PROTECTED_TR_TOKENS içindeki isimler AYNEN korundu (jenerik istisna hariç)?
3. ✅ PROTECTED_ALIAS kuralları (Pilav→Pilaf, Humus→Hummus,
   Yoğurt→Yogurt/Joghurt)?
4. ✅ Description 100-200 char, 3 element, banned kalıp YOK?
5. ✅ Soft opener ("A traditional X") kullanılıyorsa description >80 char +
   spesifik detay?
6. ✅ US English (EN) + "man" formu (DE) + umlaut?
7. ✅ Tutarlılık, aynı malzeme aynı şekilde çevrilmiş (kıyma = ground beef,
   her yerde aynı)?
8. ✅ Native speaker gramer, idiomatik akış?

---

## 9. Geçmişte yakalanmış hatalar, ASLA TEKRARLAMA

Tarifle'nin batch 0-23 audit'lerinde yakalanan somut hatalar. Yeni
oturumda bunları TEKRAR yapma, özellikle allergen eksikleri
aynı kalıpta her batch'te tekrar çıkıyor (§5 tablosuna + §9 altındaki
hızlı check'e bak).

| Kategori | Hata örneği | Neden yanlış | Doğrusu |
|---|---|---|---|
| **Cuisine misassign** | `manti` cuisine `cn` | Açıklamada "Kayseri" diyor ama Çin atanmış, uzmanlık algısını düşürür | `tr` |
| **Cuisine misassign** | `erzurum-cag-kebabi` cuisine `th` | Türk bölgesel kebabı | `tr` |
| **Cuisine misassign** | `hasir-kunefe` cuisine `th` | Hatay Türk künefe | `tr` |
| **Cuisine misassign** | `firinda-karniyarik` cuisine `cn` | Klasik Türk patlıcan yemeği | `tr` |
| **Cuisine misassign** | `hosmerim`, `pazi-kavurmasi`, `klasik-menemen`, `kombe`, `sini-koftesi`, `tepsi-kebabi`, `yaprak-sarma` cuisine `th/cn` | Hepsi Türk | `tr` |
| **Slug locative** | `firinda-baharatli-tofu-kupleri` | Türkçe locative `-da` eki slug'da var | `firin-baharatli-tofu-kupleri` (kök) |
| **Özgün name kaybı** | `adana-kebap` EN title "Spicy Meat Skewer" | PROTECTED_TR_TOKENS ihlali, brand kaybı | "Adana Kebap" (TR birebir) |
| **Tag yanlış** | `samsun-kaz-tiridi` tag `vejetaryen` | Kaz eti içerik, vejetaryen olamaz | Tag kaldırılmalı |
| **Allergen eksik (batch 0-3)** | `sundubu-jjigae` susam yağı ingredient + SUSAM allergen yok | Cross-contamination riski | SUSAM eklenmeli |
| **Allergen eksik, Tereyağı→SUT (batch 11 ×5 + batch 12 ×8)** | `firik-pilavi`, `karalahana-corbasi`, `eriste-corbasi`, `yuksuk-corbasi`, `hamsili-pilav`, `nevzine`, `acik-agiz-boregi` vs. | Tereyağı dairy, SUT allergen zorunlu | `allergens: ["SUT", ...]` |
| **Allergen eksik, İrmik→GLUTEN (batch 12 ×3)** | `irmik-helvasi`, `kabak-bastisi`, `hosmerim` | İrmik = buğday semolina | `allergens: ["GLUTEN", ...]` |
| **Allergen eksik, Nişasta (generic) → GLUTEN** | `paluze-kilis`, `harire-tatlisi` | Generic "Nişasta" geleneksel olarak buğday nişastası (mısır/pirinç değilse belirt) | GLUTEN ekle VEYA ingredient adını "Mısır nişastası" yap |
| **Allergen eksik, Ayran→SUT / Yumurta→YUMURTA / Ceviz→KUSUYEMIS / Susam→SUSAM (batch 12)** | `sembusek` (Ayran), `tandir-boregi` (Yumurta), `girit-ezmesi` (Ceviz), `biberli-ekmek` (Susam) | §5'teki ingredient-implied tablosunun mekanik uygulaması kaçtı | Her high-risk ingredient için tabloya bak |
| **Vegan+dairy çelişkisi (batch 12)** | `karalahana-corbasi` tags `vegan` + ingredient Tereyağı | Vegan = süt/yumurta/bal YOK, Tereyağı dairy | `vejetaryen` (et yok ama dairy OK) |
| **Missing ingredient** | `bun-bo-hue` step 1 "soğanla kaynatın" ama ingredients'te Soğan yok | Step-ingredient mismatch | Soğan eklenmeli |
| **Generic description** | EN: "A delicious Turkish lentil soup" | 6 kelime, sıfır bilgi, placeholder prose | 100-150 char, 3 element |
| **Soft opener + thin desc** | EN: "A traditional soup." <80 char | Generic + thin | >80 char + malzeme/bölge |
| **Mid-sentence capital EN** | "From Turkish cuisine, You can make..." | ctx prefix sonrası "You" lowercase olmalı | "...you can make..." |
| **Calorie anomaly false positive** | `adacayli-elma-cayi` 24 kcal (çay için doğal) | Anomali değil, bitkisel çay düşük kalori beklenen | İssue flag ama legitimate |
| **Reverse unused** | `sambousek` ingredients'te yoğurt var ama step'te kullanılmamış | Liste-step inconsistency | Issue flag, manual review |
| **Slug/content mismatch** | `pulled-pork-sandvic` slug "pork" ama ingredient "dana döş" | TR adaptation ama slug yanıltıcı | Issue flag, Kerem karar |
| **Dosya encoding (batch 12)** | `scripts/seed-recipes.ts` Windows-1252→UTF-8 mojibake (ş→ÅŸ, ı→Ä±, emoji ðŸ¥©) | Windows'ta editör CP1252 yorumuyla açıp UTF-8 save → double-encode | UTF-8 (BOM yok) + LF, §3 "Dosya encoding" bölümüne bak |
| **Vejetaryen tag + et suyu (batch 12 Mod B)** | `ovmac-corbasi-konya-usulu` tags `vejetaryen` + ingredient `Et suyu` | Et suyu (stock/broth) et içerir, vejetaryen değil | Tag kaldırılmalı VEYA `Et suyu` → `Sebze suyu` değiştir |
| **Chill/rest totalMinutes dışı (batch 12 Mod B)** | `summer-pudding` totalMinutes 30 ama step 3 "4 saat buzdolabı" (timerSeconds 14400) | Chill/rest/marinasyon/fermentasyon totalMinutes'a dahil olmalı (kullanıcı "bu tarif ne kadar sürer" için total'a bakıyor) | `totalMinutes: prep + cook + chill` (summer-pudding → 270) |
| **Allergen eksik, Tane hardal → HARDAL (batch 23 ×3)** | `hardalli-lufer-salatasi-canakkale-usulu`, `hardal-soslu-tavuk-pie-ingiltere-usulu`, `elma-havuclu-kok-patates-salatasi-isvec-usulu` | **"Tane hardal", "Dijon hardalı", "hardal tozu" hepsi HARDAL allergen**, "hardal" keyword'ü başlıkta/açıklamada olsa bile allergen listesine eklenmemiş | `allergens: [..., "HARDAL"]` |
| **Allergen eksik, Terbiye yumurtası → YUMURTA (batch 22 ×3)** | `arpa-yarmali-yogurt-corbasi-eskisehir-usulu`, `peynirli-misir-ekmegi-balikesir-usulu`, `pao-de-queijo-waffle-brezilya-usulu` | Yoğurt çorbalarında terbiye (yumurta+yoğurt+un çırpması), ekmek/hamur işlerinde bağlayıcı yumurta → genelde radar dışı kalıyor | Ingredients'ta **Yumurta** tek satır geçse bile `YUMURTA` zorunlu |
| **Allergen eksik, İrmik ve semolina → GLUTEN (batch 20-23 toplam ×5)** | Tvorog zapekanka, Kahramanmaraş helvası, vişneli irmik tatlısı, kayısılı irmik pilavı | İrmik = buğday semolina, batch 12'de uyarılmıştı ama farklı tariflerde tekrar atlanıyor | **İrmik = GLUTEN, istisnasız** |
| **Allergen eksik, Kestane → KUSUYEMIS (batch 16-23 toplam ×3)** | `kestaneli-sutlac-bursa-usulu`, `dut-pekmezli-lor-kup-erzincan-usulu` (ceviz), `kestaneli-mantar-sote-bolu-usulu` | "Haşlanmış kestane" da kestane; tree-nut class KUSUYEMIS grubuna girer | `allergens: [..., "KUSUYEMIS"]` |
| **Mod B template spam (batch 21, dosya reddedildi)** | 100 tarifte 3 unique `servingSuggestion` (`"Serve warm."` ×67, `"Serve cold."`, `"Serve hot."`) ve 81 tekrar eden generic `tipNote` (`"This small detail helps the dish keep a better texture and flavor."`) | Her tarife aynı placeholder, kültürel/teknik ipucu YOK, brief §6 "Boş bırak, sahte doldurma" ihlali | Her tarife **özgün** 1 cümle: "Let yoğurt warm to room temperature before mixing to prevent curdling"; CSV boşsa sen de boş bırak |
| **Mod B TR leak (batch 21, dosya reddedildi)** | EN ingredient: `"Zeytinyağı"`, `"Sarımsak"`; EN step: `"Saute soganı zeytinyagında for 4 minutes."`; DE step: `"Soganı zeytinyagında 4 Minuten anschwitzen."` | Google-Translate düz çıktı, regex-replace fiil değişimi Türkçe kelimeleri olduğu gibi bırakmış, native speaker seviyesi DEĞİL | EN: `"olive oil"`, `"garlic"`, `"Sauté the onion in olive oil for 4 minutes."`; DE: `"Die Zwiebel 4 Minuten in Olivenöl anschwitzen."` |
| **Mod B step collapse (batch 21, dosya reddedildi)** | 100 tarifin hepsinde EN/DE `steps.length = 3` (TR'de 4-7 adım vardı) | Array uzunluk kuralı (§6) birebir ihlal, import script CRITICAL atar, ama dosya bu noktaya gelmeden reddedilmeli | `step_count` CSV'den oku, aynı sayıda adım yaz, her TR adımının karşılığı tek EN/DE adım |

**İkiz hata pattern (batch 11-23 tekrar tekrar):** Allergen ingredient-
implied tablosu §5'te yazılı ama her batch'te 3-10 legitimate allergen
eksiği çıkıyor. Teslim öncesi her tarif için şu hızlı check:

1. Ingredient listesinde **Tereyağı / yoğurt / peynir / süt / krema / kaşar / ayran / lor / süt ekmeği** var mı? → `SUT`
2. **Un / bulgur / irmik / semolina / kadayıf / ekmek / börek / yufka / makarna / yulaf** var mı? → `GLUTEN` (**İrmik = buğday semolina, istisnasız GLUTEN**)
3. **Yumurta / mayonez / yoğurt çorbası "terbiyesi"** var mı? → `YUMURTA` (**Terbiye = yumurta+yoğurt+un, yumurta başına allergen**)
4. **Ceviz / badem / fındık / Antep fıstığı / kaju / kestane** var mı? → `KUSUYEMIS` (**Haşlanmış kestane dahil, tree-nut class**)
5. **Yer fıstığı / fıstık ezmesi** var mı? → `YER_FISTIGI` (KUSUYEMIS'ten AYRI)
6. **Soya sosu / tofu / miso / edamame** var mı? → `SOYA`
7. **Balık / somon / karides / midye / hamsi / ton** var mı? → `DENIZ_URUNLERI`
8. **Susam / tahin / susam yağı** var mı? → `SUSAM`
9. **Tane hardal / Dijon hardalı / hardal tozu / hardal sosu** var mı? → `HARDAL` (**"hardal" kelimesi başlıkta/açıklamada yetmez, ingredient listesinde hardal varyantı varsa allergen zorunlu**)
10. `vegan` tag yazdıysan: süt/yumurta/bal YOK mu? (Tereyağı varsa → `vejetaryen`)
11. `vejetaryen` tag yazdıysan: et/balık/et suyu YOK mu?

**Mod B'de ek check (batch 21 dersi, §6 "Batch 21 dersleri"ne bak):**

12. `en.tipNote` + `en.servingSuggestion` unique count ≥ tarif sayısının
    %70'i mi? (100 tarif → 70+ unique; < 10 unique = template spam, reddedilir)
13. `en.*` + `de.*` ingredient/step alanlarında Türkçe harf (çğıöşü) veya
    "Zeytinyağı / Sarımsak / soğan / soganı / suyu / katıp / soteleyip"
    leak var mı? Varsa düzelt
14. Her slug'ın `en.steps.length` === CSV `step_count` mi? Farklıysa
    adımları kısaltma/birleştirme, TR ile birebir sayıda yaz

**Altın kural:** "Türkçe isim + bölgesel açıklama
(Kayseri/Hatay/Antep/Trabzon/Erzurum/Gaziantep/Karadeniz) varsa cuisine `tr`,
istisnası yok." Uzmanlık algısı bu tutarlılıktan geliyor.

---

## 10. Asla yapılmayacaklar (kesin yasak)

- ❌ `git commit`, `git push`, `git add`, Kerem/Claude yapar
- ❌ `npm run db:*`, `prisma migrate`, `--apply`, `--confirm-prod`, seed
  script çalıştırma
- ❌ Mevcut 1300+ tarifi silme/değiştirme (append-only)
- ❌ `src/`, `prisma/`, `messages/`, `.env*` dosyalarına yazma
- ❌ `docs/existing-slugs.txt` regen (Claude yapar seed sonrası)
- ❌ Yeni kategori/tag/allergen/cuisine kodu ekleme (var olanı kullan)
- ❌ Değişkenlik bırakma ("A traditional X" thin desc), sahte çeviri
  ("Muhallebi is a muhallebi"), Google Translate output
- ❌ Cuisine mantığını kırma ("Mantı = Çinli dumpling, cuisine `cn`" →
  HAYIR, Türk tarifi)
- ❌ PROTECTED_TR_TOKENS çiğneme ("Spicy Meat Skewer" gibi çeviri)
- ❌ **Mod B'de `title` + `description` JSON'a yazma**, CSV
  `en/de_*_current` sütunları dolu ise zaten Mod A'dan gelen çeviri var;
  override etmek altyapı regression'u
- ❌ `scripts/seed-recipes.ts` mojibake-encoded kaydetme (§3 Dosya
  encoding), UTF-8 (BOM yok) + LF zorunlu

---

## 11. İlk mesaj protokolü

Bu mesajı okuduğunda:

1. **"Anladım."** diye kısa onay ver
2. **Kerem'in ilk mesajına bak**, üstteki "Hızlı tetikleyici" tablosu
   büyük ihtimalle yanıtı çözüyor:
   - "Mod A" / "batch N yaz" / "yeni batch" → §5 default'uyla direkt başla
     (100 tarif, 70 TR + 30 uluslararası, isFeatured 5-10). Soru sorma.
   - "Mod B" / "batch N çevirisi" / "translations-batch-N.csv işle" →
     §6 default'uyla direkt başla (CSV oku → JSON üret, ingredients + steps
     + tipNote + servingSuggestion EN/DE; title+description YAZMA). Soru sorma.
3. **Net olmayan durumlar için soru sor** (örnekler):
   - Kerem sayı vermedi ve default'tan farklı istediğini ima etti ("biraz
     az yaz") → "Kaç tarif? Default 100" diye teyit et
   - Kerem belirli kategori istedi ama sayı belirsiz ("biraz tatlı") → "Kaç
     tatlı?" diye sor
   - Belirli alan/kural hakkında emin değilsen (cuisine ataması, allergen
     çıkarım, bölge eşleştirme) spesifik tarif bazında sor
4. Kerem açık mesaj verirse (örn. "50 kokteyl yaz"), default'u unut, talimatı
   uygula

**Yaygın hata:** Her seferinde "Mod A mı B mi?" diye sormak, Kerem çoğu
oturumda mod adını veya girdi dosyasını direkt söyler. Tetikleyici tablosu
açıksa soru sorma.

Başarılar. **Doğruluk her zaman 1. plan.**
