# Mod K verify raporu

Okunan dosya: 5 batch
Toplam entry: 250

## Ozet (verdict)

- PASS: **65** (26.0%)
- CORRECTION: 143 (57.2%)
- MAJOR_ISSUE: 42 (16.8%)

## Confidence

- high: 140, medium: 75, low: 35

## Format integrity

- Apply'a hazir (clean format): **250**
- BLOCKED (format issue): 0

## MAJOR_ISSUE (manuel review zorunlu)

### `reyhanli-lorlu-pilav-mardin-usulu`

**Reason**: Reyhanlı pilav ve lorlu pilav tekniği ayrı ayrı makul; Mardin kimliği ve bu tam kombinasyon güvenli doğrulanamadı.

**Issues**:
- Mardin atfı güvenilir kaynakla desteklenmiyor; tarif daha çok reyhanlı ve lorlu yaratıcı pilav varyantı gibi duruyor.
- Step 3 tuz kullanıyor ama ingredient listesinde tuz yok.

**Corrections** (sample):
- description: "Reyhanlı lorlu pirinç pilavı, pirinci tereyağı, lor ve taze reyhanla buluşturan yumuşak bir ana yemek çıkarır...."
- ingredients_add: 1

### `reyhanli-lorlu-yumurta-ekmegi-hatay-usulu`

**Reason**: Yumurtalı ekmek yapısı doğru, Hatay katıklı ekmek bağlantısı ise bu tavada kahvaltı formu için yeterli değil.

**Issues**:
- Hatay biberli ekmek kaynakları lor, çökelek ve reyhanı destekliyor ama yumurtalı bayat ekmek formunu desteklemiyor.
- Step metinleri tarif adını tekrar eden scaffold dil taşıyor.

**Corrections** (sample):
- description: "Reyhanlı lorlu yumurta ekmeği, bayat ekmeği yumurtalı karışım ve reyhan kokulu lorla buluşturarak hızlı bir sabah tabağı..."
- steps_replace: 5

### `reyhanli-seftali-kompostosu-izmir-usulu`

**Reason**: Komposto tekniği doğru; İzmir ve reyhanlı özel varyant iddiası kaynaklarda güvenli biçimde doğrulanamadı.

**Issues**:
- Şeftali kompostosu kaynaklarla uyumlu, ancak İzmir usulü ve reyhanlı özel adlandırma güçlü kaynakla desteklenmiyor.
- Step 1 belirsiz ve tarif adını tekrar ediyor.

**Corrections** (sample):
- description: "Reyhanlı şeftali kompostosu, şeftaliyi reyhan kokusuyla buluşturan hafif tatlı ve ferah bir içecek yapar...."
- steps_replace: 3

### `ricottali-misir-boregi-avustralya-usulu`

**Reason**: Ricotta ve mısır tart tekniği makul; Avustralya kimliği ve börek adı güvenilir biçimde doğrulanamadı.

**Issues**:
- Avustralya usulü ricottalı mısır böreği adı güvenilir kaynakla desteklenmiyor.
- Step metinleri tarif adını tekrar eden scaffold dili içeriyor.

**Corrections** (sample):
- description: "Ricottalı mısır böreği, taze mısırı ricotta ve ince hamurla buluşturan nemli ve hafif tatlı bir brunch dilimi çıkarır...."
- steps_replace: 5

### `rio-yesil-muzlu-feijao-corbasi`

**Reason**: Yeşil muz ve fasulye fikri Brezilya hattında mümkün; Rio siyah fasulye çorbası iddiası zayıf kalıyor.

**Issues**:
- Feijão com banana verde Brezilya kaynaklarında var, ancak siyah fasulyeli Rio çorbası kimliği güvenli doğrulanmıyor.
- Step 4 sıcak su diyor ama ingredient listesinde su yok.

**Corrections** (sample):
- description: "Yeşil muzlu feijão çorbası, fasulyeyi yeşil muz, sarımsak ve kişnişle yoğun bir kaseye dönüştürür...."
- ingredients_add: 2

### `romlu-ananas-soda-vietnam-usulu`

**Reason**: Tropik soda kokteyli tekniği anlaşılır; Vietnam kimliği ve özgül tarif adı güvenli doğrulanamadı.

**Issues**:
- Ananaslı rom soda kokteyli makul olsa da Vietnam usulü iddiası güvenilir kaynakla desteklenmiyor.
- Step metinleri tarif adını tekrar eden scaffold dili içeriyor.

