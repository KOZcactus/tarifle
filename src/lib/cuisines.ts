/**
 * Cuisine constants and inference logic. Single source of truth for the
 * 14 supported cuisine codes, their labels, and the rule-based inference
 * engine used by `scripts/retrofit-cuisine.ts` to tag existing recipes.
 *
 * Design: `cuisine` is a `String?` on Recipe (not a Prisma enum) so
 * adding new cuisines (Vietnamese, Brazilian, Scandinavian…) does not
 * require a migration, only this file and the Zod schema need updating.
 */

export const CUISINE_CODES = [
  "tr",
  "it",
  "fr",
  "es",
  "gr",
  "jp",
  "cn",
  "kr",
  "th",
  "in",
  "mx",
  "us",
  "me",
  "ma",
  "vn",
  "br",
  "cu",
  "ru",
  "hu",
  "se",
  "pe",
  "gb",
  "pl",
  "au",
  // Oturum 17: Codex 33a v2 teslim ettikten sonra eklendi, gerçek
  // mutfak çeşitliliği (24 → 30).
  "de",
  "ir",
  "pk",
  "id",
  "et",
  "ng",
  // Oturum 25: Mod K Batch 1-4 cuisine fix'leri sonrasi (brik Tunus,
  // provoleta Arjantin) DB'de cuisine='tn' / 'ar' yazildi ama label/
  // slug/desc/flag/region eksikti, /mutfak/tunus + /mutfak/arjantin
  // 404 doniyordu. tn = Tunus mustakil cuisine (Kuzey Afrika ma'dan
  // ayri, Akdeniz hatti); ar = Arjantin (Pampas + asado + chimichurri,
  // latin-america region).
  "tn",
  "ar",
  // Oturum 25: Mod K Batch 1a-3a v2 audit MAJOR_ISSUE'larinda tekrar
  // tekrar manuel cuisine kararsizligi cikti (Kolombiya 2x: arepa +
  // arequipe-flan; Venezuela 1x: arepa; Danimarka 1x: aebleskiver).
  // Codex sonraki batch'lerde direkt cuisine fix onersin diye enum
  // genisledi. co = Kolombiya, ve = Venezuela, dk = Danimarka.
  "co",
  "ve",
  "dk",
  // Oturum 25 (Mod K Batch 5b v2): cape-town-mercimek-bobotie tarifi
  // Codex 'gb' (Ingiliz) cuisine yaniltici, gercek Guney Afrika yemegi.
  // za = Guney Afrika (bobotie, biltong, sosatie, malva pudding,
  // bredie). Bu Codex'in MAJOR_ISSUE'da explicit isaret ettigi cuisine
  // gap, manuel mapping pattern'i gibi.
  "za",
  // Oturum 27 (Mod K Batch 19b v2): lisbon-nohutlu-morina-salatasi
  // ve lizbon-portakalli-badem-keki MAJOR_ISSUE'larinda Codex 'pt'
  // (Portekiz) cuisine kodu olmadigi icin otomatik fix yapamadi
  // (cuisine es kalmis, Portekiz bacalhau ve Lizbon badem keki
  // klasiklerine yanlis Ispanyol etiketi). pt = Portekiz (bacalhau
  // tuzlanmis morina, pastel de nata kremali tart, caldo verde
  // lahana corbasi, francesinha sandvic; Atlantik balikciligi +
  // Iber yarimadasi mirasi).
  "pt",
  // Oturum 28 (Mod K Batch 28a v2): santiago-misirli-pastel-de-choclo
  // MAJOR_ISSUE'inda Codex cuisine 'mx' (Meksika!) yazmis, oysa pastel
  // de choclo Sili criolla mutfaginin ulusal klasigi. cl = Sili (And
  // daglari + Pasifik kiyisi; pastel de choclo, empanada de pino,
  // cazuela, charquican, sopaipilla, mote con huesillo, completo
  // italiano, chorrillana; Mapuche kokleri + Ispanyol mirasi).
  "cl",
  // Oturum 28 (Mod K mini-rev paketi 9): tkemali MAJOR_ISSUE'inda
  // Codex cuisine 'ru' (Rus mutfagi!) yazmis, oysa tkemali Gurcu
  // klasik eksi erik sosu. ge = Gurcustan (Kafkas + Karadeniz kiyisi;
  // khachapuri peynirli ekmek, khinkali etli manti, satsivi cevizli
  // tavuk, lobio kirmizi fasulye, churchkhela cevizli sekerleme,
  // tkemali eksi erik sosu, mtsvadi izgara et). Ceviz + kisnis +
  // ombalo (yarpuz) + sulguni peyniri imza. UNESCO 2013 kvevri sarap
  // mirasi 8000 yillik. Region 'caucasus' yeni cluster, gelecekte
  // az/hyq eklenirse hazir.
  "ge",
  // Oturum 28 (Mod K mini-rev paketi 11): viyana-hashasli-erikli-
  // kaiserschmarrn MAJOR_ISSUE'inda Codex cuisine 'hu' (Macar!)
  // yazmis, oysa Kaiserschmarrn Kayser Franz Joseph I doneminden ad
  // alan klasik Wiener tatlisi (Wikipedia + wien.info + Sacher
  // referans). Plus viena-tavuk-schnitzel cuisine 'de' yumusatilmis
  // ama asıl 'at' Avusturya (Wiener Schnitzel imza). at = Avusturya
  // (Habsburg sarayi mirasi + Alpler; Kaiserschmarrn, Wiener
  // Schnitzel, Sachertorte, Apfelstrudel, Linzer Torte, Tafelspitz,
  // Gulasch, Knodel, Marillenknodel). Tereyagi + taze sut urunleri
  // + erik/kayisi kompostolari sofranin temeli. Region 'west-europe'
  // (de + fr + gb ile ayni kume, Almanca konusan Avrupa).
  "at",
] as const;

export type CuisineCode = (typeof CUISINE_CODES)[number];

