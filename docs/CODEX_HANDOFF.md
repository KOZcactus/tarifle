# Tarifle — Codex Devir Teslim Dokümanı

Bu doküman **başka bir bilgisayarda Codex'e verilecek**. Tek başına okunduğunda
Codex'in Tarifle projesine güvenle yeni tarif ekleyebilmesi için gereken her
şey burada. Bu dosyayı değiştirmeden Codex'e ver.

---

## 1. Proje nedir

**Tarifle** (tarifle.app) — Türkçe bir tarif platformu. Yemek, içecek ve
kokteyl tariflerini modern bir arayüzle sunuyor; kullanıcılar kayıt olup
"uyarlama" ekleyebiliyor, koleksiyon ve alışveriş listesi oluşturabiliyor,
malzemeden tarif bulan bir AI asistanı kullanabiliyor.

**Tech stack (bilmen yeterli):**

- Next.js 16 (App Router) + TypeScript + Tailwind CSS 4
- Prisma 7 ORM, veritabanı **Neon PostgreSQL** (cloud, AWS eu-west-2 London)
- Auth.js v5, Vercel deploy, Cloudflare DNS

**Senin görevin:** `scripts/seed-recipes.ts` dosyasına yeni Türkçe tarifler
eklemek ve script'i çalıştırıp veritabanına yazmak. Başka **hiçbir şey**e
dokunmayacaksın (schema değiştirme, kod dosyası yazma, migration çalıştırma
yasak).

---

## 2. İlk kurulum (Codex PC'sinde bir kere)

### 2.1. Repo'yu clone et

```bash
git clone https://github.com/KOZcactus/tarifle.git
cd tarifle
```

### 2.2. Bağımlılıkları yükle

```bash
npm install
```

(`postinstall` hook'u `prisma generate` çalıştırır, Prisma client üretilir.)

### 2.3. `.env.local` dosyası oluştur

Aşağıdaki şablonu `.env.local` olarak kaydet. **DATABASE_URL alanı BOŞ kalır**
— aşağıda Neon branch açıp onu dolduracağız.

```env
# Site
NEXT_PUBLIC_SITE_URL="https://tarifle.app"

# Veritabani — Neon codex-import branch URL'i buraya gelecek (adım 3)
DATABASE_URL=""

# Auth.js v5 — Codex tarafında auth kullanmıyoruz ama dotenv yoklar, boş kalmasın
AUTH_SECRET="codex-placeholder-does-not-need-to-be-secure"
AUTH_URL="http://localhost:3000"
```

Diğer env var'lara (Resend, Upstash, Google OAuth) Codex'in ihtiyacı yok;
seed script sadece `DATABASE_URL` kullanıyor.

---

## 3. Neon branch açma (production'a zarar gelmez garantisi)

Amaç: Codex'in yazdığı tariflerin **canlı tarifle.app**'e sızmaması. Neon'un
branch özelliği production'ın anlık bir kopyasını (yeni yazmalara açık,
okuma-yazma) ayrı bir connection string olarak verir.

### 3.1. Neon console'a git

**Bu adımı projenin sahibi (Kerem) ana bilgisayardan yapar ve çıkan URL'yi
Codex PC'sine aktarır.**

1. https://console.neon.tech → Tarifle projesi
2. Sol menüden **Branches** → **Create branch** butonu
3. Ayarlar:
   - **Name**: `codex-import`
   - **Parent branch**: `production` (veya `main` — hangisi ana branch ise)
   - **Include data up to**: "Latest data" (varsayılan)
4. **Create**

Branch oluşur, production'ın veri snapshot'ı ile birlikte — tüm mevcut 56
tarif, kategoriler, etiketler orada. Ama yeni yazmalar sadece bu branch'te
kalır.

### 3.2. Branch'in connection string'ini al

1. `Branches` listesinde **codex-import** branch'ine tıkla
2. **Connection Details** kartı → **Connection string** kopyala
3. String `postgresql://neondb_owner:<yeni-sifre>@ep-...-codex-import.eu-west-2.aws.neon.tech/neondb?sslmode=require` formatında

