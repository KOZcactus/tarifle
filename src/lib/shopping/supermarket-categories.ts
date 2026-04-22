/**
 * Akilli alisveris listesi: ingredient name -> supermarket kategori
 * sınıflandırması. Rule-based, kural-tabanli AI hissi (zero LLM).
 *
 * Kategoriler Türk supermarket reyon dizilişine göre:
 *   1. Sebze & Meyve (manav)
 *   2. Et, Tavuk & Balık (kasap)
 *   3. Süt Ürünleri (soğutucu)
 *   4. Fırın & Hamur (ekmek + yufka reyonu)
 *   5. Bakliyat & Tahıllar (mercimek/pirinç/makarna reyonu)
 *   6. Yumurta & Konserve
 *   7. Baharat & Soslar (raf)
 *   8. Atıştırmalık & Tatlı (çikolata/bisküvi/kuruyemiş)
 *   9. Donmuş & Hazır
 *   10. İçecek (su/ayran/kola/kahve/alkol)
 *   11. Diğer (eşleşmeyen)
 *
 * Sınıflandırma stratejisi:
 *   - Tüm ingredient adı TR-asciifold + lowercase normalize
 *   - Sıralı keyword listesi içinde substring arama (ilk eşleşen kazanır)
 *   - Eşleşme yoksa "diğer" kategoriye düşer
 *
 * Sıralama önemi: özgül keyword (örn. "domates salcasi") "domates"ten
 * daha önce gelmeli ki yanlış kategoriye düşmesin. Bu dosyada özgül
 * öncelikli sıra korunur.
 */

export type SupermarketCategory =
  | "produce"
  | "meat"
  | "dairy"
  | "bakery"
  | "pantry"
  | "eggs_canned"
  | "spices_sauces"
  | "snacks_sweets"
  | "frozen_ready"
  | "beverages"
  | "other";

export const SUPERMARKET_CATEGORY_ORDER: SupermarketCategory[] = [
  "produce",
  "meat",
  "dairy",
  "bakery",
  "pantry",
  "eggs_canned",
  "spices_sauces",
  "snacks_sweets",
  "frozen_ready",
  "beverages",
  "other",
];

export const SUPERMARKET_CATEGORY_META: Record<
  SupermarketCategory,
  { emoji: string; sortOrder: number }
> = {
  produce: { emoji: "🥬", sortOrder: 1 },
  meat: { emoji: "🥩", sortOrder: 2 },
  dairy: { emoji: "🥛", sortOrder: 3 },
  bakery: { emoji: "🥖", sortOrder: 4 },
  pantry: { emoji: "🍚", sortOrder: 5 },
  eggs_canned: { emoji: "🥚", sortOrder: 6 },
  spices_sauces: { emoji: "🌶️", sortOrder: 7 },
  snacks_sweets: { emoji: "🍫", sortOrder: 8 },
  frozen_ready: { emoji: "❄️", sortOrder: 9 },
  beverages: { emoji: "🥤", sortOrder: 10 },
  other: { emoji: "📦", sortOrder: 11 },
};

/** TR diacritic strip + lowercase, classifier substring matching için. */
function normalize(name: string): string {
  return name
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u");
}

/**
 * Keyword -> kategori map. Sıra ÖNEMLİ: özgül (multi-word) eslesmeler
 * generic'lerden önce gelmeli. Aynı kategori içinde sıra önemsiz.
 *
 * Her satır: [keyword, category]. Keyword normalize edilmiş ingredient
 * adı içinde substring olarak aranır.
 */