**Corrections** (sample):
- description: "Romlu ananas soda, romu ananas suyu ve soda ile buluşturarak hafif ve tropik bir kokteyl yapar...."
- steps_replace: 4

### `rommegrot`

**Reason**: Tarif içeriği Norveç rømmegrøt kaynaklarıyla uyumlu; cuisine kodu sistemi kimliği doğru temsil edemiyor.

**Issues**:
- Rømmegrøt Norveç yemeği; mevcut cuisine kodu se İsveç gösteriyor ve Norveç kodu enumda yok.
- Step metinleri scaffold dili taşıyor.

**Corrections** (sample):
- description: "Rømmegrøt, ekşi krema ve unla pişen, üzerine tarçın serpilen sıcak bir İskandinav kahvaltısıdır...."
- steps_replace: 5

### `sac-arasi-kayseri-usulu`

**Reason**: Tatlı yapısı mümkün; Kayseri atfı ve kaymaksız form kaynaklarla güvenli örtüşmüyor.

**Issues**:
- Kayseri usulü sac arası atfı güçlü kaynakla desteklenmiyor; kaynaklar daha çok Konya sac arası gösteriyor.
- Mevcut tarifte kaymak yok, oysa kaynaklarda sac arası için belirleyici unsur.

**Corrections** (sample):
- description: "Sac arası, ince yufkaların cevizli harçla kurulup fırınlandığı katlı bir şerbetli hamur işidir...."
- ingredients_add: 1

### `sac-kavurma-rize-usulu`

**Reason**: Genel sac kavurma doğru; Rize özel kimliği kaynaklarla güvenli doğrulanamadı.

**Issues**:
- Rize usulü sac kavurma iddiası güvenilir kaynakla desteklenmiyor.
- Dört malzemeli sade dana kavurma genel sac kavurma tekniğiyle uyumlu ama bölgesel kimlik zayıf.

**Corrections** (sample):
- description: "Sade sac kavurma, eti yüksek ateşte hızla mühürleyip tereyağı, tuz ve karabiberle öne çıkaran güçlü bir ana yemektir...."

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

### `sardalyali-ekmek-salatasi-canakkale-usulu`

**Reason**: Sardalya, ekmek ve domates fikri makul; fakat yerel adlandırma ve çiğ fileto akışı manuel kaynak kontrolü gerektiriyor.

**Issues**:
- Çanakkale usulü sardalyalı ekmek salatası iddiası güçlü kaynakla doğrulanamadı.
- Mevcut akış sardalyayı pişirmiyor; çiğ sardalya fileto ile salata gıda güvenliği ve tarif kimliği açısından sorunlu.
- Steps limon ve tuz kullanıyor ama ingredient listesinde ikisi de yok.

**Corrections** (sample):
- description: "Sardalyalı ekmek salatası, kızarmış ekmek, pişmiş sardalya, domates, maydanoz ve zeytinyağıyla hızlı bir öğle tabağı kur..."
- ingredients_add: 2
- steps_replace: 5

### `sebzeli-goce-kofte-nevsehir-usulu`

**Reason**: Göce temelli köfte fikri mümkün; fakat Nevşehir iddiası ve susamlı servis önerisi manuel review gerektiriyor.

**Issues**:
- Nevşehir usulü sebzeli göce köfte iddiası için yeterli açık kaynak bulunamadı.
- Step 3 un ve baharat kullanıyor ama ingredient listesinde ikisi de yok.
- ServingSuggestion tahin tarator öneriyor; tarifte susam temelli bağlam yok.

**Corrections** (sample):
- ingredients_add: 3

### `sembusek-tostu-mardin-usulu`

**Reason**: Sembusek temeli doğru görünse de tost formu yerel klasik olarak kanıtlanamadı; manuel identity review gerekir.

**Issues**:
- Mardin sembusek kaynakları sac veya fırın hamur işini anlatıyor; tost adıyla klasik bir yerel tarif doğrulanamadı.
- Tarif sembusek uyarlaması olabilir ama mevcut title ve description bunu klasik Mardin usulü gibi sunuyor.

**Corrections** (sample):
- description: "Sembusek tostu, ince hamuru kıymalı içle kapatıp tost ya da sac üstünde kızartan Mardin esintili bir atıştırmalık sunar...."

### `sirnak-fistikli-kuzu-tava`