### 3.3. Codex PC'sinin `.env.local`'ine yaz

`.env.local` dosyasındaki `DATABASE_URL=""` satırını bu string ile doldur:

```env
DATABASE_URL="postgresql://neondb_owner:xxxx@ep-xxxx-codex-import.eu-west-2.aws.neon.tech/neondb?sslmode=require"
```

Artık Codex'in yaptığı her yazma `codex-import` branch'inde kalıyor,
production'a dokunmuyor.

---

## 4. Projeyi tanı (Codex'in ilk işi)

Codex, tarif yazmaya başlamadan önce şu dosyaları **okumalı**:

| Dosya | Ne için |
|---|---|
| `docs/RECIPE_FORMAT.md` | **En önemli doküman.** Tarif formatı, kategori slug'ları, tag slug'ları, enum değerleri, alan alan kurallar. |
| `prisma/schema.prisma` | Veritabanı şeması — `Recipe`, `RecipeIngredient`, `RecipeStep`, `RecipeTag` modelleri ve enum tanımları. |
| `scripts/seed-recipes.ts` | Mevcut 41 tarifin olduğu dosya. Codex buraya ekleme yapacak. Format örnek olarak bu dosyayı referans al. |
| `src/lib/cuisines.ts` | Geçerli mutfak kodları (14 kod: tr, it, fr, jp, kr, th, in, mx, …). Yeni tarife `cuisine: "xx"` yazarken buraya bak. |
| `prisma/seed.ts` | Bootstrap seed'i — ilk 15 tarif, kategoriler ve etiket tanımları. **DEĞİŞTİRME**. |

Bu dosyaları okuduktan sonra:

### 4.1. Mevcut slug'ları snapshot'la

Yeni tarif üretirken hiçbir mevcut slug ile çakışmamalı:

```bash
npx tsx scripts/list-recipe-slugs.ts > docs/existing-slugs.txt
```

Bu komut `codex-import` branch'indeki tüm tariflerin slug'larını
`docs/existing-slugs.txt` dosyasına yazar. Dosyayı Codex okur, yeni slug
üretirken kontrol eder.

---

## 5. Tarif ekleme döngüsü (ana iş)

### 5.1. Batch üret

Önce `docs/RECIPE_FORMAT.md`'yi satır satır oku. Sonra
`scripts/seed-recipes.ts` dosyasındaki `const recipes = [...]` array'ine
**sondan** (kapanan `];` işaretinden önce) yeni tarifleri ekle:

```ts
// ── BATCH 2 ── (tarih: 2026-04-14, N tarif, Codex)
{
  title: "...",
  slug: "...",
  cuisine: "tr",  // mutfak kodu — bkz. src/lib/cuisines.ts
  // ... RECIPE_FORMAT.md'deki tüm alanlar
},
{
  // ...
},
// ── BATCH 2 SONU ──
```

**Dokunma:**
- Mevcut tarifler (array içindeki önceki nesneler)
- Kategori seed'leri (`prisma/seed.ts`)
- Prisma schema (`prisma/schema.prisma`)
- `main()` fonksiyonu (dosyanın alt kısmı)
- Diğer `.ts` / `.tsx` / `.md` dosyaları

**İlk batch için 50 tarif** öner. Onay alındıktan sonra sonraki batch'ler 50-100.

### 5.2. Tip kontrolü

```bash
npx tsc --noEmit
```

Hata çıkmamalı. Çıkarsa büyük ihtimalle `as const` eksik, enum yanlış yazılmış
ya da tip uyumsuzluğu var — düzelt.

### 5.2.5. Batch pre-flight validator (DB'ye dokunmaz)

```bash
npm run content:validate                         # tüm array
npm run content:validate -- --last 50            # sadece son 50 tarif
npm run content:validate -- --slugs-file docs/existing-slugs.txt
```

