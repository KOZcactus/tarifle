# Tarif Format Şartnamesi

Bu doküman, `scripts/seed-recipes.ts` içine eklenecek her yeni tarifin
**birebir** uyması gereken yapıyı tanımlar. Başka bir bilgisayarda ya da başka
bir asistan (Codex vb.) bu dokümana bakarak Tarifle'nin DB'sine uygun veri
üretir.

> **Son durum (2026 Nisan)**: Recipe modeli bu dokümanla aynı. Platform'da
> Variation (topluluk uyarlaması) + Notification + moderasyon alanları var
> ama Codex sadece Recipe eklemekle ilgileniyor — aşağıdaki alanlar geçerli,
> başka değişiklik yok. Prisma şemasının son hali için
> `prisma/schema.prisma` referans tutulur.

## Kullanım

1. Bu dosyayı + `prisma/schema.prisma`'yı Codex'e oku.
2. Tarifleri aşağıdaki TypeScript nesne formatında üret.
3. `scripts/seed-recipes.ts` dosyasının `const recipes = [...]` array'inin
   sonuna ekle (mevcut tarifleri silme, üste/alta `// ── BATCH X ──` yorumu
   bırak).
4. Çalıştır: `npx tsx scripts/seed-recipes.ts` → **slug yoksa oluşturur,
   varsa atlar** (update yapmaz). Script idempotent: aynı batch'i ikinci
   kez çalıştırmak duplicate yaratmaz, sadece "zaten var, atlanıyor"
   mesajı basar.

**Mevcut tarifi güncellemek için**: seed script'i güncellemez; Neon'da
doğrudan Recipe satırını silmen (ingredients/steps `ON DELETE CASCADE`'le
otomatik silinir) ve sonra script'i tekrar çalıştırman gerekir. Ya da
Prisma Studio (`npm run db:studio`) ile elle düzenle.

## Sabit listeler

### Kategori slug'ları (17 tane — yenisi eklenmez)

```
et-yemekleri          tavuk-yemekleri       sebze-yemekleri
corbalar              baklagil-yemekleri    salatalar
kahvaltiliklar        hamur-isleri          tatlilar
aperatifler           icecekler             kokteyller
kahve-sicak-icecekler makarna-pilav         soslar-dippler
smoothie-shake        atistirmaliklar
```

Kategori eklemek gerekiyorsa önce `prisma/seed.ts` içindeki `categories`
bloğuna eklenmeli, sonra migration çalıştırılmalı. Yeni kategori eklemeden
mevcutlardan birini seç.

### Tag slug'ları (15 tane — yenisi eklenmez)

```
pratik              30-dakika-alti     dusuk-kalorili
yuksek-protein      firinda            tek-tencere
misafir-sofrasi     cocuk-dostu        butce-dostu
vegan               vejetaryen         alkollu
alkolsuz            kis-tarifi         yaz-tarifi
```

Bir tarife 1-5 tag uygun. Tag slug'ları listede olmalı, yoksa seed hata verir.

**Vejetaryen / vegan tag'leri otomatik üretilebilir**: tariflerin içerik
üzerinden `scripts/retrofit-diet-tags.ts` çalıştırılınca uygun olanlara
eklenir. Codex batch'inde eklemeyi unutursan bu script düzeltir
(idempotent — çift tag atmaz, yanlış etiketleri temizler). Yine de
doğru etiketleri tarifte birlikte göndermek tercih edilir.

### Enum değerleri (exact string, değişmez)

```
type:       YEMEK | TATLI | ICECEK | KOKTEYL | APERATIF | SALATA | CORBA | KAHVALTI | ATISTIRMALIK | SOS
difficulty: EASY | MEDIUM | HARD
allergens:  GLUTEN | SUT | YUMURTA | KUSUYEMIS | YER_FISTIGI | SOYA | DENIZ_URUNLERI | SUSAM | KEREVIZ | HARDAL
cuisine:    tr | it | fr | es | gr | jp | cn | kr | th | in | mx | us | me | ma | vn | br | cu | ru | hu | se
```

