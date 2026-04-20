/**
 * Em-dash toplu replace sonrası anlamı zayıf kalan yerler için punct
 * upgrade. Virgül yerine `:` (liste/açıklama vurgusu) veya `;` (iki
 * bağımsız cümle) veya `.` (tamamen ayrı cümle).
 *
 * Run:
 *   node scripts/fix-emdash-meaning.mjs
 */
import fs from "node:fs";

const trPatches = [
  // Tagline: middle-dot brand separator
  [
    '"tagline": "Tarifle, Make Eat"',
    '"tagline": "Tarifle · Make Eat"',
  ],
  // Recipe detail list colon
  [
    '"descriptionWithCuisine": "{cuisine} mutfağından {title} tarifi, {difficulty}, {time}, {servings} kişilik{calories}."',
    '"descriptionWithCuisine": "{cuisine} mutfağından {title} tarifi: {difficulty}, {time}, {servings} kişilik{calories}."',
  ],
  [
    '"descriptionNoCuisine": "{title} tarifi, {difficulty}, {time}, {servings} kişilik{calories}."',
    '"descriptionNoCuisine": "{title} tarifi: {difficulty}, {time}, {servings} kişilik{calories}."',
  ],
  // Legal aboutDescription
  [
    '"aboutDescription": "Tarifle hakkında bilgi, ekip, vizyon, iletişim."',
    '"aboutDescription": "Tarifle hakkında bilgi: ekip, vizyon, iletişim."',
  ],
  // Contact page meta
  [
    '"description": "Tarifle ekibine ulaş, geri bildirim, hata raporu, iş birliği veya KVKK veri talepleri."',
    '"description": "Tarifle ekibine ulaş: geri bildirim, hata raporu, iş birliği veya KVKK veri talepleri."',
  ],
  // OAuth subject
  [
    '"subject": "Tarifle, bu hesap Google ile bağlı"',
    '"subject": "Tarifle: bu hesap Google ile bağlı"',
  ],
  // Newsletter copy
  [
    '"intro": "Editörlerin bu hafta öne çıkardığı tarifler, yeni eklenenler ve öne çıkan mutfaklar, hepsi tek bakışta."',
    '"intro": "Editörlerin bu hafta öne çıkardığı tarifler, yeni eklenenler ve öne çıkan mutfaklar: hepsi tek bakışta."',
  ],
  [
    '"outro": "Aşağıdaki tariflerden birini dene, sofrada nasıl olduğunu yazabilirsin, tarif detayında uyarlama paylaşımı açık."',
    '"outro": "Aşağıdaki tariflerden birini dene, sofrada nasıl olduğunu yazabilirsin. Tarif detayında uyarlama paylaşımı açık."',
  ],
  // Admin analytics
  [
    '"subtitle": "Topluluk sağlığı göstergeleri, son 7 gün büyümesi, abone/yorum ivmeleri, popüler içerik."',
    '"subtitle": "Topluluk sağlığı göstergeleri: son 7 gün büyümesi, abone/yorum ivmeleri, popüler içerik."',
  ],
  // Short error
  [
    '"error_unknown": "Beklenmedik hata, tekrar dene."',
    '"error_unknown": "Beklenmedik hata. Tekrar dene."',
  ],
  // AI tips
  [
    '"Ufak ama etkili, film akşamı veya beklenmedik misafir."',
    '"Ufak ama etkili: film akşamı veya beklenmedik misafir."',
  ],
  [
    '"Editör favorisi, sade ama akılda kalıcı bir lezzet."',
    '"Editör favorisi: sade ama akılda kalıcı bir lezzet."',
  ],
  [
    '"Zirvedeki seçenek, tam uyum ve en güçlü sonuç."',
    '"Zirvedeki seçenek: tam uyum ve en güçlü sonuç."',
  ],
  [
    '"Pratik ve kolay, yorgun günlerin dostu."',
    '"Pratik ve kolay: yorgun günlerin dostu."',
  ],
  [
    '"20 dakikada sofrada, hızlı ama özensiz değil."',
    '"20 dakikada sofrada: hızlı ama özensiz değil."',
  ],
  [
    '"Hafif kalmak isteyenlere, tadından ödün vermeden."',
    '"Hafif kalmak isteyenlere: tadından ödün vermeden."',
  ],
  [
    '"Doyurucu ve besleyici, açlık bırakmaz."',
    '"Doyurucu ve besleyici: açlık bırakmaz."',
  ],
  [
    '"Biraz iddialı, vaktin varsa dene."',
    '"Biraz iddialı; vaktin varsa dene."',
  ],
  [
    '"En hızlı seçenek, {minutes} dakikada sofrada."',
    '"En hızlı seçenek: {minutes} dakikada sofrada."',
  ],
  [
    '"{ctx}{title} için hiçbir şey almana gerek yok, tam uyum. Altında birkaç yakın alternatif var."',
    '"{ctx}{title} için hiçbir şey almana gerek yok; tam uyum. Altında birkaç yakın alternatif var."',
  ],
  [
    '"{ctx}Tam eşleşme yok ama {title} için sadece {missing} eksik, market turu kısa."',
    '"{ctx}Tam eşleşme yok ama {title} için sadece {missing} eksik; market turu kısa."',
  ],
  [
    '"Neredeyse tam, sadece {missing} almak yeter."',
    '"Neredeyse tam: sadece {missing} almak yeter."',
  ],
  [
    '"Elinde her şey var, plan B olarak dursun."',
    '"Elinde her şey var; plan B olarak dursun."',
  ],
  [
    '"{ctx}Dolabını tıka basa doldurmuşsun, {count} tarif eşleşiyor. Başta {title} var."',
    '"{ctx}Dolabını tıka basa doldurmuşsun: {count} tarif eşleşiyor. Başta {title} var."',
  ],
  [
    '"{ctx}Elinde bu kadar malzeme varken {count} tarif çıkıyor, zirvede {title}."',
    '"{ctx}Elinde bu kadar malzeme varken {count} tarif çıkıyor; zirvede {title}."',
  ],
  [
    '"{ctx}Tek malzemeyle yola çıkmışsın, {title} en iyi seçenek."',
    '"{ctx}Tek malzemeyle yola çıkmışsın: {title} en iyi seçenek."',
  ],
  [
    '"{ctx}Hepsi temel malzeme, bir tane gerçek malzeme (domates, tavuk, mercimek gibi) ekle, öneriler anlam kazansın."',
    '"{ctx}Hepsi temel malzeme: bir tane gerçek malzeme (domates, tavuk, mercimek gibi) ekle, öneriler anlam kazansın."',
  ],
  [
    '"{ctx}Neyse ki {count} seçeneğin var, hepsi elindekiyle tamam."',
    '"{ctx}Neyse ki {count} seçeneğin var: hepsi elindekiyle tamam."',
  ],
  [
    '"Bir hafta sonu projesi gibi düşün, sofrada karşılığını alırsın."',
    '"Bir hafta sonu projesi gibi düşün; sofrada karşılığını alırsın."',
  ],
  [
    '"Kaç farklı yorumunun olduğunu gör, uyarlama sayfasına göz at."',
    '"Kaç farklı yorumunun olduğunu gör; uyarlama sayfasına göz at."',
  ],
  [
    '"paginationSingle": "{count} kayıt, tek sayfa."',
    '"paginationSingle": "{count} kayıt; tek sayfa."',
  ],
  [
    '"allWarning": "Tüm yorumlar yükleniyor, büyük liste olabilir."',
    '"allWarning": "Tüm yorumlar yükleniyor; büyük liste olabilir."',
  ],
  [
    '"selectedEmpty": "Seçim yok, satırları işaretle"',
    '"selectedEmpty": "Seçim yok. Satırları işaretle"',
  ],
  [
    '"toggleHelper": "Kapalıyken tarif sayfalarında ne upload form ne de grid render edilir. Mevcut fotoğraflar silinmez, flag tekrar açıldığında olduğu gibi görünür."',
    '"toggleHelper": "Kapalıyken tarif sayfalarında ne upload form ne de grid render edilir. Mevcut fotoğraflar silinmez; flag tekrar açıldığında olduğu gibi görünür."',
  ],
  [
    '"aiBannerDescription": "Dolabında ne varsa söyle, sana en uygun tarifleri ve eksiklerini gösterelim."',
    '"aiBannerDescription": "Dolabında ne varsa söyle; sana en uygun tarifleri ve eksiklerini gösterelim."',
  ],
  [
    '"sentHint": "Mail gelmediyse: adres bu sitede kayıtlı olmayabilir ya da hesabın Google ile bağlı olabilir, giriş sayfasından Google ile dene."',
    '"sentHint": "Mail gelmediyse: adres bu sitede kayıtlı olmayabilir ya da hesabın Google ile bağlı olabilir. Giriş sayfasından Google ile dene."',
  ],
  [
    '"subtitleInvalid": "Bu bağlantı çalışmıyor, aşağıdan yeni bir tane isteyebilirsin."',
    '"subtitleInvalid": "Bu bağlantı çalışmıyor. Aşağıdan yeni bir tane isteyebilirsin."',
  ],
];

const enPatches = [
  [
    '"tagline": "Tarifle, Make Eat"',
    '"tagline": "Tarifle · Make Eat"',
  ],
  [
    '"description": "What data we process, why, and under which legal basis (Turkish Data Protection Law, 6698)."',
    '"description": "What data we process, why, and under which legal basis (Turkish Data Protection Law, 6698)."',
  ],
];

function applyPatches(file, patches) {
  let content = fs.readFileSync(file, "utf8");
  let hit = 0, miss = 0;
  for (const [from, to] of patches) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      hit++;
    } else {
      miss++;
      console.log(`  MISS: ${from.slice(0, 80)}`);
    }
  }
  fs.writeFileSync(file, content);
  console.log(`${file}: ${hit}/${patches.length} applied, ${miss} missed`);
}

applyPatches("messages/tr.json", trPatches);
applyPatches("messages/en.json", enPatches);
