#!/usr/bin/env node
/**
 * GPT 5 Pro audit P1 (oturum 25): top 5 SEO landing intro derinlik
 * revize. Mevcut intro'lar 139-159 kelime aralığında, jenerik anlatım.
 * GPT öneri: "150-250 kelime özgün açıklama, somut sayı + otorite +
 * pratik öngörü, şablon yerine fayda yoğunluğu."
 *
 * 5 hedef sayfa (en yüksek trafik potansiyeli):
 *   - category/aperatifler (190 tarif)
 *   - category/corbalar (350+ tarif)
 *   - cuisine/turk (1900+ tarif)
 *   - diet/vegan (1050+ tarif)
 *   - diet/glutensiz (800+ tarif)
 *
 * Idempotent: yeni intro'lar set edilir, FAQ'lara dokunulmaz.
 *
 * Usage: node scripts/seo-revise-top5.mjs --apply
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const file = path.resolve(process.cwd(), "docs/seo-copy-v1.json");
const data = JSON.parse(fs.readFileSync(file, "utf-8"));

const NEW_INTROS = {
  "category:aperatifler":
    "Aperatif, akşam yemeği vaktinden 30-60 dakika önce sofraya gelen küçük lokmadır; iştah açar, sohbeti başlatır, ana yemeğe geçişi hazırlar. Tarifle'de yaklaşık 190 aperatif tarifi var; en çok pişirilenler arasında mücver, humus, sigara böreği, patates köftesi ve yeşil mercimek köftesi başta gelir. Aperatif tarifleri iki büyük çatı altında toplanır: kızartılanlar (anlık çıtırlık, hızlı servis) ve fırında pişenler (yağ kontrolü kolay, toplu hazırlık avantajı). 180-200°C fırın çoğu sebze atıştırmalığı için ideal; kızartmada ise yağı 175°C civarında tutmak (ne çok soğuk yağ emer, ne çok kavrulup acıkır) anahtar kural. Sos seçimi aperatifin kimliğini belirler: yoğurt sarımsaklı (Türk klasiği), tahin limonlu (Akdeniz), domates bazlı (İtalyan etkisi), acı biberli (Asya etkisi). Bu sayfada film akşamı için pratik atıştırmalıklar, misafir sofrası için özenli mezeler, çocuk sofrasına uygun yumuşak lokmalar ve kahvaltıya yakın hafif aperatifler bir aradadır. Aperatif tabağında çeşitlilik tek tat baskısını kırar; 3-4 farklı doku (çıtır, krema, taze, ekşi) bir araya gelirse en başarılı sofra kurulur.",

  "category:corbalar":
    "Çorba, Türk sofrasının en köklü kategorilerinden biri; kahvaltıdan akşam yemeğine, hastalık iyileştirmeden bayram sofrasına, her saate uyum sağlar. Tarifle'de 350+ çorba tarifi var; mercimek (en sık), ezogelin, yayla, tarhana, düğün ve domates çorbası başta gelir. İyi bir çorbada belirleyici unsur sıvıdır: kemik suyu (4-6 saat kaynama, kollajen ve protein zengin) sebze suyundan farklı bir derinlik verir; sebze suyu (40-60 dk) hafif ve vegan dostudur. Koyulaştırma yöntemleri çorbanın karakterini belirler: un ve tereyağı (klasik Fransız velouté), pirinç (Türk düğün çorbası), patates (Doğu Avrupa), bakliyat (mercimek, ezogelin doğal kıvamı). Blender kullanırken pürüzsüz sonuç için ince elekten geçirmek lokanta tipi kıvamı verir. Üstü süslemek tek tat değil, lezzet derinliği katar: pul biberli yağ (acılık), limon (asit), yoğurt (kremalık), kıtır ekmek (doku). Bu sayfada günlük tencere çorbalarından özel gün sofrasına uygun terbiyeli, krem, deniz ürünlü ve yöresel seçeneklere kadar geniş yelpaze yer alır. Soğuk çorbalar (gazpacho, cacık çorbası) yaza, sıcak doyurucular (paça, tarhana) kışa öncelik verir.",

  "cuisine:turk":
    "Türk mutfağı, sadece kebap ve hamur işiyle özetlenemeyecek bir Anadolu mozaiğidir; yedi bölgenin her biri ayrı bir mutfak çizgisi taşır. Tarifle'de 1900+ Türk tarifi var: Karadeniz'in mısır unu ve hamsisi (orijinal pisi balık tava), Ege'nin zeytinyağlısı (enginar, börülce, deniz ürünlü), Güneydoğu'nun yağlı ve baharatlı eti (Adana kebap, Antep fıstıklı içli köfte), İç Anadolu'nun hamur ve bakliyatı (mantı, etli ekmek, içli köfte). Slow Food Türkiye'nin koruma altına aldığı 100+ yöresel ürün (Boyabat çekme helvası, Ezine peyniri, Antep fıstığı, Tekirdağ köftesi gibi) bu zenginliğin bir göstergesi. Mutfağın temeli yoğurt, tereyağı, salça, bulgur, sumak, nar ekşisi ve tahin gibi bağlayıcı malzemelere dayanır; bunlarsız Türk yemeği kurulamaz. Tencere, fırın ve sac üçü de aynı derecede güçlü pişirme yöntemleridir. Bu sayfada günlük ev tarifleri, çay saati hamur işleri, mezeler, fırın yemekleri, çorbalar ve geleneksel tatlılar bir aradadır. Tarif seçerken bölge bilgisi (Antep fıstıklı baklava ile İstanbul fıstıklısı farklı) ve mevsim (yaz zeytinyağlı, kış tencere) iki temel filtre.",

  "diet:vegan":
    "Vegan tarifler, hayvansal ürün içermeyen bitki tabanlı mutfak; lezzetten ödün vermek değil, malzemenin kendi gücünü öne çıkarmaktır. Tarifle'de 1050+ vegan tarif var; bakliyatlar (mercimek, nohut, fasulye), sebze tabanlı çorba ve kaseler, tahin sosları, mantarlı yemekler ve fırın sebze tabakları başta gelir. Vegan beslenmede üç kritik mikrobesin var: B12 (sadece hayvansal kaynaklarda doğal, takviye gerekir), omega-3 ALA (keten, ceviz, chia tohumu), demir ve B kompleks (bakliyat, tam tahıl, koyu yapraklı yeşillik). Doyuruculuk için protein-lif kombinasyonu kurulur: 100 g pişmiş mercimek 9 g protein ve 8 g lif, 100 g nohut 8.9 g protein. Pişirme tekniği vegan tarifte daha belirgindir; kızartma sebzenin tatlılığını çıkarır (havuç, kabak), fırınlama doku verir (çıtır karnabahar), buharda pişirme renk ve besin korur (brokoli, ıspanak), kavurma derinlik kurar (mantar, soğan). Tahin, miso, karamelize soğan, mantar suyu, sumak ve nar ekşisi gibi umami kaynakları yemeğe katmanlı tat verir. Bu sayfa malzeme listesine göre filtreleme yapar; etik veya tıbbi hassasiyet durumlarında ürün etiketlerini ayrıca doğrulamak gerekir.",

  "diet:glutensiz":
    "Glutensiz mutfak, buğday-arpa-çavdar ailesinden gluten içermeyen tüm tarifleri kapsar; aslında doğanın çoğu temel malzemesi zaten glutensizdir. Tarifle'de 800+ glutensiz tarif var; pirinç, mısır, karabuğday, kinoa, patates, baklagil unları (nohut, mercimek), badem ve fındık unları temel yapı malzemeleri. Çölyak hastalığı dünya nüfusunun yaklaşık %1'inde görülür; ek %6 oranında non-celiac glüten duyarlılığı tahmin edilir. Buğday ununun verdiği elastik gluten yapısı tek formülde taklit edilemez; pirinç unu (gevrek), mısır unu (kumlu, sarı), karabuğday unu (toprak aroması), nişasta (bağlayıcı), psyllium veya keten tohumu (su tutucu) genelde 2-3 kombinasyon halinde kullanılır. Çorba ve sıcak yemeklerde gluten genellikle salça ya da etli kavurma yağında saklanır; etiket okuma alışkanlığı şart. Bu sayfada doğal glutensiz tarifler (mercimek çorbası, kıymalı patates, fırın sebze) ve uyarlanmış glutensiz versiyonlar (glutensiz makarna, kek, kurabiye) bir aradadır. Çapraz bulaşma takibi mutfak seviyesinde yapılmaz; ciddi çölyak için kullanılan un ve hazır ürünlerin etiket bilgisini ek olarak doğrulamak gerekir.",
};

let updated = 0;
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

console.log(`\nGuncellenen item: ${updated}/5`);

if (APPLY) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), "utf-8");
  console.log(`\nYazildi: docs/seo-copy-v1.json`);
} else {
  console.log(`\nDRY RUN. --apply ile yaz.`);
}
