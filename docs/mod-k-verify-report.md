# Mod K verify raporu

Okunan dosya: 1 batch
Toplam entry: 50

## Ozet (verdict)

- PASS: **10** (20.0%)
- CORRECTION: 26 (52.0%)
- MAJOR_ISSUE: 14 (28.0%)

## Confidence

- high: 26, medium: 15, low: 9

## Format integrity

- Apply'a hazir (clean format): **50**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `sakizli-incir-kompostosu-mugla-usulu`

**Reason**: Teknik olarak yapılabilir ama Muğla usulü sakızlı incir kompostosu kimliği güvenli doğrulanamadı.

**Issues**:
- İncir kompostosu ve damla sakızı ayrı ayrı makul ama Muğla usulü özel kombinasyon güvenilir kaynakla desteklenmiyor.
- Soğuk servis ifadesi var fakat soğutma süresi steps ve totalMinutes içinde yok.

**Corrections** (sample):
- description: "Sakızlı incir kompostosu, kuru inciri hafif damla sakızı aromasıyla kaynatıp soğutarak tatlı ve serin bir içecek sunar...."
- steps_replace: 4

### `sakizli-kabak-cicegi-dolmasi-mugla-usulu`

**Reason**: Kabak çiçeği dolması kimliği doğru; damla sakızlı Muğla iddiası ve eksik ot baharat listesi güvenli değil.

**Issues**:
- Muğla kabak çiçeği dolması kaynaklarla destekleniyor ama damla sakızlı özel varyant güvenli doğrulanmıyor.
- Step 3 dereotu ve baharat diyor, ingredient listesinde yok.

**Corrections** (sample):
- description: "Kabak çiçeği dolması, pirinçli zeytinyağlı içle doldurulan narin Muğla ve Ege tabaklarından biridir...."
- ingredients_add: 3

### `sakizli-kavun-kasesi-cesme-usulu`

**Reason**: Malzeme uyumu mümkün; ancak Çeşme usulü yerel kimlik ve sakızlı kavun kasesi adı güvenli kaynaklanmıyor.

**Issues**:
- Çeşme usulü sakızlı kavun kasesi için güvenilir kaynak bulunmuyor; tarif yaratıcı tatlı kasesi gibi duruyor.
- 10 dakika soğutma totalMinutes içinde yok.

**Corrections** (sample):
- description: "Sakızlı kavun kasesi, soğuk kavunu yoğurt, bal ve çok az damla sakızıyla hafif bir yaz tatlısına dönüştürür...."

### `sakizli-lor-tatlisi-izmir-usulu`

**Reason**: Lor tatlısı kaynakları bu kaşık tatlısı formunu güçlü desteklemiyor; ad ve yapı ayrıştırılmalı.

**Issues**:
- İzmir lor tatlısı genellikle şerbetli veya fırınlanan yapıdayken mevcut tarif sütlü kaşık tatlısı gibi.
- Yerel ad ile tarif formu arasında kimlik uyuşmazlığı var.

**Corrections** (sample):
- description: "Sakızlı lor tatlısı, lor peynirini süt ve damla sakızıyla pişiren hafif, sütlü bir kaşık tatlısı uyarlamasıdır...."

### `sakizli-lorlu-gozleme-izmir-usulu`

**Reason**: Gözleme tekniği doğru olsa da sakızlı lorlu İzmir kimliği kaynaklanmadı; scaffold step dili de temizlenmeli.

**Issues**:
- Sakızlı lorlu gözleme ve İzmir usulü özel adlandırma güvenilir kaynakla doğrulanmıyor.
- Steps tarif adını tekrar eden scaffold cümleleri içeriyor.

**Corrections** (sample):
- description: "Sakızlı lorlu gözleme, lor peyniri ve maydanozlu içe çok az damla sakızı ekleyen gevrek bir tavada hamur işi uyarlamasıd..."
- steps_replace: 5

### `salatalikli-dereotlu-soguk-corba-isvec-usulu`

**Reason**: Temel soğuk çorba doğru; İsveç usulü iddiası ve zaman çizelgesi güvenli değil.

**Issues**:
- Salatalık, yoğurt ve dereotlu soğuk çorba kaynaklarla uyumlu ama İsveç usulü özel atıf güçlü desteklenmiyor.
- 30 dakika dinlendirme totalMinutes içinde yok.

**Corrections** (sample):
- description: "Salatalıklı dereotlu soğuk çorba, salatalığı yoğurt ve dereotuyla birleştirerek serin, temiz aromalı bir yaz kasesi hazı..."
- steps_replace: 6

### `salatalikli-naneli-pirinc-eristesi-salata-vietnam-usulu`

**Reason**: Pirinç eriştesi, salatalık ve nane doğru yönde; Vietnam kimliği için sos yapısı eksik.

**Issues**:
- Vietnam usulü pirinç eriştesi salatası için tipik sos balık sosu, sarımsak ve şeker içerir; mevcut liste çok eksik.
- Steps zeytinyağı ve tuzdan söz ediyor ama ingredient listesinde yok.

**Corrections** (sample):
- ingredients_add: 3
- steps_replace: 5

### `salcali-yarma-corbasi-batman-usulu`

**Reason**: Çorba tekniği tutarlı; Batman atfı ve kavurma malzemeleri güvenli seviyede değil.

**Issues**:
- Yarma ve salçalı çorba yapısı makul ama Batman usulü özel kimlik güvenilir kaynakla desteklenmiyor.
- Soğan salça kavurma adımı yağsız; tuz da listede yok.

