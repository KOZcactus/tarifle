# Mod K verify raporu

Okunan dosya: 5 batch
Toplam entry: 250

## Ozet (verdict)

- PASS: **65** (26.0%)
- CORRECTION: 133 (53.2%)
- MAJOR_ISSUE: 52 (20.8%)

## Confidence

- high: 145, medium: 77, low: 28

## Format integrity

- Apply'a hazir (clean format): **250**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `sumakli-kuru-dolma-pilavi-bitlis-usulu`

**Reason**: Kuru sebze, bulgur ve ekşi lezzet uyumlu; ancak kaynaklar bunu pilav değil dolma olarak anlatıyor, Bitlis iddiası da net destek bulmuyor.

**Issues**:
- Kaynaklar kuru patlıcan ve kuru biberi doldurulan kuru dolma olarak verir; mevcut içerik dolma içinden türetilmiş pilav gibi duruyor.
- Bitlis yöre atfı iki kaynakla doğrulanamadı, kimlik iddiası zayıf.

**Corrections** (sample):
- description: "Kuru biber ve patlıcanla yapılan bu tabak, kuru dolma içini bulgurla pişiren ekşili bir tencere pilavı uyarlamasıdır...."

### `sumakli-mahluta-corbasi-mardin-usulu`

**Reason**: Mercimekli çorba fikri doğru ama Mardin mahluta için bulgur veya pirinç eksik; sumaklı yöre iddiası net kaynakla desteklenmiyor.

**Issues**:
- Mardin mahluta kaynaklarında mercimeğe bulgur veya pirinç eşlik ediyor; mevcut tarifte bu gövde yok.
- Kaynaklar ekşiliği daha çok nar ekşisi veya limonla verir; sumaklı Mardin kimliği doğrulanamadı.

**Corrections** (sample):
- ingredients_add: 3

### `sumakli-nohut-corbasi-mardin-usulu`

**Reason**: Nohut çorbası iskeleti makul; ancak yağ ve tuz eksik, Mardin sumaklı kimlik iddiası kaynaklarla yeterince kurulamadı.

**Issues**:
- Nohut çorbası kaynakları soğan, yağ ve çoğu zaman sarımsak veya sebze tabanı kullanır; mevcut listede yağ yok.
- Mardin sumaklı nohut çorbası kimliği iki kaynakla doğrulanamadı.

**Corrections** (sample):
- ingredients_add: 3

### `sumakli-soganli-tavuk-tepsi-orta-dogu-usulu`

**Reason**: Sumaklı tavuk ve soğan fikri doğru; fakat fırın tepsi, orta ateş ve kuzu servis cümlesi aynı tarifte ciddi kimlik bozulması yaratıyor.

**Issues**:
- Orta Doğu sumaklı tavuk kaynakları musakhan çizgisinde soğan, zeytinyağı, sumak ve çoğunlukla ekmek tabanı içerir.
- Mevcut tarif fırın etiketli ama step 4 orta ateşte pişirme diyor; tepsi yemeği kimliği teknik olarak tutarsız.
- Servis önerisi kuzu pembesi tabak diyor, tavuk tarifiyle ilgisiz.

**Corrections** (sample):
- ingredients_add: 2

### `sumakli-yumurta-kapama-kilis-usulu`

**Reason**: Yumurta ve sumak fikri uygulanabilir ama kapama kimliği zayıf; klasik kapama haşlanmış yumurta ve tereyağlı baharat tabanına daha yakın.

**Issues**:
- Yumurta kapama kaynakları genelde haşlanmış yumurtayı tereyağlı baharatlı sosla verir; mevcut tarif tavada kırılmış yumurta gibi.
- Kilis sumaklı kapama kimliği iki kaynakla doğrulanamadı.

**Corrections** (sample):
- ingredients_add: 1

### `susamli-biber-dizmesi-kocaeli-usulu`

**Reason**: Biber, zeytinyağı ve susam uyumlu ama yöresel kimlik desteklenmiyor; mevcut adımlar biber hazırlığını doğru tarif etmiyor.

**Issues**:
- Kocaeli susamlı biber dizmesi kimliği iki kaynakla doğrulanamadı.
- Adımlar biber dizmesi yerine genel harç toparlama şablonu gibi; biberin közlenmesi veya fırınlanması net değil.

**Corrections** (sample):
- steps_replace: 3

### `susamli-kabak-corbasi-japon-usulu`

**Reason**: Kabak ve susam çorba olarak uygulanabilir; Japon kimliği zayıf, en azından soya sosu gibi bağlayıcı bir malzeme olmadan iddia eksik.

**Issues**:
- Japon usulü kabak çorbası kimliği iki kaynakla doğrulanamadı; Japon kabak çorbaları çoğunlukla kabocha ile anılır.
- Mevcut tarifte kabak türü belirsiz ve miso, dashi veya soya gibi Japon bağlamını kuran unsur yok.

**Corrections** (sample):
- ingredients_add: 1

