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
| **"Mod C"**, "Kategori SEO", "SEO copy", "landing intro + FAQ" | **MOD C**, landing sayfaları için özgün TR giriş + FAQ yaz | §12 | `docs/seo-copy-v1.json` (17 kategori + 16 mutfak + 5 diyet = 38 item array) |
| **"Mod D"**, "editoryal revize", "top 200 duzelt", "tipNote drift fix" | **MOD D**, mevcut tariflerin tipNote + servingSuggestion revize JSON | §13 | `docs/editorial-revisions-batch-N.json` (slug bazlı update array) |
| **"Mod E"**, "step revize", "adım kalitesi düzelt", "boilerplate steps" | **MOD E**, mevcut tariflerin steps array'ini yeniden yaz + opsiyonel ingredient düzeltme (araştırmaya göre eksik malzeme/yanlış oran) | §14 | `docs/step-revisions-batch-N.json` (slug + steps + opsiyonel ingredients) |

**Default'lar (soru sorma, direkt başla):**

### Mod A default (Kerem "Mod A. Batch Na" / "Mod A. Batch Nb" derse):
- **50 tarif** yaz (B30 Windows komut uzunluğu sınırı dersinden sonra
  100→50 ikiye bölündü; tek teslim daha kontrollü, recurring block
  riski azaldı)
- Batch adı: **{N}a** ilk 50, **{N}b** sonraki 50 (örn. Batch 30a,
  30b; 31a, 31b). Kerem her yarıyı ayrı tetikler.
- Dağılım: **~25 TR + ~25 uluslararası**, uluslararasıda eksik mutfaklardan çeşitlilik
- TR'de **bölgesel çeşitlilik** zorunlu, sadece klasik değil, 7 bölgeden örnekler (Karadeniz, Ege, Güneydoğu, İç Anadolu, Doğu, Marmara, Akdeniz)
- **isFeatured: her yarıda 3-5 tarif** (toplam batch için 5-10)
- Eksik kategoriler için Kerem'e öncelik sor (kahvaltı/çorba/tatlı dengelensin)
- Marker: `// ── BATCH 30a ──` (küçük `a`/`b` harf)

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

### Mod C default (Kerem sadece "Mod C" veya "Kategori SEO" derse):
- **Çıktı:** `docs/seo-copy-v1.json`, 38 item array (17 kategori + 16 mutfak + 5 diyet).
- Her item: `{ slug, type, intro, faqs }`.
  - `slug`: string, sabit listeden (§12).
  - `type`: `"category" | "cuisine" | "diet"`.
  - `intro`: TR 180-220 kelime, tek paragraf, özgün + somut + slug'a özgü karakter.
  - `faqs`: 4 item, her biri `{ q, a }`, her `a` 60-90 kelime, spesifik (generic değil).
- Detay §12.

### Mod D default (Kerem sadece "Mod D" veya "editoryal revize" derse):
- **Çıktı:** `docs/editorial-revisions-batch-N.json`, 100 item array (batch
  numarası Kerem'in belirttiği; default en son batch veya Kerem verir).
- **Kaynak:** Kerem sana input CSV verir: `docs/editorial-review-batch-N.csv`
  (slug + mevcut tipNote + servingSuggestion + ingredients + steps
  okunur), SENIN işin drift/generic/yanlış-bağlam metinleri revize
  etmek.
- Her item: `{ slug, tipNote?, servingSuggestion? }`.
  - Sadece degistirilecek alanı yaz (partial update). Degisiklik gerekmeyen
    alanı JSON'a KOYMA (undefined = dokunma).
  - `slug`: CSV'den aynen kopyala.
  - `tipNote`: revize TR 8-20 kelime, somut ölçü + zaman + yöntem. Generic
    ("iyi olsun", "güzel pişer") YASAK.
  - `servingSuggestion`: revize TR 8-20 kelime, spesifik servis bağlamı.
- Detay §13.

### Mod E default (Kerem sadece "Mod E" veya "step revize" derse):
- **Çıktı:** `docs/step-revisions-batch-N.json`, ~100 item array.
- **Kaynak:** `docs/step-review-batch-N.csv` (slug + mevcut steps + issues
  + ingredients), audit-step-quality.ts otomatik üretir.
- Her item: `{ slug, steps: [{ stepNumber, instruction, timerSeconds? }] }`.
  - **TAM REPLACEMENT:** Mevcut steps tamamen silinir, yenileri yazılır.
    Partial yok, tek adım dokunmak için bile tüm steps yazılır.
  - **slug:** CSV'den aynen kopyala.
  - **steps:** ardışık 1..N stepNumber, **type bazli minimum** (Kerem karari): **ICECEK 3+, KOKTEYL/APERATIF 4+, diger (YEMEK/CORBA/SALATA/TATLI/KAHVALTI) 5+**. Max 12. Detay §14.6.
  - **Ingredient listesi DOKUNULMAZ** (Mod E sadece steps; ingredient
    listesi sabit).
  - **tipNote + servingSuggestion DOKUNULMAZ** (Mod D alanı).
- Detay §14.

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

**Default scope (Kerem "Mod A. Batch Na" / "Mod A. Batch Nb" dediğinde):**
- **50 tarif** (B30 dersi: Windows komut uzunluğu sınırı + recurring
  block riski yüzünden 100→50 ikiye bölündü. {N}a = ilk 50, {N}b =
  sonraki 50. Kerem her yarıyı ayrı tetikler, ikisi arası tarif
  tekrar üretmezsin ama her yarıda kendi 25 TR + 25 int dağılımı)
- **~25 TR + ~25 uluslararası** (uluslararasıda §5 cuisine
  tablosundan eksik olan kodlardan, genelde `se/hu/pe/gb/pl/au` az olanlar,
  ya da `ru/vn/es/cu` gibi gelişmekte olanlar)
- **7 Türk bölgesi dengelensin** (Karadeniz, Ege, Güneydoğu, İç Anadolu,
  Doğu, Marmara, Akdeniz), sadece İstanbul/klasik değil, Rize-Antalya-Erzurum-
  Mardin gibi bölgesel çeşitlilik zorunlu. Bir yarıya sığmazsa
  diğer yarıda telafi et.
- **Kategori dağılımı** (her yarıda yaklaşık): kahvaltı 5-7, çorba
  4-6, ana yemek 10-12, tatlı 7-10, meze/salata 4-6, hamur işi 4-6,
  içecek 2-5, kokteyl 1-3 (50 tariflik yarı; toplam batch 100
  tarif için bunların 2 katı)
- **isFeatured: 3-5 her yarıda** (toplam batch için 5-10; sadece
  gerçekten ikonik tarifler, ilk kez duyulacak "Cantık Pidesi" gibi
  değil, "Adana Kebap" kalibresi)

**⚠️ Yarı batch (Na / Nb) ek kurallar:**
- Batch 30a teslim sonrası Claude `existing-slugs.txt` regen yapar,
  30b'ye geçmeden önce Codex güncel listeyi okumalı (30a'daki 50
  slug artık yasak).
