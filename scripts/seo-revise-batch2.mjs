#!/usr/bin/env node
/**
 * GPT 5 Pro audit P1 batch 2 (oturum 26): top 6-12 SEO landing intro
 * derinlik revize. Oturum 25 batch 1 (top 5) pattern'i devamı:
 * "150-250 kelime özgün açıklama, somut sayı + otorite + pratik öngörü."
 *
 * Hedef 7 sayfa (yüksek trafik adayları, dev DB count):
 *   - category/tatlilar (473 tarif, "470+")
 *   - category/kahvaltiliklar (313, "310+")
 *   - category/tavuk-yemekleri (159, "yaklaşık 160")
 *   - category/et-yemekleri (349, "350+")
 *   - category/hamur-isleri (359, "350+")
 *   - cuisine/italyan (52, "yaklaşık 50")
 *   - diet/vejetaryen (2436, "2400+")
 *
 * Idempotent: yeni intro'lar set edilir, FAQ'lara dokunulmaz, top 5'e
 * dokunulmaz (key collision yok).
 *
 * Em-dash (— U+2014) yasak (AGENTS.md): virgül, noktalı virgül, nokta,
 * parantez, iki nokta kullanıldı.
 *
 * Usage: node scripts/seo-revise-batch2.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const file = path.resolve(process.cwd(), "docs/seo-copy-v1.json");
const data = JSON.parse(fs.readFileSync(file, "utf-8"));

const NEW_INTROS = {
  "category:tatlilar":
    "Tatlı, sofranın kapanışı ama aynı zamanda öğünün ritmini özetleyen bir tabaktır; ağır bir akşam sonrası ferah bir meyveli muhallebi, hafif bir menü sonrası baklava ya da cheesecake doğru karar olur. Tarifle'de 470+ tatlı tarifi var; en sık pişirilenler arasında sütlaç, baklava, revani, kazandibi, profiterol, brownie ve mevsim meyveli kek başta gelir. Tatlılar dört büyük çatı altında toplanır: şerbetli (baklava, revani, şekerpare), sütlü (sütlaç, muhallebi, kazandibi), fırın hamurlu (kek, kurabiye, tart, brownie) ve dondurulmuş (parfait, dondurma, sorbe). Şerbetli tariflerde sıcaklık eşleşmesi tek altın kural: sıcak tatlıya soğuk şerbet ya da soğuk tatlıya sıcak şerbet (Gaziantep usulü tersi yapılır), dengesiz kombinasyon hamuru sünger gibi yumuşatır veya çıtırı bozar. Sütlü tatlılarda nişastayı önce soğuk sütle açmak topak riskini sıfırlar, orta ateşte düzenli karıştırma alt yüzey karamelizasyonunu önler. Fırın tatlılarında kalıbın tabanı (cam mı metal mi) ve raf seviyesi (üst, orta, alt) sonucu belirler. Karamelizasyon 160-180°C civarında aktif başlar, ondan önce kapağı açmak erken müdahaledir. Bu sayfada günlük çay saati için pratik kurabiyeler, özel gün için baklava ve cheesecake, mevsim meyveli hafif seçenekler ve dondurmalı taç kapanışlar bir aradadır. Çay saatinde hafif tutmak (kurabiye, kek), bayramda yoğun gitmek (baklava, revani) sezona göre denge kurar.",

  "category:kahvaltiliklar":
    "Kahvaltılık, günün ritmini belirleyen ve sofranın tonunu kuran ilk tabaktır; ne yenirse o gün öyle başlar. Tarifle'de 310+ kahvaltılık tarifi var; en sık pişirilenler arasında menemen, omlet, mücver, sigara böreği, peynirli pancake, simit eşliği ve hafta sonu için fırın tepsisi seçenekleri başta gelir. Kahvaltılıklar üç pratik kategoriye ayrılır: hızlı (5-10 dk, hafta içi sabah), orta (15-25 dk, hafta sonu kahvaltısı) ve uzun (30 dk üzeri, misafir sofrası, fırın tepsileri). Menemende belirleyici unsur domatesin suyu: önce biber yumuşatılır, sonra domates suyunun büyük kısmı uçana kadar pişirilir, en son yumurta 2-3 dakikada toparlanır. Yumurta erken eklenirse karışım gevşer ve cıvık kalır. Pankek ve krep hamurunda 15-30 dakika dinlenme un su emişini düzenler, krepi elastik ve ince bırakır. Pancake için 1:1 buttermilk-un oranı klasik America's Test Kitchen referansıdır. Sigara böreği yufkasını kızartırken yağ sıcaklığını 175°C civarında tutmak standart; daha düşük yağ emer, daha yüksek dış yanmadan iç pişmez. Bu sayfada iş günü için 10 dakikada hazırlanan pratik tabaklarla hafta sonu kahvaltısı için daha özenli fırın işleri ve kalabalık misafir sofrasına uygun seçenekler bir aradadır. Tatlı tuzlu dengesi kurulduğunda kahvaltılık, yalnızca karın doyurmak değil, günün ilk iyi kararı haline gelir.",

  "category:tavuk-yemekleri":
    "Tavuk yemekleri, hafta içi planından misafir sofrasına en geniş kullanım alanına sahip kategorilerden biridir; göğüs, but, kanat ve bütün tavuk aynı tabağı paylaşırken pişirme sürelerini farklılaştırır. Tarifle'de yaklaşık 160 tavuk tarifi var; en sık pişirilenler arasında tavuk şiş, fırın bütün tavuk, tavuk sote, tavuk tandoori, kanat sos ve tavuk dürüm başta gelir. Pişirme güvenliği için iç sıcaklık (USDA standardı): göğüs 74°C, but 80°C, kanat 75°C. Termometre yoksa kontrol ölçütü: etin saydam değil opak olması ve ezilince akan suyun berrak gelmesi (pembe değil). Marine süresi tarife göre değişir: yoğurtlu marineler 2-4 saat, asit yoğun (limon, sirke) marineler 30 dakika ile 1 saat (uzun süre yüzeyi gevşetir), tuz yağ baharat bazlı kuru marineler 4-12 saat (gece bekleme dahil). Göğüs etinde temel kural yüksek ama kısa ısı; eti eşit kalınlığa açmak (1.5-2 cm) eşit pişmeyi sağlar. But eti uzun pişme dostudur, yağ oranı yüksek olduğu için kolay kurumaz, soslu ve fırın tariflerinde ilk tercih. Bu sayfada 20 dakikada hazır olan hızlı sote ve şiş seçenekleri, fırın tepsisi tabakları, soslu tencere yemekleri ve hafta sonu için bütün tavuk uygulamaları bir aradadır. Yanına pilav, fırın sebze, dürüm ya da salata eşliği koymak kolay olduğu için tek tabak planlamada da avantajlıdır.",

  "category:et-yemekleri":
    "Et yemekleri, malzemenin kalitesinden çok kesimin doğru okunmasına ve ısının sabırlı yönetimine dayanır. Tarifle'de 350+ et tarifi var; kıyma, kuşbaşı, biftek, incik, kaburga, döş ve dana rosto aynı kategori içinde görünse de bambaşka pişirme mantığı isterler. En sık pişirilenler arasında dana sote, fırın kuzu incik, biftek, ev köftesi, kuşbaşılı güveç ve kaburga başta gelir. Pişirme süreleri kesime göre belirgin değişir: dana kuşbaşı tencere 2-3 saat (kollajen erimesi için), kuzu fırın 1.5-2 saat, biftek tava ya da grill 2-4 dakika her yüz, incik 3-4 saat düşük ateş. Düşük ateş ve uzun süre kombinasyonu bağ dokusu yüksek parçalarda (incik, kaburga, döş) jelatinli derinlik üretir; hızlı kuru ısı (biftek, bonfile) ise narin parçalar için uygundur. Mühür hissi için tava 200°C üstüne ısınmalı, et oda sıcaklığında ve kağıt havluyla kuru olmalı (yüzey nemi buhar üretir, mühür kabuklanmaz). Etin dinlenmesi tartışmasız kritik: ızgara ve fırın etlerinde 5-10 dakika beklemek iç sıvının yeniden dağılmasını sağlar; hemen kesilirse tabağa akar ve lif yapısı kurur. Bu sayfada hızlı tava sotelerinden uzun fırın güveçlere, klasik tencere yemeklerine ve özel gün rostolarına kadar geniş yelpaze yer alır. Yanına pilav, püre, köz sebze ya da turşu eşliği seçimi tabağın yükünü dengeler.",

  "category:hamur-isleri":
    "Hamur işleri, mutfakta ölçü ve sabır disiplininin en görünür olduğu kategoridir; aynı dört malzeme (un, su, yağ, maya ya da kabartıcı) yoğurma süresi, bekleme sıcaklığı ve pişirme yüzeyi farklılığında bambaşka sonuçlar verir. Tarifle'de 350+ hamur işi tarifi var; en sık pişirilenler arasında poğaça, su böreği, sigara böreği, açma, simit, çörek, gözleme ve katmer başta gelir. Hamurlar üç temel ailede toplanır: mayalı (poğaça, simit, açma, somun), yağlı katmanlı (börek, baklava, milföy) ve sade (gözleme, bazlama, yufka). Mayalı tariflerde fermantasyon süresi belirleyici; ılık ortamda (24-28°C) birinci kabarma 1 ile 1.5 saat, soğuk fermantasyon (buzdolabı, 6-12 saat) daha karmaşık tat üretir. Yoğurma süresi gluten gelişimi için 8-12 dakika; az yoğurulmuş hamur yapısız, fazla yoğurulmuş hamur sertleşir. Su sıcaklığı kritik: maya 40°C üstünde ölür, 25°C altında uyumaya devam eder, ideal aralık 30-37°C. Katmanlı hamurda yağın hamur içinde plastik kalması için soğuk çalışma esastır (yaz aylarında buzdolabına ara verme zorunluluğu). Bu sayfada hızlı çay saati için poğaça açma seçenekleri, hafta sonu için ev ekmeği ve simit, kalabalık misafir sofrası için su böreği ve milföy katmanları, geleneksel için gözleme ve katmer bir aradadır. Sıcak servis (gözleme, bazlama) hemen, mayalı işler 1-2 saat dinlenmeyle daha iyi açılır.",

  "cuisine:italyan":
    "İtalyan mutfağı, az malzeme ve çok teknikle çalışan, kuzeyden güneye keskin bölgesel farklar barındıran bir mutfaktır. Tarifle'de yaklaşık 50 İtalyan tarifi var; pizza margherita, spaghetti carbonara, lasagna bolognese, risotto milanese, tiramisu, panna cotta ve bruschetta başta gelir. Bölgesel ayrım net: kuzey (Lombardia, Piemonte) tereyağı, risotto pirinci ve sert peynirler (parmesan, gorgonzola); orta (Toskana, Emilia-Romagna) prosciutto, balsamik sirke ve makarna çeşitliliği (tortellini, tagliatelle); güney (Napoli, Sicilya, Puglia) zeytinyağı, domates ve deniz ürünleri öne çıkar. Pasta haşlama suyu için klasik oran 1 litre suya 10 g tuz, suyun acımtırak deniz tadında olması gerekir. Al dente terimi (\"dişe gelir\") şu anlama gelir: merkezde 1-2 mm hafif sertlik kalmalı, dış yüzey sosu emecek kadar pişmiş olmalı. Pasta paketinin önerilen süresinden 1-2 dakika kısa pişirip son pişirmeyi soslu tavada tamamlamak (mantecatura) klasik tekniktir. Pizza Napoletana için Associazione Verace Pizza Napoletana resmi standardı: taş fırın 430-485°C, 60-90 saniye pişirme. Ev fırınında pizza taşı 250°C üstüne ısıtmak yaklaşık benzer sonuca ulaştırır. Bu sayfada günlük makarna ve risotto seçenekleri, klasik fırın yemekleri (lasagna, parmigiana), antipasti tabakları ve klasik tatlılar (tiramisu, panna cotta) bir aradadır. Az ama iyi malzeme, ölçülü tuz, doğru zamanlama: İtalyan mutfağının üç altın kuralı.",

  "diet:vejetaryen":
    "Vejetaryen tarifler, et ve balık içermeyen ama yumurta, süt, yoğurt ve peynir gibi süt ürünleriyle genişleyen geniş bir mutfak alanı sunar. Tarifle'de 2400+ vejetaryen tarifi var (vegan etiketli 1050+ tarif bu sayının alt kümesidir); kahvaltılıklardan ana yemeklere, mezelerden tatlılara kadar her öğüne yayılır. En sık pişirilenler arasında menemen, mercimek çorbası, sebzeli pilav, peynirli börek, mücver, mantarlı risotto, çoban salatası, sebzeli pasta ve karnabahar fırın başta gelir. Vejetaryen beslenmede protein yeterliliği endişesi modern çalışmalarda (Academy of Nutrition and Dietetics, 2016 position paper) yersiz: süt, yumurta, bakliyat ve tahıl kombinasyonu tüm esansiyel amino asitleri sağlar. B12 vitamini sadece hayvansal kaynaklarda doğal; yumurta ve süt ürünleri tüketen vejetaryende takviye gerekmez (vegan'dan farkı). Doyuruculuk için protein-lif kombinasyonu kurulur: 100 g pişmiş mercimek 9 g protein ve 8 g lif, 100 g nohut 8.9 g protein, 1 yumurta 6 g protein, 100 g lor peyniri 11 g protein. Pişirme tekniği etle ortak; sebzeyi karamelize etmek (180-200°C fırın), kavurma (mantar, soğan), kızartma ve buharda pişirme aynı disiplini ister. Bu sayfada hafta içi pratik tabaklardan hafta sonu özel sofralarına kadar et ve balık içermeyen tüm tarifler toplanır. Etiket okuma alışkanlığı şart; bazı hazır soslar, çorba bazları ve sosis dolgu ürünleri görünmez et içerebilir. Ciddi tıbbi ya da etik hassasiyetler için ürün etiketlerini ayrıca doğrulamak gerekir.",
};

let updated = 0;
const expectedCount = Object.keys(NEW_INTROS).length;

for (const item of data) {
  const key = `${item.type}:${item.slug}`;
  if (NEW_INTROS[key]) {
    const oldWords = item.intro.split(/\s+/).length;
    const newWords = NEW_INTROS[key].split(/\s+/).length;
    console.log(
      `${key}: ${oldWords} -> ${newWords} kelime (${item.intro.length} -> ${NEW_INTROS[key].length} char)`,
    );
    item.intro = NEW_INTROS[key];
    updated++;
  }
}

console.log(`\nGuncellenen item: ${updated}/${expectedCount}`);

// Em-dash sanity check (AGENTS.md kuralı)
const EM_DASH = "—";
let emDashFound = 0;
for (const intro of Object.values(NEW_INTROS)) {
  if (intro.includes(EM_DASH)) {
    emDashFound++;
  }
}
if (emDashFound > 0) {
  console.error(`\nEM-DASH BULUNDU (${emDashFound} intro), abort.`);
  process.exit(1);
}
console.log("Em-dash kontrol: temiz (0 ihlal).");

if (APPLY) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\nYazildi: docs/seo-copy-v1.json`);
} else {
  console.log(`\nDRY RUN. --apply ile yaz.`);
}