### `suspiro-limeno-peru-lima-usulu`

**Reason**: Tatlı kimliği tanınabilir ama yumurta sarısı, porto şarabı ve daha uzun sütlü krema pişirme süresi olmadan Lima klasiği eksik kalıyor.

**Issues**:
- Suspiro limeño kaynaklarında kremada yumurta sarısı, üstte ise porto şaraplı şerbetle yapılan beze bulunur.
- Mevcut tarifte yumurta sarısı ve porto şarabı yok; yalnız süt, şeker ve yumurta akı kimliği eksik bırakıyor.
- Sütlü krema 12 dakika pişirme kaynaklardaki 30 dakika civarı koyulaştırma süresine göre düşük.

**Corrections** (sample):
- ingredients_add: 3

### `sutlu-hurmali-ekmek-kasigi-kirklareli-usulu`

**Reason**: Ekmek, süt ve hurma uyumu makul; ancak Kırklareli ve klasik tarif kimliği için yeterli kaynak bulunamadı.

**Issues**:
- Sütlü ekmek tatlısı ve hurmalı tatlı fikri kaynaklarla ayrı ayrı destekleniyor, Kırklareli yöre kimliği doğrulanamadı.
- Mevcut tarif fırında pişen sütlü ekmek tatlısından çok hızlı süt dökülen ekmek kupu gibi duruyor.

**Corrections** (sample):
- description: "Sütlü hurmalı ekmek kaşığı, yumuşak ekmeği hurmalı süt sosuyla ıslatan pratik bir kaşık tatlısı uyarlamasıdır...."

### `sutlu-kete-bingol-usulu`

**Reason**: Bingöl ketesi için sütlü ve mayalı hamur kaynakla doğrulanıyor; mevcut içerik ana hamur malzemelerini eksik bırakıyor.

**Issues**:
- Bingöl ketesi kaynaklarında maya, yumurta, tuz ve uzun dinlenme var; mevcut tarifte maya, yumurta ve tuz yok.
- Steps içinde peynirli doku deniyor ama tarifte peynir bulunmuyor.

**Corrections** (sample):
- ingredients_add: 3
- steps_replace: 2

### `tacos-al-pastor`

**Reason**: Al pastor kimliği domuz eti ve uzun biberli marinasyonla kuruluyor; dana versiyon ancak açık uyarlama olarak güvenli.

**Issues**:
- Al pastor kaynakları domuz eti, achiote ve kurutulmuş biber marinasyonunu temel alıyor; mevcut tarif dana etiyle klasik kimliği bozuyor.
- TipNote aynı anda kısa marine ve dört saat bekleme söylüyor, step süreleriyle çelişiyor.

**Corrections** (sample):
- description: "Tacos al pastor, ananaslı biber marineli etin mısır tortillasında soğan ve lime ile sunulduğu Meksika tacosudur...."
- tipNote: "Dana kullanılıyorsa tarifi klasik al pastor değil, ev tipi uyarlama olarak anlatın...."
- steps_replace: 1

### `taflan-tursulu-patates-tava-ordu-usulu`

**Reason**: Taflan turşusu Ordu kaynağıyla var; patatesli versiyon özgün tarif gibi değil, yerel uyarlama olarak ele alınmalı.

**Issues**:
- Ordu taflan turşusu kaynağı soğanla kavurma verir, patatesli tava kimliği iki kaynakla desteklenemedi.
- Steps tamamen genel aperatif şablonu gibi, patates kızartma ve taflan turşusunu ayrı ekleme akışını anlatmıyor.

**Corrections** (sample):
- ingredients_add: 2
- steps_replace: 2

### `tahin-pekmezli-nevzine-kup-kayseri-usulu`

**Reason**: Nevzine kimliği hamur, ceviz, tahin ve pekmezli şerbetle kuruluyor; kup versiyonu ancak uyarlama olarak doğru.

**Issues**:
- Nevzine kaynakları fırında pişen tahinli, cevizli hamur ve pekmezli şerbet verir; mevcut tarif bisküvili kup.
- Vegan etiketi bisküvi içeriği belirsiz olduğu için riskli, ayrıca klasik nevzine kimliği korunmuyor.

**Corrections** (sample):
- description: "Tahin pekmezli nevzine kup, Kayseri nevzinesinin tahin, pekmez ve ceviz tadını bisküvili bardak tatlısına taşıyan bir uy..."

### `tahinli-isotlu-kabak-dip-adiyaman-usulu`

**Reason**: Kabak ve tahin mezesi doğru zeminde; Adıyaman isot kimliği zayıf, ayrıca şablon step listeyle çelişiyor.

**Issues**:
- Tahinli kabak mezesi kaynakla destekleniyor, Adıyaman isotlu yöre kimliği iki kaynakla doğrulanamadı.
- Steps sarımsak, yoğurt ve zeytinyağı olasılığı söylüyor ama mevcut tarif vegan ve bu malzemelerin bir kısmı listede yok.