export const CUISINE_LABEL: Record<CuisineCode, string> = {
  tr: "Türk",
  it: "İtalyan",
  fr: "Fransız",
  es: "İspanyol",
  gr: "Yunan",
  jp: "Japon",
  cn: "Çin",
  kr: "Kore",
  th: "Tay",
  in: "Hint",
  mx: "Meksika",
  us: "ABD",
  me: "Orta Doğu",
  ma: "Kuzey Afrika",
  vn: "Vietnam",
  br: "Brezilya",
  cu: "Küba",
  ru: "Rus",
  hu: "Macar",
  se: "İskandinav",
  pe: "Peru",
  gb: "İngiliz",
  pl: "Polonya",
  au: "Avustralya",
  de: "Alman",
  ir: "İran",
  pk: "Pakistan",
  id: "Endonezya",
  et: "Etiyopya",
  ng: "Nijerya",
  tn: "Tunus",
  ar: "Arjantin",
  co: "Kolombiya",
  ve: "Venezuela",
  dk: "Danimarka",
  za: "Güney Afrika",
  pt: "Portekiz",
  cl: "Şili",
  ge: "Gürcü",
  at: "Avusturya",
};

/**
 * URL slug map, kod → Türkçe URL parçası. `/mutfak/[slug]` programatik
 * landing route'u bu slug'ları bekler. Label'den türetilmez (Türk → turk
 * gibi noktalama kayıpları riskli); sabit listede tutulur. Yeni cuisine
 * eklenince 4 map'e de entry eklenir (CODE, LABEL, FLAG, SLUG, DESCRIPTION).
 */
export const CUISINE_SLUG: Record<CuisineCode, string> = {
  tr: "turk",
  it: "italyan",
  fr: "fransiz",
  es: "ispanyol",
  gr: "yunan",
  jp: "japon",
  cn: "cin",
  kr: "kore",
  th: "tay",
  in: "hint",
  mx: "meksika",
  us: "abd",
  me: "orta-dogu",
  ma: "kuzey-afrika",
  vn: "vietnam",
  br: "brezilya",
  cu: "kuba",
  ru: "rus",
  hu: "macar",
  se: "iskandinav",
  pe: "peru",
  gb: "ingiliz",
  pl: "polonya",
  au: "avustralya",
  de: "alman",
  ir: "iran",
  pk: "pakistan",
  id: "endonezya",
  et: "etiyopya",
  ng: "nijerya",
  tn: "tunus",
  ar: "arjantin",
  co: "kolombiya",
  ve: "venezuela",
  dk: "danimarka",
  za: "guney-afrika",
  pt: "portekiz",
  cl: "sili",
  ge: "gurcu",
  at: "avusturya",
};

/** URL slug → kod ters lookup. Slug bilinmiyorsa null. */
export function cuisineCodeBySlug(slug: string): CuisineCode | null {
  const entry = (
    Object.entries(CUISINE_SLUG) as [CuisineCode, string][]
  ).find(([, s]) => s === slug);
  return entry ? entry[0] : null;
}

/**
 * Mutfak landing sayfaları için TR açıklama metinleri, SEO + kullanıcı
 * değeri. Her biri 2-3 cümle, mutfağın karakteristik vurgusu + Tarifle
 * platformundaki öne çıkan tarif örneği tipinden. Generic "X tarifleri"
 * yerine okunabilir açıklama.
 */
