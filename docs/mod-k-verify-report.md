# Mod K verify raporu

Okunan dosya: 3 batch
Toplam entry: 150

## Ozet (verdict)

- PASS: **44** (29.3%)
- CORRECTION: 95 (63.3%)
- MAJOR_ISSUE: 11 (7.3%)

## Confidence

- high: 93, medium: 53, low: 4

## Format integrity

- Apply'a hazir (clean format): **150**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `toronto-akcaagacli-yulaf-bar`

**Reason**: Akçaağaçlı yulaf bar yapısı tutarlı, fakat Toronto ve Kanada iddiası us cuisine koduyla çelişiyor. Kod ekseni manuel review ister.

**Issues**:
- cuisine: description Kanada ve Toronto bağlamı kuruyor ama cuisine us kayıtlı
- cuisine: mevcut enumda Kanada kodu olmadığı için manuel karar gerekir

**Corrections** (sample):
- description: "Akçaağaçlı yulaf bar, yulafı ceviz, kuru üzüm ve akçaağaç şurubuyla dilimlenen pratik bir tatlıya çevirir...."

### `tursulu-kavrulmus-lahana-rize-usulu`

**Reason**: Turşu kavurma kimliği Rize için güçlü, fakat mevcut beyaz lahana ana omurgası kaynaklarla desteklenmiyor. Manuel review uygun.

**Issues**:
- identity: Rize kaynaklarında turşu kavurması fasulye turşusu ekseninde geçiyor, beyaz lahana ana malzeme olarak doğrulanamadı
- steps: peynirli doku ve servis tabağı hazırlığı gibi ilgisiz boilerplate var

**Corrections** (sample):
- description: "Rize usulü turşu kavurması, fasulye turşusunu soğanla kavuran ekşi ve sıcak bir Karadeniz tabağıdır...."
- ingredients_remove: Beyaz lahana

### `tutlu-yarma-corbasi-erzincan-usulu`

**Reason**: Yarma çorbası ve kuru dut kullanımı ayrı ayrı bilinir, fakat bu Erzincan kimliği doğrulanamadı. İçerik de vegan etiketle çelişiyor.

**Issues**:
- identity: Erzincan dutlu yarma çorbası için güvenilir iki kaynakla yöresel doğrulama yapılamadı
- ingredients: step 4 tereyağı kullanıyor ama ingredient listesinde yok
- tags: stepte tereyağı kullanıldığı halde vegan etiketi var

**Corrections** (sample):
- ingredients_add: 1

### `urfa-agzi-acik`

**Reason**: Bu entry kimlik olarak Urfa ağzı açık, fakat malzeme ve step kalitesi apply öncesi manuel bakış gerektirecek kadar eksik.

**Issues**:
- ingredients: Urfa ağzı açık için kıymalı harçta biber, baharat ve yağ eksik; mevcut liste dört malzemeyle yetersiz
- steps: mevcut adımlar otomatik ve belirsiz; kızartma, harç ve hamur kapatma biçimi doğru anlatılmıyor
- tipNote: çorba terbiyesiyle ilgili, bu tarifle ilgisiz

**Corrections** (sample):
- tipNote: "Harcı ince yaymak hamurun içini çiğ bırakmadan kızartır...."
- ingredients_add: 4
- steps_replace: 5

### `uunijuusto`

**Reason**: Uunijuusto kimliği ve ülke eşleşmesi yapısal sorunlu. Tarifle'de Finlandiya cuisine kodu olmadığı için manuel review gerekli.

**Issues**:
- identity: uunijuusto Finlandiya süt tatlısıdır; cuisine se İsveç olarak kayıtlı
- ingredients: klasik tarif kolostrum sütü veya sütlü yumurtalı karışım üzerine kurulu, lor peyniri omurgası kimliği bozuyor
- schema: Tarifle cuisine listesinde fi kodu yoksa manuel cuisine kararı gerekir

**Corrections** (sample):
- description: "Uunijuusto, Finlandiya mutfağında sütlü karışımın fırında kesilip yumuşak bir tatlıya dönüştüğü sade bir fırın tatlısıdı..."
- ingredients_remove: Lor peyniri

### `uzum-hosafi-kayisi-cekirdekli-nevsehir-usulu`

**Reason**: Üzüm hoşafı doğru, fakat kayısı çekirdeği ve Nevşehir iddiası yeterince net değil. Generic steps de apply öncesi riskli.

**Issues**:
- steps: mevcut üç adım generic, kuru üzüm hoşafı pişirme akışını anlatmıyor
- identity: kayısı çekirdeği kullanımı gıda güvenliği ve yöre doğrulaması açısından manuel review gerektirir
- totalMinutes: üzüm hoşafı için pişirme süresi verilmediği halde cookMinutes 10

**Corrections** (sample):
- steps_replace: 4

