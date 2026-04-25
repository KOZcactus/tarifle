/**
 * Blog yazilari icin "## Ilgili Yazilar" bolumu enjekte eder.
 * Editorial secim, "## Kaynaklar" varsa onun ONCESINE, yoksa dosya
 * sonuna ekler. Idempotent: zaten "## Ilgili Yazilar" varsa atlar.
 *
 * Kaynak: docs/FUTURE_PLANS.md "Blog internal link agi genisletme"
 *
 * Kullanim: node scripts/insert-blog-related.mjs [--dry]
 */
import fs from "node:fs";
import path from "node:path";

const DRY = process.argv.includes("--dry");
const BLOG_DIR = path.resolve(process.cwd(), "content/blog");

// Kisa baslik (dosyada yer alacak), her yazi icin 2-3 ilgili yazi
const TITLES = {
  "anadolunun-unutulmus-yemekleri": "Anadolu'nun Unutulmuş Yemekleri",
  "baharatli-yemek-seviyeleri": "Baharatlı Yemek Seviyeleri",
  "damak-yemek-dengesi": "Damak Yemek Dengesi",
  "soguk-vs-sicak-baslangic": "Soğuk vs Sıcak Başlangıç",
  "ev-yapimi-ekmek-tipleri": "Ev Yapımı Ekmek Tipleri",
  "baharat-dolabi-temelleri-secim-saklama-kullanim": "Baharat Dolabı Temelleri",
  "baharat-ogutme-taze-hazir-kavurma-saklama": "Baharat Öğütme",
  "balik-mevsimleri-turkiye-denizleri-rehberi": "Balık Mevsimleri",
  "balik-secimi-temizlik-ve-pisirme": "Balık Seçimi, Temizliği ve Pişirmesi",
  "bayram-sofrasi-ramazan-kurban-yemek-gelenekleri": "Bayram Sofrası",
  "diyet-skoru-nasil-hesaplanir": "Diyet Skoru Nasıl Hesaplanır",
  "domates-cesitleri-hangi-tarif-icin-hangi-tip": "Domates Çeşitleri",
  "et-bolgeleri-rehberi-dana-hangi-pisirme": "Et Bölgeleri Rehberi",
  "et-muhurlemenin-bilimi": "Et Mühürlemenin Bilimi",
  "ev-mutfagi-hijyen-temelleri": "Ev Mutfağı Hijyen Temelleri",
  "evde-dondurma-ve-dondurucu-saklama-rehberi": "Evde Dondurma ve Dondurucu Saklama",
  "evde-tarif-uyarlama-porsiyon-olcu-degiskenler": "Evde Tarif Uyarlama",
  "fermentasyon-temelleri-yogurt-tursu-eksi-maya": "Fermentasyon Temelleri",
  "firin-kullanimi-raf-isi-on-isitma": "Fırın Kullanımı",
  "kahve-demlemesi-turk-espresso-french-press-v60": "Kahve Demlemesi",
  "kahve-mi-cay-mi-secim-rehberi": "Kahve mi, Çay mı?",
  "limon-ve-limon-suyu": "Limon ve Limon Suyu",
  "makarna-cesitleri-sos-eslestirme-rehberi": "Makarna Çeşitleri",
  "maya-kabartma-tozu-karbonat-farki": "Maya, Kabartma Tozu, Karbonat",
  "mikro-otlar": "Mikro Otlar",
  "mutfak-bicagi-secimi-ve-kullanimi": "Mutfak Bıçağı Seçimi",
  "mutfak-ekipman-olmazsa-olmazlari": "Mutfak Ekipman Olmazsa Olmazları",
  "mutfak-ocaklari-induksiyon-gaz-elektrik-dokum": "Mutfak Ocakları",
  "peynir-cesitleri-turk-mutfagi-rehberi": "Peynir Çeşitleri",
  "pilavin-bilimi": "Pilavın Bilimi",
  "ramazan-sofrasi-iftar-sahur-kultur": "Ramazan Sofrası: İftar, Sahur",
  "sarimsak-dogru-kullanimi-kimya-pisirme-saklama": "Sarımsak Doğru Kullanımı",
  "sirke-cesitleri": "Sirke Çeşitleri",
  "soganin-dogru-kavrulmasi": "Soğanın Doğru Kavrulması",
  "sote-vs-kavurma-vs-bugulama": "Sote vs Kavurma vs Buğulama",
  "soguk-zincir-kirmizi-et-guvenligi": "Soğuk Zincir ve Kırmızı Et Güvenliği",
  "su-ve-mutfak-sert-yumusak-su-pisirmeye-etkisi": "Su ve Mutfak",
  "tereyagi-cesitleri-evde-yapimi-pisirmede-kullanim": "Tereyağı: Çeşitleri ve Kullanımı",
  "turk-cayi-kulturu-demleme-sofra-sosyal-hayat": "Türk Çayı Kültürü",
  "turk-kahvaltisinin-mantigi": "Türk Kahvaltısının Mantığı",
  "turk-mutfaginda-dugun-sofrasi": "Türk Mutfağında Düğün Sofrası",
  "turk-mutfaginda-tatli-felsefesi": "Türk Mutfağında Tatlı Felsefesi",
  "turk-mutfaginda-zeytinyagli-yemek-gelenegi": "Türk Mutfağında Zeytinyağlı Yemek Geleneği",
  "turk-mutfaginin-yedi-bolgesi": "Türk Mutfağının Yedi Bölgesi",
  "yag-kimyasi-ve-duman-noktalari": "Yağ Kimyası ve Duman Noktaları",
  "tuz-cesitleri-ve-kullanimi": "Tuz Çeşitleri ve Kullanımı",
  "un-cesitleri-protein-kullanim-rehberi": "Un Çeşitleri",
  "yumurta-pisirme-7-yontem": "Yumurta Pişirme: 7 Yöntem",
  "zeytin-cesitleri-sofralik-meze-rehberi": "Zeytin Çeşitleri",
  "zeytinyagi-secimi": "Zeytinyağı Seçimi",
  "salamura-ve-marine-bilimi": "Salamura ve Marine Bilimi",
};