- Her yarı **kendi marker'ıyla** append: `// ── BATCH 30a ──` veya
  `// ── BATCH 30b ──`. İki ayrı IIFE, iki ayrı blok.
- 30a ve 30b arası **mental slug seti paylaşma**; Codex 30a session'u
  30b başlarken slug'larını unutmuş olabilir, existing-slugs.txt
  zorunlu referans.

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
- Son çare (recurring block tekrar ederse, Kerem onayıyla): batch'i ayrı
  bir `.txt` olarak ver, Claude append eder. Default akış direkt
  `seed-recipes.ts`'ye append.

**⚠️ Append noktası mimarisi (batch 27 v1 dersi, kritik):**

`scripts/seed-recipes.ts` ~15000 satır. TÜMÜNÜ context'e ALMA. Sadece
dosyanın SON 100-150 satırına bak: önceki batch'in IIFE kapanışı + en
dıştaki `];` bracketi. Gerisine ihtiyacın yok.

Append yeri (dosyanın son iki satırı):

```
      })(),
    ];
```

`];` bracket'ini yerinde bırak, yukarısına yeni IIFE ekle:

```
      })(),
      // ── BATCH N ── (tarih: YYYY-MM-DD, 100 tarif, Codex)
      ...(() => {
        const t = (enTitle, enDescription, deTitle, deDescription) => ({
          en: { title: enTitle, description: enDescription },
          de: { title: deTitle, description: deDescription },
        });
        const ing = (specs) => specs.map((s, i) => {
          const [name, amount, unit] = s.split("|");
          return { name, amount, unit, sortOrder: i + 1 };
        });
        const st = (specs) => specs.map((s, i) => {
          const [instruction, timer] = s.split("||");
          return timer
            ? { stepNumber: i + 1, instruction, timerSeconds: Number(timer) }
            : { stepNumber: i + 1, instruction };
        });
        const r = (o) => ({
          ...o,
          ingredients: ing(o.ingredients),
          steps: st(o.steps),
        });
        return [
          r({ ... }), // tarif 1
          ...
          r({ ... }), // tarif 100
        ];
      })(),
    ];
```

**⚠️ Recurring block kapanı (batch 27 v1 dersi):**

Batch 27 ilk denemede "aynı blok tekrar tekrar" üretilmeye başlamıştı,
Kerem rollback etti. Kök neden muhtemelen: dosyayı parça parça okuyup
her parçada context sıfırlanınca auto-complete aynı slug'ı iki kez
önerdi.

Önlem:

1. Tüm 100 tarifi kafanda TEK akışta oluştur, sonra yaz (parça parça
   edit döngüsü YOK).
2. Mental slug set tut: her yeni slug için "zaten listemde mi?" sorusu.
3. Teslim öncesi kendi yazdığın batch bloğunda grep at:

   ```
   /slug: "([^"]+)"/g  eşleşmeleri unique olmalı, sayı = 100
   ```

   Duplicate varsa yeniden yaz.

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
| **Mod B pidgin / yarı-çeviri (backfill-02 v1, dosya reddedildi)** | EN step: `"Apple core and into thin rounds sliceyin."`; DE step: `"Apfel 100c firinda 2 saat kurutmehl."` | Özne + fiil eksik, cümle yapısı bozuk, TR kökleri EN/DE sonlara eklenmiş (pidgin), telegrafik yapı | EN: `"Remove the cores of the apples and slice them into thin rings."`; DE: `"Die Äpfel entkernen und in dünne Ringe schneiden."` (her cümle özne + fiil + nesne tam, TR leak sıfır) |
| **Mod A recurring block (batch 27 v1, Kerem rollback etti)** | `scripts/seed-recipes.ts`'e append sırasında "aynı blok tekrar tekrar üretildi", Codex dosyayı parça parça okuyup her parçada context sıfırlanınca auto-complete aynı slug'ı 2+ kez önerdi | Seed dosyasının tümünü (15000+ satır) context'e alıp diff üretmeye çalışınca döngüye girildi | **Dosyanın TÜMÜNÜ okuma.** Sadece son 100-150 satıra bak (önceki batch IIFE kapanışı + en dıştaki `];`). 100 tarifi kafanda TEK akışta oluştur, sonra yaz. Teslim öncesi kendi bloğuna `/slug: "([^"]+)"/g` grep, unique 100 olmalı (§5 "Append noktası mimarisi" + "Recurring block kapanı") |
| **Step-ingredient mismatch (backfill-08 kolbaszli-lecso, backfill-09 goi-ga-bap-cai)** | `kolbaszli-lecso`: ingredients listesinde "Macar sosis 160 gr" var ama step'lerin HİÇBİRİNDE sosisi eklemek/pişirmek geçmiyor. `goi-ga-bap-cai`: step 2 "lime suyu" bahsediyor ama ingredient'te lime yok. Üçüncü tip: Codex kendi issues alanına flag atıp teslim ediyor (iyi refleks, ama source TR tarif verisi). | TR tarif seed'i ingredient-step bütünlüğü olmadan yazıldı; Codex çevirirken fark etti ama düzeltmedi (yazma yetkisi yok), sadece issues'a not düştü. | **İyi pattern**: Codex issues'a detail yazmaya devam etsin (Claude post-apply'da targeted patch yapar). **Daha iyi**: self-check pass 1 sırasında TR source'u tara: her step'teki isim/fiilin ingredient listesinde karşılığı var mı? Yoksa issues'a `step-ingredient-missing` flag + teslim et. |
| **Tag-content mismatch (backfill-08 medianoche-sandwich, dereotlu-olivier-salatasi)** | `medianoche-sandwich`: tags `["vejetaryen"]` ama ingredient listesinde "cooked pork" ve "Swiss cheese" var (sandviç domuz içeriyor). `dereotlu-olivier-salatasi`: title "Dereotlu" ama ingredient'te dereotu yok. | TR tarif metadata'sı içerikle uyuşmuyor (yanlış tag/title). Kullanıcıya yanıltıcı (vejetaryen filtre aktif birine domuz tarifi gösterir) veya search SEO için drift (title promise içerikle eşleşmeli). | **Flag et, NOT DÜZELTME**: issues'a `type: "other"` + detail "tag/title content ile uyuşmuyor". Claude review ve targeted fix yapar (tag kaldır, ingredient ekle). Sadece çeviri alanın dışında değişiklik YAPMA. |
| **Content drift issues takibi (backfill-08 + backfill-09 pattern)** | Codex son 2 backfill'de kaliteli issues raporluyor (backfill-08: 4 issue, backfill-09: 1 issue). Bunlar Mod B dışı TR source tarif sorunları. | İyi refleks. Codex content-level drift tespit ediyor, Claude apply sonrası targeted fix uyguluyor. | **Devam et**. Self-check pass sırasında (§8) TR kaynak kontrolüne ekle: (a) her ingredient step'te kullanılıyor mu? (b) title'daki key ingredient ingredient listesinde var mı? (c) tags (vegan/vejetaryen/vb) ingredient class'ıyla uyumlu mu? Eşleşmeyen bulursan `issues` alanına yaz. |

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

