# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **32** (64.0%)
- CORRECTION: 14 (28.0%)
- MAJOR_ISSUE: 4 (8.0%)

## Confidence

- high: 28, medium: 22, low: 0

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `biscuit-gravy-tepsi-amerikan-usulu`

**Reason**: Biscuits and gravy klasik olarak sosisli sütlü gravy ile yapılır; tarif sosis pişiriyor ama listede yok ve vejetaryen etiketi yanıltıcı.

**Issues**:
- ingredients: step 1 kahvaltılık sosis kullanıyor ama ingredient listesinde sosis yok
- tags: vejetaryen etiketi sosisli gravy nedeniyle yanlış

**Corrections** (sample):
- ingredients_add: 1

### `bo-la-lot-vietnam-usulu`

**Reason**: Yaprak türü tarifin kimliğini değiştiriyor; lá lốt yerine asma yaprağı yazılması ve balık sosunun eksik olması yanıltıcı.

**Issues**:
- ingredients: asma yaprağı yazılı ama bò lá lốt geleneksel olarak lá lốt yaprağıyla yapılır
- ingredients: step'lerde balık sosu kullanılıyor ama listede yok
- allergen: balık sosu eklendiğinde DENIZ_URUNLERI alerjeni de eklenmeli

**Corrections** (sample):
- ingredients_add: 1

### `bobo-de-camarao`

**Reason**: Bobó de camarão Brezilya karides ve manyok yemeğidir; mutfak alanı yanlış, ayrıca kullanılan soğan ve biber listede eksik.

**Issues**:
- cuisine: input cuisine 'tr' görünüyor ama bobó de camarão Brezilya mutfağına aittir
- ingredients: step'lerde soğan ve biber kullanılıyor ama listede yok

**Corrections** (sample):
- ingredients_add: 2

### `boeuf-bourguignon`

**Reason**: Tarifin içerik ve yöntem kısmı makul, ancak mutfak kodu yemeğin kökeniyle çelişiyor; apply şeması cuisine alanını desteklemiyor.

**Issues**:
- cuisine: input cuisine 'me' görünüyor ama boeuf bourguignon Fransız mutfağına aittir

**Corrections** (sample):
- description: "Boeuf bourguignon, Burgonya'nın kırmızı şarapta pişen dana yahnisi; mantar ve arpacık soğanla zenginleşir...."

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `biberli-cevizli-ekmek-asi-hatay-usulu` | medium | 1 | steps_replace |
| `biberli-ekmek-antakya-usulu` | high | 1 | ingredients_add |
| `biberli-katik-pidesi-adiyaman-usulu` | medium | 2 | ingredients_add, allergens_add |
| `biberli-tavuk-guvec-adana-usulu` | high | 2 | ingredients_add, cookMinutes, totalMinutes, steps_replace |
| `biberli-zeytinli-ekmek-hatay-usulu` | medium | 2 | ingredients_add, ingredients_amount_change |
| `bibimbap` | high | 2 | ingredients_add |
| `bici-bici` | high | 2 | totalMinutes, tags_remove |
| `bilecik-buzme-tatlisi-cevizli` | high | 2 | ingredients_add, allergens_add |
| `birria-de-res` | high | 2 | ingredients_add |
| `blueberry-cheesecake-jar-amerikan-usulu` | high | 3 | ingredients_add, totalMinutes, tags_remove |
