# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **23** (46.0%)
- CORRECTION: 26 (52.0%)
- MAJOR_ISSUE: 1 (2.0%)

## Confidence

- high: 41, medium: 9, low: 0

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `berlin-currywurst-tabagi`

**Reason**: Currywurst sosisli bir yemektir. Bratwurst içeren mevcut tarifte vegan ve vejetaryen tag'leri ciddi biçimde yanıltıcıdır.

**Issues**:
- tags: bratwurst içeren tarif vegan ve vejetaryen olamaz
- description: sokak klasiği anlatımı doğru olsa da tag'ler kullanıcıyı yanıltır

**Corrections** (sample):

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `barramundi-sebze-tepsi-avustralya-usulu` | high | 1 | ingredients_add |
| `barramundi-tava-avustralya-usulu` | medium | 1 | ingredients_add |
| `barszcz-czerwony-polonya-usulu` | medium | 1 | servingSuggestion |
| `bastilla` | high | 2 | ingredients_add |
| `bat-tokat-usulu` | high | 1 | ingredients_add |
| `batata-harra-beyrut-usulu` | high | 1 | ingredients_add |
| `batido-de-mamey-kuba-usulu` | high | 1 | steps_replace |
| `bazlama` | high | 1 | servingSuggestion |
| `beef-chow-fun` | high | 1 | ingredients_add |
| `beef-stroganoff-klasik` | high | 2 | ingredients_add, allergens_add |
