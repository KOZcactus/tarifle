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
| **"Mod F"**, "Retrofit-N", "step count retrofit" | **MOD F**, mevcut tariflerin step sayısını min/max kuralına çekmek + kalite gate (varyasyon, notes, timer, muğlak yasak, kritik nokta) | §15 | `docs/retrofit-step-count-N.json` (slug + newSteps + notes) |
| **"Mod FA"**, "Retrofit-N revize", "FA Batch N", "Retrofit revize-N" | **MOD FA**, daha önce Mod F ile teslim edilmiş bir batch'i SCAFFOLD'dan arındırarak DOĞRULUK önceliğiyle yeniden teslim et (suffix smuggling temizlik + tarif-spesifik step + web kaynak doğrulama zorunlu) | §16 | `docs/retrofit-step-count-N-revize.json` (aynı slug listesi, temiz newSteps) |

**Default'lar (soru sorma, direkt başla):**

### Mod A default (Kerem "Mod A. Batch Na" / "Mod A. Batch Nb" derse):
- **50 tarif** yaz (B30 Windows komut uzunluğu sınırı dersinden sonra
  100→50 ikiye bölündü; tek teslim daha kontrollü, recurring block
  riski azaldı)
- Batch adı: **{N}a** ilk 50, **{N}b** sonraki 50 (örn. Batch 30a,
  30b; 31a, 31b). Kerem her yarıyı ayrı tetikler.
- Dağılım: **~25 TR + ~25 uluslararası**. Sayı yaklaşık (23-27 TR kabul), tam matematiksel denge aranmaz.
- **TR bölge dengesi KALDIRILDI (oturum 17 dersi, 33b+):** 7 bölgeden eşit
  paylaşım zorunluluğu yok. Çoğu bölge catalog'da dolu. Özgün TR tarif
  üretirken bölge karıştır ama "her bölgeden 3-4 tarif" matematik
  dengesiyle uğraşma, iş yavaşlatıyor.
- **Uluslararası ülkelerde bilinen/popüler öncelikli:** Endonezya nasi goreng,
  Almanya bratwurst, Fransa ratatouille, Japonya katsu, Hindistan butter
  chicken gibi arama yapınca kolay tanınan tarifler. Her ülkenin taşra mutfağı
  keşfi değil, mainstream menü.
- **⚠️ Tarif doğruluğu için web kaynak kontrolü ZORUNLU:** Özellikle
  uluslararası tarifler + az bilinen TR yöresel tarifler için **yazmadan önce**
  güvenilir kaynaktan (BBC Food, Serious Eats, Bon Appétit, yemek.com,
  nefisyemektarifleri, resmi turizm/kültür siteleri) temel reçeteyi doğrula.
  "Hayal edilen ingredient listesi" yasak, gerçek tarifle tutarlı olsun.
  Malzeme oranları, pişirme sıcaklıkları, süreler gerçek referans ile
  uyumlu. Yoksa yanlış bilgi + SEO zararı + kullanıcı güveni kaybı.