export const CUISINE_DESCRIPTION_TR: Record<CuisineCode, string> = {
  tr: "Türk mutfağı; çorbasından kebabına, zeytinyağlısından tatlısına Anadolu'nun yedi bölgesini bir araya getirir. Ev pişirmesine özgü dengeler, bulgur, yoğurt, acı biber ve tereyağı, her tarifin temelini oluşturur.",
  it: "İtalyan mutfağı sadelikle yoğun tadı aynı anda sunar: pasta, pizza, risotto ve soğuk antipasti. Taze malzeme + az ama doğru baharat Akdeniz lezzet çizgisinin temeli.",
  fr: "Fransız mutfağı tekniği ön plana çıkaran klasikleri barındırır: tereyağlı soslar, hamur işleri, yavaş pişen güveçler. Boeuf bourguignon'dan macaroon'a, mutfak okullarının da referansı.",
  es: "İspanyol mutfağı paellanın safranı, gazpachonun serinliği ve tapasların çeşitliliği ile çalışır. Zeytinyağı, acılı paprika ve deniz ürünleri İber yarımadasının imzası.",
  gr: "Yunan mutfağı Akdeniz'in en saf yüzünü gösterir: tulum peyniri, zeytinyağı, limon, kekik. Moussaka, souvlaki, spanakopita, ev sofralarına hızla uyarlanır.",
  jp: "Japon mutfağı denge ve saygı üzerine kurulu: sushi, ramen, tempura, miso çorbası. Az malzeme + temiz teknik = umami dengesi.",
  cn: "Çin mutfağı sekiz büyük bölgenin yüzlerce tarzını kapsar: mapo tofu, kung pao tavuk, dumpling, fried rice. Wok kullanımı ve soya temelli soslar ortak noktası.",
  kr: "Kore mutfağı fermente lezzetlerin merkezi: kimchi, bibimbap, bulgogi, tteokbokki. Acı biber ezmesi gochujang neredeyse her tarifte yerini alır.",
  th: "Tay mutfağı acı-tatlı-ekşi-tuzlu dengesini tek tabakta kurar: pad thai, green curry, tom yum. Hindistan cevizi sütü, limon otu ve Tay fesleğeni aromaları taşır.",
  in: "Hint mutfağı baharat zenginliğiyle tanınır: butter chicken, biryani, dal, samosa. Her bölgenin kendi masala karışımı var, kuzey kremalı, güney hindistan cevizli.",
  mx: "Meksika mutfağı mısır ve acı biber üzerine kurulu: taco, enchilada, guacamole, pozole. Taze corriander, limon ve chipotle karakterini tamamlar.",
  us: "ABD mutfağı göç eden halkların birleşimini yansıtır: burger, BBQ, mac & cheese, cheesecake. Soul food, Tex-Mex ve New England klasikleri bir arada.",
  me: "Orta Doğu mutfağı zengin baharat + sağlıklı tahıllar: hummus, falafel, tabbouleh, kebap. Zeytinyağı, nar ekşisi, sumak ortak dili.",
  ma: "Kuzey Afrika mutfağı tajine'nin yavaş pişirmesini, kuskusun dokusunu ve harissa'nın acısını bir araya getirir. Fas, Tunus ve Cezayir'in mutfak mirası.",
  vn: "Vietnam mutfağı ferahlık üzerine kurulu: pho, banh mi, bun cha, goi cuon. Taze otlar (nane, coriander, fesleğen) ve balık sosu temel aromalar.",
  br: "Brezilya mutfağı tropikal lezzetler ve Afrika etkisi taşır: feijoada, pão de queijo, moqueca, brigadeiro. Manyok, hindistan cevizi sütü ve dendê yağı karakteristik.",
  cu: "Küba mutfağı İspanyol + Karayip sentezi: ropa vieja, arroz con pollo, yuca con mojo, flan. Sarımsak, kimyon, acı biber ve limon ezmesi (mojo) imzası.",
  ru: "Rus mutfağı soğuk kışlara göre tasarlanmış yoğun tatlar: borscht, pelmeni, blini, stroganoff. Turşulanmış sebzeler, krema ve karabuğday günlük masanın parçası.",
  hu: "Macar mutfağı paprika başkenti: goulash, chicken paprikash, lángos, dobos torte. Dumplings, yoğun soslar ve tatlı-tuzlu denge Orta Avrupa imzası.",
  se: "İskandinav mutfağı sadeliği ve deniz ürünlerini ön plana çıkarır: köttbullar, gravlax, smörgåsbord, kanelbullar. Dereotu, hardal ve soğuk tütsü yaygın.",
  pe: "Peru mutfağı And tarihi + Pasifik sahilini birleştirir: ceviche, lomo saltado, aji de gallina, causa. Limon, acı biber aji ve mor patates karakteristik.",
  gb: "İngiliz mutfağı ev rahatlığı klasikleri: fish and chips, shepherd's pie, full breakfast, scones. Hafta sonu roast dinner ve five o'clock tea geleneksel.",
  pl: "Polonya mutfağı doyurucu ve tahıl-etli: pierogi, bigos, żurek, placki ziemniaczane. Turşulanmış sebzeler, kapuska ve ekşi krema sofranın sabiti.",
  au: "Avustralya mutfağı deniz ürünleri, BBQ kültürü ve güçlü kahve ekosistemi. Meat pie, lamington, avocado toast, Vegemite, İngiliz mirası üzerine modern Avustralya.",
  de: "Alman mutfağı tahıl yoğun, sosis ve köfte merkezli klasikleri barındırır: schnitzel, bratwurst, sauerkraut, pretzel. Karabuğday, patates ve hardal sofranın temeli.",
  ir: "İran mutfağı zafer safranı, narenciye notaları ve yoğun pilavlarla tanınır: tahdig, ghormeh sabzi, fesenjan, kebab koobideh. Kuru limon ve gül suyu karakteristik aromalar.",
  pk: "Pakistan mutfağı Hindistan ile tarih paylaşır ama daha bol et, bol baharatlı: biryani, nihari, haleem, chapli kebap. Kırmızı et ve masala derinlik anahtarı.",
  id: "Endonezya mutfağı adalar arası lezzet mozaiği: nasi goreng, rendang, sate, soto. Hindistan cevizi sütü, acı sambal ve ketjap manis karakteristik.",
  et: "Etiyopya mutfağı bereket sofrası: injera ekmeği, doro wat, berbere baharatı, tibs. Ekşi maya ve yoğun baharat karışımı Doğu Afrika imzası.",
  ng: "Nijerya mutfağı Batı Afrika'nın renk paleti: jollof rice, egusi çorbası, suya, plantain kızartması. Hindistan cevizi yağı, acı biber ve iç erkek fıstığı yaygın.",
  tn: "Tunus mutfağı Akdeniz'in güney kıyısındaki sıcak baharatlı mirası: brik (yumurtalı çıtır börek), kuskus, harissa, mechouia salatası. Zeytinyağı, kimyon ve acı biber Berberi köklerini Akdeniz tatlarıyla birleştirir.",
  ar: "Arjantin mutfağı Pampas ovalarının et kültürü ve göçmen mutfaklarının buluşması: asado (ızgara et), empanada, chimichurri sosu, milanesa. Sığır eti, dana parça ızgara ve İtalyan mirası makarna sofrasının temeli.",
  co: "Kolombiya mutfağı Karayip kıyısı, And dağları ve Amazon havzasının zengin sentezi: arepa (mısır ekmeği), bandeja paisa, ajiaco çorbası, arequipe (sütlü tatlı). Mısır, bezelye ve hindistan cevizi sütü merkezi rol oynar.",
  ve: "Venezuela mutfağı arepa diyarı ve Karayip lezzetleri: arepa rellena, pabellón criollo, hallaca, asado negro. Plantain, kara fasulye ve mısır unu klasik üçleme.",
  dk: "Danimarka mutfağı İskandinav rahatlığı ile Kuzey Avrupa klasiklerini birleştirir: aebleskiver (yuvarlak çörek), smørrebrød (açık sandviç), frikadeller, rødgrød. Tereyağı, ringa ve kara çavdar ekmeği sofranın temeli.",
  za: "Güney Afrika mutfağı Hollandalı sömürge mirası, Hindistan göçmen mutfakları ve yerel Bantu kültürünün buluşması: bobotie (baharatlı kıymalı yumurta dolması), biltong (kuru et), sosatie (sis kebabı), malva pudding (kayısılı sıcak puding). Köri, hindistan cevizi sütü ve mısır lapası (pap) günlük sofranın imzası.",
  pt: "Portekiz mutfağı Atlantik kıyısının deniz ürünleri ve İber yarımadası mirasını birleştirir: bacalhau (tuzlanmış morina, 365 günde 365 farklı tarif denilir), pastel de nata (Lizbon kremalı tart), caldo verde (lahanalı patates çorbası), francesinha (Porto sandviçi), bifana (jambon sandviç). Zeytinyağı, taze morina, hindistan cevizi (Brezilya bağı) ve piri-piri sosu sofranın imzası.",
  cl: "Şili mutfağı, And dağları ile Pasifik kıyısının buluştuğu uzun ülkenin criolla mirası: pastel de choclo (mısırlı kıymalı fırın), empanada de pino (kıymalı börek), cazuela (et ve sebze çorbası), charquicán (kabaklı patates ezmesi), sopaipilla (balkabaklı kızarmış hamur), mote con huesillo (buğday ve kuru şeftali içeceği), completo italiano (avokadolu sosisli). Tane mısır, balkabağı ve Pasifik balıkları sofranın imzası, Mapuche köklerini İspanyol mirasıyla harmanlar.",
  ge: "Gürcü mutfağı, Kafkas dağları ile Karadeniz kıyısının buluştuğu zengin bir mirastır: khachapuri (peynirli ekmek, Adjarian + Imeruli + Megruli bölgesel varyantları), khinkali (etli mantı), satsivi (cevizli soğuk tavuk), lobio (kırmızı fasulye yahnisi), churchkhela (cevizli üzüm pekmezi şekeri), ajapsandali (patlıcanlı sebze yahnisi), tkemali (ekşi erik sosu) klasiklerini barındırır. Ceviz, kişniş, yarpuz (ombalo) ve sulguni peyniri sofranın imzası. UNESCO İnsanlığın Somut Olmayan Kültürel Mirası listesindeki kvevri (kil küp) şarap geleneği 8000 yıl öncesine dayanır.",
  at: "Avusturya mutfağı, Habsburg sarayı mirasını Alp coğrafyasıyla birleştirir: Kaiserschmarrn (Kayser Franz Joseph I döneminden çatallı pankek), Wiener Schnitzel (panelenmiş dana pirzola), Sachertorte (Hotel Sacher kakaolu kabuklu klasik), Apfelstrudel (incecik yufkalı elma rulo), Linzer Torte, Tafelspitz, Gulasch (Macar etkisiyle), Knödel (mantar veya erik), Marillenknödel (kayısılı). Tereyağı, taze süt ürünleri, erik ve kayısı kompostoları sofranın temelini kurar.",
};