Zod'un üstüne semantik kontroller koşar:
- **Muğlak ifade** ("biraz", "azıcık", "ya da tersi", "duruma göre",
  "epey", "yeteri kadar") → ERROR
- **"iyice" / "güzelce"** somut kriter yoksa → WARNING
- **Kcal vs 4·P+4·C+9·F uyumu** ±%15 tolerans → WARNING (alkollü
  tariflerde otomatik atlanır — ethanol 7 kcal/gr formülde yok)
- **Alkollü malzeme ↔ "alkollu" tag** tutarsızlığı → ERROR/WARNING
- **Slug çakışması** (existing-slugs.txt üzerinden) → ERROR

Exit 0 = clean veya sadece warning, Exit 1 = en az bir ERROR.
Bu adım seed'den ÖNCE gelir → bir hata varsa seed'i çalıştırmadan düzelt.

### 5.3. Script'i çalıştır

```bash
npx tsx scripts/seed-recipes.ts
```

Çıktı şöyle görünür:

```
🌱 Seed başlatılıyor...
✅ 17 kategori oluşturuldu
✅ 15 etiket oluşturuldu
  ✅ Yeni Tarif 1 eklendi
  ✅ Yeni Tarif 2 eklendi
  ⏭️  Zaten Var Tarif atlandı
  ...
🎉 Final seed tamamlandı! 48 yeni tarif eklendi, 2 atlandı.
```

