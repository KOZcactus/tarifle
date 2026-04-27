#!/usr/bin/env node
/**
 * GPT 5 Pro audit (oturum 25): docs/seo-copy-v1.json icindeki Codex Mod C
 * teslim bug'ini temizle. 118 FAQ cevabinin sonunda tekrarli suni kapanis
 * cumlesi var:
 *
 *   "...yagi ayirabilir. Malzemenin durumuna bak Bu kucuk ek adim,
 *    sonucu daha tutarli ve daha rahat yonetilebilir kilar."
 *
 * Pattern: yarim cumle prefix (Servis / Malzemenin durumuna bak / Acele
 * etmemek, k / sonu / mu) + sabit "Bu kucuk ek adim..." kapanisi.
 *
 * Strateji: Regex ile noktadan sonraki tum yarim-cumle + suni kapanisi
 * sil. Onceki cumle dogru bir nokta ile sonlanmissa metin akisi temiz
 * kalir.
 *
 * Usage:
 *   node scripts/clean-landing-copy.mjs --dry-run     # dry, count only
 *   node scripts/clean-landing-copy.mjs --apply       # write
 */
import fs from "node:fs";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const file = path.resolve(process.cwd(), "docs/seo-copy-v1.json");
const before = fs.readFileSync(file, "utf-8");

// Regex: \s*[^.]*?Bu kucuk ek adim, sonucu daha tutarli ve daha rahat
// yonetilebilir kilar\.
// - \s* leading whitespace (varsa)
// - [^.]*? non-greedy, onceki cumlenin nokta sinirina kadar
// - Sabit kapanis cumlesi
const pattern =
  /\s*[^.]*?Bu küçük ek adım, sonucu daha tutarlı ve daha rahat yönetilebilir kılar\./g;

const matches = before.match(pattern) ?? [];
console.log(`Pass 1, "Bu kucuk ek adim" pattern: ${matches.length}`);

// Match samples (ilk 5)
matches.slice(0, 5).forEach((m, i) => {
  console.log(`  [${i + 1}] ${m.slice(0, 120)}...`);
});

let after = before.replace(pattern, "");

// Pass 2 (oturum 25): yalın yarım suffix'ler. Codex Mod C teslim ikinci
// kalıntı seti, "Bu kucuk ek adim" eki olmadan.
//   "...sonra. Acele etmemek, k"
//   "...etkisi onemlidir. Bu son kontrol, tarifin dengesini bozmadan
//    daha temiz bir sonu"
// JSON string ortasi (\" oncesi) match.
const pattern2 = / (Acele etmemek, k|Bu son kontrol, tarifin dengesini bozmadan daha temiz bir sonu)(?=")/g;
const matches2 = after.match(pattern2) ?? [];
console.log(`\nPass 2, yalın yarım suffix: ${matches2.length}`);
matches2.slice(0, 5).forEach((m, i) => {
  console.log(`  [${i + 1}] ${m.slice(0, 100)}`);
});
after = after.replace(pattern2, "");

// Pass 3 (oturum 25): intro içindeki jenerik dolgu cümleleri. Codex
// Mod C teslim 38 intro'nun ~36'sında aynı sabit kapanış cümlesi var,
// sayfa-spesifik bilgi taşımayan jenerik patternler. GPT 5 Pro
// "tekrar eden kalıp parçaları" gözlemi.
const FILLER_SENTENCES = [
  " Bu yüzden küçük görünen teknik kararlar, tabağın kimliğini ve kullanıcı deneyimini doğrudan etkiler.",
  " Ek olarak malzeme seçimi, servis bağlamı ve mevsim etkisi bu sayfanın yorumunu belirgin biçimde değiştirir.",
  " Böylece bu alan, yalnız tarif listesi değil; farklı sofra ihtiyaçlarına göre yön veren kullanışlı bir başvuru kaynağına dönüşür.",
  " Do Bu çerçeve, uygun ürün seçimi ve dikkatli etiket okumasıyla günlük mutfakta sürdürülebilir bir düzen kurmayı kolaylaştır.",
];
let pass3Count = 0;
for (const s of FILLER_SENTENCES) {
  const occ = after.split(s).length - 1;
  if (occ > 0) {
    console.log(`  [pass 3] "${s.trim().slice(0, 60)}..." x${occ}`);
    pass3Count += occ;
    after = after.split(s).join("");
  }
}
console.log(`\nPass 3, intro jenerik dolgu: ${pass3Count}`);

const remaining = after.match(pattern)?.length ?? 0;
const remaining2 = after.match(pattern2)?.length ?? 0;
console.log(`\nTemizlik sonrasi kalan, pass 1: ${remaining}, pass 2: ${remaining2}`);

if (APPLY) {
  fs.writeFileSync(file, after, "utf-8");
  console.log(`\n✅ docs/seo-copy-v1.json yazildi (${matches.length} artifact temizlendi)`);
} else {
  console.log(`\nDRY RUN. --apply ile yaz.`);
}