/** EN description, aynı set, kısa SEO metni. */
export const CUISINE_DESCRIPTION_EN: Record<CuisineCode, string> = {
  tr: "Turkish cuisine brings Anatolia's seven regions together: soups, kebabs, olive-oil dishes, and desserts. The home-cooking balance of bulgur, yogurt, chili and butter underpins every recipe.",
  it: "Italian cuisine pairs simplicity with deep flavor, pasta, pizza, risotto and cold antipasti. Fresh ingredients and restrained seasoning define the Mediterranean line.",
  fr: "French cuisine centers on technique: buttery sauces, pastries, slow-cooked stews. From boeuf bourguignon to macarons, the reference of culinary schools worldwide.",
  es: "Spanish cuisine delivers paella's saffron, gazpacho's cool and tapas variety. Olive oil, smoked paprika and seafood are the Iberian signature.",
  gr: "Greek cuisine shows the Mediterranean's purest face: feta, olive oil, lemon, oregano. Moussaka, souvlaki, spanakopita, quick to adapt at home.",
  jp: "Japanese cuisine is built on balance and respect: sushi, ramen, tempura, miso soup. Few ingredients + clean technique = the umami equation.",
  cn: "Chinese cuisine covers eight regional styles and hundreds of variants: mapo tofu, kung pao chicken, dumplings, fried rice. The wok and soy-based sauces are the thread.",
  kr: "Korean cuisine is a fermentation hub: kimchi, bibimbap, bulgogi, tteokbokki. The chili paste gochujang appears in nearly every dish.",
  th: "Thai cuisine nails the spicy-sweet-sour-salty balance in one plate: pad thai, green curry, tom yum. Coconut milk, lemongrass and Thai basil carry the aroma.",
  in: "Indian cuisine is defined by spice depth: butter chicken, biryani, dal, samosa. Every region has its own masala, creamy in the north, coconut-forward in the south.",
  mx: "Mexican cuisine is built on corn and chili: tacos, enchiladas, guacamole, pozole. Fresh cilantro, lime and chipotle round out the character.",
  us: "American cuisine reflects the immigration mix: burgers, BBQ, mac & cheese, cheesecake. Soul food, Tex-Mex and New England classics sit side by side.",
  me: "Middle Eastern cuisine ties rich spices with healthy grains: hummus, falafel, tabbouleh, kebabs. Olive oil, pomegranate molasses and sumac are the shared tongue.",
  ma: "North African cuisine joins tajine's slow cook, couscous texture and harissa heat. The culinary heritage of Morocco, Tunisia and Algeria.",
  vn: "Vietnamese cuisine rides on freshness: pho, banh mi, bun cha, goi cuon. Fresh herbs (mint, coriander, basil) and fish sauce form the core.",
  br: "Brazilian cuisine carries tropical and African notes: feijoada, pão de queijo, moqueca, brigadeiro. Cassava, coconut milk and dendê oil are signature.",
  cu: "Cuban cuisine is a Spanish + Caribbean blend: ropa vieja, arroz con pollo, yuca con mojo, flan. Garlic, cumin, chili and citrus mojo are the signature.",
  ru: "Russian cuisine suits cold winters with rich flavors: borscht, pelmeni, blini, stroganoff. Pickled vegetables, cream and buckwheat are on the daily table.",
  hu: "Hungarian cuisine is the paprika capital: goulash, chicken paprikash, lángos, dobos torte. Dumplings, rich sauces and a sweet-salty balance are the Central European stamp.",
  se: "Scandinavian cuisine leans on simplicity and seafood: köttbullar, gravlax, smörgåsbord, kanelbullar. Dill, mustard and cold-smoke are common.",
  pe: "Peruvian cuisine joins Andean heritage with the Pacific coast: ceviche, lomo saltado, aji de gallina, causa. Lime, aji chili and purple potato are core.",
  gb: "British cuisine offers home-comfort classics: fish and chips, shepherd's pie, full breakfast, scones. Weekend roast dinners and five o'clock tea are tradition.",
  pl: "Polish cuisine is hearty and grain-forward: pierogi, bigos, żurek, potato pancakes. Pickles, sauerkraut and sour cream stay on the table.",
  au: "Australian cuisine blends seafood, BBQ culture and strong coffee. Meat pie, lamington, avocado toast, Vegemite, modern Australia on a British base.",
  de: "German cuisine is grain-heavy and meat-forward: schnitzel, bratwurst, sauerkraut, pretzel. Rye, potato and mustard are the backbone.",
  ir: "Iranian cuisine features saffron, citrus notes and rich pilafs: tahdig, ghormeh sabzi, fesenjan, kebab koobideh. Dried lime and rose water shape the aromatics.",
  pk: "Pakistani cuisine shares history with India but leans meatier and more spiced: biryani, nihari, haleem, chapli kebab. Red meat and masala depth are key.",
  id: "Indonesian cuisine is an archipelago flavor mosaic: nasi goreng, rendang, sate, soto. Coconut milk, sambal chili and ketjap manis define the palate.",
  et: "Ethiopian cuisine is a feast of sharing: injera flatbread, doro wat, berbere spice, tibs. Sour fermented dough and bold spice blends are the East African signature.",
  ng: "Nigerian cuisine paints West Africa's palette: jollof rice, egusi soup, suya, fried plantain. Palm oil, chili and ground melon seeds appear often.",
  tn: "Tunisian cuisine joins the Mediterranean's southern shore with Berber heat: brik (egg-stuffed pastry), couscous, harissa, mechouia salad. Olive oil, cumin and red chili thread Berber roots through Mediterranean palates.",
  ar: "Argentine cuisine fuses Pampas beef culture with immigrant kitchens: asado (grilled meats), empanadas, chimichurri sauce, milanesa. Beef, parrilla cuts and Italian-rooted pasta anchor the table.",
  co: "Colombian cuisine blends Caribbean coast, Andean highlands, and Amazonian heritage: arepa, bandeja paisa, ajiaco soup, arequipe (caramel). Corn, peas, and coconut milk play central roles.",
  ve: "Venezuelan cuisine is the land of arepa with Caribbean flavors: arepa rellena, pabellón criollo, hallaca, asado negro. Plantain, black beans, and corn flour form the classic trio.",
  dk: "Danish cuisine pairs Scandinavian comfort with Northern European classics: aebleskiver (round dumplings), smørrebrød (open-faced sandwich), frikadeller, rødgrød. Butter, herring, and dark rye bread anchor the table.",
  za: "South African cuisine blends Dutch colonial heritage, Indian immigrant kitchens and indigenous Bantu culture: bobotie (spiced minced meat with egg topping), biltong (cured meat), sosatie (skewered kebab), malva pudding (apricot warm pudding). Curry, coconut milk and maize porridge (pap) are everyday signatures.",
  pt: "Portuguese cuisine joins Atlantic seafood with Iberian heritage: bacalhau (salted cod, said to have 365 recipes), pastel de nata (Lisbon custard tart), caldo verde (kale and potato soup), francesinha (Porto sandwich), bifana (pork sandwich). Olive oil, fresh cod, Brazilian-influenced flavors and piri-piri sauce anchor the table.",
  cl: "Chilean cuisine spans the long country between the Andes and the Pacific, blending Mapuche roots with Spanish heritage: pastel de choclo (corn and beef pie), empanada de pino (beef-filled turnover), cazuela (meat and vegetable stew), charquicán (pumpkin and potato mash), sopaipilla (pumpkin fried dough), mote con huesillo (wheat and dried peach drink), completo italiano (avocado hot dog). Sweet corn, pumpkin, and Pacific seafood anchor the table.",
  ge: "Georgian cuisine fuses the Caucasus mountains with the Black Sea coast: khachapuri (cheese-stuffed bread with Adjarian, Imeruli, and Megruli regional forms), khinkali (meat dumplings), satsivi (chilled walnut chicken), lobio (red bean stew), churchkhela (walnut and grape-syrup candy), ajapsandali (eggplant vegetable stew), and tkemali (sour plum sauce) anchor the table. Walnut, coriander, pennyroyal (ombalo), and sulguni cheese are signature. The kvevri clay-vessel winemaking tradition, on UNESCO's Intangible Cultural Heritage list, dates back 8,000 years.",
  at: "Austrian cuisine carries Habsburg court heritage into the Alpine landscape: Kaiserschmarrn (torn pancakes named for Emperor Franz Joseph I), Wiener Schnitzel (breaded veal cutlet), Sachertorte (Hotel Sacher chocolate classic), Apfelstrudel (paper-thin apple pastry), Linzer Torte, Tafelspitz, Gulasch (Hungarian-influenced), Knödel (with mushroom or plum), and Marillenknödel (apricot dumpling) are signatures. Butter, fresh dairy, plum and apricot compotes anchor the table.",
};