// Her yazi -> 3 ilgili (slug, kisa baglam aciklamasi)
const RELATED = {
  "anadolunun-unutulmus-yemekleri": [
    ["turk-mutfaginin-yedi-bolgesi", "yedi bölge tat haritasi"],
    ["turk-mutfaginda-dugun-sofrasi", "geleneksel kazan ve toplu mutfak"],
    ["turk-mutfaginda-tatli-felsefesi", "tarihsel tatli mirasi"],
  ],
  "baharatli-yemek-seviyeleri": [
    ["baharat-dolabi-temelleri-secim-saklama-kullanim", "kuru biberlerin saklanmasi"],
    ["baharat-ogutme-taze-hazir-kavurma-saklama", "pul biberi ogutme ve kavurma"],
    ["tuz-cesitleri-ve-kullanimi", "tuzun lezzet dengesindeki rolu"],
  ],
  "damak-yemek-dengesi": [
    ["baharatli-yemek-seviyeleri", "acilik ekseni dengesi"],
    ["tuz-cesitleri-ve-kullanimi", "tuzlulugun temel rolu"],
    ["soguk-vs-sicak-baslangic", "sicaklik katmaninin sofrada uygulamasi"],
  ],
  "mikro-otlar": [
    ["baharat-dolabi-temelleri-secim-saklama-kullanim", "kuru otlarin saklama disiplini"],
    ["damak-yemek-dengesi", "otsu serinligin denge rolu"],
    ["mutfak-bicagi-secimi-ve-kullanimi", "keskin bicakla ot dograma"],
  ],
  "yag-kimyasi-ve-duman-noktalari": [
    ["zeytinyagi-secimi", "zeytinyaginin sizma vs rafine kullanimi"],
    ["et-muhurlemenin-bilimi", "yuksek isi muhurlemede dogru yag"],
    ["tereyagi-cesitleri-evde-yapimi-pisirmede-kullanim", "tereyaginin mutfaktaki yeri"],
  ],
  "sote-vs-kavurma-vs-bugulama": [
    ["soganin-dogru-kavrulmasi", "kavurmanin derinlemesine ornegi"],
    ["et-muhurlemenin-bilimi", "yuksek isi tavada Maillard"],
    ["mutfak-ocaklari-induksiyon-gaz-elektrik-dokum", "isi kontrolunun teknige etkisi"],
  ],
  "limon-ve-limon-suyu": [
    ["damak-yemek-dengesi", "asit ekseninin tat dengesindeki rolu"],
    ["tuz-cesitleri-ve-kullanimi", "limon ile tuzun ortak alani"],
    ["balik-secimi-temizlik-ve-pisirme", "balikta limon kullanimi"],
  ],
  "sirke-cesitleri": [
    ["limon-ve-limon-suyu", "asit ekseninin kardesi"],
    ["fermentasyon-temelleri-yogurt-tursu-eksi-maya", "sirkenin fermentasyon sureci"],
    ["damak-yemek-dengesi", "asitin lezzet dengesindeki rolu"],
  ],
  "salamura-ve-marine-bilimi": [
    ["et-muhurlemenin-bilimi", "salamura sonrasi muhurleme akisi"],
    ["soguk-zincir-kirmizi-et-guvenligi", "salamura sirasinda sicaklik disiplini"],
    ["tuz-cesitleri-ve-kullanimi", "salamura icin dogru tuz secimi"],
  ],
  "soguk-vs-sicak-baslangic": [
    ["turk-mutfaginda-dugun-sofrasi", "buyuk sofralarda corbanin islevi"],
    ["turk-mutfaginda-zeytinyagli-yemek-gelenegi", "klasik soguk meze repertuvari"],
    ["bayram-sofrasi-ramazan-kurban-yemek-gelenekleri", "buyuk gun sofra sirasi"],
  ],
  "ev-yapimi-ekmek-tipleri": [
    ["un-cesitleri-protein-kullanim-rehberi", "un protein orani ve sonuc"],
    ["maya-kabartma-tozu-karbonat-farki", "uc kabarticinin kimyasi"],
    ["fermentasyon-temelleri-yogurt-tursu-eksi-maya", "eksi maya baslaticisi"],
  ],
  "baharat-dolabi-temelleri-secim-saklama-kullanim": [
    ["baharat-ogutme-taze-hazir-kavurma-saklama", "ogutme zamani ve teknigi"],
    ["sarimsak-dogru-kullanimi-kimya-pisirme-saklama", "ornek bir baharat: sarimsak"],
    ["tuz-cesitleri-ve-kullanimi", "tuzu da baharat gibi dusunmek"],
  ],
  "baharat-ogutme-taze-hazir-kavurma-saklama": [
    ["baharat-dolabi-temelleri-secim-saklama-kullanim", "saklama ve dolap diziligi"],
    ["sarimsak-dogru-kullanimi-kimya-pisirme-saklama", "kimya ornek: sarimsak"],
    ["tuz-cesitleri-ve-kullanimi", "ogutme granulu, tuz cesitleri"],
  ],
  "balik-mevsimleri-turkiye-denizleri-rehberi": [
    ["balik-secimi-temizlik-ve-pisirme", "tazelik kontrol ve pisirme"],
    ["turk-mutfaginin-yedi-bolgesi", "Karadeniz hamsi, Ege levrek bolge bagi"],
    ["soguk-zincir-kirmizi-et-guvenligi", "soguk zincir mantigi balikta da gecer"],
  ],
  "balik-secimi-temizlik-ve-pisirme": [
    ["balik-mevsimleri-turkiye-denizleri-rehberi", "hangi mevsim hangi balik"],
    ["ev-mutfagi-hijyen-temelleri", "capraz bulasma ve mutfak hijyeni"],
    ["soguk-zincir-kirmizi-et-guvenligi", "soguk zincir prensipleri"],
  ],
  "bayram-sofrasi-ramazan-kurban-yemek-gelenekleri": [
    ["ramazan-sofrasi-iftar-sahur-kultur", "Ramazan icin detayli kultur yazisi"],
    ["et-bolgeleri-rehberi-dana-hangi-pisirme", "kurban etini dogru kullanmak"],
    ["turk-mutfaginda-dugun-sofrasi", "kazan kulturu ve toplu sofra"],
  ],
  "diyet-skoru-nasil-hesaplanir": [
    ["tuz-cesitleri-ve-kullanimi", "sodyum farkindaligi"],
    ["kahve-mi-cay-mi-secim-rehberi", "beslenme rehberi tarz secim"],
    ["evde-tarif-uyarlama-porsiyon-olcu-degiskenler", "porsiyon ve olcu uyarlama"],
  ],
  "domates-cesitleri-hangi-tarif-icin-hangi-tip": [
    ["makarna-cesitleri-sos-eslestirme-rehberi", "sos eslestirme prensibi"],
    ["sarimsak-dogru-kullanimi-kimya-pisirme-saklama", "domates-sarimsak klasik ikili"],
    ["baharat-dolabi-temelleri-secim-saklama-kullanim", "domates yemeginin baharat dunyasi"],
  ],
  "et-bolgeleri-rehberi-dana-hangi-pisirme": [
    ["et-muhurlemenin-bilimi", "biftek ve mahurleme tekniği"],
    ["soguk-zincir-kirmizi-et-guvenligi", "et soguk zinciri ve guvenlik"],
    ["bayram-sofrasi-ramazan-kurban-yemek-gelenekleri", "kurban etini bolgelerle dusunmek"],
  ],
  "et-muhurlemenin-bilimi": [
    ["soguk-zincir-kirmizi-et-guvenligi", "et soguk zinciri ve ic sicaklik"],
    ["ev-mutfagi-hijyen-temelleri", "et hazirlama ve hijyen"],
    ["et-bolgeleri-rehberi-dana-hangi-pisirme", "hangi bolge muhurlemeye uygun"],
  ],
  "ev-mutfagi-hijyen-temelleri": [
    ["soguk-zincir-kirmizi-et-guvenligi", "et soguk zinciri prensipleri"],
    ["balik-secimi-temizlik-ve-pisirme", "balik temizligi ve capraz bulasma"],
    ["evde-dondurma-ve-dondurucu-saklama-rehberi", "dondurucu ve saklama guvenligi"],
  ],
  "evde-dondurma-ve-dondurucu-saklama-rehberi": [
    ["soguk-zincir-kirmizi-et-guvenligi", "soguk zincir et ozelinde"],
    ["ev-mutfagi-hijyen-temelleri", "mutfak hijyeni temelleri"],
    ["balik-secimi-temizlik-ve-pisirme", "balik dondurma kurali"],
  ],
  "evde-tarif-uyarlama-porsiyon-olcu-degiskenler": [
    ["pilavin-bilimi", "pilav su orani uyarlama ornegi"],
    ["su-ve-mutfak-sert-yumusak-su-pisirmeye-etkisi", "rakim ve su sertligi"],
    ["maya-kabartma-tozu-karbonat-farki", "hamur scaling kabarma uyarlamasi"],
  ],
  "fermentasyon-temelleri-yogurt-tursu-eksi-maya": [
    ["maya-kabartma-tozu-karbonat-farki", "eksi maya ve kabartma karsilastirma"],
    ["peynir-cesitleri-turk-mutfagi-rehberi", "peynirde fermentasyon"],
    ["tereyagi-cesitleri-evde-yapimi-pisirmede-kullanim", "kremadan tereyaga, sut donguleri"],
  ],
  "firin-kullanimi-raf-isi-on-isitma": [
    ["mutfak-ocaklari-induksiyon-gaz-elektrik-dokum", "ocak teknolojileri ile kiyaslama"],
    ["maya-kabartma-tozu-karbonat-farki", "hamur firinda nasil davranir"],
    ["un-cesitleri-protein-kullanim-rehberi", "ekmek ve protein orani"],
  ],
  "kahve-demlemesi-turk-espresso-french-press-v60": [
    ["kahve-mi-cay-mi-secim-rehberi", "kahve mi cay mi karari"],
    ["turk-cayi-kulturu-demleme-sofra-sosyal-hayat", "Turk cayi demleme paraleli"],
    ["su-ve-mutfak-sert-yumusak-su-pisirmeye-etkisi", "su sertligi demlemeye etkisi"],
  ],
  "kahve-mi-cay-mi-secim-rehberi": [
    ["kahve-demlemesi-turk-espresso-french-press-v60", "kahve demleme yontemleri"],
    ["turk-cayi-kulturu-demleme-sofra-sosyal-hayat", "Turk cayinin kultur boyutu"],
    ["diyet-skoru-nasil-hesaplanir", "beslenme ve diyet skor sistemi"],
  ],
  "makarna-cesitleri-sos-eslestirme-rehberi": [
    ["domates-cesitleri-hangi-tarif-icin-hangi-tip", "domates secimi sos icin"],
    ["sarimsak-dogru-kullanimi-kimya-pisirme-saklama", "sarimsakli sos formu"],
    ["su-ve-mutfak-sert-yumusak-su-pisirmeye-etkisi", "haslama suyu prensipleri"],
  ],
  "maya-kabartma-tozu-karbonat-farki": [
    ["un-cesitleri-protein-kullanim-rehberi", "un protein orani hamur sonucu"],
    ["fermentasyon-temelleri-yogurt-tursu-eksi-maya", "eksi maya fermentasyonu"],
    ["firin-kullanimi-raf-isi-on-isitma", "firinda kabarma davranisi"],
  ],
  "mutfak-bicagi-secimi-ve-kullanimi": [
    ["mutfak-ekipman-olmazsa-olmazlari", "ekipman temel listesi"],
    ["ev-mutfagi-hijyen-temelleri", "bicak hijyeni ve capraz bulasma"],
    ["soganin-dogru-kavrulmasi", "dogru dograma teknigi"],
  ],
  "mutfak-ekipman-olmazsa-olmazlari": [
    ["mutfak-bicagi-secimi-ve-kullanimi", "bicak ozel rehberi"],
    ["mutfak-ocaklari-induksiyon-gaz-elektrik-dokum", "ocak secimi"],
    ["firin-kullanimi-raf-isi-on-isitma", "firin kullanim teknigi"],
  ],
  "mutfak-ocaklari-induksiyon-gaz-elektrik-dokum": [
    ["firin-kullanimi-raf-isi-on-isitma", "firin teknik tarafi"],
    ["mutfak-ekipman-olmazsa-olmazlari", "ekipman butce listesi"],
    ["soganin-dogru-kavrulmasi", "ocak ile kavurma teknigi"],
  ],
  "peynir-cesitleri-turk-mutfagi-rehberi": [
    ["tereyagi-cesitleri-evde-yapimi-pisirmede-kullanim", "tereyagi sut urunu paraleli"],
    ["fermentasyon-temelleri-yogurt-tursu-eksi-maya", "peynir fermentasyon temeli"],
    ["turk-kahvaltisinin-mantigi", "kahvaltinin peynir merkezi"],
  ],
  "pilavin-bilimi": [
    ["su-ve-mutfak-sert-yumusak-su-pisirmeye-etkisi", "su orani ve sertlik"],
    ["evde-tarif-uyarlama-porsiyon-olcu-degiskenler", "porsiyon olcek uyarlama"],
    ["soganin-dogru-kavrulmasi", "soganli pilav kavurma noktasi"],
  ],
  "ramazan-sofrasi-iftar-sahur-kultur": [
    ["bayram-sofrasi-ramazan-kurban-yemek-gelenekleri", "Ramazan ve Kurban kapsayici"],
    ["turk-kahvaltisinin-mantigi", "sahur ve kahvalti yakinligi"],
    ["turk-mutfaginda-tatli-felsefesi", "iftar tatlilarinin yeri"],
  ],
  "sarimsak-dogru-kullanimi-kimya-pisirme-saklama": [
    ["soganin-dogru-kavrulmasi", "sogan-sarimsak ikili kullanimi"],
    ["baharat-dolabi-temelleri-secim-saklama-kullanim", "sarimsak baharat dolabinda"],
    ["baharat-ogutme-taze-hazir-kavurma-saklama", "kuru sarimsak ogutme"],
  ],
  "soganin-dogru-kavrulmasi": [
    ["sarimsak-dogru-kullanimi-kimya-pisirme-saklama", "sarimsak kimyasi paraleli"],
    ["mutfak-bicagi-secimi-ve-kullanimi", "dograma teknigi ve hiz"],
    ["pilavin-bilimi", "pilav baslangici sogan"],
  ],
  "soguk-zincir-kirmizi-et-guvenligi": [
    ["ev-mutfagi-hijyen-temelleri", "mutfak hijyeni butunu"],
    ["et-muhurlemenin-bilimi", "ic sicaklik ve mahurleme"],
    ["et-bolgeleri-rehberi-dana-hangi-pisirme", "et bolgesi farki ve risk"],
  ],
  "su-ve-mutfak-sert-yumusak-su-pisirmeye-etkisi": [
    ["pilavin-bilimi", "pilav su orani"],
    ["evde-tarif-uyarlama-porsiyon-olcu-degiskenler", "rakim ve uyarlama"],
    ["tuz-cesitleri-ve-kullanimi", "tuz ve sert su iliskisi"],
  ],
  "tereyagi-cesitleri-evde-yapimi-pisirmede-kullanim": [
    ["peynir-cesitleri-turk-mutfagi-rehberi", "sut urunu komsulari"],
    ["fermentasyon-temelleri-yogurt-tursu-eksi-maya", "kremadan tereyaga fermentasyon"],
    ["zeytinyagi-secimi", "yag alternatifi karari"],
  ],
  "turk-cayi-kulturu-demleme-sofra-sosyal-hayat": [
    ["kahve-demlemesi-turk-espresso-french-press-v60", "kahve demleme yontem komsusu"],
    ["kahve-mi-cay-mi-secim-rehberi", "kahve cay secim cercevesi"],
    ["turk-kahvaltisinin-mantigi", "kahvalti ve cay birlikteligi"],
  ],
  "turk-kahvaltisinin-mantigi": [
    ["yumurta-pisirme-7-yontem", "yumurta yontemleri kahvaltinin merkezi"],
    ["peynir-cesitleri-turk-mutfagi-rehberi", "kahvalti peynirleri"],
    ["zeytin-cesitleri-sofralik-meze-rehberi", "sofralik zeytin secimi"],
  ],
  "turk-mutfaginda-dugun-sofrasi": [
    ["bayram-sofrasi-ramazan-kurban-yemek-gelenekleri", "bayramin toplu sofra mirasi"],
    ["anadolunun-unutulmus-yemekleri", "kayboluyor olan ritueller"],
    ["turk-mutfaginin-yedi-bolgesi", "bolge bolge dugun yemekleri"],
  ],
  "turk-mutfaginda-tatli-felsefesi": [
    ["un-cesitleri-protein-kullanim-rehberi", "tatli hamur ve un secimi"],
    ["fermentasyon-temelleri-yogurt-tursu-eksi-maya", "geleneksel ekmek tatli baglari"],
    ["bayram-sofrasi-ramazan-kurban-yemek-gelenekleri", "bayram tatlilari"],
  ],
  "turk-mutfaginda-zeytinyagli-yemek-gelenegi": [
    ["zeytinyagi-secimi", "hangi zeytinyagi salatada hangisi mutfakta"],
    ["zeytin-cesitleri-sofralik-meze-rehberi", "zeytinin sofralik formu"],
    ["turk-mutfaginin-yedi-bolgesi", "Ege bolgesi mutfak haritasi"],
  ],
  "turk-mutfaginin-yedi-bolgesi": [
    ["anadolunun-unutulmus-yemekleri", "haritadan silinen tatlar"],
    ["turk-mutfaginda-zeytinyagli-yemek-gelenegi", "Ege ozelinde zeytinyagli"],
    ["balik-mevsimleri-turkiye-denizleri-rehberi", "Karadeniz balik mevsimi bagi"],
  ],
  "tuz-cesitleri-ve-kullanimi": [
    ["diyet-skoru-nasil-hesaplanir", "sodyum ve diyet uyumu"],
    ["su-ve-mutfak-sert-yumusak-su-pisirmeye-etkisi", "tuz ve su sertlik iliskisi"],
    ["baharat-dolabi-temelleri-secim-saklama-kullanim", "tuzun baharat dolabi yeri"],
  ],
  "un-cesitleri-protein-kullanim-rehberi": [
    ["maya-kabartma-tozu-karbonat-farki", "un + maya hamur cifti"],
    ["fermentasyon-temelleri-yogurt-tursu-eksi-maya", "eksi maya unun yoldasi"],
    ["turk-mutfaginda-tatli-felsefesi", "un tatlilari ve seti"],
  ],
  "yumurta-pisirme-7-yontem": [
    ["turk-kahvaltisinin-mantigi", "kahvaltida yumurtanin yeri"],
    ["ev-mutfagi-hijyen-temelleri", "yumurta guvenligi ve hijyen"],
    ["et-muhurlemenin-bilimi", "ic sicaklik ve termometre kulturu"],
  ],
  "zeytin-cesitleri-sofralik-meze-rehberi": [
    ["zeytinyagi-secimi", "zeytinin sivi formu"],
    ["turk-kahvaltisinin-mantigi", "kahvaltida sofralik zeytin"],
    ["turk-mutfaginda-zeytinyagli-yemek-gelenegi", "zeytinyagli yemek kulturu"],
  ],
  "zeytinyagi-secimi": [
    ["zeytin-cesitleri-sofralik-meze-rehberi", "zeytinin sofralik formu"],
    ["turk-mutfaginda-zeytinyagli-yemek-gelenegi", "zeytinyagli yemek gelenegi"],
    ["tereyagi-cesitleri-evde-yapimi-pisirmede-kullanim", "yag alternatifleri"],
  ],
};