- **⚠️ Step count kuralı (§14.6 + §5.0 A+ kuralları):**

  | Type | Min | Max | İdeal |
  |---|---|---|---|
  | ICECEK / SOS | 3 | 6 | 3-5 |
  | KOKTEYL | 4 | 6 | 4-5 |
  | APERATIF / ATISTIRMALIK | 4 | 8 | 4-6 |
  | SALATA / KAHVALTI | 5 | 8 | 5-7 |
  | **YEMEK / CORBA / TATLI** | **5** | **12** | 5-8 |

  3-step bir YEMEK/TATLI/KAHVALTI tarifi REJECT. Composite step'i böl:
  "Sebzeleri doğra ve kavur" → 2 adım ("Soğanı doğra" + "Soğan+biber+
  domatesi 8 dk kavur"). Hamur işi 6-9, fırın yemeği 6-8, kebap/
  güveç 5-8 ideal.

- **⭐ A+ KURALLARI (§5.0 tam detay, oturum 18 Batch 36b + Retrofit-01 dersi):**
  1. **Step sayısı çeşitlilik:** Batch içinde tek değerde kilitlenme, min 3 farklı
     değer kullan. Batch 36b'de 50/50 hepsi 6-step = FAIL — tekrar etme. YEMEK için
     önerilen dağılım: %15-5 / %40-6 / %25-7 / %15-8+.
  2. **Pişirme step'inde `timerSeconds` zorunlu:** Fırın/ocak/tava/mühürleme/
     haşlama/dinlendirme/ıslatma verbi → timerSeconds DOLU. 36b'de 13 step eksikti.
  3. **Muğlak ifade yasak (somut ölçü yoksa):** "kısa süre, biraz bekle, uygun kıvam,
     dilediğin kadar, yeterince, iyice" tek başına = FAIL. Yerine ölçü + zaman
     + görsel.
  4. **Kritik nokta / neden-sonuç:** Her tarifte ≥1 step'te neden açıklaması
     ("yoğurt kesilmesin", "gluten gevşesin"). %60+ tarif kapsamalı.
  5. **Template dup yasak:** Aynı cümle 2+ tarifte geçmesin (batch içi). 36b'de
     2 dup vardı — tekrar etme.

- **isFeatured: her yarıda 3-5 tarif** (toplam batch için 5-10)
- Eksik kategoriler için Kerem'e öncelik sor (kahvaltı/çorba/tatlı dengelensin)
- Marker: `// ── BATCH 30a ──` (küçük `a`/`b` harf)

**⚠️ Helper parametre tipleri ZORUNLU (oturum 17 / 32b+33a v2 dersi, TEKRARLAMA):**

Append ettiğin IIFE içinde 4 helper (t, ing, st, r) tanımlarsan
**parametrelere TypeScript tipi yazmak zorundasın**. 32b ve 33a v2
retrofit'lerinde Codex helper'ları implicit-any bıraktı, local
tsc filter nedeniyle gözden kaçtı, Vercel prod build 3 kez fail
etti (commit 9f2d307 33a bloğu silinmek zorunda kaldı).

Zorunlu signature (aynen kopyala):
```ts
const t = (enTitle: string, enDescription: string, deTitle: string, deDescription: string) => ({
  en: { title: enTitle, description: enDescription },
  de: { title: deTitle, description: deDescription },
});
const ing = (specs: string[]) => specs.map((s, i) => {
  const [name, amount, unit] = s.split("|");
  return { name, amount, unit, sortOrder: i + 1 };
});
const st = (specs: string[]) => specs.map((s, i) => {
  const [instruction, timer] = s.split("||");
  return timer
    ? { stepNumber: i + 1, instruction, timerSeconds: Number(timer) }
    : { stepNumber: i + 1, instruction };
});
const r = (o: Omit<SeedRecipe, "ingredients" | "steps"> & { ingredients: string[]; steps: string[] }) => ({
  ...o,
  ingredients: ing(o.ingredients),
  steps: st(o.steps),
});
```

**⚠️ Allergen self-check ZORUNLU (oturum 17 / 32b+33a v2 dersi):**

Self-check raporuna mutlaka ekle, teslim öncesi PASS olmalı:
```bash
npx tsx scripts/check-allergen-source.ts
# Sonuç: ✅ TEMIZ, 0 over-tag, 0 missing
```

Sık yakalanan Codex hataları (32b+33a v2'de 9 bulgu):
- Tereyağı ingredient = SUT allergen eksik
- Kestane, ceviz, fındık = KUSUYEMIS eksik
- Bulgur, un, yufka, pierogi = GLUTEN eksik
- Tahin = SUSAM eksik
- Kabak çekirdeği KUSUYEMIS DEĞİL (ayrı allergen kategorisi)
- Mısır unu + mısır ekmeği gluten-FREE (GLUTEN over-tag yapma)

Hem over-tag hem missing aynı anda kontrol et.

**⚠️ İki session koordinasyonu (oturum 17 dersi):**

Kerem bazen iki Codex session'ını aynı anda tetikler (farklı batch
numaralarıyla). Aynı dosyada (seed-recipes.ts) paralel çalışırsanız
konflikt olur. Kural:
- Her session'a **sadece kendi batch ID'si** verilir (32b / 33a / 33b)
- Append noktası her session için farklı (önce A bitirir, sonra B
  onun üstüne append)
- Self-check RAPORU TESLİMİN PARÇASI, sen kendi batch ID'ni verify
  et, diğer session'ın eklediği batch'lere dokunma

### Mod B default (Kerem sadece "Mod B" veya "batch N çevirisi" derse):
- Kerem CSV dosya yolu verir: `docs/translations-batch-N.csv`
- Sen aynı isimli **JSON** üretirsin: `docs/translations-batch-N.json`
- Her tarif için **EN + DE ingredients + steps + tipNote + servingSuggestion** doldur (CSV'de hangisi eksikse)
- `title + description` JSON'a YAZMA, CSV'deki `en_title_current` sütunundan görürsün zaten dolu (Mod A'dan)
- Array uzunlukları TR'yle birebir eşleşmeli

### Mod B Backfill default (Kerem "Mod B. Backfill-NN" derse):

**Scope ve mahiyet netleştirme (oturum 16 dersi, TEKRARLAMA):**

Backfill işi **mevcut eksik EN+DE çevirilerini sıfırdan doldurma** işi.
Her CSV satırı için TR source CSV'nin kendisinde TAM var. Senin işin
sadece çeviri, bilgi arama değil, eski JSON'dan kurtarma değil, "güvenilir
kaynak" sorgulaması değil.

- Kerem CSV yolu verir: `docs/translations-backfill-NN.csv` (NN zero-padded)
- Sen aynı isimli **JSON** üretirsin: `docs/translations-backfill-NN.json`
- Mod B ile aynı kurallar geçerli (§6), format aynı (§6.3).

**CSV tek kaynak, başka bir yere bakma:**

CSV'deki her satır eksiksiz TR source taşır:
- `title_tr`, `description_tr`, `tipNote_tr`, `servingSuggestion_tr`
- `ingredients_tr` (pipe-ayrık), `steps_tr` (step_count ile)
- `ingredient_count`, `step_count` (array length doğrulaması zorunlu)
- `allergens`, `tags`, `type`, `cuisine` (çeviri bağlamı için)
- `en_*_current` ve `de_*_current` kolonları mevcut çevirinin var/yok
  flag'i. Çoğu `"no"` veya boş, çünkü zaten eksik olduğu için backfill
  gerekti. Bu kolonlar **bilgi amaçlı**, sen ignore edebilirsin. Tüm
  EN + DE'yi sıfırdan üretiyorsun.

Batch 0-11 döneminden gelen eski tarifler, EN/DE çevirisi hiç yok;
"alan boş = sahte çevirmem gerekmez" refleksi YANLIŞ. Backfill'in işi
tam bu eksikleri kapatmak.

**⚠️ Renumber uyarısı (oturum 16, 23 Nisan 2026 dersi, TEKRARLAMA):**

Backfill CSV dosya adları **sabit değil, gap'ler yeniden numaralanabilir**.
Aynı dosya adı (örn. `backfill-03.csv`) farklı oturumda farklı slug
setine ait olabilir:

- 20 Nis 2026'da `backfill-03.csv` bir slug seti içindi (osso-buco vb.),
  Codex JSON teslim etmişti (commit `ec8a40e`).
- 23 Nis 2026'da `gen-modb-backfill-csv.ts --start N` offset flag eklendi
  (commit `55bd437`), aynı isimle **yeni gap** için CSV üretildi. Eski
  JSON artık alakasız.

Sana düşen davranış:
- **Güncel CSV'yi oku**, eski aynı isimli JSON'u hiç açma.
- Aynı isimli JSON diskte duruyorsa **overwrite et**, eski içerik bağlamsız.
- "Farklı slug seti için JSON yaz, ne yapayım eskisini?" diye sorma;
  eski içerik silinip yeniden yazılıyor, bu tasarım.

**⚠️ "Güvenilir kaynak yok" itirazı GEÇERSİZ (oturum 16 Backfill-03
v1 vakası, TEKRARLAMA):**

Backfill işinde "güvenilir kaynak" = **CSV'deki TR source**. İşin TR
metinleri native EN + DE'ye çevirmek. "Bu slug için EN+DE tam çeviri
garantisi veremem" tipi itiraz geçersiz, çünkü:

1. Girdi bilgi zaten CSV'de tam var (title_tr, description_tr,
   ingredients_tr, steps_tr, tipNote_tr, servingSuggestion_tr).
2. Görevin **çeviri**, araştırma değil.
3. Backfill-01 ve 02'de 100'er tarif aynı akışla native kaliteyle
   ürettin; sistem değişmedi, sadece slug seti farklı.
4. §97 "DOĞRULUK > HIZ > KAPSAM" prensibi **içerik doğruluğu** içindir
   (örn. tavuk pişirme sıcaklığı uydurma), **çeviri işini boykot etmek**
   için değil. Çevirirken doğruluğa özen göster, ama işi yapmayı
   reddetme.

İşi durdurmak **ancak** şu üç durumda meşru:
- CSV dosyası fiziksel olarak okunmuyor (encoding bozuk, path yanlış),
- TR source kendi içinde çelişkili (örn. ingredient listesi 5 öğe ama
  `ingredient_count: 7`),
- Bir slug için `title_tr` veya `steps_tr` CSV'de **gerçekten boş**
  (pratikte hiç olmadı, `gen-modb-backfill-csv` zaten boş source
  üretmez).

Yukarıdaki üç durumun hiçbiri yoksa **çeviriyi üret**, issues alanına
flag'lemeye gerek yok, "acaba" diye durma.

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
  - **steps:** ardışık 1..N stepNumber, **type bazli min/max** (Kerem oturum 18-19 direktifi): **YEMEK/CORBA/TATLI min 5 max 12** (ideal 5-8, kompleks tariflerde 12'ye kadar genişler), **SALATA/KAHVALTI min 5 max 8**, **APERATIF/ATISTIRMALIK min 4 max 8**, **KOKTEYL min 4 max 6**, **ICECEK/SOS min 3 max 6**. Detay §14.6 + §15.5. **OVER = şişirme yasak**, ideal aralıkta tut.
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

### ⛔ Translation script / otomasyon yasağı (oturum 16 Backfill-03 v2 dersi, TEKRARLAMA)

**Görevini SEN yaparsın, bir script'e delege etmezsin.** Codex ChatGPT
Max tabanlı, çeviri işinin kendisi doğrudan senin üzerinde. "Bir kerelik
translation script çalıştırayım, CSV'den okusun JSON'a yazsın" önerisi
**reddedilir**, aşağıdaki sebeplerle:

1. Google Translate / DeepL yasağının ruhuna aykırı (sadece farklı isim
   altında aynı şey). Hangi model, hangi prompt, hangi kalite kontrolü
   belirsiz; çıktı native kaliteye inmez.
2. Brief'in kalite çıtası (özne+fiil tam cümle, pidgin yok, TR leak 0,
   kültürel bağlam, §658 Batch 21 dersleri) bir script'in
   yakalayamayacağı detaylarla dolu.
3. `scripts/` dizinine dosya ekleme yetkin yok (§144-149, dosya çakışma
   kuralı). Tek seferlik "model destekli" script de aynı kuralın altında.
4. Backfill-01 ve Backfill-02'de **100'er tarifi manuel** teslim ettin.
   Sistem değişmedi, hacim aynı. "Bu sefer yapamam" gerekçesi geçersiz.

**"Hacim fazla" itirazına çözüm:**

Context window gerçekten sıkışıyorsa:
- §88-93 kademeli izin: "context doldu, kaldığım slug şu" bilgisi bırak,
  yeni mesajda devam et.
- Veya Mod A yarı batch pattern'i gibi 50'şerlik iki mesajda teslim
  (§5); her yarı kendi self-check'i ile tam.
- Ama **asla script/API/otomasyon yazma**. Çeviri işi senin.

Bu yasak Mod A (yeni tarif yazma), Mod B (çeviri), Mod C (SEO copy),
Mod D (editoryal revize), Mod E (step revize), **hepsi için geçerli**.
Her Mod'un çıktısı senin yazdığın native içerik olmak zorunda.

### ⛔ Mod A `d`/default-helper yasağı (oturum 17 Batch 32b+33a dersi, ZORUNLU)

**`d` veya başka bir "default helper" fonksiyonuyla tarif tanımlamak
yasaktır.** 32b ve 33a iki kere üst üste şu pattern'le geldi:

```ts
const d = (title, slug, cuisine, ..., ingredients, steps, tipNote, servingSuggestion) =>
  r({ title, slug, emoji: "🍽️", prepMinutes: 16, cookMinutes: 24,
      totalMinutes: 40, servingCount: 4, averageCalories: 310,
      protein: 13, carbs: 34, fat: 13, tags: ["pratik"],
      translations: t(enTitle, `${enTitle} uses specific ingredients...`,
                      deTitle, `${deTitle} nutzt konkrete Zutaten...`),
      ingredients, steps });
```

**Sorun**: 50 tarif aynı emoji, aynı süre, aynı kalori, aynı makro,
aynı tek tag, template EN+DE description. Production'a gidince:
- "30 dakika altı" filter Hard dolma + Easy smoothie'yi birlikte gösterir
- AI menü planlayıcı macro target (high-protein/low-cal) yanıltıcı sonuç verir
- Person count scaling servingCount=4 sabit olduğundan yanlış
- Arama + SEO 50 tarifi aynı EN cümleyle gösterir
- Kategori/tag filter "pratik" tek tag yüzünden zayıflar

**Zorunlu pattern** (32a örneği seed-recipes.ts satır ~13880-13934):

```ts
r({ title: "Otlu Pirinç Frittata",
    slug: "otlu-pirinc-frittata-yunan-usulu",
    emoji: "🍳",               // 🥘 dolma, 🍲 çorba, 🥗 salata,
                                // 🍮 tatlı, 🫓 hamur, 🍷 içecek
    cuisine: "gr",
    description: "...",
    categorySlug: "kahvaltiliklar",
    type: "KAHVALTI" as const,
    difficulty: "EASY" as const,
    prepMinutes: 12,            // TARİFE ÖZEL
    cookMinutes: 14,            // TARİFE ÖZEL
    totalMinutes: 26,           // Hard ≥60, Easy ≤30 TUTARLI
    servingCount: 4,            // 2-8 aralığı TARİFE ÖZEL
    averageCalories: 226,       // meze ~150, ana 300-500,
    protein: 11,                // tatlı 200-350, salata 120-200,
    carbs: 24,                  // çorba 180-300
    fat: 10,
    isFeatured: false,
    tipNote: "...",
    servingSuggestion: "...",
    tags: ["vejetaryen", "30-dakika-alti"],  // 2-4 tag TARİFE ÖZEL
    allergens: ["YUMURTA", "SUT"] as const,
    translations: t(
      "Herbed Rice Frittata",
      "This Greek-style skillet binds dill, parsley, and cooked rice with eggs into a green breakfast pan.",
      "Kräuter-Reis-Frittata",
      "Diese Pfanne nach griechischer Art bindet Dill, Petersilie und gekochten Reis mit Eiern zu einem grünen Frühstück."
    ),
    ingredients: [...], steps: [...] }),
```

**11 alan PER-RECIPE zorunlu**: emoji, prepMinutes, cookMinutes,
totalMinutes, servingCount, averageCalories, protein, carbs, fat,
tags, EN+DE description.

`t()`, `ing()`, `st()`, `r()` pass-through helper'lar serbest
(title/description/ingredient/step string'ini object'e çeviren saf
utility). `d()` gibi **default değer enjekte eden helper YASAK**.

**Self-check (v2 teslim öncesi zorunlu)**:
```bash
# Aynı EN description 2+ tarif varsa FAIL
grep -oP '"en":\s*\{[^}]*description":\s*"[^"]+"' scripts/seed-recipes.ts | \
  awk -F'description":' '{print $2}' | sort | uniq -c | sort -rn | head -5
# En yüksek count 1 olmalı.

# Emoji dağılımı: en az 8 farklı
grep -oP 'emoji:\s*"\S+"' scripts/seed-recipes.ts | sort -u | wc -l
# ≥8 olmalı batch'te.

# Macro çeşitlilik: averageCalories 200-550 range
grep -oP 'averageCalories:\s*\d+' scripts/seed-recipes.ts | \
  awk -F: '{print $2}' | sort -u | wc -l
# ≥10 farklı değer olmalı 50 tarifte.
```

Apply tarafı bu kontrolü de yapar, helper pattern detect edilirse
batch tümüyle REJECT, stash'e alınır, re-teslim beklenir.

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

### 5.0 A+ kalite standardı (oturum 18 Batch 36b + Retrofit-01 dersleri, ZORUNLU)

Batch 36b ve Retrofit-01 audit'lerinde ortak örüntü: **Codex minimum
kuralı karşılıyor, "ideal" aralığa taşma yok**. Sonuç B+ not. Mod A
batch'leri (37a+) bu 5 A+ kuralını ihlalsiz karşılamalı.

**1. Step sayısı çeşitlilik (§15.5.1 referans)**

Bir batch içinde step sayısı tek değerde kilitlenmez. 50 tarif için
en az **3 farklı step sayısı** kullan. YEMEK/CORBA/TATLI için önerilen
dağılım: %15-5 step / %40-6 / %25-7 / %15-8+. Type bazlı min/max
§14.6'da. **Tek değer dominant (≥%60) = FAIL.**

**2. Pişirme step'inde `timerSeconds` ZORUNLU (§15.7.2 referans)**

Fırın / ocak / tava / ızgara / mühürleme / haşlama / dinlendirme /
mayalanma / ıslatma içeren her step'te `timerSeconds` alanı DOLU
olmalı (null yasak). 36b'de 13 pişirme step'inde timer eksikti —
tekrar etme.

**3. Muğlak ifade genişletilmiş yasak liste (§15.7.3 referans)**

Bu kelimeler somut ölçü yoksa YASAK: "kısa süre", "bir süre", "biraz
bekle", "uygun kıvam", "dilediğin kadar", "yeterince", "uygun ölçüde",
"iyice" (tek başına), "hafif dokulu", "hafifçe" (tek başına).
Her birinin yerine ölçü + zaman + görsel sinyal kombinasyonu.

✅ "8 dakika hafifçe pembeleşene kadar kavur" (hafif + ölçü + görsel)
❌ "hafifçe kavur" (somut değil)

**4. Kritik nokta / neden-sonuç notu (§15.7.4 ZORUNLU, Retrofit-02 dersi)**

**Batch genelinde minimum %60 tarifte** en az 1 step'te neden-sonuç
açıklaması olmalı. Retrofit-02'de bu oran %10'da kaldı, A+'ya
ulaşamadı. Her tarif için 1 kritik nokta hedef.

✅ "Yoğurdu eklemeden önce eti soğutun, **yoğurt kesilmesin**."
✅ "Hamuru 20 dakika dinlendirin, **gluten gevşesin** ve açması kolaylaşsın."
✅ "Tereyağını ocaktan aldıktan sonra ekleyin, **beurre monté kesilmesin**."
✅ "Tavayı önceden kızdırın, sebze **haşlanmasın buğusuz kalsın**."
✅ "Çorbaya limonu ocak kapandıktan sonra sıkın, **aksi halde acılaşır**."

**Tetikleyici pattern'lar (self-check §8 madde 15):**
`yoksa | olmasın | kesilmesin | gelişmesin | gevşesin | çatlamasın |
kaymasın | dağılmasın | yanmasın | sertleşmesin | pişmesin | akmasın |
aksi halde | aksi takdirde | diye | böylece | çünkü`

Basit tariflerde servis notu kabul: "Sıcak servis edin, soğuyunca
doku kayar." Pattern'lardan biri içeriyor olmalı.

**5. Step kalitesi: somut ölçü + zaman + sıcaklık + görsel sinyal
(§15.7 referans)**

Her step'te:
- ✅ **Somut eylem verbi** (doğra, kavur, ezle, mühürle, süz, dinlendir)
- ✅ **Ölçü** gereken yerde yazılı ("2 yemek kaşığı yağ")
- ✅ **Süre** gereken yerde yazılı ("5 dakika", "1 gece 8 saat")
- ✅ **Sıcaklık** gereken yerde yazılı ("180°C", "kısık ateş",
  "kızgın yağ 170°C")
- ✅ **Görsel/duyusal sinyal** pişirme step'inde ("kenarlar altın
  olana kadar", "salgısını çekene kadar", "kabardığında")
- ✅ **4-40 kelime arası** instruction uzunluğu (hard min 4, 5+ ideal;
  kısa servis kapanışı 4 kelime yeterli)

**A+ somut örnek + checklist + evrim tablosu için**: §15.1.1 (pipeline
evrim), §15.1.2 (7 gate checklist), §15.1.3 (notes format örnekleri),
§15.1.4 (full-stack A+ step örneği), §15.1.5 ("şüphe ettiğinde" somut).
Mod F için yazılmış ama **Mod A için de birebir geçerli** — Batch
37a+ teslim ederken §15.1.2 gate checklist'i satır satır işaretle.

**6. Step ↔ Ingredient eşleşme katmanı (oturum 21 Mod A 38a/b dersi)**

Bir step'te geçen malzeme adı ingredient list'inde de olmalı; aksi
halde validate-batch ERROR atar (`step mentions X but ingredient list
has no match`). 4 staple özel kontrol:

- **`un` (ERROR severity)**: Step'te "un" kelimesi geçiyorsa ingredient
  list'inde un türevi (tip 550, kepekli un, mısır unu, badem unu, vb.)
  olmalı. **"iri un gibi", "un kıvamında" gibi simile kullanma** —
  validate engine simile algılamaz, false-positive değil ERROR. Yerine
  "iri toz halinde", "ince taneli kıvam" yaz.
- **`pul biber` (ERROR)**: Aynı disiplin; pul biber stepte varsa
  ingredient'ta da olsun.
- **`tuz` + `karabiber` (WARNING)**: Pantry staple sayılır ama hala
  ingredient list'e eklemek tercih edilir (1-2 satır extra; staple
  WARNING ekran karışıklığı yapar, ERROR değil).

**7. Alkollü malzeme + tag eşleşmesi (oturum 21 Mod A 38a dersi)**

Validate engine `ALCOHOL_WORDS` listesi (votka, raki, rom, gin, cin,
likor, sarap, bira, viski, tekila, brendi, kanyak, prosecco, sampanya,
bitters, vermut, kampari) ile ingredient'ta alkol arar; varsa
"alkollu" tag ZORUNLU (18+ yaş gate tetiklenmesi için). Aksi halde
ERROR.

**Önemli istisna**: `şarap sirkesi` ingredient'ı `sarap` substring
match yapar ve false-positive verir. Sirke alkol değildir; **bu durumda
"şarap sirkesi" yerine "üzüm sirkesi" veya "kırmızı şarap sirkesi"
hatta `kırmızı sirke` yaz** (validate hâlâ tetikler — "şarap" geçmesin).
En temizi `üzüm sirkesi` (Türk mutfağı yaygın eşdeğer).

Aynı şekilde "rom köküm" gibi kompozit isimler dikkat. Şüphede aday
kelimeyi normalize edip (aksansız lowercase) `\bword\b` regex testi
yap → ingredient'a alternatif isim koy.

### 5.1 Kaynak kontrolü Mod A'da (yeni tarif üretirken de)

Mod A yeni tarif yazıyor, Mod F gibi retrofit değil — ama web kaynağı
kontrolü YİNE ZORUNLU. Codex tarif kurgularken en az 1 güvenilir
kaynağa bakmalı (bölgesel ise T.C. Kültür Bakanlığı / yöre valiliği;
uluslararası klasik ise Wikipedia + BBC Good Food / NYT Cooking /
Serious Eats / o mutfağın önde gelen sitesi).

**Codex teslim mesajında chat'te belirtsin:** her batch için
"aşağıdaki kaynaklara baktım" özet + 5-10 tarif için per-slug kaynak
(özellikle bölgesel/şüpheli). JSON/seed içine eklemeye gerek yok.

**Uydurma malzeme / oran / teknik YASAK.** Şüpheliysen atla veya
Kerem'e sor.

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
- **`de.tipNote` VE `de.servingSuggestion` AYNI DISIPLIN** (oturum 19
  Backfill-14 dersi). DE serving 98/100 unique çıktı, 2 çift dupe
  ("Heiss in Schalen mit Minzbutter servieren" 2 yoğurtlu çorbada,
  "Heiss mit Jasminreis und Fruehlingszwiebeln" 2 Çin wok'ta). Semantik
  doğru ama ayrı tarifler ayrı DE metin hak eder. **Benzer tariflerde
  bile en az 1 kelime farkla ayrılsın** (yan tabak, doku ipucu, garnitür
  farkı, dilimleme tarzı vs).
  - Backfill-15 örneği: Codex feedback'i aldı, 100/100 EN + 100/100 DE
    unique teslim etti. Hedef seviye.
- `en.ingredients[].name` + `en.steps[].instruction` → Türkçe harf
  (çğıöşü) var mı? Varsa düzelt (EN özel isim hariç: "karniyarik",
  "menemen" gibi yemek adı korunur ama yardımcı fiil/isim çevrilir)
- Her slug için `en.steps.length === tr_step_count_from_csv`?

Self-check'i teslim mesajına ekle: "grep temiz / unique EN tip=100 /
unique EN serv=100 / unique DE tip=100 / unique DE serv=100 / step
count tümü eşleşiyor".

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
11. ✅ **Step count type kuralına uyuyor mu?** (§14.6): YEMEK/CORBA/TATLI **min 5 max 12** (kompleks tarifler için), SALATA/KAHVALTI **min 5 max 8**, APERATIF/KOKTEYL/ATISTIRMALIK **min 4 max 8**, ICECEK/SOS **min 3 max 6**. **Oturum 18 dersi: teslim öncesi bash ile ölç:**
    ```bash
    node -e "
    const MIN={YEMEK:5,CORBA:5,SALATA:5,TATLI:5,KAHVALTI:5,APERATIF:4,ATISTIRMALIK:4,KOKTEYL:4,ICECEK:3,SOS:3};
    const MAX={YEMEK:10,CORBA:10,SALATA:8,TATLI:10,KAHVALTI:8,APERATIF:8,ATISTIRMALIK:8,KOKTEYL:6,ICECEK:6,SOS:6};
    // ...bach dosyani parse et, her tarif icin type + steps.length kontrol et, FAIL sayisi yazdir
    "
    ```
    **UNDER veya OVER = 0 olmalı.** Oturum 16-17'de 30a-34b aralığında bu self-check atlandığı için 297 tarif kural dışı üretildi → Mod F ile retrofit edildi. Aynı hata tekrarı YASAK.

12. ✅ **A+ KURALI (§5.0 madde 1): Step sayısı çeşitlilik.** Bir batch içinde step sayısı tek değerde kilitlenmez, min 3 farklı değer kullanılmalı. Tek değer dominant (≥%60) = FAIL. Batch 36b'de 50/50 tam 6-step oldu — tekrar etme. Bash (scripts/validate-batch.ts benzeri):
    ```bash
    # Son N tarife (yeni batch) step count dağılımı ölç
    node -e "
    const recipes = require('./dist-seed-temp.js').recipes.slice(-50);
    const dist = recipes.reduce((a,r)=>{a[r.steps.length]=(a[r.steps.length]||0)+1;return a},{});
    const uniq = Object.keys(dist).length;
    const max = Math.max(...Object.values(dist));
    if(uniq<3 || max/50>0.6){ console.log('FAIL varyasyon', JSON.stringify(dist)); process.exit(1) }
    "
    ```

13. ✅ **A+ KURALI (§5.0 madde 2): Pişirme step'inde `timerSeconds` zorunlu.** Fırın/ocak/tava/ızgara/mühürleme/haşlama/dinlendirme/mayalanma/ıslatma verbi içeren step'te `timerSeconds` null olamaz. Batch 36b'de 13 step timer eksikti — tekrar etme.
    ```bash
    node -e "
    const recipes = require('./dist-seed-temp.js').recipes.slice(-50);
    const COOK = /(pişir|kavur|haşla|mühürle|kızart|mayala|fırınla|közle|dinlendir|ıslat|bekletin)/i;
    let fails = 0;
    recipes.forEach(r=>r.steps.forEach(s=>{ if(COOK.test(s.instruction) && !s.timerSeconds){ fails++; console.log(r.slug, 'step'+s.stepNumber) } }));
    if(fails>0) process.exit(1)
    "
    ```

14. ✅ **A+ KURALI (§5.0 madde 3): Muğlak ifade yasak liste.** "kısa süre, bir süre, biraz bekle, uygun kıvam, dilediğin kadar, yeterince, uygun ölçüde, iyice (tek başına), hafif dokulu" kelimeleri yalnızca somut ölçü (sayı/°C/dakika/saniye/kaşık/bardak) eşliğinde kullan, tek başına YASAK.
    ```bash
    grep -En 'kısa süre[^0-9]|bir süre[^0-9]|uygun kıvam|dilediğin kadar|yeterince(?![^.]*\d)' scripts/seed-recipes.ts | tail -20
    ```

15. ✅ **A+ KURALI (§5.0 madde 4): Kritik nokta / neden-sonuç notu.** Her tarifte en az 1 step içinde neden-sonuç açıklama olsun ("yoğurt kesilmesin", "gluten gevşesin", "dokusu kaymasın"). Batch genelinde minimum **%60 tarifte bulunmalı** (Retrofit-02'de %10 kaldı, A- not; Retrofit-03+ %60 zorunlu). Pattern bash ile ölçülür:
    ```bash
    # seed dist export + son 50 tarifte kritik nokta oran
    node -e "
    const recipes = require('./dist-seed-temp.js').recipes.slice(-50);
    const REASON = /yoksa|olmasın|kesilmesin|gelişmesin|gevşesin|çatlamasın|kaymasın|dağılmasın|yanmasın|sertleşmesin|pişmesin|akmasın|aksi halde|aksi takdirde|diye|böylece|çünkü/i;
    const hit = recipes.filter(r => r.steps.some(s => REASON.test(s.instruction)));
    const pct = hit.length / recipes.length;
    console.log('Kritik nokta:', hit.length + '/' + recipes.length, '(' + (pct*100).toFixed(0) + '%)');
    if (pct < 0.6) { console.log('FAIL: %60 altı'); process.exit(1); }
    "
    ```

16. ✅ **A+ KURALI (§14.7 + §15.8): Template dup.** Aynı cümle 2+ tarifte geçmesin. Batch 36b'de 2 dup vardı — tekrar etme.
    ```bash
    node -e "
    const recipes = require('./dist-seed-temp.js').recipes.slice(-50);
    const m = new Map();
    recipes.forEach(r=>r.steps.forEach(s=>{ if(!m.has(s.instruction)) m.set(s.instruction, new Set()); m.get(s.instruction).add(r.slug) }));
    const dups = [...m.entries()].filter(([,s])=>s.size>1);
    if(dups.length>0){ dups.forEach(([t,s])=>console.log(s.size+'x:', t.slice(0,60))); process.exit(1) }
    "
    ```

17. ⛔ **A+ KURALI (§5.0 madde 5, oturum 19 Retrofit-16 + Batch 37a dersi): TEMPLATE SMUGGLING YASAK.** Aynı suffix pattern'ini farklı tariflerde kullanma; slug/tarif adını değişken gibi başa koyup aynı cümle kalıbını tekrar etmek `template dup` gate'ini exact-match olduğu için atlatır, ama **kalite sıfıra düşer**. Retrofit-16'da 42/100 tarif step 1'de 5 suffix'i paylaştı (`"[TARIFADI] tepsisini hazırlayın, hamur oranı şaşmasın"`, `"[TARIFADI] servis bardaklarını hazırlayın, katmanlar kenardan akmasın"`, vb.). **Her tarifin step 1'i o tarifin gerçek ilk aksiyonu olmalı** — "Unu ve şekeri çırpın", "Elmaları 1 cm küp doğra", "Sütü 85°C'ye ısıt" gibi malzeme/tekniğe özel. "[TARIFADI] X hazırlayın" gibi generic scaffold YAZMA.

    Kritik nokta notu (§15.7.4 / madde 4) step 1'e template olarak yerleştirilmez; tarif akışı içinde **doğal yerine** otur (ör. süt kaynatırken "sütün yanmaması için sürekli karıştırın"). Retrofit-06 🏆 örneği: her step spesifik, scaffold yok.

    Bash suffix frekans kontrolü (step 1'lerde tarif adı sonrası kalıp).
    **Eşik: ≤10 PASS, >10 FAIL** (oturum 19 Retrofit-17 dersi).

    Mantık: aynı suffix 4-5 tarifte doğal (ortak pişirme adımı, "tencereye
    alın", "yıkayıp süzün"), 10'a kadar çıkabilir farklı tariflerin paralel
    aksiyonu olarak. 10 üstü = scaffold şüphesi yüksek, malzeme/teknik
    ayırt ediciliği kaybolur. Retrofit-16 v1 örneği: 12 tarifin step 1'i
    "[TARIFADI] tepsisini hazırlayın, hamur oranı şaşmasın" kapanışı
    paylaşıyordu, FAIL.

    ```bash
    node -e "
    const recipes = require('./dist-seed-temp.js').recipes.slice(-50);
    const freq = {};
    recipes.forEach(r => {
      const s1 = r.steps[0].instruction;
      const suffix = s1.split(' ').slice(3).join(' ');
      freq[suffix] = (freq[suffix] || 0) + 1;
    });
    const top = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];
    if (top && top[1] > 10) {
      console.log('FAIL: step1 suffix scaffold', top[1]+'x:', top[0].slice(0,80));
      process.exit(1);
    }
    console.log('PASS: step1 suffix dağılımı doğal');
    "
    ```

    Asıl test: **step 1'in başlangıcı tarif-spesifik mi?** "Bulguru yıkayıp...",
    "Ayvaları bölüp...", "Cevizi kırın..." gibi malzeme öncelikli aksiyonlar
    OK; "[TARIFADI] tepsisini hazırlayın" generic scaffold YASAK.

    Son step için de aynı eşik geçerli, servis/kapanış cümlesi farklı
    tariflerde benzer biçim alabilir.

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
- `instruction` her step için zorunlu, **5-25 kelime ideal**, **hard
  minimum 4 kelime** (oturum 19 gevşetme, Retrofit-05 dersi). Ana
  pişirme adımlarında 5+ kelime hedef (ölçü + görsel sinyal + süre);
  kısa servis kapanışı 4 kelime yeterli ("Karabiberle sıcak servis
  edin", "Dilimleyip sıcak tabakta sunun"). 3 kelimelik step'i 4'e
  tamamla, yapay uzatma yapma.
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

### 14.6 Adım sayısı kararı (Kerem oturum 18 direktifi, type bazli min/max KATI)

**Tarif type'ına göre min / max / ideal step sayısı:**

| Type | Min | Max | İdeal | Mantık |
|---|---|---|---|---|
| **ICECEK** (cin tonik, smoothie, ferahlatıcı) | **3** | **6** | 3-5 | Çok basit, hazırlık + birleştirme + servis |
| **SOS** | **3** | **6** | 3-5 | Malzeme + pişirme/karıştırma + ayar + servis |
| **KOKTEYL** (whiskey sour, margarita) | **4** | **6** | 4-5 | Ölçü + buz + shake + süsleme + servis |
| **APERATIF** (humus, dolmalık) | **4** | **8** | 4-6 | Hazırlık + ana iş + son dokunuş + servis |
| **ATISTIRMALIK** (cips, kroket) | **4** | **8** | 4-6 | Hazırlık + pişirme + servis |
| **SALATA** | **5** | **8** | 5-7 | Yıka/doğra + sos + karıştır + dinlendir + servis |
| **KAHVALTI** | **5** | **8** | 5-7 | Hazırlık + pişirme + ayar + servis |
| **YEMEK / CORBA / TATLI** | **5** | **12** | 5-8 | Asıl tarif, detaylı (kompleks tarifte 12'ye kadar) |

**Hard cap: YEMEK/CORBA/TATLI için 12 step, diğer type'lar için 6-8** (KOKTEYL/SALATA/KAHVALTI/APERATIF/ATISTIRMALIK/SOS/ICECEK). Şişirme yasak, ideal aralıkta tut, ama börek/baklava/ayrılmış sos gibi gerçekten kompleks tarifte 10-12 step doğal.

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
- [ ] Her step 4-25 kelime arası (hard min 4, 5+ ideal; oturum 19 gevşetme).
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

---

## 15. Mod F, Step Count Retrofit (self-contained, 2660 tarif)

**Kerem direktifi (oturum 18):** Step count min kuralı oturum 16-17'de
konuldu ama 30a-34b aralığında (10 batch × 50 tarif = 500 tarif) sadece
son 3 batch'te (35a/35b/36a) uygulandı. Pre-30a dönemindeki 2363 tarif
+ 30a-34b 297 tarif = **2660 tarif kurala uymuyor**. Mod F amacı: hepsini
kurala uygun hale getirmek. Scope dar değil, geniş — en doğru tarifleri
üretmek için.

### 15.1 Amaç ve prensip, A+ kalite standardı (oturum 18 Retrofit-01 dersi)

Mevcut tariflerin **step sayısını artır + kaliteli detaylandır**, ama
orijinal malzeme ve oranları koru. Eğer web kaynağı kontrolünde mevcut
malzeme/oran/mantık hatası bulursan düzelt + `notes` alanına yaz.

Temel prensip: **tarif içeriği DAHA DOĞRU, DAHA DETAYLI ve DAHA
EĞİTİCİ olur.** Şu anki kısa step'ler kullanıcıya yetersiz rehberlik
veriyor; "sebzeleri kavurun" gibi tek adım 3-4 ayrı adıma bölünür
(doğra + ısıt + kavur + baharat ekle).

**A+ KALİTE BAROMETRESİ (Retrofit-01 B+ notundan yukarı çıkmak için):**

Retrofit-01 teslim audit'inde şu 3 sorun yakalandı, Retrofit-02+
batch'lerde TEKRARLANMAYACAK:

1. ❌ **Step sayısı çeşitlilik 0** — 100 tarifin 100'ü tam 4 step. Codex
   "min yeter" yaklaşımı seçmiş. **A+ kuralı:** her batch içinde step
   sayısı en az **3 farklı değer** kullan (§15.5.1 dağılım tablosu).
2. ❌ **`notes` alanı 0/100** — web kaynağı doğrulama izi yok. Chat'te
   "BBC Good Food baktım" demek yetmez. **A+ kuralı:** her item'da
   `notes` DOLU (§15.6.2), min 2 kaynak + doğrulanan boyut (süre /
   sıcaklık / oran / sıra).
3. ❌ **Muğlak ifadeler** ("kısa süre", "hafif dokulu", "iyice",
   "yumuşayana kadar" gibi) — somut olmayan kelime. **A+ kuralı:** bu
   kelimeler GREP ile yakalanır (§15.7.3 genişletilmiş yasak liste).
   Yerine ölçü + zaman + görsel sinyal.

**A+ = 4 temel:** doğru (web kaynak) · detaylı (adım + ölçü + zaman +
sıcaklık + görsel sinyal) · çeşitli (step sayısı + ifade varyasyonu) ·
eğitici (kritik nokta + neden-sonuç açıklama).

### 15.1.1 A+ pipeline evrim tablosu (Retrofit-01 → 06, Codex dersleri)

6 ardışık batch'te pipeline evrildi. Bu tablo Codex'e **hangi sorunun
hangi brief güncellemesiyle çözüldüğünü** gösterir, aynı hatayı
tekrarlamamak için kalıcı referans:

| Batch | Not | Ana güçlükler | Brief müdahalesi |
|---|---|---|---|
| **01** | B+ | Step dist `{4:100}` (varyasyon 0), notes 0/100, muğlak var | §15.5.1 varyasyon zorunluluğu + §15.6.2 notes ZORUNLU + §15.7.3 muğlak yasak liste |
| **02** | A- | Varyasyon ✓ + notes ✓ ama **kritik nokta %10** | §15.7.4 kritik nokta **%60 ZORUNLU gate** (Retrofit-02 dersi) |
| **03** | 🏆 **A+** | Kritik nokta **%65** (10 → 65, 6.5× sıçrama), tüm gate PASS | Gate'ler kanıtlandı |
| **04** | A | Kritik nokta %63 ✓ ama 3 minor kelime (<5) | Kelime sayı uyarı |
| **05** | A- | Kritik nokta %70 ✓ ama 15 servis step'i <5 kelime | Brief kelime min 5 katı, servis step'lerini de 5+ yaz |
| **06** | 🏆 **A+ (0 SORUN)** | Tüm gate PASS, kelime ihlal 0, kritik nokta %63 | Codex disiplini tam oturdu |

**Dersler (Codex için özet)**:
1. **Step sayısı tek değerde kilitlenme** (§15.5.1) — min 3 distinct,
   dominant ≤%60
2. **Notes 100% dolu + min 40 char** (§15.6.2) — chat'te "baktım"
   demek yetmez, per-item format
3. **Muğlak ifade bir daha** (§15.7.3) — 13 kelime listesi + somut
   ölçü/zaman eşliğinde kullan
4. **Kritik nokta %60 gate** (§15.7.4) — "yoksa/olmasın/kesilmesin"
   vb. 13 pattern'dan en az 1 step'te, minimum 60 tarifte
5. **Kelime sayı 4-40** (§15.7, oturum 19 gevşetme) — hard minimum 4,
   ana pişirme step'leri 5+ hedef. "Karabiberle servis edin" (3) yerine
   "Karabiberle sıcak servis edin" (4) yeterli, ideal "Dilimleyip
   karabiberle sıcak tabakta servis edin" (6). Yapay uzatma değil,
   anlamlı bağlam ekle.

### 15.1.2 A+ teslim checklist (Codex gözle kontrol)

Codex teslim mesajında JSON'u atmadan önce bu checklist'i satır satır
işaretlesin. **Herhangi biri ☐ ise teslim GERI ÇEVİR ve düzelt.**

**Gate 1 — Step varyasyonu** (§15.5.1)
- ☐ Batch içinde **min 3 farklı** step sayısı kullanıldı
- ☐ Hiçbir tek değer **%60'ı geçmiyor** (100 tarif için max 60)
- ☐ Per-type dağılım önerisi takip edildi (APERATIF %30-4 + %40-5 + %20-6)

**Gate 2 — Notes 100% dolu** (§15.6.2)
- ☐ Her item'da `notes` alanı **DOLU** (undefined veya "" yasak)
- ☐ Her notes **min 40 karakter**
- ☐ Format: `{kaynak1} + {kaynak2}; {doğrulanan_aspekt}; {değişiklik_varsa}`
- ☐ En az 2 kaynak adı her notes'ta

**Gate 3 — Pişirme timer** (§15.7.2)
- ☐ Pişirme verbi içeren her step'te `timerSeconds` **null DEĞİL**
- ☐ Dinlendirme/mayalanma/ıslatma step'lerinde de timer var
- ☐ Servis/ekleme/süsleme step'lerinde timer opsiyonel (null OK)

**Gate 4 — Muğlak yasak** (§15.7.3)
- ☐ 13 kelime listesi GREP ile tarandı (kısa süre, biraz, iyice, vs.)
- ☐ Her bulunan kelime **somut ölçü** eşliğinde kullanıldı (sayı/°C/
  dakika/saniye/kaşık/bardak)
- ☐ Tek başına muğlak kelime YOK

**Gate 5 — Kritik nokta** (§15.7.4)
- ☐ Batch'te **min %60 tarifte** ≥1 step'te neden-sonuç notu var
- ☐ Pattern listesi: yoksa / olmasın / kesilmesin / gelişmesin /
  gevşesin / çatlamasın / kaymasın / dağılmasın / yanmasın /
  sertleşmesin / pişmesin / akmasın / aksi halde / diye / böylece
- ☐ Her kritik nokta tarif türüne özel (yoğurtlu sosta "kesilmesin",
  hamurda "gluten gevşesin", tatlıda "çatlamasın")

**Gate 6 — Dil disiplini** (§15.8)
- ☐ Em-dash (—) 0 eşleşme
- ☐ En-dash (–) 0 eşleşme
- ☐ UTF-8 no-BOM (dosya ilk byte `[`)
- ☐ `?` karakter 0 (encoding kaynaklı smuggling yok)
- ☐ Template dup 0 (aynı cümle 2+ tarifte yok)
- ☐ **Suffix smuggling 0** (oturum 19 Retrofit-16 dersi): step 1 ve son
  step'lerde "[TARIFADI] X hazırlayın/pişirin, Y olmasın" gibi tarif adı
  başta + aynı suffix'in 5+ tarifte tekrar etmesi yasak. `template dup`
  gate'i exact match olduğu için bu scaffold'u yakalayamıyor; her tarif
  step 1 **kendi malzemesinin/tekniğinin ilk gerçek aksiyonu** olmalı
  (örn. "Unu ve şekeri çırpın", "Elmaları 1 cm küp doğra"). Generic
  hazırlık cümleleri ("servis bardaklarını hazırla") yasak. Retrofit-06
  🏆 referans: her step tarif-spesifik, scaffold yok.
- ☐ Bash suffix dup check 3-katmanlı (oturum 19 Retrofit-17 dersi):
  - ≤10 freq: PASS (gerçek ortak aksiyon, tarif-spesifik başlangıçla)
  - 11-15: WARN, manuel inceleme (step 1 başı tarif-spesifik mi?)
  - \>15: FAIL (kesin scaffold, Retrofit-16 v1 örneği 12x)
  ```bash
  node -e "
  const j = JSON.parse(require('fs').readFileSync('docs/retrofit-step-count-N.json'));
  const freq = {};
  j.forEach(r => {
    const suffix = r.newSteps[0].instruction.split(' ').slice(3).join(' ');
    freq[suffix] = (freq[suffix]||0) + 1;
  });
  const top = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];
  if (top && top[1] > 15) { console.log('FAIL scaffold', top[1]+'x:', top[0].slice(0,80)); process.exit(1) }
  else if (top && top[1] > 10) { console.log('WARN', top[1]+'x manuel inceleme'); }
  else { console.log('PASS suffix doğal'); }
  "
  ```

**Gate 7 — Step kelime sayısı** (§15.7, oturum 19 gevşetme)
- ☐ Her step instruction **4-40 kelime** arasında (hard min 4)
- ☐ Ana pişirme step'i 5+ kelime hedef (ölçü + görsel + bağlam)
- ☐ Kısa servis kapanışı 4 kelime yeterli ("Karabiberle sıcak servis edin")
- ☐ 3 kelimelik step'i 4'e tamamla (yapay uzatma değil, anlamlı bağlam)
- ☐ 40 kelimeyi geçen step 2'ye böl

### 15.1.3 A+ örnek notes formatları (Retrofit-06'dan gerçek)

**Örnek 1 (uluslararası klasik)**:
```json
"notes": "Serious Eats falafel + BBC Good Food roasted chickpeas;
nohut kurutma, 200C civarı fırın ve gevrek yüzey doğrulandı, detay arttı"
```
→ 2 kaynak + 3 aspekt (kurutma/sıcaklık/doku) + değişiklik yok

**Örnek 2 (yöresel TR)**:
```json
"notes": "Yemek.com meze arşivi + Nefis Yemek Tarifleri ezme tarifleri;
haşlama, ezme ve soğuk servis sırası doğrulandı, oran korundu"
```
→ 2 TR kaynak + 3 aspekt (haşlama/ezme/servis) + oran notu

**Örnek 3 (düzeltme ile)**:
```json
"notes": "BBC Good Food mini quiches + Real Simple quiche; 180-200C kör
pişirme ve yumurta-krema dolgu oranı doğrulandı, 150C→180C sıcaklık
düzeltildi (CSV'de yanlış sıcaklık)"
```
→ 2 kaynak + 2 aspekt + 1 düzeltme (neyin neye döndüğü)

**Yanlış format örnekleri (GERİ ÇEVİR)**:
```json
"notes": ""                                   // boş
"notes": "web kaynakları kontrol edildi"      // belirsiz
"notes": "BBC Good Food"                      // tek kaynak, aspekt yok
"notes": "baktım"                             // minimum 40 char'ın altı
```

### 15.1.4 A+ örnek step kalitesi (full-stack)

Aşağıdaki adım **tüm A+ kriterleri** bir arada taşır. Codex step
yazarken bu formatı hedefler:

```json
{
  "stepNumber": 3,
  "instruction": "Kıyılmış soğanı 2 yemek kaşığı zeytinyağında orta
    ateşte 6 dakika pembeleşene kadar kavurun, aksi halde daha sonra
    eklenecek et salgısını çekmez.",
  "timerSeconds": 360
}
```

**Neyi barındırır?**
- ✅ **Somut verbi** (kavurun)
- ✅ **Ölçü** (2 yemek kaşığı)
- ✅ **Süre** (6 dakika) + **timerSeconds** (360)
- ✅ **Sıcaklık** (orta ateşte)
- ✅ **Görsel sinyal** (pembeleşene kadar)
- ✅ **Kritik nokta / neden-sonuç** ("aksi halde et salgısını
  çekmez" → pişirme mantığı öğretir)
- ✅ **Kelime sayısı** 23 (5-40 aralığında)
- ✅ **Em-dash yok, BOM yok, muğlak yok**

**Zayıf varyant (GERİ ÇEVİR, muhtelif gate FAIL)**:
```json
{ "stepNumber": 3, "instruction": "Soğanı kavurun.", "timerSeconds": null }
```
- ❌ Ölçü yok, süre yok, sıcaklık yok, görsel sinyal yok
- ❌ Kelime sayı 2 (<5)
- ❌ Pişirme verbi + null timer (§15.7.2)
- ❌ Kritik nokta yok

### 15.1.5 A+ "şüphe ettiğinde" ek kural

Emin değilsen **somuta git**:
- Süre verilecek mi? → **Ver** (aralık OK: "6-8 dakika")
- Sıcaklık belirsiz → **Tahmin et + web'den doğrula**
- Görsel sinyal var mı? → **En az bir tane ekle** ("altın rengi",
  "köpük bırakana kadar", "parmakla basınca geri gelene kadar")
- Kelime sayısı sınırda (4) → **5+'a çıkar**, ikinci bir detay ekle
- Kritik nokta ekleyebilir miyim? → **En azından %60 tarifte ekle**

**İlke**: A+ batch = **hiçbir step kullanıcının tahmin yapmak zorunda
kalmayacağı kadar net**. Ölçü belirsizse ölçü ver, süre belirsizse
süre ver, niye önemli belirsizse nedenini açıkla.

### 15.2 Girdi (Kerem sana ne verir)

Kerem bir CSV ile scope bildirir:
- `docs/retrofit-step-count-NN.csv` (NN = 01..27)
- Her satır: `slug, type, currentStepCount, minTarget, currentTitle, currentStepsJson`

Her CSV ~100 tarif içerir (son batch 60 tarif). Kerem komutu:
```
Mod F. Retrofit-NN
```
(NN yerine 01-27 numara). Bu komut brief §15 + CSV'yi okumak için yeter.

### 15.3 Çıktı dosyası

`docs/retrofit-step-count-NN.json` (NN = girdi CSV ile aynı).

Her batch tek JSON dosyası. UTF-8 no-BOM. Tek satıra sıkıştırma — pretty
2-space indent.

### 15.4 Item şeması

```json
[
  {
    "slug": "etli-nohut",
    "type": "YEMEK",
    "originalStepCount": 3,
    "newSteps": [
      {
        "stepNumber": 1,
        "instruction": "Nohutları bir gece 8 saat boyunca suda ıslatıp ertesi gün süzün.",
        "timerSeconds": null
      },
      {
        "stepNumber": 2,
        "instruction": "Soğanı yemeklik doğrayıp zeytinyağında orta ateşte 5 dakika hafifçe pembeleştirin.",
        "timerSeconds": 300
      },
      {
        "stepNumber": 3,
        "instruction": "Kuşbaşı eti soğanın üzerine ekleyip 6 dakika mühürleyin ve salgısını çekmesini bekleyin.",
        "timerSeconds": 360
      },
      {
        "stepNumber": 4,
        "instruction": "Domates salçası, nohut ve 3 su bardağı sıcak su ekleyip kapağı kapatın ve 45 dakika kısık ateşte pişirin.",
        "timerSeconds": 2700
      },
      {
        "stepNumber": 5,
        "instruction": "Tuz ve karabiberi son 5 dakikada ayarlayıp pilav yanında sıcak servis edin.",
        "timerSeconds": null
      }
    ],
    "notes": "NYT Cooking: etli nohut versiyonlarında et önce soğandan sonra mühürlenir, doğrulandı. TR Wikipedia 'nohut' maddesi: ıslatma süresi 8 saat."
  }
]
```

Alanlar:
- `slug` (string, zorunlu): CSV'den birebir
- `type` (enum, zorunlu): CSV'den birebir
- `originalStepCount` (int, zorunlu): CSV'deki currentStepCount
- `newSteps` (array, zorunlu): min 3, max 10 eleman
  - `stepNumber` (int, 1..N ardışık, zorunlu)
  - `instruction` (string, 4-40 kelime, zorunlu; hard min 4, 5+ ideal)
  - `timerSeconds` (int veya null, opsiyonel)
- `notes` (string, opsiyonel): web kaynağı doğrulama özeti, eğer mevcut
  tarifte düzeltme yaptıysan açıklama

### 15.5 Step count kuralı (type bazında, KATI)

| Type | Min | Max | İdeal |
|---|---|---|---|
| **YEMEK** | 5 | **12** | 5-8 |
| **CORBA** | 5 | **12** | 5-8 |
| **SALATA** | 5 | **8** | 5-7 |
| **TATLI** | 5 | **12** | 5-8 |
| **KAHVALTI** | 5 | **8** | 5-7 |
| **APERATIF** | 4 | **8** | 4-6 |
| **ATISTIRMALIK** | 4 | **8** | 4-6 |
| **KOKTEYL** | 4 | **6** | 4-5 |
| **ICECEK** | 3 | **6** | 3-5 |
| **SOS** | 3 | **6** | 3-5 |

**Hard cap: hiçbir tarif 10 step'i geçemez** (SOS/ICECEK için 6).
Gereksiz şişirme yasak — ideal aralıkta tut, max'a dayanmak zorunda değilsin.

### 15.5.1 Step sayısı çeşitlilik zorunluluğu (A+ kuralı)

**Bir batch içinde step sayısı tek değerde kilitlenmez.** Retrofit-01'de
100 tarif için 100'ü 4-step oldu — bu B+ notuna kadar düşürüyor.
Gerçek tarifler farklı detay seviyeleri gerektirir.

**Dağılım zorunluluğu (her batch için):**

| Type | Dağılım önerisi (100 tarif baz) |
|---|---|
| APERATIF / ATISTIRMALIK | ≥ 30% **4-step**, ≥ 40% **5-step**, ≥ 20% **6-step**, isteğe bağlı 7-8 |
| KOKTEYL | ≥ 50% **4-step**, ≥ 40% **5-step**, isteğe bağlı 6 |
| ICECEK / SOS | ≥ 50% **3-step**, ≥ 30% **4-step**, isteğe bağlı 5-6 |
| SALATA / KAHVALTI | ≥ 20% **5-step**, ≥ 50% **6-step**, ≥ 20% **7-step**, isteğe bağlı 8 |
| YEMEK / CORBA / TATLI | ≥ 15% **5-step**, ≥ 40% **6-step**, ≥ 25% **7-step**, ≥ 15% **8+-step** |

**Karar mantığı per-recipe:** CSV'deki `currentStepCount` + tarifin
karmaşıklığı + web kaynaktaki referans step sayısı. Basit humus = 4,
karides dolgulu acarajé = 5-6, etli güveç = 7-8.

**Self-check:** §15.9 madde 10'da Node script batch dağılımını ölçer,
tek değer kilidi varsa FAIL. Min 3 farklı step sayısı zorunlu.

### 15.6 Doğruluk — web kaynağı kontrolü (ZORUNLU)

Her tarif için **en az 2 güvenilir kaynak** kontrol et ve tariften emin ol.

**Türk mutfağı (bölgesel/klasik) için:**
- Türkçe Wikipedia tarif sayfası
- Nefis Yemek Tarifleri (nefisyemektarifleri.com) — popülerlik + yorum
- Yemek.com
- Mutfak Sırları (mutfaksirlari.com)
- T.C. Kültür ve Turizm Bakanlığı yemek kültürü sayfaları
- İl valilikleri / belediye kültür sayfaları (yöresel tarifler için)
- Sahrap Soysal, Vedat Başaran, Refika Birgül gibi referans şefler

**Uluslararası klasikler için:**
- Wikipedia EN/DE/FR (o mutfağın dili)
- BBC Good Food (bbcgoodfood.com)
- NYT Cooking (cooking.nytimes.com)
- Serious Eats (seriouseats.com) — Kenji López-Alt method ağırlıklı
- Epicurious (epicurious.com)
- The Kitchn (thekitchn.com)
- o ülkenin önde gelen yemek sitesi (İtalyan: Giallo Zafferano,
  Alman: Chefkoch, Fransız: Marmiton, Japon: Just One Cookbook)

**Bölgesel/yöresel Türk tariflerinde ekstra:**
- Akademik gastronomi makaleleri (Dergipark, Google Scholar)
- Yöre sakini blog + YouTube (güvenilir video tarifler)

### 15.6.1 Kaynak kontrolünde ne arıyoruz?

1. **Malzeme listesi doğru mu?** (kritik bir malzeme eksik mi, yanlış mı?)
2. **Oranlar makul mu?** (su/un oranı, tuz miktarı, pişirme suyu vs.)
3. **Adım sırası mantıklı mı?** (et mühürleme → sebze → sıvı sırası doğru mu?)
4. **Sıcaklık doğru mu?** (150°C mi 180°C mi 220°C mi?)
5. **Süre doğru mu?** (pişirme 20 dk mı 45 dk mı?)
6. **Bölgesel otantiklik var mı?** (Adana kebabı kıyma mı yoksa kuşbaşı mı gibi)

Mevcut step'te **ciddi hata** bulursan (ör: "100°C fırında 10 dk" → aslında
"200°C 30 dk"): düzelt + `notes`'a sebebi yaz.

**Küçük drift** (ör: step'te "tuz" eksik, malzeme listesinde var):
step'i genişletirken doğal ekle, notes'a yazmaya gerek yok.

### 15.6.2 Notes alanı ZORUNLU (A+ kuralı, Retrofit-01 dersi)

**Her item'da `notes` alanı DOLU** (empty string veya undefined yasak).
Chat'te "BBC Good Food baktım" demek yetmez — her tarifin JSON'ında
hangi kaynağa bakıldığı + doğrulanan aspekt yazılı olsun. Audit için
kritik.

**Format (tek satır, 80-200 karakter):**
```
{kaynak1} + {kaynak2}; {dogrulanan_aspekt1}, {dogrulanan_aspekt2}; {degisiklik_varsa}
```

**Örnekler:**
```json
"notes": "BBC Good Food arancini + Giallo Zafferano; pirinç haşlama süresi 18 dk, iç doldurma sırası; 150°C -> 180°C düzeltildi (CSV'de yanlış sıcaklık)"
```
```json
"notes": "Serious Eats hummus + Yemek.com klasik; tahin-nohut oranı 1:3, limon miktarı; oran eşit, değişiklik yok"
```
```json
"notes": "Maangchi kimchijeon + Korean Bapsang; hamur kıvamı, tavada pişirme süresi 3dk/yüz; yeni step sırası = çırpma + dinlendirme ayrıldı"
```

**Minimum içerik:**
- ✅ 2+ kaynak adı (soyadı + site veya site + site)
- ✅ En az 1 doğrulanan aspekt (süre / sıcaklık / oran / sıra / teknik)
- ✅ Değişiklik yaptıysan açıkla ("yeni step 3 eklendi: dinlendirme"),
  yoksa "oran eşit, değişiklik yok" veya "sıra korundu, sadece detay arttı"

**Yanlış format (FAIL):**
```json
"notes": "web kaynaklari kontrol edildi"   // çok belirsiz
"notes": "BBC Good Food"                   // tek kaynak + aspekt yok
"notes": ""                                // boş string, undefined sayılır
```

Self-check §15.9 madde 11 her item'da `notes.length >= 40` kontrol eder.

### 15.7 Step kalite kuralları (A+ standardı)

Her step şöyle olmalı:

✅ **Somut eylem verbi** (doğra, kavur, ezle, haşla, mühürle, süz, karıştır, dinlendir, şekillendir, kızart, deller, form ver)
✅ **Ölçü** gerektiren yerde YAZILI ("2 yemek kaşığı yağ", "1 su bardağı su", "3 diş sarımsak")
✅ **Süre** gerektiren yerde YAZILI ("5 dakika", "30 saniye", "1 gece 8 saat")
✅ **Sıcaklık** gerektiren yerde YAZILI ("180°C önceden ısıtılmış fırın", "kısık ateş", "orta ateş", "kızgın yağ 170°C", "soğuk su")
✅ **Görsel/duyusal sinyal** eklenmeli pişirme/hazırlama step'lerinde ("kenarlar altın olana kadar", "salgısını çekene kadar", "kabaran şekilde", "parmakla basınca geri gelene kadar", "köpük bırakana kadar", "yüzeyi çatlayana kadar")
✅ **4-40 kelime arası** (hard min 4, 5+ ideal; çok kısa = yetersiz, çok uzun = karmaşık). Servis kapanışı 4 kelime OK, ana pişirme 5+ hedef.

❌ **"pişirin" tek başına** yeterli değil (nasıl, kaç dk, hangi ateş, görsel sinyal?)
❌ **"hazırlayın" tek başına** belirsiz (neyi nasıl?)
❌ **"karıştırın" tek başına** belirsiz (neyle, ne kadar?)
❌ **"servis edin" tek başına** zayıf (neyle, sıcak mı soğuk mı, yan tabak?)

### 15.7.2 Pişirme step'inde sıcaklık + timer ZORUNLU (A+ kuralı)

**Fırın / ocak / tava / ızgara / derin yağ kullanan her step'te:**
- ✅ Sıcaklık yazılı (°C veya "kısık/orta/yüksek ateş" + "kızgın yağ" gibi nitel)
- ✅ `timerSeconds` JSON alanı DOLU (tahmini süre saniye cinsinden)

**Dinlendirme / ıslatma / mayalanma step'inde:** `timerSeconds` zorunlu
(1800 = 30 dk, 28800 = 8 saat gece ıslatma gibi).

**Hazırlama step'inde (doğrama, karıştırma hamur yoğurma):** timer
opsiyonel ama mantıklıysa yaz (8 dakika yoğurma = 480).

**Ekleme/süsleme/son servis step'inde:** timer gerekmez, null OK.

Self-check §15.9 madde 12 pişirme-verbi içeren step'lerin `timerSeconds`
alanının null OLMADIĞINI kontrol eder.

### 15.7.3 Muğlak ifade yasak listesi (genişletildi, Retrofit-01 dersi)

Bu kelimeler tek başına YASAK — yerine somut ölçü + zaman + görsel.
Self-check §15.9 madde 13 grep ile yakalar.

| Yasak kelime/ifade | Neden | Yerine |
|---|---|---|
| "kısa süre" | Belirsiz | "3-4 dakika" |
| "bir süre" | Belirsiz | "8 dakika" |
| "biraz" | Belirsiz | "1 yemek kaşığı" |
| "biraz bekle" | Belirsiz | "10 dakika dinlendir" |
| "hafif" / "hafifçe" (tek başına) | Belirsiz | "2 dakika hafifçe pembeleşene kadar" |
| "iyice" | Belirsiz | "elinize yapışmayana kadar" veya "5 dakika" |
| "uygun kıvam" | Belirsiz | "kaşıktan ağır akan kıvam" |
| "yumuşayana kadar" (tek başına) | Kısmen belirsiz | "20 dakika yumuşayana kadar" |
| "azar azar" (tek başına) | Kısmen belirsiz | "1 yemek kaşığı ekleyip karıştırarak" |
| "dilediğin kadar" | Belirsiz | Brief'te ölçü ver veya "ihtiyaca göre" |
| "yeterince" | Belirsiz | Ölçü ver |
| "uygun ölçüde" | Belirsiz | Ölçü ver |
| "bol" (tek başına) | Kısmen belirsiz | "3 litre su" veya "kaplı yağ" |

**Not:** "hafifçe pembeleşene kadar 5 dakika kavurun" OK (hafif kelimesi
somut süre + görsel ile dengelenmiş). "hafif dokulu" tek başına FAIL —
dokulu kelimesi net değil.

### 15.7.4 Kritik nokta / neden-sonuç notu (A+ ZORUNLU, Retrofit-02 dersi)

**Minimum %60 tarifte** en az 1 step içinde kısa bir neden-sonuç
açıklaması bulunmalı. Retrofit-02'de bu oran %10'da kaldı — A+ için
açıkça yetersiz, Retrofit-03+ mutlaka %60+ yakala.

Tarifin başarısı için kritik bir detay niye önemli, kullanıcı anlamalı.
Kısa formlar kabul:
- `"..., yoğurt kesilmesin."`
- `"..., gluten gevşesin diye."`
- `"..., dokusu kaymasın."`
- `"..., aksi halde yanar."`
- `"..., böylece kabardığında çökmez."`

**Tetikleyici pattern'lar (Codex self-check ile ölçer):**
`yoksa | olmasın | kesilmesin | gelişmesin | gevşesin | çatlamasın |
kaymasın | dağılmasın | yanmasın | sertleşmesin | pişmesin | akmasın |
aksi halde | aksi takdirde | diye | böylece | çünkü | sonra ... daha`

**Tarif tipine göre beklenen kritik nokta örnekleri:**

| Tarif türü | Kritik nokta örneği |
|---|---|
| Et (mühürleme) | "Eti önce oda sıcaklığına getirin, kesitinde eşit pişsin." |
| Yoğurtlu sos | "Sosa yoğurdu ocak kapalıyken ekleyin, kesilmesin." |
| Hamur | "Hamuru 20 dakika dinlendirin, gluten gevşesin ve açılması kolaylaşsın." |
| Fırın tatlı | "Fırını açmayın, ilk 15 dakikada kabarmayı kesmeyin." |
| Sote | "Tavayı önceden kızdırın, sebze haşlanmasın buğusuz kalsın." |
| Çorba | "Çorbaya limonu ocak kapandıktan sonra sıkın, aksi halde acılaşır." |
| Kızartma | "Yağa parça parça atın, sıcaklık düşmesin ve yağ emmesin." |
| Salata | "Domatesi soslamadan hemen önce kesin, suyunu salıp kıvamı bozmasın." |
| Içecek | "Buzu shake sırasında ekleyin, hemen içilsin, yoksa sulanır." |

**Her tarifte 1 kritik nokta hedef; batch genelinde %60+ kapsam
zorunlu.** Tarif çok basit ise (tek adımlı içecek) servis notu kabul
edilir: "Sıcak servis edin, soğuyunca doku kayar."

Self-check §15.9 madde 15 bu pattern'ı grep ile ölçer, <%60 ise FAIL.

### 15.7.5 Ingredient miktar tekrarı (mantıklı yerlerde)

Step içinde ingredient'a atıfta bulunurken **miktarı da hatırlat**,
kullanıcı malzeme listesine bakmadan akışı takip edebilsin.

✅ "**2 yemek kaşığı zeytinyağını** orta ateşte ısıtıp 1 adet ince
   doğranmış soğanı 5 dakika pembeleştirin."
✅ "**400 gr haşlanmış nohutu** robotta 30 saniye pütürsüz çekin."

Zorunlu değil ama step uzunluğu 10-25 kelime ise ingredient miktarını
tekrar hatırlatmak A+ kalitenin göstergesi. Kısa basit step'lerde
(ör. "Soğanı doğrayın.") gereksiz.

### 15.7.1 Step-split örnekleri (eski → yeni)

**Örnek 1, sebze kavurma:**
- Eski: "Sebzeleri kavurun."
- Yeni (2 step):
  - "Soğanı yemeklik, biberi ince doğrayın."
  - "Zeytinyağını orta ateşte ısıtıp soğan + biberi 6 dakika pembeleşene kadar kavurun."

**Örnek 2, pişirme:**
- Eski: "Fırında 20 dakika pişirin."
- Yeni (2 step):
  - "Fırını önceden 200°C'ye ısıtın."
  - "Tepsiyi orta rafa alıp 20 dakika kenarları altın olana kadar pişirin."

**Örnek 3, servis:**
- Eski: "Servis edin."
- Yeni (1-2 step):
  - "5 dakika dinlendirip sıcak servis edin."
  - "Yanında ayran ve piyazla tabaklayın."

### 15.8 Dil kuralları (§em-dash-ban + §14.5 tekrar)

🚫 **Em-dash (—) U+2014 YASAK** — tüm dosyada 0 eşleşme
🚫 **En-dash (–) U+2013 YASAK** — tüm dosyada 0 eşleşme
✅ Tire (-) kelimelerde OK (ör: "fire-and-forget", "yarı-pişmiş", "ön-ısıtma")

✅ **Türkçe karakter disiplini** — ç, ğ, ı, İ, ö, ş, ü UTF-8 no-BOM
🚫 **BOM (Byte Order Mark)** dosya başında yasak
🚫 **Bozuk/ASCII kalıntı** — "pisirdikten" (ı yerine i), "yumusayan" (ş yerine s) yasak
🚫 **? karakter smuggling** — encoding bozukluğu nedeniyle `?` yasak

✅ **Aynı cümle 2+ step'te tekrarlanamaz** (tarif içinde)
✅ **Aynı cümle 2+ tarifte tekrarlanamaz** (batch genelinde)
✅ **"ya da" veya "veya" dozunda** — batch başına en fazla 5 legitimate kullanım

### 15.9 Self-check (teslim öncesi, ZORUNLU)

Codex teslim ÖNCE bu bash komutlarını dosyasında koşar. Hepsi temiz çıkmalı:

```bash
FILE=docs/retrofit-step-count-NN.json

# 1) Em-dash yasağı
grep -F "—" $FILE && echo "FAIL em-dash" && exit 1

# 2) En-dash yasağı
grep -F "–" $FILE && echo "FAIL en-dash" && exit 1

# 3) BOM yasağı
node -e "const r=require('fs').readFileSync('$FILE','utf8');process.exit(r.charCodeAt(0)===0xFEFF?1:0)"

# 4) ? karakter smuggling yasağı
grep -c "?" $FILE | awk '$1>5{exit 1}'

# 5) Step count min-max kuralı
node -e "
const j=JSON.parse(require('fs').readFileSync('$FILE','utf8'));
const MIN={YEMEK:5,CORBA:5,SALATA:5,TATLI:5,KAHVALTI:5,APERATIF:4,ATISTIRMALIK:4,KOKTEYL:4,ICECEK:3,SOS:3};
const MAX={YEMEK:10,CORBA:10,SALATA:8,TATLI:10,KAHVALTI:8,APERATIF:8,ATISTIRMALIK:8,KOKTEYL:6,ICECEK:6,SOS:6};
let fail=0;
j.forEach(r=>{
  const n=r.newSteps.length;
  if(n<MIN[r.type]){console.log('UNDER',r.slug,r.type,n,'<',MIN[r.type]);fail++}
  if(n>MAX[r.type]){console.log('OVER',r.slug,r.type,n,'>',MAX[r.type]);fail++}
});
process.exit(fail?1:0)
"

# 6) stepNumber ardışıklığı (1..N, eksik/tekrar yok)
node -e "
const j=JSON.parse(require('fs').readFileSync('$FILE','utf8'));
let fail=0;
j.forEach(r=>{
  const nums=r.newSteps.map(s=>s.stepNumber);
  const exp=Array.from({length:nums.length},(_,i)=>i+1);
  if(JSON.stringify(nums)!==JSON.stringify(exp)){console.log('STEPNUM',r.slug,nums);fail++}
});
process.exit(fail?1:0)
"

# 7) Template dup (aynı cümle ≥2 tarifte)
node -e "
const j=JSON.parse(require('fs').readFileSync('$FILE','utf8'));
const m={};
j.forEach(r=>r.newSteps.forEach(s=>{m[s.instruction]=m[s.instruction]||new Set();m[s.instruction].add(r.slug);}));
const dup=Object.entries(m).filter(([,set])=>set.size>1);
console.log('Tekrar:',dup.length);
dup.slice(0,5).forEach(([t,s])=>console.log(s.size+'x:',t.slice(0,80)));
process.exit(dup.length?1:0)
"

# 8) Yasaklı pattern: "pişirin." tek başına
grep -Ei '"(pişirin|hazırlayın|karıştırın|servis edin)\.?"' $FILE && echo "FAIL zayif step" && exit 1

# 9) Slug CSV ile eşleşiyor mu (çıktıda CSV'de olmayan slug yok)
# (Claude apply sırasında ayrıca kontrol eder)

# 10) A+ KURALI: Step sayısı çeşitlilik zorunluluğu (§15.5.1)
# Bir batch içinde min 3 farklı step sayısı kullanılmalı.
node -e "
const j=JSON.parse(require('fs').readFileSync('$FILE','utf8'));
const dist=j.reduce((a,r)=>{a[r.newSteps.length]=(a[r.newSteps.length]||0)+1;return a;},{});
const uniq=Object.keys(dist).length;
console.log('Step dist:',JSON.stringify(dist),'uniq:',uniq);
if(uniq<3){console.log('FAIL: hepsi aynı step sayısında, varyasyon gerek');process.exit(1)}
// Max oran herhangi tek değerin %60'ı geçmemeli
const max=Math.max(...Object.values(dist));
if(max/j.length>0.6){console.log('FAIL: tek değer dominant',max+'/'+j.length);process.exit(1)}
"

# 11) A+ KURALI: notes ZORUNLU (§15.6.2)
# Her item'da notes min 40 karakter dolu olsun.
node -e "
const j=JSON.parse(require('fs').readFileSync('$FILE','utf8'));
const miss=j.filter(r=>!r.notes||r.notes.trim().length<40);
console.log('Notes eksik/kısa:',miss.length);
miss.slice(0,5).forEach(r=>console.log('  -',r.slug,'=',JSON.stringify(r.notes||'').slice(0,50)));
if(miss.length>0)process.exit(1)
"

# 12) A+ KURALI: Pişirme step'inde timerSeconds ZORUNLU (§15.7.2)
# Pişirme verbi içeren step'te timerSeconds null ise FAIL.
node -e "
const j=JSON.parse(require('fs').readFileSync('$FILE','utf8'));
const COOK_VERBS=/\\b(pi(ş|s)ir|kav(u|û)r|haşla|mühürle|kızart|mayala|fırınla|ızgara|pöhle|közle|karamelize|eritin|dinlendirin)/i;
const fails=[];
j.forEach(r=>r.newSteps.forEach(s=>{
  if(COOK_VERBS.test(s.instruction) && (s.timerSeconds===null||s.timerSeconds===undefined)){
    fails.push(r.slug+' step'+s.stepNumber+': '+s.instruction.slice(0,60));
  }
}));
console.log('Timer eksik pişirme step:',fails.length);
fails.slice(0,5).forEach(f=>console.log('  -',f));
if(fails.length>0)process.exit(1)
"

# 13) A+ KURALI: Muğlak ifade yasağı (§15.7.3 genişletilmiş liste)
node -e "
const j=JSON.parse(require('fs').readFileSync('$FILE','utf8'));
// Standalone veya sadece virgül/nokta etrafında; somut ölçü YOKKEN yasak.
// Basit yaklaşım: kelimeyi tespit et + aynı step içinde sayı/°C/dakika/saniye yoksa FAIL.
const VAGUE=['kısa süre','bir süre','biraz bekle','uygun kıvam','dilediğin kadar','yeterince','uygun ölçüde','iyice'];
const fails=[];
j.forEach(r=>r.newSteps.forEach(s=>{
  const txt=s.instruction.toLocaleLowerCase('tr');
  for(const v of VAGUE){
    if(txt.includes(v)){
      // sayı veya ölçü birimi var mı kontrol, varsa pas geç
      const hasMeasure=/\d|°C|dakika|saniye|gram|litre|adet|su bardağ|yemek kaşığ/i.test(s.instruction);
      if(!hasMeasure){ fails.push(r.slug+' step'+s.stepNumber+': '+v); break; }
    }
  }
}));
console.log('Muglak ifade:',fails.length);
fails.slice(0,8).forEach(f=>console.log('  -',f));
if(fails.length>0)process.exit(1)
"

# 14) A+ KURALI: 100% notes dolu (çift kontrol, madde 11 için güvence)
node -e "
const j=JSON.parse(require('fs').readFileSync('$FILE','utf8'));
const empty=j.filter(r=>!r.notes).length;
if(empty>0){console.log('FAIL:',empty,'item notes undefined');process.exit(1)}
console.log('Notes dolu: 100%')
"

# 15) A+ KURALI: Kritik nokta / neden-sonuç (§15.7.4) min %60 tarif
# Retrofit-02'de bu %10'da kalmıştı (B+ → A- not). Retrofit-03'ten
# itibaren zorunlu gate. Pattern tariflerin step'lerinde aranır.
node -e "
const j=JSON.parse(require('fs').readFileSync('$FILE','utf8'));
const REASON = /yoksa|olmasın|kesilmesin|gelişmesin|gevşesin|çatlamasın|kaymasın|dağılmasın|yanmasın|sertleşmesin|pişmesin|akmasın|aksi halde|aksi takdirde|diye|böylece|çünkü/i;
const withReason = j.filter(r => r.newSteps.some(s => REASON.test(s.instruction)));
const pct = withReason.length / j.length;
console.log('Kritik nokta:', withReason.length + '/' + j.length, '(' + (pct*100).toFixed(0) + '%)');
if (pct < 0.6) {
  console.log('FAIL: Kritik nokta %60 altı, §15.7.4 yetersiz kapsamı.');
  console.log('Yapilacak: her tarifte ≥1 step\"te \"yoğurt kesilmesin / gluten gevşesin / dokusu kaymasın\" tarzi neden-sonuc ekle.');
  console.log('Ornek patternlar: yoksa, olmasın, kesilmesin, gevşesin, çatlamasın, kaymasın, yanmasın, diye, böylece, aksi halde');
  process.exit(1);
}
"
```

Hepsi PASS ise teslim. Bir tanesi FAIL ise sorunu gider, tekrar koş.

**A+ KALITE GATE (özet):**
- Madde 10: step sayısı varyasyon (min 3 distinct, tek değer ≤ %60)
- Madde 11 + 14: notes zorunlu, min 40 char
- Madde 12: pişirme step'inde timer zorunlu
- Madde 13: genişletilmiş muğlak yasak liste
- **Madde 15: kritik nokta / neden-sonuç min %60 tarif** (Retrofit-02 dersi)
Bu 5 gate Retrofit-01 B+ → Retrofit-02 A- → Retrofit-03 A+ çıkarır.

### 15.10 Kurala uyan tarifler (DOKUNMA)

Scope'a **DAHİL DEĞİL**:
- Son 150 tarif (batch 35a + 35b + 36a) — zaten min step kurala uyan
- Min step kuralını tutan eski tarifler (5+ step YEMEK, 4+ step APERATIF, 3+ step ICECEK vs.)

CSV'de **sadece ihlal eden slug'lar** var. CSV'den çıkma — kurala uyan
tarifleri "daha da iyileştiririm" diye yeniden yazma. Scope stabil.

### 15.11 Apply prosedürü (Claude otomatik)

Codex JSON teslim ettikten sonra Claude:

1. **Dry-run**: `npx tsx scripts/apply-retrofit.ts --file docs/retrofit-step-count-NN.json --dry-run`
   - Slug mevcut mu, Zod valid mi, step count kurala uygun mu, 0 CRITICAL/WARNING
2. **Dev apply**: `--apply` (dev DB'ye yazar, eski step'ler silinir, yenileri insert edilir, transaction)
3. **Dev audit**: `/tarif/[slug]` sayfası açılıyor mu, step sayısı doğru mu (random spot check)
4. **Prod apply** (autonomous yetki, oturum 7 Kerem direktifi): `--apply --confirm-prod`
5. **Commit**: `feat(retrofit): Mod F Retrofit-NN apply (N tarif step genişletildi, dev + prod)`
6. **FUTURE_PLANS.md güncelle**: Retrofit-NN tamamlandı işaretle

### 15.12 Paralel session koordinasyonu

Mod F tek Codex session'dan yürür (Mod A farklı session, çakışma yok).
Kerem birden fazla session açarsa:
- Session 1: Retrofit-01, 02, 03...
- Session 2: Retrofit-15, 16, 17...
- Aynı slug listesi 2 session'a verilmez (CSV'ler ayrı)

### 15.13 Özet — tek satırda Mod F akışı

```
Kerem: "Mod F. Retrofit-01"
  ↓
Codex: brief §15 + docs/retrofit-step-count-01.csv okur
  ↓
Codex: her slug için web kaynağı kontrol + step genişlet + kalite fix
  ↓
Codex: self-check (9 bash) PASS alır
  ↓
Codex: docs/retrofit-step-count-01.json teslim
  ↓
Claude: dry-run → dev apply → dev audit → prod apply → commit
  ↓
FUTURE_PLANS güncelle, Retrofit-02 hazır
```

27 döngü sonrası 2660 tarif min/max kural altında, en doğru hali.

---

## 16. Mod FA, Retrofit Annotation/Audit (önceki Mod F batch'lerinin revize teslimi)

**Tetikleyici cümleler:** "Mod FA. Retrofit-N revize", "Mod FA. Batch N", "FA Retrofit-N", "Retrofit-N revize" (örn. "Mod FA. Retrofit-12 revize").

**Amaç:** Mod F sürecinde bazı batch'lerde tespit edilen **suffix smuggling** (slug/tarif adını başa koyup aynı kapanış cümlesini 27-33 tarif arası tekrar etme) sorunu nedeniyle Retrofit-12, 13, 14, 15 batch'leri **prod'a apply edildi ama kalite hedefini tam karşılamıyor**. Mod FA bu batch'leri **aynı slug listesiyle** ama **temiz** ve **doğruluk öncelikli** revize teslim eder.

### 16.1 Tetik akışı

```
Kerem: "Mod FA. Retrofit-12 revize"
  ↓
Codex: brief §16 + (orijinal) docs/retrofit-step-count-12.json okur
  ↓
Codex: aynı slug listesini al, ama step'leri SIFIRDAN tarif-spesifik yaz
  ↓
Codex: web kaynak doğrulama (her tarif için 1+ otoriter referans)
  ↓
Codex: §15 Mod F TÜM gate'leri + Kural 17 suffix freq ≤10 self-check
  ↓
Codex: docs/retrofit-step-count-12-revize.json teslim (yeni dosya, eski silinmez)
  ↓
Claude: dry-run → bağımsız audit → dev apply → prod apply → commit
```

### 16.2 Mod FA = Mod F + ek 4 zorunluluk

Mod F'in tüm kuralları (§15.1 - §15.13) **aynı şekilde geçerli**:
- Step count type bazlı min/max (§15.5)
- Notes 100% dolu min 40 char (§15.6.2)
- Pişirme step'inde timer zorunlu (§15.7.2)
- Muğlak ifade yasak liste (§15.7.3)
- Kritik nokta %60 gate (§15.7.4)
- Varyasyon min 3 distinct + dominant ≤%60 (§15.5.1)
- Em-dash / en-dash 0 (§15.8)
- Suffix smuggling top freq ≤10 (Kural 17)

**Mod FA'ya ek 4 zorunluluk** (revize batch'in nedeni bunlar):

#### 1. **Step 1 tarif-spesifik gerçek aksiyon, scaffold YASAK**

❌ YASAK pattern:
```
"[TARIFADI] için geniş kase, süzgeç ve sos kabını hazırlayın, doğranan malzeme sulanmasın"
"[TARIFADI] tepsisini ve karıştırma kabını hazırlayın, hamur oranı şaşmasın"
"[TARIFADI] kup bardaklarını hazırlayın, katmanlar kenardan akmasın"
"[TARIFADI] servis bardaklarını hazırlayın, katmanlar kenardan akmasın"
"[TARIFADI] tenceresini ve çırpıcıyı hazırlayın, sütlü taban topaklanmasın diye"
```

Bu cümleler tarif adı dışında HER ŞEY aynı, generic kalıp doldurma. Retrofit-12'de **27 tarif**, Retrofit-13'te **33 tarif** aynı suffix'i kullanıyordu.

✅ DOĞRU pattern:
```
"Bulguru yıkayıp süzün ve tencereye alın."
"Ayvaları ikiye bölüp çekirdek yataklarını temizleyin."
"Cevizi iri kırın ve kaymağı buzdolabında tutun."
"Pirinci yıkayıp az suyla 10 dakika haşlayın."
"Sütü 85°C'ye ısıtıp şekeri çözdürün."
```

Her step 1 **o tarifin ana malzemesinin gerçek ilk aksiyonu**. Bulgur/ceviz/ayva/pirinç gibi malzeme adıyla başlar veya o tarife özel bir teknik (közleme, marine, dinlendirme) ile.

#### 2. **Kritik nokta DOĞAL yerine, scaffold yerleştirme YASAK**

❌ YASAK: Step 1'in sonuna mekanik olarak "...şaşmasın", "...akmasın", "...sulanmasın" eklemek (kritik nokta gate'ini suni yükseltmek için):
```
"[TARIFADI] için kabı hazırlayın, doğranan malzeme sulanmasın." ← scaffold
```

Retrofit-14, 15, 16 v1'de kritik nokta **%100 yapay yüksek** çıkıyordu çünkü her step 1'in kapanışına olmasın/şaşmasın eklenmişti — gerçek tarif akışıyla ilgisi yoktu.

✅ DOĞRU: Kritik nokta **tarif akışı içinde gerçekten kritik olduğu yerde** yer alır:
```
"Yumurtaları sıcak süte yavaş yavaş ekleyin, sıcak süt yumurtayı pişirip kesilmesin."
"Hamuru 10 dakika dinlendirin, gluten gevşesin ve açma kolaylaşsın."
"Şerbeti tatlının üzerine soğukken dökün, hamur cıvımasın."
```

Brief §15.7.4 pattern listesi (yoksa/olmasın/kesilmesin/...) sadece **gerçek bir nedenle** eklenir, batch genelinde min %60 tarifte bulunması organik dağılımdan gelir, scaffold doldurmadan değil.

#### 3. **Web kaynak doğrulama ZORUNLU (her tarif için 1+ otoriter referans)**

Mod F'te web araştırma "iyi olur" idi, **Mod FA'da ZORUNLU**. Her tarif için **notes** alanına araştırma kaynağı yazılır:

✅ Format örneği:
```json
{
  "slug": "ayva-tatlisi-nevsehir-usulu",
  "notes": "Yemek.com 'Pekmezli Ayva Tatlısı', Nefisyemektarifleri 'Ayva Tatlısı Nasıl Yapılır'; pişirme süresi (45 dk yumuşamak için), şerbet sıcaklık (oda sıcaklığında dökme) iki kaynak da onaylıyor. Ayvanın çekirdek yataklarının temizlenmesi step 1, klasik yöntem."
}
```

Notes asgari **40 karakter** + **2 kaynak adı** + **doğrulanan aspekt** (süre/sıcaklık/teknik) + (varsa değişiklik notu).

Genel kabul gören Türk yemek siteleri (yemek.com, nefisyemektarifleri, hurriyet yemek, mutfaksırları), ulusal kasap/şefler (Kenji López-Alt, Harold McGee), uluslararası kaynaklar (Serious Eats, BBC Good Food, Bon Appetit) doğrulama için kullanılabilir.

**Sınır**: Wikipedia tek kaynak yeterli değil (genel referans olabilir, spesifik tarif için ikincil kaynak gerekli).

#### 4. **Doğruluk > yaratıcılık**

Tarif **doğru pişme** üretmeli. Sürelerde, sıcaklıklarda, miktarlarda hata yapma:
- Sıcaklık: 180°C fırın, kısık ateş, kızgın yağ 170°C ↔ kaynaklara göre tutarlı
- Süre: 10 dk haşlama, 1 saat dinlendirme ↔ kaynaklara göre, sallayan değil
- Miktar: 1 su bardağı ≈ 200 ml, 1 tatlı kaşığı ≈ 5 ml ↔ Türk standart ölçü

Şüphede kaldığında **somut sayı yazma yerine "kıvam alana kadar"**. Ama "kıvam alana kadar" tek başına muğlak (§15.7.3); bu yüzden somut sayı + görsel sinyal birleşik:
> "10 dakika orta ateşte, mahlep koyu sarı renge dönene kadar kavurun." (süre + sıcaklık + sinyal)

#### 5. **Tatlı / şerbetli tariflerde step 1 ana malzeme aksiyonu (§16.2 oturum 20 ek)**

Tatlı tariflerinde step 1 "şerbet hazırla / taban hazırla / kup hazırla" gibi yan eleman hazırlığı ile başlamamalı. Bu paterndeki tarifler aynı template'i 6-11 tarif arasında paylaşıyor, scaffold smuggling'in yumuşak versiyonu.

❌ YASAK pattern (Retrofit-15 v1'de tespit edildi):
```
"[TARIFADI] şerbeti için su, şeker ve pekmezi ayrı kapta karıştırıp hazır tutun."  ← 11 tarif aynı
"[TARIFADI] Kup tabanı için tencereye alın, şeker ve kuru malzemeyi soğukken çırpın."  ← 6 tarif aynı
"[TARIFADI] Kup için lokmalık hazırlayın ve fazla nemini peçeteyle alın."  ← 3 tarif aynı
```

Bu cümleler şerbet veya taban malzemesi karıştırmasını step 1'e iter, gerçek tarifin başlangıç akışıyla ilgisi yoktur.

✅ DOĞRU pattern (gerçek tatlı tarif akışı):
```
"Cevizleri iri kırın ve karıştırma kabına alın."
"Sütü 85°C'ye ısıtıp şekeri çözdürün."
"Yumurta beyazlarını çırpıcıyla 4 dakika sert tepecik gelene kadar çırpın."
"Hamuru yoğurun ve 30 dakika buzdolabında dinlendirin."
"Ayvaları soyup ikiye bölün, çekirdek yataklarını temizleyin."
```

Şerbet hazırlama klasik tatlı tarifte step 4-5'te (pişerken ya da pişme sonrası) gelir. Mod FA Retrofit-15 revize 2 (15r2) için bu kural sıkı uygulanır.

**Doğrulama metriği**: aynı template'i (kelimesi kelimesine) ≥6 tarif paylaşıyorsa scaffold sayılır, FAIL.

### 16.3 Self-check (teslim öncesi 9 bash, §15.9 + Kural 17 + ek)

Mod F bash'lerin hepsi koşar **ve ek**:

```bash
# Suffix freq Kural 17 (top freq <=10 PASS)
node -e "
const j = JSON.parse(require('fs').readFileSync('docs/retrofit-step-count-N-revize.json'));
const freq = {};
j.forEach(r => {
  const suffix = r.newSteps[0].instruction.split(' ').slice(3).join(' ');
  freq[suffix] = (freq[suffix]||0) + 1;
});
const top = Object.entries(freq).sort((a,b)=>b[1]-a[1])[0];
if (top && top[1] > 10) { console.log('FAIL scaffold', top[1]+'x:', top[0].slice(0,80)); process.exit(1) }
console.log('PASS suffix doğal');
"

# Notes minimum 40 char + en az 2 kaynak adı (Mod FA spesifik)
node -e "
const j = JSON.parse(require('fs').readFileSync('docs/retrofit-step-count-N-revize.json'));
const fails = j.filter(r => !r.notes || r.notes.length < 40);
if (fails.length > 0) { console.log('FAIL notes eksik/<40 char:', fails.length); process.exit(1) }
const noSource = j.filter(r => !/[A-ZÇĞİÖŞÜ][a-zçğıöşü]+(\.com|\.net| veya | ve )/.test(r.notes));
if (noSource.length > 5) { console.log('WARN notes kaynak sinyali zayıf:', noSource.length); }
console.log('PASS notes 40+ char hepsi dolu');
"
```

### 16.4 Çıktı

`docs/retrofit-step-count-N-revize.json` (yeni dosya, orijinal `retrofit-step-count-N.json` silmez). Schema **aynı** (slug + type + originalStepCount + newSteps + notes). Apply pipeline aynı (`scripts/apply-retrofit.ts --file docs/retrofit-step-count-N-revize.json --apply [--confirm-prod]`).

### 16.5 Sıra ve hedef

Mevcut **revize bekleyen 4 batch**:

| Batch | Type | Slug sayısı | Eski suffix freq |
|---|---|---|---|
| **Retrofit-12 revize** | SALATA 100 | 100 | 27x scaffold |
| **Retrofit-13 revize** | SALATA+TATLI 100 | 100 | 33x scaffold |
| **Retrofit-14 revize** | TATLI 100 | 100 | 10x sınır |
| **Retrofit-15 revize** | TATLI 100 | 100 | 15x scaffold |

Sıra: Kerem tetikler. **Retrofit-12 revize → 13 → 14 → 15** mantıklı (en kötü ihlalden başla).

### 16.6 Tek satırda Mod FA akışı

```
Kerem: "Mod FA. Retrofit-12 revize"
  ↓
Codex: brief §15 + §16 + docs/retrofit-step-count-12.json (eski) okur
  ↓
Codex: aynı 100 slug listesi, sıfırdan tarif-spesifik step yaz
  ↓
Codex: her tarif için 1+ web kaynak doğrula, notes detaylı yaz
  ↓
Codex: 15 self-check (Mod F 9 + Kural 17 + Mod FA 5) PASS
  ↓
Codex: docs/retrofit-step-count-12-revize.json teslim
  ↓
Claude: dry-run + bağımsız audit + suffix freq check
  ↓
Claude: dev apply (Recipe.steps üzerine yazar, eski Mod F step'leri yenilenir)
  ↓
Claude: audit-deep PASS doğrula
  ↓
Claude: prod apply --confirm-prod
  ↓
Claude: commit + push, FUTURE_PLANS Retrofit-N revize tamam işaretle
```

4 batch (12r/13r/14r/15r) sonrası 400 tarif scaffold'dan arındırılmış olur. **Mod FA pipeline kapanır.**

---

## 17. Mod G, tipNote + servingSuggestion BOILERPLATE → tarif-özgü revize (oturum 21)

### 17.1 Hedef

Mod A teslimleri zamanla `tipNote` ve `servingSuggestion` alanlarını
DOLDURDU (%100 coverage). Ama **kalite homojen değil**: ~417 tarifte
generic boilerplate cümleler tekrarlanıyor:

- `"Soğuk servis edin."` → 105 tarif
- `"Sıcak servis edin."` → 96 tarif
- `"Ilık servis edin."` → 63 tarif
- `"Pişmeye başlamadan önce tüm malzemeleri doğrayıp tezgahta dizmek tat dengesini bozmadan akışı korur."` → 8 tarif (tip)
- `"Taze dilimlenmiş ekmek ve yanında mevsim yeşillikleriyle derin tabakta verin."` → 18 tarif
- ... (5+ kullanım eşiği üstü tüm boilerplate'ler)

Bu cümleler "doğru ama bilgi vermez" tipinde. Bir muhallebi tarifinde
"Soğuk servis edin." otomatik anlaşılır, kullanıcıya değer katmaz.
Mod G hedefi: **boilerplate'leri tarif-özgü cümleyle değiştirmek**.

**ÖNEMLİ İLKE (Kerem direktifi)**: Her tarife yeni cümle yazılmaz;
**sadece tarifin gerçek içeriğine UYGUN, tarif-özgü cümle anlam**
**katacaksa** yazılır. Tarif gerçeği bozmaması, yanlış bilgi vermemesi
şart. Generic doğru cümle, tarife uymayan "renkli" cümleden iyidir.

### 17.2 Input + Output

**Input dosyası**: `docs/mod-g-boilerplate-slugs.txt`
- Her satır: `slug \t title \t flags` (TIP veya SUG veya TIP,SUG)
- audit-tipnote-coverage.ts üretir, oturum başına 1 kez koşturulur

**Output JSON**: `docs/mod-g-batch-NN.json`
```json
[
  {
    "slug": "tahin-pekmez-bazlama-tostu-konya-usulu",
    "tipNote": "Tahini erken karıştırmak pekmezin akıcılığını korur, hamur fazla yapışmaz.",
    "servingSuggestion": "Bazlamayı kalın dilimleyip yan tarafa bir bardak demli çay ve bir kaşık tereyağı koyun."
  },
  {
    "slug": "lorlu-patatesli-firin-borek-eskisehir-usulu",
    "tipNote": null,
    "servingSuggestion": "Sıcakken üstüne çörek otu serpip yanına bir kase soğuk yoğurt ve naneli ezme ile tabağa alın."
  }
]
```

- Sadece değiştirilecek alan (`tipNote` veya `servingSuggestion`) yer alır
- `null` = mevcut kalır (sadece bir alan revize ediliyorsa)
- Tarif başka alanlarına dokunulmaz

### 17.3 Kalite kuralları (ZORUNLU)

**1. Tarif-özgü kelime referansı (en az bir):**
   - Tarif başlığında geçen ana malzeme adı (örn. "tahin", "patates")
   - Pişirme yöntemi (örn. "fırın", "ızgara", "kavurma")
   - Bölgesel/kültürel referans (örn. "Konya", "İftar sofrası")
   - Servis bağlamı (örn. "demli çay", "ayran", "limon dilimi")

**2. Minimum kelime sayısı:**
   - tipNote: ≥ 8 kelime (somut ipucu)
   - servingSuggestion: ≥ 8 kelime (somut servis sahnesi)
   - "Soğuk servis edin." (3 kelime) → REJECT

**3. Maksimum kelime sayısı:**
   - tipNote: ≤ 25 kelime (tek cümle)
   - servingSuggestion: ≤ 30 kelime (tek-iki cümle)

**4. YASAK kalıplar:**
   - Generic "...servis edin." başlangıcı (tek başına)
   - "Yanına ... ile ikram edebilirsiniz." (uzatma cümlesi)
   - "Misafirleriniz çok sevecek." (subjective satış cümlesi)
   - "Mutlaka deneyin." (komut)
   - "Çok kolay!" (yargı)
   - Em-dash (—)

**5. Doğruluk (kritik):**
   - Tarifin GERÇEK ingredient + step listesine bak
   - Cümlede geçen yan-malzeme listede yoksa YAZMA (örn. "yanına nar dilimi"
     ekleme, eğer tarif nar içermiyorsa)
   - Pişirme yöntemini (fırın/ocak/buğulama) tarifin step'lerinden teyit et
   - Bölgesel referans tarif başlığındaki yöre ile uyumlu olmalı
     (Konya tarifi → Mardin referansı YASAK)
   - **İPUCU UYDURMA YASAK** (tipNote için en kritik): yazılan ipucunun
     gerçekten o tarifte işe yaradığından **WEB ARAŞTIRMASIYLA EMİN OL**.
     "Bademi fazla koyu çekmemek macun gibi sertleşmesini önler" gibi
     spesifik bir ipucu söyleyeceksen Serious Eats / Cook's Illustrated /
     yemek.com / nefisyemektarifleri / ilgili yöre kültür sitesi gibi
     kaynaktan teyit et. Kafadan "salla" tipinde sözde-bilim cümleleri
     YASAK (örn. "Yoğurdu ters çevirip karıştırın, daha kremalı olur"
     anlamsız). Şüpheliysen tipNote yazma; servingSuggestion'a
     odaklan (servis daha az tehlikeli alan).

**6. Boilerplate engelleyici:**
   - Aynı cümleyi iki tarif için kullanma (slug bazlı unique)
   - "Soğuk/Sıcak/Ilık servis edin" 3-4 kelime YASAK
   - Önceki batch'lerde kullanılan boilerplate'leri tekrar etme

**7. tipNote vs servingSuggestion ayrımı:**
   - **tipNote** = pişirme sırasında kullanıcıya bilim/teknik ipucu
     (örn. "Bademi fazla koyu çekmemek macun gibi sertleşmesini önler.")
   - **servingSuggestion** = tabağa ne ekleyip nasıl servis edileceği
     (örn. "Tabağı tahta zemine alıp yanına ince dilimlenmiş limon koyun.")
   - İki alan farklı amaç, karıştırma

**8. Anlaşılır dil (Kerem direktifi, oturum 21):**
   - Cümle **günlük TR mutfak konuşması** olmalı, akademik/teknik
     jargon kullanma. Kullanıcı yemek yapmaya yeni başlıyor olabilir.
   - YASAK kelime örnekleri: "emülsiyon", "denatüre", "karamelizasyon"
     (kavurma de), "polifenol", "viskozite" (kıvam de), "uçucu yağ"
     (aroma de), "Maillard" (kahverengileşme de), "denitrifikasyon"...
   - Akıcı pratik anlatım: "tencere kapağını sıkı kapat, buhar çıkmasın"
     ✅ vs. "kapalı sistemde basınç kontrolü sağla" ❌
   - Cümle yüksek sesle okunduğunda doğal mı? (Kerem heuristik testi:
     Türk teyzeden duyabileceğin tarz mı?)

### 17.4 Pipeline (Claude apply, oturum 22 güncel)

```
Kerem: "Mod G. Batch N" tetik (Claude'a)
  ↓
Claude: scripts/prepare-mod-g-input.ts --batch N --size 100 --offset M
        koşar. docs/mod-g-batch-N-input.json üretir (her slug için
        DB'den mevcut tipNote/sug + ingredient (12 örnek) + step
        (8 örnek) + cuisine + categorySlug + type çekilir).
  ↓
Kerem: ChatGPT Max'ta yeni chat aç. docs/CODEX_NEW_CHAT_INTRO.md'deki
       başlangıç mesajını paste eder. Codex "Anladım" der. Sonra
       Mod G tetik şablonunu (intro doc'unun §3) paste eder.
  ↓
Codex: docs/mod-g-batch-N-input.json'u okur (aynı klasör, lokal disk),
       brief §17.3 + §17.5 disiplin ile her tarif için tarif-özgü
       tipNote/servingSuggestion yazar. WEB TEYIT zorunlu (tipNote
       için). Anlaşılır dil (jargon yasak).
  ↓
Codex: docs/mod-g-batch-N.json yazar (lokal disk'e). Self-check 7
       madde PASS bildirir.
  ↓
Claude: scripts/apply-mod-g.ts --file docs/mod-g-batch-N.json (dry-run)
  ↓
Claude: --apply dev, audit-deep PASS doğrula
  ↓
Claude: --apply --confirm-prod
  ↓
Claude: commit + push, FUTURE_PLANS Mod G N tamam işaretle
```

**Önkoşul not:** prepare-mod-g-input.ts'in DB içeriğini Codex'e
göndermesi gerek; körlemesine slug listesi yetmez (oturum 21 brief
§17.3 madde 5 doğruluk kuralı). Codex tarif gerçeğine UYGUN cümle
yazmak için ingredient + step listesini görmeli.

### 17.5 Self-check (Codex teslim öncesi)

1. **Boilerplate engellemesi**: Hiçbir cümle 5+ tarif için tekrar
   etmemeli (`uniq` ile kontrol).
2. **Kelime sayısı**: Her tipNote 8-25, her servingSuggestion 8-30.
3. **Tarif-özgü ref**: Her cümle slug/title'da geçen en az bir
   anahtar kelimeyi içeriyor (manuel spot check 10 örnek).
4. **Em-dash**: 0 (— U+2014).
5. **Yan-malzeme yanlışı**: Cümlede geçen ingredient gerçek listede
   var mı (10 örnek manuel kontrol).
6. **Web kaynak teyidi (tipNote için ZORUNLU)**: Her tipNote ipucu
   için "bu gerçek mi?" kontrol et — Serious Eats / Cook's Illustrated
   / yemek.com / nefisyemektarifleri / yöre kültür sitesi. Sözde-bilim
   uydurma ipucu YASAK. Şüpheliysen tipNote yazma, sadece
   servingSuggestion revize et.
7. **Anlaşılır dil**: Akademik/teknik jargon yok (emülsiyon, Maillard,
   polifenol, viskozite vb.). Türk teyzeden duyabileceğin günlük
   mutfak Türkçesi.

### 17.6 Beklenen output

- 4-5 batch × 100 tarif = 400-500 tarif revize, ~417 boilerplate
  tarif tamam (oturum 21'de tespit edilen sayı)
- Her tarifin tipNote + servingSuggestion'ı tarif-özgü, anlam katar
- Tarifin gerçeğine UYGUN (yanlış malzeme/yöntem yok)
- Site açılışı öncesi son kalite katmanı

---

## 18. Mod H, Ingredient enrichment - "neden + yerine" (oturum 21)

### 18.1 Hedef

Tarifle'nin AI Asistan v5 + tarif detay sayfasında ingredient hover/
click ile "kuş üzümün yok mu? kuru üzüm kullan" tipi öneriler için
veri katmanı kuruyoruz. Codex Mod H, **top 50 ingredient** için
"neden bu malzeme + yerine ne kullanılabilir" notları yazar.

İlk batch: top 50 frequency ingredient (zeytinyağı, su, tereyağı,
soğan, un, yumurta, tuz, süt, sarımsak, limon suyu, yoğurt, şeker,
domates, patates, pirinç, buz, maydanoz, dana kıyma, karabiber, ceviz,
bal, dereotu, toz şeker, soya sosu, tarçın, sıvı yağ, krema, haşlanmış
nohut, domates salçası, havuç, kimyon, kuru soğan, nane, ince bulgur,
tavuk göğsü, lime suyu, lor peyniri, kabak, beyaz peynir, tahin, pul
biber, domates püresi, taze soğan, yeşil biber, irmik, mantar, tavuk
but, salatalık, susam, soda).

İkinci batch onayı sonrası top 51-100 ile devam edilir.

### 18.2 Input + Output

**Input dosyası**: `docs/mod-h-ingredient-list.txt`
- Her satır: `rank \t freq \t name \t sample_slugs (3 örnek)`
- audit-mod-h-prep.ts üretir, oturum başına 1 kez koşturulur

**Output JSON**: `docs/mod-h-batch-NN.json`
```json
[
  {
    "name": "Kuş üzümü",
    "whyUsed": "Pilav, dolma ve gülaç gibi tatlımsı tariflerde küçük tatlı topakçıklar olarak kullanılır, sulu yapıyla birlikte yumuşar.",
    "substitutes": ["kuru üzüm", "kuş kirazı", "kuru vişne", "kayısı"],
    "notes": "Pilavda 1 yemek kaşığı yeter; aşırı kullanırsan tatlılık baskın olur."
  },
  {
    "name": "Tahin",
    "whyUsed": "Susamdan ezilmiş ezme, humus ve helva gibi tariflerin temelinde yağlı, hafif acımsı bir yoğunluk verir.",
    "substitutes": ["fındık ezmesi", "yer fıstığı ezmesi", "badem ezmesi"],
    "notes": null
  }
]
```

- `name` = standart Türkçe ad (NutritionData ile aynı yazılım tercih)
- `whyUsed` = 1-2 cümle, mutlaka tarif kullanım gerekçesi
- `substitutes` = 2-4 alternatif (en yakından en uzağa)
- `notes` = opsiyonel ek uyarı (oran, sıcaklık, vb.)

### 18.3 Kalite kuralları (ZORUNLU)

**1. Anlaşılır dil (Mod G ile aynı disiplin):**
   - Cümle **günlük TR mutfak konuşması** olmalı
   - YASAK kelime: "emülsiyon", "denatüre", "karamelizasyon", "polifenol",
     "viskozite", "uçucu yağ", "Maillard", "denitrifikasyon", "hidrasyon",
     "antioksidan", "kapsaisin", "flavonoid"
   - apply-mod-h.ts script bu kelimelerden birini bulursa ERROR atar
   - Türk teyze heuristic: "kullanıcı yemek yapmaya yeni başlıyor olabilir"

**2. Web kaynak teyit (whyUsed + substitutes için):**
   - Her ingredient için "neden bu malzeme" gerekçesi WEB ARAŞTIRMA
     ile teyit edilir (Serious Eats, Cook's Illustrated, BBC Food,
     yemek.com, Wikipedia food article)
   - Substitute önerileri **gerçekten işe yarayan alternatif olmalı**
     (örn. "tahini yerine bal" YASAK — yağlı vs sıvı, tarif bozulur)
   - Substitute sırası: en yakın → en uzak (ilki tipik standart alternatif)

**3. Kelime sayısı:**
   - whyUsed: 8-40 kelime (1-2 cümle)
   - notes: 8-40 kelime (opsiyonel)
   - substitute her biri: 1-8 kelime ("kuru üzüm" ✅, "tarçın benzeri
     ama biraz daha keskin aromalı kekik" ❌ uzun)

**4. Substitute count:**
   - Min 2, max 4 alternatif
   - Tek alternatif yetmez (kullanıcıya seçenek sunmuyor)
   - 5+ alternatif fazla (karar vermesi zor)
   - Format: düz string array `["alt1", "alt2", "alt3"]`
   - İçinde parantez ile küçük not OK: `["kuru üzüm (en yakın)", "vişne"]`

**5. Tarif-bağlamı zorunlu:**
   - whyUsed cümlesinde **bu malzemeyi içeren bir tarif tipine** referans
     ver (örn. "Pilav, dolma ve gülaç gibi tariflerde...")
   - Genel kimya açıklaması YASAK (örn. "Şeker karbonhidrat içerir,
     enerji kaynağıdır" — bu ders kitabı, mutfak değil)

**6. YASAK kalıplar:**
   - "Mutlaka kullan." (komut)
   - "Tarifin olmazsa olmazı." (subjective)
   - "Sağlık için harika." (sağlık iddiası)
   - "Bilmediğin bir şey öğrenmek ister misin?" (filler)
   - Em-dash (—)

**7. Boilerplate engelleyici:**
   - Aynı whyUsed cümlesini iki ingredient için kullanma
   - Aynı substitutes array (örn. ["A", "B", "C"]) birden fazla
     ingredient'ta tekrar etmesin

### 18.4 Pipeline (Claude apply, oturum 22 güncel)

```
Kerem: "Mod H. Batch N" tetik (Claude'a)
  ↓
Claude: scripts/prepare-mod-h-input.ts --batch N --size 50 --offset M
        koşar. docs/mod-h-batch-N-input.json üretir (her ingredient
        için sample tarif slug + tarif tipi dağılımı + frequency +
        NutritionData eşleşmesi DB'den çekilir).
  ↓
Kerem: ChatGPT Max'ta yeni chat aç. docs/CODEX_NEW_CHAT_INTRO.md'deki
       başlangıç mesajını paste eder. Codex "Anladım" der. Sonra
       Mod H tetik şablonunu (intro doc'unun §4) paste eder.
  ↓
Codex: docs/mod-h-batch-N-input.json'u okur (aynı klasör, lokal disk),
       brief §18.3 + §18.5 disiplin ile her ingredient için whyUsed
       (8-40 kelime, tarif tipi referanslı) + substitutes (2-4) +
       opsiyonel notes yazar. WEB TEYIT ZORUNLU (gerekçe için).
       Anlaşılır dil (jargon yasak listesi otomatik kontrol).
  ↓
Codex: docs/mod-h-batch-N.json yazar (lokal disk'e). Self-check 8
       madde PASS bildirir.
  ↓
Claude: scripts/apply-mod-h.ts --file docs/mod-h-batch-N.json --batch N (dry-run)
  ↓
Claude: --apply dev, sema + kalite validate PASS dogrula
  ↓
Claude: --apply --confirm-prod
  ↓
Claude: commit + push, FUTURE_PLANS Mod H N tamam isaretle
```

**Önkoşul not:** prepare-mod-h-input.ts'in tarif tipi dağılımını
Codex'e göndermesi gerek. Codex whyUsed cümlesinde tarif tipi
referansı verecek (brief §18.3 madde 5: "Pilav, dolma ve gülaç gibi
tariflerde..."), bu yüzden hangi tarif tipinde geçtiğini bilmesi
şart.

### 18.5 Self-check (Codex teslim öncesi)

1. **Anlaşılır dil**: Her whyUsed + notes günlük TR mutfak dili.
   Yasak jargon listesi (apply-mod-h.ts otomatik kontrol).
2. **Web teyit**: Her ingredient için web kaynağından doğrula.
   Sözde-bilim YASAK.
3. **Kelime sayısı**: whyUsed 8-40, notes 8-40, substitute 1-8.
4. **Substitute count**: 2-4 alternatif (Min 2, max 4).
5. **Tarif-bağlamı**: whyUsed'da en az bir tarif tipi referansı.
6. **Boilerplate engelleyici**: Aynı whyUsed cümlesi tek ingredient'ta.
7. **Em-dash**: 0 (— U+2014).
8. **Substitute makullük**: Her alternatif gerçekten o ingredient'ın
   yerine geçer (oran/yöntem benzer).

### 18.6 Beklenen output

- **Batch 1**: top 50 ingredient (oturum 21 prep, mevcut)
- **Batch 2-3** (opsiyonel, launch sonrası): top 51-150 ingredient
- AI Asistan v5 backend hazır (gelecek geliştirme)
- Tarif detay sayfasında ingredient hover/click → "yerine X kullan"
  öneri popover (UI ayrı pass)
- IngredientGuide tablosu (ayrı tablo, schema migration
  20260426060000_ingredient_guide ile dev + prod hazır)

### 18.7 Schema referans

`prisma/schema.prisma` `IngredientGuide` model:
```prisma
model IngredientGuide {
  id          String   @id @default(cuid())
  name        String   @unique @db.VarChar(200)
  whyUsed     String   @db.VarChar(500)
  substitutes Json     // string[]
  notes       String?  @db.VarChar(500)
  source      String?  @db.VarChar(100)  // "Mod H Batch N"
  updatedAt   DateTime @updatedAt
  @@map("ingredient_guides")
}
```

Apply script `apply-mod-h.ts` upsert by `name` (mevcut update, yoksa
create). Source tag `"Mod H Batch N"` her teslim için işaretlenir.

## 19. Mod M, Marine süresi ekleme (oturum 23 sonu hazır, 24+ aktif)

### 19.1 Hedef

Tarifle kataloğunda marine içeren tariflerde **doğru bekleme süresini**
modellemek. Aday tespiti yapıldı (`scripts/find-marine-candidates.ts`,
14 keyword: marine, marina, marinasyon, salamura, soslama, terbiye,
marinade, yoğurtla bekletin, sirke ile bekletin vb.). 167 tarif
adayında çoğunda marine süresi eksik veya 0 (yalnız 15'inde wait
modellenmiş).

Apply sonrası `recipe.totalMinutes = prep + cook + marineMinutes`
hesaplanır, RecipeTimeline `Hazırlık | Bekleme/Marine | Pişirme`
3 segment görünür hale gelir (Sauerbraten 3 gün marine demo gibi
~120-150 tarif).

### 19.2 Input + Output

**Input dosyası**: `docs/mod-m-candidates.md`
- 167 marine adayı, batch sırası: time pattern olanlar +
  alreadyHasWaitTime=false üstte
- Her aday: slug, title, cuisine, type, prep + cook + total + wait,
  marine ile eşleşen field (description / step / tipNote)

**Output JSON**: `docs/mod-m-batch-N.json` (batch numarası 1-4)

```json
[
  {
    "slug": "tavuk-sis",
    "marineMinutes": 240,
    "marineDescription": "Yoğurt + zeytinyağı + baharat marine, en az 4 saat",
    "tipNote_addition": "Marine süresini en az 4 saat tutun; bir gece bekletmek ekstra yumuşatır.",
    "sources": [
      "https://www.example.com/tavuk-sis-tr",
      "https://yemek.com/tarif/tavuk-sis"
    ],
    "confidence": "high",
    "reason": "Source A 3-4h, Source B 4-6h. 4 saat bilinen ortalama."
  },
  {
    "slug": "menemen",
    "classification": "SKIP",
    "reason": "Menemen marine içermez, audit script keyword false positive."
  }
]
```

**Field açıklamaları:**

- `slug` (zorunlu): aday tarifin canonical slug'u, mod-m-candidates.md'den
- `marineMinutes` (zorunlu, SKIP değilse): tam marine bekleme süresi
  dakika cinsinden (240 = 4 saat, 1440 = 24 saat = 1 gün, 4320 = 3 gün).
  Range: 5 ≤ x ≤ 10080 (7 gün, schema cap). Sadece marine süresi,
  prep/cook'a EK olarak hesaplanır
- `marineDescription` (opsiyonel): kısa Türkçe (20-200 char) marine açıklama,
  RecipeTimeline tooltip için ileride kullanılabilir
- `tipNote_addition` (opsiyonel): mevcut tipNote'a EKLENECEK marine notu
  (max 240 char). Apply pipeline mevcut tipNote ile " " ile birleştirir,
  zaten içindeyse tekrarlamaz (idempotent)
- `sources` (zorunlu, SKIP değilse): tam URL listesi, **en az 2 farklı
  domain** (aynı sitenin farklı sayfaları sayılmaz)
- `confidence` (zorunlu, SKIP değilse): "high" (2 kaynak net aynı süre),
  "medium" (kaynaklar arası fark var, ortalama alındı), "low"
  (1 net kaynak + 1 dolaylı, yakın takip)
- `reason` (zorunlu): Türkçe kısa gerekçe (20-400 char)
- `classification` (sadece SKIP için): "SKIP" işareti, marineMinutes/sources
  gereksiz

### 19.3 Kalite kuralları (ZORUNLU)

**1. Doğruluk öncelik (halüsinasyon yasak):**
   - Her tarif için **minimum 2 farklı web domain** zorunlu
   - Aynı sitenin farklı URL'leri sayılmaz (serious eats × 2 ❌;
     serious eats + bbc good food ✓)
   - Genel ifadeler yerine kaynaktan spesifik süre alıntıla
     ("genelde 4-6 saat" ❌; "Source A 4h, Source B 6h, ortalama 5h" ✓)
   - Kaynak yetersiz veya emin değilseniz: classification "SKIP",
     marineMinutes 0, reason zorunlu

**2. Güvenilir kaynak öncelikli:**
   - Profesyonel cooking sites: Serious Eats, BBC Good Food, NYT
     Cooking, Food52, Bon Appétit, America's Test Kitchen, Cook's
     Illustrated
   - Ulusal mutfak referansları: TR için Yemek.com, Nefis Yemek
     Tarifleri (cross-validate); İtalyan için Giallo Zafferano,
     Hint için Tarla Dalal, Japon için Just One Cookbook, Kore
     için Maangchi
   - Wikipedia (özellikle uluslararası tarifler için temel kaynak)
   - Kitap referansı (Mark Bittman How to Cook, Julia Child,
     Ottolenghi)

**3. marineMinutes range:**
   - Minimum 5 dk (kısa quick marine, örn. balık üzerine limon)
   - Maximum 10080 dk (7 gün, schema cap)
   - Tipik aralıklar: 30 dk (hızlı), 240 dk = 4 saat (standart),
     480 dk = 8 saat (overnight), 1440 dk = 24 saat (gün), 4320 dk
     = 3 gün (Sauerbraten gibi)
   - apply-mod-m-batch.ts script `prep + cook + marineMinutes >
     10080` ise BLOCKED atar

**4. Anlaşılır dil (Mod G/H ile aynı disiplin):**
   - marineDescription + tipNote_addition + reason **günlük TR mutfak
     konuşması** olmalı
   - YASAK kelime: "emülsiyon", "denatüre", "karamelizasyon",
     "polifenol", "viskozite", "uçucu yağ", "Maillard", "denitrifikasyon",
     "hidrasyon", "antioksidan", "kapsaisin", "flavonoid"
   - "scaled", "hyperscale" tarzı yabancı jargon YASAK

**5. Em-dash karakteri (U+2014) ve en-dash (U+2013) YASAK** (AGENTS.md):
   - marineDescription + tipNote_addition + reason hiçbirinde em-dash
     yok
   - verify-mod-m-pairs.ts script otomatik kontrol eder, em-dash
     bulursa BLOCKED

**6. SKIP disiplini:**
   - Marine içermeyen veya kaynak yetersiz tarifler için classification
     "SKIP" işaretle, sahte veri yazma
   - SKIP'lar için marineMinutes/sources/confidence gereksiz, sadece
     reason zorunlu (min 20 char açıklama)

**7. Türkçe karakter ZORUNLU (oturum 24 sonu, Batch 1-3 dersi):**
   - tipNote_addition + marineDescription + reason hepsinde
     Türkçe karakterler (ç, ğ, ı, ö, ş, ü, Ç, Ğ, İ, Ö, Ş, Ü)
     **doğru kullanılmalı**
   - ASCII fold YASAK: "yumusatir" yerine "yumuşatır", "tavugu"
     yerine "tavuğu", "kalir" yerine "kalır"
   - Sebep: Mod M Batch 1-3 teslimlerinde 52/57 entry'de tipNote_
     addition ASCII-only geldi (Tavugu/yogurtlu/sarimsak), kullanıcıya
     gözüken metinde Türkçe doğal akmadı. Karışık metin (mevcut TR +
     ASCII Codex) çirkin görünüyor
   - Codex JSON output'unda Türkçe karakter UTF-8 olarak yaz, kaçış
     yapma

**8. Redundancy yasağı (oturum 24 sonu, Batch 1-3 dersi):**
   - tipNote_addition mevcut tipNote ile **içerik tekrarı yapmasın**
   - Mevcut tipNote zaten "marine süresi 30 dk" diyorsa, addition
     "30 dakika bekletin" yazma; **YENİ bilgi** ekle: yöntem detayı
     ("yoğurda biraz yağ ekleyin"), tat profili ("acı biber tonunu
     dengeler"), alternatif marine ("aceleyse 30 dk, ideal 4 saat")
   - Mevcut tipNote'u Codex apply pipeline öncesi DB'den okuyabilir
     (gerek olursa input JSON'da current_tipNote alanı eklenir)
   - Pratik kontrol: Codex addition yazınca mevcut tipNote'u zihninde
     birleştir; "ikisi aynı şeyi söylüyor mu?" diye sor. Aynı ise
     yeniden yaz

### 19.4 Pipeline (Claude apply, oturum 23 hazır)

Codex teslim sonrası Claude tarafı:

1. **Verify** (BLOCKED entry varsa apply yapılmaz):
   ```
   npx tsx scripts/verify-mod-m-pairs.ts --batch 1
   ```
   Çıktı: `docs/mod-m-verify-report.md` markdown rapor + console summary
   (apply clean sayısı, high/medium/low dağılımı, SKIP, BLOCKED).

2. **Kullanıcı onay** (özet sun):
   - Apply clean count + high/medium/low confidence dağılımı
   - SKIP listesi (Codex gerekçesi makul mu)
   - BLOCKED varsa ayrıntı (Codex'e geri bildirim)

3. **Dev apply** (idempotent + DB transaction):
   ```
   npx tsx scripts/apply-mod-m-batch.ts --batch 1 --apply
   ```
   Her entry için: `recipe.totalMinutes` update + `tipNote` merge +
   `AuditLog action=MARINE_APPLY` metadata (sources + confidence + reason).

4. **Smoke test**: Sauerbraten + 3 random marine'li tarif 200 OK +
   RecipeTimeline 3-segment görsel doğrulama (preview anasayfa).

5. **Prod apply** (db-env.ts guard + --confirm-prod zorunlu):
   ```
   npx tsx scripts/apply-mod-m-batch.ts --batch 1 --apply --confirm-prod
   ```

6. **Sentry watch** 24h: marine apply sonrası performans regression
   var mı kontrol.

Source seed-recipes.ts senkronu ayrı bir iştir (Mod I/IB pattern'iyle
sonradan, totalMinutes + tipNote source'a yansımalı).

### 19.5 Self-check (Codex teslim öncesi)

1. **Sources count**: Her non-SKIP entry için >= 2 farklı domain.
2. **Marine range**: 5 ≤ marineMinutes ≤ 10080.
3. **Confidence**: "high" / "medium" / "low" değerlerinden biri.
4. **Reason**: 20-400 char, gerçek alıntı veya açıklama.
5. **SKIP disiplini**: classification="SKIP" ise reason zorunlu,
   marineMinutes=0 veya yok, sources gereksiz.
6. **Em-dash**: 0 (— U+2014, – U+2013) tüm string field'larda.
7. **Anlaşılır dil**: jargon yasak listesi (Mod G/H ile aynı).
8. **Slug evren**: docs/mod-m-candidates.md içinde olan slug'lar.
   batch dışı slug yazma.
9. **Batch boyutu**: ~50 entry (Batch 1: ilk 50, Batch 2: 51-100,
   Batch 3: 101-150, Batch 4: 151-167 son 17).
10. **Türkçe karakter**: tipNote_addition + marineDescription + reason
    hepsinde ç/ğ/ı/ö/ş/ü doğru kullanılmış (ASCII fold 0). Spot check:
    "yumuşatır" yazıyorsa OK, "yumusatir" yazıyorsa FAIL.
11. **Redundancy**: tipNote_addition mevcut tipNote ile içerik tekrarı
    yapmıyor. Yeni bilgi (yöntem, tat profili, alternatif süre)
    içermeli. Sadece "X dakika bekletin" tekrarı YASAK.

Bitince "Mod M Batch N hazır" + özet:
- Toplam: 50 (veya batch boyutu)
- Marine eklendi (high): X
- Marine eklendi (medium): Y
- Marine eklendi (low): Z
- SKIP: W

### 19.6 Beklenen output

- **Batch 1**: ilk 50 marine adayı (öncelik: time pattern + already-
  wait-time olmayanlar)
- **Batch 2-3**: sıradaki 50'şer
- **Batch 4**: son ~17
- **Apply sonrası kapanış kriterleri**:
  - 4 batch tamamlandı, verify + apply PASS
  - find-marine-candidates.ts yeniden koşulduğunda total > prep+cook
    olan tarif sayısı 100+ (eskiden 15)
  - RecipeTimeline browser test 3-segment görselli marine'li tariflerde
    doğru render (Sauerbraten patrnı)
  - AuditLog action=MARINE_APPLY 100+ kayıt

## 20. Mod K, Tarif Kontrol (oturum 24 sonu, "Kontrol" K harfinden)

### 20.1 Hedef

Mevcut 3517 tarifin **doğruluk + içerik tutarlılığı + kritik bilgi**
kontrolü. Codex her tarif için web research yapar, mevcut içeriği
gerçek tarifle kıyaslar, **gerçek hata** veya **yanıltıcı bilgi**
varsa düzeltme önerir. Sorun yoksa PASS işaretler.

**Kritik prensip: ŞİŞİRME YASAK.** Kerem net direktif (oturum 24):
tarif description'larını uzatmak kullanıcıyı bunaltır. Mod K hedefi
**zenginlik katmak değil**, **var olan içeriği teyit etmek**.
Description max %20 uzar veya aynı kalır. Yeni "tarihte X yıllık"
gibi süs cümleleri YASAK.

**Mod K kapsamı (TAM CHECK, oturum 24 sonu Kerem net):
HER ALAN dahil):**
- **description**: yanlış köken, yanıltıcı yöntem, hatalı kültürel
  bilgi (örn "Osmanlı'dan kalma" değilse onu yazma)
- **ingredients - kompozisyon**: kritik malzeme eksik mi (örn
  carbonara'da yumurta sarısı), yanlış malzeme yazılmış mı (klasik
  moussaka patlıcanla yapılır, patatesle değil)
- **ingredients - amount**: miktar makul mü (4 kişilik tarif için 1
  kg un absurt, 100 gr çok az), klasikle uyumlu mu
- **ingredients - unit**: birim doğru mu (yk vs tk vs su bardağı vs
  gram), measurement system tutarlı mı
- **steps - sıralama**: yumurta beyazını çırptıktan SONRA un eklersen
  kabarmaz tarzı sıralama hataları
- **steps - sıcaklık + süre**: tavuk göğsü 200°C'de 5 dk kurur
  tarzı yanlış parametreler
- **steps - kritik adım eksikliği**: et mühürleme, marine,
  dinlendirme, beklenen tav (yumurta köpürene kadar)
- **prepMinutes/cookMinutes/totalMinutes**: makul mü (15 dk'da fırın
  kebabı pişmez), birbirinden tutarlı mı
- **servingCount**: tarif sayısıyla amount'lar uyumlu mu (4 kişilik
  yazıyor ama amount 8 kişilik kıvamda)
- **averageCalories**: kalori makul mü (porsiyon başına; tatlı 100
  kcal absurt, salata 800 kcal absurt)
- **protein / carbs / fat (gram)**: macro nutrition tutarlı mı
  (toplam kalori = 4×protein + 4×carbs + 9×fat ≈ averageCalories,
  %20 toleransla; porsiyon başına gram makul mü)
- **tags**: tarif gerçekten o tag'i hak ediyor mu (vegan tag ama
  yumurta var; 30-dakika-alti tag ama totalMinutes 60 dk; yuksek-
  protein tag ama protein 8g sadece); fazla / eksik tag
- **allergens**: declared allergen doğru mu (gluten yazıyor ama un
  yok; sut yazıyor ama tereyağı + süt + krema var ama declare yok)
- **tipNote**: yanlış teknik, jargon, sözde-bilim
- **servingSuggestion**: tutarlı mı, garip eşleştirme yok mu
- **isFeatured**: featured ama içerik zayıf mı (manuel review flag)

**Mod K alt-modlar (gelecek, ihtiyaç olunca):**
- **Mod KA**: Sadece description doğruluk pass'i (hızlı tarama)
- **Mod KB**: Ingredient kompozisyon + amount + unit + step doğruluk
- **Mod KC**: Times + macro nutrition + tags + allergens
- **Mod KD**: tipNote + servingSuggestion + featured manuel
- Mod K (tam) yerine odaklı alt-mod tercih edilebilir

### 20.2 Input + Output

**Input dosyası**: `docs/mod-k-batch-Nx-input.json` (Nx = "1a", "1b",
"2a", "2b" ...)
- Claude `prepare-mod-k-input.ts --batch 1a --size 50` koşturur
- Her tarif için: slug, title, cuisine, type, description,
  ingredients (full list + amount + unit), steps (full list),
  prepMinutes, cookMinutes, totalMinutes, servingCount,
  averageCalories, protein, carbs, fat, tipNote, servingSuggestion,
  tags, allergens, isFeatured
- **50 tarif batch boyutu** (oturum 24 dersi: 100 derinleşmek için
  fazla, 50 odaklı kalır). Sub-batch naming "1a" (ilk 50) + "1b"
  (sıradaki 50) ile Mod A pattern'iyle paralel
- Toplam: 3517 tarif / 50 = ~71 sub-batch (1a-36b)

**Output JSON**: `docs/mod-k-batch-Nx.json` (Nx = "1a", "1b" ...)

```json
[
  {
    "slug": "carbonara",
    "verdict": "PASS",
    "reason": "Klasik Roma carbonara: yumurta + pecorino + guanciale + biber. Macro değerler ve süreler makul, tags + allergens doğru.",
    "sources": [
      "https://www.bonappetit.com/recipe/carbonara",
      "https://www.giallozafferano.it/spaghetti-carbonara"
    ],
    "confidence": "high"
  },
  {
    "slug": "vegan-yumurtali-omlet",
    "verdict": "MAJOR_ISSUE",
    "issues": [
      "tag: 'vegan' yazılı ama tarif yumurta içeriyor; vegan tag yanıltıcı",
      "allergen: 'YUMURTA' declare edilmemiş, ingredient list'te yumurta var"
    ],
    "corrections": {
      "tags_remove": ["vegan"],
      "allergens_add": ["YUMURTA"]
    },
    "sources": [
      "https://www.veganrecipes.com/definition",
      "https://www.fda.gov/food/food-allergens"
    ],
    "confidence": "high",
    "reason": "Vegan tanımı hayvansal ürün içermez, yumurta hayvansal. Tag kaldırılmalı, ayrıca yumurta allergen olarak declare edilmeli."
  },
  {
    "slug": "moussaka",
    "verdict": "CORRECTION",
    "issues": [
      "ingredient: 'patates' yazılı ama klasik Yunan moussaka ana malzeme değil, isteğe bağlı katman",
      "ingredient amount: 'Et 200 gr' yazılı, 6 kişilik için az (klasik 600-800 gr)",
      "step 4: '180°C 30 dk' yazılı ama beşamel sosun üstü için 25 dk + 5 dk grill önerilir",
      "calories: 850 kcal/porsiyon yüksek; klasik moussaka ~550-650 kcal aralığında"
    ],
    "corrections": {
      "ingredients_remove": ["patates"],
      "ingredients_amount_change": [
        { "name": "Dana kıyma", "newAmount": "600", "newUnit": "gr" }
      ],
      "steps_replace": [
        {
          "stepNumber": 4,
          "instruction": "Moussakayı 180°C fırında 25 dakika pişirin, son 5 dakika grill açıp beşamelin üstünü kızartın."
        }
      ],
      "averageCalories": 580,
      "protein": 28,
      "carbs": 18,
      "fat": 38
    },
    "sources": [
      "https://www.bbcgoodfood.com/recipes/moussaka",
      "https://www.seriouseats.com/moussaka-eggplant-greek-recipe"
    ],
    "confidence": "high",
    "reason": "BBC Good Food ve Serious Eats moussaka klasik halini referans alır: patates yok, ana et ~600 gr, kalori ~580 kcal/porsiyon, beşamel + grill bitiş."
  },
  {
    "slug": "menemen",
    "verdict": "MAJOR_ISSUE",
    "issues": [
      "description: 'Türk omleti' yazıyor; menemen ile omlet farklı tariflerdir, yanıltıcı"
    ],
    "corrections": {
      "description": "Menemen, domates ve biberin yumurtayla pişirildiği klasik Türk kahvaltı yemeğidir."
    },
    "sources": [
      "https://www.yemek.com/tarif/menemen-tarifi",
      "https://en.wikipedia.org/wiki/Menemen"
    ],
    "confidence": "high",
    "reason": "Mevcut description menemeni omlet olarak tanımlamış, yanıltıcı. Yumurta birlikte pişer ama menemen ne omlet ne sahanda yumurtadır, ayrı kategori."
  }
]
```

**Field açıklamaları:**

- `slug` (zorunlu): input'taki tarif slug'u
- `verdict` (zorunlu): "PASS" / "CORRECTION" / "MAJOR_ISSUE"
  - PASS: tarif doğru, dokunma. Kaynak göster (en az 2),
    1 cümle reason
  - CORRECTION: küçük-orta düzeltme (1-3 alan)
  - MAJOR_ISSUE: yanıltıcı içerik (description yanlış köken,
    yanlış mutfak iddiası, sahte tarihçe). Manuel review zorunlu
- `issues` (CORRECTION + MAJOR_ISSUE): tespit edilen sorunların
  listesi
- `corrections` (CORRECTION + MAJOR_ISSUE), opsiyonel alanlar:
  - `description`: yeni description (max %20 uzar; ŞİŞİRME YASAK)
  - `cuisine`: yeni cuisine kodu (mevcut 30 koddan biri: tr, it,
    fr, es, gr, jp, cn, kr, th, in, mx, us, me, ma, vn, br, cu,
    ru, hu, se, pe, gb, pl, au, de, ir, pk, id, et, ng). Bilinmeyen
    cuisine (örn tn/ar) önermek YASAK; bu durumda description fix
    önerip MAJOR_ISSUE bayrağını manuel review için bırak
  - `ingredients_add`: eklenecek `[{ name, amount, unit, group? }]`
  - `ingredients_remove`: silinecek ingredient adları
  - `ingredients_amount_change`: amount/unit düzeltmesi
    `[{ name, newAmount, newUnit }]` (mevcut name match,
    case-insensitive)
  - `steps_replace`: değişecek `[{ stepNumber, instruction,
    timerSeconds? }]`
  - `tipNote`: yeni tipNote (max %20 uzar)
  - `servingSuggestion`: yeni serving suggestion (max %20 uzar)
  - `prepMinutes` / `cookMinutes` / `totalMinutes`: yeni süre
  - `servingCount`: yeni porsiyon sayısı
  - `averageCalories`: yeni kalori (porsiyon başına)
  - `protein` / `carbs` / `fat`: yeni macro (gram, porsiyon başına)
  - `tags_add`: eklenecek tag enum'lar (15 enum'dan, brief §5)
  - `tags_remove`: silinecek tag enum'lar
  - `allergens_add`: eklenecek allergen enum'lar (Prisma schema'daki 10
    enum: GLUTEN, SUT, YUMURTA, KUSUYEMIS, YER_FISTIGI, SOYA,
    DENIZ_URUNLERI, SUSAM, KEREVIZ, HARDAL). DENIZ_URUNLERI hem balik
    hem kabuklu deniz icindir; KABUKLU_DENIZ/BALIK/FISTIK ayri enum
    YOK
  - `allergens_remove`: silinecek allergen enum'lar (ayni 10 enum'dan)
- `sources` (zorunlu): en az 2 farklı domain (Mod M ile aynı)
- `confidence` (zorunlu): "high" / "medium" / "low"
- `reason` (zorunlu): 50-300 char Türkçe açıklama

### 20.3 Kalite kuralları (ZORUNLU)

**1. ŞİŞİRME YASAK (en kritik kural):**
   - description max **%20** uzar veya aynı uzunluk kalır.
     Yeni description uzunluk(yeni) <= 1.2 × uzunluk(eski) zorunlu
   - tipNote max **%20** uzar veya aynı uzunluk
   - Süs cümle YASAK ("Tarihte X yıllık geleneğin", "Anadolu'nun
     unutulmaz...", "Damaklarda iz bırakan...") — somut bilgi
     olmayan boş cümleler
   - Sadece **gerçek bilgi** ekle, **gerçek hata** düzelt

**2. Web research zorunlu (Mod M ile aynı):**
   - Her tarif için **minimum 2 farklı domain** zorunlu (PASS dahil)
   - Aynı sitenin farklı sayfaları sayılmaz
   - Güvenilir kaynak listesi (Mod M §19.3 ile aynı): Serious Eats,
     BBC Good Food, NYT Cooking, Bon Appetit, ATK, yemek.com,
     nefisyemektarifleri, Giallo Zafferano (İtalyan), Tarla Dalal
     (Hint), Just One Cookbook (Japon), Maangchi (Kore), Wikipedia
   - Halüsinasyon YASAK: "muhtemelen klasik" gibi belirsiz ifade
     yerine kaynak alıntıla

**3. Türkçe karakter ZORUNLU (Mod M Batch 1-3 dersi):**
   - description / tipNote / step instruction / reason hepsinde
     ç, ğ, ı, ö, ş, ü doğru kullanılmalı
   - ASCII fold YASAK ("yumusatir" yerine "yumuşatır")

**4. Em-dash (U+2014) ve en-dash (U+2013) YASAK** (AGENTS.md):
   - Tüm string field'larda 0
   - verify-mod-k script otomatik kontrol

**5. Anlaşılır dil (Mod G/H/M ile aynı):**
   - Yasak jargon: "emülsiyon", "denatüre", "karamelizasyon",
     "polifenol", "viskozite", "Maillard", "antioksidan",
     "kapsaisin", "flavonoid", "uçucu yağ", "hidrasyon"
   - Türk teyze testi: günlük TR mutfak konuşması

**6. Minimum müdahale prensibi:**
   - PASS verdict: kaynak doğrulandı + içerik makul = dokunma
   - Sadece **net hata** veya **kritik eksiklik** için CORRECTION
   - Tarz/uslubı düzeltme YASAK (kötü yazılmış ama doğru
     bilgi = PASS)
   - Beklenti: 100 tarif batch'inde **5-15 CORRECTION + 1-3
     MAJOR_ISSUE + geri kalan PASS** (~%75-85 PASS oranı)

**7. SKIP yok (Mod M'den farklı):**
   - Her tarif için bir verdict zorunlu (PASS minimum)
   - Mod K'de SKIP kategorisi YOKTUR; tarif inceleme dışı bırakılmaz

**8. Slug evren:**
   - docs/mod-k-batch-N-input.json'da gönderilen slug'lar
   - Batch dışı slug yazma

**9. Süre-içerik tutarlılığı (oturum 25, GPT 5 Pro audit):**
   - description ve steps içinde geçen TÜM süreler (örn. "1 saat
     dinlendir", "30 dk fırında pişir", "yarım saat marinaya bırak",
     "buzdolabında 12 saat bekle") totalMinutes'a dahil edilmiş
     OLMALI. Aksi halde tutarsızlık.
   - **GPT örneği**: Adana Kebap "Toplam 50 dk" yazılı, ama steps'te
     "15 dk yoğur + 1 saat dinlendir + 20 dk pişir" = 95 dk. totalMinutes
     50 dk yanıltıcı, "50 dakikada biter" izlenimi.
   - **Çözüm seçenekleri** (CORRECTION):
     a) totalMinutes değerini gerçek toplam yapacak şekilde güncelle
        (15 + 60 + 20 = 95 dk)
     b) prepMinutes/cookMinutes/totalMinutes ayrımı net: aktif süre +
        bekleme süresi (marine, dinlendirme) ayrı segment. Mod M
        marineMinutes alanı zaten DB'de var; uzun bekleme süresi
        marineMinutes'a, totalMinutes prep+cook olarak kalır
     c) Description revize: "Aktif süre 35 dk, dinlendirme 1 saat
        (toplam ~95 dk)" gibi açık ayrım
   - **Codex tarama**: Her tarif için description + steps regex
     `(\d+)\s*(saat|sa|dakika|dk|gün)` ile süre bahsi tespit, totalMinutes
     ile karşılaştır. Fark > %30 ise CORRECTION (totalMinutes veya
     marineMinutes düzelt veya step paragraf revize).
   - **Tip (KRİTİK, oturum 25 RecipeTimeline keşfi)**: Schema'da
     marineMinutes ALANI YOK. Sadece prepMinutes + cookMinutes +
     totalMinutes. RecipeTimeline component (`src/components/recipe/
     RecipeTimeline.tsx`) "bekleme/marine" segmentini ŞÖYLE hesaplar:
     `wait = totalMinutes - (prepMinutes + cookMinutes)`. Yani **marine
     ve dinlendirme süresi prepMinutes'a DAHİL EDİLMEMELİ**, fark
     olarak bırakılmalı. Adana Kebap örneği:
     - YANLIŞ: prep 90 (15 yoğur + 60 marine + 15 hazırlık) + cook 20
       + total 110 → wait 0, RecipeTimeline marine segment görünmez
     - DOĞRU: prep 30 (15 yoğur + 15 hazırlık) + cook 20 + total 110
       → wait 60, RecipeTimeline 3-segment görünür (Hazırlık 30 +
       Bekleme/Marine 60 + Pişirme 20)
     - Sauerbraten 3 gün marine örneği: prep 30 + cook 180 + total
       4500 → wait 4290 (~3 gün), bekleme bar büyük segment
   - **Codex talimatı**: Eğer steps'te "1 saat dinlendir", "12 saat
     marinaya bırak", "buzdolabında 2 saat bekle" gibi pasif bekleme
     süreleri varsa, bu süreler **totalMinutes'a dahil edilir AMA
     prepMinutes/cookMinutes'a DAHİL EDİLMEZ**. RecipeTimeline'in
     wait segmentini hesaplaması için fark gerekli.

**10. Nutrition ingredient-aware anomaly (oturum 25, GPT 5 Pro audit):**
   - Mevcut Kural: 4×protein + 4×carbs + 9×fat ≈ averageCalories
     (%25 toleransla). Bu korunur.
   - **Yeni katman**: Yüksek-yağ ingredient varsa doymuş yağ ratio
     kontrol. **HIGH_FAT_INGREDIENTS** (>%70 yağ): kuyruk yağı,
     tereyağı, zeytinyağı, ay çiçek yağı, mısırözü yağı, hindistan
     cevizi yağı, susam yağı, yer fıstığı yağı, krema (>%30 yağ),
     kaymak (>%60 yağ), badem yağı, ceviz yağı, fındık yağı.
   - **GPT örneği**: Adana Kebap 500g kuzu kıyma + 100g kuyruk yağı
     (~%80 doymuş yağ = 80g doymuş). 4 porsiyon dağıtınca 20g doymuş
     yağ/porsiyon olmalı. Mevcut: porsiyon başına toplam yağ 28g +
     doymuş yağ 0.3g. **Doymuş yağ değeri imkansız**, gerçek değer
     ~20g.
   - **Codex tarama**: Her tarif ingredient list'inde yüksek-yağ
     ingredient var mı kontrol. Varsa ingredient gram × yağ ratio
     kabaca hesap; porsiyon başına yağ tahmini DB averageFat ile
     karşılaştır. Fark > %50 ise CORRECTION (averageCalories +
     protein + carbs + fat revize, doymuş yağ ratio dengeli).
   - **Yağ ratio referansı (TIP)**:
     - Tereyağı: %81 yağ (~%51 doymuş)
     - Kuyruk yağı: %95 yağ (~%80 doymuş)
     - Zeytinyağı: %100 yağ (~%14 doymuş, %73 monoünsat)
     - Ay çiçek yağı: %100 yağ (~%12 doymuş, %20 mono, %66 polyünsat)
     - Krema (%35): %35 yağ (~%22 doymuş)
     - Kaymak: %60 yağ (~%38 doymuş)
   - Tarif macro'larında "fat" toplam yağ; doymuş yağ ayrı alan
     yok ama ratio anomalisi kabaca yakalanır (toplam yağ vs ingredient
     yağ kabaca eşleşmesi).

**11. Step-ingredient miktar eşleşmesi (oturum 25, GPT 5 Pro audit):**
   - Mevcut: pre-push hook bahis kontrolü ("Step 4 mentions 'tuz' but
     ingredient list has no match" warning veriyor).
   - **Yeni katman**: Step'te belirli miktar + birim ile bahsedilen
     ingredient (örn. "2 yemek kaşığı zeytinyağı", "yarım çay bardağı
     süt", "1 tutam karabiber") ingredient list'inde mevcut + benzer
     miktar.
   - **Çözüm**: Step regex parser quantity + unit + name (örn.
     `(\d+|yarım|bir|iki|üç|tutam)\s*(yemek kaşığı|çay kaşığı|su bardağı|gr|kg|adet|tutam)\s+(\w+)`)
     → ingredient list çapraz kontrol. Yoksa:
     a) ingredients_add (step'te bahsedilen miktar + birim ile)
     b) steps_replace (step'i revize, ingredient'ta olan miktarla
        eşleştir)
   - Mod K Batch'lerde: tüm tarifler için step parser çalıştırma
     gerekmez (Codex zaten bütünsel okuma yapar); sadece tutarsızlık
     fark edilirse CORRECTION.
   - **Tip**: Pre-push warning'de tespit edilenler (96 warning, son
     push) Mod K Batch'lerinde MAJOR_ISSUE olarak çözülmeli; basit
     bahis değil miktar tutarlılığı.

### 20.4 Pipeline (Claude apply)

1. **Prep** (her batch öncesi):
   ```
   npx tsx scripts/prepare-mod-k-input.ts --batch N --size 100
   ```
   `docs/mod-k-batch-N-input.json` üretir (slug + full content özet).

2. **Codex tetik**: `Mod K. Batch N.` (CODEX_NEW_CHAT_INTRO Bölüm 6).
   Codex web research yapar, JSON output yazar.

3. **Verify** (read-only):
   ```
   npx tsx scripts/verify-mod-k-batch.ts --batch N
   ```
   Format check (sources >= 2, em-dash 0, TR karakter doğru,
   description max %20 uzar). `docs/mod-k-verify-report.md` üretir.

4. **Manual review** (kullanıcı):
   - PASS sayısı + CORRECTION sayısı + MAJOR_ISSUE sayısı özeti
   - MAJOR_ISSUE'lar tek tek incelenir (yanıltıcı içerik dikkat)
   - CORRECTION'lar gözden geçirilir (cherry-pick olabilir)

5. **Apply** (cherry-pick veya toplu):
   ```
   npx tsx scripts/apply-mod-k-batch.ts --batch N --apply              # dev
   npx tsx scripts/apply-mod-k-batch.ts --batch N --apply --confirm-prod
   ```
   Onaylanan correction'lar DB'ye yazılır, AuditLog
   action="MOD_K_APPLY" metadata: slug + verdict + corrections +
   sources + confidence + reason.

6. **Smoke test**: 5 random düzeltilmiş tarif preview, 200 OK +
   içerik doğru render.

### 20.5 Self-check (Codex teslim öncesi)

1. **Verdict**: Her tarif için PASS / CORRECTION / MAJOR_ISSUE.
2. **Sources**: Her entry için >= 2 farklı domain (PASS dahil).
3. **Confidence**: high / medium / low.
4. **Reason**: 50-300 char Türkçe.
5. **Şişirme**: description ve tipNote max %20 uzunluk artışı.
6. **Türkçe karakter**: ASCII fold 0.
7. **Em-dash**: 0.
8. **Jargon**: yasak liste 0.
9. **CORRECTION/MAJOR_ISSUE**: corrections objesi en az 1 alan
   içeriyor.
10. **Slug evren**: input dışı slug yazılmadı.
11. **Süre tutarlılığı (Kural 9, oturum 25)**: description + steps
    içindeki bahsi geçen süreler totalMinutes ile fark > %30 mı? Varsa
    CORRECTION (totalMinutes/marineMinutes/step revize).
12. **Nutrition ingredient-aware (Kural 10, oturum 25)**: Yüksek-yağ
    ingredient (kuyruk yağı, tereyağı, zeytinyağı, krema, kaymak,
    bitki yağları) varsa porsiyon başı yağ kabaca hesabı DB averageFat
    ile fark > %50 mı? Varsa macro CORRECTION (P/C/F + averageCalories
    revize).
13. **Step-ingredient miktar eşleşmesi (Kural 11, oturum 25)**: Step'te
    belirli miktar + birim ile bahsedilen ingredient list'inde var mı?
    Yoksa CORRECTION (ingredients_add veya steps_replace).

Bitince "Mod K Batch N hazır" + özet:
- Toplam: 100
- PASS: X
- CORRECTION: Y
- MAJOR_ISSUE: Z
- Confidence dağılımı (high/medium/low)
- Web research kaynak çeşitliliği

### 20.6 Beklenen output

- 71 sub-batch × 50 = 3550 tarif kontrol (kalan ~17 son sub-batch)
  - Sub-batch naming: 1a / 1b / 2a / 2b / ... / 35a / 35b / 36a
    (Mod A pattern paralel)
- Her sub-batch: ~3-8 CORRECTION + 1-3 MAJOR_ISSUE + ~40-45 PASS
- Toplam beklenti: ~200-500 CORRECTION + ~30-150 MAJOR_ISSUE
- AuditLog MOD_K_APPLY: ~250-700 kayıt (sadece onaylanan
  correction'lar)

Mod K kapanış kriterleri:
- 71 sub-batch tamamlandı, verify + manual review + apply PASS
- MAJOR_ISSUE'ların hepsi manuel ele alındı
- Quality dashboard composite skorlarda iyileşme (top 50
  low-score tarif yeniden değerlendirilir)
- Macro nutrition tutarlılığı: tüm tariflerde 4×P + 4×C + 9×F ≈
  averageCalories (%20 toleransla)
- Allergen + tag declare tutarlılığı: 0 vegan-yumurtalı, 0 gluten
  declare-eksik tarif
- **Süre tutarlılığı** (Kural 9, oturum 25): description/steps'te
  bahsi geçen süreler ile totalMinutes/marineMinutes uyumlu, 0 büyük
  çelişki ("Toplam 50 dk" + "1 saat dinlendir" örneği)
- **Nutrition ingredient-aware** (Kural 10, oturum 25): Yüksek-yağ
  ingredient'lı tariflerde porsiyon başı yağ ingredient bazlı kabaca
  hesapla uyumlu, 0 büyük anomali (Adana Kebap 100g kuyruk yağı +
  0.3g doymuş yağ örneği)
- **Step-ingredient miktar** (Kural 11, oturum 25): Step'te belirli
  miktar ile bahsedilen ingredient'lar list'te mevcut, pre-push warning
  sayısı 0 (oturum 25 öncesi 96 warning baseline)

### 20.7 Yeniden audit, oturum 25 (Kural 9/10/11 sonrası)

Oturum 25'te GPT 5 Pro analizi tarif doğruluk noktalarını işaret etti
(süre çelişkisi + nutrition anomaly + step-ingredient miktar). Brief
§20.3'e Kural 9/10/11 eklendi. Mod K Batch 1a-4b (oturum 24'te 168
correction + 9 MAJOR_ISSUE prod'a uygulanmış) bu yeni kurallarla
audit edilmedi.

**Karar (oturum 25, Kerem)**: 1a'dan başa tekrar audit. Codex Batch
1a-4b yeniden tetiklenir, **yeni Kural 9/10/11** ile süre tutarlılığı +
nutrition ingredient-aware + step-ingredient miktar kontrolü.

**Idempotent guarantee**: apply-mod-k-batch.ts zaten zaten-uygulanmış
correction'ları DB karşılaştırmasıyla SKIP eder (oturum 24'te bu davranış
test edildi). Yeni v2 audit'te:
- Eski correction zaten uygulanmış: SKIP, log yok
- Yeni correction (Kural 9/10/11 tespiti): apply, AuditLog MOD_K_APPLY
  yeni kayıt
- Eski PASS verdict v2'de CORRECTION oldu: yeni correction apply

**Eski output arşiv**: `docs/mod-k-archive-pre-rule17/` klasörüne
batch 1a-4b output JSON'ları taşındı (oturum 25). Yeni v2 output'lar
`docs/mod-k-batch-Nx.json` aynı dosya adında üzerine yazılır.

**Tahmini süre**: 8 sub-batch × ~3 saat Codex araştırma = 24 saat
(oturumlara dağılır), Claude verify+apply ~30 dk/sub-batch = 4 saat
toplam.

**Beklenen ek correction (Kural 9/10/11 odaklı)**: ~30-80 yeni
correction (mevcut 168'in üzerine), ~5-15 yeni MAJOR_ISSUE (cuisine
kalmasıyla nutrition anomaly + süre çelişkisi).