**Corrections** (sample):
- ingredients_add: 2
- steps_replace: 2

### `tahinli-isotlu-koplenmis-biber-ezme-adiyaman-usulu`

**Reason**: Köz biber, tahin ve isot uyarlama olarak makul; ad, yöre ve step akışı hatalı biçimde kurulmuş.

**Issues**:
- Başlıkta 'köplenmiş', description içinde 'köpüklenmiş' geçiyor; kaynak ve mutfak dili közlenmiş bibere işaret ediyor.
- Adıyaman isotlu tahinli biber ezmesi kimliği iki kaynakla doğrulanamadı, mevcut step haşlama şablonu köz biberle uyumsuz.

**Corrections** (sample):
- description: "Tahinli isotlu közlenmiş biber ezme, köz kapya biberi tahin ve isotla birleştiren sürülebilir bir meze uyarlamasıdır...."
- steps_replace: 2

### `tahinli-nohutlu-piyaz-antalya-usulu`

**Reason**: Antalya piyazı fasulyeli ve çoğu kaynakta yumurtalı; nohutlu vegan tarif ancak açık uyarlama olarak kalmalı.

**Issues**:
- Antalya piyazı kaynakları kuru fasulye, tahinli sos ve yumurta verir; mevcut tarif nohutlu vegan salata.
- Step 3 zeytinyağı söylüyor ama ingredient listesinde zeytinyağı yok.

**Corrections** (sample):
- description: "Tahinli nohutlu piyaz, Antalya piyazının tahinli sosundan ilham alan nohutlu bir salata uyarlamasıdır...."
- ingredients_add: 1

### `tahinli-patlican-corbasi-hatay-usulu`

**Reason**: Köz patlıcan ve tahin uyumu gerçek; çorba ve Hatay iddiası kaynakla zayıf, vegan servis de korunmalı.

**Issues**:
- Kaynaklar tahinli köz patlıcan salatası veya meze yapısını destekliyor, Hatay tahinli patlıcan çorbası iki kaynakla doğrulanamadı.
- Servis önerisi yumurta ekliyor, vegan etiketiyle çelişiyor.

**Corrections** (sample):
- description: "Tahinli patlıcan çorbası, köz patlıcan ve tahinli sosu sıcak çorba formuna taşıyan bir ev uyarlamasıdır...."

### `tahinli-peynirli-pide-tekirdag-usulu`

**Reason**: Tahinli pide geleneği kaynakla var; peynirli Tekirdağ yorumu klasik veya yöresel tarif olarak doğrulanamadı.

**Issues**:
- Tahinli pide kaynakları tatlı veya tahinli hamur işi verir; beyaz peynirli Tekirdağ kimliği iki kaynakla doğrulanamadı.
- Tarif tahinli pide ile peynirli pideyi birleştiriyor, klasik kimlik belirsizleşiyor.

**Corrections** (sample):
- description: "Tahinli peynirli pide, klasik tahinli pideye beyaz peynir ekleyen tatlı tuzlu bir fırın işi uyarlamasıdır...."

### `tahinli-portakal-cilbiri-antalya-usulu`

**Reason**: Poşe yumurta tekniği doğru olsa da çılbır kimliği ve Antalya tahin portakal iddiası zayıf kaynaklı.

**Issues**:
- Çılbır kaynakları yoğurtlu poşe yumurta yapısını temel alır; tahin ve portakal soslu Antalya kimliği doğrulanamadı.
- Tarif çılbır adını taşısa da yoğurt yok ve klasik teknikten uzak.

**Corrections** (sample):
- description: "Tahinli portakal çılbırı, poşe yumurtayı tahinli portakal sosuyla servis eden Akdeniz esintili bir kahvaltı uyarlamasıdı..."

### `tahinli-soganlama-kayseri-usulu`

**Reason**: Tahinli soğan mezesi fikri var; Kayseri tahinli soğanlama adıyla yöresel tarif güvenle doğrulanamadı.

**Issues**:
- Kayseri kaynakları tahinli pide ve yağlama gibi yemekleri destekliyor; tahinli soğanlama kimliği iki kaynakla doğrulanamadı.
- Mevcut tarif daha çok tahinli soğan mezesi veya sürmelik uyarlama gibi duruyor.

**Corrections** (sample):
- description: "Tahinli soğanlama, kavrulmuş soğanı tahin ve zeytinyağıyla birleştiren sürülebilir bir kahvaltılık uyarlamadır...."

### `tahinli-susamli-corek-manisa-usulu`

**Reason**: Tahinli çörek kimliği doğru, ancak Manisa bağı ve mayalı hamur omurgası eksik. Bu yüzden doğrudan PASS yerine yapısal düzeltme ve düşük güven verildi.

**Issues**:
- Tahinli çörek kaynaklarla uyumlu, fakat Manisa atfı iki bağımsız kaynakla net doğrulanamadı.
- Mevcut tarifte mayalı çörek için maya ve şeker yok; bu haliyle kaynaklardaki tahinli çörek yapısından eksik kalıyor.

