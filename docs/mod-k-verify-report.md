# Mod K verify raporu

Okunan dosya: 3 batch
Toplam entry: 150

## Ozet (verdict)

- PASS: **80** (53.3%)
- CORRECTION: 64 (42.7%)
- MAJOR_ISSUE: 6 (4.0%)

## Confidence

- high: 104, medium: 43, low: 3

## Format integrity

- Apply'a hazir (clean format): **150**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `bastilla`

**Reason**: Tarif Fas bastilla olarak doğru okunuyor; ancak cuisine kodu tr ve birkaç temel aromatik listede yok, manuel review gerekir.

**Issues**:
- cuisine: Fas bastilla tarifi tr olarak işaretlenmiş, köken ve mutfak kodu yanıltıcı
- step 1: soğan, zencefil ve safran diyor ama ingredient listesinde yok
- servingSuggestion: pudra şekeri diyor ama ingredient listesinde yok

**Corrections** (sample):
- ingredients_add: 4

### `bat-tokat-usulu`

**Reason**: Mevcut tarif bat adını taşıyor ama mercimek ve ceviz eksikliği tarif karakterini bozuyor; bu yüzden manuel review gerekli.

**Issues**:
- Tokat bat kaynaklarında yeşil mercimek ve ceviz ana unsurlar arasında; mevcut tarifte ikisi de yok
- step 2: zeytinyağı diyor ama ingredient listesinde yok
- description tarifin sulu mercimekli bat karakterini eksik aktarıyor

**Corrections** (sample):
- ingredients_add: 4

### `beef-stroganoff-klasik`

**Reason**: Stroganoff içeriği genel olarak doğru; ancak yanlış cuisine kodu ve eksik hardal, un, et suyu manuel review gerektiriyor.

**Issues**:
- cuisine: klasik Rus stroganoff tarifi tr koduyla işaretlenmiş
- step 1: un kullanıyor ama ingredient listesinde yok ve GLUTEN alerjeni beyan edilmemiş
- step 4: hardal ve et suyu diyor ama ingredient listesinde yok

**Corrections** (sample):
- ingredients_add: 3

### `beijinho`

**Reason**: Yoğunlaştırılmış süt, Hindistan cevizi, tereyağı ve karanfil doğru; tek kritik hata Brezilya tatlısının tr koduyla gelmesi.

**Issues**:
- cuisine: Brezilya beijinho tarifi tr koduyla işaretlenmiş, köken bilgisi yanıltıcı

**Corrections** (sample):

### `berlin-cavdarli-mantar-tostu`

**Reason**: Çavdar ekmeği, mantar, hardal ve peynirli tost makul; fakat Berlin/Alman iddiası gb cuisine koduyla çelişiyor.

**Issues**:
- cuisine: başlık ve description Alman/Berlin usulü diyor ama cuisine gb olarak işaretlenmiş

**Corrections** (sample):

### `bostana-bulgur-salatasi-sanliurfa-usulu`

**Reason**: Kaynaklarda bostana bulgursuz, çok ince doğranmış sebzeli ve ekşi sulu salata; mevcut kayıt kısır benzeri olduğu için manuel review gerekir.

**Issues**:
- Şanlıurfa bostanası kaynaklarda ince doğranmış sebze, nar ekşisi, limon ve yeşillikle yapılır; bulgur temel malzeme değildir
- slug ve title bulgur dediği için basit partial correction sonrası kayıt adıyla içerik arasında çelişki kalabilir

**Corrections** (sample):
- description: "Şanlıurfa bostanası, ince doğranmış domates, salatalık, biber ve yeşilliklerin nar ekşisiyle suluca karıştığı ferah sala..."
- ingredients_add: 4
- ingredients_remove: İnce bulgur

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `barramundi-sebze-tepsi-avustralya-usulu` | high | 2 | ingredients_add, steps_replace |
| `barramundi-taco-avustralya-sahil-usulu` | high | 2 | steps_replace |
| `barramundi-tava-avustralya-usulu` | high | 3 | ingredients_add |
| `barszcz-czerwony-polonya-usulu` | high | 1 | servingSuggestion |
| `basbousa` | high | 1 | totalMinutes |
| `batata-harra-beyrut-usulu` | high | 1 | ingredients_add |
| `beef-chow-fun` | high | 3 | ingredients_add |
| `beetroot-burger-avustralya-usulu` | high | 1 | ingredients_add |
| `beetroot-feta-fritter-avustralya-usulu` | medium | 2 | ingredients_add |
| `beghrir` | high | 2 | ingredients_add, allergens_add |