### `uzum-pekmezli-keskek-manisa-usulu`

**Reason**: Keşkek adı güçlü bir geleneksel yemeğe işaret ediyor. Bu tatlı kahvaltı yorumu kaynakla zayıf, bu yüzden MAJOR ve manuel review uygun.

**Issues**:
- identity: keşkek kaynaklarda dövme buğdayın uzun piştiği tören yemeği, üzüm pekmezli kahvaltı versiyonu Manisa için doğrulanamadı
- steps: tava ısıtma ve otomatik servis cümleleri buğday lapası akışına uymuyor

**Corrections** (sample):
- description: "Üzüm pekmezli dövme buğday kasesi, haşlanmış buğdayı pekmez, ceviz ve tarçınla tatlandıran sıcak bir kahvaltılık olarak ..."
- steps_replace: 4

### `uzum-sirali-feslegen-icecegi-yalova-usulu`

**Reason**: İçecek fikri uygulanabilir, fakat yöresel iddia ve mevcut generic steps güven vermiyor. Apply öncesi manuel karar gerekir.

**Issues**:
- steps: üç adım tamamen generic, üzüm şırası ve fesleğenle gerçek içecek yapımını anlatmıyor
- identity: Yalova usulü üzüm şıralı fesleğen içeceği için iki güvenilir kaynakla doğrulama yapılamadı

**Corrections** (sample):
- description: "Üzüm şıralı fesleğen içeceği, üzüm şırasını soğuk su, fesleğen ve buzla karıştıran serin bir ev içeceğidir...."
- steps_replace: 3

### `van-keledoslu-bulgur-asi`

**Reason**: Keledoş tescilli Van yemeği olarak etli, nohutlu, dövmeli, akpancarlı ve kurutlu tanımlanıyor. Mevcut tarif bu kimliği önemli ölçüde kaçırıyor.

**Issues**:
- identity: Van keledoşu kaynaklarda et, nohut, mercimek, dövme, akpancar ve kurutla tanımlanıyor
- ingredients: mevcut tarifte et, akpancar veya pazı ve nohut yok
- description: keledoş adıyla sunulan içerik daha çok kurutlu mercimekli bulgur aşı gibi duruyor

**Corrections** (sample):
- description: "Van keledoşlu bulgur aşı, kurut, mercimek, nohut, et ve yöresel otlarla yoğunlaşan doyurucu bir Doğu Anadolu yemeğidir...."
- ingredients_add: 3

### `vatapa`

**Reason**: Vatapa kimliği karides, ekmek, Hindistan cevizi sütü, yer fıstığı ve palm yağıyla doğru. Tip ve servis alanlarında açık veri karışması var.

**Issues**:
- ingredients: step 2 kaju, step 3 soğan, sarımsak, zencefil ve palm yağı kullanıyor ama listede yok
- allergens: kaju eklenirse KUSUYEMIS beyanı gerekir
- tipNote: tavuk kurutma notu vatapa ile ilgisiz
- servingSuggestion: kuzu dilimleme cümlesi veri bozulması gibi duruyor

**Corrections** (sample):
- tipNote: "Ekmekli karışımı kısık ateşte sürekli karıştırın; tabana tutarsa vatapa pütürlü olur...."
- ingredients_add: 6

### `visneli-cevizli-kesme-tatlisi-tekirdag-usulu`

**Reason**: Tarif kaynaklardaki vişneli yoğurtlu kek yapısına benziyor. Tekirdağ kesme tatlısı iddiası bu içerikle doğrulanamadığı için manuel review gerekli.

**Issues**:
- identity: mevcut yapı vişneli cevizli yoğurtlu kek gibi, kesme tatlısı veya Tekirdağ yöresi iddiası kaynakla desteklenmiyor
- description: Trakya çay saati ve kesme tatlısı iddiası yanıltıcı olabilir
- steps: şerbet, kesme hamur veya yöresel teknik yok

**Corrections** (sample):
- description: "Vişneli cevizli yoğurtlu kek, yumuşak hamuru vişne ve cevizle birleştiren, dilimlenerek servis edilen pratik bir çay saa..."

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `tom-yum` | high | 2 | ingredients_add |
| `tomato-egg-stir-fry-cin-ev-usulu` | high | 2 | steps_replace |
| `tomato-rasam-hint-usulu` | high | 2 | ingredients_add |
| `tonkatsu` | high | 2 | steps_replace, tipNote |
| `tonkatsu-sos` | medium | 2 | tags_remove, allergens_add |
| `tortilla-de-camarones-ispanya-usulu` | high | 2 | steps_replace |
| `tortilla-espanola` | high | 1 | steps_replace |
| `tosca-kaka` | high | 2 | ingredients_add, steps_replace |
| `tostones-con-mojo` | high | 2 | ingredients_add, steps_replace |
| `tostones-rellenos` | medium | 2 | steps_replace |