**Corrections** (sample):
- ingredients_add: 2

### `tahinli-uzumlu-corek-ankara-usulu`

**Reason**: Tahinli çörek tekniği kaynaklarla destekleniyor, fakat Ankara ve üzümlü özel kimlik zayıf. Maya eksikliği tarifin çalışmasını doğrudan etkiliyor.

**Issues**:
- Tahinli çörek kaynaklarda mayalı hamurla hazırlanır, mevcut tarifte maya yok.
- Ankara ve kuru üzümlü varyasyon atfı iki kaynakla doğrulanamadı.

**Corrections** (sample):
- ingredients_add: 2

### `tahinli-zahterli-yumurta-durumu-antalya-usulu`

**Reason**: Malzemeler kendi başına uyumlu, ancak Antalya usulü diye sunmak doğrulanamadı. En doğru çözüm yerel iddiayı düşürüp uyarlama olarak anlatmak.

**Issues**:
- Tahin, zahter ve yumurta dürümü için Antalya usulü diye doğrulanabilir klasik kaynak bulunamadı.
- Tarif uygulanabilir bir kahvaltı uyarlaması olsa da yerel kimlik iddiası kaynak desteği taşımıyor.

**Corrections** (sample):
- description: "Tahinli zahterli yumurta dürümü, lavaşa sarılan yumurtayı tahin ve zahterle birleştiren hızlı, aromalı bir kahvaltı uyar..."

### `tamal-en-cazuela`

**Reason**: Küba yemeği kimliği net ama mevcut dana uyarlaması klasik domuzlu reçeteden uzak. Aromatik eksikleri giderilse de kimlik riski yüksek.

**Issues**:
- Küba tamal en cazuela kaynaklarında genellikle domuz eti, soğan, sarımsak, biber, domates sosu, yağ ve taze mısır ya da mısır unu bulunur.
- Mevcut tarif dana kıyma ve çok eksik aromatiklerle klasik kimlikten belirgin uzaklaşıyor.

**Corrections** (sample):
- description: "Tamal en cazuela, mısır ve etli harcın tencerede koyu kıvamda piştiği Küba usulü tamaldir...."
- ingredients_add: 4

### `tandir-biberli-bulgur-kapama-batman-usulu`

**Reason**: Teknik olarak etli bulgur yemeği çalışabilir, ancak Batman ve tandır kimliği kaynakla doğrulanamadığı için yerel iddia sorunlu.

**Issues**:
- Etli bulgur kapama yapısı makul, fakat Batman tandır biberli bulgur kapama adıyla doğrulanabilir kaynak bulunamadı.
- Tandır vurgusu mevcut adımlarda yok; tarif tencere pilavı gibi çalışıyor.

**Corrections** (sample):
- description: "Biberli bulgur kapama, kuşbaşı eti domates ve biberle pişirip bulgurla aynı tencerede dinlendiren doyurucu bir ana yemek..."

### `tandir-boregi-kars-usulu`

**Reason**: Malzeme kombinasyonu yenebilir bir börek verir, fakat Kars ve tandır iddiası kaynaklı değil. Uyarlama olarak düzeltilmesi gerekir.

**Issues**:
- Tandır böreği adı farklı yörelerde geçse de Kars usulü bu yufkalı tepsi böreği için iki güvenilir kaynak bulunamadı.
- Mevcut adımlarda gerçek tandır tekniği yok; fırında peynirli börek gibi anlatılıyor.

**Corrections** (sample):
- description: "Tandır böreği uyarlaması, yufka katlarını peynirli iç ve sütlü sosla fırında kızartan doyurucu bir tepsi böreğidir...."

### `tandir-ekmekli-fasulye-ezmesi-bingol-usulu`

**Reason**: Fasulye ezmesi fikri uygulanabilir, ancak Bingöl ve tandır ekmeği kimliği güçlü kaynak taşımıyor. Yerel iddia azaltılmalı.

**Issues**:
- Fasulye ezmesi ve ekmekle kıvam verme mümkün, fakat Bingöl tandır ekmekli fasulye ezmesi adı kaynaklarda doğrulanamadı.
- SOS type içinde tandır ekmeğiyle doyurucu ana eşlikçi gibi duruyor, kategori ve yerel kimlik zayıf.

**Corrections** (sample):
- description: "Tandır ekmekli fasulye ezmesi, haşlanmış kuru fasulyeyi sarımsak, zeytinyağı ve ekmekle koyulaştıran pratik bir sofra ez..."

### `tandir-otlu-gozleme-sirnak-usulu`

**Reason**: Gözleme reçetesi çalışır, ancak Şırnak ve tandır iddiası desteklenmedi. Açıklama tavada otlu gözleme olarak sadeleştirilmeli.

**Issues**:
- Otlu gözleme kaynaklarla uyumlu bir Türk hamur işi, fakat Şırnak tandır usulü özel kimlik doğrulanamadı.
- Mevcut tarif tavada pişiyor; tandır vurgusu ad ve açıklamada kalıyor.