---

## 12. Mod C, Landing SEO copy (intro + FAQ)

**Amaç:** Tarifle'nin 3 tür landing sayfasına (kategori / mutfak / diyet)
özgün TR giriş metni + spesifik FAQ yazmak. Mevcut sayfalarda ya generic
tek cümle var, ya hiçbir şey; Google long-tail aramalarında (örn.
"çorbalar hakkında", "Japon mutfağında ne var", "glutensiz kahvaltı")
sinyal zayıf.

### 12.1 Çıktı dosyası

- **Tek dosya:** `docs/seo-copy-v1.json`
- **Array, 38 item:** 17 kategori + 16 mutfak + 5 diyet.
- Encoding: UTF-8, BOM yok, 2-space indent.
- Mevcutsa **üzerine yazma** (wrapper değil, yeni dosya).

### 12.2 Item şeması

```json
{
  "slug": "corbalar",
  "type": "category",
  "intro": "TR 180-220 kelime özgün paragraf. Slug karakterini yansıt.",
  "faqs": [
    { "q": "…?", "a": "TR 60-90 kelime spesifik cevap." },
    { "q": "…?", "a": "…" },
    { "q": "…?", "a": "…" },
    { "q": "…?", "a": "…" }
  ]
}
```

- `slug`: sabit listeden (§12.5).
- `type`: `"category"` | `"cuisine"` | `"diet"`. Slug'a göre doğru type.
- `intro`: tek paragraf, **180-220 kelime**, Tarifle ses tonu (samimi, sade, pratik). Slug'a özgü karakter çıkar: "çorbalar" için sıcak + doyurucu + hızlı; "Japon mutfağı" için denge + umami + minimalizm; "glutensiz" için malzeme bazlı temiz tanım + disclaimer (çapraz bulaşma takip edilmez).
- `faqs`: **4 soru-cevap**. Sorular slug'a özgü (generic "tarif nasıl yapılır" değil); "çorbalar için tavuk suyunu nasıl netleştiririm?", "Japon mutfağında dashi yerine ne kullanabilirim?", "glutensiz bir kahvaltıda hangi tahıllar güvenli?" tarzı. Cevap **60-90 kelime**, somut + pratik + örnekli.

### 12.3 İçerik kuralları (her iki § için)

