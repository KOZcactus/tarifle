# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **14** (28.0%)
- CORRECTION: 33 (66.0%)
- MAJOR_ISSUE: 3 (6.0%)

## Confidence

- high: 29, medium: 18, low: 3

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `nigde-sogurmeli-yumurta`

**Reason**: Genel kahvaltılık doğru görünüyor, fakat yöresel ad ve közleme süresi manuel kimlik review gerektiriyor.

**Issues**:
- Köz biberli domatesli yumurta yapısı makul, ancak Niğde söğürmeli yumurta adıyla güvenilir kaynak doğrulaması zayıf.
- Step 1 açık scaffold cümlesi taşıyor.
- Biber közleme için 3 dakika pratikte kısa kalır veya önceden közlenmiş biber varsayımı açık değildir.

**Corrections** (sample):
- description: "Köz biberli domatesli yumurta, tereyağında yumuşayan biber ve domatesin üstüne yumurta kırarak sıcak bir kahvaltılık haz..."
- steps_replace: 5

### `nohutlu-firikli-semsek-gaziantep-usulu`

**Reason**: Hamur işi düzeltilebilir, fakat Gaziantep nohutlu firikli semsek kimliği kaynaklarla güvenli doğrulanmadı.

**Issues**:
- Semsek veya sembusek kaynaklarda daha çok Mardin hattında etli kapalı hamur işi olarak doğrulanıyor.
- Gaziantep nohutlu firikli semsek adıyla güvenilir kaynak doğrulanamadı.
- Vegan tag'i var, ancak step 5 yumurta sürmeyi söylüyor.

**Corrections** (sample):
- description: "Nohutlu firikli kapalı börek, ince hamuru firik ve nohutlu içle doldurarak isli aromalı, çıtır bir hamur işi hazırlar...."
- ingredients_add: 3

### `nohutlu-otlu-borek-aydin-usulu`

**Reason**: Börek olarak çalışabilir, fakat Aydın nohutlu otlu börek kimliği ve scaffold step'ler manuel review gerektiriyor.

**Issues**:
- Aydın usulü nohutlu otlu börek adıyla güvenilir kaynak doğrulanamadı.
- Steps açık scaffold kalıbı taşıyor ve yufka ile hamur arasında kararsız.
- İç harçta hangi Ege otlarının kullanılacağı belirsiz.

**Corrections** (sample):
- description: "Nohutlu otlu börek, yufkayı haşlanmış nohut ve karışık otlu içle doldurarak çıtır, doyurucu bir fırın böreği hazırlar...."
- ingredients_add: 2

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `nevsehir-divil-patatesli` | high | 2 | ingredients_add, steps_replace |
| `new-orleans-creole-jambalaya` | high | 3 | ingredients_add, steps_replace |
| `new-orleans-misirli-karides-corbasi` | medium | 3 | ingredients_add, steps_replace |
| `new-york-cheesecake` | high | 1 | totalMinutes |
| `new-york-chicken-parmesan` | high | 2 | ingredients_add, steps_replace |
| `new-york-lox-bagel-tabagi` | high | 2 | steps_replace |
| `nice-firin-ratatouille` | high | 1 | ingredients_add |
| `nicoise-salatasi` | high | 2 | ingredients_add |
| `nikujaga` | high | 3 | ingredients_add |
| `nohut-salatasi` | high | 2 | steps_replace |
