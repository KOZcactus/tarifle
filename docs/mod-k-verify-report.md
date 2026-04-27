# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **33** (66.0%)
- CORRECTION: 15 (30.0%)
- MAJOR_ISSUE: 2 (4.0%)

## Confidence

- high: 30, medium: 20, low: 0

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `acik-agiz-boregi-kayseri-usulu`

**Reason**: Kayseri yöre iddiası doğrulanamadı. Açık ağız formu Urfa kaynaklarıyla örtüşüyor, bu yüzden yöre bilgisi manuel incelenmeli.

**Issues**:
- description: Kayseri iddiası kaynaklarda desteklenmedi; açık ağız formu kaynaklarda Şanlıurfa ağzı açık ile eşleşiyor

**Corrections** (sample):
- description: "Açık ağız böreği, üstü aralık bırakılmış kıymalı küçük hamurların sıcak servis edildiği yöresel bir hamur işidir...."

### `aebleskiver`

**Reason**: Kaynaklar aebleskiveri Danimarka pancake topu olarak tanımlar. Kod sınırlı olduğu için manuel cuisine kararı gerekir.

**Issues**:
- cuisine: tarif Danimarka çöreği ama cuisine se kodu İsveç izlenimi veriyor; valid cuisine listesinde dk yok
- ingredient: step 1 kabartma tozu ve şeker kullanıyor ama ingredient listesinde yok

**Corrections** (sample):
- description: "Aebleskiver, yuvarlak gözlü tavada pişen Danimarka çöreğidir; İsveç tarifi değildir...."
- ingredients_add: 2

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `acaraje` | high | 2 | cuisine, prepMinutes, cookMinutes, totalMinutes |
| `acili-eksili-corba` | high | 1 | cuisine |
| `acili-susamli-yumurta-ekmegi-adiyaman-usulu` | high | 2 | ingredients_add, allergens_add |
| `adana-anali-kizli-corbasi` | high | 1 | ingredients_add |
| `adana-anali-kizli-kofte` | high | 2 | ingredients_add |
| `adana-kebap` | high | 2 | prepMinutes, cookMinutes, totalMinutes, averageCalories, protein, carbs, fat |
| `adana-sirdan-dolmasi` | high | 1 | tags_remove |
| `adana-turunclu-tavuk-sis` | high | 1 | prepMinutes, cookMinutes, totalMinutes |
| `adana-yuksuk-corbasi` | high | 2 | ingredients_add |
| `addis-ababa-mercimekli-injera-rulosu` | high | 1 | cuisine |