export const CUISINE_FLAG: Record<CuisineCode, string> = {
  tr: "🇹🇷",
  it: "🇮🇹",
  fr: "🇫🇷",
  es: "🇪🇸",
  gr: "🇬🇷",
  jp: "🇯🇵",
  cn: "🇨🇳",
  kr: "🇰🇷",
  th: "🇹🇭",
  in: "🇮🇳",
  mx: "🇲🇽",
  us: "🇺🇸",
  me: "🌍",
  ma: "🌍",
  vn: "🇻🇳",
  br: "🇧🇷",
  cu: "🇨🇺",
  ru: "🇷🇺",
  hu: "🇭🇺",
  se: "🇸🇪",
  pe: "🇵🇪",
  gb: "🇬🇧",
  pl: "🇵🇱",
  au: "🇦🇺",
  de: "🇩🇪",
  ir: "🇮🇷",
  pk: "🇵🇰",
  id: "🇮🇩",
  et: "🇪🇹",
  ng: "🇳🇬",
  tn: "🇹🇳",
  ar: "🇦🇷",
  co: "🇨🇴",
  ve: "🇻🇪",
  dk: "🇩🇰",
  za: "🇿🇦",
  pt: "🇵🇹",
  cl: "🇨🇱",
  ge: "🇬🇪",
  at: "🇦🇹",
};

