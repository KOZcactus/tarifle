# Mod K verify raporu

Okunan dosya: 2 batch
Toplam entry: 100

## Ozet (verdict)

- PASS: **42** (42.0%)
- CORRECTION: 56 (56.0%)
- MAJOR_ISSUE: 2 (2.0%)

## Confidence

- high: 58, medium: 38, low: 4

## Format integrity

- Apply'a hazir (clean format): **100**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `cape-town-mercimek-bobotie`

**Reason**: Bobotie Güney Afrika yemeğidir ve gb kodu yanıltıcıdır. Enum eksikliği manuel karar ister; ayrıca stepteki temel malzemeler listede yok.

**Issues**:
- cuisine: Güney Afrika yemeği için cuisine 'gb' yanıltıcı; mevcut enumlarda Güney Afrika kodu yok, manuel mapping gerekiyor
- step 2 ve 3: soğan, sarımsak, zerdeçal ve ekmek içi geçiyor ama ingredient listesinde yok
- allergen: ekmek içi kullanıldığı için GLUTEN allergeni eksik

**Corrections** (sample):
- description: "Güney Afrika usulü mercimek bobotie, körili mercimek ve kuru üzümü yumurtalı süt katmanıyla fırınlayan baharatlı bir yem..."
- ingredients_add: 4

### `cennet-camurlu-muhallebi-mersin-usulu`

**Reason**: Mevcut kayıt adından ve kaynaklardaki temel reçeteden kopmuş. Bu muhallebi değil, kadayıf, fıstık, şerbet ve kaymaklı tatlıdır.

**Issues**:
- description: cennet çamuru muhallebi ve bisküvi katmanı değil, kaynaklarda kadayıf, tereyağı, şerbet, Antep fıstığı ve kaymakla yapılan tatlı
- ingredients: mevcut liste cennet çamuru yerine muhallebi benzeri farklı bir tatlıya gidiyor
- steps: nişasta geçiyor ama ingredient listesinde pirinç unu var; tarif kendi içinde de çelişkili

**Corrections** (sample):
- description: "Cennet çamuru, tel kadayıfı tereyağı, şerbet ve Antep fıstığıyla tavada birleştiren, kaymakla servis edilen Kilis tatlıs..."
- ingredients_add: 3
- ingredients_remove: Bisküvi kırıntısı, Süt, Pirinç unu
- steps_replace: 5

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `bulgurlu-domatesli-kabak-corbasi-diyarbakir-usulu` | medium | 1 | ingredients_add |
| `bulgurlu-kabak-cicegi-dolmasi-antalya-usulu` | high | 2 | ingredients_add |
| `bun-bo-hue` | high | 2 | cuisine, ingredients_remove, ingredients_add, allergens_remove, allergens_add, steps_replace |
| `bun-cha` | high | 2 | ingredients_remove, ingredients_add, allergens_remove |
| `bun-thit-nuong-vietnam-usulu` | high | 3 | ingredients_add, allergens_add, totalMinutes |
| `buraczki-z-chrzanem-polonya-usulu` | medium | 2 | steps_replace |
| `burdur-ceviz-ezmesi` | high | 1 | steps_replace, totalMinutes |
| `burdur-cevizli-kabak-tatlisi` | high | 1 | totalMinutes |
| `bursa-cantik-pide` | medium | 2 | ingredients_add |
| `bursa-inegol-kofte` | high | 1 | totalMinutes |
