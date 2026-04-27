# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **9** (18.0%)
- CORRECTION: 40 (80.0%)
- MAJOR_ISSUE: 1 (2.0%)

## Confidence

- high: 22, medium: 28, low: 0

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `pazili-keskul-canakkale-usulu`

**Reason**: Keşkül kimliği açık, fakat pazı ve Çanakkale atfı kaynaklanamıyor. Title alanı da etkilendiği için manuel review gerekir.

**Issues**:
- Keşkül kaynakları süt, badem, şeker ve nişasta tabanlıdır; pazılı tatlı kimliği doğrulanamadı.
- Çanakkale pazılı keşkül iddiası için güvenilir kaynak bulunamadı.

**Corrections** (sample):
- description: "Bademli keşkül, süt, badem, şeker ve nişastayla pişen, soğuk servis edilen klasik bir sütlü tatlıdır...."
- ingredients_remove: Pazı
- steps_replace: 5

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `patlicanli-sehriye-corbasi-batman-usulu` | medium | 2 | cookMinutes, totalMinutes, steps_replace |
| `patlicanli-yogurtlama-trakya-usulu` | high | 3 | ingredients_add, cookMinutes, totalMinutes, steps_replace |
| `patlicanli-yogurtlu-kofte-urfa-usulu` | medium | 2 | ingredients_add, cookMinutes, totalMinutes, steps_replace |
| `pavlova` | high | 2 | totalMinutes, averageCalories, fat |
| `pazi-diblesi` | medium | 2 | steps_replace |
| `pazi-kavurmasi` | high | 2 | ingredients_add, steps_replace, cookMinutes, totalMinutes |
| `pazili-islama-borek-artvin-usulu` | medium | 3 | ingredients_add, steps_replace |
| `pazili-kaygana-rize-usulu` | high | 2 | ingredients_add, steps_replace |
| `pazili-peynirli-pasty-ingiltere-usulu` | high | 2 | ingredients_add, cookMinutes, totalMinutes, steps_replace |
| `pea-and-mint-soup-ingiliz-yaz-usulu` | high | 3 | ingredients_add, servingSuggestion, steps_replace |
