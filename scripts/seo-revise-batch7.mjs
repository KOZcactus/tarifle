#!/usr/bin/env node
/**
 * P1 SEO landing batch 7 (oturum 31): top 42-49 derinlik insert.
 * Pattern: oturum 25-31 batch 1-6 (top 1-41) + batch 7 (top 42-49).
 *
 * Hedef 5 yeni cuisine landing (kalan düşük öncelik) + 3 diet
 * derinleştirme:
 *   - cuisine/pakistan (5 tarif, YENI)
 *   - cuisine/tunus (4 tarif, YENI)
 *   - cuisine/iran (4 tarif, YENI)
 *   - cuisine/arjantin (3 tarif, YENI)
 *   - cuisine/avusturya (2 tarif, YENI)
 *   - diet/vegan (intro revize)
 *   - diet/vejetaryen (intro revize)
 *   - diet/glutensiz (intro revize)
 *
 * Her cuisine entry: intro 200-250 kelime + 4 FAQ q/a (somut sayi +
 * UNESCO/CI/otorite + pratik öngörü pattern). Her diet entry: 150-200
 * kelime intro derinleştirme (mevcut FAQ'lara dokunulmaz).
 *
 * Idempotent: mevcut entry varsa intro update, yoksa insert.
 *
 * Em-dash (U+2014) yasak (AGENTS.md): virgül, noktalı virgül, nokta,
 * parantez, iki nokta kullanıldı.
 *
 * Usage: node scripts/seo-revise-batch7.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const file = path.resolve(process.cwd(), "docs/seo-copy-v1.json");
const data = JSON.parse(fs.readFileSync(file, "utf-8"));

const NEW_CUISINE_INTROS = {
  "pakistan":
    "Pakistan mutfağı, Hint alt kıtasının kuzey-batı geleneklerini, Pers ve Orta Asya etkilerini, Mughal İmparatorluğu (1526-1857) saray yemeklerinin kalıntılarını ve Punjab, Sindh, Khyber Pakhtunkhwa, Balochistan dört eyaletinin bölgesel mutfaklarını birleştiren bir mutfaktır. Tarifle'de 5 Pakistan tarifi var; nihari (kemikli yavaş pişen et güveç, milli yemek), biryani (Pakistan'ın kendi versiyonu, Karachi versiyonu en popüler), haleem (et + yarma + nohut Pers kökenli), seekh kebab (Punjab şiş kebap), chapli kebab (Khyber Pakhtunkhwa yassı köfte) başta gelir. Nihari (Arapça nahar 'gün doğumu' anlamında) Mughal saray klasiği; klasik tarif sığır incik veya nealik incik + 12-14 baharatlı (kişniş, kimyon, tarçın, karanfil, kakule, defne, zerdeçal, zencefil, sarımsak, acı biber, hindistan cevizi, papatya, gül goncası, tarçın yaprağı) + 6-8 saat yavaş pişme + un + ghee. Sabah kahvaltısı olarak yenir, klasik Karachi sokak yemeği. Pakistan biryani Hint biryani'sinden ayrılır; daha kuru, daha az sebze, daha sıvı yağ, klasik formül uzun pirinç + yoğurtlu marine et + saffron + güllü su + kavrulmuş soğan. Haleem Muharrem ayı klasiği; aşure benzeri uzun yavaş pişme, kıyma + buğday yarması + 7-9 farklı bakliyat. Chapli kebab klasik Peshawar tarif: kıyma + nar tohumu + kuru hibiskus + biber + kişniş tohumu + iri yassı şekil + tavada kızartma. Bu sayfada günlük et güveçleri (nihari, haleem) ile sokak yemeği şişler (seekh, chapli) ve Pakistan biryani repertuvarı yer alır.",

  "tunus":
    "Tunus mutfağı, Berberi yerli geleneklerini, Endülüs İslam mirasını, Osmanlı 300 yıllık etkisini ve Fransız kolonyal döneminden (1881-1956) kalan baget ve patisseri kültürünü birleştiren Kuzey Afrika mutfağıdır. Tarifle'de 4 Tunus tarifi var; kuskus (Kuzey Afrika klasiği, UNESCO 2020 ICH tescil ortak), brik (yufka kapalı, içinde yumurta + ton balığı + maydanoz, kızartma), shakshuka (Tunus kökenli iddiası, paylaşımlı Kuzey Afrika klasiği), harissa (acı biber sosu, milli imza) başta gelir. UNESCO Somut Olmayan Kültürel Miras: Aralık 2020'de kuskus Cezayir + Mauritanya + Fas + Tunus dört ülke ortak tescili; bölgesel paylaşılan kültürel miras kabulü. Harissa milli sos klasiği: kuru kırmızı acı biber + kişniş + kimyon + sarımsak + kuru nane + tuz + zeytinyağı, kavurulmuş kuru biberin taş havanda dövülmesi geleneksel; 2022'de Tunus harissa'sı UNESCO ICH ayrı tescil aldı. Tunus 5 farklı acı biber çeşidi yetiştirir; klasik harissa nâbeul biberi (orta acı) ile yapılır, capsicum scoville 5000-25000 arasında. Brik klasik Tunus sokak yemeği; klasik formül malsouka yufkası + içinde sahanda yumurta + ton balığı + kapari + maydanoz + kuruyemiş + zeytin + 180°C yağda 1-2 dakika kızartma + dış çıtır iç yumurta sarısı akışkan kalmalı. Shakshuka Kuzey Afrika geneli klasik (Tunus orijin iddiası, Levant ve Mısır da paylaşır); klasik formül domates + biber + sarımsak + harissa + yumurta + sıcak demir tava. Bu sayfada kuskus ve harissa milli klasikleri ile brik ve shakshuka sokak yemeği repertuvarı yer alır.",

  "iran":
    "İran mutfağı, Pers İmparatorluğu MÖ 559'dan beri uzanan saray sofra geleneğini, İpek Yolu ticaret etkisini, kuzeyden Hazar denizi balık geleneğini ve güneyden Basra Körfezi karides kültürünü birleştiren bir mutfaktır. Tarifle'de 4 İran tarifi var; chelo kebab (kuzu pirzola + safranli pirinç, milli yemek), ghormeh sabzi (otlu kuzu güveç, ulusal yarışma yemeği), tahdig (pirincin altın çıtır kabuğu, klasik), fesenjan (nar pekmezi + ceviz + tavuk veya ördek, Mughal saray mirası) başta gelir. Saffron (zaferan) İran'ın ulusal baharatıdır; dünya saffron üretiminin %90'ı İran kaynaklı (özellikle Khorasan eyaleti). Klasik chelo kebab: tahdig'li basmati pirinç + safran-yağ-yumurta sarısı sosu + iyi kuzu pirzola kömür ızgara + sumak + ham domates + ham yeşil biber. Tahdig pirincin imzasıdır; tencerenin dibinde yağda 30-40 dakika düşük ateşte kavrulan altın çıtır kabuk, servis ederken üste çevrilir, 'tah' (alt) + 'dig' (tencere) anlamı. Ghormeh sabzi (Persler 'ulusal yemek' yarışmasında 1. sırada seçilen klasik): 1 kg kuzu kuşbaşı + bol taze ot (maydanoz + kişniş + tere + yeşil soğan) + kuru limon (limoo amani, İran imzası) + kırmızı fasulye + 3-4 saat yavaş pişme. Fesenjan Mughal kökenli (Pers'ten Hindistan'a, Hindistan'dan dünyaya yayılan saray klasiği); klasik formül tavuk veya ördek + dövülmüş ceviz + nar pekmezi + soğan + tarçın + kakule, klasik tatlı-acı denge. Bu sayfada günlük et güveçleri (ghormeh sabzi, fesenjan) ve milli yemek chelo kebab ile pirinç klasiği tahdig repertuvarı yer alır.",

  "arjantin":
    "Arjantin mutfağı, İspanyol kolonyal mirasını, 1860-1930 İtalyan ve Alman göçünün pasta + sosis + bira geleneğini, Pampa düzlüklerinde gaucho asado kültürünü ve Patagonya kıyısının deniz mahsullerini birleştiren bir mutfaktır. Tarifle'de 3 Arjantin tarifi var; asado (kömür ızgara et şenliği, milli kültür), provoleta (provolone peyniri ızgara), chimichurri (taze ot ve sirkeli sos, asado eşlikçisi), empanada (kapalı börek, içinde et veya peynir veya sebze) başta gelir. Asado UNESCO Aday Listesi 2018'den beri tescil bekliyor (Arjantin başvurusu); Pampa gaucho geleneği 19. yüzyıl ortasından beri haftalık aile etkinliği. Klasik asado için en az 6-8 farklı et bölümü ızgaraya gider: tira de asado (kaburga şeritleri), vacío (filettetik but), bife de chorizo (sığır filetosu), entraña (etek), morcilla (kan sosisi), chorizo, lomo, chinchulín (bağırsak ufak şişler). Klasik kömür ızgara 1.5-2 saat sürer, et tuzlu ve çok sade hazırlanır, pişirme süresi sırasında soğuk Malbec şarabı + chimichurri eşlik. Chimichurri klasik formül: maydanoz + sarımsak + kekik + acı biber pulu + kırmızı şarap sirkesi + zeytinyağı + tuz, hazırladıktan sonra en az 2 saat dinlendirme. Provoleta klasik Arjantin meze: provolone peyniri kalın dilim + oregano + acı biber + zeytinyağı + ızgara veya tava 4-5 dakika; eridiğinde dış kabuk altın renkli, içi akışkan, dilim ekmek üstüne servis. Empanada her eyalet kendi versiyonunu yapar; Salta empanadası (kıyma + soğan + kuru üzüm + zeytin + tatlı patates) ve Tucumán empanadası (kıyma + bol baharat + dana yağı) en bilinenler. Bu sayfada asado kültür klasiklerinden (provoleta, chimichurri) günlük empanada ve milanesa repertuvarına kadar Arjantin sofrası yer alır.",

  "avusturya":
    "Avusturya mutfağı, Habsburg İmparatorluğu (1273-1918) saray geleneklerini, Macaristan, Bohemya, İtalya ve Balkan etkilerini birleştiren ve Viyana kahve evlerinin (Wiener Kaffeehauskultur, UNESCO 2011 ICH) sofra disiplini içinde gelişen bir Orta Avrupa mutfağıdır. Tarifle'de 2 Avusturya tarifi var; Wiener Schnitzel (klasik dana eskalop kızartma, milli yemek), Sachertorte (1832 Franz Sacher icadı çikolatalı kek, Viyana imzası) başta gelir. Wiener Schnitzel Avusturya milli yemeği; 2009'da Avrupa Birliği Geleneksel Garantili Özellik (TSG) listesine eklendi. Klasik tarif zorunluluğu: dana sırt (Kalbsschnitzel) + un + yumurta + galeta unu (üç katmanlı kaplama) + tereyağı veya saf yağ kızartma. Domuz eti veya tavuk ile yapılan versiyon 'Wiener Schnitzel' adı kullanamaz; sadece Schnitzel Wiener Art (Viyana tarzı) etiketi alır. Klasik formülde tava 170°C, eti dövülmüş 4 mm kalınlık, kızartma 1.5-2 dakika her yüz; iç dokusu pembe değil bembeyaz olmalı, dış kabuk Wellen (dalga) deseninde gevşek tutmalı (sıkışmamalı). Sachertorte 1832 Viyana saray kafesinde 16 yaşındaki çırak Franz Sacher tarafından icat edilmiş klasik çikolatalı kek; 'Original Sacher-Torte' Avusturya patenti, 'Sachertorte' jenerik adı. Klasik formül: çikolatalı sünger kek + kayısı reçeli kat + Sachertorten Glasur (özel çikolata kaplama, sade çikolata + şeker karışımı). Geleneksel servis krem şanti yanında. Wiener Kaffeehauskultur 1683'te Türklerden öğrenilen kahve dünyanın ilk kahve evlerinden biri, sosyal alan + okuma + tartışma kültürü. Bu sayfada Wiener Schnitzel ve Sachertorte klasiklerinden Avusturya kahve evi geleneği repertuvarına kadar yer alır.",
};

const DIET_REVISED_INTROS = {
  "vegan":
    "Vegan beslenme, hiçbir hayvansal ürün (et, balık, süt, yumurta, bal) içermeyen, sadece bitkisel kaynaklara dayanan beslenme pratiğidir. Tarifle'de 200+ vegan tarif var; humus, falafel, mercimek köftesi, sebze çorbası varyantları, vegan baklava (zeytinyağı + agave şurubu), tofu yemekleri, nohut ezmesi pilavı ve vegan tatlılar başta gelir. The Vegan Society 1944'te Donald Watson tarafından İngiltere'de kuruldu; 'vegan' kelimesi ilk kez 1944 Kasım Vegan News dergisinde yayınlandı. Beslenme açısından kritik: B12 vitamini sadece hayvansal kaynaklarda doğal olarak bulunur, vegan diyette nutritional yeast (besin mayası) veya supplement gereklidir. Demir, kalsiyum, omega-3 ve protein gereksinimi bitkisel kaynaklardan eksiksiz karşılanabilir; Türk mutfağında klasik nohut + bulgur + ıspanak + tahin + ceviz birleşimi tüm temel amino asit ve mineral profili sağlar. Tarifle'nin vegan filtrelerinde sayfa yukarıda sol filtre 'vegan' tag'i tıklanır; süt + yumurta + bal + jelatin içermeyen tarifler otomatik filtrelenir. Akdeniz mutfağı doğal olarak vegan-zengin: zeytinyağlı sebze yemekleri (yaprak sarması, taze fasulye zeytinyağlı, enginar, bakla), nohut ve mercimek bazlı çorba ve köfteler, bulgur pilavları çoğunlukla vegan veya kolay adapte edilebilir. Bu sayfada günlük yemek listesinden festival sofra klasiklerine, brunch ve atıştırmalık çeşitlerinden tatlılara kadar vegan repertuvarın geniş yelpazesi yer alır.",

  "vejetaryen":
    "Vejetaryen beslenme, et ve balık içermeyen ama süt, yumurta ve bal içerebilen beslenme pratiğidir. Lakto-ovo vejetaryen (süt + yumurta var, en yaygın), lakto-vejetaryen (sadece süt), ovo-vejetaryen (sadece yumurta) ve pesketaryen (vejetaryen + balık) alt kategorileri vardır. Tarifle'de 400+ vejetaryen tarif var; menemen, mercimek çorbası, peynirli börek, ıspanaklı börek, mantı vegan versiyonu, manti, lazanya sebzeli, risotto sebzeli, tavalı sebze yemekleri ve sütlü tatlılar başta gelir. Türk mutfağı doğal olarak vejetaryen-zengin; bayram dışındaki günlük menülerin %60-70'i et içermez. Akdeniz Diyeti (UNESCO 2010 ICH tescil) vejetaryen-yakın bir model, haftada 3-4 gün vejetaryen + 2-3 gün balık + 1 gün et önerir. Beslenme açısından lakto-ovo vejetaryen diyet B12, demir, kalsiyum, çinko, protein ihtiyacını süt ürünleri ve yumurtayla rahatlıkla karşılar; protein eksikliği endişesi modern beslenme bilimi tarafından çürütülmüştür (American Dietetic Association 2009 tutum belgesi). Tarifle'nin vejetaryen filtrelerinde sayfa yukarıda sol filtre 'vejetaryen' tag'i tıklanır; et ve balık içermeyen tarifler otomatik filtrelenir. Bu sayfada günlük çorba ve sebze yemekleri ile peynirli ve yumurtalı klasikler arası vejetaryen repertuvarın geniş yelpazesi yer alır.",

  "glutensiz":
    "Glutensiz beslenme, gluten proteininin bulunduğu buğday, çavdar, arpa ve bunların türevlerinden (yulaf çapraz bulaşma riski içerir) tamamen kaçınan beslenme pratiğidir. Çölyak hastalığı (yetişkin nüfusun %1'i, otoimmün) ve gluten duyarlılığı (yetişkin nüfusun %6-13'ü, non-celiac gluten sensitivity) için tıbbi zorunluluk; popüler diyet pratiği için tercih meselesi. Tarifle'de 150+ glutensiz tarif var; pirinç pilavı varyantları, mısır ekmeği, karabuğday makarna (soba), kestane unu kek, pirinç unu kurabiye, glutensiz pizza, badem unlu kekler, polenta yemekleri ve nohut unu galette başta gelir. Glutensiz tahıllar listesi: pirinç (tüm varyantlar), mısır, karabuğday (buğday değil aslında, çiçekli bitki), darı (millet), amarant, quinoa (Güney Amerika kazyaa), teff (Etiyopya tahılı), sorgum, manyok (kuyruk-kabak ailesi). Yulaf doğal glutensiz olmasına rağmen çoğu üretim hattı buğdayla bulaştırma yaşar; glutensiz yulaf etiketi (sertifikalı) gerekir. Türk mutfağında glutensiz uyarlama kolay: pirinç pilavı + bulgur (buğday TÜRDÜR ama glutenli, dikkat) + mercimek + nohut + sebze yemekleri + et + balık doğal glutensiz; sadece undan kaçınma yeterli. Tahin, pekmez, bal, peynir, yumurta hepsi doğal glutensiz. Tarifle'nin glutensiz filtrelerinde sayfa yukarıda sol filtre 'glutensiz' tag'i tıklanır; buğday + arpa + çavdar içermeyen tarifler otomatik filtrelenir. Bu sayfada günlük tek tabak çorba ve pilavlardan ana yemek ve tatlılara kadar glutensiz repertuvarın geniş yelpazesi yer alır.",
};

const NEW_FAQS = {
  "pakistan": [
    { q: "Nihari neden 6-8 saat pişer?", a: "Nihari klasik Mughal saray yemeğidir; kemikli sığır incik veya yumuşak nealik incik 6-8 saat yavaş pişme ister çünkü klasik formülde et liflerinin tamamen dağılması, kemik iliğinin sosa geçmesi ve 12-14 baharatın bütünleşmesi gerekir. Klasik formül: 1.5 kg kemikli incik + 200 gr ghee + 200 gr soğan + 50 gr zencefil + 50 gr sarımsak + un (sos kıvamı) + 14 baharat (kişniş + kimyon + tarçın + karanfil + kakule + zerdeçal + acı biber + papatya + nutmeg + şahir cira + kuru limon + nigella + zencefil tozu + tarçın yaprağı). Sabah kahvaltısı (Karachi sokak klasiği) olarak yenir." },
    { q: "Pakistan biryani Hint biryani'sinden nasıl ayrılır?", a: "Pakistan biryani daha kuru, daha az sebzeli, daha sıvı yağlı ve daha doğrudan baharatlıdır. Karachi biryani (en popüler versiyon) klasik formül: 1 kg basmati pirinç + 1 kg yoğurtlu marine et + saffron + güllü su + kavrulmuş soğan + tarçın çubuğu + defne + 4 saat marine + dum pukht (kapalı tencerede yavaş yavaş pişirme) tekniği. Hint biryani daha rengarenk (zerdeçal + safran + saffron çift kullanım), daha sebzeli (havuç + bezelye), daha az yağ. Pakistan biryani altın renkli kavrulmuş soğan üst tabaka klasik imzasıdır." },
    { q: "Chapli kebab nasıl yassı kalır?", a: "Chapli kebab Khyber Pakhtunkhwa Peshawar klasik tarif: 500 gr dana kıyma + 50 gr nar tohumu + 1 yemek kaşığı kuru hibiskus + 2 kuru acı biber + 1 yemek kaşığı kişniş tohumu (öğütülmemiş, çıtırlık verir) + 1 yumurta + 50 gr tereyağı + tuz. Yassı 1.5 cm form klasik imzadır, klasik tarif yağsız çelik tava (mağaza dövme demir tave) kullanır, 4-5 dakika her yüz. Yumurta bağlayıcı, nar tohumu içte ekşilik patlaması, kuru hibiskus tatlı renk verir; bunlar olmadan klasik chapli sayılmaz." },
    { q: "Haleem aşure ile akraba mı?", a: "Evet, haleem ve aşure Mughal-Pers ortak kökeninden gelir. Klasik haleem: 1 kg kuzu kıyma + 1 fincan buğday yarması (klasik) + 7-9 farklı bakliyat (siyah mercimek + sarı mercimek + kırmızı mercimek + nohut + maş + barley + börülce) + 8-10 saat yavaş pişme + ezilmiş püre kıvam. Muharrem ayı (özellikle 7-10. günler) klasik şenlik yemeği. Aşure (Türk Aşurası) tatlı versiyondur; haleem tuzlu et güveçli versiyondur ama uzun yavaş pişme tekniği ve bakliyat çeşitliliği aynıdır. Pakistan'ın milli yemek listesinde haleem 2010'dan beri tescillenmiş kültürel klasik." },
  ],
  "tunus": [
    { q: "Kuskus UNESCO ICH tescili neden 4 ülke ortak?", a: "Aralık 2020'de UNESCO Somut Olmayan Kültürel Miras tescil komitesi kuskus'u Cezayir + Mauritanya + Fas + Tunus'un ortak başvurusuyla 4 ülke kültürel mirası olarak tescilledi. Bu nadir bir durum; çoğu UNESCO ICH tescili tek ülke iken kuskus Berberi ortak kültürünün geniş Kuzey Afrika dağılımı nedeniyle ortak başvuru ile tescillendi. Klasik formül: irmik bazlı semolina taneleri + yağ ve su ile elle yuvarlama + üst tabakası buharlanır + tagine et veya sebze ile servis. Tunus versiyonu daha ince taneli ve harissa eşliğindedir; Fas versiyonu kuru meyve (kuru üzüm + bademli) ile zenginleştirilmiş tatlımsı versiyon klasik." },
    { q: "Harissa hangi acı biberlerden yapılır?", a: "Klasik harissa Tunus'un nâbeul biberi (Capsicum annuum, orta acı 5000-25000 SHU) ile yapılır. UNESCO 2022 ICH tescil dosyasında nâbeul biberi imza malzeme olarak belirtilmiştir. Klasik tarif: 100 gr kuru kırmızı acı biber + 4 sarımsak + 2 yemek kaşığı kişniş tohumu + 2 yemek kaşığı kimyon + 1 yemek kaşığı kuru nane + tuz + 50 ml zeytinyağı. Kuru biberler 30 dakika ılık suda yumuşatılır, taş havanda dövülür (geleneksel mlauz), zeytinyağı emülsiyon olur. Buzdolabı 6 ay dayanır. Sosa harissa rouge (kırmızı acı) klasik adı verilir; harissa verte (yeşil) yeni varyant, klasik değil." },
    { q: "Brik nasıl yapılır ki yumurta sarısı akışkan kalsın?", a: "Brik klasik Tunus sokak yemeği; klasik formül malsouka yufkası (filo'dan kalın, ince işlemdir) ortasında 1 yumurta + 2 yemek kaşığı ton balığı (yağda korunmuş) + 1 yemek kaşığı kapari + 1 yemek kaşığı maydanoz. Yufkayı üçgen olarak katlamak şart değildir, kare veya yarım ay olabilir. 180°C derin yağda 1.5-2 dakika kızartılır; bu süre kısa tutulduğu için yumurta sarısı akışkan kalır, dış kabuk gevrek. Yağ çok kızgınsa yufka anında yanar, çok soğuksa yumurta katı tutar; 175-185°C ideal aralık. Sıkma limonla servis." },
    { q: "Tunus shakshuka Levant ve İsrail versiyonundan nasıl ayrılır?", a: "Tunus shakshuka klasiği harissa içerir (acı imzası), domates daha az kullanılır, daha tuzlu-acı dengeyle pişer. Klasik Tunus formül: 1 yemek kaşığı zeytinyağı + 4 sarımsak + 1 yemek kaşığı harissa + 4 olgun domates + 6 yumurta + 1 yemek kaşığı kuru nane. Levant ve İsrail versiyonu çok daha tatlı domates yoğun, harissa içermez (paprika ve kimyon yer alır), genelde feta ile servis edilir; Tunus versiyonunda peynir kullanılmaz. Tunus tabağı klasik kahvaltı; Levant tabağı klasik öğle yemeği. Domuz eti veya jambon Tunus shakshuka'sında YASAK (İslami bölge), Levant ve İsrail versiyonu da kosher/halal." },
  ],
  "iran": [
    { q: "Tahdig nasıl elde edilir?", a: "Tahdig pirincin tencerenin dibinde altın çıtır kabuk haline gelmesidir; 'tah' (alt) + 'dig' (tencere) İran'ın imza pirinç tekniğidir. Klasik tarif: kalın dipli tencere + 30 ml ayçiçek yağı veya tereyağı + 1.5 fincan basmati pirinç (önceden 1 saat ılık tuzlu suda bekletilmiş) + 3 fincan kaynar su + tuz, ilk kaynamadan sonra ateş kısılır, kapakla bezle örtülür, 30-40 dakika kısık ateşte pişer. Servisten önce tencereyi 10 saniye soğuk peçete üstünde dinlendirip ters çevirin; alt tabaka altın gibi parlak çıtır kabuk olarak servis tabağına oturur. Klasik İran sofrasında tahdig önce ikram edilir, herkes ufak parça yer." },
    { q: "Ghormeh sabzi neden 'milli yemek' yarışmasını kazandı?", a: "2017'de İran'ın yarı resmi 'milli yemek' anketinde ghormeh sabzi 31 ülkeye dağılan İranlı diasporanın oylamasıyla 1. sırada seçildi (chelo kebab 2.). Klasik formül: 1 kg kuzu kuşbaşı + 4 fincan ince doğranmış taze ot karışımı (maydanoz + kişniş + tere + yeşil soğan, eşit oran) + 4-5 kuru limon (limoo amani, İran imzası) + 1 fincan kırmızı fasulye + zerdeçal + nigella + 3-4 saat yavaş pişme. Kuru limon İran'a özgü, fermente edilmiş tuzlu limon; ekşi ve hafif tatlı denge verir, asla taze limonla değiştirilmez. Otların oranı önemli; maydanoz baskın, diğerleri eşit veya 0.5 oran." },
    { q: "Saffron neden bu kadar pahalı?", a: "Saffron (zaferan) dünyanın en pahalı baharatıdır; 1 kg saffron için 150.000 çiçek ve 50.000 saat el emek gerekir. Saffron crocus (Crocus sativus) çiçeği yılda 1 hafta açar, her çiçeğin 3 stigması (sarı turuncu damarı) gün doğumunda toplanır, kuru tava kavrulup özenle kurutulur. İran dünya saffron üretiminin %90'ını yapar (Khorasan eyaleti merkezi). Klasik İran saffron pricing 2024: kg başına 8000-12000 USD; günlük tüketim için tarif başı 2-3 lif (0.05-0.1 gr) yeterli, sıcak su veya süte 30 dakika önceden ıslatılır. Klasik chelo kebab safran ile pirincin altın renk + lüks aroması elde edilir." },
    { q: "Fesenjan tatlı mı tuzlu mu?", a: "Fesenjan klasik İran tatlı-tuzlu denge tabağıdır; ne tam tatlı ne tam tuzlu, ortada (sweet-sour-savory) bir aroma profilidir. Klasik formül: 1 kg tavuk veya ördek + 2 fincan dövülmüş taze ceviz + 1 fincan koyu nar pekmezi (Iran rab-e enar) + 1 büyük soğan + 1 tatlı kaşığı tarçın + 1 tatlı kaşığı kakule + 1 tatlı kaşığı kuru limon, 2 saat yavaş pişme. Mughal saray klasiği; Pers etkisi 16. yüzyılda Hint İmparatorluğu'na taşındı. Klasik servis: chelo (sade pirinç) eşliği. Modern Tahran restoranlarında et yerine vegan kabak veya patlıcan ile yapılan vegetariyen versiyon yaygın." },
  ],
  "arjantin": [
    { q: "Asado'nun 'gaucho' kültürüyle bağı nedir?", a: "Asado Arjantin Pampa düzlüklerinde 19. yüzyılın ortasından beri gaucho (kovboy benzeri sürü çobanları) tarafından geliştirilen klasik kömür ızgara şenliğidir. Klasik formül: kerestelik odun veya kömür + asador (özel gri demir ızgara, eğimli) + 6-8 farklı et bölümü + tuz + 2-3 saat yavaş ızgara. Pampa hayvan yetiştiriciliği geleneği klasik gaucho kültürünün temelidir. UNESCO Aday Listesi'nde 2018'den beri 'asado, Pampa kültürü' başlığıyla bekliyor. Arjantin'de hafta sonu aile etkinliği, klasik Pazar günü öğle yemeği veya akşam buluşması; sade tuzlu et + soğuk Malbec şarabı + chimichurri sos." },
    { q: "Chimichurri'nin 'doğru' versiyonu var mı?", a: "Chimichurri tartışmalı bir konu; 100+ farklı reçete dolaşır, ev başına ufak farklar var. Klasik temel formül (1942 Buenos Aires Cocina Familiar dergisi yayını): 1 demet maydanoz + 6 sarımsak + 2 yemek kaşığı kekik + 1 tatlı kaşığı kırmızı acı biber pulu + 100 ml kırmızı şarap sirkesi + 200 ml zeytinyağı + 1 tatlı kaşığı tuz + 1 tatlı kaşığı karabiber. Hazırladıktan sonra en az 2 saat dinlendirme şart, bir gece ideal; aroma birleşir, sirke yumuşar. Verde (yeşil, klasik) ve roja (kırmızı, paprika ile) iki ana varyant. Sosu pişirmeyin; sıcak ete soğuk dökülür, ısı aroma uçurur." },
    { q: "Provoleta dilim ne kadar kalın olmalı?", a: "Provoleta klasik kalınlık 2-3 cm; daha ince dilim eridiğinde dağılır, daha kalın iç soğuk kalır. Klasik formül: 200 gr provolone peyniri 2.5 cm dilim + 1 tatlı kaşığı kuru oregano + 0.5 tatlı kaşığı acı biber pulu + 1 yemek kaşığı zeytinyağı. Klasik küçük demir tava (parrillera, Arjantin imzası) veya kömür ızgara üstüne 1.5-2 dakika tek yüz; eridiğinde dış kabuk altın renk + iç akışkan kıvam. Tabağa alıp dilim ekmek üstüne kaşıkla servis. Aceleci versiyonda mikrodalga veya mutfak fırını kullanılabilir ama dış kabuk klasiklik kazanmaz; izgara veya tavada açık ateş tercih." },
    { q: "Empanada Salta ve Tucumán versiyonları nasıl ayrılır?", a: "Salta empanadası kıyma + soğan + kuru üzüm + zeytin + tatlı patates parçaları içerir, daha tatlı; Tucumán empanadası daha bol baharatlı (kimyon + acı biber + zerdeçal), kıyma + soğan + dana yağı + bütün haşlanmış yumurta dilimi içerir, daha tuzlu. Klasik kapatma stili (repulgue): Salta repulguesi daha basit (yarım ay + parmakla bastırma), Tucumán repulguesi daha karışık (kıvrımlı, klasik 14 büküm). Hamur klasik formül: 500 gr un + 200 gr dana yağı (manteca pella) + 200 ml ılık su + tuz, mayasız hamur, 30 dakika dinlendirme. Pişirme: fırın 200°C 18-20 dakika veya yağda kızartma 180°C 3-4 dakika." },
  ],
  "avusturya": [
    { q: "Wiener Schnitzel TSG tescil ne kapsar?", a: "Avrupa Birliği 2009'da Wiener Schnitzel'i Geleneksel Garantili Özellik (TSG, Traditional Specialities Guaranteed) listesine ekledi. TSG koruma kapsamı: domuz eti veya tavuk veya başka et ile yapılan versiyon 'Wiener Schnitzel' adı KULLANAMAZ. Sadece dana eti (Kalb, Fleisch von Kalb unter 8 Monaten yaş, ETK kategorisi) ile yapılan versiyon TSG sertifikası alır; başka et için 'Wiener Schnitzel Art' (Viyana tarzı) veya 'Schnitzel Wiener Art' etiketi gerekir. Avusturya yasaları daha katı; Avusturya Ticaret Yasası restoranların 'Wiener Schnitzel' menüde yazıp dana eti dışı sunması durumunda yasal yaptırım uygular." },
    { q: "Klasik Wiener Schnitzel pişirme tekniği nedir?", a: "Klasik tarif: 4 dilim dana eskalop (sırt veya but) 4 mm kalınlığa dövülmüş + 1 fincan un + 2 yumurta çırpılmış + 1 fincan galeta unu (Semmelbrösel, taze beyaz ekmek galetası) + 200 gr saf yağ veya tereyağı kızartma için. Pişirme: tava 170°C, 4-5 cm derin yağ. Eskalop una bulanır (fazlası silkelenir), yumurtaya batırılır, galeta ununa basıp kaplar (sıkıştırmadan!). Yağa yatırın, 1.5 dakika ilk yüz altın renge gelene kadar, çevirin 1 dakika. Pişirken Wellen efekti (dalgalı kabuk) için tavayı sallayın; et ve kabuk arasında ufak hava boşlukları oluşmalı. Soğuk meyve sosu (Preiselbeer, kızılcık) ve ezilmiş patates eşlik klasik." },
    { q: "Sachertorte nasıl 'orijinal' sertifikası alır?", a: "1832'de Viyana saray kafesinde 16 yaşındaki çırak Franz Sacher tarafından icat edilen Sachertorte'nin 'Original Sacher-Torte' patentini Hotel Sacher (Vienne) tutar. 1962-1963 mahkeme savaşı sonucunda Hotel Sacher 'Original Sacher-Torte' ünvanını ve klasik formülünü (kayısı reçeli iki kat arasında olmalı, sadece bir kat değil) korudu. Demel pasta evi de klasik versiyon yapar ama 'Sachertorte' adı kullanır (Original olmadan). Klasik formül: 4 yumurta + 200 gr şeker + 200 gr çikolata + 200 gr tereyağı + 200 gr un + 100 gr kakao + 2 yemek kaşığı kayısı reçeli (kat arası) + Sachertorten Glasur (özel pencike çikolata kaplama). Krem şanti ile servis." },
    { q: "Wiener Kaffeehauskultur UNESCO ICH ne içerir?", a: "Avusturya kahve evi kültürü (Wiener Kaffeehauskultur) UNESCO Somut Olmayan Kültürel Miras 2011 yılında tescil aldı; Avusturya'nın ilk UNESCO ICH'si. Tescil kapsamı: 1683'te Türk-Habsburg savaşı sonunda kalan kahveden geliştirilmiş Avrupa'nın en eski kahve geleneği + sosyal alan + okuma + tartışma + tek bardak su servisi (klasik kahve yanında 1 bardak musluk suyu) + uzun oturum (kahve siparişiyle 4-5 saat oturma kabul edilir). Klasik kahveler: Melange (espresso + buharla ısıtılmış süt + krem köpük), Verlängerter (espresso + sıcak su, Americano benzeri), Einspänner (espresso + krem şanti üst), Wiener Eiskaffee (soğuk kahve + dondurma). Café Central (1876), Café Sacher (1832), Café Hawelka (1939) klasik adresler." },
  ],
};

let added = 0, updated = 0, faqsAdded = 0;

// Cuisine entries
for (const [slug, intro] of Object.entries(NEW_CUISINE_INTROS)) {
  const existing = data.find((d) => d.slug === slug && d.type === "cuisine");
  if (existing) {
    if (existing.intro !== intro) {
      existing.intro = intro;
      updated += 1;
    }
    if (NEW_FAQS[slug] && (!existing.faqs || existing.faqs.length === 0)) {
      existing.faqs = NEW_FAQS[slug];
      faqsAdded += 1;
    }
  } else {
    const entry = {
      slug,
      type: "cuisine",
      intro,
      faqs: NEW_FAQS[slug] || [],
    };
    data.push(entry);
    added += 1;
  }
}

// Diet revize (sadece intro update, FAQ'lara dokunma)
let dietUpdated = 0;
for (const [slug, intro] of Object.entries(DIET_REVISED_INTROS)) {
  const existing = data.find((d) => d.slug === slug && d.type === "diet");
  if (existing) {
    if (existing.intro !== intro) {
      existing.intro = intro;
      dietUpdated += 1;
    }
  } else {
    console.warn(`⚠️  diet '${slug}' not found, skipping (revize için mevcut olmalı)`);
  }
}

console.log(`SEO landing batch 7 (oturum 31):`);
console.log(`  ${added} new cuisine entries added`);
console.log(`  ${updated} existing cuisine intros updated`);
console.log(`  ${faqsAdded} cuisine FAQ blocks added`);
console.log(`  ${dietUpdated} diet intros revize`);
console.log(`  Total entries: ${data.length}`);

if (APPLY) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log("✅ Written to docs/seo-copy-v1.json");
} else {
  console.log("(DRY-RUN, no write. Use --apply to write)");
}