/**
 * Culinary region clusters, similar-recipes v3 için. Aynı region içinde
 * farklı cuisine'ler kültürel/malzeme yakınlığı taşır (Akdeniz'de
 * zeytinyağı-domates-ot üçgeni, Doğu Asya'da soya-pirinç-zencefil).
 * Target ile candidate aynı region'da ama farklı cuisine ise hafif
 * bonus (aynı cuisine bonus'u zaten büyük +1.5).
 *
 * Hiçbir cluster'da olmayan cuisine'ler (us, gb, au, fr) kendi
 * region'larını oluşturur; bu durumda bonus no-op.
 */
export const CUISINE_REGION: Record<CuisineCode, string> = {
  tr: "mediterranean-levant",
  gr: "mediterranean-levant",
  es: "mediterranean-levant",
  it: "mediterranean-levant",
  me: "mediterranean-levant",
  ma: "mediterranean-levant",
  jp: "east-asia",
  cn: "east-asia",
  kr: "east-asia",
  th: "east-asia",
  vn: "east-asia",
  in: "south-asia",
  mx: "latin-america",
  br: "latin-america",
  cu: "latin-america",
  pe: "latin-america",
  ru: "slavic-central-europe",
  pl: "slavic-central-europe",
  hu: "slavic-central-europe",
  se: "nordic",
  fr: "west-europe",
  gb: "west-europe",
  us: "anglo-americas",
  au: "anglo-americas",
  de: "west-europe",
  ir: "mediterranean-levant",
  pk: "south-asia",
  id: "east-asia",
  et: "east-africa",
  ng: "west-africa",
  tn: "mediterranean-levant",
  ar: "latin-america",
  co: "latin-america",
  ve: "latin-america",
  dk: "nordic",
  za: "africa-southern",
  // Portekiz Iber yarimadasi (es ile ayni region), Akdeniz tarafi
  // mutfak benzerligi (zeytinyagi, balik, baharat).
  pt: "mediterranean-levant",
  // Sili Latin Amerika (mx, br, cu, pe, ar, co, ve ile ayni cluster).
  // pastel de choclo, empanada, cazuela: criolla ortak miras.
  cl: "latin-america",
  // Gurcustan Kafkas yeni cluster, gelecekte az/hyq eklenirse hazir.
  // Slavic-central-europe (ru/pl/hu) kulturel cakismaz, mediterranean-
  // levant zeytinyagi-domates ucgeni Gurcu mutfagina yabanci, west-asia
  // jenerik. Kafkas mutfagi (Gurcu + ileride Ermeni + Azeri) dogal
  // kume.
  ge: "caucasus",
  // Avusturya west-europe (de + fr + gb ile ayni kume), Almanca
  // konusan Avrupa + Habsburg/Alpler kulturel hattini paylasir.
  at: "west-europe",
};

// ─── Inference engine ───────────────────────────────────────

/**
 * Slug-level matches, highest confidence. These are dish names that
 * unambiguously belong to a single cuisine. Checked as substring of
 * the recipe slug (lowercase, ASCII, hyphenated).
 */