**Mutfak kodu (`cuisine`)**: tarifin ait olduğu mutfak. String, nullable,
14 geçerli kod:

| Kod | Mutfak | Kod | Mutfak |
|-----|--------|-----|--------|
| `tr` | Türk | `jp` | Japon |
| `it` | İtalyan | `cn` | Çin |
| `fr` | Fransız | `kr` | Kore |
| `es` | İspanyol | `th` | Tay |
| `gr` | Yunan | `in` | Hint |
| `mx` | Meksika | `us` | ABD |
| `me` | Orta Doğu | `ma` | Kuzey Afrika |
| `vn` | Vietnam | `br` | Brezilya |
| `cu` | Küba | `ru` | Rus |
| `hu` | Macar | `se` | İskandinav |

Bir tarif **tek** mutfağa ait. Eklemek opsiyoneldir — eksik bırakılırsa
`scripts/retrofit-cuisine.ts` title/slug/description'dan çıkarım yapar.
Ama Codex doğru kodu açıkça yazsın — retrofit heuristic her zaman isabetli
olmayabilir. Türk tarifleri `"tr"`, uluslararası tarifler ilgili ülke kodu.

**Alerjen etiketleri**: her tarifin `allergens` alanı, tarifin içerdiği
alerjenlerin listesidir (boş array olabilir). Mutfakta kullanıcı "bu tarif
süt içeriyor mu?" diye bakınca bu alan renderlanır. Eksik bırakılırsa
`scripts/retrofit-allergens.ts` çalıştırılarak malzemelerden kural tabanlı
çıkarım yapılır — ama Codex her tarif için açıkça eklemelidir (kural
motoru bazen missler).

**Hangi alerjen ne zaman**:
- `GLUTEN`: un, ekmek, bulgur, makarna, yufka, kadayıf, hamur, kek, lavaş
- `SUT`: süt, yoğurt, ayran, peynir (her tür), tereyağı, krema, kaymak
- `YUMURTA`: yumurta (her şekilde)
- `KUSUYEMIS`: ceviz, badem, fındık, kaju, **antep fıstığı**, kestane
- `YER_FISTIGI`: yer fıstığı, fıstık ezmesi (KUSUYEMIS ile **ayrı** — klinik
  olarak farklı alerji)
- `SOYA`: soya sosu, tofu, edamame, miso
- `DENIZ_URUNLERI`: balık, karides, midye, ahtapot, vb. (hepsi bu tag)
- `SUSAM`: tahin, susam
- `KEREVIZ`: kereviz (bütün veya sap)
- `HARDAL`: hardal

## Alan-alan format

Her tarif şu TypeScript nesnesine tıpatıp uymalı:

