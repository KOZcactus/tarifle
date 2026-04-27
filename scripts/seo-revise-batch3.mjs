#!/usr/bin/env node
/**
 * P1 SEO landing batch 3 (oturum 27): top 13-20 derinlik revize.
 * Oturum 25 batch 1 (top 5) + oturum 26 batch 2 (top 6-12) pattern'i
 * devamı: "150-250 kelime özgün açıklama, somut sayı + otorite +
 * pratik öngörü."
 *
 * Hedef 8 sayfa (orta-yüksek trafik adayları, dev DB count):
 *   - category/salatalar (269 tarif, revize)
 *   - category/baklagil-yemekleri (113, revize)
 *   - category/makarna-pilav (244, ESKI SLUG FIX makarna-ve-pilav -> makarna-pilav + revize)
 *   - category/atistirmaliklar (68, YENI ekle)
 *   - category/sebze-yemekleri (187, YENI ekle)
 *   - cuisine/fransiz (52, revize)
 *   - cuisine/japon (59, revize)
 *   - cuisine/portekiz (2, YENI ekle, oturum 27 cuisine 'pt' eklendi)
 *
 * Idempotent: yeni intro'lar set edilir, FAQ'lara dokunulmaz, top 12'ye
 * dokunulmaz (key collision yok).
 *
 * Em-dash (— U+2014) yasak (AGENTS.md): virgül, noktalı virgül, nokta,
 * parantez, iki nokta kullanıldı.
 *
 * Usage: node scripts/seo-revise-batch3.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const file = path.resolve(process.cwd(), "docs/seo-copy-v1.json");
const data = JSON.parse(fs.readFileSync(file, "utf-8"));

// Eski slug -> yeni slug fix (Category tablosu ile uyum)
const SLUG_FIXES = {
  "category:makarna-ve-pilav": "makarna-pilav",
};

const NEW_INTROS = {
  "category:salatalar":
    "Salata, sofranın hafifletici unsuru gibi görünse de doğru yapıldığında ana yemeğin yanına dengeli protein, lif ve sıvı katar. Tarifle'de 270+ salata tarifi var; en sık pişirilenler arasında çoban, gavurdağı, mevsim, mercimek, Sezar, Yunan klasik (horiatiki), nar ekşili roka ve patlıcan közlü başta gelir. Salatalar üç temel ailede toplanır: yeşillik tabanlı (marul, roka, semizotu, ıspanak yaprak; hafif öğle ve hafta sonu kahvaltısı için), tahıl ve baklagil tabanlı (bulgurlu kısır, mercimekli salata, nohutlu tabbouleh; doyurucu öğle), ve közlenmiş veya pişmiş tabanlı (közlenmiş patlıcan, közlü biber, ızgara karpuz; meze ve sıcak salata olarak). İyi salatanın gizli kuralı yağ-asit oranı: klasik vinaigrette 3:1 zeytinyağı limon veya sirke. American Test Kitchen referansına göre yeşillikleri sıvı eklemeden 5 dakika önce karıştırmak yaprağın diri kalmasını sağlar; aksi halde kabarcık çöker, yaprak suyunu salar. Tuz son aşamada eklenir (önce tuzlanan domates ve salatalık suyunu salar, dressing'i seyreltir). Bu sayfada hızlı tek kişilik kasalar (10 dakika), kalabalık misafir tabakları, tahıllı doyurucu salatalar ve mevsime uygun (kış için pancarlı, yaz için karpuzlu) seçenekler bir aradadır. Salata sıradan değil, ana tabağı destekleyen ya da tek başına doyuran tasarımdır.",

  "category:baklagil-yemekleri":
    "Baklagil yemekleri, bütçe dostu olmaları kadar yüksek protein-lif yoğunluğuyla da Türk sofrasının omurgasını kurar. Tarifle'de 113 baklagil tarifi var; en sık pişirilenler arasında kuru fasulye, mercimek çorbası, nohutlu tavuk, barbunya pilaki, fava, börülce ve pirinçli kıymalı bakla başta gelir. Akdeniz Diyet Vakfı (Mediterranean Diet Foundation) baklagil tüketimini haftada en az 4 porsiyon önerir; 100 gram pişmiş kuru fasulye 9 gram protein, 8 gram lif sağlar. Kuru baklagilleri ön ıslama (8-12 saat soğuk su) hem pişirme süresini yarıya indirir hem de oligosakkarit (gaza neden olan karbonhidrat) miktarını %30-40 düşürür. Kabuksuzlaştırma için ön kaynatma + hızlı süzme suyu yenilemek klasik tekniktir. Pişirme suyu için: tuzu pişme sonunda ekleyin (erken tuz kabuğu sertleştirir, fasulye dağılır), karbonat 1 kg fasulyeye 0.5 çay kaşığı (kabuğu yumuşatır, gaz azaltır). Mercimek farklı: kırmızı mercimek 12-15 dakikada eriyip pürüzsüz çorba olur, yeşil ve siyah mercimek tane korur (35-45 dakika). Düdüklü tencere baklagilleri 25-35 dakikada pişirir, ön ıslama gerekirse de süre kısalır. Bu sayfada hafta içi 30 dakika altı pratik mercimek ve nohut tabakları, hafta sonu için ağır kuru fasulye ve barbunya, yöresel ekşili (lahanalı baklagil) ve zeytinyağlı (fava, börülce) klasikleri bir aradadır. Et tüketimini azaltmak isteyen herkes için baklagil hem ekonomik hem doyurucu çözümdür.",

  "category:makarna-pilav":
    "Makarna ve pilav, mutfakta en sık tekrar edilen iki kategoriyi aynı çatı altında toplar; ikisi de su, ısı ve dinlenme üçlüsünden geçer. Tarifle'de 244 makarna ve pilav tarifi var; en sık pişirilenler arasında tereyağlı pirinç pilavı, şehriyeli pilav, sebzeli bulgur, fırın makarna, makarna salatası, kremalı tavuklu fettuccine ve yöresel iç pilav (Antep, Karadeniz, Aydın) başta gelir. Pilavda altın oran 1:1.5 ile 1:2 arası (pirinç:su, bulgur:su); pirinç türüne göre değişir, baldo daha az su (1:1.5), basmati orta (1:1.75), jasmine biraz fazla (1:2). Suyu sıcak eklemek (oda sıcaklığında değil) tane şişme süresini eşitler. Pilav kapağı 10 dakika açılmadan dinlendirilirse buhar tane içine geri çekilir, alt kabuk diri kalır (pirinç pilavının altın klasik kuralı). Makarnada al dente için suyun acımtırak deniz tadında olması gerekir (1 litre suya 10 gram tuz). Paket süresinden 1-2 dakika önce alıp soslu tavada son pişirme (mantecatura, İtalyan klasiği) sosun makarnaya yapışmasını sağlar. Pasta suyu (1 kepçe nişastalı pişme suyu) sosa ekleyip karıştırmak emülsiyonu kurar. Bu sayfada hızlı tek tabak makarna soslarından zengin fırın güveçlere, sade ev pilavlarından yöresel iç pilavlarına kadar geniş yelpaze bulunur. Makarna ve pilav, doğru su oranı ve dinlenme süresiyle mutfak disiplinin görünür sınavlarından biridir.",

  "category:atistirmaliklar":
    "Atıştırmalık, tatlı ve tuzlu klasikleri ana öğün dışında bir çatı altında toplar; çay saati, sinema akşamı, ofis molası ve misafir karşılama için pratik çözümler sunar. Tarifle'de 68 atıştırmalık tarifi var; en sık pişirilenler arasında patates kızartması, soğan halkası, krakerli sosis, fırında baharatlı leblebi, çıtır nohut cipsi, sigara böreği ve falafel cipsi başta gelir. Atıştırmalıklar üç pratik kategoride: kızartmalı (patates, soğan, falafel; doyurucu ama yağ yönetimi disiplin ister), fırınlanmış (leblebi, nohut, kabak çekirdeği; daha hafif, açma kapama tek hareketle), ve hamur işi tabanlı (sigara böreği, milföy çubukları, mini açma; kalabalık misafir için pratik). Kızartma yağı sıcaklığı belirleyici: ideal 175-180°C (termometre yoksa kızartma kabarcıkları çok fazla cıvıltı yapmamalı), düşük yağ patatesi sünger gibi yapar, fazla yüksek dış kararırken iç çiğ kalır. Fırın atıştırmalıklarında 200°C ön ısıtma + tepsiye yayma (üst üste binme yok) çıtırlık için kritik. Baharatlı leblebi ve nohut için: nemli yüzey baharat tutmaz; kavurmadan önce mutlak kuru kağıt havlu silme. Çay saati için sıcak servis (sigara böreği, mini poğaça), uzun süreli ikram için oda sıcaklığı sağlamlık (cipsler, krakerler) tercih edilir. Bu sayfada anlık molalardan kalabalık parti ikramlarına, evde basit malzemeyle hazırlanan pratik tabaklardan misafir sofrası için hazırlık yapılan zenginleştirilmiş seçeneklere kadar geniş yelpaze bulunur.",

  "category:sebze-yemekleri":
    "Sebze yemekleri, et ve baklagil tabanlı yemeklerin yanına ya da yerine geçen, mevsim takibi en güçlü kategoridir; aynı tarif ilkbaharda tazeliği, yazda hafifliği, kışta pişme dayanıklılığı vurgular. Tarifle'de 187 sebze yemeği tarifi var; en sık pişirlenler arasında zeytinyağlı enginar, fırında karnabahar, türlü, ıspanak yemeği, kabak musakka, biber dolması, fasulye yahnisi ve kuru patlıcan dolması başta gelir. Sebzeler iki büyük gruba ayrılır: zeytinyağlılar (enginar, börülce, taze fasulye, kabak; ince zeytinyağı + şeker dengesi + soğuk servis Ege klasiği) ve etli/etsiz tencere (türlü, sebze güveç, ıspanak yemeği; kıyma veya etle zenginleşir, kıymalı versiyon vejetaryen değil). Sebzelerde pişirme süresi belirleyici: yeşil yapraklılar (ıspanak, semizotu) 3-5 dakika (renk korur, yumuşar), kabak ve patlıcan 8-15 dakika (orta dilim), karnabahar ve brokoli 10-12 dakika kaynatma veya 20-25 dakika fırın 200°C, kök sebzeler (havuç, pancar, kereviz) 30-40 dakika tencere veya 45-60 dakika fırın. USDA referansı sebzeleri yıkama: filtrelenmiş su altında ovuşturarak (yeşil yapraklılar 30 saniye, kök sebzeler fırça ile), zayıf sirkeli su (1 yemek kaşığı sirke / 1 litre) bakteri %90 azaltır ama 5 dakika max (uzun süre tat değiştirir). Bu sayfada zeytinyağlı klasiklerden zengin etli tencerelere, hafif salata-sebze tabaklarından doyurucu güveçlere kadar mevsime uygun seçenekler bir aradadır.",

  "cuisine:fransiz":
    "Fransız mutfağı, tekniğin görünür şekilde öne çıktığı ve mutfak eğitiminin uluslararası referans noktası olan bir mutfaktır. Tarifle'de 52 Fransız tarifi var; boeuf bourguignon, ratatouille, quiche lorraine, croque monsieur, soğan çorbası (soupe à l'oignon gratinée), crepe Suzette, macaron, eclair, croissant ve crème brûlée başta gelir. Bölgesel ayrım belirgin: kuzey (Normandiya, Bretanya) tereyağı, krema, elmalı tatlılar (tarte tatin), deniz ürünleri; orta (Ile-de-France, Bourgogne) klasik tekniği koruyan haute cuisine, şarap soslar, peynir çeşitliliği (300+ AOP peyniri); güney (Provence, Languedoc) zeytinyağı, otlar (lavanta, biberiye), domates ve sebze (ratatouille, bouillabaisse). Klasik beş ana sos (sauces mères, Auguste Escoffier kategorize etti, 1903): béchamel (sütlü), velouté (et veya tavuk sulu), espagnole (kemik suyu bazlı koyu kahverengi), hollandaise (yumurta sarısı tereyağı), sauce tomate (domates). Bu beş sos varyasyonlarla mutfağın temelini kurar (örnek: béchamel + gravier = mornay, velouté + balık = bercy). Pâte brisée (kırılgan hamur, tarte tabanı için) ve pâte feuilletée (binbir katmanlı, milföy) hamur disipliniyle hazırlanır; soğuk tereyağı + minimum işleme + dinlendirme üç temel kuralıdır. Bu sayfada günlük seviyede pratik klasiklerden (quiche, omelette aux fines herbes) misafir sofrasına yakışan ana yemeklere (boeuf bourguignon, coq au vin), fırın hamurlarına ve klasik tatlılara (macaron, eclair, opera) kadar geniş bir yelpaze yer alır.",

  "cuisine:japon":
    "Japon mutfağı, az malzemeyle derin tat kurma becerisi ve teknik temizliğiyle ayrılır; 2013'te UNESCO Somut Olmayan Kültürel Miras listesine geleneksel washoku adıyla girdi. Tarifle'de 59 Japon tarifi var; sushi (nigiri ve maki), ramen, tempura, miso çorbası, tonkatsu, gyoza, onigiri, takoyaki, okonomiyaki, teriyaki ve mochi başta gelir. Mutfağın temeli dashi (kemik suyu eşdeğeri): kombu yosunu (10 dakika soğuk su demleme + 60°C ısıtma) ve katsuobushi (ton balığı talaşı, 5 dakika demleme) ile hazırlanan umami yoğun temel sıvı. Beş klasik tat (gomi) sistematik ayrılır: tatlı (amai), ekşi (suppai), tuzlu (shiokarai), acı (nigai) ve umami (Kikunae Ikeda 1908'de tanımladı). Sushi pirinci hazırlığı disiplinli: kısa taneli pirinç + 1:1.1 oranı su, pişme sonrası pirinç sirkesi-şeker-tuz karışımıyla (sushi-zu) hot-fold tekniği. Tempura için soğuk su (buzlu), un (hafif glüten için), ve hızlı çırpma (top dakika içinde olmalı, glüten gelişmemeli); kızartma yağı 175-180°C, dilim başına 2-3 dakika. Soya sosu seçimi karakter belirler: koyu (koikuchi, %80 Japonya tüketimi), açık (usukuchi, daha tuzlu ama renk açık), tamari (buğdaysız, glütensiz), shoyu (organik premium). Bu sayfada günlük pratik tabaklar (donburi, ramen), uzun teknik isteyen klasikler (sushi, tempura), atıştırmalık karakteri tariflerden (gyoza, takoyaki) tatlılara (mochi, dorayaki) kadar yelpaze yer alır.",

  "cuisine:portekiz":
    "Portekiz mutfağı, Atlantik kıyısının deniz ürünleri kültürünü İber yarımadası mirasıyla birleştirir ve Yeni Dünya keşifleri sayesinde Brezilya, Hindistan ve Afrika izlerini taşıyan eklektik bir mutfaktır. Tarifle'de 2 Portekiz tarifi var (lisbon nohutlu morina salatası ve Lizbon portakallı badem keki); klasik repertuvarda bacalhau (tuzlanmış morina, Portekiz'de 365 günde 365 farklı tarif denilir), pastel de nata (Lizbon kremalı tart, 1837 Pasteis de Belém pastanesi referans), caldo verde (Minho yöresi karalahana ve patates çorbası), francesinha (Porto sandviçi, biftek + jambon + sosis + sıcak peynir + bira soslu), bifana (jambon sandviç, sokak yemeği), polvo à lagareiro (zeytinyağlı ahtapot) ve queijada (peynirli mini tart) başta gelir. Mutfağın üç temel direği: bacalhau (tuzlanmış morina, Norveç'ten ithal ama Portekiz'de pişirme yöntemi gelişti), zeytinyağı (Alentejo bölgesi DOP üretici), ve piri-piri sosu (Mozambik'ten gelen ama Portekiz mutfağında klasikleşen acı biber sosu). Portekiz pastane geleneği özellikle güçlü; Conventos (manastırlarda, 18-19. yüzyıl rahibe tatlıları) ovos moles, papos de anjo, fios de ovos gibi yumurta sarısı yoğun tatlıların kökü. Pasteis de nata için Pasteis de Belém pastanesinin orijinal tarifi 1837'den beri sır; ev versiyonları yumurta sarısı + krema + şeker + vanilya + yumuşak hamur tabanı temeli kullanır, fırın 250-280°C üst raf 8-10 dakika. Bu sayfada Portekiz cuisine'i Tarifle kataloğunda yeni eklendi (oturum 27); önümüzdeki batch'lerde klasik bacalhau, pastel de nata ve caldo verde tarifleri eklenecek.",
};

let updated = 0;
let inserted = 0;
let slugFixed = 0;
const expectedNew = Object.keys(NEW_INTROS).length;

// Önce slug fix uygula (key collision'ı önlemek için)
for (const item of data) {
  const oldKey = `${item.type}:${item.slug}`;
  if (SLUG_FIXES[oldKey]) {
    const newSlug = SLUG_FIXES[oldKey];
    console.log(`SLUG FIX: ${oldKey} -> ${item.type}:${newSlug}`);
    item.slug = newSlug;
    slugFixed++;
  }
}

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

console.log(`\nGuncellenen: ${updated} | Yeni eklenen: ${inserted} | Slug fix: ${slugFixed} | Hedef: ${expectedNew}`);

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

// Word count check (150-250 hedef)
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