**Corrections** (sample):
- description: "Otlu gözleme, ince açılmış hamurun karışık otlarla doldurulup tavada pişirilmesiyle hazırlanan hafif bir kahvaltılık ham..."

### `tantunili-nohut-salatasi-mersin-usulu`

**Reason**: Uyarlama olarak yenebilir, fakat yerel klasik gibi sunulması doğru değil. Step içindeki sos malzemeleri de listede eksik.

**Issues**:
- Tantuni ve nohut salatası ayrı ayrı anlaşılır, fakat Mersin usulü tantunili nohut salatası için güvenilir kaynak bulunamadı.
- Step metinlerinde zeytinyağı, limon ve tuz geçiyor, ingredient listesinde bunlar yok.

**Corrections** (sample):
- description: "Tantunili nohut salatası, baharatlı dana etini haşlanmış nohut, soğan ve yeşillikle birleştiren sıcak salata uyarlamasıd..."
- ingredients_add: 3

### `taratorlu-kabak-corbasi-mersin-usulu`

**Reason**: Kabak ve tarator uyumu mantıklı, ancak Mersin kimliği ve tahinli step hatası tarif güvenini düşürüyor. Uyarlama dili daha doğru.

**Issues**:
- Tarator ve kabak çorbası ayrı ayrı destekleniyor, fakat Mersin taratorlu kabak çorbası kimliği iki kaynakla doğrulanamadı.
- Step 1 tahinli karışım diyor, ingredient listesinde tahin yok; servis de bruşetta gibi bağlam dışı.

**Corrections** (sample):
- description: "Taratorlu kabak çorbası, haşlanmış kabağı yoğurt, ceviz ve sarımsakla buluşturan serin, hafif bir çorba uyarlamasıdır...."
- steps_replace: 2

### `tarcinli-ananas-kup-peru-usulu`

**Reason**: Malzemeler uyumlu fakat Peru mutfağına özgü kimlik bulunamadı. Yerel atıf kaldırılıp kup tatlısı olarak sunulmalı.

**Issues**:
- Ananas, yoğurt, bal ve tarçınlı kup için Peru usulü doğrulanabilir kaynak bulunamadı.
- Tarif sağlıklı kup uyarlaması gibi duruyor; ülke atfı yanıltıcı olabilir.

**Corrections** (sample):
- description: "Tarçınlı ananas kup, ananası yoğurt, bal ve tarçınla birleştiren hafif, serin ve hızlı bir kaşık tatlısı uyarlamasıdır...."

### `tarcinli-erik-kremasi-polonya-usulu`

**Reason**: Erik kullanımı bölgesel olarak makul, ancak mevcut sütlü krema Polonya klasiği diye doğrulanmadı. Uyarlama anlatımı daha güvenli.

**Issues**:
- Polonya mutfağında erik ve nişastalı tatlılar var, ancak bu sütlü erik kreması için net geleneksel kaynak bulunamadı.
- Tarif budyn benzeri bir uyarlama gibi duruyor; Polonya usulü iddiası zayıf.

**Corrections** (sample):
- description: "Tarçınlı erik kreması, sütlü nişasta tabanını erik ve tarçınla koyulaştıran yumuşak bir kaşık tatlısı uyarlamasıdır...."

### `tarcinli-etli-erik-tavasi-mardin-usulu`

**Reason**: Tat profili makul, fakat Mardin adıyla kaynaklanmış bir klasik görünmüyor. Temel tuz ve yağ da listede eksik.

**Issues**:
- Kuzu ve kuru erik tatlı-tuzlu yemeklerde uyumlu, fakat Mardin tarçınlı etli erik tavası adı iki kaynakla doğrulanamadı.
- Ingredient listesinde tuz ve yağ yok; tava yemeği için temel eksikler var.

**Corrections** (sample):
- description: "Tarçınlı etli erik tavası, kuzu etini kuru erik ve soğanla tatlı-tuzlu dengede pişiren aromalı bir tava uyarlamasıdır...."
- ingredients_add: 2

### `tarhanali-kofte-tava-usak-usulu`

**Reason**: Tarhana soslu köfte uyarlaması mümkün, ancak Uşak yöresel kimliği doğrulanmadı. Köfte harcı da temel bağlayıcı ve baharattan yoksun.

**Issues**:
- Tarhanalı köfte tava adıyla Uşak yöresine ait net kaynak bulunamadı.
- Köfte için tuz, baharat ve bağlayıcı yok; sadece kıyma, soğan ve tarhana ile yapı zayıf.

**Corrections** (sample):
- description: "Tarhanalı köfte tava, dana kıymalı küçük köfteleri ekşi tarhana sosuyla pişiren koyu kıvamlı bir tava yemeği uyarlamasıd..."
- ingredients_add: 3

### `tatar-boregi-eskisehir-usulu`

