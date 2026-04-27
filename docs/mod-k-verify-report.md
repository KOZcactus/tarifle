# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **5** (10.0%)
- CORRECTION: 39 (78.0%)
- MAJOR_ISSUE: 6 (12.0%)

## Confidence

- high: 37, medium: 13, low: 0

## Format integrity

- Apply'a hazir (clean format): **44**
- BLOCKED (format issue): 6

## BLOCKED (format issue, apply yapma)

| Slug | Verdict | Issues |
|---|---|---|
| `pastel-brezilya` | CORRECTION | Kural 9 süre tutarsız: ifade ~17 dk vs totalMinutes 50 dk (fark %66) |
| `pastirmali-kuru-domatesli-yumurta-kayseri-usulu` | CORRECTION | Kural 9 süre tutarsız: ifade ~7 dk vs totalMinutes 16 dk (fark %56) |
| `patates-oturtma` | CORRECTION | description sisirildi (76 -> 97, max 91) |
| `patates-rosti-lokmalari` | MAJOR_ISSUE | Kural 9 süre tutarsız: ifade ~10 dk vs totalMinutes 27 dk (fark %63) |
| `patlican-pacarasi-manisa-usulu` | MAJOR_ISSUE | Kural 9 süre tutarsız: ifade ~1 dk vs totalMinutes 40 dk (fark %98) |
| `patlicanli-kasarli-omlet-bursa-usulu` | CORRECTION | Kural 9 süre tutarsız: ifade ~6 dk vs totalMinutes 18 dk (fark %67) |

## MAJOR_ISSUE (manuel review zorunlu)

### `passionfruit-pisco-spritz-peru-usulu`

**Reason**: Pisco yerine brendi ve yanlış type yapısal hatadır; yalnız ingredient patch'i kimlik sorununu tam kapatmaz.

**Issues**:
- Title pisco spritz diyor ama ingredient listesi Brendi kullanıyor.
- Alkollü kokteyl ICECEK type altında duruyor; Mod K corrections şeması type alanını düzeltemiyor.
- 3 step KOKTEYL minimum step sayısı olan 4'ün altında.

**Corrections** (sample):
- ingredients_add: 2
- ingredients_remove: Brendi
- steps_replace: 4

### `patates-rosti-lokmalari`

**Reason**: Tarif tekniği röstiye yakın; ancak İsveç cuisine kodu yanlış ve uygun İsviçre kodu bulunmadığı için manuel karar gerekir.

**Issues**:
- Rösti İsviçre kökenli patates yemeğidir, cuisine se İsveç kodu kimlik hatası yaratıyor.
- Tarifle cuisine listesinde İsviçre kodu yok; Mod K correction şeması doğru cuisine'e güvenli geçiş sunmuyor.

**Corrections** (sample):
- description: "Rendelenmiş patatesin küçük porsiyon rösti olarak tavada kızarması, sıcak servis edilen gevrek lokmalar verir...."
- steps_replace: 5

### `patatesli-kete-tavasi-ardahan-usulu`

**Reason**: Tarif uygulanabilir hamur işi gibi dursa da Ardahan patatesli kete tavası iddiası kaynaklarla güvenli doğrulanmadı.

**Issues**:
- Kete kaynaklarında Kars ve çevresi içli kete geçiyor, fakat patatesli Ardahan tava kimliği yeterince doğrulanamıyor.
- Steps generic scaffold içeriyor ve kete tekniğini ayrıntılandırmıyor.

**Corrections** (sample):
- steps_replace: 5

### `patatesli-soganli-midye-tava-istanbul-bogaz-usulu`

**Reason**: Mevcut yemek midyeli patates tavası olabilir, fakat midye tava adı klasik tarifle çeliştiği için apply öncesi manuel revizyon gerekir.

**Issues**:
- Midye tava klasik olarak unlu veya sodalı kaplamayla kızartılan midyedir; patatesli soğanlı tava kimliği kaynaklarla örtüşmüyor.
- Step 5 limon suyu ve karabiber kullanıyor ama listede yok.
- Type YEMEK ve İstanbul Boğaz usulü iddiası manuel karar gerektiriyor.

**Corrections** (sample):
- ingredients_add: 3

### `patila-kars-usulu`

**Reason**: Mevcut içerik sade tava ekmeği gibi; Kars patila kimliği ve dolgusuz yapı manuel doğrulama gerektiriyor.

**Issues**:
- Patila veya patile kaynaklarında Elazığ patilesi ve patatesli gözleme hattı öne çıkıyor; Kars usulü yoğurtlu sade yayla ekmeği güvenle doğrulanmadı.
- Step 1 10 dakika timer verip sadece ekipman hazırlığını anlatıyor.
- Tarif içinde dolgu yok, fakat patila kaynakları genelde içli hamur işi olarak geçiyor.

**Corrections** (sample):
- steps_replace: 5

### `patlican-pacarasi-manisa-usulu`

**Reason**: Uygulama köz patlıcan salatası olarak düzeltilebilir; ancak Manisa paçarası adı manuel kaynak teyidi ister.

**Issues**:
- Manisa patlıcan paçarası adı güvenilir kaynaklarla doğrulanamadı; mevcut içerik köz patlıcan salatasına benziyor.
- Steps her cümlede title tekrar ediyor ve közleme iki kez 25 dakika sayılmış.
- TotalMinutes 33, iki ayrı 25 dakikalık timer ve servis adımlarıyla tutarsız.

**Corrections** (sample):
- ingredients_add: 1
- steps_replace: 5

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `paprikali-mantar-guvec-macar-usulu` | high | 2 | ingredients_add, cookMinutes, totalMinutes, steps_replace |
| `paprikali-mantarli-nohut-gulyasi-macar-usulu` | high | 2 | ingredients_add, steps_replace |
| `paprikali-nohut-gulas-macar-usulu` | high | 2 | ingredients_add, steps_replace |
| `paprikali-tavuklu-arpa-sehriye-macar-usulu` | high | 2 | ingredients_add, cookMinutes, totalMinutes |
| `paprikas-csirke-macar-usulu` | high | 2 | ingredients_add, cookMinutes, totalMinutes, steps_replace |
| `paprikas-krumpli` | high | 2 | ingredients_add |
| `paprikas-tarhonya-macar-usulu` | high | 2 | ingredients_add, cookMinutes, totalMinutes |
| `paris-elmali-kereviz-remoulade` | high | 3 | allergens_add, steps_replace |
| `paris-ratatouille-tenceresi` | high | 2 | ingredients_add, steps_replace |
| `paris-sogan-corbasi` | high | 2 | ingredients_add, tags_add |
