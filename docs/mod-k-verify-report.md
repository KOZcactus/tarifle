# Mod K verify raporu

Okunan dosya: 4 batch
Toplam entry: 167

## Ozet (verdict)

- PASS: **56** (33.5%)
- CORRECTION: 101 (60.5%)
- MAJOR_ISSUE: 10 (6.0%)

## Confidence

- high: 103, medium: 60, low: 4

## Format integrity

- Apply'a hazir (clean format): **167**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `viyana-hashasli-erikli-kaiserschmarrn`

**Reason**: Kaiserschmarrn Avusturya tatlısıdır, Macar cuisine kodu yanıltıcı. Austria kodu yoksa de en yakın uygulanabilir kod olarak manuel review gerektirir.

**Issues**:
- cuisine: tarif Avusturya/Viyana Kaiserschmarrn kimliğinde ama cuisine hu yazilmis
- description: Avusturya usulü dese de cuisine kodu Macaristan'a bagli

**Corrections** (sample):

### `warsaw-kotlet-schabowy`

**Reason**: Pane et tekniği doğru olsa da kotlet schabowy kimliği domuz etiyle kurulur. Dana kullanımı ancak açıkça uyarlama diye belirtilirse yanıltıcılık azalır.

**Issues**:
- identity: kotlet schabowy klasik olarak domuz loin ile yapilir, mevcut tarif dana kontrfile kullaniyor
- description: dana uyarlama oldugunu belirtmedigi icin klasik Polonya yemeği gibi yanıltıyor

**Corrections** (sample):
- description: "Kotlet schabowy, bu tarifte dana kontrfileyle uyarlanan Polonya usulü çıtır pane et tabağıdır...."

### `xiao-long-bao`

**Reason**: Teknik olarak aspikli çorbalı mantı doğru. Fakat klasik kimlik domuz dolgulu olduğu için dana kullanımını açıklamamak kullanıcıyı yanıltır.

**Issues**:
- identity: klasik xiao long bao genelde domuz dolgulu çorbalı mantıdır, mevcut tarif dana kıyma kullanıyor
- description: dana uyarlama oldugunu belirtmedigi icin klasik Shanghai tarifi gibi duruyor

**Corrections** (sample):
- description: "Şanghay çorbalı mantısının dana uyarlaması; ince hamurda buharla eriyen et suyu jölesi saklar...."

### `yaglama-corbasi-kayseri-usulu`

**Reason**: Kaynaklar Kayseri yağlamasını kat kat şebit yemeği olarak veriyor. Mevcut çorba kimliği yapısal olarak yanıltıcı, manuel review gerekir.

**Issues**:
- identity: Kayseri yağlaması çorba değil, kıymalı harçla kat kat şebit/lavaş yemeğidir
- ingredients: step 1 150 gr kıyma diyor ama listede 250 gr var
- ingredients: step 3 tuz ve pul biber, step 5 yoğurt ve kuru nane kullanıyor ama listede yok

**Corrections** (sample):
- description: "Kayseri yağlama çorbası adıyla verilen bu içerik, klasik yağlamadan esinlenen kıymalı ve ekmekli serbest bir çorba uyarl..."
- ingredients_add: 4

### `yesil-soganli-omlet-banh-mi-tost-vietnam-usulu`

**Reason**: Omletli baget tek başına banh mi kimliği taşımaz. Banh mi için turşulu sebze, salatalık ve taze ot katmanı temel bağlamdır.

**Issues**:
- identity: banh mi tost adı kullanılıyor ama kaynaklardaki turşulu havuç, salatalık ve kişniş gibi temel sandviç öğeleri yok
- ingredients: mevcut tarif omletli baget olarak çalışır ama banh mi kimliği eksik

**Corrections** (sample):
- ingredients_add: 3

### `zeytin-ezmeli-lorlu-katmer-ayvalik-usulu`

**Reason**: Zeytin ve lorlu katmer teknik olarak yapılabilir, fakat Ayvalık usulü diye doğrulanamadı. Yöresel iddia manuel review gerektirir.

**Issues**:
- regional_identity: Ayvalık usulü zeytin ezmeli lorlu katmer için güvenilir kaynak karşılığı bulunamadı
- description: yöresel kesinlik iddiası kaynakla desteklenmiyor