- `✅` = başarıyla eklendi
- `⏭️` = slug zaten vardı, atlandı (güvenli davranış)
- `⚠️` = kategori bulunamadı (RECIPE_FORMAT.md'deki slug listesinden sap)

### 5.4. Doğrula (opsiyonel ama önerilen)

```bash
# Slug sayısı beklediğin kadar arttı mı?
npx tsx scripts/list-recipe-slugs.ts | head -5
# Son satırda "# N recipe slugs" yazar — N eski sayıdan ne kadar arttı?
```

### 5.5. Git'e commit'le

```bash
git checkout -b recipes/batch-2
git add scripts/seed-recipes.ts
git commit -m "feat(data): batch 2 — N yeni tarif eklendi"
git push -u origin recipes/batch-2
```

GitHub'da PR aç. Merge işlemini proje sahibi yapar.

---

## 6. Kurallar (kırılmaz)

### 6.1. Güvenlik — DB'ye karşı

- **Sadece Recipe + ingredients + steps + tags yaratmak** serbest.
- **DELETE, DROP, TRUNCATE, UPDATE yasak.** Mevcut veriye dokunma.
- `prisma migrate` komutları yasak. Schema değiştirilmeyecek.
- `prisma/seed.ts` dosyasına dokunma — bootstrap dosyası.

### 6.2. Güvenlik — kod tabanına karşı

- `scripts/seed-recipes.ts` dışında hiçbir `.ts`/`.tsx` dosyası değiştirme.
- Yeni `.md` dosyası ekleme (bu doküman ve `RECIPE_FORMAT.md` dışında).
- `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.*`
  dosyalarına dokunma.

### 6.3. İçerik — tariflerin kendisi

RECIPE_FORMAT.md'deki tüm kurallara tamamen uy:

- Slug benzersiz, TR karakter yok
- Kategori slug sabit 17 değerden biri
- Tag slug sabit 15 değerden biri
- Enum değerleri doğru (type: YEMEK, TATLI, ICECEK, KOKTEYL, ...;
  difficulty: EASY, MEDIUM, HARD)
- `prepMinutes + cookMinutes ≈ totalMinutes`
- Alkol içeren tariflerin tag'lerinde mutlaka `"alkollu"` olmalı
- Metin: Türkçe, gramatik doğru, açıklayıcı ama kısa
- Besin değerleri porsiyon başı, makul aralıkta

### 6.4. Kalite

- Gerçek, yenebilir, tanınmış Türk ve dünya tarifleri (geleneksel, modern, vegan vs.)
- Uydurulmuş egzotik tarifler yok ("piña colada" var, "ay tozu kokteyli" yok)
- İçerik özgün olmalı — direkt başka siteden kopyala-yapıştır yok,
  paraphrase-ile yeniden yaz
- 3-15 malzeme, 3-10 adım

### 6.5. tipNote / servingSuggestion kalitesi (KRİTİK)

**Bu kurallar batch 7'de ihlal edildi ve 42 tarif düzeltildi. Tekrarlama.**

- **`.map()` ile toplu tipNote/servingSuggestion ATAMA YASAK**. Her tarifin
  kendi tipNote'u ve servingSuggestion'ı olmalı veya `null` olmalı.
  Generic boilerplate ("Sosu ve ana malzemeyi ayrı hazırlayın...") YASAK.
- **tipNote**: tarifin kritik püf noktası. Tarife özel, somut, gerçek
  mutfak bilgisi. Yoksa `null` bırak, sahte tip üretme.
- **servingSuggestion**: tarife özgü servis önerisi. "Sıcak servis edin"
  gibi generic öneriler YASAK — neyle, nasıl servis edileceğini yaz.
- **servingSuggestion'da sos referansı**: "X sosuyla servis edin" yazacaksan
  ya o sos tarif adımlarında olmalı, ya da hazır alınabilir bir sos olmalı
  (soya sosu, ketçap, hazır tonkatsu sosu OK — "kırmızı biber sosu",
  "orman meyveli sos" gibi belirsiz/yapılması gereken soslar YASAK).

### 6.6. Malzeme grupları (ingredient `group` alanı)

Çok-bileşenli tariflerde **zorunlu** kullan:
- Marine eden tarifler: `group: "Et için"` + `group: "Marine için"`
- Sos yapılan tarifler: `group: "Ana malzeme"` + `group: "Sos için"`
- Şerbetli tatlılar: `group: "Hamur için"` + `group: "Şerbet için"`
- Servis garnish'i: `group: "Servis için"`

Basit tek-bileşenli tariflerde (kızartma, çorba, salata) `group` EKLEME.

### 6.7. Veri doğruluğu — CI seviye ERROR (17 Nis 2026 turunda eklendi)

Bu 5 kural `validate-batch.ts` tarafından **ERROR** olarak yakalanır. ERROR varsa CI kırmızıya düşer ve PR merge edilemez. Batch göndermeden önce kendin kontrol et.

**1. Virgülle birleşik ingredient YASAK.**

```ts
// ❌ YANLIŞ — tek row içinde 3 ingredient:
{ name: "Tuz, karabiber, pul biber", amount: "1", unit: "tatlı kaşığı" }

// ✅ DOĞRU — 3 ayrı row:
{ name: "Tuz", amount: "1", unit: "çay kaşığı", sortOrder: 5 },
{ name: "Karabiber", amount: "0.5", unit: "çay kaşığı", sortOrder: 6 },
{ name: "Pul biber", amount: "0.5", unit: "çay kaşığı", sortOrder: 7 },
```

**2. Step'te geçen baseline staple ingredient olmalı.**

Step instruction'da "tuz", "karabiber", "pul biber", "un" kelimeleri geçiyorsa o ingredient listesinde bulunmalı. Örnekler:

```ts
// ❌ YANLIŞ — step'te "tuzla yoğurun" diyor ama Tuz ingredient'ta yok
steps: [{ stepNumber: 1, instruction: "Eti yoğurt, kekik ve tuzla marine edin." }],
ingredients: [{ name: "Dana eti", ... }, { name: "Yoğurt", ... }, { name: "Kekik", ... }],

// ✅ DOĞRU — Tuz eklenmiş
steps: [{ stepNumber: 1, instruction: "Eti yoğurt, kekik ve tuzla marine edin." }],
ingredients: [{ name: "Dana eti", ... }, { name: "Yoğurt", ... }, { name: "Kekik", ... }, { name: "Tuz", amount: "1", unit: "çay kaşığı", sortOrder: 4 }],
```

**3. ServingSuggestion'da bahsedilen sos/garnish ingredient OLMALI** (veya hazır ürün).

```ts
// ❌ YANLIŞ — "acı sos" ingredient yok, ne olduğu belirsiz
servingSuggestion: "Salatalık, turşu havuç ve acı sosla servis edin.",
ingredients: [{ name: "Kırık pirinç", ... }, { name: "Dana pirzola", ... }],

// ✅ DOĞRU 1 — ingredient ekle
servingSuggestion: "Salatalık, turşu havuç ve acı sosla servis edin.",
ingredients: [..., { name: "Turşu havuç", ... }, { name: "Acı sos", ... }],

// ✅ DOĞRU 2 — servingSuggestion'ı mevcut malzemelerle yaz
servingSuggestion: "Pilav, ızgara et, yumurta ve salatalıkla sıcak servis edin.",

// ✅ DOĞRU 3 — hazır ürün referansı (soya sosu, ketçap, tonkatsu sosu OK)
servingSuggestion: "Tonkatsu sosuyla servis edin.",
```

**4. Adım sırası mantıklı** — hazırlık → pişirme → servis.

```ts
// ❌ YANLIŞ — adım 1 her şeyi karıştır, adım 2 hala hazırlık
steps: [
  { stepNumber: 1, instruction: "Tüm malzemeleri kâsede karıştırın." },
  { stepNumber: 2, instruction: "Sarımsağı ezin, pul biber ve hardalla harmanlayın." },
]

// ✅ DOĞRU — hazırlık önce, karıştırma sonra
steps: [
  { stepNumber: 1, instruction: "Sarımsağı ezip pul biber ve hardalla harmanlayın." },
  { stepNumber: 2, instruction: "Yoğurt ve mayonezi bu karışımla çırpıp tuzlayın." },
  { stepNumber: 3, instruction: "Buzdolabında 15 dakika dinlendirip servis edin.", timerSeconds: 900 },
]
```

**5. Step'teki derived component açık belirtilmeli.**

Adımda "krema kullanın" / "sosu döküp" tipi referans varsa ya:
- Ingredient olarak o isim var (`Krema` ingredient'ta var), VEYA
- Önceki bir adımda o bileşen açıkça yapılıyor ("Süt ve şekeri kaynatıp pastacı kreması hazırlayın, topları kremayla doldurun.")

```ts
// ❌ YANLIŞ — "Topları krema ile doldurun" ama Krema yok
ingredients: [{ name: "Un", ... }, { name: "Yumurta", ... }, { name: "Süt", ... }, { name: "Şeker", ... }],
steps: [..., { stepNumber: 3, instruction: "Topları krema ile doldurun ve çikolata sosuyla kaplayın." }],

// ✅ DOĞRU — step 3'te krema hazırlama açık
steps: [..., { stepNumber: 3, instruction: "Süt ve şekeri kaynatıp pastacı kreması hazırlayın, çikolatayı eritin. Topları kremayla doldurup çikolata sosuyla kaplayın." }],
```

**6. Ingredient-implied alerjenler — her zaman ekle.**

Bazı malzemeler görünce alerjen otomatik devreye girer; ingredient varsa `allergens` arrayine *mutlaka* eklemek gerekir. Batch 11'de bu pattern'da 9 CRITICAL finding çıktı; CI henüz bunu ERROR olarak yakalamıyor ama audit-deep merge sonrası yakalıyor — bu yüzden batch yazarken kendi kontrolün.

| Ingredient (TR) | Gerekli allergen |
|---|---|
| Tereyağı, süt, yoğurt, kefir, kaşar, peynir, krema, ayran, labne | `SUT` |
| Un, yufka, ekmek, makarna, bulgur, firik, yulaf, dövme buğday, arpa şehriye | `GLUTEN` |
| Yumurta, mayonez (ev yapımı) | `YUMURTA` |
| Tahin, susam | `SUSAM` |
| Ceviz, fındık, badem, Antep fıstığı, kaju | `KUSUYEMIS` |
| Yer fıstığı, fıstık ezmesi | `YER_FISTIGI` |
| Soya sosu, tofu, edamame, miso | `SOYA` |
| Karides, somon, ton balığı, hamsi, ahtapot, midye, yengeç, kalamar | `DENIZ_URUNLERI` |

Dikkat: _Hindistan cevizi sütü_ SUT **değil** (bitki bazlı); _pirinç sütü_, _badem sütü_, _yulaf sütü_ de SUT değil ama badem → KUSUYEMIS, yulaf → GLUTEN.

```ts
// ❌ YANLIŞ — Tereyağı var ama SUT yok
allergens: ["GLUTEN"] as const,
ingredients: [..., { name: "Tereyağı", amount: "30", unit: "gr", sortOrder: 5 }],

// ✅ DOĞRU
allergens: ["GLUTEN", "SUT"] as const,
ingredients: [..., { name: "Tereyağı", amount: "30", unit: "gr", sortOrder: 5 }],
```

```ts
// ❌ YANLIŞ — Tahin var ama SUSAM yok, Ceviz var ama KUSUYEMIS yok
allergens: ["GLUTEN"] as const,
ingredients: [..., { name: "Tahin", ... }, { name: "Ceviz", ... }],

// ✅ DOĞRU
allergens: ["GLUTEN", "KUSUYEMIS", "SUSAM"] as const,
ingredients: [..., { name: "Tahin", ... }, { name: "Ceviz", ... }],
```

### 6.8. Pre-flight kontrol

Batch yazdıktan sonra, seed çalıştırmadan ÖNCE:

```bash
npm run content:validate -- --last 100
```

Bu 0 ERROR dönmeli. ERROR dönerse yukarıdaki 5 kuraldan birini ihlal etmişsin demektir; düzeltmeden seed etme. WARNING'ler (cuisine boş, "iyice" kullanımı) kabul edilebilir ama mümkünse minimize et.

---

## 7. Sorun giderme

### "DATABASE_URL missing"

`.env.local` dosyası yok ya da `DATABASE_URL=""` boş. Neon branch'i açıp URL'yi
koy (Bölüm 3).

### "Kategori bulunamadı: xxx-yyy"

Yazdığın `categorySlug` sabit 17 slug'dan biri değil. RECIPE_FORMAT.md'den
kontrol et.

### "Type 'string' is not assignable to type '\"YEMEK\" | ...'"

`type` ve `difficulty` alanlarında `as const` ekle:

```ts
type: "YEMEK" as const,
difficulty: "EASY" as const,
```

### "unique constraint failed on the fields: (slug)"

Bu hata gelmez çünkü script kontrol ediyor — ama olursa script'i yeniden
çalıştır, atlar.

### Script hata verip yarıda kalırsa

Ne kadar tarif eklendiğini `list-recipe-slugs.ts` ile kontrol et. Script
idempotent: aynı script'i tekrar çalıştırırsan kalan yerden devam eder
(eklenmiş olanları atlar).

### Kötü batch geri alınması (rollback)

Bir batch yazıldıktan sonra "bu batch baştan yanlış, hepsini sil" durumu
olursa proje sahibi `npm run content:rollback` komutunu kullanır — Codex
bu scripti koşmaz, sadece bilgi olarak:

```bash
# önce dry-run (hangi tarifler silinecek + bookmark/koleksiyon etkisi)
npm run content:rollback -- --batch 2

# gerçekten silmek için echo-phrase onayı:
npm run content:rollback -- --batch 2 --confirm "rollback-batch-2"
```

- Varsayılan **dry-run** — veri silinmez, sadece etki raporu basar.
- Kullanıcı uyarlaması (`Variation`) olan tarifleri otomatik **bloklar**
  (user içeriği kaybolmasın). `--force` ile zorlanır ama pratikte yeni
  seed'lenen tarifin uyarlaması olmaz.
- Cascade silinen ingredient/step/tag'ler, bookmark'lar, koleksiyon
  item'ları rapor edilir — sürpriz yok.
- Her silme `AuditLog`'a yazılır (`action=ROLLBACK_RECIPE`).

### İnternet/Redis/Auth hataları

Codex'in bu projeyi çalıştırmasına gerek yok, sadece seed script. Redis
(`UPSTASH_*`) ve auth env var'ları kullanılmıyor, uyarılar görmezden gel.

---

## 8. Hedef

**İlk sprint: 500 kaliteli Türkçe tarif.** Dağılım RECIPE_FORMAT.md Bölüm
"İdeal batch"te. Batch batch ilerle:

| Batch | Tarif sayısı | Not |
|---|---|---|
| 1 | 50 | Format doğrulama — proje sahibi kontrol eder |
| 2-4 | 50-100 | Onay sonrası hızlanır |
| 5-10 | 50-100 | Kategori dengesine dikkat |
| **Toplam** | **500** | İlk hedef |
| İleri | +500 | Kalite yüksek kalırsa genişle |

**Kalite > miktar**. 1000 ortalama tarif yerine 500 çok iyi tarif daha
değerli (SEO + kullanıcı deneyimi).

---

## 9. İletişim

Her batch sonrası GitHub'da PR aç. Açıklamada:

- Kaç tarif eklendi
- Kategori dağılımı
- Varsa tereddüt ettiğin içerik
- Seed script çıktısı (kaç ekle, kaç atla)

Proje sahibi PR'ı review eder, merge sonrası ana PC'den aynı script'i
production branch URL'i ile çalıştırır → canlıya geçer.

---

## 10. Kısa özet (acele okuma)

1. `git clone https://github.com/KOZcactus/tarifle.git && cd tarifle && npm install`
2. Proje sahibinden Neon `codex-import` branch DATABASE_URL'ini al, `.env.local`'e yaz
3. `docs/RECIPE_FORMAT.md` oku (**önemli: yeni `allergens` alanı eklendi**)
4. `npx tsx scripts/list-recipe-slugs.ts > docs/existing-slugs.txt` → mevcut slug listesi
5. `scripts/seed-recipes.ts` sonuna yeni batch ekle — her tarifin `allergens: [...]` ve `cuisine: "xx"` alanını doldur
6. `npx tsc --noEmit` → hata yok
7. `npm run content:validate -- --last 50 --slugs-file docs/existing-slugs.txt` → **Zod + semantik kontrol** (muğlak ifade, makro uyumu, alkol tag, slug dup). ERROR varsa seed'i çalıştırma — düzelt
8. `npx tsx scripts/seed-recipes.ts` → veritabanına yaz
9. `npx tsx scripts/retrofit-all.ts` → **tek komut** — önce alerjen, sonra vegan/vejetaryen etiketlerini otomatik doldurur (idempotent, yanlış olanları temizler). İstersen `--dry-run` ile önce önizleme
10. Git branch + commit + push + PR
11. Tekrar

Eşlik edecek dosya: **`docs/RECIPE_FORMAT.md`** — o dosyayı da okumadan tarif yazma.

**En kritik 3 yazım kuralı** (`RECIPE_FORMAT.md` "Dil ve anlatım kalitesi"
bölümünün özeti; detay orada):

1. **"ya da tersi" gibi muğlak koşullu ifadeler YASAK** — iki durum varsa
   iki ayrı cümleyle yaz (ör. "kek sıcakken soğuk şerbet. Kek soğumuşsa
   sıcak şerbet.").
2. **Composite ingredient adı YASAK** — "Şerbet şekeri" yerine
   `{ name: "Şeker", group: "Şerbet için" }` kullan.
3. **"Biraz", "iyice", "azıcık" gibi belirsiz ölçüler YASAK** — sayı
   veremediğin yerde niteliksel metrik ver ("elinize yapışmayana kadar
   8-10 dakika").