const SLUG_PATTERNS: readonly { cuisine: CuisineCode; patterns: string[] }[] = [
  // Japanese
  {
    cuisine: "jp",
    patterns: [
      "sushi", "ramen", "tempura", "teriyaki", "miso", "udon", "soba",
      "onigiri", "gyoza", "edamame", "tonkotsu", "takoyaki", "okonomiyaki",
      "katsu", "matcha", "mochi", "yakitori",
    ],
  },
  // Korean
  {
    cuisine: "kr",
    patterns: [
      "kimchi", "bibimbap", "bulgogi", "japchae", "tteokbokki", "gochujang",
      "kimbap", "galbi", "sundubu", "jjigae", "bossam",
    ],
  },
  // Thai
  {
    cuisine: "th",
    patterns: [
      "pad-thai", "tom-yum", "tom-kha", "massaman", "panang", "som-tam",
      "satay", "larb", "khao", "pad-kra",
    ],
  },
  // Indian
  {
    cuisine: "in",
    patterns: [
      "tikka", "masala", "biryani", "dal", "samosa", "naan", "tandoori",
      "paneer", "korma", "vindaloo", "chutney", "lassi", "chai",
      "pakora", "butter-chicken",
    ],
  },
  // Mexican
  {
    cuisine: "mx",
    patterns: [
      "taco", "burrito", "enchilada", "quesadilla", "guacamole", "churro",
      "fajita", "nachos", "pozole", "tamale", "elote", "salsa-verde",
      "mole", "ceviche-meksika",
    ],
  },
  // Italian
  {
    cuisine: "it",
    patterns: [
      "pizza", "risotto", "carbonara", "bolognese", "bruschetta", "tiramisu",
      "panna-cotta", "focaccia", "gnocchi", "lasagna", "minestrone",
      "pesto", "antipasto", "arancini", "osso-buco", "prosciutto",
      "calzone", "cannoli", "affogato", "caprese",
    ],
  },
  // French
  {
    cuisine: "fr",
    patterns: [
      "ratatouille", "quiche", "crepe", "croissant", "souffle", "bouillabaisse",
      "brioche", "bechamel", "bearnaise", "eclair", "macaron", "tarte-tatin",
      "coq-au-vin", "creme-brulee", "gratin", "nicoise",
    ],
  },
  // Spanish
  {
    cuisine: "es",
    patterns: [
      "paella", "gazpacho", "churros", "patatas-bravas", "tortilla-espanola",
      "croquetas", "sangria", "tapas", "pimientos",
    ],
  },
  // Greek
  {
    cuisine: "gr",
    patterns: [
      "moussaka", "tzatziki", "souvlaki", "gyros", "spanakopita",
      "baklava-yunan", "dolma-yunan", "feta", "horiatiki",
    ],
  },
  // Chinese
  {
    cuisine: "cn",
    patterns: [
      "wonton", "dim-sum", "chow-mein", "kung-pao", "mapo-tofu",
      "spring-roll", "char-siu", "pekin", "szechuan", "bao",
      "fried-rice-cin", "dumplings",
    ],
  },
  // American
  {
    cuisine: "us",
    patterns: [
      "burger", "bbq", "mac-and-cheese", "brownie", "pancake",
      "cornbread", "buffalo", "jambalaya", "cajun", "cheesecake",
      "cookie", "smoothie-bowl",
    ],
  },
  // Middle Eastern
  {
    cuisine: "me",
    patterns: [
      "hummus", "falafel", "tabbouleh", "fattoush", "baba-gannush",
      "shawarma", "kibbeh", "muhammara", "labneh", "manakish",
    ],
  },
  // North African
  {
    cuisine: "ma",
    patterns: [
      "shakshuka", "harissa", "couscous", "tagine", "merguez",
      "pastilla", "chermoula", "msemen", "zaalouk",
    ],
  },
  // Vietnamese
  {
    cuisine: "vn",
    patterns: [
      "pho", "banh-mi", "goi-cuon", "bun-cha", "banh-xeo",
      "cha-gio", "com-tam", "bo-luc-lac", "bun-bo", "cao-lau",
      "banh-cuon", "nem", "vietnam",
    ],
  },
  // Brazilian
  {
    cuisine: "br",
    patterns: [
      "feijoada", "pao-de-queijo", "brigadeiro", "coxinha", "moqueca",
      "picanha", "pastel-brezilya", "quindim", "farofa", "acai",
      "caipirinha", "tapioca-brezilya",
    ],
  },
  // Cuban
  {
    cuisine: "cu",
    patterns: [
      "ropa-vieja", "medianoche", "arroz-congri", "tostones",
      "cubano", "mojito", "vaca-frita", "yuca",
    ],
  },
  // Russian
  {
    cuisine: "ru",
    patterns: [
      "borscht", "pelmeni", "olivier", "syrniki", "blini",
      "stroganoff", "pirozhki", "kvass", "shchi",
    ],
  },
  // Hungarian
  {
    cuisine: "hu",
    patterns: [
      "paprikash", "langos", "dobos", "goulash", "gulyas",
      "kurtoskalacs", "lecho", "toltott",
    ],
  },
  // Scandinavian
  {
    cuisine: "se",
    patterns: [
      "gravlax", "smorgasbord", "kanelbulle", "kottbullar",
      "janssons", "raggmunk", "kroppkakor", "semla",
      "lefse", "lutefisk", "smorrebrod", "frikadeller",
      "fleskesteg", "karjalanpiirakka",
    ],
  },
  // Peruvian
  {
    cuisine: "pe",
    patterns: [
      "pisco-sour", "lomo-saltado", "ceviche-peru", "causa",
      "aji-de-gallina", "anticucho",
    ],
  },
  // British
  {
    cuisine: "gb",
    patterns: [
      "london-fog", "limonlu-posset", "posset", "fish-and-chips",
      "shepherds-pie", "scotch-egg", "bangers-and-mash",
      "yorkshire-pudding", "bakewell-tart", "trifle", "toad-in-the-hole",
      "cottage-pie", "sticky-toffee-pudding",
    ],
  },
  // Polish
  {
    cuisine: "pl",
    patterns: [
      "pierogi", "bigos", "zurek", "kielbasa-polonya",
      "golabki-polonya", "barszcz-polonya", "placki-ziemniaczane",
    ],
  },
  // Australian
  {
    cuisine: "au",
    patterns: [
      "pavlova", "lamington", "vegemite",
      "fairy-bread", "anzac-biscuit",
    ],
  },
  // Portuguese (oturum 27, pt eklenmesiyle)
  {
    cuisine: "pt",
    patterns: [
      "bacalhau", "pastel-de-nata", "francesinha", "caldo-verde",
      "bifana", "piri-piri", "bolinho-de-bacalhau", "queijada",
    ],
  },
  // Chilean (oturum 28, cl eklenmesiyle).
  // Not: tek basina "empanada" / "cazuela" jeneriktir (es/ar/cl ortak),
  // bu yuzden Sili-imzali disambiguator suffix'le yazildi.
  {
    cuisine: "cl",
    patterns: [
      "pastel-de-choclo", "empanada-de-pino", "cazuela-chilena",
      "charquican", "sopaipilla", "mote-con-huesillo",
      "completo-italiano", "chorrillana",
    ],
  },
  // Georgian (oturum 28 mini-rev paketi 9, ge eklenmesiyle).
  // Klasik Gurcu yemekleri unique-cuisine, "tkemali" eksi erik sosu da
  // dahil. Bolgesel khachapuri varyantlari (Adjarian/Imeruli/Megruli)
  // pattern olarak khachapuri yakaliyor.
  {
    cuisine: "ge",
    patterns: [
      "khachapuri", "khinkali", "satsivi", "lobio",
      "churchkhela", "ajapsandali", "tkemali", "mtsvadi",
    ],
  },
  // Austrian (oturum 28 mini-rev paketi 11, at eklenmesiyle).
  // Klasik Wiener tatlilari ve Avusturya/Habsburg klasikleri.
  {
    cuisine: "at",
    patterns: [
      "kaiserschmarrn", "sachertorte", "apfelstrudel", "linzer-torte",
      "wiener-schnitzel", "tafelspitz", "marillenknodel", "knodel",
    ],
  },
];

