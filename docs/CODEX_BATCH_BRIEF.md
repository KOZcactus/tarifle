# Tarifle — Codex Oturum Talimatı (Yeni Tarif VEYA Çeviri Retrofit)

> Bu doküman birden fazla session boyunca kullanılır. Her oturumda ilk önce
> oku, sonra Kerem sana hangi modda çalışacağını (A ya da B) söyleyecek.
> Oturum sıfırdan başlasa bile bu tek dosya yeterli — proje tanıtımı + her
> iki iş tipi + çift kontrol + geçmişte yakalanan somut hataların tablosu.

---

## 🎯 Mutlak öncelik: **DOĞRULUK > HIZ > KAPSAM**

- Şüphede kaldıysan **çevirme / yazma — issues alanına yaz**, Kerem/Claude review eder.
- Google Translate / DeepL düz çıktı **YASAK**. Native speaker seviyesi + kültürel bağlam zorunlu.
- Veri yanlışlığı "bilgi yokluğu"ndan daha kötüdür. Boş bırak, sahte doldurma.
- **Her çıktıyı 2 kere kontrol et** (§8 checklist).

---

## 1. Proje tanıtımı

**Tarifle** (https://tarifle.app) — Türkçe modern tarif platformu. Yemek +
içecek + kokteyl. **1100 canlı tarif** (Nisan 2026). Faz 3 aktif. i18n TR +
EN soft launch canlı (DE retrofit tamamlandı).

**Tech stack** (bilmen yeterli):
- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 7 ORM, **Neon PostgreSQL** (dev + prod branch ayrı)
- Auth.js v5, Vercel deploy, Cloudflare DNS
- next-intl (cookie-based NEXT_LOCALE + User.locale DB)
- GitHub: **KOZcactus/tarifle** (private repo)

**Canlı durum:**
- **1100 tarif prod'da**, 24 mutfak kodu, 17 kategori, 10 allergen, 15 tag
- **1100/1100 tarif EN + DE çevirisi tamam** (Recipe.translations JSONB dolu)
- Retrofit %100 — yeni batch'lerde çeviriler ZORUNLU olacak
- Faz 3: admin paneli + Review v2 + Sentry + Fuzzy arama + OG image i18n +
  SEO meta i18n — hepsi canlı

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
- `src/` — frontend/backend kodu (Claude'un alanı)
- `scripts/` dışındaki tüm diğer scriptler (`scripts/seed-recipes.ts` dışında)
- `messages/` — i18n keys
- `prisma/` — schema + migrations
- `.env*` — secrets
- `docs/existing-slugs.txt` — Claude regen'liyor
- `docs/RECIPE_FORMAT.md`, `docs/CODEX_HANDOFF.md` — bunları **oku**, yazma

### ❌ Kesin yasaklar:
- `git commit`, `git push`, `git add` — **YOK**. Sen dosyayı yaz, bırak;
  Kerem/Claude halleder
- `npm run db:*`, `prisma migrate`, `--apply`, `--confirm-prod` — **HİÇBİR
  destructive komut**
- Prod DB erişimi, `.env.production.local` okuma
- Mevcut tarifleri silme/değiştirme (append-only)

---

## 4. Oturum modu

Kerem sana şunlardan birini söyleyecek:

### 🍳 **Mod A — Yeni TR tarif yazma** → §5'e atla
- Kerem "Batch 12 için 100 yeni TR tarif yaz" der
- Çıktı: `scripts/seed-recipes.ts` append + inline `translations` her tarifte

### 🌍 **Mod B — Mevcut tarif çevirisi (translation retrofit)** → §6'ya atla
- Kerem "docs/translations-batch-N.csv işle" der
- Çıktı: `docs/translations-batch-N.json` (yeni dosya)

Her iki modda §7 kalite kıstası + §8 self-review + §9 geçmiş hata listesi geçerli.

---

## 5. Mod A — Yeni TR tarif yazma

### Scope
- Kerem sayı verir (tipik 100). Türk mutfağı %70+, uluslararası eksik
  mutfaklardan çeşitlilik
- Mevcut 1100 slug'ı tekrarlama: `docs/existing-slugs.txt` zorunlu kontrol

### Çıktı yeri
`scripts/seed-recipes.ts` dosyasındaki `export const recipes = [...]`
array'inin **sonuna append**. Mevcut tarifleri silme. Batch başlangıcına
`// ── BATCH N ──` yorumu koy.

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
- `GLUTEN` — un, bulgur, buğday, ekmek, makarna, yufka, kadayıf, tarhana,
  bayat ekmek, firik, dövme buğday, yulaf
- `SUT` — süt, yoğurt, peynir, tereyağı, krema, kaymak, labne, ayran, kefir
- `YUMURTA` — yumurta, ev yapımı mayonez
- `KUSUYEMIS` — ceviz, badem, fındık, Antep fıstığı, kaju, kestane
- `YER_FISTIGI` — yer fıstığı, fıstık ezmesi (KUSUYEMIS'ten AYRI)
- `SOYA` — soya sosu, tofu, edamame, miso
- `DENIZ_URUNLERI` — balık, karides, midye, ahtapot, kalamar, hamsi, somon,
  ton, yengeç
- `SUSAM` — susam, tahin, susam yağı
- **İstisna:** Hindistan cevizi sütü/badem sütü/yulaf sütü SUT DEĞİL.
  Badem sütü = KUSUYEMIS, yulaf sütü = GLUTEN.

**Time math:** `prepMinutes + cookMinutes ≈ totalMinutes` (±5 dk).
Dinlendirme/soğutma totalMinutes'a dahil olmalı.

**Vegetarian/vegan integrity:**
- `vejetaryen` tag → et/balık YOK
- `vegan` tag → ek olarak süt/yumurta/bal/peynir YOK

**isFeatured:** Batch'te **%5-10 oran** (100 tarifte 5-10 featured).
Sadece ikonik/güçlü tariflerde `true`.

**Cuisine doğruluğu — EN ÇOK BURADA HATA YAPILDI:**

| Slug örneği | Yanlış yazılırsa | Doğru |
|---|---|---|
| `manti` | `cn` (Çin) | `tr` — Kayseri Türk mantısı |
| `erzurum-cag-kebabi` | `th` (Tay) | `tr` — Erzurum bölgesel Türk kebabı |
| `hasir-kunefe` | `th` | `tr` — Hatay künefe |
| `hosmerim` | `th` | `tr` — Türk sütlü tatlı |
| `karadeniz-hamsi-kayganasi` | `th` | `tr` — Karadeniz |
| `lor-mantisi` | `cn` | `tr` — Türk |
| `firinda-karniyarik` | `cn` | `tr` — Türk klasiği |
| `pazi-kavurmasi` | `th` | `tr` |
| `klasik-menemen` | `th` | `tr` |

**Kural:** Tarif adı Türkçe ve Türkiye'de kökeni varsa cuisine `tr`.
"Mantı"yı sırf "dumpling" benzediği için `cn` yapma — Kayseri 1250'lerden
beri Türk geleneği. **Description'a "Kayseri/Karadeniz/Hatay/Antep" yazıp
cuisine `cn/th` atama inconsistency = uzmanlık algısını düşürür.**

### Mod A translations kuralları

Her tarife inline `translations: { en: {...}, de: {...} }` ekle. Minimum
`title` + `description`. Kurallar §7'de.

### Mod A çıktı teslim

```
Batch N hazır — 100 tarif + EN/DE çeviri.
- Eklendi: scripts/seed-recipes.ts (append only)
- Özet: 70 TR + 30 uluslararası (breakdown: 5 İtalyan, 4 Japon, ...)
- isFeatured: 8 tarif
- Self-review pass 1 + 2 temiz, bulunan issue yok / şu slug'larda şu noktalar
  review gerek
```

---

## 6. Mod B — Mevcut tarif çevirisi (translation retrofit)

### Scope
- Kerem CSV dosya adı verir: `docs/translations-batch-N.csv`
- Sen JSON üretirsin: `docs/translations-batch-N.json`
- CSV kolonları: slug, title, description, type, cuisine, difficulty,
  süreler, kalori, ingredients (full amount+unit), steps, allergens, tags,
  tipNote, servingSuggestion

### JSON format (birebir)

```json
[
  {
    "slug": "adana-kebap",
    "en": {
      "title": "Adana Kebap",
      "description": "A charcoal-grilled classic from Adana in southern Türkiye, shaping spicy minced meat with tail fat, sumac onion, and cumin around wide flat skewers, served with lavash and grilled peppers."
    },
    "de": {
      "title": "Adana Kebap",
      "description": "Ein über Holzkohle gegrillter Klassiker aus Adana im Süden der Türkei, bei dem würziges Hackfleisch mit Schwanzfett, Sumach-Zwiebel und Kreuzkümmel um breite flache Spieße geformt und mit Lavasch und gegrillten Paprika serviert wird."
    },
    "issues": [
      { "type": "ingredient-allergen-mismatch", "detail": "..." }
    ]
  }
]
```

- UTF-8, 2-space indent, pretty-print
- `issues` optional — yoksa alanı hiç yazma

### Mod B audit (çift görev)

Her tarifi okurken pattern-match'le aşağıdaki bulguları `issues` array'ine
yaz. Bu bulgular Claude tarafından review edilip fix script ile DB'ye
uygulanır.

**Issue type enum (tutarlı kullan):**
- `ingredient-allergen-mismatch` — ingredient var allergen yok / tersi
- `time-inconsistency` — prep+cook vs total uyumsuz, ya da chill/rest time
  total'da yok
- `vague-language` — "biraz, azıcık, duruma göre" somut kriter yok
- `composite-ingredient` — tek row'da "Tuz, karabiber, pul biber" gibi
  virgülle 2+ malzeme
- `step-ingredient-missing` — step'te anılan malzeme ingredient listesinde yok
- `calorie-anomaly` — <50 veya >1200 (alkol hariç, çay/kahve sade içecekler
  legitimate)
- `other` — başka şüphe, detail'de açıkla

**Özellikle dikkat et (geçmişte yakalanmış pattern'ler):**
- Cuisine assignment yanlışı (§5'teki Mantı→cn örneği). CSV'de
  `cuisine: 'tr'` ama "Fransız kökenli Crema Catalana" diyorsa flag
- Ingredient listesinde yoğurt/peynir var ama allergen'de SUT yok
- "Soğanla kavurun" step ama ingredient listesinde Soğan yok
- Slug "pulled-pork-sandvic" ama ingredient "dana döş" — slug/content mismatch

### Mod B çıktı teslim

```
Batch N hazır — X tarif çevrildi, Y tanesinde issue alanı bulunuyor.
İlgili slug'lar: [kısa liste]
```

### Pilot-then-append akışı (önerilen)

Kerem "100+100+100 kademeli ilet" derse:
1. İlk 100'ü yaz → "İlk 100 hazır" de
2. Kerem/Claude dry-run → pattern sorunu varsa söyler
3. Devam et → 2. 100 append → "2. 100 hazır"
4. Aynı şekilde 3. 100 → "batch N hazır"

Aynı dosyaya append, slug sırasını koru.

---

## 7. Kalite çıtası (her iki mod için geçerli)

### Özgün TR isim koruma (PROTECTED_TR_TOKENS — AYNEN kalır)

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

### PROTECTED_ALIAS — dile özgü standart yazım (aliasları kabul edilir)

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
- US English — color (not colour), flavor (not flavour), caramelize (not caramelise)
- "Türkiye" tercih ("Turkey" değil — modern)
- Oxford comma tutarlı kullan
- Casual-friendly food blog tonu, overly formal değil

**DE:**
- Neutral-friendly ev mutfağı tonu
- Description'da **"man" formu** ("Man grillt...", "du" değil)
- Composite isimler (Linsensuppe, Reispudding, Joghurtsoße)
- "Türkei" tercih
- Umlaut doğru (ä, ö, ü, ß)

**İyi vs kötü description — Mercimek Çorbası örneği:**

❌ `"A traditional Turkish lentil soup."` (8 kelime, placeholder)

✅ `"A velvety red-lentil soup from Anatolian home cooking — simmered with onion, carrot, and cumin, blended smooth, finished with lemon and a spoonful of chili-infused butter."` (malzeme ✓, bölge ✓, doku ✓, servis ✓, 163 char)

---

## 8. Self-review — ZORUNLU çift kontrol

Her tarif/çeviri için iki pass yap. Herhangi bir madde ❌ ise **düzelt,
sahte geçme.**

### Pass 1 — İçerik doğruluğu (Mod A için yazarken, Mod B için CSV verisini okurken)

1. ✅ Slug mevcut değil + doğru format (Türkçe karakter yok, locative eki yok)?
2. ✅ `prepMinutes + cookMinutes ≈ totalMinutes` (±5 dk)?
3. ✅ Her step'te anılan ingredient listede var?
4. ✅ Her yüksek-risk ingredient için doğru allergen (§5 tablo)?
5. ✅ **Cuisine doğru — "Mantı/Erzurum Cağ/Hasır Künefe" türü Türk mutfağı
   `tr`, yanlış `cn/th` değil** (§9 tablo)?
6. ✅ Kategori + type + difficulty mantıklı?
7. ✅ `vejetaryen` tag varsa et/balık yok, `vegan` varsa süt/yumurta yok?
8. ✅ averageCalories makul (çay/kahve sade 5-50, yemek 200-700,
   tatlı 150-500)?
9. ✅ `isFeatured` sadece en güçlü 5-10 tarifte `true` (batch %5-10)?
10. ✅ Description 100-150 char + 3 element + banned kalıp yok?

### Pass 2 — Çeviri kalitesi (EN + DE)

1. ✅ EN + DE title + description dolu?
2. ✅ PROTECTED_TR_TOKENS içindeki isimler AYNEN korundu (jenerik istisna hariç)?
3. ✅ PROTECTED_ALIAS kuralları (Pilav→Pilaf, Humus→Hummus,
   Yoğurt→Yogurt/Joghurt)?
4. ✅ Description 100-200 char, 3 element, banned kalıp YOK?
5. ✅ Soft opener ("A traditional X") kullanılıyorsa description >80 char +
   spesifik detay?
6. ✅ US English (EN) + "man" formu (DE) + umlaut?
7. ✅ Tutarlılık — aynı malzeme aynı şekilde çevrilmiş (kıyma = ground beef,
   her yerde aynı)?
8. ✅ Native speaker gramer, idiomatik akış?

---

## 9. Geçmişte yakalanmış hatalar — ASLA TEKRARLAMA

Tarifle'nin batch 0-3 audit'inde şu hatalar yakalandı. Yeni oturumda bunları
TEKRAR yapma:

| Kategori | Hata örneği | Neden yanlış | Doğrusu |
|---|---|---|---|
| **Cuisine misassign** | `manti` cuisine `cn` | Açıklamada "Kayseri" diyor ama Çin atanmış — uzmanlık algısını düşürür | `tr` |
| **Cuisine misassign** | `erzurum-cag-kebabi` cuisine `th` | Türk bölgesel kebabı | `tr` |
| **Cuisine misassign** | `hasir-kunefe` cuisine `th` | Hatay Türk künefe | `tr` |
| **Cuisine misassign** | `firinda-karniyarik` cuisine `cn` | Klasik Türk patlıcan yemeği | `tr` |
| **Cuisine misassign** | `hosmerim`, `pazi-kavurmasi`, `klasik-menemen`, `kombe`, `sini-koftesi`, `tepsi-kebabi`, `yaprak-sarma` cuisine `th/cn` | Hepsi Türk | `tr` |
| **Slug locative** | `firinda-baharatli-tofu-kupleri` | Türkçe locative `-da` eki slug'da var | `firin-baharatli-tofu-kupleri` (kök) |
| **Özgün name kaybı** | `adana-kebap` EN title "Spicy Meat Skewer" | PROTECTED_TR_TOKENS ihlali — brand kaybı | "Adana Kebap" (TR birebir) |
| **Tag yanlış** | `samsun-kaz-tiridi` tag `vejetaryen` | Kaz eti içerik, vejetaryen olamaz | Tag kaldırılmalı |
| **Allergen eksik** | `sundubu-jjigae` susam yağı ingredient + SUSAM allergen yok | Cross-contamination riski | SUSAM eklenmeli |
| **Missing ingredient** | `bun-bo-hue` step 1 "soğanla kaynatın" ama ingredients'te Soğan yok | Step-ingredient mismatch | Soğan eklenmeli |
| **Generic description** | EN: "A delicious Turkish lentil soup" | 6 kelime, sıfır bilgi, placeholder prose | 100-150 char, 3 element |
| **Soft opener + thin desc** | EN: "A traditional soup." <80 char | Generic + thin | >80 char + malzeme/bölge |
| **Mid-sentence capital EN** | "From Turkish cuisine, You can make..." | ctx prefix sonrası "You" lowercase olmalı | "...you can make..." |
| **Calorie anomaly false positive** | `adacayli-elma-cayi` 24 kcal (çay için doğal) | Anomali değil, bitkisel çay düşük kalori beklenen | İssue flag ama legitimate |
| **Reverse unused** | `sambousek` ingredients'te yoğurt var ama step'te kullanılmamış | Liste-step inconsistency | Issue flag, manual review |
| **Slug/content mismatch** | `pulled-pork-sandvic` slug "pork" ama ingredient "dana döş" | TR adaptation ama slug yanıltıcı | Issue flag, Kerem karar |

**Altın kural:** "Türkçe isim + bölgesel açıklama
(Kayseri/Hatay/Antep/Trabzon/Erzurum/Gaziantep/Karadeniz) varsa cuisine `tr`,
istisnası yok." Uzmanlık algısı bu tutarlılıktan geliyor.

---

## 10. Asla yapılmayacaklar (kesin yasak)

- ❌ `git commit`, `git push`, `git add` — Kerem/Claude yapar
- ❌ `npm run db:*`, `prisma migrate`, `--apply`, `--confirm-prod`, seed
  script çalıştırma
- ❌ Mevcut 1100 tarifi silme/değiştirme (append-only)
- ❌ `src/`, `prisma/`, `messages/`, `.env*` dosyalarına yazma
- ❌ `docs/existing-slugs.txt` regen (Claude yapar seed sonrası)
- ❌ Yeni kategori/tag/allergen/cuisine kodu ekleme (var olanı kullan)
- ❌ Değişkenlik bırakma ("A traditional X" thin desc), sahte çeviri
  ("Muhallebi is a muhallebi"), Google Translate output
- ❌ Cuisine mantığını kırma ("Mantı = Çinli dumpling, cuisine `cn`" →
  HAYIR, Türk tarifi)
- ❌ PROTECTED_TR_TOKENS çiğneme ("Spicy Meat Skewer" gibi çeviri)

---

## 11. İlk mesaj protokolü

Bu mesajı okuduğunda:

1. **"Anladım."** de
2. Belirsizlikler varsa şunları sor (önerilen):
   - "Bu oturumda Mod A (yeni tarif yazma) mı, Mod B (çeviri retrofit) mı?"
   - Belirli alan/kural hakkında emin değilsen spesifik sor
3. Kerem mod + girdi dosyası bilgisini verince başla

Başarılar. **Doğruluk her zaman 1. plan.**