**Corrections** (sample):
- description: "Salçalı yarma çorbası, dövme buğdayı salça, soğan ve nane ile kaynatarak koyu ve tok bir Anadolu çorbası yapar...."
- ingredients_add: 2

### `salgamli-narenciye-smash-adana-usulu`

**Reason**: Şalgam kimliği doğru; Adana usulü votkalı kokteyl iddiası yaratıcı uyarlama olarak etiketlenmeli.

**Issues**:
- Şalgam suyu Adana kaynaklıdır ama votkalı narenciye smash yerel gelenek olarak doğrulanmıyor.
- Steps tarif adını tekrar eden scaffold cümleleri içeriyor.

**Corrections** (sample):
- description: "Şalgamlı narenciye smash, şalgam suyunu portakal ve votkayla birleştiren tuzlu ekşi dengeli yaratıcı bir kokteyldir...."
- steps_replace: 4

### `samsun-kaz-tiridi`

**Reason**: Coğrafi işaretli Samsun tarifi mevcut içerikten farklı; bulgur pilavı eksikliği kimlik düzeyinde hata.

**Issues**:
- Samsun Kaz Tiridi coğrafi işaret kaynaklarında bulgur pilavı ve yufka ekmekle yapılır; mevcut tarif yoğurtlu tirit gibi.
- Bulgur pilavı ana bileşen olarak eksik.

**Corrections** (sample):
- description: "Samsun kaz tiridi, kaz eti, kaz suyuyla pişen bulgur pilavı ve yağlı yufka ekmekle kurulan kış yemeğidir...."
- ingredients_add: 3
- ingredients_remove: Yoğurt, Tereyağı
- steps_replace: 6

### `sanghay-susamli-dan-dan-noodle`

**Reason**: Malzeme yönü dan dan noodle ile uyumlu; Şanghay etiketi bölgesel kimlik hatası yaratıyor.

**Issues**:
- Dan dan noodle Şanghay değil Sichuan kökenli bir yemektir; bölgesel adlandırma yanıltıcı.
- Sos için sirke, sarımsak ve şeker gibi dengeleyici malzemeler eksik.

**Corrections** (sample):
- description: "Dan dan noodle, erişteyi acılı susamlı soya sosu, kıymalı üst ve taze soğanla kaplayan güçlü aromalı bir Çin erişte kase..."
- ingredients_add: 3

### `sanliurfa-borani-pazili`

**Reason**: Coğrafi işaretli borani yapısı mevcut tariften belirgin farklı; eksik et ve bakliyat kimlik hatası.

**Issues**:
- Şanlıurfa Pencer Boranısı coğrafi işaret kaynaklarında kuzu eti, pazı sapı, nohut, börülce ve kızarmış bulgur köftesi içerir.
- Mevcut tarifte kuzu eti, börülce ve isot yok; Urfa kimliği eksik.

**Corrections** (sample):
- description: "Şanlıurfa boranisi, pazı sapı, kuzu eti, nohut, börülce ve bulgur köftesiyle kurulan zahmetli bir yöresel yemektir...."
- ingredients_add: 4
- steps_replace: 6

### `sanliurfa-isotlu-ayran-asi`

**Reason**: Ayran aşı ve isot ayrı ayrı makul; Şanlıurfa isotlu ayran aşı adı ve yağ eksikliği güvenli değil.

**Issues**:
- Şanlıurfa isotlu ayran aşı özel adı güvenilir kaynakla desteklenmiyor.
- Step 5 yağda çevirme diyor ama ingredient listesinde yağ yok.

**Corrections** (sample):
- description: "İsotlu ayran aşı, buğday ve nohudu yoğurtla buluşturup isotlu yağla bitiren serin ama doyurucu bir çorba uyarlamasıdır...."
- ingredients_add: 2

### `santiago-misirli-pastel-de-choclo`

**Reason**: Yemek kimliği Şili ile net; mevcut mx cuisine kodu yapısal veri hatasıdır ve cuisine enum genişletmesi gerekir.

**Issues**:
- Pastel de choclo Şili yemeği; cuisine alanı mx olduğu için ülke kodu yanlış.
- Tarifle cuisine listesinde Şili kodu olmadığı için doğrudan güvenli cuisine correction yazılamıyor.
- Klasik tarifte çoğunlukla kuru üzüm ve bazen tavuk da bulunur; mevcut içerik sadeleştirilmiş.

**Corrections** (sample):
- description: "Şili usulü pastel de choclo, kıymalı harcı tatlı mısır püresi, zeytin, yumurta ve hafif baharatla kaplayan fırın yemeğid..."
- ingredients_add: 2

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `sakarya-islama-kofte-tabagi` | high | 2 | ingredients_add, steps_replace |
| `sakizli-badem-sutlac-cesme-usulu` | medium | 1 | totalMinutes |
| `sakizli-bademli-muhallebi-cesme-usulu` | medium | 2 | steps_replace, totalMinutes |
| `sakizli-erikli-muhallebi-cesme-usulu` | medium | 2 | ingredients_add, steps_replace, totalMinutes |
| `sakizli-incir-muhallebisi-cesme-usulu` | medium | 1 | totalMinutes |
| `sakizli-incir-parfe-cesme-usulu` | medium | 1 | totalMinutes |
| `sakizli-muhallebi-cesme-usulu` | high | 1 | totalMinutes |
| `salade-de-lentilles` | high | 2 | ingredients_add, steps_replace |
| `salade-lyonnaise` | high | 2 | ingredients_add, allergens_add, steps_replace |
| `salade-nicoise-fransiz-bistro-usulu` | high | 2 | ingredients_add, allergens_add, steps_replace |