/**
 * Title/description keyword matches, checked against Turkish text.
 * These are nationality adjectives or explicit cuisine references that
 * appear in recipe titles or descriptions.
 */
const TEXT_KEYWORDS: readonly { cuisine: CuisineCode; keywords: string[] }[] = [
  { cuisine: "jp", keywords: ["japon", "japonya"] },
  { cuisine: "kr", keywords: ["kore"] },
  { cuisine: "th", keywords: ["tay", "tayland"] },
  { cuisine: "in", keywords: ["hint", "hindistan"] },
  { cuisine: "mx", keywords: ["meksika"] },
  { cuisine: "it", keywords: ["italyan", "italya"] },
  { cuisine: "fr", keywords: ["fransız", "fransa"] },
  { cuisine: "es", keywords: ["ispanyol", "ispanya"] },
  { cuisine: "gr", keywords: ["yunan", "yunanistan"] },
  { cuisine: "cn", keywords: ["çin"] },
  { cuisine: "us", keywords: ["amerikan", "amerika"] },
  { cuisine: "me", keywords: ["orta doğu", "ortadoğu", "arap", "lübnan", "suriye"] },
  { cuisine: "ma", keywords: ["kuzey afrika", "fas mutfağı", "fas usulü", "cezayir"] },
  { cuisine: "tn", keywords: ["tunus", "tunuslu", "tunus mutfağı", "tunus usulü"] },
  { cuisine: "ar", keywords: ["arjantin", "arjantinli", "arjantin mutfağı", "arjantin usulü", "pampas", "asado"] },
  { cuisine: "co", keywords: ["kolombiya", "kolombiyalı", "kolombiya mutfağı", "kolombiya usulü"] },
  { cuisine: "ve", keywords: ["venezuela", "venezuelalı", "venezuela mutfağı", "venezuela usulü"] },
  { cuisine: "dk", keywords: ["danimarka", "danimarkalı", "danimarka mutfağı", "danimarka usulü", "dansk"] },
  { cuisine: "za", keywords: ["güney afrika", "guney afrika", "güney afrikalı", "güney afrika mutfağı", "güney afrika usulü", "cape town"] },
  { cuisine: "vn", keywords: ["vietnam"] },
  { cuisine: "br", keywords: ["brezilya"] },
  { cuisine: "cu", keywords: ["küba"] },
  { cuisine: "ru", keywords: ["rus mutfağı", "rus usulü", "rusya"] },
  { cuisine: "hu", keywords: ["macar", "macaristan"] },
  { cuisine: "se", keywords: ["iskandinav", "isveç", "norveç", "danimarka", "finlandiya"] },
  { cuisine: "pe", keywords: ["peru", "peru usulü", "peru mutfağı"] },
  { cuisine: "gb", keywords: ["ingiliz", "britanya", "britanyalı"] },
  { cuisine: "pl", keywords: ["polonya", "polonyalı", "polish"] },
  { cuisine: "au", keywords: ["avustralya", "avustralyalı"] },
  { cuisine: "pt", keywords: ["portekiz", "portekizli", "portekiz mutfağı", "portekiz usulü", "lizbon", "porto"] },
  { cuisine: "cl", keywords: ["şili", "şilili", "şili mutfağı", "şili usulü", "santiago", "valparaiso"] },
  { cuisine: "ge", keywords: ["gürcü", "gurcu", "gürcistan", "gurcistan", "tiflis", "kafkas", "kakheti", "georgian"] },
  { cuisine: "at", keywords: ["avusturya", "avusturyalı", "viyana", "wiener", "habsburg", "kaiser franz", "salzburg", "tirol", "österreich"] },
];

interface InferInput {
  title: string;
  slug: string;
  description: string;
  ingredients: readonly { name: string }[];
}

/**
 * Infer the cuisine code for a recipe. Priority:
 * 1. Slug substring match (highest confidence, dish name is unique)
 * 2. Title keyword match (nationality adjective in title)
 * 3. Description keyword match (nationality adjective in body)
 * 4. Default: "tr" (majority of recipes are Turkish)
 */
export function inferCuisineFromRecipe(recipe: InferInput): CuisineCode {
  const slug = recipe.slug.toLowerCase();

  // 1. Slug pattern, most specific. Match against hyphen-delimited
  // segments so "dal" matches "dal" or "dal-xxx" but NOT "hardalli".
  const slugSegments = slug.split("-");
  for (const { cuisine, patterns } of SLUG_PATTERNS) {
    for (const p of patterns) {
      // Multi-segment patterns (e.g. "pad-thai") check contiguous substring
      if (p.includes("-")) {
        if (slug.includes(p)) return cuisine;
      } else {
        // Single-segment: must match a complete slug segment
        if (slugSegments.includes(p)) return cuisine;
      }
    }
  }

  // 2. Title keyword, check nationality adjective
  const titleLower = recipe.title.toLocaleLowerCase("tr-TR");
  for (const { cuisine, keywords } of TEXT_KEYWORDS) {
    for (const kw of keywords) {
      if (titleLower.includes(kw)) return cuisine;
    }
  }

  // 3. Description keyword
  const descLower = recipe.description.toLocaleLowerCase("tr-TR");
  for (const { cuisine, keywords } of TEXT_KEYWORDS) {
    for (const kw of keywords) {
      if (descLower.includes(kw)) return cuisine;
    }
  }

  // 4. Default, Turkish
  return "tr";
}
