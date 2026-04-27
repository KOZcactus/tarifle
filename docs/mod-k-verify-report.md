# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **5** (10.0%)
- CORRECTION: 40 (80.0%)
- MAJOR_ISSUE: 5 (10.0%)

## Confidence

- high: 34, medium: 14, low: 2

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `ptichye-moloko`

**Reason**: Tatlı kimliği doğru yönde, ancak jelatin eksikliği ve bekleme süresinin yok sayılması yapısal hata oluşturuyor.

**Issues**:
- Ptichye moloko köpüksü katman için jelatin veya benzeri bir sabitleyici ister, mevcut listede yok.
- Steps içinde 2 saat 40 dakika bekleme var ama totalMinutes 35 dakika görünüyor.

**Corrections** (sample):
- ingredients_add: 1

### `pulled-pork-sandvic`

**Reason**: Başlık ve içerik arasında domuz eti yerine dana döş kullanımı var; kullanıcıya bunun uyarlama olduğu açık söylenmeli.

**Issues**:
- Tarif adı pulled pork, fakat ingredient listesinde dana döş var; bu ancak açıkça dana uyarlaması olarak sunulabilir.
- Steps tamamen scaffold dilinde, 4 saatlik düşük ısıda pişirme tekniğini anlatmıyor.

**Corrections** (sample):
- description: "Amerikan barbekü uyarlamasında uzun pişen dana döş, soslu ve lahana salatalı sandviçe dönüşür...."
- steps_replace: 5

### `pupusa`

**Reason**: Malzeme ve teknik pupusaya uyuyor; asıl hata cuisine kodu, El Salvador için mevcut taxonomy genişletmesi gerekiyor.

**Issues**:
- Pupusa El Salvador yemeği; mevcut cuisine cn Çin kodu açıkça yanlış.
- Tarifle cuisine listesinde El Salvador için ayrı kod yok, bu yüzden taxonomy gap manuel ele alınmalı.

**Corrections** (sample):
- description: "Pupusa, El Salvador mutfağında mısır hamurunun peynir ve fasulye dolguyla tavada piştiği kalın bir gözlemedir...."

### `reyhanli-bulgur-patlican-dolmasi-isparta-usulu`

**Reason**: Dolma tekniği makul, fakat Isparta ve reyhanlı patlıcan iddiası zayıf; manuel yöresel kaynak kontrolü gerekir.

**Issues**:
- Isparta'ya özgü reyhanlı bulgur patlıcan dolması iddiası iki güçlü kaynakla desteklenemedi.
- Step 2 doğranmış soğan kullanıyor ama ingredient listesinde soğan yok.

**Corrections** (sample):
- ingredients_add: 1

### `reyhanli-bulgur-salatasi-batman-usulu`

**Reason**: Bulgur salatası yapısı uygulanabilir; Batman yöresel iddiası ve scaffold adımlar manuel review ister.

**Issues**:
- Batman'a özgü reyhanlı bulgur salatası iddiası güvenilir iki bağımsız kaynakla desteklenemedi.
- Steps scaffold dili taşıyor ve Step 3 tuz diyor ama ingredient listesinde tuz yok.

**Corrections** (sample):
- ingredients_add: 1
- steps_replace: 5

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `prinsesstarta` | high | 2 | ingredients_add, totalMinutes |
| `profiterol` | high | 2 | ingredients_add |
| `pudin-de-pan-kuba-usulu` | medium | 2 | totalMinutes |
| `puebla-tavuklu-tinga-tostada` | high | 2 | ingredients_add |
| `pumpkin-scone-avustralya-usulu` | medium | 2 | ingredients_add, allergens_add, steps_replace |
| `pytt-i-panna-iskandinav-usulu` | high | 2 | ingredients_add |
| `pyttipanna-med-agg` | high | 2 | ingredients_add, allergens_add |
| `pyzy-polonya-usulu` | high | 2 | ingredients_add, allergens_add |
| `queijadinha` | medium | 2 | ingredients_add |
| `quiche-lorraine` | high | 2 | description, ingredients_add |
