# Mod K verify raporu

Okunan dosya: 5 batch
Toplam entry: 250

## Ozet (verdict)

- PASS: **161** (64.4%)
- CORRECTION: 84 (33.6%)
- MAJOR_ISSUE: 5 (2.0%)

## Confidence

- high: 135, medium: 110, low: 5

## Format integrity

- Apply'a hazir (clean format): **250**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `dark-and-stormy`

**Reason**: Koyu rom ve zencefil birası doğru, fakat Bermuda çıkışlı kokteyl Türk mutfağı altında duruyor. gb kodu geçici seçenek olarak manuel incelenmeli.

**Issues**:
- cuisine: Bermuda çıkışlı kokteyl tr cuisine koduyla kaydedilmiş
- cuisine: Tarifle kod listesinde Bermuda yok, tr kodu kullanıcıyı yanıltır

**Corrections** (sample):

### `denizli-yen-boregi`

**Reason**: Mevcut tarif kaynaklardaki yen böreğiyle temel malzeme ve teknik düzeyinde ayrışıyor. Bu tarif manuel inceleme gerektiren ciddi sorun taşıyor.

**Issues**:
- ingredient: kaynaklarda yen böreği mısır unlu mayalı hamurla yapılır, mevcut tarif buğday unu kullanıyor
- ingredient: kaynaklarda kuzu kıyma ve iç yağı öne çıkıyor, mevcut tarif dana kıyma, tereyağı ve sıvı yağ kullanıyor
- steps: kaynaklarda fırın böreği akışı var, mevcut tarif tavada kızartılan yufka rulosuna dönmüş
- allergen: kaynaklara göre SUT alerjeni gerekmeyebilir, mevcut tereyağı nedeniyle SUT eklenmiş

**Corrections** (sample):
- description: "Denizli yen böreği, mısır unlu mayalı hamur ve kıymalı içle fırında pişen yöresel bir börektir...."

### `dereotlu-patates-rosti-isvec-usulu`

**Reason**: Röşti adı İsviçre patates tavasına işaret ediyor; İsveç kodu ve başlık birlikte manuel review gerektiriyor.

**Issues**:
- title/description: röşti İsviçre kökenli bir ad; İsveç mutfağı iddiası yanıltıcı olabilir
- cuisine: desteklenen kodlarda İsviçre yok, manuel karar gerekir

**Corrections** (sample):
- description: "Dereotlu patates röşti, rendelenmiş patatesi tavada gevrekleştirerek yoğurtla sunulan sıcak bir kahvaltı tabağı çıkarır...."

### `domatesli-firik-pilavi-tekirdag-usulu`

**Reason**: Firik pilavı doğru, ancak Tekirdağ usulü iddiasını destekleyen kaynak bulunamadı; manuel review uygun.

**Issues**:
- description: firik pilavı genellikle Güneydoğu ve Anadolu bağlamında geçiyor; Tekirdağ atfı kaynakla doğrulanamadı

**Corrections** (sample):
- description: "Domatesli firik pilavı, firik bulguru domates ve tereyağıyla pişirerek isli, tane tane ve sofralık bir pilav kurar...."

### `eggs-benedict`

**Reason**: Klasik Eggs Benedict İngiliz muffin, poşe yumurta, hollandez ve Canadian bacon içerir; mevcut kayıt mutfak ve tag açısından yanıltıcı.

**Issues**:
- cuisine: Eggs Benedict Amerikan brunch klasiğidir; cuisine 'tr' yanıltıcı
- ingredients: klasik tarifte Canadian bacon veya jambon bulunur, mevcut ingredient listesinde yok
- tags: klasik Eggs Benedict etli olduğu için vejetaryen tag yanıltıcı

**Corrections** (sample):
- ingredients_add: 1

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `cizlak-balikesir-usulu` | medium | 1 | ingredients_add |
| `cizleme-trakya-usulu` | high | 4 | ingredients_add, totalMinutes, tags_remove |
| `clam-chowder-abd-sahil-usulu` | high | 1 | ingredients_add |
| `coban-salatasi` | high | 3 | ingredients_amount_change |
| `cokelekli-biber-dolmasi-mugla-usulu` | high | 2 | steps_replace |
| `cokelekli-corek-tokat-firin` | medium | 3 | ingredients_add, totalMinutes |
| `cokelekli-katmer-tokat-usulu` | medium | 2 | ingredients_add, totalMinutes |
| `cokelekli-pide-tokat-usulu` | medium | 1 | totalMinutes |
| `cokertme-kebabi-mugla-usulu` | high | 2 | allergens_add, totalMinutes |
| `com-tam` | high | 4 | ingredients_add, allergens_add, totalMinutes |
