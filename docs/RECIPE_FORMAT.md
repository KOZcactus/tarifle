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

### Enum değerleri (exact string, değişmez)

```
type:       YEMEK | TATLI | ICECEK | KOKTEYL | APERATIF | SALATA | CORBA | KAHVALTI | ATISTIRMALIK | SOS
difficulty: EASY | MEDIUM | HARD
```

## Alan-alan format

Her tarif şu TypeScript nesnesine tıpatıp uymalı:

```ts
{
  title: "Adana Kebap",                    // 2-200 kar, TR ok, Title Case
  slug: "adana-kebap",                     // 2-200 kar, sadece [a-z0-9-], TR → ASCII
  emoji: "🥩",                              // 1 emoji, opsiyonel ama önerilir

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

  ingredients: [
    { name: "Dana kıyma (yağlı)", amount: "500", unit: "gr", sortOrder: 1 },
    { name: "Pul biber",          amount: "2",   unit: "yemek kaşığı", sortOrder: 2 },
    // ...
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

- `tipNote`: tarifin kritik püf noktası, 1-2 cümle. Not bırakamayacaksan
  `null` yap, sahte not üretme.
- `servingSuggestion`: servis önerisi, 1 cümle. Aynı kural.

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

- [ ] Slug benzersiz, TR karakter yok
- [ ] `type` + `categorySlug` uyumlu
- [ ] `prepMinutes + cookMinutes` ≈ `totalMinutes`
- [ ] Servings 1-10 arası makul
- [ ] Kalori porsiyon başı, makul aralık
- [ ] 3-15 ingredient, sortOrder sıralı
- [ ] 3-10 step, stepNumber sıralı
- [ ] Her tag slug sabit listeden
- [ ] Alkol varsa `alkollu` tag'i
- [ ] Türkçe doğru, büyük/küçük harf tutarlı
- [ ] description 20-500 karakter

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