**Reason**: Mevcut yemek Tatar böreği kimliğini tam taşımıyor. Kıymalı iç ve yumurtalı hamur eklenmeden Eskişehir iddiası zayıf kalır.

**Issues**:
- Eskişehir Tatar böreği kaynaklarında mantı benzeri hamur, çoğunlukla kıymalı iç ve yoğurtlu sos bulunur.
- Mevcut tarif içsiz haşlanmış hamur parçası gibi; klasik kimliği eksik.

**Corrections** (sample):
- ingredients_add: 3

### `tava-coregi-beypazari-usulu`

**Reason**: Teknik olarak uygulanabilir, ancak Beypazarı özel kimliği doğrulanmadı. Yerel iddia düşürülürse tarif daha güvenli olur.

**Issues**:
- Beypazarı tava çöreği adıyla doğrulanabilir iki kaynak bulunamadı.
- Mayalı peynirli tava çöreği çalışabilir, fakat yerel Ankara iddiası kaynak desteği taşımıyor.

**Corrections** (sample):
- description: "Tava çöreği, mayalı hamurun peynir ve zeytinle tavada kapağı kapalı pişirilmesiyle hazırlanan yumuşak içli bir hamur işi..."

### `tavuklu-arpa-sehriyeli-pilav-yozgat-usulu`

**Reason**: Pilav uygulanabilir, ancak Yozgat iddiası kaynakla güçlü değil. Yerel iddia düşürülmeli, eksik tuz ve yağ eklenmeli.

**Issues**:
- Tavuklu arpa şehriye pilavı kaynaklarla uyumlu, fakat Yozgat usulü özel atfı iki bağımsız kaynakla doğrulanamadı.
- Ingredient listesinde tuz ve kavurma yağı yok.
- Description yöre iddiasını gerçek tarif kimliğinden daha güçlü veriyor.

**Corrections** (sample):
- description: "Tavuklu arpa şehriyeli pilav, sotelenmiş tavuk ve arpa şehriyeyi tavuk suyuyla pişiren sade, tok ve ev tipi bir pilavdır..."
- ingredients_add: 2

### `tavuklu-bulgurlu-nohut-pilavi-siirt-usulu`

**Reason**: Tarifin temel pilav kimliği doğru, fakat Siirt atfı zayıf ve yağ, tuz eksik. Tavuk suyuna geçiş içerikle daha tutarlı olur.

**Issues**:
- Tavuklu nohutlu bulgur pilavı kaynaklarla uyumlu, fakat Siirt usulü özel atfı doğrulanamadı.
- Ingredient listesinde tuz ve yağ yok.
- Tarif tavuk suyu yerine düz su yazıyor, kaynaklarda tavuk suyu daha tipik.

**Corrections** (sample):
- description: "Tavuklu bulgurlu nohut pilavı, bulguru tavuk, nohut ve tavuk suyuyla pişiren sade, tok ve kalabalık sofralık bir ana yem..."
- ingredients_add: 2

### `tavuklu-eristeli-tava-polonya-usulu`

**Reason**: Yemek uygulanabilir bir kremalı tavuklu erişte, fakat Polonya iddiası güçlü değil. Aromatik ve tuz eksikleri de düzeltilmeli.

**Issues**:
- Kremsi tavuklu erişte yapısı kaynaklarla uyumlu, fakat Polonya usulü özel kimlik iki kaynakla doğrulanamadı.
- Ingredient listesinde tuz, soğan veya sarımsak gibi temel aromatikler yok.
- Step metinleri tarif özelinden çok generic kalıyor.

**Corrections** (sample):
- description: "Tavuklu erişteli tava, tavuk, erişte ve kremayı aynı tavada buluşturan sıcak, pratik ve tok bir ana yemektir...."
- ingredients_add: 3

### `tavuklu-firik-patlican-batman-usulu`

**Reason**: Firikli yemek omurgası doğru olabilir, ama Batman iddiası ve servis metni sorunlu. Yerel iddia düşürülmeli.

**Issues**:
- Firik ve patlıcanlı tavuk yemeği mantıklı, fakat Batman usulü özel atfı iki kaynakla doğrulanamadı.
- ServingSuggestion kuzu pembesi tabaka ifadesi tarifle ilgisiz ve hatalı.
- Ingredient listesinde yağ ve tuz yok.

**Corrections** (sample):
- description: "Tavuklu firik patlıcan, tavuk, firik bulguru, patlıcan ve domatesi aynı tencerede pişiren dumanlı ve doyurucu bir yemekt..."
- ingredients_add: 2

### `tavuklu-limonlu-firik-pilavi-mersin-usulu`

**Reason**: Firik pilavı uygulanabilir, fakat Mersin limonlu tavuklu kimliği güçlü kaynak bulmuyor. Yerel iddia düşürülmeli.