```ts
{
  title: "Adana Kebap",                    // 2-200 kar, TR ok, Title Case
  slug: "adana-kebap",                     // 2-200 kar, sadece [a-z0-9-], TR → ASCII
  emoji: "🥩",                              // 1 emoji, opsiyonel ama önerilir
  cuisine: "tr",                             // mutfak kodu, opsiyonel (bkz. Enum değerleri)

  description: "Acılı kıyma ile ...",      // 20-500 kar, bir-iki cümle TR

  categorySlug: "et-yemekleri",            // sabit listede olmalı
  type: "YEMEK" as const,                  // enum, "as const" önemli
  difficulty: "HARD" as const,             // enum, "as const" önemli

  prepMinutes: 30,                         // int, >=0
  cookMinutes: 20,                         // int, >=0
  totalMinutes: 50,                        // int, genellikle prep+cook
  servingCount: 4,                         // int, >=1

  averageCalories: 380,                    // int, nullable (porsiyon başı kcal)
  protein: 28,                             // decimal(5,1), nullable (gr)
  carbs: 5,                                // decimal(5,1), nullable (gr)
  fat: 28,                                 // decimal(5,1), nullable (gr)

  isFeatured: true,                        // boolean, "öne çıkan" flag

  tipNote: "Kıymayı 15dk yoğurun...",      // kısa cümle, nullable
  servingSuggestion: "Lavaş ve ...",       // kısa cümle, nullable

  tags: ["misafir-sofrasi", "yuksek-protein"],  // slug array, 0-5 element
  allergens: ["GLUTEN", "SUT"] as const,   // enum array, 0-5 elements; bkz. Enum değerleri

  // OPSİYONEL — EN/DE çevirileri. Eklemek zorunda değilsin; eklersen Faz 3'te UI dil
  // toggle'ı canlıya alındığında direkt kullanılır. Primary dil her zaman TR.
  translations: {
    en: {
      title: "Adana Kebab",
      description: "Spicy grilled meat skewers from Adana region...",
      // Sadece title çevirmek yeterli; malzeme/adım ingilizceye çevirmek opsiyonel
      ingredients: [
        { sortOrder: 1, name: "Ground beef (fatty)" },
      ],
      steps: [
        { stepNumber: 1, instruction: "Combine meat, fat, and spices." },
      ],
    },
  },

  ingredients: [
    { name: "Dana kıyma (yağlı)", amount: "500", unit: "gr", sortOrder: 1 },
    { name: "Pul biber",          amount: "2",   unit: "yemek kaşığı", sortOrder: 2 },
    // OPSİYONEL group alanı — çok-bileşenli tarifler için
    // (şerbetli tatlılar, soslu yemekler, marineli etler…)
    // { name: "Şeker", amount: "2", unit: "su bardağı", sortOrder: 7, group: "Şerbet için" },
  ],
  steps: [
    { stepNumber: 1, instruction: "Kıyma, yağ, baharatları karıştırın." },
    { stepNumber: 2, instruction: "İyice yoğurun.", tip: "Yapışkan olmalı.", timerSeconds: 900 },
    // ...
  ],
}
```

## Kurallar (bunların hepsi birden)

### Slug

- **Benzersiz** olmalı. Aynı slug zaten varsa script "atlandı" deyip geçer,
  tarif güncellenmez. Yeni tarif = yeni slug.
- Türkçe karakter YOK: `ç→c, ğ→g, ı→i, ö→o, ş→s, ü→u`.
- Boşluk yerine `-`. Örnek: `"Fırın Sütlaç" → firin-sutlac`.
- Mevcut 56 tarifin slug'larını bilmek için çalıştırmadan önce DB kontrol:
  `npm run db:studio` ile Recipe tablosunda `slug` kolonuna bak, ya da
  Codex'e "scripts/seed-recipes.ts ve prisma/seed.ts'deki mevcut tüm
  slug'larla çakışma" uyarısı ver.

### Ingredients

- `amount` **string** (Prisma `VarChar(50)`). "1/2" ya da "bir tutam" gibi
  değerler de valid. Sayısal kıvama zorlama — kullanıcı-dostu olsun.
- `unit` açık TR ("gr", "ml", "adet", "yemek kaşığı", "çay kaşığı",
  "diş", "demet", "yaprak", "bardak", "su bardağı", "tatlı kaşığı").
- `sortOrder` 1'den başlar, sırayla artar.
- 3-15 arası malzeme ideal. 1 tek malzemeli tarif doğru çalışır ama zayıf.
- `isOptional: true` opsiyonel ekleyebilirsin (varsayılan false). Örnek:
  maydanoz, taze fesleğen, aroma için ekleme.