function buildSection(slug) {
  const items = RELATED[slug];
  if (!items) return null;
  const lines = ["## İlgili Yazılar", ""];
  for (const [s, ctx] of items) {
    const t = TITLES[s] || s;
    lines.push(`- [${t}](/blog/${s}): ${ctx}.`);
  }
  lines.push("");
  return lines.join("\n");
}

function processFile(file) {
  const slug = path.basename(file, ".mdx");
  const section = buildSection(slug);
  if (!section) {
    console.warn(`SKIP (no related defined): ${slug}`);
    return false;
  }
  const content = fs.readFileSync(file, "utf8");
  if (content.includes("## İlgili Yazılar")) {
    console.log(`SKIP (already has section): ${slug}`);
    return false;
  }

  let updated;
  if (content.includes("## Kaynaklar")) {
    updated = content.replace("## Kaynaklar", section + "\n## Kaynaklar");
  } else {
    const trimmed = content.replace(/\s+$/, "");
    updated = trimmed + "\n\n" + section;
  }

  if (DRY) {
    console.log(`WOULD UPDATE: ${slug}`);
  } else {
    fs.writeFileSync(file, updated, "utf8");
    console.log(`UPDATED: ${slug}`);
  }
  return true;
}

function main() {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => path.join(BLOG_DIR, f));
  let updated = 0;
  for (const f of files) {
    if (processFile(f)) updated++;
  }
  console.log(`\nDone. ${updated}/${files.length} files updated (${DRY ? "DRY-RUN" : "APPLY"}).`);
}

main();