**Reason**: Kuzu tava tekniği ve fıstıklı et fikri ayrı kaynaklarda var; Şırnak atfı doğrulanamadığı için bölge iddiası manuel incelenmeli.

**Issues**:
- Şırnak'a özgü fıstıklı kuzu tava için güçlü kaynak bulunamadı; tarif fıstıklı kebap ve genel kuzu tava karması gibi duruyor.
- Kuyruk yağı 50 gr ve 650 gr kuzuya göre porsiyon başı yağ değeri biraz düşük kalıyor.

**Corrections** (sample):
- description: "Fıstıklı kuzu tava, kuşbaşı kuzuyu Antep fıstığı, biber ve domatesle yağlı, güçlü bir tava yemeğine dönüştürür...."

### `sirnak-serbidev-yogurtlu`

**Reason**: İki kaynak da Serbidev'i yarma ve çökelek tabanlı verir; mevcut köfteli yoğurtlu akış kimlik hatasıdır.

**Issues**:
- Kaynaklarda Serbidev yarma, çökelek veya kurut suyu, tereyağı ve susamla yapılan bir tabak; mevcut tarif köfteli yoğurt yemeğine dönüşmüş.
- İsim, description, ingredient ve steps aynı yöresel yemeği temsil etmiyor.

**Corrections** (sample):
- description: "Serbidev, haşlanmış yarmanın ortasına sulu çökelek veya kurut eklenip tereyağı ve susamla tamamlanan Şırnak yemeğidir...."
- ingredients_add: 4
- ingredients_remove: Dana kıyma, İnce bulgur, Yoğurt, Yumurta, Un, Sarımsak, Kuru nane, Karabiber
- steps_replace: 5

### `sivas-kusburnulu-bulgur-pilavi`

**Reason**: Bulgur pilavı Sivas mutfağında var, kuşburnu Sivas ürünü olarak bilinir; iki unsurun tarif adıyla birleşimi doğrulanamadı.

**Issues**:
- Sivas'a özgü kuşburnulu bulgur pilavı için güvenilir kaynak bulunamadı.
- Steps içinde tarif adı tekrar eden template cümleler var.

**Corrections** (sample):
- description: "Kuşburnulu bulgur pilavı, pilavlık bulguru kuşburnu ekşisi, soğan ve nane ile hafif mayhoş bir tencereye dönüştürür...."
- steps_replace: 5

### `siyah-fasulyeli-balkabagi-corbasi-brezilya-usulu`

**Reason**: Siyah fasulye Brezilya mutfağıyla uyumlu, balkabağı çorbası ayrı kaynaklarda var; birleşik bölgesel tarif doğrulanamadı.

**Issues**:
- Brezilya usulü siyah fasulyeli balkabağı çorbası adı için iki güvenilir tarif kaynağı bulunamadı.
- Mevcut akış yenebilir bir bakliyat çorbası olsa da Brezilya mutfağı iddiası zayıf.

**Corrections** (sample):
- description: "Siyah fasulyeli balkabağı çorbası, balkabağını siyah fasulye ve kimyonla buluşturarak tok, yumuşak ve dengeli bir çorba ..."

### `siyah-fasulyeli-yumurta-tostada-kuba-usulu`

**Reason**: Tostada biçimi Meksika kaynaklarıyla uyumlu; Küba kahvaltısı olarak doğrulanamadığı için cuisine iddiası yanıltıcı.

**Issues**:
- Tostada siyah fasulye ve yumurta yapısı Küba'dan çok Meksika tarzına yakın duruyor.
- Küba usulü iddiası için güvenilir kaynak bulunamadı.

**Corrections** (sample):
- description: "Siyah fasulyeli yumurta tostada, çıtır tabanı fasulye ve yumurtayla buluşturarak güçlü bir sabah tabağı yapar...."

### `siyezli-kes-durumu-kastamonu-usulu`

**Reason**: Siyez ve keş ayrı yöresel ürünler olarak kaynaklanıyor; ancak bu spesifik dürüm kimliği doğrulanamadığı için manuel review gerekir.

**Issues**:
- Kastamonu siyezli keş dürümü adıyla güvenilir yöresel tarif kaynağı bulunamadı.
- Steps template başlangıç ve bitiş cümleleri taşıyor.

**Corrections** (sample):
- description: "Siyezli keş dürümü, siyez unlu ince ekmeği keş ve tereyağıyla sararak pratik ama karakterli bir sabah lokması kurar...."
- steps_replace: 5

