# Mod K verify raporu

Okunan dosya: 2 batch
Toplam entry: 100

## Ozet (verdict)

- PASS: **24** (24.0%)
- CORRECTION: 68 (68.0%)
- MAJOR_ISSUE: 8 (8.0%)

## Confidence

- high: 60, medium: 35, low: 5

## Format integrity

- Apply'a hazir (clean format): **100**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `moqueca-de-banana-brezilya-usulu`

**Reason**: Yemeğin genel moqueca çizgisi doğru; ancak ana malzeme adı ve eksik aromatikler kullanıcıyı yanlış ürüne yönlendirebilir.

**Issues**:
- Moqueca de banana kaynaklarda pişmeye dayanıklı banana da terra veya plantain ile yapılır; mevcut 'olgun muz' ifadesi tatlı sofra muzuna kayabilir.
- Biber, zeytinyağı, tuz, acı biber, dende yağı ve kişniş step akışında var ama ingredient listesinde yok.
- Ingredient ad değişimi mevcut Mod K correction şemasında doğrudan güvenli uygulanamadığı için manuel review gerekir.

**Corrections** (sample):
- description: "Brezilya moqueca de banana, plantaini domates, biber, Hindistan cevizi sütü ve dende yağıyla pişiren sebze yemeğidir...."
- ingredients_add: 6

### `mugla-sundirme`

**Reason**: Yöresel kimlik çelişkisi var; mevcut peynirli versiyon Muğla resmi tanımıyla uyuşmadığı için otomatik apply uygun değil.

**Issues**:
- Muğla kaynakları sündürmeyi turp otlu nar ekşili yemek ve peynirli mısır unlu kahvaltılık olarak iki farklı çizgide anlatıyor.
- Mevcut tarif peynirli çizgiye yakın, ancak description bu kaynak ayrımını ve mısır unu eksikliğini netleştirmiyor.
- Bu fark basit ingredient ekleme ile güvenli çözülemez, manuel identity review gerekir.

**Corrections** (sample):
- description: "Muğla sündürmesi kaynaklarda peynirli kahvaltılık ve turp otlu ekşili yemek olarak iki çizgide geçer...."

### `mugla-susamli-kabak-cicegi-boregi`

**Reason**: Kabak çiçeği ve yufkalı börek fikri mümkün; fakat Muğla ve susamlı özgül iddiası bağımsız kaynakla desteklenmiyor.

**Issues**:
- Muğla özelinde susamlı kabak çiçeği böreği için bağımsız güvenilir kaynak bulunamadı.
- Step 2 dereotu, taze soğan ve zeytinyağı kullanıyor ama ingredient listesinde yok.
- Yöresel atıf doğrulanmadan yalnızca eksik malzeme eklemek tarif kimliğini güvenli hale getirmiyor.

**Corrections** (sample):
- ingredients_add: 4

### `muhallebili-elma-tatlisi-kastamonu-usulu`

**Reason**: Tatlı yapısı genel olarak doğru; sorun Kastamonu yöresel etiketi ve eksik muhallebi tatlandırıcılarıdır.

**Issues**:
- Muhallebili elma tatlısı için genel kaynaklar var, ancak Kastamonu usulü iddiasını destekleyen güvenilir kaynak bulunamadı.
- Muhallebi kısmında toz şeker ve vanilya gibi temel öğeler ingredient listesinde yok.
- Yöresel atıf doğrulanmadan otomatik correction ile prod'a uygulanması riskli.

**Corrections** (sample):
- description: "Muhallebili elma tatlısı, elmayı tarçınla yumuşatıp sütlü muhallebiyle katmanlayan hafif bir meyveli tatlıdır...."
- ingredients_add: 2

### `murtuga-pide-tostu-kars-usulu`

**Reason**: Temel murtuğa tekniği biliniyor; ancak bu slugdaki Kars pide tostu kimliği kaynakla doğrulanmadığı için manuel mini rev gerekir.

**Issues**:
- Murtuğa kaynaklarda Van, Hakkari, Ağrı, Ahlat hattında un, tereyağı ve yumurtayla yapılan kahvaltılık olarak geçiyor; Kars ve pide tostu iddiası desteklenmiyor.
- Mevcut tarif murtuğayı pide içine koyan türetilmiş bir tost gibi duruyor, bu özgül kimlik için güvenilir kaynak bulunamadı.
- Bu durum basit malzeme ekleme değil, tarif adı ve yöresel kimlik sorunu.

**Corrections** (sample):
- description: "Murtuğa, unun tereyağında kavrulup yumurtayla pişirildiği Doğu Anadolu kahvaltılığıdır; pide tostu ve Kars atfı için ayr..."

### `palamutlu-pazi-diblesi-samsun-usulu`

**Reason**: Teknik olarak yenebilir bir yemek olsa da Samsun usulü palamutlu pazı diblesi iddiası sağlam kaynakla teyit edilemedi.

**Issues**:
- Palamutlu pazı diblesi için güvenilir iki kaynakla Samsun kimliği doğrulanamadı.
- Mevcut tarifte pirinçli pazı yemeğine palamut eklenmiş gibi duruyor; yöresel iddia manuel review gerektiriyor.

**Corrections** (sample):
- description: "Pazı, pirinç ve palamutla hazırlanan hafif sulu bir Karadeniz tencere yemeği uyarlamasıdır...."

### `papatya-limon-serbeti-yalova-usulu`

**Reason**: İçecek tekniği doğru görünse de Yalova yöresel iddiası kaynaklanmadığı için kullanıcıya kesin bilgi gibi sunulmamalı.

**Issues**:
- Yalova'ya özgü papatya limon şerbeti iddiası güvenilir iki kaynakla doğrulanamadı.
- Tarif papatya-limon infüzyonu olarak uygulanabilir ama yöresel atıf manuel review gerektiriyor.

**Corrections** (sample):
- description: "Papatya limon şerbeti, kurutulmuş papatyayı limon ve şekerle demleyerek hazırlanan çiçeksi, serin bir içecektir...."

### `papatyali-soguk-limonata-yalova-usulu`

**Reason**: Tarif içecek olarak makul; yöresel iddia ve mevcut scaffold adımlar güvenilirlik sorunu yaratıyor.

**Issues**:
- Yalova usulü papatyalı soğuk limonata iddiası güvenilir iki kaynakla doğrulanamadı.
- Steps genel içecek scaffold dili taşıyor ve papatyanın demleme yöntemi net değil.

**Corrections** (sample):
- description: "Papatyalı soğuk limonata, limon suyunu kısa demlenmiş papatya ve şekerle buluşturan çiçeksi bir yaz içeceğidir...."
- steps_replace: 3

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `mizeria-polonya-yaz-usulu` | high | 2 | ingredients_add, totalMinutes |
| `mocha` | medium | 1 | steps_replace |
| `mojo-black-bean-bowl-kuba-usulu` | medium | 2 | ingredients_add, averageCalories, protein, carbs, fat |
| `mojo-patates-kuba-usulu` | high | 2 | ingredients_add, cookMinutes, totalMinutes |
| `mole-poblano` | high | 2 | ingredients_add |
| `moong-dal-chilla` | high | 2 | ingredients_add, prepMinutes, cookMinutes, totalMinutes, steps_replace |
| `moqueca` | high | 2 | ingredients_add, totalMinutes |
| `moqueca-de-palmito-brezilya-usulu` | medium | 1 | ingredients_add |
| `moros-y-cristianos-kuban-usulu` | high | 2 | ingredients_add |
| `mors-frambuazli-rus-usulu` | high | 2 | steps_replace |