- **`group: "X için"` opsiyonel** — çok-bileşenli tariflerde kullan:
  şerbetli tatlılar ("Hamur için" / "Şerbet için"), makarnalar ("Makarna
  için" / "Sos için"), kebaplar ("Marine için" / "Servis için"), vb.
  - Basit tek-bileşenli tariflerde (ana yemek, salata, kokteyl) `group`
    alanını **ekleme** — gereksiz. UI düz liste render eder.
  - **Yanlış kullanım**: "Şerbet şekeri" gibi composite malzeme adı.
    Doğrusu: `{ name: "Şeker", group: "Şerbet için" }` — AI Asistan
    "şeker" diye arayan kullanıcıyı doğru eşleştirir.
  - Naming konvansiyonu: **"X için"** (cümle başı büyük harf). Aynı
    tarif içinde tutarlı yaz — "Hamur İçin" ≠ "Hamur için" karışıklık
    yaratır.

### Steps

- `stepNumber` 1'den başlar, sırayla.
- `instruction` tam bir Türkçe cümle, başında büyük harf, sonunda nokta.
- `tip` opsiyonel (nullable). Adıma özel ince ayarı verir.
- `timerSeconds` opsiyonel (nullable). Pişirme süresi saniye cinsinden —
  kullanıcıya "pişirme modunda" timer başlatılır. Örnek: 30 dakika = 1800.
- 3-10 adım ideal. Daha kısa = "tek adımlı", daha uzun = okuma yorgun.

### Sayılar

- `prepMinutes + cookMinutes ≤ totalMinutes ≤ 1440 (24 saat)`.
- `averageCalories` porsiyon başı kcal (toplam değil). Normal aralık
  50-1200. Çok yüksek veya çok düşükse yanlış hesaplanmış.
- `protein`, `carbs`, `fat` gram cinsinden. Toplamları bazen kalori ile
  uyumsuz — OK, hassas besin takibi değil genel rehber.

### isFeatured

- Toplam tariflerin yaklaşık %10-15'i `true`. Abartma — her tarif
  "öne çıkan" olursa "öne çıkan" bölümü anlamını yitirir. 500 tariften
  en fazla 50-70'i `true` olmalı.

### tipNote / servingSuggestion

- `tipNote`: tarifin kritik püf noktası, 1-3 cümle. Not bırakamayacaksan
  `null` yap, sahte not üretme.
- `servingSuggestion`: servis önerisi, 1 cümle. Aynı kural.

### Dil ve anlatım kalitesi (HEPSİ için zorunlu)

Tarif metni kullanıcı tarafında direkt görünecek. "AI-üretmişe benziyor"
duygusunu vermesin — insan yazımı + mutfak bilgili + net.

**Yazım kuralları (description / tipNote / servingSuggestion / step.instruction / step.tip)**:

1. **Muğlak koşullu ifadeler YASAK**. "ya da tersi", "duruma göre",
   "isteğe bağlı olarak şöyle ya da böyle", "kararına kalmış" — hepsi
   kullanıcıya "ne yapacağımı anlamadım" dedirtir. İki durum varsa **iki
   durumu ayrı cümlelerde ayrı ayrı** yaz.
   - ❌ "Şerbet soğuk, baklava sıcak olmalı — ya da tersi."
   - ✅ "Baklava fırından yeni çıkmışsa üzerine **soğuk** şerbet dök.
        Baklava soğumuşsa **sıcak** şerbet kullan. İkisi birden sıcak
        olursa şerbet emmez."

2. **Sayısal belirsizlik YASAK** — "biraz", "azıcık", "epey", "yeteri
   kadar" kullanma. Sayı veremediğin yerde niteliksel metrik ver.
   - ❌ "Biraz tuz ekleyin."
   - ✅ "Tat için tuz ekleyin." (miktar gerçekten değişiyorsa)
   - ✅ "1 tutam tuz ekleyin." (ölçüsü belli ama standart olmayan)

3. **"İyice" / "güzelce" ifadesine somut kriter ekle**. "İyice
   yoğurun" kullanıcıya ne kadar olduğunu anlatmıyor.
   - ❌ "Hamuru iyice yoğurun."
   - ✅ "Hamuru elinize yapışmayana kadar 8-10 dakika yoğurun."

4. **Kısa, aksiyona dönük cümle**. Adım talimatları özne + fiil ile
   başlasın ya da doğrudan imperatif ("Soğanları doğrayın.").

5. **Gereksiz tekrar yok**. description + tipNote + step'ler birbirini
   tekrarlamamalı. description tarifin **ne olduğunu**, step **nasıl
   yapıldığını**, tipNote **başarı için kritik olanı** anlatır.

6. **Gerçek mutfak bilgisi**. Sakın sahte püf noktası uydurma — kural
   tabanlı "bol bol karıştırın daha lezzetli olur" tarzı boş cümle yerine
   `tipNote: null` bırak.

7. **Emoji + süsleme YOK metin içinde**. Bunlar chip/buton etiketleri
   için. `instruction`, `tipNote`, `description` alanlarında sade TR
   yazımı.

### type / categorySlug uyumu

- `type: "KOKTEYL"` → `categorySlug: "kokteyller"`
- `type: "CORBA"` → `categorySlug: "corbalar"`
- `type: "TATLI"` → `categorySlug: "tatlilar"` (hamur işi de tatlı olabilir,
  o zaman `categorySlug: "hamur-isleri"`, `type: "TATLI"`)
- `type: "SALATA"` → `categorySlug: "salatalar"`
- `type: "KAHVALTI"` → `categorySlug: "kahvaltiliklar"`
- `type: "APERATIF"` → `categorySlug: "aperatifler"`
- `type: "SOS"` → `categorySlug: "soslar-dippler"`
- `type: "ICECEK"` → `categorySlug: "icecekler"` veya `smoothie-shake` veya
  `kahve-sicak-icecekler`
- `type: "ATISTIRMALIK"` → `categorySlug: "atistirmaliklar"`
- `type: "YEMEK"` (ana yemek kategorisi net değilse default) → et-yemekleri,
  tavuk-yemekleri, sebze-yemekleri, makarna-pilav, baklagil-yemekleri,
  hamur-isleri (börek tipi)

### Alkollü içecek

- Reçetede alkol geçiyorsa `tags` içine **zorunlu** `"alkollu"` ekle. Site bu
  tag'le 18+ yaş doğrulama gate'i tetikliyor.

### Çeviriler (opsiyonel, Faz 3 için hazırlık)

- `translations` alanı opsiyonel. Eklemek zorunda değilsin.
- Eklersen: en azından `title` + `description` çeviri; malzeme/adım
  çevirmek iş yükü arttırır, TR-only bırakabilirsin — UI fallback TR'ye
  düşer.
- Locale key 2 küçük harf: `en`, `de`, `fr`...
- **İstisnalar**: İskender, Baklava, Lahmacun gibi özgün TR isimler
  çevrilmez — aynı bırak veya "Baklava (Turkish layered pastry)" gibi
  açıklamalı ver.
- Translation kalitesi belirsizse boş bırak; Faz 3'te profesyonel
  tercüman veya LLM ile retrofit yapılır.

### Dil

- Tüm metinler Türkçe. İngilizce ingredient ismi varsa TR karşılığı tercih
  et ("asparagus" yerine "kuşkonmaz").
- Noktalama ve dilbilgisine dikkat — site'de direkt görünecek.

## İdeal batch

- **50 tarif** batch halinde git. Büyük batch'te tek yanlış slug tüm batch'i
  bozmaz (her tarif kendi `upsert`'ünde), ama review etmesi zorlaşır.
- Her batch farklı kategori dengesi olsun. Örnek ideal dağılım (500 tarif):
  - Et yemekleri: 40, Tavuk: 35, Sebze: 50
  - Çorbalar: 40, Salata: 25, Baklagil: 30, Kahvaltı: 25
  - Hamur işleri: 45, Tatlılar: 55, Makarna-Pilav: 30
  - Aperatif: 20, Atıştırmalık: 15, Sos: 15
  - Kokteyl: 25, İçecek: 25, Smoothie: 15, Sıcak içecek: 10

## Kalite checklist (her tarif için)

**Yapı**
- [ ] Slug benzersiz, TR karakter yok
- [ ] `type` + `categorySlug` uyumlu
- [ ] `prepMinutes + cookMinutes` ≈ `totalMinutes` (kür/fermentasyon varsa `cookMinutes`'a dahil, "pişirme" label'ı olmasa bile)
- [ ] Servings 1-10 arası makul
- [ ] Kalori porsiyon başı, makul aralık
- [ ] 3-15 ingredient, sortOrder sıralı
- [ ] 3-10 step, stepNumber sıralı
- [ ] Her tag slug sabit listeden
- [ ] Alkol varsa `alkollu` tag'i
- [ ] **`allergens` alanı dolu** (veya bilerek boş array `[]`). Malzemeleri tara: süt/yoğurt/peynir varsa `SUT`, un/bulgur varsa `GLUTEN`, vb.
- [ ] Çok-bileşenli ise `group: "X için"` ayarlı ("Hamur için", "Şerbet için", "Sos için"…)
- [ ] `cuisine` kodu doğru (Türk tarifi `"tr"`, İtalyan `"it"`, vb.) veya bilinçli olarak null

**Dil ve anlatım**
- [ ] "ya da tersi", "duruma göre" muğlak ifadeler **yok** — iki durum varsa iki ayrı cümle
- [ ] "Biraz", "iyice", "azıcık" belirsiz ölçü **yok** — sayı veya niteliksel metrik var
- [ ] Composite ingredient adı **yok** ("Şerbet şekeri" → "Şeker" + group)
- [ ] Metin Türkçe doğru, büyük/küçük harf tutarlı
- [ ] description 20-500 karakter
- [ ] tipNote varsa gerçek bir püf noktası (boş sahte not yerine `null`)

**Veri doğruluğu (17 Nis 2026 turunda eklendi — CI bloklar)**
- [ ] **Virgülle birleşik ingredient satırı YOK** — "Tuz, karabiber, pul biber" tek row olarak yazılmaz, 3 ayrı `{name: "Tuz", ...}`, `{name: "Karabiber", ...}`, `{name: "Pul biber", ...}` satırı olur. `validate-batch.ts` bu pattern'ı ERROR olarak yakalar.
- [ ] **Step'te geçen baseline staple ingredient listesinde OLMALI** — adım "tuzla yoğurun" diyorsa ingredient'lar arasında Tuz olmalı. Aynı şekilde karabiber / pul biber / un için. `validate-batch.ts` bu mismatch'i ERROR olarak yakalar.
- [ ] **ServingSuggestion'da bahsedilen sos/garnish ingredient olmalı** — "X sosuyla servis edin" yazacaksan ya sos ingredient listesinde olmalı ya da hazır-alınabilir bir ürün (soya sosu, ketçap OK). "Acı sos", "limonlu karabiber sosu" gibi belirsiz sos referansları YASAK — ya ingredient olarak ekle, ya servingSuggestion'ı mevcut malzemelerle yaz.
- [ ] **Adım sırası mantıklı** — önce hazırlık (kes/yoğur/marine), sonra pişirme, sonra servis. "Tüm malzemeleri karıştırın" adımından sonra "sarımsağı ezin" yazarsan ters akış — kullanıcı şaşırır.
- [ ] **Çok-section tarif gerçek 2+ grup** — description/step'te hem "hamur" hem "şerbet" (veya "marine" + "sos", vb.) geçiyorsa ingredient'larda en az 2 farklı `group: "X için"` olmalı. Tek "Hamur için" group tüm ingredient'lara yetersiz.
- [ ] **Step adımı oto-tutarlı** — step 3'te "krema kullanın" diyorsan ya ingredient'ta Krema olmalı, ya önceki bir adımda krema yapılmış olmalı. "Çikolata sosu" adımda varsa, ingredient'ta Çikolata olmalı + bir adımda sos hazırlama olmalı.

## Çalıştırma

```bash
# Neon branch açılmışsa:
# 1. Codex PC'sinin .env.local'inde DATABASE_URL = <codex-import branch URL>
# 2. Çalıştır:
npx tsx scripts/seed-recipes.ts

# Production'a yazmak için (ANA makinada):
# 1. .env.local'de DATABASE_URL = <production branch URL>
# 2. Yeni eklenen batch'i gözden geçir (git diff)
# 3. Çalıştır:
npx tsx scripts/seed-recipes.ts
```

Script idempotent (aynı slug varsa atlar) → güvenle birden çok kez
çalıştırabilirsin. Çıktıda her tarif için `✅ eklendi` veya `⏭️ zaten var,
atlanıyor` satırı gözükür; sonda `N yeni tarif eklendi, M atlandı` özeti
gelir.