**Issues**:
- Firik pilavı kaynaklarla uyumlu, fakat Mersin usulü limonlu tavuklu varyasyon iki kaynakla doğrulanamadı.
- Ingredient listesinde yağ ve tuz yok.
- Description yerel iddiayı fazla kesin veriyor.

**Corrections** (sample):
- description: "Tavuklu limonlu firik pilavı, firik bulgurunu tavuk, sıcak su ve limonla pişiren isli, tok ve ferah bir ana yemektir...."
- ingredients_add: 2

### `tavuklu-mantarli-kesme-makarna-zonguldak-usulu`

**Reason**: Makarna kurgusu çalışır, ancak Zonguldak özel kimliği zayıf ve temel aromatikler eksik. Manuel review gerekli.

**Issues**:
- Tavuklu mantarlı makarna yapısı kaynaklarla uyumlu, fakat Zonguldak usulü kesme makarna atfı doğrulanamadı.
- Ingredient listesinde yağ, tuz, soğan veya sarımsak yok.
- Step 3 generic tuz ve baharat metni kullanıyor, fakat bu malzemeler listede yer almıyor.

**Corrections** (sample):
- description: "Tavuklu mantarlı kesme makarna, tavuk ve mantarı kesme makarnayla aynı tencerede buluşturan pratik ve tok bir yemektir...."
- ingredients_add: 4

### `tavuklu-nohutlu-arpa-pilavi-ankara-usulu`

**Reason**: Pilav uygulanabilir, ancak Ankara atfı desteklenmedi. Yağ ve tuz eksikleri de tarifin çalışmasını etkiliyor.

**Issues**:
- Tavuklu nohutlu arpa şehriye pilavı kaynaklarla genel olarak uyumlu, fakat Ankara usulü özel atfı doğrulanamadı.
- Ingredient listesinde yağ ve tuz yok.
- Description yerel iddiayı fazla kesin kuruyor.

**Corrections** (sample):
- description: "Tavuklu nohutlu arpa pilavı, arpa şehriye, tavuk ve nohudu aynı tencerede buluşturan tok ve sade bir pilavdır...."
- ingredients_add: 2

### `tavuklu-nohutlu-sehriye-pilavi-siirt-usulu`

**Reason**: Temel pilav yapısı doğru, fakat Siirt iddiası kaynakla güçlü değil. Yağ ve tuz eksikleri giderilmeli.

**Issues**:
- Tavuklu nohutlu şehriye pilavı genel kaynaklarla uyumlu, fakat Siirt usulü özel atıf doğrulanamadı.
- Ingredient listesinde yağ ve tuz yok.
- Step 3 generic tuz, baharat ve ekşi metni kullanıyor, fakat listede bu ayrıntılar yok.

**Corrections** (sample):
- description: "Tavuklu nohutlu şehriye pilavı, arpa şehriye, tavuk ve nohudu aynı tencerede pişiren tok, sıcak bir ana yemektir...."
- ingredients_add: 2

### `tavuklu-yesil-mercimek-pilavi-yozgat-usulu`

**Reason**: Pilav uygulanabilir, ama Yozgat özel kimliği kaynakla güçlü değil. Yağ ve tuz eksikleri de giderilmeli.

**Issues**:
- Tavuklu mercimekli pilav kaynaklarla genel olarak uyumlu, fakat Yozgat usulü özel atfı doğrulanamadı.
- Ingredient listesinde yağ ve tuz yok.
- Description yerel iddiayı fazla kesin kuruyor.

**Corrections** (sample):
- description: "Tavuklu yeşil mercimek pilavı, pirinci tavuk ve haşlanmış mercimekle pişiren tok, sade ve aile sofralık bir pilavdır...."
- ingredients_add: 2

### `tepsi-kebabi-adana-ev-usulu`

**Reason**: Tepsi kebabı doğru bir yemek, ancak Adana özel etiketi kaynakla desteklenmiyor. Kimlik iddiası düşürülmeli ve harç tamamlanmalı.

**Issues**:
- Tepsi kebabı kaynaklarda güçlü biçimde Hatay ve Antakya ile geçiyor, Adana ev usulü özel atfı doğrulanamadı.
- Ingredient listesinde soğan ve maydanoz yok, tepsi kebabı harcı eksik kalıyor.
- Description Güney mutfağı iddiası kuruyor, fakat Adana özel kimliği manuel review gerektiriyor.

**Corrections** (sample):
- description: "Tepsi kebabı, kıymayı biber, domates ve sarımsakla tepsiye yayarak fırında pişiren kalabalık sofralara uygun güçlü bir a..."
- ingredients_add: 3

### `tepsi-simit-kebabi-adiyaman-usulu`

**Reason**: Simit kebabı omurgası kaynaklı, fakat Adıyaman tepsi kimliği zayıf. Bu yüzden manuel review gerektiren kimlik düzeltmesi.

**Issues**:
- Simit kebabı kaynaklarda özellikle Gaziantep ve Kilis bağlamında geçiyor, Adıyaman tepsi simit kebabı atfı doğrulanamadı.
- Simit kebabı için soğan, sarımsak, nane ve baharatlar temel, mevcut listede yok.
- Tepsi formu fırın uyarlaması olabilir, fakat mevcut description yöresel kimliği fazla kesin veriyor.