### `somonlu-arpa-sehriye-tava-isvec-usulu`

**Reason**: Somon ve dereotu İsveç çizgisine yakın; arpa şehriye tava olarak bölgesel kimlik doğrulanamadı.

**Issues**:
- İsveç usulü somonlu arpa şehriye tava adı için güvenilir kaynak bulunamadı.
- Steps template cümleler içeriyor ve yağ, tuz, limon gibi temel pişirme destekleri eksik.

**Corrections** (sample):
- description: "Somonlu arpa şehriye tava, somonu arpa şehriye ve dereotuyla buluşturarak sade ve doyurucu bir ana yemek kurar...."
- ingredients_add: 3
- steps_replace: 5

### `sosisli-arpali-lahana-tava-polonya-usulu`

**Reason**: Malzemeler Doğu Avrupa çizgisine yakın ama Polonya kimliği bu adla doğrulanamadı; manuel review ile ad veya açıklama sadeleşmeli.

**Issues**:
- Polonya usulü sosisli arpalı lahana tava adı için güçlü kaynak bulunamadı; tarif bigos, kielbasa lahana tavası ve arpalı çorba arasında duruyor.
- Steps tekrar eden başlık cümleleri içeriyor ve yağ, tuz, ekşi destek gibi temel pişirme malzemeleri eksik.

**Corrections** (sample):
- description: "Sosisli arpalı lahana tava, sosis, lahana ve arpayı tek tavada pişiren doyurucu ve sıcak bir ev yemeği uyarlamasıdır...."
- ingredients_add: 3

### `spaghetti-carbonara`

**Reason**: Teknik carbonara çizgisine yakın ama klasik Roma iddiası dana pastırmasıyla zayıflıyor; manuel review kimlik dilini seçmeli.

**Issues**:
- Description Roma carbonara diyor ama guanciale yerine dana pastırması kullanıyor; bu klasik kimliği değiştiren yerel uyarlama.
- Step 5 carbonara için gereksiz dinlendirme içeriyor, sosun tabakta su salması bağlama uymuyor.

**Corrections** (sample):
- description: "Spaghetti carbonara, yumurta sarısı, pecorino ve dana pastırmasıyla yapılan domuzsuz uyarlamadır...."
- steps_replace: 5

### `su-boregi`

**Reason**: Kimlik farkı ingredient düzeyinde büyük; bu tarif manuel review ile gerçek su böreği ya da yalancı su böreği olarak ayrılmalı.

**Issues**:
- Su böreği elde açılan yumurtalı hamur katlarının haşlanmasıyla yapılır; mevcut tarif hazır börek yufkası ve sütlü sosla yalancı börek yapısına kaymış.
- Step 3 hazır börek yufkasını haşlamayı söylüyor, bu malzeme genellikle haşlamaya uygun değil.

**Corrections** (sample):
- description: "Su böreği, yumurtalı hamurun kısa haşlanıp peynirli harç ve tereyağıyla kat kat pişirilmesidir...."
- ingredients_add: 2
- ingredients_remove: Börek yufkası, Süt, Sıvı yağ

### `sucuklu-mantarli-yumurta-eskisehir-usulu`

**Reason**: Yemek genel kahvaltı tavası olarak doğru; Eskişehir atfı doğrulanamadığı için ad veya açıklama manuel incelenmeli.

**Issues**:
- Eskişehir usulü sucuklu mantarlı yumurta adı için güvenilir bölgesel kaynak bulunamadı.
- Steps template hazırlık cümleleri içeriyor; tarif genel sucuklu mantarlı yumurta gibi duruyor.

**Corrections** (sample):
- description: "Sucuklu mantarlı yumurta, mantarı önce suyunu çektirip sucuk ve yumurtayla birleştiren hızlı, proteinli bir kahvaltı tav..."
- steps_replace: 5

### `sucuklu-mercimek-pilavi-kayseri-usulu`

**Reason**: Mercimek pilavı ve sucuk ayrı ayrı makul ama Kayseri kimliği kaynaklanamadı; manuel review ile bölge iddiası sadeleşmeli.

**Issues**:
- Kayseri usulü sucuklu mercimek pilavı adı için güçlü kaynak bulunamadı; tarif genel mercimekli pilava sucuk eklenmiş gibi duruyor.
- Steps template başlık tekrarları içeriyor ve yağ, tuz gibi temel pilav malzemeleri eksik.

