#!/usr/bin/env node
/**
 * P1 SEO landing batch 5 (oturum 29): top 30-34 derinlik insert.
 * Pattern: oturum 25 batch 1 (top 5) + oturum 26 batch 2 (top 6-12)
 * + oturum 27 batch 3 (top 13-20) + oturum 27 batch 4 (top 21-29) +
 * oturum 28 paketi 14 FAQ tamamlama 5 entry. Devamı.
 *
 * Hedef 5 yeni cuisine landing (insert, mevcut değil):
 *   - cuisine/brezilya (15 tarif, YENI)
 *   - cuisine/peru (15 tarif, YENI)
 *   - cuisine/iskandinav (18 tarif, YENI)
 *   - cuisine/rus (24 tarif, YENI, en yuksek trafik)
 *   - cuisine/macar (12 tarif, YENI)
 *
 * Her entry: intro 150-250 kelime + 4 FAQ q/a (somut sayi + UNESCO/CI/
 * otorite + pratik öngörü pattern).
 *
 * Idempotent: mevcut entry varsa intro update, yoksa insert. FAQ varsa
 * dokunma, yoksa ekle.
 *
 * Em-dash (— U+2014) yasak (AGENTS.md): virgül, noktalı virgül, nokta,
 * parantez, iki nokta kullanıldı.
 *
 * Usage: node scripts/seo-revise-batch5.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const file = path.resolve(process.cwd(), "docs/seo-copy-v1.json");
const data = JSON.parse(fs.readFileSync(file, "utf-8"));

const NEW_INTROS = {
  "cuisine:brezilya":
    "Brezilya mutfağı, Portekiz kolonyal mirası, Afrika köleliğinin Bahia kıyısına taşıdığı dendê yağı ile baharatlar ve yerli Tupi-Guarani halklarının manyok kültürünün tek tabakta birleştiği zengin bir mutfaktır. Tarifle'de 15 Brezilya tarifi var; feijoada (siyah fasulye + tütsülenmiş et), moqueca de peixe ve moqueca de banana, brigadeiro, pão de queijo, vatapa (Bahia karidesli sos), coxinha, picanha, farofa, açaí na tigela ve quindim başta gelir. Bölgesel ayrım belirgin: Bahia (Afrika etkisi en yoğun, dendê yağı + malagueta biber + hindistan cevizi sütü), Minas Gerais (peynir + pão de queijo + tutsel doce de leite), São Paulo (İtalyan göçü etkisi, pizza ve pasta uyarlamaları), Rio Grande do Sul (gaucho geleneği, churrasco etleri), Amazon (yerli + nehir balığı). Feijoada Brezilya milli yemeği kabul edilir; klasik tarif siyah fasulye + 6-8 farklı et (tütsülenmiş kuyruk, kaburga, sosis, kulak) + 4 saat yavaş pişirme ister. Pão de queijo'nun sırrı manyok nişastası (tapioca starch), buğday unu KULLANILMAZ; doğal glutensiz. Açaí na tigela bowl'u Amazon palmiyesi meyvesinden yapılır, klasik granola + muz + gronola topping (Rio'lu plaj kahvaltısı simgesi). Pão de açúcar şehir simgesi olduğu kadar Brezilya'da yaşam tarzının da göstergesidir. Bu sayfada günlük tek tabak feijoada ve moqueca'dan sokak yemeği coxinha ve pão de queijo'ya, tropikal tatlılar açaí ve brigadeiro'ya kadar geniş Brezilya repertuvarı yer alır.",

  "cuisine:peru":
    "Peru mutfağı, And dağ silsilesinin yerli kültürlerini, İber kolonyal mirasını, Çin-Peru göçünün doğurduğu chifa füzyonunu ve Japon-Peru göçünden çıkan Nikkei mutfağını tek bir geleneğin parçası kılan eklektik bir mutfaktır. Tarifle'de 15 Peru tarifi var; ceviche (milli yemek), lomo saltado, aji de gallina, anticuchos, papa rellena, causa limeña, suspiro a la limeña, picarones, mazamorra morada ve arroz con pollo başta gelir. UNESCO Somut Olmayan Kültürel Miras (2023): Peru'nun ceviche hazırlama bilgisi ve teknikleri Aralık 2023'te tescillendi. Peru, dünyada 4000+ patates çeşidine ev sahipliği yapan tek ülke (Uluslararası Patates Merkezi CIP, Lima merkezli, FAO ortağı). Klasik ceviche için: taze beyaz et balığı (corvina veya sea bass) + Lima limonu (sade limon değil) + soğan + aji limo + kişniş + tuz, 5-15 dakika denatüre. Lomo saltado chifa simgesidir: dana antrikot + soya sosu + sirke + soğan + domates + yeşil biber + kızarmış patates, wok yüksek ısıda 4-5 dakika. Aji amarillo (sarı acı biber) Peru'nun temel acı taşıyıcısıdır, dondurulmuş veya pasta haliyle kullanılır. Anticuchos klasiği klasik Inka mirası: dana yüreği şişe geçirilip sarı biberli marine + kömür ızgara, Lima sokaklarında 2 dolarlık akşam atıştırmalığı. Bu sayfada günlük chifa lokanta tabaklarından (lomo saltado), kıyı sokak yemeklerine (ceviche, anticuchos), klasik And tatlılarına kadar geniş yelpaze yer alır.",

  "cuisine:iskandinav":
    "İskandinav mutfağı, kuzey enleminin dört mevsim disiplinini, soğuk Atlantik ve Baltık deniz mahsullerini, kısa yaz ışığında olgunlaşan meyve ve sebzeyi paylaşan dört ülkenin (İsveç, Norveç, Danimarka, Finlandiya) ortak adıdır. Tarifle'de 18 İskandinav tarifi var; gravlax (Skandinavya somonu), İsveç köftesi (köttbullar), kanelbullar (tarçın çöreği), smørrebrød (Danimarka açık sandviç), aebleskiver, lussekatter (lussecat çöreği), karjalanpiirakka (Karelya turtası), Norveç tütsülenmiş somonu, herring marinade ve Danimarka domuz pirzolası başta gelir. Yeni İskandinav Mutfağı (New Nordic Cuisine) manifestosu 2004'te Kopenhag'da imzalandı; 12 Nordic Council kuralı: yöresel + mevsimlik + temiz + sağlıklı + sürdürülebilir + arınmış. René Redzepi'nin Noma restoranı (Kopenhag) bu manifestonun simgesi, dünyada 5 kez 'En İyi Restoran' seçildi (2010-2014, 2021). Lagom (İsveççe yeterlilik felsefesi) sofraya da yansır: ne az ne çok, mevsim ve yöre. Kanelbullar Day İsveç'te 4 Ekim resmi gün; klasik tarif kardamom + tarçın + esmer şeker + tereyağı sarmal hamur. Hyggekrog (Danca rahat köşe) konsepti yemekle iç içe; akşam fika veya hyggelig kahve ortamı kanelbullar ile tamamlanır. Smørrebrød tek katlı çavdar ekmek üstüne dikkatli üst-üste dizilim klasik (ringa + kapari + soğan veya domuz + maydanoz + soğuk patates klasik kombolar). Bu sayfada hafif balık + ekmek atıştırmalıklarından klasik İsveç köftesine, tarçınlı çörek ve sıcak içeceklere kadar geniş İskandinav repertuvarı yer alır.",

  "cuisine:rus":
    "Rus mutfağı, Doğu Avrupa Slav geleneklerini, Kafkasya ve Orta Asya etkilerini, soğuk iklim koruma teknikleri (turşu, fermantasyon, salamura) ile birleştiren geniş bir mutfaktır. Tarifle'de 24 Rus tarifi var; borşç (kırmızı pancar çorbası), beef stroganoff (1871 Aleksandrov yarışmasında ilk kez yazılı), pelmeni (Sibirya etli mantı), bliny (mayalı pancake), pirojki (kapalı börek), golubtsi (lahana sarması), salat olivier (Olivye salatası), syrniki, kvass ve medovik (bal kek) başta gelir. Borşç UNESCO 2022 Acil Koruma Listesi'nde (Ukrayna'nın talebiyle, 1 Temmuz 2022 tescili); savaş süresince koruma altında bir kültür mirası kabul edildi, yine de Rus mutfağında 200+ varyasyonu vardır. Klasik borşç pancar + lahana + havuç + soğan + sarımsak + dereotu + smetana (ekşi krema topping) + 2-3 saat yavaş kaynama, bazı bölgelerde et kemiği bulyon, vegan varyant da klasik. Pelmeni (Sibirya kökenli, 14. yy Volga ovasına ulaştı) klasik tarif buğday hamuru + dana ve domuz kıyma + soğan + tuz + karabiber + kaynar suda 7-8 dakika; smetana ve sirke ile servis. Beef Stroganoff'un kökeni 1871 Pavel Aleksandrov'un Saint Petersburg aşçılık yarışmasına sunduğu tarif (Kont Stroganov ailesi adına): ince dana eti + soğan + mantar + ekşi krema + Dijon + paprika. Sibirya'nın -40°C kışlarında pelmeni doğal donduruculu klasik kıştan kalmadır. Bu sayfada günlük çorba ve mantı tabaklarından klasik et tabaklarına, kahvaltı blini ve syrniki'ye kadar geniş Rus repertuvarı yer alır.",

  "cuisine:macar":
    "Macar mutfağı, Karpat Havzası'nın geniş otlaklarında yetişen sığır ve domuzla, paprika baharat geleneğiyle ve Avrupa'nın en eski tatlı şarabı Tokaji ile özdeşleşmiş bir mutfaktır. Tarifle'de 12 Macar tarifi var; gulyás (gulaş, çoban çorbası), pörkölt (paprikalı et güveç), csirkepaprikás (paprikalı tavuk), halászlé (balıkçı çorbası), tölött káposzta (sarma lahana), lángos (mayalı kızartma ekmek), gomboce (eriklı patates köftesi), Dobos torta (1884 Joseph Dobos icadı, çikolata + karamel kek) ve Tokay aszú şarabı başta gelir. Paprika 1500'lerin sonunda Osmanlı İmparatorluğu fethi sırasında Macaristan'a girdi; bugün altı resmi sınıf var (különleges/extra mild → erős/spicy hot, Hungarian Paprika PGI 2010 AB tescilli). Klasik gulyás 14. yüzyıl çoban (gulyás = sürü çobanı) tarifidir; sığır eti + soğan + paprika + kimyon tohumu + patates + biber + 2-3 saat yavaş kaynama (çorba kıvamlı, sulu güveç değil). Halászlé Tisza nehri kıyısı klasiği: tatlı su balığı (sazan + turna) + yoğun paprika + soğan + acı yeşil biber, demir kazanda açık ateşte pişirilir. Lángos (mayalı kızartma) klasik 30 dakika mayalanmış hamur + 180°C yağda 2-3 dakika kızartma + sarımsaklı yağ + ekşi krema + rendelenmiş peynir; sokak yemeği klasiği. Tokaji aszú dünyanın ilk botrytis (asil küf) tatlı şarabı, Sauternes ve İcewine'dan eski (1571 ilk yazılı kayıt). Bu sayfada gulyás ve halászlé gibi sıcak çorbalardan paprikalı et güveçlere, klasik Dobos kek ve eriklı tatlılara kadar geniş Macar repertuvarı yer alır.",
};

const NEW_FAQS = {
  "cuisine:brezilya": [
    {
      q: "Pão de queijo neden glutensizdir?",
      a: "Pão de queijo manyok nişastasından (tapioca starch) yapılır, buğday unu kullanılmaz; doğal olarak glutensizdir. Klasik tarif manyok nişastası + süt + tereyağı + yumurta + Minas Gerais peyniri (queijo Minas) veya parmesan. Brezilya'da Minas Gerais eyaleti pão de queijo'nun ana yurdu, 16. yüzyıl köle mutfağına dayanır. 180°C fırın 25-30 dakika klasik pişirme süresi, üst altın renge dönmeli ve hafif çatlamalı.",
    },
    {
      q: "Feijoada gerçekten Brezilya milli yemeği midir, kökeni kölelik mutfağı mı?",
      a: "Feijoada Brezilya milli yemeği kabul edilir; klasik tarihçi anlatı, köle mutfağında efendinin atmadığı et parçalarının (kuyruk, kulak, ayak) siyah fasulyeyle pişirilmesi olarak özetlenir. Modern akademik araştırmalar bu hikayeyi kısmen romantize edilmiş olarak değerlendirir: feijoada kökleri Portekiz İber yarımadasının cocido yemeklerine dayanır. Yine de feijoada 19. yüzyıl Rio'da kentsel orta sınıf yemeği olarak yerleşti; bugün Cumartesi geleneksel feijoada günü, ailecek 4 saat yavaş pişirme ile servis edilir.",
    },
    {
      q: "Açaí na tigela bowl'u Amazon palmiyesinden mi yapılır, granola sosu nedir?",
      a: "Açaí Amazon palmiyesi (Euterpe oleracea) meyvesinden yapılır; antioksidan açısından zengin (ORAC değeri 102,700, blueberry'nin 6 katı). Klasik bowl: dondurulmuş açaí pulpası + muz veya çilek + Amazon guarana şurubu, blender pürelenir. Topping klasik granola + muz dilimi + bal veya kondanse süt. Rio'lu plaj kahvaltısı simgesi (Copacabana 1980'lerde popülerleşti), bugün dünyada superfood olarak bilinen formu.",
    },
    {
      q: "Brezilya mutfağında bölgesel farklar en belirgin nerede görülür?",
      a: "Bölgesel farklar Bahia ve Minas Gerais arasında en keskin görünür. Bahia (kuzeydoğu) Afrika köleliği etkisiyle dendê yağı (kırmızı palmiye yağı), malagueta biberi, hindistan cevizi sütü ve karides yoğun (vatapa, moqueca de peixe simgeleri). Minas Gerais (iç kesim) İber tabanlı + peynir geleneği güçlü (pão de queijo, queijo Minas, doce de leite). São Paulo İtalyan göçü ile pizza ve pasta odaklı, Rio Grande do Sul ise Arjantin sınırı gaucho churrasco geleneğine yakındır.",
    },
  ],
  "cuisine:peru": [
    {
      q: "Peru ceviche'sinin UNESCO statüsü nedir, klasik formülü nasıldır?",
      a: "Peru'nun ceviche hazırlama bilgi ve teknikleri Aralık 2023'te UNESCO Somut Olmayan Kültürel Miras Listesi'ne girdi. Klasik formül: taze beyaz balık (corvina veya sea bass) küp doğranır, Lima limonu suyu + ince doğranmış kırmızı soğan + aji limo (Peru sarı acı biberi) + tuz + kişniş ile 5-15 dakika marine edilir; asitle denatüre olur (pişmeden). Yanına choclo (Peru iri taneli mısırı) ve cancha (kavrulmuş mısır) eşlik eder. Marinemden çıkan limonlu süte 'leche de tigre' (kaplan sütü) denir; ayrı içecek olarak da servis edilir, mahmurluk önleyici sayılır.",
    },
    {
      q: "Chifa nedir, lomo saltado neden Peru ile Çin füzyonudur?",
      a: "Chifa, 19. yüzyıl ortasından sonra Peru'ya gelen Çinli (özellikle Kantonca) göçmenlerin Peru malzemeleriyle Çin teknik çakıştırmasıdır. Lomo saltado chifa simgesi: dana antrikot ince dilim + soya sosu + Çin sirkesi + soğan + domates + aji amarillo + wok yüksek ısı 4-5 dakika kavurma + servis pirinç + kızarmış patates ile. Çin tekniği wok hei + Peru malzemesi (aji amarillo) + İspanyol kolonyal patates birleşimi. Lima'da 6000+ chifa lokantası var, en eski 1921 (Chifa Wa Lok hâlâ ayakta).",
    },
    {
      q: "Peru'da kaç patates çeşidi var, papa rellena hangi çeşitten yapılır?",
      a: "Peru, 4000+ patates çeşidine ev sahipliği yapan tek ülke; Uluslararası Patates Merkezi (CIP, Lima merkezli, FAO ortağı) bu çeşitleri arşivler. Çeşitler renklere göre ayrılır: papa amarilla (sarı, en yaygın), papa morada (mor), papa nativa (yerli yüksek dağ çeşidi), papa huayro, papa peruanita. Papa rellena için papa amarilla klasiktir; haşlanır ezilir, içine kavrulmuş kıyma + soğan + aji + zeytin + yumurta dolgusu konur, kroket şekli verilir, kızgın yağda kızartılır. Klasik Lima sokak yemeği.",
    },
    {
      q: "Suspiro a la limeña neden 'Lima'nın iç çekişi' diye adlandırılır, klasik formül nedir?",
      a: "Suspiro a la limeña (Lima'nın iç çekişi) adını 19. yüzyıl Limalı şair Antonio Cabero'nun bu tatlıyı eşine adadığı dize sayesinde aldı. Klasik formül iki katmanlıdır: alt manjar blanco (kondanse süt + yumurta sarısı + 30-40 dakika kıvamlanma, dulce de leche akrabası) + üst port şarabı veya tarçınla aromalı İtalyan beze (yumurta beyazı + şeker şurubu kıvamlı kar). Üzerine tarçın serpilir, küçük cam bardakta servis edilir. Lima koloni döneminin en sevilen tatlısı.",
    },
  ],
  "cuisine:iskandinav": [
    {
      q: "Yeni İskandinav Mutfağı (New Nordic Cuisine) manifestosu nedir?",
      a: "Yeni İskandinav Mutfağı manifestosu 2004 Kasım'da Kopenhag'da Nordic Council aracılığıyla 12 İskandinav şefi tarafından imzalandı; René Redzepi (Noma) ve Claus Meyer öncüsüdür. 10 kural: yöresel + mevsimlik + saf + temiz + sağlıklı + sürdürülebilir + İskandinav coğrafyasının ham aromaları + minimum işlem + hayvan refahı + kültürel miras. Noma restoranı bu manifesto sayesinde dünyada 5 kez 'En İyi Restoran' seçildi (2010-2014, 2021). Bugün İskandinav restoran standardı bu manifesto ile şekillenir.",
    },
    {
      q: "Kanelbullar İsveç klasik tarçın çöreği nasıl yapılır, Kanelbullar Day nedir?",
      a: "Kanelbullar (İsveç tarçın çöreği) klasik tarif: mayalı süt-tereyağı hamuru + tarçın + esmer şeker + kardamom (İsveç klasiği) + zerdeçal hamur. Hamur açılır, dolgu yayılır, sarmal kesilir, üzerine inci şeker (pärlsocker) serpilir, 200°C 8-10 dakika fırın. Kanelbullar Day İsveç'te resmi gün, 4 Ekim 1999'da Hembakningsrådet (Ev Pişirme Konseyi) tarafından ilan edildi. Bugün 4 Ekim'de İsveç fırınları kanelbullar üretimini yoğunlaştırır, fika kahvesi (öğleden sonra kahve molası) ile tüketim klasiktir.",
    },
    {
      q: "Smørrebrød Danimarka açık sandviçinin klasik kombinasyonları nelerdir?",
      a: "Smørrebrød (yağlı ekmek) tek katlı çavdar ekmeği (rugbrød) üstüne dikkatli dizilim klasik açık sandviçtir; Danimarka öğle yemeği geleneği. Klasik kombinasyonlar: marine ringa + soğan + kapari + dereotu (Sild på rugbrød), tütsülenmiş somon + dill mayonez + limon (Røget laks), domuz pirzolası + maydanoz + kırmızı lahana (Stegt flæsk), karides + yumurta + dill + mayonez (Rejer). Klasik sıralama: balık önce, et sonra, peynir en son; her smørrebrød ayrı çatal-bıçakla yenir.",
    },
    {
      q: "Hygge konsepti yemek kültürünü nasıl etkiler?",
      a: "Hygge (Danca, telaffuz: hu-gah) rahatlık, samimiyet ve dingin keyif anlamına gelen Danimarka konseptidir; 2016'da Oxford Sözlüğü Yılın Kelimesi finalisti. Yemek kültüründe hygge mum ışığı + sıcak içecek (kahve, kakao) + tarçınlı çörek + battaniye + dingin sohbet kombinasyonu olarak yansır. İskandinav kışı uzun ve karanlık (Aralık günde 6 saat ışık), hygge bu zorlu mevsime dingin bir cevaptır. Yemek tarafı sade, yöresel ve mevsimlik (kış kök sebze yemekleri, yaz Atlantik somonu) klasiktir.",
    },
  ],
  "cuisine:rus": [
    {
      q: "Borşç hangi ülkenin yemeği, UNESCO koruma altında mı?",
      a: "Borşç hem Ukrayna hem Rus hem Polonya hem Belarus mutfaklarında yer alır; Slav ortak mirasıdır. UNESCO 1 Temmuz 2022'de Ukrayna'nın talebiyle borşç hazırlama kültürünü Acil Koruma İhtiyacı Listesi'ne aldı (savaş tehdidi altında kültürel miras gerekçesiyle). Yine de Rusya'da 200+ varyasyonu vardır: Moskova borşç (et bulyonu yoğun), Sibirya borşç (donmuş et + lahana ağır), Beyaz borşç (pancarsız, ekşi krema). Klasik tarif: pancar + lahana + havuç + soğan + sarımsak + dereotu + 2-3 saat yavaş kaynama + smetana topping.",
    },
    {
      q: "Beef Stroganoff'un kökeni nedir, gerçekten Kont Stroganov mu icat etti?",
      a: "Beef Stroganoff ilk yazılı kayıt 1871 Saint Petersburg aşçılık yarışması, Pavel Aleksandrov'un Stroganov ailesi adına sunduğu tarif. Aleksandrov, Kont Aleksandr Grigorevich Stroganov'un Fransız stilinde özel aşçısıydı; ince dilimlenmiş antrikot + ekşi krema + Dijon hardalı klasik formülü buradan çıktı. Yemeğin Kont'a adanma sebebi tartışmalı (bazı kaynaklar Kont'un yaşlanan dişleri için yumuşak et tarifi olarak geliştirildi der). 1939 New York Dünya Fuarı'nda Sovyet pavyonu sayesinde dünyaya yayıldı.",
    },
    {
      q: "Pelmeni nereden gelir, neden Sibirya kıştan kalma yemek sayılır?",
      a: "Pelmeni 14. yüzyıl Komi-Permyak halklarına ait Ural Dağları kıştan kalma tekniğidir; etli mantı kar üzerinde donmuş halde saklanırdı, kış aylarında kazanda haşlanırdı. Volga ve Sibirya'ya yayıldı, klasik tarif buğday hamuru + dana + domuz + soğan + tuz + karabiber kıyma harç. Sibirya'nın -40°C kışında doğal dondurucu olarak ev dışı saklama yapılır, kazanda 7-8 dakika haşlanır, smetana + sirke + dereotu ile servis. Bugün Rus mutfağının en sevilen mantı yemeği.",
    },
    {
      q: "Olivye salatası neden Rus salatası diye dünyaya yayıldı, klasik tarif nedir?",
      a: "Olivye salatası 1860'larda Moskova Ermitaj restoranının baş aşçısı Lucien Olivier (Belçikalı) tarafından yaratıldı; orijinal tarif gizli kaldı (Olivier ölünce tarif kayboldu). Sovyet dönemi 1920'lerde Ivan Ivanov tarafından ucuz malzemelerle yeniden yorumlandı: haşlanmış patates + havuç + bezelye + kornişon turşu + bologna sosis + yumurta + mayonez. Yeni yıl arifesinde Rus sofrasının vazgeçilmez salatasıdır. Avrupa ve Türkiye'de 'Rus salatası' adıyla yayıldı, kornişon ve mayonez tabanı klasiği taşıdı.",
    },
  ],
  "cuisine:macar": [
    {
      q: "Macar paprika kaç tip vardır, gulyás'ta hangisi kullanılır?",
      a: "Macar paprikası altı resmi sınıfa ayrılır (en mild → en acı): különleges (özel, en mild), édes csípmentes (tatlı, acısız), édesnemes (tatlı, en yaygın), félédes (yarı tatlı), rózsa (gül, hafif acı), csípős (acılı, en keskin). Hungarian Paprika Avrupa Birliği PGI tescilli (2010), Kalocsa ve Szeged bölgeleri tescil sahibi. Gulyás için édesnemes (tatlı yaygın) klasik kullanılır, csípős ile dengelenebilir. Paprika tereyağında 1 dakikadan fazla kavrulmaz (yanınca acılaşır), klasik teknik et üzerine ocak kapalı serpme.",
    },
    {
      q: "Tokaji aszú şarabı dünyanın ilk botrytis tatlı şarabı mıdır?",
      a: "Tokaji aszú botrytis cinerea (asil küf) ile yapılan dünyanın ilk yazılı kayıtlı tatlı şarabıdır; 1571'de Mate Sepsy Laczko'nun tarifi ile belgelendi. Sauternes (Bordeaux, 17. yy) ve Eiswein (Almanya, 18. yy) Tokaji'den sonra geldi. Klasik tarif: Furmint ve Hárslevelü üzümleri sonbaharda asil küf bekletilir, kuru üzüm gibi büzülür, hasat edilir, 3-6 puttonyo (geleneksel sepet) ölçüsünde tatlılığa göre sınıflandırılır. UNESCO Tokaj Şarap Bölgesi 2002'den beri Dünya Mirası Listesi'nde.",
    },
    {
      q: "Halászlé balıkçı çorbası nasıl yapılır, klasik balık çeşidi nedir?",
      a: "Halászlé Macaristan'ın Tisza nehri kıyısı klasik balıkçı çorbasıdır; tatlı su balığı (sazan + turna + yayın) + yoğun paprika + soğan + acı yeşil biber + 1 saat yavaş kaynama. Klasik teknik açık ateş + demir kazan (bogrács): Tisza halászlé Szeged ve Baja varyasyonlarında 2 farklı yapılır (Szeged katmanlı dizilim, Baja erişte ile). Paprika 3-4 yemek kaşığı çorbaya yoğun renk verir, balık temizlenirken kafa ve kemik bouillon için ayrılır. Geleneksel balık festivali Baja'da Temmuz 23-25 düzenlenir, halászlé sokak yemeği olarak servis edilir.",
    },
    {
      q: "Lángos sokak yemeği nasıl pişer, üst topping çeşitleri nelerdir?",
      a: "Lángos klasik mayalı kızartma ekmek; hamur 30 dakika mayalandırılır, avuç içi büyüklüğünde açılır, 180°C derin yağda 2-3 dakika her yüzü kızartılır. Sokak yemeği klasiği. Klasik topping: ezilmiş sarımsak + ayçiçek yağı sürme + ekşi krema (tejföl) + rendelenmiş peynir (sajt). Modern lángos: ekşi krema + sosis + soğan, peynir + jambon, hatta tatlı varyant (Nutella + muz, Macar tatlı dükkan). Macar pazarlarında ve sokaklarında 24 saat 600-1000 forint (2-3 euro) fiyat, Budapeşte Central Market Hall klasik lángos durağı.",
    },
  ],
};

let updated = 0;
let inserted = 0;
let faqsAdded = 0;

// Mevcut item'ların intro'sunu revize et veya eksikleri tamamla
for (const item of data) {
  const key = `${item.type}:${item.slug}`;
  if (NEW_INTROS[key]) {
    const oldWords = item.intro.split(/\s+/).length;
    const newWords = NEW_INTROS[key].split(/\s+/).length;
    console.log(
      `REVISE ${key}: ${oldWords} -> ${newWords} kelime (${item.intro.length} -> ${NEW_INTROS[key].length} char)`,
    );
    item.intro = NEW_INTROS[key];
    updated++;
  }
  if (NEW_FAQS[key] && (!item.faqs || item.faqs.length === 0)) {
    item.faqs = NEW_FAQS[key];
    console.log(`FAQ ADDED ${key}: ${NEW_FAQS[key].length} q+a`);
    faqsAdded++;
  }
}

// Yeni item'ları ekle (mevcut değilse)
const existingKeys = new Set(data.map((x) => `${x.type}:${x.slug}`));
for (const [key, intro] of Object.entries(NEW_INTROS)) {
  if (existingKeys.has(key)) continue;
  const [type, slug] = key.split(":");
  const newItem = { slug, type, intro, faqs: NEW_FAQS[key] || [] };
  data.push(newItem);
  const wordCount = intro.split(/\s+/).length;
  console.log(`INSERT ${key}: ${wordCount} kelime + ${(NEW_FAQS[key] || []).length} FAQ`);
  inserted++;
}

console.log(`\nGuncellenen: ${updated} | Yeni eklenen: ${inserted} | FAQ eklenen: ${faqsAdded}`);

// Em-dash sanity check
const EM_DASH = "—";
let emDashFound = 0;
for (const intro of Object.values(NEW_INTROS)) {
  if (intro.includes(EM_DASH)) {
    emDashFound++;
    console.error(`EM-DASH DETECTED in intro!`);
  }
}
for (const faqs of Object.values(NEW_FAQS)) {
  for (const faq of faqs) {
    if (faq.q.includes(EM_DASH) || faq.a.includes(EM_DASH)) {
      emDashFound++;
      console.error(`EM-DASH DETECTED in FAQ!`);
    }
  }
}
if (emDashFound > 0) {
  console.error(`\n${emDashFound} yerde em-dash bulundu, AGENTS.md kuralı ihlali!`);
  process.exit(1);
}
console.log(`Em-dash check: ✅ TEMIZ`);

// Word count check
const wordCounts = Object.entries(NEW_INTROS).map(([key, intro]) => ({
  key,
  words: intro.split(/\s+/).length,
}));
const outliers = wordCounts.filter((w) => w.words < 150 || w.words > 280);
if (outliers.length > 0) {
  console.warn(`\nKelime sayısı hedef 150-250 dışı (max 280 tolerans):`);
  for (const o of outliers) console.warn(`  ${o.key}: ${o.words}`);
}

if (APPLY) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n", "utf-8");
  console.log(`\n✅ Yazıldı: ${file}`);
} else {
  console.log(`\n(dry-run) --apply flag'i ile yaz`);
}