**Corrections** (sample):
- description: "Zeytin ezmeli lorlu katmer, ince hamuru zeytin ezmesi ve lorla katlayarak gevrek, tuzlu ve kahvaltılık bir hamur işi sun..."

### `zeytin-yaprakli-lor-sarma-izmir-usulu`

**Reason**: Meze tekniği yapılabilir, fakat zeytin yaprağı ve İzmir usulü iddiası doğrulanamadı. Yapısal kaynak boşluğu manuel review gerektirir.

**Issues**:
- regional_identity: İzmir zeytin yapraklı lor sarma için güvenilir kaynak karşılığı bulunamadı
- steps: soğuk sarma tarifinde fırın veya orta ateş pişirmesi anlatılıyor

**Corrections** (sample):
- description: "Zeytin yapraklı lor sarma, lorlu içi salamura yaprağa sararak tuzlu, otlu ve küçük lokmalık bir meze yapar...."
- steps_replace: 4

### `zeytinli-keskek-aydin-bahce-usulu`

**Reason**: Keşkek buğdayla doğru, fakat zeytinli Aydın iddiası doğrulanamadı. Ayrıca bekletme ve dinlendirme süreleri toplam süreyi bozuyor.

**Issues**:
- regional_identity: Aydın zeytinli keşkek için güvenilir kaynak karşılığı bulunamadı
- totalMinutes: 30 dakika bekletme ve 10 dakika dinlendirme toplam süreye yansımıyor

**Corrections** (sample):
- description: "Zeytinli keşkek, dövme buğdayı yeşil zeytin ve zeytinyağıyla pişirerek hafif ekşili bir keşkek yorumu sunar...."

### `zeytinli-labneli-kahvalti-ekmegi-fas-usulu`

**Reason**: Labneh kahvaltı ve ekmekle Levant kaynaklarında destekleniyor. Fas atfı ve cuisine ma kodu doğrulanmadığı için manuel review gerekir.

**Issues**:
- cuisine_identity: labneh ve zeytinli kahvaltı ekmeği Levant çizgisine yakın, Fas usulü iddiası güçlü kaynakla desteklenmiyor
- regional_identity: cuisine ma manuel review gerektirir

**Corrections** (sample):
- description: "Zeytinli labneli kahvaltı ekmeği, sıcak ekmeği labne ve zeytinle buluşturarak yumuşak, tuzlu ve sade bir sabah tabağı ya..."

### `zingil-tatlisi-siirt-usulu`

**Reason**: Mevcut tarif hem pekmezli kimlik hem malzeme adım eşleşmesi açısından sorunlu. Şerbetli kızartma yapısı ve kalori daha yüksek olmalı.

**Issues**:
- identity: kaynaklar zingili limonlu şerbetli hamur tatlısı olarak veriyor, mevcut tarif pekmezli şerbet iddiası taşıyor
- ingredients: step 1 maya ve tuz kullanıyor ama ingredient listesinde yok
- ingredients: kaynaklarda hamurda yumurta ve kabartma tozu yaygın, mevcut listede yok
- nutrition: şerbetli kızartma tatlı için 244 kcal düşük, kaynak besin değeri daha yüksek

**Corrections** (sample):
- description: "Zingil tatlısı, yoğurtlu hamurun kızgın yağda küçük lokmalar halinde pişirilip limonlu şerbete alındığı bir hamur tatlıs..."
- ingredients_add: 4
- ingredients_remove: Pekmez
- steps_replace: 5

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `visneli-gelincik-serbeti-elazig-usulu` | medium | 2 | ingredients_add, totalMinutes |
| `visneli-irmik-kup-macar-usulu` | high | 2 | totalMinutes, tags_remove |
| `visneli-irmik-tatlisi-edirne-usulu` | high | 2 | totalMinutes, tags_remove |
| `visneli-kefir-icecegi-sakarya-usulu` | high | 2 | steps_replace |
| `visneli-komposto-cooler-polonya-usulu` | high | 2 | steps_replace |
| `visneli-kompot-polonya-usulu` | high | 1 | steps_replace |
| `visneli-lorlu-kup-edirne-usulu` | high | 4 | ingredients_add, allergens_add, totalMinutes |
| `visneli-syrniki-rus-usulu` | high | 1 | ingredients_add |
| `visneli-yogurt-shake` | medium | 2 | cuisine, description |
| `wattleseed-custard-kup-avustralya-usulu` | medium | 1 | totalMinutes |
