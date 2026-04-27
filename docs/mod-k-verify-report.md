# Mod K verify raporu

Okunan dosya: 3 batch
Toplam entry: 150

## Ozet (verdict)

- PASS: **75** (50.0%)
- CORRECTION: 71 (47.3%)
- MAJOR_ISSUE: 4 (2.7%)

## Confidence

- high: 88, medium: 56, low: 6

## Format integrity

- Apply'a hazir (clean format): **150**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `erzsebet-sour-macar-usulu`

**Reason**: Kayısılı sour ailesi doğrulanıyor, ancak Erzsebet adı ve Macar kökeni doğrulanamadı. Title alanı değişmediği için manuel review gerekir.

**Issues**:
- cuisine: Erzsebet Sour için Macar mutfağı kaynağı bulunamadı; tarif kayısılı whiskey sour varyasyonuna benziyor
- description: Macar usulü iması kaynakla desteklenmiyor

**Corrections** (sample):
- description: "Kayısılı whiskey sour, viski, kayısı likörü ve limonu kısa içimli, ekşi tatlı bir kokteylde birleştirir...."

### `feijao-tropeiro-brezilya-usulu`

**Reason**: Kayıt klasik Feijão tropeiro adıyla geliyor, ama etsiz içerik ayrı vejetaryen kayıtla çakışıyor. Klasik kayıt için etiket ve içerik yanıltıcı.

**Issues**:
- identity: Feijão tropeiro başlığı klasik yemeği çağırıyor ama tarif etsiz ve vejetaryen etiketli
- ingredients: klasik kaynaklarda fasulye, manyok unu, yumurta yanında bacon veya sosis ve yeşillik bulunur

**Corrections** (sample):
- ingredients_add: 2

### `feslegenli-tavuklu-pirinc-tayland-usulu`

**Reason**: Mevcut kayıt Tayland fesleğenli tavuk iddiasını karşılamıyor. Sos ve allergen eklenmezse kullanıcıya sade tavuklu pilav gösterir.

**Issues**:
- identity: Tayland fesleğenli tavuk kaynakları hızlı soslu tavuk sotesidir, mevcut tarif sade tavuklu pilav gibi yazılmış
- ingredients: Tayland profili için sarımsak, acı biber, soya sosu ve balık sosu eksik
- allergens: önerilen düzeltmede soya sosu ve balık sosu kullanıldığı için SOYA ve DENIZ_URUNLERI eklenmeli

**Corrections** (sample):
- ingredients_add: 5
- steps_replace: 6

### `findikli-keskek-toplari-ordu-usulu`

**Reason**: Mevcut steps gerçek tarif anlatmıyor ve buğday pişirme süresi eksik. Bu kayıt apply öncesi mutlaka manuel gözden geçirilmeli.

**Issues**:
- steps: tüm adımlar tarif adına göre üretilmiş scaffold metin gibi, gerçek buğday pişirme ve şekillendirme akışı yok
- cookMinutes: aşurelik buğday için 25 dakika gerçekçi değil, kaynaklarda buğday uzun süre pişirilir veya önceden ıslatılır

**Corrections** (sample):
- steps_replace: 5

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `eriste-ustu-madimak-soteli-sivas-usulu` | high | 1 | steps_replace |
| `eristeli-kara-lahana-corbasi-ordu-usulu` | high | 1 | ingredients_add |
| `eristeli-yesil-mercimek-pilavi-kirsehir-usulu` | high | 1 | ingredients_add, steps_replace |
| `eristeli-yesil-mercimek-salatasi-kayseri-usulu` | high | 1 | ingredients_add, ingredients_remove |
| `erzurum-casir-otlu-lorlu-kete` | high | 1 | ingredients_add |
| `escondidinho` | high | 2 | cuisine, ingredients_add |
| `espinacas-con-garbanzos` | high | 2 | ingredients_add, allergens_add |
| `espresso-martini` | high | 1 | cuisine |
| `espresso-protein-shake` | medium | 1 | cuisine |
| `etli-ekmek` | high | 1 | ingredients_add |