const KEYWORD_RULES: ReadonlyArray<[string, SupermarketCategory]> = [
  // === ÖZGÜL ÖNCELIKLI (multi-word, kategori başka olur ===
  ["domates salcasi", "spices_sauces"],
  ["biber salcasi", "spices_sauces"],
  ["aci biber", "spices_sauces"],
  ["zeytin yagi", "spices_sauces"],
  ["ay cicek yagi", "spices_sauces"],
  ["aycicek yagi", "spices_sauces"],
  ["misir yagi", "spices_sauces"],
  ["sivi yag", "spices_sauces"],
  ["sade yag", "spices_sauces"],
  ["pul biber", "spices_sauces"],
  ["kara biber", "spices_sauces"],
  ["karabiber", "spices_sauces"],
  ["yenibahar", "spices_sauces"],
  ["soya sos", "spices_sauces"],
  ["bal", "snacks_sweets"], // honey, sweet section
  ["recel", "snacks_sweets"],
  ["pekmez", "snacks_sweets"],
  ["tahin", "snacks_sweets"],
  ["nutella", "snacks_sweets"],
  ["cikolata", "snacks_sweets"],
  ["kakao", "spices_sauces"],
  ["vanilya", "spices_sauces"],
  ["kabartma toz", "spices_sauces"],
  ["karbonat", "spices_sauces"],
  ["maya", "spices_sauces"],
  ["limon tuzu", "spices_sauces"],
  ["sirke", "spices_sauces"],
  ["nar eksi", "spices_sauces"],
  ["nar suyu", "beverages"],
  ["seker", "spices_sauces"], // shelf staple
  ["tuz", "spices_sauces"],
  ["tarcin", "spices_sauces"],
  ["kekik", "spices_sauces"],
  ["nane", "produce"], // mostly fresh
  ["kuru nane", "spices_sauces"],
  ["kimyon", "spices_sauces"],
  ["kis nis", "produce"],
  ["kisnis", "produce"],
  ["maydanoz", "produce"],
  ["dereotu", "produce"],
  ["roka", "produce"],
  ["fesleg en", "produce"],
  ["fesle gen", "produce"],
  ["feslegen", "produce"],
  ["safran", "spices_sauces"],
  ["sumak", "spices_sauces"],
  ["kapari", "eggs_canned"],

  // === MEAT, TAVUK, BALIK ===
  ["dana kiyma", "meat"],
  ["dana et", "meat"],
  ["kuzu kiyma", "meat"],
  ["kuzu et", "meat"],
  ["kuzu pirzola", "meat"],
  ["kuzu but", "meat"],
  ["bonfile", "meat"],
  ["antrikot", "meat"],
  ["tavuk gogus", "meat"],
  ["tavuk but", "meat"],
  ["tavuk kanat", "meat"],
  ["tavuk baget", "meat"],
  ["tavuk ciger", "meat"],
  ["tavuk", "meat"],
  ["hindi", "meat"],
  ["sucuk", "meat"],
  ["pastirma", "meat"],
  ["sosis", "meat"],
  ["sa lam", "meat"],
  ["salam", "meat"],
  ["jambon", "meat"],
  ["kiyma", "meat"],
  ["kuyruk yag", "meat"],
  ["dana", "meat"],
  ["kuzu", "meat"],
  ["et ", "meat"],
  ["balik", "meat"],
  ["balig", "meat"],
  ["somon", "meat"],
  ["levrek", "meat"],
  ["cipura", "meat"],
  ["uskumru", "meat"],
  ["hamsi", "meat"],
  ["midye", "meat"],
  ["karides", "meat"],
  ["kalamar", "meat"],
  ["ahtapot", "meat"],
  ["ton balig", "eggs_canned"], // canned tuna
  ["ton bal", "eggs_canned"],
  ["sardalya", "eggs_canned"],

  // === SUT URUNLERI (DAIRY) ===
  ["sut", "dairy"],
  ["yogurt", "dairy"],
  ["ayran", "beverages"],
  ["tereyag", "dairy"],
  ["tereya gi", "dairy"],
  ["beyaz peynir", "dairy"],
  ["kasar", "dairy"],
  ["kasar peynir", "dairy"],
  ["lor peynir", "dairy"],
  ["mozzarella", "dairy"],
  ["mozarella", "dairy"],
  ["parmesan", "dairy"],
  ["cheddar", "dairy"],
  ["feta", "dairy"],
  ["ricotta", "dairy"],
  ["mascarpone", "dairy"],
  ["lab ne", "dairy"],
  ["labne", "dairy"],
  ["kaymak", "dairy"],
  ["krema", "dairy"],
  ["sut kremasi", "dairy"],
  ["peynir", "dairy"],
  ["dondurma", "frozen_ready"],

  // === FIRIN, HAMUR (BAKERY) ===
  ["yufka", "bakery"],
  ["lavas", "bakery"],
  ["pide", "bakery"],
  ["bazlama", "bakery"],
  ["simit", "bakery"],
  ["ekmek", "bakery"],
  ["dilim ekmek", "bakery"],
  ["tost ekmek", "bakery"],
  ["sandvic", "bakery"],
  ["hamur", "bakery"],
  ["milf oy", "bakery"],
  ["milfoy", "bakery"],
  ["puf boregi", "bakery"],
  ["tortilla", "bakery"],
  ["naan", "bakery"],
  ["baget", "bakery"],
  ["focaccia", "bakery"],
  ["kruvasan", "bakery"],

  // === BAKLIYAT, TAHIL, MAKARNA (PANTRY) ===
  ["pirinc", "pantry"],
  ["pilavlik bulgur", "pantry"],
  ["bulgur", "pantry"],
  ["mercimek", "pantry"],
  ["nohut", "pantry"],
  ["fasulye", "pantry"],
  ["barbunya", "pantry"],
  ["bezelye", "pantry"],
  ["mais", "pantry"],
  ["misir", "pantry"],
  ["arpa", "pantry"],
  ["yulaf", "pantry"],
  ["kinoa", "pantry"],
  ["kuskus", "pantry"],
  ["bulgur asure lik", "pantry"],
  ["irmik", "pantry"],
  ["nisasta", "pantry"],
  ["un ", "pantry"],
  ["tam bug day", "pantry"],
  ["bug day", "pantry"],
  ["spaghetti", "pantry"],
  ["makarna", "pantry"],
  ["eriste", "pantry"],
  ["tarhana", "pantry"],

  // === YUMURTA, KONSERVE ===
  ["yumurta", "eggs_canned"],
  ["zeytin", "eggs_canned"],
  ["sirke yatan", "eggs_canned"],
  ["konserve", "eggs_canned"],
  ["sa la talik tursusu", "eggs_canned"],
  ["tursu", "eggs_canned"],
  ["mantar konserve", "eggs_canned"],
  ["mantar", "produce"], // fresh button

  // === ATISTIRMALIK, TATLI, KURUYEMIS ===
  ["fistik", "snacks_sweets"],
  ["yer fistig", "snacks_sweets"],
  ["antep fistig", "snacks_sweets"],
  ["ceviz", "snacks_sweets"],
  ["bademk irigi", "snacks_sweets"],
  ["badem", "snacks_sweets"],
  ["findik", "snacks_sweets"],
  ["kuru uzum", "snacks_sweets"],
  ["kuru kayisi", "snacks_sweets"],
  ["kuru incir", "snacks_sweets"],
  ["kuru meyve", "snacks_sweets"],
  ["bisku vi", "snacks_sweets"],
  ["biskuvi", "snacks_sweets"],
  ["kuru pasta", "snacks_sweets"],
  ["pasta krema", "snacks_sweets"],
  ["pudra seker", "spices_sauces"],
  ["esmer seker", "spices_sauces"],
  ["sus susu", "snacks_sweets"],
  ["jelibon", "snacks_sweets"],

  // === ICECEK ===
  ["su ", "beverages"],
  ["mineral su", "beverages"],
  ["soda ", "beverages"],
  ["kola", "beverages"],
  ["fanta", "beverages"],
  ["meyve suyu", "beverages"],
  ["portakal suyu", "beverages"],
  ["limonata", "beverages"],
  ["cay", "beverages"],
  ["kahve", "beverages"],
  ["espresso", "beverages"],
  ["nescafe", "beverages"],
  ["bira", "beverages"],
  ["sarap", "beverages"],
  ["votka", "beverages"],
  ["raki", "beverages"],
  ["whisky", "beverages"],
  ["whiskey", "beverages"],
  ["cin", "beverages"],
  ["gin", "beverages"],
  ["rom ", "beverages"],
  ["tequila", "beverages"],
  ["bourbon", "beverages"],
  ["prosecco", "beverages"],
  ["sampanya", "beverages"],
  ["vermut", "beverages"],
  ["aperol", "beverages"],
  ["campari", "beverages"],
  ["cachaca", "beverages"],

  // === DONMUS, HAZIR ===
  ["dondurulmus", "frozen_ready"],
  ["hazir", "frozen_ready"],
  ["mantarli pizza", "frozen_ready"],
  ["pizza", "frozen_ready"],

  // === SEBZE & MEYVE (PRODUCE) - genel kategori, sona ===
  ["domates", "produce"],
  ["sogan", "produce"],
  ["kuru sogan", "produce"],
  ["taze sogan", "produce"],
  ["sarimsak", "produce"],
  ["patates", "produce"],
  ["havuc", "produce"],
  ["salatalik", "produce"],
  ["biber", "produce"], // overlaps with karabiber, but karabiber matches first above
  ["sivri biber", "produce"],
  ["kapya biber", "produce"],
  ["dolma biber", "produce"],
  ["yesil biber", "produce"],
  ["kirmizi biber", "produce"],
  ["lahana", "produce"],
  ["pirasa", "produce"],
  ["enginar", "produce"],
  ["kabak", "produce"],
  ["patlican", "produce"],
  ["bakla", "produce"],
  ["bro koli", "produce"],
  ["brokoli", "produce"],
  ["karnabahar", "produce"],
  ["ispanak", "produce"],
  ["kereviz", "produce"],
  ["seftali", "produce"],
  ["elma", "produce"],
  ["armut", "produce"],
  ["muz", "produce"],
  ["limon", "produce"],
  ["portakal", "produce"],
  ["mandalina", "produce"],
  ["greyfurt", "produce"],
  ["uzum", "produce"],
  ["kavun", "produce"],
  ["karpuz", "produce"],
  ["cilek", "produce"],
  ["ahududu", "produce"],
  ["yaban mersini", "produce"],
  ["dut ", "produce"],
  ["nar ", "produce"],
  ["incir", "produce"],
  ["mango", "produce"],
  ["ananas", "produce"],
  ["avokado", "produce"],
  ["zencefil", "produce"],
  ["marul", "produce"],
  ["kiwi", "produce"],
  ["lime", "produce"],
  ["hindistan cevizi", "snacks_sweets"], // genelde rendelenmiş raf
  ["pandan", "spices_sauces"],
  ["limon kabug", "produce"],
  ["portakal kabug", "produce"],
];

/**
 * Ingredient name'ini supermarket kategorisine sinifla. Hicbir keyword
 * eslesmezse "other".
 */
export function classifyIngredient(name: string): SupermarketCategory {
  const norm = " " + normalize(name) + " ";
  for (const [keyword, category] of KEYWORD_RULES) {
    if (norm.includes(keyword)) return category;
  }
  return "other";
}
