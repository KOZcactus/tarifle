# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **21** (42.0%)
- CORRECTION: 28 (56.0%)
- MAJOR_ISSUE: 1 (2.0%)

## Confidence

- high: 27, medium: 23, low: 0

## Format integrity

- Apply'a hazir (clean format): **47**
- BLOCKED (format issue): 3

## BLOCKED (format issue, apply yapma)

| Slug | Verdict | Issues |
|---|---|---|
| `avokadolu-misir-mucveri-avustralya-usulu` | CORRECTION | Kural 9 süre tutarsız: ifade ~1 dk vs totalMinutes 22 dk (fark %95) |
| `ayranli-kete-agri-usulu` | CORRECTION | Kural 9 süre tutarsız: ifade ~20 dk vs totalMinutes 82 dk (fark %76) |
| `baharatli-lor-ezmesi-edirne-usulu` | CORRECTION | Kural 9 süre tutarsız: ifade ~2 dk vs totalMinutes 25 dk (fark %92) |

## MAJOR_ISSUE (manuel review zorunlu)

### `avokadolu-yumurtali-tost-peru-usulu`

**Reason**: Kaynaklar avokadolu yumurtalı tostu modern genel kahvaltı olarak verir; Peru köken iddiası doğrulanmadı.

**Issues**:
- cuisine: avokadolu yumurtalı tost modern genel bir tosttur, Peru mutfağına özgü bir tarif olarak doğrulanmıyor
- description: Peru usulü ifadesi kaynaklarla desteklenmediği için kullanıcıyı yanıltabilir

**Corrections** (sample):
- description: "Avokadolu yumurtalı tost, kızarmış ekmeği avokado ve yumurtayla buluşturarak kremsi, tok bir kahvaltı yapar...."

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `avokadolu-kakao-smoothie` | medium | 2 | allergens_remove |
| `avokadolu-misir-mucveri-avustralya-usulu` | high | 2 | steps_replace |
| `avokadolu-patates-causa-peru-usulu` | high | 3 | ingredients_add, totalMinutes |
| `avustralya-balkabakli-damper-muffin` | medium | 2 | cookMinutes, totalMinutes |
| `aydin-cine-koftesi` | high | 3 | ingredients_add, ingredients_remove, totalMinutes |
| `aydin-enginarli-kuru-domatesli-pilav` | high | 1 | totalMinutes |
| `aydin-zeytinyagli-enginar-kalbi` | high | 1 | totalMinutes |
| `ayran-asi-corbasi-erzurum-usulu` | high | 2 | cookMinutes, totalMinutes |
| `ayran-asili-kesme-corbasi-erzincan-usulu` | high | 1 | ingredients_add, allergens_add |
| `ayranli-evelik-corbasi-erzincan-usulu` | medium | 1 | cookMinutes, totalMinutes |