**Corrections** (sample):
- description: "Sucuklu mercimek pilavı, yeşil mercimek, pirinç, soğan ve sucuğu tek tencerede birleştiren doyurucu bir pilav uyarlaması..."
- ingredients_add: 2

### `sumakli-casir-salatasi-bingol-usulu`

**Reason**: Yabani ot salatası fikri makul ama çiriş ve çaşır kimliği karışmış görünüyor; bu slug manuel botanical ve yöre kontrolü istiyor.

**Issues**:
- Bingöl için kaynaklar daha çok çiriş otu salatasını gösteriyor; mevcut tarif çaşır adıyla farklı bir bitkiye işaret ediyor.
- Sumaklı çaşır salatası Bingöl usulü adı güçlü kaynakla doğrulanamadı.

**Corrections** (sample):
- description: "Sumaklı çaşır salatası, kısa haşlanmış yabani otu soğan, sumak ve zeytinyağıyla ekşi bir salataya dönüştüren bölgesel es..."

### `sumakli-fasulye-piyazi-igdir-usulu`

**Reason**: Fasulye, soğan, sumak ve zeytinyağı uyumlu; Iğdır atfı doğrulanamadığı için manuel review gerekir.

**Issues**:
- Sumaklı fasulye piyazı kaynaklarda genel Türk piyazı olarak doğrulanıyor ama Iğdır usulü bölgesel atıf için güçlü kaynak bulunamadı.
- Tarif yapısı doğru olsa da slug ve description yöre iddiası taşıyor.

**Corrections** (sample):
- description: "Sumaklı fasulye piyazı, haşlanmış kuru fasulyeyi kırmızı soğan, maydanoz, sumak ve zeytinyağıyla harmanlayan serin bir s..."

### `sumakli-havuclu-bulgur-salatasi-ardahan-usulu`

**Reason**: Bulgur salatası uyarlaması yapılabilir ama Ardahan kimliği ve step ingredient uyumu zayıf; manuel karar gerekir.

**Issues**:
- Ardahan usulü sumaklı havuçlu bulgur salatası adı için güvenilir kaynak bulunamadı.
- Steps domates, yeşillik ve soğan söylüyor ama ingredient listesinde bu malzemeler yok.

**Corrections** (sample):
- description: "Sumaklı havuçlu bulgur salatası, şişirilmiş ince bulguru havuç, sumak ve zeytinyağıyla hafif ekşili bir salataya dönüştü..."
- ingredients_add: 3

### `sumakli-kabak-sinkonta-manisa-usulu`

**Reason**: Mevcut tarif sinkonta kimliğini tam taşımıyor; balkabağı ve fırın tekniği için manuel review ile geniş düzeltme gerekir.

**Issues**:
- Manisa sinkonta kaynaklarda balkabağı, soğan, sarımsaklı ekşi sos ve fırında uzun pişirme ile geçiyor; mevcut tarif kabak ve kısa tencere yemeği gibi.
- Ingredient listesinde sirke, salça, sarımsak, un ve nane gibi temel sinkonta sosu eksik.

**Corrections** (sample):
- description: "Manisa sinkonta, balkabağını soğan, sarımsaklı ekşi sos ve zeytinyağıyla fırında yumuşatan Ege usulü bir kabak yemeğidir..."
- ingredients_add: 5
- ingredients_remove: Kabak

## CORRECTION sample (ilk 10)

| Slug | Conf | Issues count | Corrections fields |
|---|---|---:|---|
| `reyhanli-pisco-cooler-peru-usulu` | medium | 2 | steps_replace |
| `reyhanli-sumak-serbeti-diyarbakir-usulu` | medium | 2 | ingredients_add, steps_replace |
| `reyhanli-tavuklu-yogurt-corbasi-osmaniye-usulu` | medium | 2 | description, steps_replace |
| `rfissa` | high | 2 | ingredients_add |
| `rhein-sauerbraten-dana` | high | 2 | totalMinutes, steps_replace |
| `rhubarb-yogurt-fool-ingiliz-usulu` | high | 2 | totalMinutes, tags_remove, steps_replace |
| `ribollita` | high | 2 | ingredients_add |
| `rio-feijoada-completa` | high | 2 | totalMinutes, steps_replace |
| `rio-hizli-feijoada` | high | 2 | ingredients_add |
| `rio-moqueca-balik` | high | 2 | ingredients_add |