**YAPILACAKLAR:**
- Slug'ın **kültürel ve pratik karakteri** yansısın: mutfak için bölge/malzeme/teknik; kategori için öğün rolü + yeme anı + porsiyon; diyet için tanım + sınırlama + güvenli alanlar.
- **Somut dil**: "bolca", "iyice", "lezzetli" gibi muğlak ifadelerden kaçın. Yerine ölçü + yöntem + zaman: "tencereyi 20 dakika ağır ateşte tut", "suyunu 5 dakika süz".
- **TR collation** (ç, ğ, ı, İ, ö, ş, ü) doğru. "ı/i" karışıklığı yok.
- **Disclaimer** (diyet intro'larında zorunlu): glutensiz + sütsüz için "malzeme listesine göre … içermeyen tarifler; çapraz bulaşma takibi yapılmaz; ciddi hassasiyet için ürün etiketlerini doğrulayın" benzeri açıklama. Sonuna veya 1 cümleyle içine entegre et.

**YASAKLAR:**
- **Em-dash (— U+2014) YASAK**. Yerine virgül, nokta, parantez, iki nokta. En-dash (–) da yasak.
- **Generic cümle**: "Bu sayfada birçok tarif var" gibi hiçbir bilgi taşımayan tümceler.
- **Rakip isim**: Yemek.com, Nefis Yemek gibi platform adı geçmesin.
- **Fiyat/kampanya vaadi**: "ücretsiz", "şimdi kaydol" gibi marketing copy yok. Editoryal + bilgilendirici ton.
- **Zaman işareti** (bu yaz, bu ay, 2026'da): evergreen içerik, tarihi referans yok.
- **"Tarifle" brand name intro'da bir kez geçebilir**, FAQ cevaplarında geçirme (kendi kendini övme riski).
- **"Yemek çeşidi" vs "tarif" terminology**: katalog sayımlarında "yemek çeşidi", yapılış bağlamında "tarif" tercih et (ana sayfa i18n tutarlılığı için).

### 12.4 Self-review (teslim öncesi çift kontrol)

- [ ] 38 item var (17 + 16 + 5 toplam).
- [ ] Her slug listede (§12.5) geçiyor, fazla/eksik yok.
- [ ] Her `intro` 180-220 kelime (Python `len(text.split())` veya manuel say).
- [ ] Her `faqs` tam 4 item, her `a` 60-90 kelime.
- [ ] Em-dash (—) grep: 0 eşleşme.
- [ ] Generic cümle yok (slug değişse de cümle aynı kalabiliyorsa generic).
- [ ] JSON valid (`jq . docs/seo-copy-v1.json` veya online validator).

### 12.5 Slug listesi (sabit, eksik yazma)

**17 kategori** (`type: "category"`):
`corbalar`, `salatalar`, `kahvaltiliklar`, `ana-yemekler`, `tavuk-yemekleri`,
`et-yemekleri`, `baklagil-yemekleri`, `makarna-ve-pilav`, `hamur-isleri`,
`aperatifler`, `mezeler`, `tatlilar`, `icecekler`, `soslar`, `pideler-ve-lahmacunlar`,
`kahveler-ve-cay`, `kokteyller`

**16 mutfak** (`type: "cuisine"`):
`turk`, `italyan`, `fransiz`, `ispanyol`, `yunan`, `japon`, `cin`, `kore`,
`tay`, `hint`, `meksika`, `abd`, `orta-dogu`, `kuzey-afrika`, `vietnam`, `ingiltere`

**5 diyet** (`type: "diet"`):
`vegan`, `vejetaryen`, `glutensiz`, `sutsuz`, `alkolsuz`

---

## 13. Mod D, Top 200 editoryal revize

**Amaç:** Mevcut canlı tariflerde (2800+) küçük drift/generic/bağlam-dışı
tipNote ve servingSuggestion metinleri görülüyor. GPT audit örneği:
Makroudh tatlısında "uzun pişimde ara ara karıştırmak" notu, aslında
bir hamur tatlısı için bağlama oturmuyor. Bu tür drift'leri toplu olarak
temiz hale getirmek.

Bu mod veri değişikliği yapar ama yeni tarif eklemez. Mevcut DB
satırlarının yalnızca `tipNote` ve `servingSuggestion` kolonlarını
update eden JSON üretir; Claude apply kodunu yazar ve dev + prod'a
uygular.

### 13.1 Girdi (Kerem sana ne verir)

- **CSV yolu**: `docs/editorial-review-batch-N.csv` (N = Kerem'in
  belirttiği batch numarası; 1'den başlayarak artan).
- **CSV kolonları** (okuyacağın, yazmayacağın):
  ```
  slug, title, category, type, cuisine,
  ingredients_tr, steps_tr,
  tipNote_current, servingSuggestion_current
  ```
- Tipik batch boyutu: **100 tarif** (en çok görüntülenen 200 tarif iki
  batch'e bölünür, 100-100).

### 13.2 Çıktı dosyası

- **Tek dosya**: `docs/editorial-revisions-batch-N.json`
- **Array, değişken boyut** (senin degisiklik onerdigin tarif sayısı;
  CSV'deki 100'den az olabilir, 100 zorunlu değil).
- Encoding: UTF-8, BOM yok, 2-space indent.

### 13.3 Item şeması

```json
{
  "slug": "makroudh-tunus-usulu",
  "tipNote": "Hamuru 30 dakika dinlendirmek sekerlemenin icinde yumusak katman birakir.",
  "servingSuggestion": "Serbetli olarak orta sicaklikta, yaninda Tunus kahvesiyle sun."
}
```

**Kritik**:
- `slug` zorunlu, CSV'den aynen kopyala.
- `tipNote` ve `servingSuggestion` **her ikisi de opsiyonel**.
  Yalnızca **degisiklik onerdigin** alanı yaz. Alan dokunulmasın istiyorsan
  JSON'a ekleme (null veya "" yazma, tamamen atla).
- Degisiklik yoksa o tarifi JSON'a HIC EKLEME. Array'de yalnızca
  degistirilmesi gerekenler yer alır.

### 13.4 Nerede degisiklik onerirsin (karar cercevesi)

**tipNote revize kriterleri**:
- Generic ifade ("iyi olsun", "güzel pişer", "lezzet katar") — REVIZE
- Baglam dışı ("uzun pişimde karıştır" ama tarif 5 dakika) — REVIZE
- Ölçü/zaman eksik ("biraz bekle") — REVIZE (5 dk, 10 dk gibi somut)
- Zaten somut + spesifik + tarifin karakterini yansıtıyor — DOKUNMA

**servingSuggestion revize kriterleri**:
- "Sıcak servis edin." gibi tek cümlelik generic — REVIZE (nereye,
  yanında ne, hangi kap, hangi anda)
- Zaten bağlam verici ("yanında taze sumak ve limonlu roka ile ılık
  servis") — DOKUNMA

**Şüphe durumunda DOKUNMA**. Doğruluk > hacim. 100 tariflik CSV'den 40
degisiklik de kabul edilir, 100 zorla revize KOTU.

### 13.5 Yazım kuralları (Mod A/B/C ortak)

- **Em-dash (— U+2014) YASAK**. Yerine virgul, nokta, parantez, iki
  nokta. En-dash (–) de yasak.
- **Muglak ifade yasak**: "iyice", "bolca", "biraz" — ölçü + zaman ver.
- **Marka ismi geçmez** (Tarifle dahil, içsel brand vurgusu JSON'a
  gerekmez).
- **Zaman işareti yok** (evergreen).
- **TR collation**: ç, ğ, ı, İ, ö, ş, ü doğru. ASCII düşmesin.
- **TipNote**: 8-20 kelime. Tek cümle veya kısa iki cümle. Uzunluk sınırı
  sıkı.
- **servingSuggestion**: 8-20 kelime. Servis bağlamı + yan öğe veya
  sunum şekli.

### 13.6 Self-review (teslim öncesi)

- [ ] JSON valid (`jq . docs/editorial-revisions-batch-N.json`).
- [ ] Her item'da `slug` var + CSV'deki bir slug'a eşleşiyor (slug
      uydurmadın).
- [ ] Her item'da en az bir alan dolu (`tipNote` veya `servingSuggestion`),
      boş item yok.
- [ ] (Mod E özel) Eğer `ingredients` revize edildiyse: steps o
      ingredient'leri kullaniyor (eksik kalmasin), TAM array (partial
      yok), sortOrder ardisik.
- [ ] Em-dash grep: 0 eşleşme.
- [ ] Kelime sayısı her tipNote + servingSuggestion'da 8-20 arası
      (Python `len(text.split())` kontrol).
- [ ] Generic cümle yok (değişiklik önerdin ama hala generic
      kalmadıysa, tekrar revize).
- [ ] CSV'de dokunmadığın tarifleri JSON'a EKLEMEDİN.

### 13.7 Dosya adlandırma + versiyonlama

- İlk batch: `docs/editorial-revisions-batch-1.json`
- İkinci batch: `docs/editorial-revisions-batch-2.json`
- ...
- Kerem "Mod D. Batch 3" derse batch 3 dosyası.

Apply sonrası Claude DB'ye update atar, dosya kaynak olarak tracking'de
kalır (review + rollback trace için).

---

## 14. Mod E, Step kalitesi revize (boilerplate / sicaklik / belirsiz)

**Amaç:** Mevcut canlı tariflerin (~2700) bazılarında step'ler yetersiz:
"Sebzeleri ince yerleştirin" (enginar açıkça yazılmamış), "Pideyi 18
dakika pişirin" (sıcaklık eksik), 3 adımdan oluşan tarifler. Mod E bu
sorunları sistematik tarayıp Codex'e revize ettirir.

Bu mod **steps array'ini TAM olarak yeniden yazar** (replacement, partial
update değil). Ingredient listesine, tipNote'a, servingSuggestion'a
dokunmaz.

### 14.1 Girdi (Kerem sana ne verir)

- **CSV yolu:** `docs/step-review-batch-N.csv` (N = batch numarası,
  1'den artan).
- **CSV kolonları:**
  ```
  slug, title, type, category, cuisine, stepCount, score, issues,
  ingredients_tr, current_steps_tr
  ```
  - `type`: Recipe type enum (YEMEK, CORBA, SALATA, TATLI, KAHVALTI,
    ICECEK, KOKTEYL, APERATIF). Min step eşiği buradan belirlenir
    (bkz. §14.6). `category`'den farklıdır: `category` = kategori slug'ı
    (ör. `tavuk-yemekleri`), `type` = Recipe type enum.
  - `score`: yüksek = daha sorunlu (ağırlıklı: KRITIK em-dash +5, AGIR
    no-temp/no-time/few-steps +3, ORTA short-step/vague +1)
  - `issues`: noktalı virgülle ayrı liste (`few-steps;no-temp;...`)
  - `ingredients_tr`: pipe ile ayrı liste (`Un 2 su bardağı | Enginar...`)
  - `current_steps_tr`: pipe pipe (`||`) ile ayrı adım (`1. ... || 2. ...`)
- Tipik batch boyutu: **100 tarif** (en sorunlu 100, score desc).

### 14.2 Cikti dosyasi

- **Tek dosya:** `docs/step-revisions-batch-N.json`
- **Array, tam tarif sayısı kadar (en az 1, ideal CSV'deki tüm 100).**
- Encoding: UTF-8, BOM yok, 2-space indent.

### 14.3 Item şeması

```json
{
  "slug": "enginarli-domatesli-pide-manisa-usulu",
  "steps": [
    { "stepNumber": 1, "instruction": "Unu 1 cay kasigi tuz...", "timerSeconds": 1800 },
    { "stepNumber": 2, "instruction": "Enginar kalplerini..." },
    { "stepNumber": 3, "instruction": "Hamuru oval acin..." },
    { "stepNumber": 4, "instruction": "Onceden 220 derece...", "timerSeconds": 1080 }
  ],
  "ingredients": [
    { "sortOrder": 1, "name": "Un", "amount": "2", "unit": "su bardağı" },
    { "sortOrder": 2, "name": "Tuz", "amount": "1", "unit": "çay kaşığı" }
  ]
}
```

**Kritik (steps zorunlu):**
- `slug` zorunlu, CSV'den aynen kopyala.
- `steps` array zorunlu (type bazli min: ICECEK 3+, KOKTEYL/APERATIF 4+,
  diger 5+; ideal 5-7, max 12).
- `stepNumber` ardışık 1, 2, 3, ... (boşluk yok).
- `instruction` her step için zorunlu, **5-25 kelime ideal**. Son
  servis step'i 3-4 kelime OK ("Çorbayı sıcak servis edin", "Tostları
  ılık servis edin"). Ana pişirme adımlarında 5+ kelime hedef, kısa
  servis kapanışı esnek. Hard minimum 3 kelime.
- `timerSeconds` opsiyonel ama **pişirme/dinlendirme/marine adımlarında
  ekle**. Saniye cinsinden integer (30 dk = 1800, 1 saat = 3600, 18 dk
  = 1080). UI dahili zamanlayıcıda kullanır.

**Opsiyonel ingredient revizyonu (yeni, Kerem direktifi):**

Internet araştırması sırasında **tarifte başka hata** fark edersen
(eksik malzeme, yanlış oran, gereksiz malzeme) `ingredients` alanını
da JSON'a ekle. Bu durumda **TAM REPLACEMENT** olur (eski tüm
ingredient silinir, yenileri yazılır), partial update yok.

- `ingredients` opsiyonel array. Sadece düzeltilmesi gereken tariflerde
  yaz, diğerlerinde JSON'a koyma (ingredient dokunulmaz).
- Her item: `{ sortOrder, name, amount, unit? }`.
  - `sortOrder` ardışık 1, 2, 3, ...
  - `name` ingredient adı (ör. "Un", "Enginar kalbi", "Domates").
  - `amount` miktar string (ör. "2", "0.5", "1/2").
  - `unit` ölçü (ör. "su bardağı", "yemek kaşığı", "adet"). Olmayabilir
    (ör. "Tuz: tadına göre" → name="Tuz", amount="tadına göre", unit yok).

**Ne zaman ingredient'i revize et:**
- ✅ Pide tarifinde "Enginar" listede yok ama isim "enginarli pide" → ekle
- ✅ Kek tarifinde "yumurta 1 adet" yazıyor ama bilinen tarif 3 adet → düzelt
- ✅ Bir malzeme kullanılmıyor steps'te (gereksiz) → kaldır
- ❌ Sadece "daha lezzetli olur" diye yeni baharat ekleme → araştırmadan
  ekleme yapma
- ❌ Brand isim ekleme ("Cif krem" gibi) → marka kullanma yasağı

**Zorunlu yedek koşul:**
Ingredient revize ettiysen mutlaka steps de o ingredient'i kullansın
(eksik kalmasın). Pide ornegi: enginar listede + steps'te de açıkça
"enginar kalplerini limonlu suya bırakın".

### 14.4 Kalite kriterleri (mutlaka uy)

**🌐 ZORUNLU: HER TARIF ICIN INTERNETTEN ARASTIRMA YAP**

Ezbere yazma. Bilinen kurala dayanma. Her tarif icin web search ile o
spesifik yemegin **gercek sicakligi + suresi + yontemi** dogrula.

**Arastirma adimlari (Codex):**

1. **Google search** ile tarif adini ara: `"<tarif_adi>" tarifi firin
   sicakligi dakika` veya `"<tarif_adi>" recipe oven temperature time`
2. **En az 2 farkli guvenilir kaynak** dogrulasin (tek kaynak yetersiz):
   - **TR oncelik:** yemek.com, refikalimutfagi.com, sofra.com.tr,
     mutfaksirlari.com, hurriyet.com.tr/lezizz, oktay-usta-tarifleri,
     nefis yemek tarifleri (nefisyemektarifleri.com), yemekmasasi.com
   - **Uluslararasi (EN):** seriouseats.com, nytcooking, bbc.co.uk/food,
     foodnetwork.com, bonappetit.com, allrecipes.com, kingarthurbaking.com,
     epicurious.com
   - **Tarif tipine ozel:** kingarthurbaking (firin/hamur), seriouseats
     (et/teknik), bbc food (Britanya/orta klasik), nytcooking (genel)
3. **2 kaynagin sicaklik+sure ortalamasi** veya kesismesi → emin standart
   (Katman 1 yaz)
4. **2 kaynak farkli/celiskili** → tahmini aralik + gorsel sinyal
   (Katman 2 yaz)
5. **2 guvenilir kaynak bulunmazsa** (sadece 1 kaynak, veya hicbiri, veya
   tarif cok niche) → SAYI YAZMA, sadece gorsel sinyal (Katman 3). "1
   kaynak + tahmin" Katman 2 degil Katman 3'tur, tek kaynak yetersizdir.

**Kaynak gizliligi:**
JSON'a kaynak bilgisi YAZMA (cikti sadece slug + steps). Arastirmanin
kendisi senin self-disciplinen, kullaniciya gorunmez. Ama kaynak
dogrulamasi yapmadigin step icin kesin sayi yazma.

**🚨 PARAPHRASE ZORUNLU (copy-paste kesinlikle YASAK)**

Kaynak sitelerden cumleyi birebir kopyalama. Teknik sayilar (sicaklik,
sure, miktar) ayni kalabilir, ama **cumle yapisi + kelime secimi + sira
kendi yazdığın olsun**. Kaynak sadece **bilgi** kaynagi, metin kaynagi
degil.

**Neden:**
- Telif hakki: yemek.com, seriouseats, nytcooking metni kopyalamak
  yasal risk.
- Google duplicate content penalty: ayni cümle → arama siralamasi düşer.
- Kullanici guveni: "AI/robot yazdi" hissi yaratmaz, dogal Turkce okunur.
- Ozgunluk: Tarifle kendi sesi ile yazar, iki kaynagi harmanlar.

**Yanlis vs dogru ornek:**

Kaynak (yemek.com): *"Hamuru 220 dereceye onceden isitilmis firinda 18
dakika, ustu altin sari olana kadar pisirin."*

- ❌ YANLIS (kopyalama): "Hamuru 220 dereceye onceden isitilmis firinda
  18 dakika, ustu altin sari olana kadar pisirin."
- ✅ DOGRU (paraphrase): "Onceden 220°C isitilmis firinda, kenarlar
  altin renk alana kadar 17-19 dakika pisirin."

Sayilar ayni (220°C, ~18 dk), ama cumle yapisi farkli, kelime secimi
kendi yazmana ait. 2. kaynaktan (nefisyemektarifleri) "kenarlar" detayi
eklenmis → harmanlanmis yaklasim.

**Kural ozet:**
- Sayilari araştır, dogrula, kopyala (teknik deger degismesin)
- Cumleyi sifirdan yaz (kendi secimin)
- 2 kaynagin bilgisini harmanla (kimsenin cumlesi olmasin)
- Kisa, somut, Tarifle sesi (tek cumle, aksiyon odakli)

**❌ Guvenilmez kaynaklar (kullanma):**
- Pinterest random pin (cogu zaman uydurulmus)
- Instagram tarif paylasimlari (kalite degisken)
- Forum/blog yorumlari (tek kullanici denedi)
- AI-generated tarif siteleri (sayilar uydurulmus)
- Wikipedia genel tarif aciklamasi (spesifik degil)

**✅ Ek pragmatik:**
- Klasik Turk yemegi → `yemek.com` veya `nefisyemektarifleri.com` ara
- Hamur isi/firin → `kingarthurbaking.com` (en titiz teknik)
- Et/teknik → `seriouseats.com` (J. Kenji López-Alt sistematik)
- Modern yemek → `nytcooking.com` (test mutfagi denenmis)

**Her step somut + bilgi yoğun olmalı:**
- ✅ "Önceden 220°C ısıtılmış fırında 17-19 dakika kenarlar altın olana kadar pişirin."
- ❌ "Pideyi 18 dakika pişirin." (sıcaklık eksik)
- ❌ "Sebzeleri ince yerleştirin." (hangi sebze, ne sırada, ne kadar)
- ❌ "Hamuru açın." (kalınlık? şekil?)
- ❌ "Iyice yoğurun." (ne kadar süre?)

**Mutlaka olması gerekenler step'te:**
- **Pişirme/fırın step'i:** sıcaklık + zaman ("220°C 17-19 dakika")
- **Dinlendirme:** süre ("30 dakika dinlendirin" veya "25-35 dakika")
- **Hazırlık:** yöntem + form ("ince dilimleyin", "küp doğrayın",
  "limonlu suya bırakın")
- **Birleştirme:** sıra + bağlam ("önce A, sonra B üzerine")

**🚨 DOĞRULUK MUTLAK ÖNCELIK (KRITIK GUVENLIK KURALI)**

Yanlış sıcaklık/süre yemeğin **yanmasına veya çiğ kalmasına** sebep
olur. Kullanıcı için en kötü deneyim: tarifi takip ediyor, yemek
ziyan oluyor. Bu durumu kesinlikle yaratma.

**Üç katmanlı yaklaşım (sırayla dene):**

**1. EMIN OLDUGUN STANDART DEGER → kesin sayi/aralik kullan**

Klasik tariflerin **bilinen standart** değerleri vardır, bunları doğru
ver:
- ✅ Türk pide: 240-260°C 8-10 dakika (taş fırın yüksek)
- ✅ Lahmacun: 250-280°C 5-7 dakika
- ✅ Börek: 180-200°C 35-40 dakika
- ✅ Kek: 170-180°C 30-35 dakika (orta raf)
- ✅ Kurabiye: 160-170°C 12-15 dakika
- ✅ Tavuk göğsü tava: orta-yüksek ateş 6-7 dk + 6-7 dk
- ✅ Mercimek çorbası: 25-30 dakika kısık ateşte

Bu standart bilgi ise **kesin yaz** (sıcaklık aralığı + dakika aralığı OK).

**2. STANDART DEGIL AMA KIYAS YAPABILIRSEN → benzer tariflerden tahmin yap**

Tarif standart değil ama benzer kategorideki standart değerleri biliyorsan
(fırın yemeği genelde 180-200°C, et güveç 150-160°C uzun), o aralığı
kullan. Ama **TAHMINI** olduğunu görsel sinyal ile destekle.

- ✅ "180°C fırında 30-35 dakika, **üzeri altın renk olana kadar** pişirin."
- ✅ "Kısık ateşte 25-30 dakika, **mercimekler dağılana kadar** kaynatın."

**3. EMIN DEGILSEN → SAYI YAZMA, GÖRSEL/DOKU SINYALI VER**

Hiç bilmediğin/emin olmadığın bir tarif ise **uydurma sayı koyma**.
Yerine kullanıcıya görsel ipucu ver:

- ✅ "Üzeri altın renk olana kadar pişirin."
- ✅ "Kenarları kabarıp ortası katılaşana kadar fırınlayın."
- ✅ "Soğanlar şeffaflaşana kadar kavurun."
- ✅ "Çatal batırıldığında temiz çıkana kadar pişirin."
- ✅ "Hamur iki katına çıkana kadar mayalandırın."
- ✅ "Sebzeler yumuşayana kadar."
- ❌ "180°C'de 27 dakika pişirin." (uydurma kesin)
- ❌ "200°C'de 23-26 dakika pişirin." (uydurma aralık, daha kötü çünkü
  güvenilir görünüyor)

**Görsel sinyal kullanımı zayıflık değil GÜÇ.** Profesyonel tarif
kitapları da kullanır ("until golden brown", "until tender"). Süre
tahmin/aralık + görsel sinyal kombinasyonu ideal.

**timerSeconds alanı:**
- Standart süre verdiysen aralığın ORTASI (17-19 dk = 1080 sn)
- Görsel sinyal verdiysen + süre yoksa **timerSeconds boş bırak** (UI
  zamanlayıcı göstermez, kullanıcı görsel takip eder)
- Tahmini süre verdiysen + görsel sinyal varsa orta süreyi yaz

**Ingredient kullanımı:**
- CSV'deki `ingredients_tr` listesindeki **TÜM malzemeleri** step'lerde
  kullan. Eksik bırakma (Pide ornegi: enginar listede ama step'te yok
  → kullanıcı "enginar nerede" der).
- Ingredient adlarını step'te aynen kullan ("enginar kalpleri", "domates"
  vs).

**🚫 "malzemesini" sözcüğü YASAK (v3 rework dersi):**

Codex B5 v3'te şu pattern'i kullandı:
- ❌ "Kuşbaşı dana eti **malzemesini** tavada kavurun."
- ❌ "Pilavlık bulgur **malzemesini** yıkayıp tencereye ekleyin."

Doğal Türkçe "malzemesini" kelimesini kullanmaz, direkt ismi çeker:
- ✅ "Kuşbaşı dana etini tavada 5-6 dakika kavurun."
- ✅ "Pilavlık bulguru yıkayıp tencereye ekleyin."

Ingredient adı step'te kendi adıyla geçer, "malzemesini" ekleme.

**🚫 Template pattern tekrarı YASAK:**

Farklı tariflere **aynı 5-adım iskeletini** kopyalama, sadece malzeme
değiştirerek çoğaltma. Her tarifin kendi pişirme mantığı var.

Örnek template-yanlış (v3'te yapılan):
```
1. X tavada 5-6 dakika kavurun
2. Y yıkayıp tencereye ekleyin
3. X üzerine su ilave edip karışımı bir kez çevirin
4. Y yumuşayıp suyunu çekene kadar 14-18 dakika pişirin
5. X pişer pişmez sıcak servis edin
```
Bu yapıyı 3 farklı tarife (etli-erikli-bulgur, firikli-mercimek-kuzu,
isotlu-tava-eriste) kopyaladı → hepsi robotik ve aynı hissediyor.

Doğrusu: her tarif için adımlar **yemek mantığına özgü** olmalı.
- Pilav: pirinç yıkama + tereyağı kavurma + su oranı + dinlendirme
- Çorba: sote + sıvı + pişirme + kıvam + servis
- Köfte: yoğurma + dinlendirme + şekil + pişirme
- Börek: hamur + iç + katlama + pişirme

**🚫 Teknik hatalar (doğruluk kontrolü):**

Bazı malzemeler/yöntemler yanlış uygulanıyor, dikkat:
- **Erişte yıkanmaz** (kuru, hazır). Sadece bulgur ve pirinç yıkanır.
- **Tereyağı kavurma max 3 dakika** (150°C duman noktası), daha uzunsa
  yanar. "Tereyağı + sıvıyağ karışımı" alternatif.
- **İki kez pişirme gereksiz**: "önce haşla sonra tencereye al sonra
  kaynat" yerine tek adım "tencerede yumuşayana kadar kaynat".

**🚫 Jenerik kapanış kalıbı çeşitlendir:**

"X pişer pişmez sıcak servis edin" 5+ tarife aynen kopyalama.
Alternatifler:
- "Sıcak veya ılık servis edin"
- "Dinlendirip ayran eşliğinde servis edin"
- "Maydanoz serpip servis edin"
- "Yanında cacık ile ikram edin"

Servis adımı tarifin kültürüne göre özgünleşmeli.

### 14.5 Yazım kuralları (Mod A/B/C/D ortak)

- **Em-dash (— U+2014) YASAK**. Yerine virgül, nokta, parantez, iki nokta.
  En-dash (–, U+2013) de yasak.
- **Hyphen (-, U+002D) serbest**: sicaklik/sure araliginda kullan
  (`180-200°C`, `17-19 dakika`, `3-4 kaşığı`). Yasak olan sadece em-dash
  ve en-dash; ASCII hyphen gunluk kullanima dahildir.
- **Muglak ifade yasak**: "iyice", "bolca", "biraz" → ölçü + zaman ver.
- **Marka ismi geçmez** (Tarifle dahil).
- **Zaman işareti yok** (evergreen).
- **TR collation**: ç, ğ, ı, İ, ö, ş, ü doğru. ASCII düşmesin.
- **Step başı büyük harf, sonu nokta.**
- **UTF-8 no-BOM** (B16 dersi): dosyanın ilk bayt'ı `[` (veya boşluk)
  olmalı. PowerShell/Notepad bazen U+FEFF BOM ekler, Node.js
  `JSON.parse` blocker olur, apply öncesi elle temizlik gerektirir.
  Dosyayı UTF-8 (BOM'suz) yaz; VS Code'da status bar "UTF-8 with BOM"
  gösteriyorsa "UTF-8" a çevir.
- **Cümle tekrar yasağı** (B15 v2 + B16 dersi): hiçbir `instruction`
  cümlesi **2 farklı tarifte bile** birebir geçmesin. Benzer tarif
  grupları (2 salata, 2 irmik helvası, 4 sos) dahil her adım
  tarif-spesifik paraphrase ile yazılsın; servis/sos ayar/topak açma
  gibi "jenerik" sahnelerde de malzeme karakterine göre varyasyon
  üret.

### 14.6 Adım sayısı kararı (Kerem direktifi, type bazli kademeli)

**Tarif type'ına göre minimum step sayısı:**

| Type | Minimum | İdeal | Mantık |
|---|---|---|---|
| **ICECEK** (cin tonik, smoothie, ferahlatıcı) | **3** | 3-4 | Çok basit, hazırlık + birleştirme + servis yeter |
| **KOKTEYL** (whiskey sour, margarita) | **4** | 4-5 | Ölçü + buz + shake + süsleme + servis ayrı adımlar |
| **APERATIF** (humus, dolmalık) | **4** | 4-6 | Hazırlık + ana iş + son dokunuş + servis |
| **YEMEK / CORBA / SALATA / TATLI / KAHVALTI** | **5** | 5-7 | Asıl tarif, detaylı |

Genel rehber (minimum eşiklerin üstü):
- **İçecek (basit):** 3-4 step
- **Kokteyl/Sos:** 4-5 step
- **Aperatif/Meze:** 4-6 step
- **Salata:** 5-6 step (yıka/doğra + sos hazırla + karıştır + dinlendir + servis)
- **Çorba/Tek-tencere:** 5-7 step (sote + ana pişirme + ayar + son ekleme + servis)
- **Hamur işi/Börek/Pide:** 6-9 step (hamur + dinlendirme + iç hazırla + şekil + pişirme + son)
- **Fırın yemeği:** 6-8 step
- **Et yemeği (kebap/güveç):** 5-8 step

**Type ne ise CSV'deki `type` kolonundan oku, eşiğe göre karar ver.**
3-step bir cin tonik (ICECEK) flag DEĞİL, ama 3-step bir köfte (YEMEK)
mutlaka 5+'a genişletilmeli.

**Eski step sayısı eşiğin altında ise genişlet:**
- Tek "Sebzeleri kavurun" step'ini 2'ye böl: "Soğanı doğrayın" + "Soğan + biber + domatesi 8 dakika kavurun"
- "Pişirin" step'ini 2'ye böl: "Önceden 200°C ısıtın" + "20 dakika pişirin, üstü kızarana kadar"
- Kapanış step'i ekle: "5 dakika dinlendirip servis edin"

**Kalite > brevity.** Açıklama detaylı + somut olmalı:
- ✅ "Önceden 220°C ısıtılmış fırında 18 dakika kenarlar altın olana kadar pişirin."
- ❌ "Pideyi 18 dakika pişirin." (sıcaklık eksik)
- ✅ "Enginar kalplerini ince dilimleyip limonlu suya bırakın, 5 dakika beklesin."
- ❌ "Sebzeleri ince yerleştirin." (hangi sebze, ne sırada belirsiz)

Type ne olursa olsun, **her adım somut + bilgi yoğun + ölçü + zaman + yöntem**.

### 14.7 Self-review (teslim öncesi)

- [ ] JSON valid (`jq . docs/step-revisions-batch-N.json`).
- [ ] Her item'da `slug` var + CSV'deki bir slug'a eşleşiyor.
- [ ] Her item'da `steps` array, **type bazli min**: ICECEK 3+, KOKTEYL/APERATIF 4+, diger 5+ (Kerem direktifi).
- [ ] **Internet arastirmasi yapildi** her tarif icin (en az 2 guvenilir
      kaynak: yemek.com / nefisyemektarifleri / seriouseats / nytcooking /
      bbc food / kingarthurbaking). Ezbere yazma.
- [ ] **Paraphrase kontrolu**: Her step kendi cumlelerinle yazildi,
      kaynak sitelerden birebir kopyalama yok. Sayilar kaynak, cumle
      Tarifle sesi. (Copy-paste hem telif hem duplicate content riski.)
- [ ] Hassas degerler (firin sicaklik/pisirme dakika/dinlendirme):
      **uc katmanli yaklasim** (§14.4):
      1. Emin standart deger (2+ kaynak dogruladi) → kesin sayi/aralik OK
      2. Kaynaklar farkli/celiskili → tahmini aralik + gorsel sinyal
      3. Kaynak yok/niche → SAYI YAZMA, sadece gorsel sinyal
      Uydurma sayi yemegi yakar/cig birakir. Gorsel sinyal zayiflik degil GUC.
- [ ] stepNumber ardışık 1..N (eksik veya tekrar yok).
- [ ] Em-dash grep: 0 eşleşme.
- [ ] Her step 5-25 kelime arası.
- [ ] Pişirme step'inde sıcaklık + zaman var.
- [ ] CSV'deki ingredient'ların TÜMÜ step'lerde geçiyor.
- [ ] **BOM kontrolü** (B16 dersi):
      ```bash
      node -e "const r=require('fs').readFileSync('docs/step-revisions-batch-N.json','utf8');console.log(r.charCodeAt(0)===0xFEFF?'BOM VAR':'BOM YOK');"
      ```
      Çıktı `BOM YOK` olmalı. `BOM VAR` ise dosyayı UTF-8 (BOM'suz)
      yeniden yaz.
- [ ] **Cümle tekrar kontrolü** (B15 v2 standardı):
      ```bash
      node -e "const j=JSON.parse(require('fs').readFileSync('docs/step-revisions-batch-N.json','utf8'));const m={};j.flatMap(r=>r.steps.map(s=>[r.slug,s.instruction])).forEach(([sl,t])=>(m[t]=m[t]||new Set()).add(sl));const d=Object.entries(m).filter(([,s])=>s.size>1);console.log('Tekrar:',d.length);d.slice(0,5).forEach(([t,s])=>console.log(s.size+'x: '+t.slice(0,70)));"
      ```
      Çıktı `Tekrar: 0` olmalı. 2+ tarife yayılan cümle varsa o
      cümleleri tarif-spesifik paraphrase et.

### 14.8 Dosya adlandırma + versiyonlama

- İlk batch: `docs/step-revisions-batch-1.json`
- İkinci batch: `docs/step-revisions-batch-2.json`
- ...
- Kerem "Mod E. Batch 3" derse batch 3 dosyası.

Apply sonrası Claude `scripts/apply-step-revisions.ts` ile DB'ye atomic
transaction yazar (eski steps delete + yenileri create), dosya tracking'de
kalır.

