# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **11** (22.0%)
- CORRECTION: 38 (76.0%)
- MAJOR_ISSUE: 1 (2.0%)

## Confidence

- high: 30, medium: 20, low: 0

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `lablabi`

**Reason**: Tarif Tunus lablabisi olarak tanımlanıyor ama cuisine Fas kodunda; ayrıca harissa ve zeytinyağı temel bileşen olarak eksik.

**Issues**:
- Lablabi Tunus çorbasıdır; cuisine alanı ma görünüyor.
- Kaynaklardaki temel harissa, zeytinyağı ve tuz mevcut ingredient listesinde yok.

**Corrections** (sample):
- ingredients_add: 3

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `kuru-domatesli-firik-corbasi-gaziantep-usulu` | medium | 1 | ingredients_add, averageCalories, protein, carbs, fat |
| `kuru-domatesli-gozleme-aydin-usulu` | high | 2 | ingredients_add, steps_replace |
| `kuru-domatesli-guvec-beypazari-usulu` | medium | 2 | ingredients_add, averageCalories, protein, carbs, fat |
| `kuru-domatesli-omlet` | high | 2 | ingredients_add, steps_replace |
| `kuru-elma-pekmezli-kek-kastamonu-usulu` | medium | 2 | ingredients_add, averageCalories, protein, carbs, fat |
| `kuru-fasulye` | high | 1 | totalMinutes |
| `kuru-kayisili-bulgur-corbasi-erzurum-usulu` | medium | 1 | ingredients_add |
| `kuru-kayisili-etli-yahni-malatya-usulu` | high | 2 | ingredients_add, cookMinutes, totalMinutes, steps_replace |
| `kurutlu-pancar-borani-erzincan-usulu` | high | 3 | ingredients_add, allergens_add, cookMinutes, totalMinutes |
| `kusbasili-bulgurlu-firik-tava-sanliurfa-usulu` | high | 2 | ingredients_add, averageCalories, protein, carbs, fat |
