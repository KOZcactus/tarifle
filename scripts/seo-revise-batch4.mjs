#!/usr/bin/env node
/**
 * P1 SEO landing batch 4 (oturum 27): top 21-29 derinlik revize.
 * Pattern: oturum 25 batch 1 (top 5) + oturum 26 batch 2 (top 6-12)
 * + oturum 27 batch 3 (top 13-20) devamı.
 * "150-250 kelime özgün açıklama, somut sayı + otorite + pratik öngörü."
 *
 * Hedef 9 sayfa (orta trafik adayları, dev DB count):
 *   - cuisine/ispanyol (81 tarif, revize)
 *   - cuisine/yunan (45, revize)
 *   - cuisine/cin (53, revize)
 *   - cuisine/kore (44, revize)
 *   - cuisine/tay (46, revize)
 *   - cuisine/hint (47, revize)
 *   - cuisine/meksika (61, revize)
 *   - category/smoothie-shake (64, YENI ekle)
 *   - category/soslar-dippler (59, YENI ekle)
 *
 * Idempotent: yeni intro'lar set edilir, FAQ'lara dokunulmaz, top 20'ye
 * dokunulmaz (key collision yok).
 *
 * Em-dash (— U+2014) yasak (AGENTS.md): virgül, noktalı virgül, nokta,
 * parantez, iki nokta kullanıldı.
 *
 * Usage: node scripts/seo-revise-batch4.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const file = path.resolve(process.cwd(), "docs/seo-copy-v1.json");
const data = JSON.parse(fs.readFileSync(file, "utf-8"));

const NEW_INTROS = {
  "cuisine:ispanyol":
    "İspanyol mutfağı, İber yarımadasının kıyısal bolluğunu, yayla otlarını ve Mağrip izlerini bir araya getiren çok katmanlı bir mutfaktır. Tarifle'de 81 İspanyol tarifi var; paella valenciana, tortilla española, gazpacho, patatas bravas, pimientos de Padrón, jamón ibérico tabağı, pulpo a la gallega, churros con chocolate ve sangria başta gelir. Bölgesel ayrım belirgin: Valencia paella ve pirinç tabakları, Endülüs gazpacho ve fritura, Galiçya deniz mahsulleri (pulpo, percebes), Bask diyarı pintxos kültürü ve Madrid cocido madrileño nohutlu güveci. Paella için resmi Wikipedia ve Valencia Hükümeti tanımı: tencere yüzeyine 1.5-2 cm pirinç dağıtılır, her tane sıvıyı eşit emsin (asla karıştırma, klasik paella kaşığı yok). Socarrat (alttaki karamelize kabuk) doğru paellanın imzası; son 2 dakikada ısı yükseltilerek elde edilir. Tortilla española için yumurta-patates oranı 1 yumurta : 1 orta patates, yağda haşlama tekniği (confit) patates yumuşaklığını sağlar. Gazpacho serveri buz gibi soğuk (5-7°C) olmalı, ekmek içi (kabuksuz) blender ile suyu emer ve dokuyu kalınlaştırır. İspanyol mutfağında zeytinyağı tüketimi dünyada en yüksek (kişi başı 13 kg/yıl, FAO 2022 verisi); aceite de oliva virgen extra her tabağın temeli. Bu sayfada Akdeniz'e özgü hafif sebze meze ve salatalardan paella ve fabada gibi doyurucu ana yemeklere, tapas tarzı paylaşım atıştırmalıklarına ve klasik tatlılara (churros, flan, crema catalana) kadar geniş yelpaze yer alır.",

  "cuisine:yunan":
    "Yunan mutfağı, Akdeniz'in en saf yüzünü temsil eder; Atina'dan Girit'e, Ege adalarından Makedonya'ya kadar zeytinyağı, limon, kekik ve yoğurt sabit eksen, mevsim sebzesi ve deniz ürünleri dönüşümlü misafir. Tarifle'de 45 Yunan tarifi var; moussaka, souvlaki, gyros, spanakopita, tzatziki, dolmades, pastitsio, horiatiki (Yunan klasik salatası), baklava ve loukoumades başta gelir. Akdeniz Diyeti UNESCO Somut Olmayan Kültürel Miras (2010) tanımında Yunanistan kurucu ülke; balık, sebze, baklagil, zeytinyağı, sınırlı kırmızı et tüketimi modeli buradan dünyaya yayıldı. Klasik horiatiki salata kuralı: marul YOK, yapraklı domates dilimi + salatalık + dolmalık biber + kırmızı soğan + Kalamata zeytin + tek parça (hiç ufalanmamış) feta peyniri + zeytinyağı + kekik. Salata sosu yok (ekmek doğranıp tabakta kalan zeytinyağına batırılır, klasik). Spanakopita için yufka yağlama tekniği: her yufka katı arasına eritilmiş tereyağı veya zeytinyağı (geleneksel) fırça ile sürülür, 8-10 kat klasik. Yoğurt seçimi belirleyici: süzme Yunan yoğurdu (10-12% protein, normal yoğurttan 2 kat) tzatziki ve mezelerde ana karakter. Bu sayfada hafif salatalardan kalabalık fırın güveçlere (moussaka, pastitsio), ızgara şişlere ve klasik tatlılara kadar Akdeniz disiplinli geniş repertuvar bulunur.",

  "cuisine:cin":
    "Çin mutfağı, sekiz büyük bölgesel okuldan oluşan dünyanın en geniş repertuvarlı mutfaklarından biridir. Tarifle'de 53 Çin tarifi var; mapo tofu, kung pao tavuk, yapışkan pirinçli yaprak sarması, dim sum (har gow + siu mai), kızarmış pirinç (yangzhou chao fan), char siu, Pekin ördeği, baozi (mantı), çift pişirilmiş domuz ve gua bao başta gelir. Sekiz okul (八大菜系 ba da cai xi): Şandong (Shandong, sahil deniz mahsulleri), Sichuan (acılı + uyuşturucu Sichuan biberi), Guangdong (Kantonca, dim sum + char siu), Fujian (taze deniz mahsulleri + tatlı çorbalar), Jiangsu (klasik banket mutfak), Zhejiang (Hangzhou taze sebze), Hunan (acılı, Sichuan'dan farklı), Anhui (yabanıl ot + dağ mantarı). Wok mutfağında temel kural çok yüksek ısı + sürekli hareket; geleneksel Çin gaz ocağı kebap ocağı sıcaklığını taşır (700-800°C, ev ocağı 250-300°C maksimum). Wok hei (kavruk koku) bu yüksek ısının sonucudur. Soya sosu üç tip: açık (sheng chou, tuzlu, baz), koyu (lao chou, renk için, daha tatlı), tatlı soya (Endonezya etkisi, ketjap manis benzeri). Pirinç için klasik 1:1.2 oran (kısa taneli) veya 1:1.5 (uzun taneli, jasmine), yıkama 3-4 kez berraklaşana kadar. Bu sayfada günlük tek tabak (donburi tarzı, kızarmış pirinç) tabaklarından dim sum atıştırmalıklarına, klasik banket yemeklerine (Pekin ördeği) ve mantı ailesine (jiaozi, baozi, gua bao) kadar geniş yelpaze yer alır.",

  "cuisine:kore":
    "Kore mutfağı, fermantasyon merkezli bir mutfaktır; tek başına kimchi 200+ varyasyona sahiptir ve Kore Kültür ve Bilgi Servisi (KOCIS) tarafından 2013'te ulusal kültür mirası ilan edildi. Tarifle'de 44 Kore tarifi var; kimchi, bibimbap, bulgogi, japchae, tteokbokki, sundubu jjigae, samgyeopsal, banchan tabakları, kimbap, jjampong ve hotteok başta gelir. Kore mutfağının üç temel sosu: gochujang (kırmızı biber + glutinous pirinç + soya fasulyesi + tuz fermantasyonu, koyu kırmızı acılı macun), doenjang (soya fasulyesi salamura, miso'nun Kore eşdeğeri ama daha keskin), ssamjang (gochujang + doenjang + sarımsak + susam yağı, sarma sosu). Banchan kavramı yemeğin ayrılmaz parçası: ana yemek + pirinç + 4-12 küçük tabak (banchan), Joseon hanedanı sarayında 12 banchan klasiktir. Kimchi fermantasyonu için ideal sıcaklık 4°C (ev buzdolabı), 1-2 hafta birinci olgunlaşma, 1-3 ay derin ekşi olgunlaşma. Kore BBQ'da et tabakta marine edilmez; ızgara üstüne taze konur, kısa pişirilir, marula sarılır. Bibimbap kase pişirme tekniği: dolsot bibimbap (taş kase) için kase fırın 250°C 20 dakika ön ısıtma, pirinç dibinde 30 saniye 'nurungji' kabuk oluşumu klasik. Bu sayfada günlük çorba ve güveçlerden klasik fermente lezzetlere, banchan tabaklarından sokak yemeklerine kadar Kore repertuvarı bir aradadır.",

  "cuisine:tay":
    "Tay mutfağı, dört ana tat (acı, ekşi, tuzlu, tatlı) ve umami'yi tek tabakta dengeleme felsefesinin en görünür örneğidir; ayrı ayrı baharat değil, dengelenmiş kompozisyon temel ilkesidir. Tarifle'de 46 Tay tarifi var; pad thai, tom yum goong, tom kha gai, green curry (kaeng khiao wan), red curry (kaeng phet), pad krapow, som tam, satay, mango sticky rice ve som tam başta gelir. Bölgesel ayrım belirgin: Bangkok orta Tayland (Çin etkisi, hafif baharat), kuzey (Chiang Mai, Lanna mutfağı, Burma etkisi, khao soi noodle), kuzeydoğu (Isan, Laos etkisi, çiğ et larb ve yapışkan pirinç), güney (Müslüman ve Malay etkisi, daha acılı Massaman curry). Klasik curry pasta üç renk: yeşil (kaeng khiao wan, taze yeşil biber, en acı), kırmızı (kaeng phet, kuru kırmızı biber), sarı (kaeng kari, zerdeçal + Hint etkisi). Hindistan cevizi sütü kullanımında klasik teknik: önce kalın krema (top of can) yüksek ateşte ayrılana kadar pişirilir, curry pasta bu yağda 2-3 dakika kavrulur, sonra ince süt eklenir. Bu yağ ayrılma anı 'taek man' diye geçer ve curry derinliğinin işaretidir. Pad thai için wok hei (yüksek ısı kavruk koku) kritik, pirinç eriştesi soğuk su ile ön ıslama (1-2 saat) sonra al dente pişirilir. Bu sayfada hızlı sokak yemeklerinden (pad thai, pad krapow) kalabalık aile sofrası curry ve çorbalarına, atıştırmalık satay ve som tam'a kadar geniş yelpaze yer alır.",

  "cuisine:hint":
    "Hint mutfağı, dünyanın en geniş baharat repertuvarına sahip mutfaklarından biridir; tek başına Hindistan baharat üretiminde global piyasada %75 pay tutar (FAO 2023). Tarifle'de 47 Hint tarifi var; butter chicken, biryani (Lucknow, Hyderabad, Sindhi versiyonları), dal makhani, tandoori tavuk, samosa, naan, paneer tikka masala, palak paneer, vindaloo ve gulab jamun başta gelir. Bölgesel ayrım çok güçlü: kuzey (Pencap, Kashmir, Awadh, kremalı sos + tandır + naan + paneer), güney (Tamil Nadu, Kerala, Karnataka, hindistan cevizi sütü + pirinç + dosa + idli + sambhar), batı (Gujarat, Maharashtra, vejetaryen + thali tabağı), doğu (Bengal, hardal yağı + balık + tatlı geleneği). Garam masala karışımı bölgeye göre 5-15 baharat içerir; klasik kuzey karışımı kakule, karanfil, tarçın, kimyon, kara karabiber, defne, hindistan cevizi rendesi temel taşı. Tandır fırını 480°C üstünde çalışır (klasik kil tandır), ev fırınında 250°C üst raf + grill maksimum yaklaşımdır. Yoğurtlu marine 6-12 saat (gece bekleme): yoğurt enzimleri eti yumuşatır, baharat derinlemesine işler. Pirinç için basmati klasik (uzun tane, baş döndürücü aroma), 1:1.75 oran, 30 dakika ön ıslama. Hindistan vejetaryen nüfusu dünyada en büyük (~%30 nüfus, FAO 2021); paneer (taze peynir), dal (mercimek), chana (nohut) protein kaynakları. Bu sayfada günlük dal ve sebze curry'lerinden hafta sonu için ağır biryani ve tandoori tabaklarına, atıştırmalık samosa ve pakora'ya kadar geniş yelpaze yer alır.",

  "cuisine:meksika":
    "Meksika mutfağı, UNESCO Somut Olmayan Kültürel Miras (2010, geleneksel Meksika mutfağı) statüsüyle korunan, mısır, fasulye ve acı biber üçlemesi üzerine 9000 yıl önce kurulmuş bir mutfaktır. Tarifle'de 61 Meksika tarifi var; taco (al pastor, carnitas, pescado), enchilada (verdes, rojas, mole), guacamole, mole poblano, pozole, tamale, ceviche, chiles en nogada, churros ve elote başta gelir. Mole poblano klasik tarifi 20+ malzeme içerir (3 farklı kuru biber, kakao, ay çekirdeği, kuruyemiş, baharat, ekmek), Puebla'nın simgesi. Tortilla için nixtamalizasyon klasik teknik: mısır taneleri kireçli su (cal) ile kaynatılır, niasin emilimi serbest kalır, hamur yumuşar (Aztek + Maya'dan beri). Endüstriyel mısır unu (Maseca) bu nixtamalize edilmiş mısırdan üretilir. Ev tortillası: nixtamal + su + tuz + 5 dakika dinlendirme + tortilla pres. Acı biber çeşitliliği rekor: jalapeño, serrano, habanero, poblano, ancho (kuru poblano), guajillo, chipotle (tütsülenmiş jalapeño), chile de árbol; her biri farklı ısı seviyesi (Scoville 0'dan 350,000'e). Klasik salsa verde (yeşil): tomatillo + jalapeño + soğan + sarımsak + kişniş, çiğ veya közlenmiş. Salsa roja (kırmızı): kuru ancho + guajillo + domates + soğan + sarımsak. Ceviche için limon suyu + balık 15-20 dakika denatüre eder, taze otlar ve kişniş eklenir. Bu sayfada hızlı taco gecesi tabaklarından klasik mole ve tamale gibi uzun teknik isteyen tariflere, atıştırmalık esquites ve elote'ye kadar geniş yelpaze yer alır.",

  "category:smoothie-shake":
    "Smoothie ve shake, hafif kahvaltı ya da öğün ara öğünü olarak meyve, süt, yoğurt veya bitkisel içecek tabanında protein-lif-vitamin yoğun içecekler sunar. Tarifle'de 64 smoothie ve shake tarifi var; yeşil smoothie (ıspanak + muz + elma), berry blast (orman meyveleri + yoğurt), Hindistan cevizi mango shake, protein shake (muz + yer fıstığı + süt), kakao avokado smoothie, çilek muz klasik ve yulaflı kahvaltı smoothie başta gelir. Smoothie ve shake arasındaki temel fark: smoothie meyve + sebze tabanlı (su, hindistan cevizi suyu veya az süt), shake süt veya dondurma tabanlı daha yoğun ve tatlı. Hazırlama disiplini için klasik sıralama: önce sıvı (1-1.5 su bardağı), sonra yumuşak meyve (muz, çilek, mango), sonra yapraklılar (ıspanak, lahana, semizotu), en üste donmuş meyve veya buz. Bu sıra blender bıçağına yük bindirmez, motor zorlanmaz. Donmuş meyve kullanmak buz yerine hem doku hem tat avantajı sağlar (sulanma yok). Protein katmak için: 1-2 yemek kaşığı yer fıstığı ezmesi (8-9 g protein), 1 ölçek protein tozu (20-25 g), Yunan yoğurdu (100 g, 10 g protein) veya tofu (50 g, 4 g protein, vegan). Lif için chia tohumu (28 g'da 11 g lif), keten tohumu öğütülmüş (28 g'da 8 g) ekleme klasik. Bu sayfada hafif kahvaltı seçeneklerinden ağır spor sonrası protein shake'lerine, çocuk dostu tatlı klasiklerden detoks yeşil smoothie'lere kadar geniş yelpaze yer alır. Smoothie hazırlanır hazırlanmaz tüketilmeli (oksitlenme + ayrışma 30 dakika sonra başlar).",

  "category:soslar-dippler":
    "Soslar ve dipler, ana tabağın yanında değil çoğu kez içinde belirleyici rol oynar; doğru sos tabağın karakterini değiştirebilir. Tarifle'de 59 sos ve dip tarifi var; klasik beşamel, domates sos, pesto (Cenova hakuh klasik), hummus, tzatziki, guacamole, tahin sos, yoğurtlu sarımsaklı sos, biber salçası bazlı acılı sos, demi-glace ve vinaigrette başta gelir. Auguste Escoffier 1903'te beş ana sos (sauces mères) kategorisini sistematize etti: béchamel (sütlü, pürüzsüz), velouté (et veya tavuk sulu, açık beyaz), espagnole (kemik suyu bazlı koyu kahverengi), hollandaise (yumurta sarısı + tereyağı emülsiyonu), sauce tomate (domates). Bu beş sos varyasyonlarla yüzlerce sos türetilir (örnek: béchamel + parmesan = mornay, velouté + balık + krema + sarımsak = bercy). Dipler genelde soğuk servis edilir ve ekmek-cracker-sebze çubuğu ile yenir; soslar sıcak ya da soğuk olabilir, doğrudan tabağa dökülür veya yanında sunulur. Hummus için klasik İsrail/Levant tarifi: 100 g pişmiş nohut başına 50 g tahin (tahin oranı yüksek, kremsi doku için kritik), limon suyu, sarımsak, zeytinyağı, kimyon. Pesto için klasik Cenova reçetesi (Verace Pesto Genovese, 1865 tescili): taze fesleğen + Cenova zeytinyağı + Sardunya parmesan + pecorino + çam fıstığı + sarımsak + kaba tuz, havanda dövme tekniği klasik (blender bıçağı bitter aroma çıkarır). Vinaigrette için 3:1 yağ-asit oranı altın kural (zeytinyağı + sirke veya limon). Bu sayfada klasik Fransız beş ana sosundan günlük yoğurtlu dippler, ekmek bandırmalı klasik mezelere ve makarna soslarına kadar geniş yelpaze yer alır.",
};

let updated = 0;
let inserted = 0;
const expectedNew = Object.keys(NEW_INTROS).length;

// Mevcut item'ların intro'sunu revize et
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
}

// Yeni item'ları ekle (mevcut değilse)
const existingKeys = new Set(data.map((x) => `${x.type}:${x.slug}`));
for (const [key, intro] of Object.entries(NEW_INTROS)) {
  if (existingKeys.has(key)) continue;
  const [type, slug] = key.split(":");
  const newItem = { slug, type, intro, faq: [] };
  data.push(newItem);
  const wordCount = intro.split(/\s+/).length;
  console.log(`INSERT ${key}: ${wordCount} kelime (${intro.length} char)`);
  inserted++;
}

console.log(`\nGuncellenen: ${updated} | Yeni eklenen: ${inserted} | Hedef: ${expectedNew}`);

// Em-dash sanity check (AGENTS.md kuralı)
const EM_DASH = "—";
let emDashFound = 0;
for (const intro of Object.values(NEW_INTROS)) {
  if (intro.includes(EM_DASH)) {
    emDashFound++;
    console.error(`EM-DASH DETECTED in intro!`);
  }
}
if (emDashFound > 0) {
  console.error(`\n${emDashFound} intro'da em-dash bulundu, AGENTS.md kuralı ihlali!`);
  process.exit(1);
}
console.log(`Em-dash check: ✅ TEMIZ`);

// Word count check (150-250 hedef, max 280 tolerans)
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
