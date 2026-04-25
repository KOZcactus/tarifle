# Diyet Skoru Özelliği, Plan Dokümanı

> Oturum 20'de yazıldı (25 Nis 2026). Kerem vizyonu: "Kullanıcı diyetine
> göre her tarife hedef skor. Düşük şeker, yüksek lifli, vejeteryan dengeli
> gibi profiller. Kullanıcı dostu + modern + doğru sonuçlar."
>
> Bu doküman implementasyondan önce plan anlaşmasını yakalar. Her faz ayrı
> onay aşaması, faz başlarken bu doküman güncelleme referansı.

## 1. Problem ve Vizyon

**Kullanıcı cümlesi**: "Besin değeri benim diyetime göre hedef skor
(düşük-şeker, yüksek-lifli, vejeteryan dengeli)."

**Açılım**:
- Her tarifin kullanıcının seçtiği diyet profiline göre **0-100 skor**
- Skor tarif detayında **breakdown** göstersin (hangi kriter kaç puan getirdi)
- Tarif kartlarında **badge** olarak görünsün (opt-in veya user profile'a göre)
- Listeleme + AI Asistan + haftalık menü planlayıcı **skorla sıralanabilsin**
- Skor **doğru** olsun, placebo değil; scientific backing'li nutrition data

**Non-goals (bu feature kapsamı dışı)**:
- Medikal öneri veya tıbbi tavsiye (disclaimer gösterilecek)
- Makrolardan uzak bütüncül beslenme koçluğu (vitamin/mineral micro-scoring Faz 3)
- Gerçek zamanlı kalori sayma / kan şekeri takibi / CGM entegrasyonu
- AI LLM ile skor hesaplama (rule-based + nutrition DB yeterli, Kerem'in "AI
  hissi" prensibi, maliyet-sıfır kalıcı hedef)

## 2. Mevcut Veri Envanteri

### `Recipe` tablosu (per-serving)
| Alan | Tip | Dolu? | Kullanılabilir mi? |
|---|---|---|---|
| `averageCalories` | Int | Çoğunlukla | ✅ Tam kullanılabilir |
| `protein` | Decimal(5,1) | Retrofit sonrası %95+ | ✅ |
| `carbs` | Decimal(5,1) | Aynı | ✅ |
| `fat` | Decimal(5,1) | Aynı | ✅ |
| `hungerBar` | Int(1-10) | Çoğunlukla | ✅ Satiety proxy |
| `servings` | Int | Dolu | ✅ Per-porsiyon hesap için |

### `NutritionData` tablosu (per-100g ingredient bazı)
| Alan | Tip | Durum |
|---|---|---|
| `name` | String | Unique key |
| `caloriesPer100g` | Decimal(7,2) | ✅ |
| `proteinPer100g` | Decimal(5,2) | ✅ |
| `carbsPer100g` | Decimal(5,2) | ✅ |
| `fatPer100g` | Decimal(5,2) | ✅ |
| `gramsPerUnit` | Decimal(7,2) | Opsiyonel, "1 adet yumurta = 50 g" gibi |

### `User` (diyet tercihi için)
- `favoriteTags` (String[]), `allergenAvoidances` (Allergen[]), `favoriteCuisines` (String[])
- `locale`, `ttsVoicePreference`, `pantryExpiryTracking`
- **`dietProfile` yok, eklenecek**

### Mevcut diyet sistemi (`src/lib/diets.ts`)
- 5 preset (vegan, vegetarian, gluten-free, lactose-free, keto)
- **Sadece tag-match** (e.g. "vegan" tag'i olan tarifler) + allergen exclude
- **Skor yok**, binary filter
- AI Asistan + menu planner'da aktif kullanılıyor

### Büyük Eksiklikler
- ❌ **Sugar (şeker, g)**, NutritionData kolonunda yok
- ❌ **Fiber (lif, g)**, YOK
- ❌ **Sodium (sodyum, mg)**, YOK
- ❌ **Saturated fat (doymuş yağ, g)**, YOK
- ❌ **Glycemic load**, türetilebilir ama kaynak sugar+fiber+carbs gerek
- ❌ `RecipeIngredient.amount` **free-text String** ("1 su bardağı", "500 gr",
  "2-3 tane") → gram'a parsing mantığı gerekli (ayrı iş paketi)

### Veri doğruluk riski
- NutritionData **bazı ingredient'lar için eksik**, aggregate skor için
  fallback stratejisi şart (kullanıcıya "yaklaşık" disclaimer)
- `amount` parse başarısı tarifin ne kadar doğru skorlanacağını direkt
  belirler; "1 tutam tuz" → `~2 g` gibi conversion table lazım

## 3. Diyet Profili Kataloğu

### Faz 1'de hemen yapılabilir (mevcut veri yeterli)

| Slug | Ad | Kriter | Güvenilirlik |
|---|---|---|---|
| `dengeli` | Dengeli Beslenme | Protein %15-25, Carbs %45-55, Fat %25-35, kcal 350-650/porsiyon | Yüksek |
| `yuksek-protein` | Yüksek Protein | ≥25g protein/porsiyon, kcal:protein oranı ≤15 | Yüksek |
| `dusuk-kalori` | Düşük Kalori | ≤400 kcal/porsiyon, yüksek hungerBar (≥6) bonus | Yüksek |
| `vejetaryen-dengeli` | Vejetaryen Dengeli | Vegetarian tag + protein ≥15g + balanced macros | Yüksek |
| `vegan-dengeli` | Vegan Dengeli | Vegan tag + protein ≥12g (plant-protein düşük yoğunluk) + B12-flag | Orta (B12 sinyali eksik) |

### Faz 2'de yapılabilir (data enrichment sonrası)

| Slug | Ad | Kriter | Veri bağımlılığı |
|---|---|---|---|
| `dusuk-seker` | Düşük Şeker | ≤10g sugar/porsiyon, eklenen şeker vurgusu | ⚠️ Sugar enrichment |
| `yuksek-lif` | Yüksek Lif | ≥8g fiber/porsiyon, tam tahıl bonus | ⚠️ Fiber enrichment |
| `dusuk-sodyum` | Düşük Sodyum (Kalp) | ≤600mg sodium/porsiyon | ⚠️ Sodium enrichment |
| `akdeniz` | Akdeniz Diyeti | Zeytinyağı, balık, tahıl, yüksek lif, düşük sat-fat | Fiber + sat-fat |
| `keto-hassas` | Keto Hassas | ≤10g net carb (carbs-fiber), fat ≥70% | Fiber |

### Faz 3'te yapılabilir (opsiyonel)

- `dash`, DASH diyeti (K, Mg, Ca micronutrient scoring)
- `low-fodmap`, IBS, FODMAP sınıflandırma (tamamen ayrı DB)
- `hamile-emziren`, folat, demir, B12 vurgusu
- `yasli-osteoporoz`, Ca, D3, protein
- `custom`, kullanıcı kendi weight'lerini seçer

## 4. Skor Algoritması (Matematiksel)

### Genel formül

Skor = Σ(criterion_i.weight × criterion_i.fit(recipe))

Her diyet profili için weight dağılımı + fit fonksiyonları tanımlı. Skor
**0-100**, eşikler:
- **85-100**: Mükemmel uyum 🟢
- **70-84**: İyi uyum 🟢
- **50-69**: Orta uyum 🟡
- **30-49**: Zayıf uyum 🟠
- **0-29**: Uyumsuz 🔴

### `fit()` fonksiyonları (smooth scoring, binary yok)

```
// Target range: [min, ideal, max]
fit_range(value, {min, ideal, max}):
  if value >= ideal and value <= max:
    return 1.0 - (value - ideal) / (max - ideal) * 0.3  // hafif ceza
  if value >= min and value < ideal:
    return (value - min) / (ideal - min)               // yukarı doğru artış
  if value > max:
    return max(0, 1.0 - (value - max) / max)           // ceza
  return 0

fit_upper(value, threshold):  // düşük-şeker gibi
  if value <= threshold: return 1.0
  return max(0, 1.0 - (value - threshold) / threshold)

fit_lower(value, threshold):  // yüksek-protein gibi
  if value >= threshold: return 1.0
  return value / threshold
```

### Örnek: "Vejetaryen Dengeli" skoru

```
weights = {
  isVegetarianTag: 30,       // tag match, binary
  proteinAdequate: 25,       // fit_lower(protein, 15g)
  macroBalance: 20,          // protein%15-25 + carbs%45-55 + fat%25-35 triple fit
  calorieRange: 15,          // fit_range(kcal, {350, 500, 650})
  hungerBar: 10              // fit_range(hungerBar, {5, 7, 10})
}

score = Σ weight × fit
```

### Örnek: "Düşük Şeker" skoru (Faz 2)

```
weights = {
  sugarLow: 50,              // fit_upper(sugar, 10g)
  glycemicLoad: 20,          // türev: (carbs - fiber) × GI
  fiberBonus: 15,            // fit_lower(fiber, 5g)
  calorieReasonable: 10,     // fit_range(kcal, {300, 450, 600})
  refinedCarbPenalty: 5      // ingredient'lerde beyaz un/pirinç/şeker varsa -
}
```

### Skoru cache'leme

Her (recipe, dietSlug) çifti için skor **deterministic** (recipe nutrition
değişmedikçe aynı). Pre-compute tabloda tut:

```prisma
model RecipeDietScore {
  id         String   @id @default(cuid())
  recipeId   String
  dietSlug   String   @db.VarChar(50)
  score      Int      // 0-100
  breakdown  Json     // { criterion: {score, max}, ... }
  computedAt DateTime @default(now())
  recipe     Recipe   @relation(fields: [recipeId], references: [id], onDelete: Cascade)
  @@unique([recipeId, dietSlug])
  @@index([dietSlug, score(sort: Desc)])
  @@map("recipe_diet_scores")
}
```

- Recipe eklendiğinde / nutrition güncellendiğinde otomatik recompute
- Her diyet için 3452 × 5 = 17260 satır (Faz 1), Faz 2'de 34520 satır, küçük
- Query: `WHERE dietSlug='dusuk-seker' ORDER BY score DESC LIMIT 20` milisaniye

## 5. Data Enrichment Stratejisi (Faz 2, en kritik)

### Kaynaklar

| Kaynak | Lisans | Avantaj | Dezavantaj |
|---|---|---|---|
| **USDA FoodData Central** | Public domain | 300k+ food, detaylı macro+micro, serbest kullanım | İngilizce, Türk yemekleri tam eşleşmez |
| **Open Food Facts** | ODbL | Crowdsourced, Türk ürünleri de var | Kalite tutarsız, brand-bound |
| **Türkiye Beslenme Bilgi Sistemi (TBBS)** | Kamusal | Türk-spesifik | API zayıf, manuel işi çok |
| **Cronometer / MyFitnessPal scrape** | Yasaklı | Büyük DB | TOS ihlali, kapı dışı |

**Önerim**: **USDA FoodData Central** + Türkçe ingredient → English mapping
tablosu. Başlangıç için top 500 ingredient covers ~95% tarif.

### Mapping pipeline

```
1. scripts/build-ingredient-coverage.ts
   → recipe_ingredients'dan unique ingredient list (LOWER + normalized)
   → frequency sort, top 500'ü hedefle
   → JSON manifest: [{ name: "domates", frequency: 2341, mappedTo: null }]

2. scripts/map-ingredients-to-usda.ts
   → Her unique ingredient için USDA API search
   → En benzer sonucu seç (fuzzy match + manual override)
   → Manuel liste: docs/ingredient-usda-mapping.csv
   → Kerem editörlük review, Eren destekli

3. scripts/enrich-nutrition-data.ts
   → Mapping'e göre NutritionData tablosuna sugar/fiber/sodium/satFat/glycemicIndex
     alanları eklenir (migration + upsert)
   → Source field: "USDA:<fdcId>" veya "manual"

4. scripts/compute-recipe-diet-scores.ts
   → Her tarifin malzemelerini parse et (amount → gram),
     NutritionData'dan sugar/fiber/sodium agregele et (per-porsiyon)
   → RecipeDietScore tablosunu doldur
```

### Amount → gram conversion tablosu

Kritik, `amount` free-text string. Örnekler:
- "1 su bardağı" → 200 ml (sıvı), 150 g un, 180 g şeker (ingredient-specific)
- "2 yemek kaşığı" → 30 ml / 20 g tuz / 15 g un
- "500 gr" → 500 g (direct)
- "3-4 diş" sarımsak → ~12 g
- "1 tutam" → 1-2 g
- "orta boy" domates → 150 g

Conversion tablosu (`src/lib/nutrition/unit-convert.ts`) yazılmalı:

```ts
export const UNIT_CONVERSIONS = {
  "su bardağı": { volumeMl: 200, grams: { liquid: 200, un: 130, seker: 180 } },
  "yemek kaşığı": { volumeMl: 15, grams: { liquid: 15, un: 10, seker: 12 } },
  "çay kaşığı": { volumeMl: 5, grams: { liquid: 5, un: 3, seker: 4 } },
  "tutam": { grams: 1.5 },
  "orta boy": { dependsOn: "name" },  // domates=150, soğan=120, elma=180
  // ...
};
```

Plus: amount string parse ("2-3 tane" → average 2.5, "yarım" → 0.5, etc.)

**Riski**: Parse başarısızsa skor doğruluğu düşer. **Mitigation**: Parse
edilemezse tarif skorundan o ingredient'in nutrition katkısı çıkar,
"yaklaşık" flag set edilir. UI'da "± 10%" gibi gösterilir.

## 6. UI/UX Tasarımı

### Onboarding (yeni kullanıcı)

Register sonrası welcome email + home banner zaten var. Ek adım:
```
Tarifle'e hoş geldin! Sana daha uygun tarif önermek için
bir diyet tercihi seçmek ister misin? (İstediğin zaman değiştirebilirsin.)

[Dengeli beslenme]  [Yüksek protein]  [Düşük kalori]
[Vejetaryen dengeli]  [Vegan dengeli]  [Şimdilik yok]

Faz 2'den sonra eklenecek:
[Düşük şeker]  [Yüksek lif]  [Düşük sodyum]  [Akdeniz]  [Keto hassas]
```

`/ayarlar/diyet` sayfası:
- Preset seçici (radio)
- "Nasıl hesaplanıyor?" linki → `/blog/diyet-skoru-nasil-hesaplanir` (yeni
  blog yazısı, editorial, scientific backing anlatımı)
- Sağda sample score preview (kullanıcı "seçmeden önce" ne görecek hissetsin)

### Recipe card badge

Kartta sağ üst köşe, küçük chip:
```
┌──────────────┐
│  [img]       │
│              │
│              │
│   [🟢 92]    │  ← diet score badge
├──────────────┤
│ Tarif adı    │
│ 45dk · 450kcal│
└──────────────┘
```

Hover/tap: tooltip "Yüksek Protein diyetine göre %92 uyum"

**Opt-in**: Kullanıcı dietProfile seçmezse badge görünmez. Seçince tüm
tariflerin skor chip'i appearance animasyonu ile görünür.

### Recipe detail, "Diyet Uyumu" kartı

Tarif detayında yeni section, "Beslenme Bilgisi" kartının yanında:

```
╔═══════════════════════════════════╗
║ 🎯 Yüksek Protein Diyetine Uyum   ║
║                                   ║
║   ███████████████████░  92/100    ║
║                                   ║
║ ✅ Protein yeterli (28g)      +25║
║ ✅ Kalori:protein oranı iyi   +25║
║ ✅ Kompakt porsiyon (480kcal) +15║
║ ⚠️  Makro dengesi karbonhidrat  +12║
║     ağırlıklı (/20)              ║
║ ✅ Yemek bol doyurucu          +10║
║                                   ║
║ [Diyetimi değiştir] [Nasıl hesaplanır?]║
╚═══════════════════════════════════╝
```

Mobile'da accordion kollaps.

### Listeleme sayfası (`/tarifler`)

Sort seçeneğine eklenmesi:
- En yenisi (default)
- En popüler
- En yüksek puan
- **🆕 Diyetime en uygun** (user logged-in + dietProfile varsa)

Filter bar'a yeni chip:
- **Sadece 70+ uyumlu** toggle
- Score range slider (advanced, opsiyonel)

### AI Asistan + Menu Planner entegrasyonu

Mevcut `dietSlug` state'i aynı preset listesinden okuyacak. "Diyet filtresi"
field'ı user.dietProfile'dan default gelecek. Haftalık menü planlayıcı
weekly aggregate gösterecek ("bu haftalık plan ort. 78/100 uyum").

## 7. Faz Delivery Planı

### Faz 0, Plan onayı + seed data (şu an, ~1 oturum)
- [x] Bu plan dokümanı review + Kerem onayı
- [ ] NutritionData coverage audit (kaç ingredient eşleşiyor, skor için ne
      kadar recipe eligible)
- [ ] `scripts/audit-diet-readiness.ts`, her preset için "kaç tarif
      hesaplanabilir" rapor
- [ ] Karar: Faz 1 + Faz 2 tek büyük sprint mi, yoksa Faz 1 launch-ready mi?

### Faz 1, MVP skor + UI (2-3 oturum)
**Kapsam**: Mevcut veriyle 5 diyet preset, skor hesaplama, badge UI,
settings sayfası, diet detail kartı.

**Milestones**:
1. Prisma schema:
   - User.`dietProfile` String? @VarChar(50)
   - RecipeDietScore modeli + migration
2. `src/lib/diet-scoring/` modülü:
   - profiles.ts (5 preset, weight + fit fonksiyonları)
   - scorer.ts (ana score fonksiyonu)
   - 30+ unit test (edge cases)
3. Pre-compute script: `scripts/compute-diet-scores.ts`
   - Dev + prod RecipeDietScore tablosunu doldur
   - Cron (haftalık) veya recipe edit hook'la recompute
4. UI:
   - `/ayarlar/diyet` sayfası + onboarding banner
   - Recipe card badge (conditional render)
   - Recipe detail "Diyet Uyumu" kartı
5. `/tarifler` listing: sort + filter
6. E2E test 3 spec (diyet seç, badge doğrula, sort çalış)

### Faz 2, Data enrichment (3-5 oturum, launch sonrası önerilen)
**Kapsam**: USDA mapping, 4 diyet profili daha, amount parse.

**Milestones**:
1. `docs/ingredient-usda-mapping.csv` (top 500 ingredient, Kerem + Eren review)
2. NutritionData migration (sugar, fiber, sodium, satFat, glycemicIndex kolon)
3. `scripts/enrich-nutrition-usda.ts` ingredient enrichment
4. `src/lib/nutrition/unit-convert.ts` (amount → gram parser)
5. `scripts/compute-recipe-nutrition.ts` (recipe-level aggregate: per-porsiyon
   sugar, fiber, sodium)
6. 5 yeni diyet profili (dusuk-seker, yuksek-lif, dusuk-sodyum, akdeniz,
   keto-hassas)
7. UI genişletme (9 profil arası seçim + breakdown güncelleme)

### Faz 3, Custom + micro + AI narrative (launch sonrası opsiyonel)
- Kullanıcı kendi diyet weight'lerini seçer
- Vitamin/mineral scoring
- Haftalık weekly summary (plan'a göre "bu hafta lif yeterli, protein eksik")
- AI Asistan narrative ("Bu tarif senin diyetine %85 uyumlu çünkü...")

## 8. Riskler ve Mitigation

| Risk | Olasılık | Etki | Mitigation |
|---|---|---|---|
| NutritionData %50+ ingredient eşleşmiyor | Orta | Skor düşük kalite | Coverage audit önce, manuel mapping top 500 |
| Amount parse başarısı düşük | Yüksek | Skor ±30% sapma | Parse edilemezse "yaklaşık" flag + ingredient skip |
| Kullanıcı skor yanlış buluyor | Orta | Güven kaybı | "Nasıl hesaplanıyor?" şeffaflık + feedback butonu |
| Medikal öneri algılanması | Düşük | Yasal sorun | Disclaimer her kartta "bilgi amaçlı, diyetisyen replace etmez" |
| Pre-compute pipeline 3452 tarif 10+ dk | Düşük | Batch çalıştırma yavaş | Script parallel + cron schedule, manuel re-run sadece edit |
| Multiple diet preset seçimi istek | Orta | Scope drift | MVP tek seçim, Faz 3 multi-select |

## 9. Teknik Detaylar

### Prisma migrations
```sql
-- Migration 1 (Faz 1)
ALTER TABLE users ADD COLUMN diet_profile VARCHAR(50);
CREATE TABLE recipe_diet_scores (
  id VARCHAR PRIMARY KEY,
  recipe_id VARCHAR NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  diet_slug VARCHAR(50) NOT NULL,
  score INT NOT NULL,
  breakdown JSONB NOT NULL,
  computed_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(recipe_id, diet_slug)
);
CREATE INDEX idx_rds_diet_score ON recipe_diet_scores(diet_slug, score DESC);

-- Migration 2 (Faz 2)
ALTER TABLE nutrition_data
  ADD COLUMN sugar_per_100g DECIMAL(5,2),
  ADD COLUMN fiber_per_100g DECIMAL(5,2),
  ADD COLUMN sodium_per_100g DECIMAL(7,2),
  ADD COLUMN sat_fat_per_100g DECIMAL(5,2),
  ADD COLUMN glycemic_index INT;
```

### API endpoint'leri
- `GET /api/recipes/[slug]/diet-score?diet=<slug>`, on-demand (cache 30 dk)
- `POST /api/user/diet-profile`, set/update user preference
- `GET /api/tarifler?diet=<slug>&minScore=70`, filtered listing

### Cache stratejisi
- `RecipeDietScore` pre-computed, DB'den okur (unstable_cache 30 dk)
- User dietProfile session'da cache (revalidate user update'inde)
- Badge render: user.dietProfile + recipeDietScore'dan joined, zero extra query

### Performance
- Listeleme: `JOIN recipe_diet_scores` + `WHERE diet_slug = X ORDER BY score DESC`
  → existing index ile <50ms
- Detail: 1 ekstra query (recipe + diet_score), cache'de
- Recompute: 3452 tarif × 10 diet = 34520 compute. Her compute ~50ms
  (ingredient loop). Toplam ~30 dk batch. Parallel 4 worker ile ~8 dk.

### i18n
- Diet slug'lar URL'de TR (Kerem'in brand tercihi)
- Label'lar messages/tr.json + en.json'da
- Blog "Diyet Skoru Nasıl Hesaplanır" yazısı 2 dilde (oturum 20+ blog genişletme)

### Legal
- `/yasal/gizlilik` sayfasına ek madde: "Diyet tercihin kişisel veri, KVKK
  5/2-a (açık rıza) kapsamında tutulur, silme hakkın var"
- Tarif detay "Diyet Uyumu" kartının altında fine-print: "Bilgi amaçlıdır,
  diyetisyen tavsiyesi yerine geçmez. Hesaplama USDA verileri baz alınarak
  yapılır, ±10% sapma olabilir."

## 10. Kerem'e Sorular (karar noktaları)

### K1. Faz scope kararı
Hangi yolu tercih edersin?
- **A) MVP önce**: Faz 1 (5 preset, mevcut veri) launch'tan önce → sonra Faz 2
- **B) Full önce**: Faz 1 + Faz 2 tek sprint, launch'ın kısıtı yok, biraz
  geciktir ama 9 preset komple sunuyoruz
- **C) Lean sadece üç**: Sadece kullanıcının istediği 3 preset (düşük şeker +
  yüksek lif + vejetaryen dengeli), minimum data enrichment

**Benim önerim**: **A**. MVP 5 preset launch'a girer (2-3 oturum), Faz 2
launch sonrası polish olarak ship edilir. Sebep: 2/3 istediğin preset
(düşük şeker + yüksek lif) data enrichment gerektiriyor, o 3-5 oturumluk
ayrı bir iş, launch takvimi risk altına girer.

### K2. Skor gösterimi default
- Kullanıcı diyet seçince badge herkese açık mı?
- Yoksa opt-in, `/ayarlar/gizlilik` altında kapatılabilir mi?

**Önerim**: Default açık + /ayarlar/gizlilik'te "Diyet badge'ini göster" toggle
(mevcut `showChefScore` pattern'i).

### K3. Veri enrichment effort
Faz 2 için top 500 ingredient mapping 2-3 saat editörlük. Kerem + Eren mi
yoksa Codex mi yapacak?
- Codex yapabilir ama USDA API Türkçe ingredient'ı bulma fuzzy iş, hata payı
  yüksek
- Kerem + Eren daha doğru ama insan saati
- **Önerim**: Codex ilk draft (Mod G yeni mod: "USDA mapping draft"), Kerem
  review + correct. İş bölüşüm 70-30.

### K4. Diyet blog yazısı
"Diyet Skoru Nasıl Hesaplanır" blog yazısı 41. yazı olarak gelecek mi?
Launch öncesi 40 blog hedefi tam karşılanmıştı; bu yazı değerli ama blog 41+
zaten launch sonrası plan.

**Önerim**: Launch öncesi bir sebep olursa yaz. Yoksa Faz 2 ile birlikte yaz
(düşük şeker / yüksek lif açıklaması önemli, kullanıcı güveni için).

### K5. Multiple diet selection
İlk iterasyonda kullanıcı **tek** preset seçecek. Sonra "Aynı anda vejetaryen
+ yüksek protein seçebilmek" istek gelirse:
- MVP tek (Keep Simple)
- Faz 3 multi-select (ağırlıklı ortalama veya min-score)

**Önerim**: Tek seçim MVP'de, feedback varsa Faz 3'e al.

### K6. Skor recomputation tetik
- Admin edit tarif → RecipeDietScore o tarif için recompute?
- Nutrition database update → tüm skorlar recompute?
- Haftalık cron?

**Önerim**: Tarif edit + seed hook'larda ilgili recipe'in skoru recompute
(targeted). Haftalık cron tüm pipeline'ı replay (idempotent kontrol).

---

## 11. Sonraki Adım Önerim

1. **Bu doküman review**: Kerem 1-2 tur okuma + yorum
2. **Veri coverage audit**: `scripts/audit-diet-readiness.ts` hızlı yaz → her
   preset için kaç tarif hesaplanabilir rapor
3. **Karar K1**: MVP mı / full mu / lean mı
4. **Faz 1 başla**: Prisma migration → profiles.ts → scorer.ts → UI

Kapsamlı iş, acele edip yanlış yapmayalım. Plan onaylanınca hızlı implementasyon.

---

## 12. Oturum 20 Kararları (Revize Plan, B* Hibrit)

### Audit sonuçları (25 Nis 2026, oturum 20)
- Recipe macro coverage **%100** (3452/3452 tarif protein+carbs+fat+kcal dolu)
- **NutritionData tablosu BOŞ**, 0 row (tablo var, içi yok)
- 1387 unique ingredient, top 30 = ~7500 row (toplamın %43), top 100 ≈ %75, top 500 ≈ %95
- Vejetaryen dengeli tag match %3 (93 tarif), tag audit + retrofit gerek
- Hunger bar %71, 1000 tarif eksik, retrofit gerek
- Düşük kalori (≤400 kcal) %77, kriter çok gevşek, 350-375 range'e daralt

### K1 kararı: **B\* Hibrit** (onaylandı, oturum 20)
- Faz 1 MVP tam (5 preset mevcut macro ile): dengeli, yüksek-protein, düşük-kalori, vejetaryen-dengeli, vegan-dengeli
- Faz 2 limited: top 100 ingredient USDA enrichment + **tek ek preset: düşük-şeker** (kullanıcının en öne çıkan isteği)
- Faz 3'e erteleme: yüksek-lif (fiber enrichment daha geniş), düşük-sodyum, akdeniz, keto-hassas

### Beta tag (oturum 20 ek karar, Kerem önerisi)
Diyet skoru ilk yayında **"Beta"** etiketiyle çıkacak. Sebep: USDA enrichment
Faz 2'de tamamlanacak, Faz 1'de mevcut macro verisi (calories+protein+carbs+fat)
ile düşük şeker / yüksek lif gibi profillere fallback approximation ile yaklaşım
veriyoruz; %100 doğru değil. "Beta" rozeti kullanıcı beklentisi yönetimi:
sonuç yanlış görünse bile site terk edilmesin, "geliştiriliyor" mesajı verir.

Beta UI yerleşimi:
- Recipe card badge: skor chip yanında küçük "BETA" mini-rozet
- Detail "Diyet Uyumu" kartı: başlıkta "🎯 Yüksek Protein Uyumu (Beta)" formatı
- `/ayarlar/diyet` sayfasında banner: "Diyet skoru beta aşamasında, sonuçlar
  zamanla iyileşecek. Hatalı bulduğun skor için geri bildirim formu."
- Geri bildirim: lightweight, "Bu skor sence uygun mu?" toggle (yararlı / değil)
  → analytics event, Faz 2 sonrası kapanır

Faz 2 USDA enrichment + 6. preset (düşük şeker) ship edildikten 1-2 hafta
sonra "Beta" etiketi düşürülür. Stable rozet "Geliştirilmiş hesaplama" ile
değiştirilebilir veya tamamen kaldırılabilir (Kerem kararı).

### Diğer kararlar (K2-K6)
- **K2**: Diyet badge default açık, `/ayarlar/gizlilik` altında `showDietBadge` toggle
- **K3**: USDA mapping hibrit, Codex Mod G draft + Kerem + Eren review (top 100 ~ 3-4 oturumda)
- **K4**: "Diyet Skoru Nasıl Hesaplanır" blog 41 launch ile birlikte (Faz 2 bitişinde ship)
- **K5**: MVP tek diyet seçim, Faz 3'te multi-select opsiyonel
- **K6**: Hem targeted edit hook hem haftalık cron idempotent replay

### Delivery sırası (5-6 oturum tahmin)

| Oturum | Blok |
|---|---|
| 1 (şu an) | Schema migration (User.dietProfile + User.showDietBadge + RecipeDietScore + NutritionData 5 kolon); tag audit + vejetaryen/vegan coverage retrofit |
| 2 | NutritionData top 50 manuel seed (editörlük TR mutfak + Codex Mod G draft'ı) + amount → gram parser |
| 3 | `src/lib/diet-scoring/` modülü (profiles.ts 6 preset + scorer.ts) + pre-compute pipeline + unit test 30+ |
| 4 | UI: `/ayarlar/diyet`, onboarding banner, recipe card badge, detail "Diyet Uyumu" kartı |
| 5 | `/tarifler` sort + filter, AI Asistan + Menu Planner entegrasyonu, E2E test 3 spec |
| 6 | Blog 41 "Diyet Skoru Nasıl Hesaplanır" + launch readiness (düşük-şeker USDA mapping tamam, 6 preset canlı) |

### Değer metrikleri (ship sonrası)
- Tarif başı diyet skor breakdown'u kullanıcıya şeffaf (güven sinyali)
- Listeleme "Diyetime uygun" sort opsiyonu (pasif kullanıcılara da değer)
- Haftalık menü planlayıcı "bu haftanın ort. skor" özet
- AI Asistan "diyet filtresi" artık binary değil, ağırlıklı öneri

