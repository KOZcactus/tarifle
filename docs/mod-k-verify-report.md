# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **18** (36.0%)
- CORRECTION: 29 (58.0%)
- MAJOR_ISSUE: 3 (6.0%)

## Confidence

- high: 26, medium: 24, low: 0

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `chilaquiles`

**Reason**: Chilaquiles Meksika kahvaltısıdır. Tayland cuisine kodu ve step'te kullanılan krema, kişniş, soğan eksikleri kullanıcıyı yanıltır.

**Issues**:
- cuisine: description Meksika kahvaltısı diyor ama cuisine 'th' yazılı
- step 4: krema ekleniyor ama ingredient listesinde krema yok
- step 5: kişniş ve soğanla servis yazıyor ama ingredient listesinde ikisi de yok

**Corrections** (sample):
- ingredients_add: 3

### `chimichurri`

**Reason**: Maydanoz, sarımsak, sirke, yağ ve pul biber sosu doğru. Fakat Arjantin kökenli chimichurri için Türk cuisine kodu yanıltıcıdır.

**Issues**:
- cuisine: chimichurri Arjantin mutfağına aittir ama cuisine 'tr' yazılı

**Corrections** (sample):

### `cirpilmis-zeytin-salatasi`

**Reason**: Yeşil zeytin, ceviz, nar ekşisi ve zeytinyağı Hatay tipi zeytin salatasıyla uyumlu. Cuisine kodu Tayland değil Türkiye olmalı.

**Issues**:
- cuisine: description Hatay usulü diyor ama cuisine 'th' yazılı
- Hatay zeytin salatası için Tayland cuisine kodu kullanıcıyı yanıltır

**Corrections** (sample):

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `char-siu-chicken-cin-firin-usulu` | high | 3 | ingredients_add, allergens_add |
| `chawanmushi` | high | 2 | tags_remove, allergens_add |
| `che-ba-mau` | high | 3 | cookMinutes, totalMinutes, steps_replace |
| `che-chuoi-vietnam-usulu` | high | 3 | ingredients_add, steps_replace, allergens_add |
| `cheddarli-pirasa-scone-ingiltere-usulu` | high | 1 | ingredients_add |
| `cheddarli-pirasali-galeta-kizartmasi-ingiltere-usulu` | medium | 2 | ingredients_add |
| `chennai-masala-dosa` | medium | 2 | totalMinutes |
| `chermoula-patates-salatasi-fas-usulu` | high | 1 | ingredients_add |
| `chermoula-sos` | high | 1 | ingredients_add |
| `chermoula-tavuk` | high | 2 | ingredients_add, steps_replace |
