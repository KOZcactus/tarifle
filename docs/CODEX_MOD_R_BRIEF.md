# Tarifle, Codex Mod R (Görsel Üretim) Brief

> Bu doküman Mod R için **tam self-contained**. Başka brief okumana
> gerek yok. Tek amaç: Tarifle tariflerine editöryal kalitede, tutarlı
> stilde fotoğraf üretmek.

---

## 0. HIZLI TETİKLEYİCİ, Kerem ne derse ne yap

| Kerem der | Sen anla | Çıktı |
|---|---|---|
| **"Mod R. Batch 0 (pilot)"** | 5 farklı kategoriden 5 pilot görsel (et + corba + tatli + kahvalti + kokteyl). Aesthetic kilitleme test. | `public/recipe-images/generated/<slug>.webp` × 5 |
| **"Mod R. Batch N"** | 20 tarif görseli. Önerilen sıra: önce featured + viewCount yüksek olanlar, sonra alfabetik. | `public/recipe-images/generated/<slug>.webp` × 20 |
| **"Mod R. Batch N. {filter}"** | 20 tarif görseli, filter scope (örn. "featured", "kokteyl", "et-yemekleri", "yöre-tr"). | aynı, scope filtreli |
| **"Mod R retrofit. {slugs}"** | Belirtilen slug listesi için görseli yeniden üret (önceki batch'te REJECT olanlar). | yeniden üretilen `<slug>.webp` |

**Standart batch boyutu**: **20 tarif**. Pilot Batch 0: **5 tarif**.

---

## 1. Proje (kısa context)

- Tarifle 3729 Türkçe tarif platformu, prod aktif (tarifle.app)
- Recipe modelinde `imageUrl` field'ı var, şu an çoğu null
- Mod R sonu: her batch sonrası `<slug>.webp` dosyaları `public/recipe-images/generated/` klasöründe hazır olur, Claude DB'ye `imageUrl` yazar (pipeline ayrı, sen sadece görselleri üretip kaydet)
- Aesthetic: dark luxury cocktail lounge benzeri editöryal yemek fotoğrafı, **kullanıcıya iştah açıcı + gerçekçi** hissi vermeli

---

## 2. ⭐ AESTHETIC TEMPLATE (kilit, asla değişmez)

Her görsel **bu blokla başlar**, sonuna sadece tarif-spesifik kısım eklenir.

### 2.1. FIXED PREAMBLE (her görselde aynı, kelimesi kelimesine)

```
A photorealistic editorial food photograph captured in a dimly lit,
upscale Istanbul cocktail lounge atmosphere.

BACKGROUND:
- Deep emerald green button-tufted velvet banquette seating, softly
  out-of-focus, vertical fabric texture barely visible
- Warm tungsten side lighting from camera-left, deep ambient shadows
- Subtle dark wood paneling or linen wallpaper texture in upper area

FOREGROUND:
- Round clear glass bistro table, ~60cm diameter, transparent and
  highly polished, edge of frame visible at bottom
- Glass surface reflects the dish gently from below; emerald booth
  visible softly through the transparent glass
- Optional small detail: charcoal linen napkin corner at frame edge,
  subtle, never dominant
- NO LAMP, NO CANDLE, NO BRASS HOLDER (kullanıcı kararı oturum 33
  Batch 1 sonrası): masada herhangi bir mum, lamba, tealight veya
  brass detay olmasın. Sadece dish + opsiyonel charcoal linen napkin
  köşesi
- Avoid wood, marble, or stone surfaces; the table is glass and
  transparent

CAMERA:
- 35mm full-frame equivalent, 50mm prime lens
- 3/4 high angle, approximately 35-40 degrees above table surface
- Aperture f/2.8, shallow depth of field
- ISO 200, warm white balance approximately 3200K
- Sharp focus on the dish surface, gentle background bokeh

COMPOSITION:
- Dish fills approximately 50-55% of frame width (tighter framing,
  closer crop, less negative space). Pilot Batch 0 sonrası kullanıcı
  kararı, oturum 33.
- Dish centered horizontally, slightly toward middle-third vertically
- Booth still visible in upper area but less dominant
- Charcoal linen napkin still visible at edge (cropped tighter)
- NO brass candle, NO lamp, NO tealight (kullanıcı kararı oturum 33)
- 4:3 aspect ratio, 1600x1200 final resolution

STYLE:
- Editorial Conde Nast / Bon Appetit aesthetic
- Photorealistic, no AI artifacts, no extra fingers, no warped utensils
- No text, no logos, no people, no hands in frame
- Color grading: warm shadows, natural highlights, ~2800-3400K
- Saturated but natural colors, never oversaturated
- NO STEAM, NO SMOKE, NO VAPOR (kullanıcı kararı, oturum 33 pilot
  sonrası): bar menü estetiği steam istemiyor; sıcak yemek bile
  buharsız sunulur, warm tungsten ışık ısı hissini görsel olarak
  zaten veriyor
```

### 2.2. VARIABLE (her tarif için ayrı, sadece bu kısmı değiştir)

Yukarıdaki preamble'ın sonuna şunu ekle:

```
DISH:
- {recipe.title} ({cuisine description, e.g., 'a Turkish dish from
  the Aegean region' or 'a Mexican beverage'})
- Vessel: {bkz. §3 vessel kararı tablosu}
- Hero ingredients visible (yemek üstünde belirgin, malzeme listesinden
  ilk 3 önemli olanı seç): {ingredient 1}, {ingredient 2}, {ingredient 3}
- Garnish: {bkz. §3 garnish kararı tablosu}
- Plating: {1-2 cümle, gerçek Türk evi sunum tarzı, Michelin değil}
- Heat / steam: NONE (kullanıcı pilot Batch 0 sonrası karar, bar
  menü estetiği steam istemiyor; sıcak yemekler bile buharsız sunulur,
  warm tungsten ışık ısı hissi veriyor zaten)
- Authentic, not over-styled, looks like a real meal at a curated
  restaurant table
```

---

## 3. KARAR TABLOLARI (vessel + garnish + heat)

### 3.1. Vessel (kap), recipe.type'a göre

| recipe.type | Vessel önerisi |
|---|---|
| `YEMEK` (et/sebze yemekleri) | White porcelain plate 24cm, OR shallow stoneware bowl for stews/güveç |
| `CORBA` | Wide white porcelain bowl 18-20cm with subtle rim, OR rustic stoneware bowl |
| `TATLI` | Small dessert plate 16cm, vintage ceramic, OR layered desserts in coupe glass / glass dish |
| `KAHVALTI` | Larger ceramic plate 26cm, OR rustic wooden board for spread-style breakfasts |
| `ATISTIRMALIK` | Small wooden board, OR small ceramic platter, OR slate stone plate |
| `APERATIF` | Small ceramic dish 16cm, multiple small bowls if mezze-style |
| `SALATA` | Wide shallow ceramic bowl 22cm, slightly off-center plating |
| `SOS` | Small ramekin or small ceramic bowl 10cm, hero ingredient garnish |
| `ICECEK` (alkolsüz) | Tall highball glass with ice, OR ceramic mug for hot drinks |
| `KOKTEYL` | Coupe glass for shaken+strained, rocks glass for stirred-on-rocks, highball for tall builds |

**Şüpheliysen**: white porcelain plate 24cm (universal default).

### 3.2. Garnish (süs/eşlik), recipe alanlarından çıkar

Önce sırayla bak:

1. `recipe.servingSuggestion` cümlesinde belirgin garnish var mı? (örn. "üzerine maydanoz serperek servis edin" → kıyılmış maydanoz)
2. `recipe.tipNote` ipucu veriyor mu? (örn. "limon dilimiyle" → limon dilimi)
3. Hero ingredient'lerden uygun olanı (örn. fesleğenli yemek → birkaç fesleğen yaprağı)
4. Cuisine default herb:

| Cuisine code | Default garnish |
|---|---|
| `tr` | Taze maydanoz dalı, kuru pul biber, dereotu, taze nane |
| `it` | Taze fesleğen yaprağı, parmesan rendesi |
| `fr` | Taze taze otlar (estragon, cerfeuil) |
| `mx` / `co` / `cu` | Taze kişniş, lime dilimi |
| `in` / `pk` | Taze kişniş, garam masala tozu |
| `jp` / `kr` / `cn` / `th` | Susam, taze yeşil soğan, mikro yeşillik |
| `ma` / `tn` | Taze nane, kuru sumak veya tarçın |
| `gr` | Taze kekik, zeytinyağı drizzle |

5. Cocktail/içecek: pile alkol kategorisi → uygun fruit twist, herb sprig, ya da bar pick

### 3.3. Heat / steam

**Kural (oturum 33 pilot sonrası, kullanıcı kararı): TÜM TARIFLER
İÇİN STEAM YOK.** Bar menü estetiği steam istemiyor; sıcak yemekler
bile buharsız sunulur. Warm tungsten ışık + 3/4 yüksek açı + porselen
tabak ısı hissini görsel olarak zaten veriyor, ekstra duman görsel
gürültü.

| recipe.type | Steam | Diğer detaylar |
|---|---|---|
| `YEMEK` | YOK | Tabak'ta ısı bağlamı ışıkla verilir |
| `CORBA` | YOK | Sıvı yüzey hafif buğulu olabilir, steam wisp YASAK |
| `KAHVALTI` | YOK | Sıcak ya da soğuk fark etmez |
| `TATLI` | YOK | Şurup parıltısı veya soğuk yoğuşma OK |
| `ATISTIRMALIK` | YOK | |
| `SALATA` | YOK | |
| `SOS` | YOK | |
| `ICECEK` (sıcak) | YOK | Tütüm yerine cam yansıması, sade |
| `ICECEK` (soğuk) | YOK | Glass condensation drops OK |
| `KOKTEYL` | YOK | Ice cube + glass condensation OK |

Steam wisps (yatay duman dalgaları, dik buhar bulutları) hiçbir
görselde olmasın. Eğer image gen modeli otomatik steam ekliyorsa,
prompt'a "no visible steam, no smoke, no vapor, dish is hot but no
steam wisps" emphasis ekle.

### 3.4. Plating tonu

- **Türk evi gerçekçiliği**: doğal sos drips, organik yerleşim, Michelin tabaktaki düzen DEĞİL
- Garnish saçılmış gibi (artificially arranged değil)
- Tabağa fazla koyma, %60-70 doluluk
- Kenarda lekeler doğal, mahsus silinmiş gibi olmasın
- Renk paleti: doğal yiyecek renkleri, lighting'le kontrast verir

---

## 4. INPUT, tarif listesi nasıl alınır

Her batch öncesi Claude şu komutu koşar:

```bash
npx tsx scripts/dump-recipe-image-queue.ts --batch N --size 20 [--filter X]
```

Çıktı: `docs/recipe-image-prompts/queue-batch-N.json`

Format (her tarif için):

```json
{
  "slug": "adana-kebap",
  "title": "Adana Kebap",
  "type": "YEMEK",
  "cuisine": "tr",
  "categorySlug": "et-yemekleri",
  "ingredients": ["Kuzu kıyma", "Kuyruk yağı", "Pul biber", "Tuz", "Karabiber"],
  "servingSuggestion": "Lavaş ekmek üzerinde, yanında soğan ve sumakla servis edin.",
  "tipNote": "Et harcını şişe yapıştırmadan önce 30 dakika dinlendirin."
}
```

Sen sadece bu JSON'u oku, her entry için §2 + §3'e göre prompt compose et + image gen + save. JSON'u ben hazırlarım, sen üretmiyorsun.

---

## 5. OUTPUT, dosya kaydı

### 5.1. Klasör

```
public/recipe-images/
├── generated/                       # SEN buraya kaydedersin
│   ├── adana-kebap.webp
│   ├── lahmacun.webp
│   └── ...
└── manual/                          # Eren'in çekimleri (gelecek), DOKUNMA
```

### 5.2. Dosya formatı

- **Format**: WebP, quality 85
- **Boyut**: **1600×1200** (4:3 aspect ratio)
- **Naming**: `{slug}.webp` (kebab-case, lowercase, ASCII)
- Slug'ı kesinlikle aynen kullan, modifiye etme

### 5.3. Kaydetme komutu

Görseli ürettikten sonra dosya sistemine `public/recipe-images/generated/{slug}.webp` olarak kaydet. Path bu repo root'una göredir, Codex'in working directory'si zaten repo root.

---

## 6. SELF-CHECK (teslim öncesi REJECT kriterleri)

Her görseli teslim etmeden önce SEN kontrol et:

| # | Check | Fail = ne yap |
|---|---|---|
| 1 | Görsel doğru yemek mi? (slug + title ile uyumlu) | Regenerate, daha specific prompt |
| 2 | Aesthetic preamble matched mi? (emerald velvet booth, clear glass bistro table, 3/4 high angle, warm tungsten lighting) | Regenerate, preamble'ı verbatim ver |
| 3 | AI artifact var mı? (deformed parmak, garip yazı, çarpık çatal-bıçak, eklem hataları) | Regenerate |
| 4 | Aspect ratio 4:3 (1600×1200) mı? | Resize veya yeniden üret |
| 5 | WebP format mı, quality 85 mi? | Convert + save |
| 6 | İnsan/el var mı? Yazı/logo var mı? | Regenerate (preamble açıkça yasak diyor) |
| 7 | Steam YOK mu? (sıcak yemek bile, kullanıcı kararı bar menü estetiği) | Regenerate, prompt'ta "no visible steam, no smoke, no vapor" emphasis |

**Self-check geçen görseli kaydet, geçmeyen 3 retry'a kadar regenerate.**
3 retry sonra hâlâ fail → o tariflerin slug listesini batch report'una "RETRY EXHAUSTED, manuel review gerekli" olarak ekle, atla.

---

## 7. BATCH RAPORU (teslim formatı)

Batch tamamlanınca chat'e şunu yapıştır:

```
Mod R. Batch N hazır.

Üretilen: 18/20 ✅
Retry exhausted: 0
Kaydedilenler:
- adana-kebap → public/recipe-images/generated/adana-kebap.webp ✅
- lahmacun → public/recipe-images/generated/lahmacun.webp ✅
- iskender-kebap → public/recipe-images/generated/iskender-kebap.webp ✅
- ...
Self-check: hepsi 1600x1200 WebP, hepsi emerald booth + glass table + 3/4 high angle, 0 AI artifact

Notlar: ...
```

Eğer retry exhausted varsa, ayrı listeyle belirt:

```
Retry exhausted (manuel review):
- karadeniz-pidesi: AI sürekli ekmeği insan eli ile tutuyor, regenerate edilemedi
```

**Push veya commit yapma. Sen sadece dosyaları kaydet, batch raporu chat'e yapıştır. Claude validate + DB update + commit + push yapacak.**

---

## 8. ANTI-PATTERN (yapma listesi)

Bunlar olursa REJECT, regenerate:

1. ❌ İnsan figürü, el, kol görseli (preamble açıkça yasak)
2. ❌ Tabakta yazı, marka logosu, fiş, menü
3. ❌ AI klasik artifact: çarpık parmak, garip metin, deformed cutlery
4. ❌ Aşırı stilize edilmiş Michelin tabağı (Tarifle ev mutfağı odaklı)
5. ❌ Ön planda yemek dışında 3+ obje (sade kal, dish odaklı)
6. ❌ Sahte renkler (turuncu domates, mor patates vb. AI hallucination)
7. ❌ Yanlış cuisine vessel (örn. Türk yemeği için Çin işi mavi-beyaz porselen)
8. ❌ Boyut 1600×1200 dışı, format JPG/PNG (sadece WebP)
9. ❌ Emerald booth yerine başka renk (kırmızı/mavi/krem) → preamble verbatim ver
10. ❌ Kuş bakışı 90° top-down (3/4 yüksek açı 35-40°, table edge görünmeli)
11. ❌ Steam wisps her durumda (kullanıcı kararı, bar menü estetiği steam istemiyor)
12. ❌ Garnish yokluğu (her görselde §3.2'ye göre uygun garnish olmalı)
13. ❌ Brass candle, lamp, tealight, mum (kullanıcı kararı oturum 33
    Batch 1 sonrası): masada lamb DEĞİL, sadece dish + opsiyonel
    charcoal linen napkin köşesi

---

## 9. REFERENCE IMAGE (Batch 1+ için, Batch 0'dan sonra)

Pilot Batch 0 sonrası Claude en iyi 3 görseli seçip `docs/recipe-image-prompts/reference/` klasörüne kopyalayacak.

Batch 1'den itibaren her batch'te ilk image gen call'una bu 3 reference görseli **input olarak ekle** (gpt-image-1 multi-input destekler):

```
[reference-1.webp, reference-2.webp, reference-3.webp]
+ FIXED PREAMBLE (§2.1)
+ VARIABLE PER-RECIPE (§2.2)
```

Bu lock'lar aesthetic'i, batch'ler arası drift'i azaltır.

---

## 10. PILOT (Batch 0) ÖZEL DİKKAT

İlk pilot batch için:

- 5 farklı kategoriden 5 tarif: 1 et-yemekleri + 1 corba + 1 tatli + 1 kahvalti + 1 kokteyl
- Reference image YOK (henüz yok), sadece §2 preamble + §3 kararları
- Her görsele biraz daha zaman ayır, yeniden üretmekten çekinme
- Pilot raporunda her görsel için 1-2 cümle "self-evaluation" ekle:
  > "adana-kebap: Lavaş ekmek görünür, kuyruk yağı parlaklık verdi, sumak tabakta dağılı. Aesthetic preamble OK. Garnish maydanoz, tipNote'tan."

Pilot 5/5 PASS olduktan sonra Claude en iyi 3'ü reference'a alır, ardından Batch 1 başlar.

---

## 11. TUTARLILIK İPUÇLARI

- **Preamble verbatim kullan**, paraphrase ETME. Aesthetic kilit oraya gömülü.
- **Aspect ratio 4:3 fix**, deviate etme (mobile crop'lar 1:1 ya da 16:9 frontend'de yapılır).
- **Lighting "warm tungsten side from camera-left"** sabit, "natural daylight" ya da "overhead studio" YASAK.
- **Background "deep emerald green button-tufted velvet booth"** sabit, başka renk/desen YASAK.
- **Table "round clear glass bistro"** sabit (transparent + polished),
  ahşap/mermer/beyaz/koyu taş masa YASAK.
- **Camera angle "3/4 high 35-40°"** sabit, top-down YASAK, eye-level YASAK.

12 kuralın hepsi self-check §6'da listelendi, teslim öncesi sırayla doğrula.

---

## 12. ÖZETLE NE YAPACAKSIN

1. Kerem "Mod R. Batch N" der → Claude `docs/recipe-image-prompts/queue-batch-N.json` hazırlamış olur (sen beklersin)
2. JSON'u oku, 20 tarif var
3. Her tarif için:
   - §2.1 preamble + §2.2 variable + §3 kararları → prompt compose
   - Batch 1+ ise §9 reference image'ı ekle
   - Image tool çağır, 1600×1200 WebP üret
   - §6 self-check geçirt, gerekirse 3 retry
   - `public/recipe-images/generated/{slug}.webp` olarak kaydet
4. Batch tamamlanınca §7 raporunu chat'e yapıştır
5. Commit / push YAPMA, Claude pipeline'da yapıyor

**Push, commit, DB update, dump pipeline → hepsi Claude'da. Sen sadece görselleri üret + kaydet + raporla.**

Sorun olursa retry chat'i için: hangi slug, hangi check başarısız, ne sebeple, net belirt.