**Corrections** (sample):
- description: "Tepsi simit kebabı, ince bulgurla bağlanan kıymayı biber ve domatesle fırında pişiren yoğun aromalı, kalabalık sofralık ..."
- ingredients_add: 5

### `tereyagli-tavuklu-pirinc-tava-hindistan-usulu`

**Reason**: Mevcut içerik sade tavuklu pilav gibi duruyor, Hint mutfağı iddiası zayıf. Bu yüzden mini-rev sırasında kimlik düzeyi kontrol edilmeli.

**Issues**:
- Hindistan usulü iddiası kaynakla desteklenmiyor; tarifte soğan, sarımsak, zencefil, garam masala, zerdeçal veya benzeri temel Hint lezzetleri yok.
- Steps 2, 3, 4 ve 6 scaffold cümleleri içeriyor.

**Corrections** (sample):
- ingredients_add: 5
- steps_replace: 5

### `tkemali`

**Reason**: İçerik tkemali olarak doğru, ancak Rus mutfağı etiketi yanlış. Gürcü cuisine kodu olmadığı için bu kayıt manuel karar gerektiriyor.

**Issues**:
- Tkemali Gürcü ekşi erik sosudur, mevcut cuisine ru yanıltıcı.
- Tarifle cuisine kodlarında Gürcistan için destek görünmüyor, bu nedenle mini-rev veya cuisine enum kararı gerekir.

**Corrections** (sample):
- description: "Tkemali, ekşi erik, kişniş ve sarımsakla et yemeklerine canlılık veren Gürcü usulü bir sostur...."

### `tokat-bati`

**Reason**: Bat kimliği yeşil mercimeksiz eksik kalıyor. Bu temel malzeme yoksa kullanıcı Tokat batı yerine farklı bir bulgur salatası yapar.

**Issues**:
- Tokat batı kaynaklarda yeşil mercimekli yapılır, mevcut ingredient listesinde mercimek yok.
- Step 2 domates diyor, fakat domates ingredient listesinde yok.

**Corrections** (sample):
- ingredients_add: 2
- steps_replace: 5

### `tokat-cemeni`

**Reason**: Mevcut tarif çemen değil, daha çok cevizli salça ezmesi gibi. Çemen unu ve baharat temeli olmadan Tokat çemeni kimliği zayıf.

**Issues**:
- Tokat çemeni kaynaklarda çemen unu ve baharatlı macun olarak geçiyor, mevcut tarif salça ve cevizli ezmeye kaymış.
- Köy ekmeği ingredient olarak yazılmış, bu sürmelik çemenin kendisi değil; bu yüzden GLUTEN allergen fazla declare edilmiş olabilir.

**Corrections** (sample):
- ingredients_add: 3
- ingredients_remove: Köy ekmeği
- steps_replace: 4

### `tokyo-tonkatsu-pirinc-kasesi`

**Reason**: Mevcut içerik tavuk katsu, fakat tonkatsu adı domuzla özdeş. Bu kimlik farkı mini-rev sırasında kullanıcı hassasiyetiyle ele alınmalı.

**Issues**:
- Tonkatsu klasik olarak domuz pane cutlet anlamına gelir, mevcut tarif tavuk pirzola kullanıyor.
- Title ve slug tonkatsu dediği için tavuk adaptasyonu kullanıcıyı yanıltabilir.

**Corrections** (sample):
- description: "Japon tonkatsu pirinç kasesi, panko kaplı domuz pirzolayı çıtır kızartıp lahana, pirinç ve koyu sosla dengeli bir kaseye..."
- ingredients_add: 1
- ingredients_remove: Tavuk pirzola

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `sumakli-kuru-patlican-dolgusu-sirnak-usulu` | high | 2 | ingredients_add, servingSuggestion |
| `sumakli-nohut-ezmesi-diyarbakir-usulu` | high | 2 | totalMinutes, steps_replace |
| `sumakli-nohut-salatasi-nevsehir-usulu` | high | 1 | ingredients_add |
| `sumakli-nohutlu-salata-mardin-usulu` | high | 1 | ingredients_add |
| `sumakli-nohutlu-tavuk-tava-kahramanmaras-usulu` | medium | 2 | ingredients_add |
| `sumakli-ot-salatasi-cesme-usulu` | high | 2 | steps_replace, servingSuggestion |
| `sumakli-sogan-piyazi-batman-usulu` | high | 2 | ingredients_add, steps_replace |
| `sumakli-sogan-salatasi-sanliurfa-usulu` | high | 2 | ingredients_add, steps_replace |
| `sumakli-tavuk-pilav-kasesi-levant-usulu` | high | 1 | servingSuggestion |
| `sumakli-tavuk-sote-kilis-usulu` | high | 1 | tipNote |
