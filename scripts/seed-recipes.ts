import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { validateSeedRecipes } from "../src/lib/seed/recipe-schema";

neonConfig.webSocketConstructor = ws;

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname2, "..", ".env") });

/**
 * DB init deferred into `main()` so this module can be imported for its
 * `recipes` export (e.g. by `scripts/validate-batch.ts`) without requiring
 * a live DATABASE_URL. Only the seed entrypoint needs the connection.
 */
function initPrisma(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL ortam değişkeni tanımlı değil!");
  }
  const adapter = new PrismaNeon({ connectionString: databaseUrl });
  return new PrismaClient({ adapter });
}

// ─── Tarif Verileri ──────────────────────────────────────
// Exported so `scripts/validate-batch.ts` can pre-flight this catalog
// without hitting the database. Codex only edits inside the array body
// (adding new entries before the closing `];`) — no other structural
// change is needed to maintain that workflow.
export const recipes = [
  // ── ET YEMEKLERİ ──
  {
    title: "Adana Kebap", slug: "adana-kebap", emoji: "🥩",
    description: "Acılı kıyma ile hazırlanan, mangalda pişirilen klasik Adana kebabı. Lavaş, közlenmiş domates ve biber ile servis edilir.",
    categorySlug: "et-yemekleri", type: "YEMEK" as const, difficulty: "HARD" as const,
    prepMinutes: 30, cookMinutes: 20, totalMinutes: 50, servingCount: 4,
    averageCalories: 380, protein: 28, carbs: 5, fat: 28, isFeatured: true,
    tipNote: "Kıymayı en az 15 dakika yoğurun, yapışkan hale gelsin. Şişe sararken elinizi ıslak tutun.",
    servingSuggestion: "Lavaş, közlenmiş domates, biber ve soğan salatası ile servis edin.",
    tags: ["misafir-sofrasi", "yuksek-protein"],
    ingredients: [
      { name: "Dana kıyma (yağlı)", amount: "500", unit: "gr", sortOrder: 1 },
      { name: "Kuyruk yağı", amount: "100", unit: "gr", sortOrder: 2 },
      { name: "Pul biber", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı", sortOrder: 4 },
      { name: "Karabiber", amount: "1", unit: "çay kaşığı", sortOrder: 5 },
      { name: "Kimyon", amount: "1", unit: "çay kaşığı", sortOrder: 6 },
      { name: "Sarımsak", amount: "4", unit: "diş", sortOrder: 7 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Kıyma, kuyruk yağı, pul biber, tuz, karabiber, kimyon ve ezilmiş sarımsağı derin bir kapta karıştırın." },
      { stepNumber: 2, instruction: "En az 15 dakika iyice yoğurun. Hamur gibi yapışkan bir kıvam almalı.", tip: "Yoğurma süresi lezzet için çok önemli.", timerSeconds: 900 },
      { stepNumber: 3, instruction: "Buzdolabında 1 saat dinlendirin.", timerSeconds: 3600 },
      { stepNumber: 4, instruction: "Islak ellerle geniş şişlere sarın." },
      { stepNumber: 5, instruction: "Mangal közünde veya ızgarada sık sık çevirerek 15-20 dakika pişirin.", timerSeconds: 1200 },
    ],
  },
  {
    title: "İskender Kebap", slug: "iskender-kebap", emoji: "🥩",
    description: "Bursa'nın meşhur İskender kebabı. İnce dilimlenmiş döner eti, tereyağlı domates sosu ve yoğurt ile servis edilir.",
    categorySlug: "et-yemekleri", type: "YEMEK" as const, difficulty: "HARD" as const,
    prepMinutes: 30, cookMinutes: 30, totalMinutes: 60, servingCount: 4,
    averageCalories: 520, protein: 32, carbs: 30, fat: 28, isFeatured: true,
    tipNote: "Tereyağını en son kızgın şekilde üzerine gezdirin, cızırdaması önemli.",
    servingSuggestion: "Közlenmiş yeşil biber ve domates ile servis edin.",
    tags: ["misafir-sofrasi", "yuksek-protein"],
    ingredients: [
      { name: "Kuzu eti (ince dilim)", amount: "600", unit: "gr", sortOrder: 1 },
      { name: "Pide ekmeği", amount: "2", unit: "adet", sortOrder: 2 },
      { name: "Süzme yoğurt", amount: "300", unit: "gr", sortOrder: 3 },
      { name: "Domates", amount: "4", unit: "adet", sortOrder: 4 },
      { name: "Tereyağı", amount: "80", unit: "gr", sortOrder: 5 },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 6 },
      { name: "Tuz, karabiber", amount: "1", unit: "tatlı kaşığı", sortOrder: 7 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Domatesleri rendeleyin. Bir tencerede salça ile birlikte kaynatın, tuz ekleyin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Pideleri küçük parçalara bölün, servis tabağına dizin." },
      { stepNumber: 3, instruction: "Et dilimlerini yüksek ateşte 2-3 dakika soteleyin." },
      { stepNumber: 4, instruction: "Pide üzerine eti yerleştirin, domates sosunu gezdirin." },
      { stepNumber: 5, instruction: "Yoğurdu yan tarafa koyun. Kızgın tereyağını üzerine gezdirin." },
    ],
  },
  {
    title: "Hünkar Beğendi", slug: "hunkar-begendi", emoji: "🍖",
    description: "Osmanlı saray mutfağının en zarif yemeği. Közlenmiş patlıcan püresi üzerine kuşbaşı et sosu.",
    categorySlug: "et-yemekleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
    prepMinutes: 20, cookMinutes: 50, totalMinutes: 70, servingCount: 4,
    averageCalories: 420, protein: 30, carbs: 18, fat: 25, isFeatured: false,
    tipNote: "Patlıcanları közlerken çok yumuşamasını bekleyin, beğendi için önemli.",
    servingSuggestion: null,
    tags: ["misafir-sofrasi"],
    ingredients: [
      { name: "Kuşbaşı kuzu eti", amount: "500", unit: "gr", sortOrder: 1, group: "Et sosu için" },
      { name: "Soğan", amount: "2", unit: "adet", sortOrder: 2, group: "Et sosu için" },
      { name: "Domates", amount: "2", unit: "adet", sortOrder: 3, group: "Et sosu için" },
      { name: "Patlıcan", amount: "4", unit: "adet", sortOrder: 4, group: "Beğendi için" },
      { name: "Tereyağı", amount: "50", unit: "gr", sortOrder: 5, group: "Beğendi için" },
      { name: "Un", amount: "2", unit: "yemek kaşığı", sortOrder: 6, group: "Beğendi için" },
      { name: "Süt", amount: "200", unit: "ml", sortOrder: 7, group: "Beğendi için" },
      { name: "Kaşar peyniri", amount: "50", unit: "gr", sortOrder: 8, group: "Beğendi için" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Kuşbaşı eti soğanla birlikte kavurun. Domates ekleyip kısık ateşte 40 dk pişirin.", timerSeconds: 2400 },
      { stepNumber: 2, instruction: "Patlıcanları közleyin veya fırında pişirin. Kabuklarını soyun, ezin." },
      { stepNumber: 3, instruction: "Tereyağında unu kavurun, sütü ekleyip beşamel yapın." },
      { stepNumber: 4, instruction: "Ezilmiş patlıcanları beşamele ekleyin, kaşar rendeleyin, karıştırın." },
      { stepNumber: 5, instruction: "Patlıcan beğendisini tabağa yayın, üzerine et sosunu koyun." },
    ],
  },
  {
    title: "Ali Nazik Kebabı", slug: "ali-nazik", emoji: "🍆",
    description: "Közlenmiş patlıcan ve yoğurt yatağı üzerine tereyağlı kuşbaşı et. Gaziantep'in gururu.",
    categorySlug: "et-yemekleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
    prepMinutes: 15, cookMinutes: 40, totalMinutes: 55, servingCount: 4,
    averageCalories: 360, protein: 26, carbs: 12, fat: 22, isFeatured: false,
    tipNote: "Patlıcanları közledikten sonra hemen soğuk suya atın, kabuğu kolay soyulur.",
    servingSuggestion: "Bulgur pilavı ile harika gider.",
    tags: ["misafir-sofrasi", "yuksek-protein"],
    ingredients: [
      { name: "Kuşbaşı kuzu eti", amount: "400", unit: "gr", sortOrder: 1, group: "Üstü için" },
      { name: "Tereyağı", amount: "40", unit: "gr", sortOrder: 2, group: "Üstü için" },
      { name: "Tuz, pul biber", amount: "1", unit: "tatlı kaşığı", sortOrder: 3, group: "Üstü için" },
      { name: "Patlıcan", amount: "3", unit: "adet", sortOrder: 4, group: "Tabanı için" },
      { name: "Süzme yoğurt", amount: "300", unit: "gr", sortOrder: 5, group: "Tabanı için" },
      { name: "Sarımsak", amount: "3", unit: "diş", sortOrder: 6, group: "Tabanı için" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Patlıcanları közleyin, kabuklarını soyun, ince ince doğrayın." },
      { stepNumber: 2, instruction: "Közlenmiş patlıcanı yoğurt ve ezilmiş sarımsakla karıştırın, tuzlayın." },
      { stepNumber: 3, instruction: "Kuşbaşı eti tereyağında sote yapın, yumuşayana kadar pişirin.", timerSeconds: 1800 },
      { stepNumber: 4, instruction: "Patlıcan-yoğurt karışımını tabağa yayın, üzerine eti koyun." },
      { stepNumber: 5, instruction: "Kızgın tereyağı ve pul biberi üzerine gezdirin." },
    ],
  },
  // ── TAVUK YEMEKLERİ ──
  {
    title: "Tavuk Şiş", slug: "tavuk-sis", emoji: "🍗",
    description: "Marine edilmiş tavuk göğsü parçalarının şişe dizilerek ızgarada pişirilmesi.",
    categorySlug: "tavuk-yemekleri", type: "YEMEK" as const, difficulty: "EASY" as const,
    prepMinutes: 15, cookMinutes: 20, totalMinutes: 35, servingCount: 4,
    averageCalories: 260, protein: 32, carbs: 4, fat: 12, isFeatured: false,
    tipNote: "Marine süresini en az 2 saat tutun, gece bırakırsanız daha lezzetli olur.",
    servingSuggestion: "Pilav ve ezme ile servis edin.",
    tags: ["yuksek-protein", "30-dakika-alti"],
    ingredients: [
      { name: "Tavuk göğsü", amount: "600", unit: "gr", sortOrder: 1 },
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Yoğurt", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Pul biber", amount: "1", unit: "tatlı kaşığı", sortOrder: 4 },
      { name: "Kekik", amount: "1", unit: "tatlı kaşığı", sortOrder: 5 },
      { name: "Tuz, karabiber", amount: "1", unit: "tatlı kaşığı", sortOrder: 6 },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı", sortOrder: 7 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Tavukları kuşbaşı doğrayın. Yoğurt, zeytinyağı, baharatlar ve limon suyu ile marine edin." },
      { stepNumber: 2, instruction: "Buzdolabında en az 2 saat dinlendirin.", timerSeconds: 7200 },
      { stepNumber: 3, instruction: "Şişlere dizin, ızgarada veya fırında 15-20 dakika pişirin.", timerSeconds: 1200 },
    ],
  },
  {
    title: "Fırında Tavuk Baget", slug: "firinda-tavuk-baget", emoji: "🍗",
    description: "Baharatlı marine ile hazırlanan, fırında çıtır çıtır pişen tavuk bagetleri.",
    categorySlug: "tavuk-yemekleri", type: "YEMEK" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 45, totalMinutes: 55, servingCount: 4,
    averageCalories: 310, protein: 28, carbs: 6, fat: 18, isFeatured: false,
    tipNote: "Son 10 dakika ızgara moduna alın, üstü kızarsın.",
    servingSuggestion: "Patates püresi veya salata ile.",
    tags: ["firinda", "cocuk-dostu", "pratik"],
    ingredients: [
      { name: "Tavuk baget", amount: "8", unit: "adet", sortOrder: 1 },
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Sarımsak tozu", amount: "1", unit: "tatlı kaşığı", sortOrder: 3 },
      { name: "Tatlı biber tozu", amount: "1", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Tuz, karabiber", amount: "1", unit: "tatlı kaşığı", sortOrder: 5 },
      { name: "Kekik", amount: "1", unit: "tatlı kaşığı", sortOrder: 6 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Fırını 200°C'ye ısıtın." },
      { stepNumber: 2, instruction: "Bagetleri zeytinyağı ve baharatlarla ovalayın." },
      { stepNumber: 3, instruction: "Fırın tepsisine dizin, 45 dakika pişirin.", timerSeconds: 2700 },
    ],
  },
  // ── SEBZE YEMEKLERİ ──
  {
    title: "Yaprak Sarma", slug: "yaprak-sarma", emoji: "🫒",
    description: "Zeytinyağlı yaprak sarma. İnce ince sarılmış asma yaprağı içinde pirinçli iç harç.",
    categorySlug: "sebze-yemekleri", type: "YEMEK" as const, difficulty: "HARD" as const,
    prepMinutes: 45, cookMinutes: 60, totalMinutes: 105, servingCount: 6,
    averageCalories: 180, protein: 4, carbs: 28, fat: 6, isFeatured: true,
    tipNote: "Yaprakları çok sıkı sarmayın, pirinç pişerken şişer.",
    servingSuggestion: "Limon dilimi ve yoğurt ile soğuk servis edin.",
    tags: ["vegan", "misafir-sofrasi", "yaz-tarifi"],
    ingredients: [
      { name: "Asma yaprağı", amount: "50", unit: "adet", sortOrder: 1 },
      { name: "Pirinç", amount: "1.5", unit: "su bardağı", sortOrder: 2 },
      { name: "Soğan", amount: "3", unit: "adet", sortOrder: 3 },
      { name: "Zeytinyağı", amount: "100", unit: "ml", sortOrder: 4 },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 5 },
      { name: "Nane", amount: "1", unit: "yemek kaşığı", sortOrder: 6 },
      { name: "Maydanoz", amount: "1", unit: "demet", sortOrder: 7 },
      { name: "Limon suyu", amount: "2", unit: "yemek kaşığı", sortOrder: 8 },
      { name: "Tuz, karabiber, yenibahar", amount: "1", unit: "tatlı kaşığı", sortOrder: 9 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Pirinci yıkayıp 30 dakika suda bekletin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Soğanları ince ince doğrayın. Zeytinyağında kavurun." },
      { stepNumber: 3, instruction: "Pirinci süzüp soğanlara ekleyin. Salça, baharat ve yeşillikleri ekleyin." },
      { stepNumber: 4, instruction: "Yaprakları açıp harcı koyun, sıkıca sarın." },
      { stepNumber: 5, instruction: "Tencereye dizin, üstünü geçecek kadar su ekleyin. Kısık ateşte 50-60 dk pişirin.", timerSeconds: 3600 },
      { stepNumber: 6, instruction: "Ocaktan alın, soğumaya bırakın. Soğuk servis edin." },
    ],
  },
  {
    title: "Kabak Mücveri", slug: "kabak-mucveri", emoji: "🥒",
    description: "Rendelenmiş kabak, yumurta ve unla hazırlanan çıtır mücverler.",
    categorySlug: "sebze-yemekleri", type: "YEMEK" as const, difficulty: "EASY" as const,
    prepMinutes: 15, cookMinutes: 15, totalMinutes: 30, servingCount: 4,
    averageCalories: 180, protein: 8, carbs: 18, fat: 8, isFeatured: false,
    tipNote: "Kabağın suyunu çok iyi sıkın, gevrek olması için şart.",
    servingSuggestion: "Haydari veya yoğurt ile servis edin.",
    tags: ["vejetaryen", "30-dakika-alti", "pratik"],
    ingredients: [
      { name: "Kabak", amount: "3", unit: "adet", sortOrder: 1 },
      { name: "Yumurta", amount: "2", unit: "adet", sortOrder: 2 },
      { name: "Un", amount: "4", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Dereotu", amount: "1", unit: "demet", sortOrder: 4 },
      { name: "Beyaz peynir", amount: "80", unit: "gr", sortOrder: 5 },
      { name: "Tuz, karabiber", amount: "1", unit: "tatlı kaşığı", sortOrder: 6 },
      { name: "Sıvı yağ", amount: "4", unit: "yemek kaşığı", sortOrder: 7 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Kabakları rendeleyin, tuzlayıp 10 dk bekletin, suyunu sıkın.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Yumurta, un, doğranmış dereotu ve ufalanmış peyniri ekleyip karıştırın." },
      { stepNumber: 3, instruction: "Kaşık kaşık alıp kızgın yağda her iki tarafını kızartın.", timerSeconds: 300 },
    ],
  },
  {
    title: "Patates Oturtma", slug: "patates-oturtma", emoji: "🥔",
    description: "Kızarmış patates ve köftelerin domates sosunda buluştuğu doyurucu bir yemek.",
    categorySlug: "sebze-yemekleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
    prepMinutes: 20, cookMinutes: 35, totalMinutes: 55, servingCount: 4,
    averageCalories: 350, protein: 18, carbs: 32, fat: 16, isFeatured: false,
    tipNote: null,
    servingSuggestion: "Pilav ile servis edin.",
    tags: ["cocuk-dostu", "butce-dostu"],
    ingredients: [
      { name: "Patates", amount: "4", unit: "adet", sortOrder: 1 },
      { name: "Kıyma", amount: "250", unit: "gr", sortOrder: 2 },
      { name: "Soğan", amount: "1", unit: "adet", sortOrder: 3 },
      { name: "Domates", amount: "3", unit: "adet", sortOrder: 4 },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 5 },
      { name: "Sıvı yağ", amount: "4", unit: "yemek kaşığı", sortOrder: 6 },
      { name: "Tuz, karabiber, kimyon", amount: "1", unit: "tatlı kaşığı", sortOrder: 7 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Patatesleri dilimleyip kızgın yağda kızartın." },
      { stepNumber: 2, instruction: "Kıymayı baharatlarla yoğurup küçük köfteler yapın." },
      { stepNumber: 3, instruction: "Domatesleri rendeleyin, salça ile sosunu hazırlayın." },
      { stepNumber: 4, instruction: "Tepsiye patatesleri dizin, aralarına köfteleri yerleştirin, sosu gezdirin." },
      { stepNumber: 5, instruction: "180°C fırında 30-35 dakika pişirin.", timerSeconds: 2100 },
    ],
  },
  // ── ÇORBALAR ──
  {
    title: "Ezogelin Çorbası", slug: "ezogelin-corbasi", emoji: "🍲",
    description: "Türk mutfağının en sevilen çorbası. Kırmızı mercimek, bulgur ve salça ile hazırlanır.",
    categorySlug: "corbalar", type: "CORBA" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 25, totalMinutes: 35, servingCount: 6,
    averageCalories: 145, protein: 8, carbs: 24, fat: 3, isFeatured: true,
    tipNote: "Çorbayı blenderdan geçirmeyin, dokusu öyle daha güzel.",
    servingSuggestion: "Limon ve kuru nane ile servis edin.",
    tags: ["vegan", "30-dakika-alti", "butce-dostu", "kis-tarifi"],
    ingredients: [
      { name: "Kırmızı mercimek", amount: "1", unit: "su bardağı", sortOrder: 1 },
      { name: "İnce bulgur", amount: "3", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Pirinç", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Soğan", amount: "1", unit: "adet", sortOrder: 4 },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 5 },
      { name: "Biber salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 6 },
      { name: "Tereyağı", amount: "2", unit: "yemek kaşığı", sortOrder: 7 },
      { name: "Nane, pul biber", amount: "1", unit: "tatlı kaşığı", sortOrder: 8 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Soğanı tereyağında kavurun. Salçaları ekleyip 1 dk kavurun." },
      { stepNumber: 2, instruction: "Yıkanmış mercimek, bulgur ve pirinci ekleyin." },
      { stepNumber: 3, instruction: "6 su bardağı su ekleyin, kaynayana kadar karıştırın." },
      { stepNumber: 4, instruction: "Kısık ateşte 25 dakika pişirin.", timerSeconds: 1500 },
      { stepNumber: 5, instruction: "Tuz, nane ve pul biber ile tatlandırın." },
    ],
  },
  {
    title: "Tarhana Çorbası", slug: "tarhana-corbasi", emoji: "🍲",
    description: "Kurutulmuş tarhana ile yapılan, kış sofralarının vazgeçilmez çorbası.",
    categorySlug: "corbalar", type: "CORBA" as const, difficulty: "EASY" as const,
    prepMinutes: 5, cookMinutes: 20, totalMinutes: 25, servingCount: 4,
    averageCalories: 120, protein: 5, carbs: 18, fat: 3, isFeatured: false,
    tipNote: "Tarhana topak yapmamak için soğuk suyla açın.",
    servingSuggestion: null,
    tags: ["pratik", "30-dakika-alti", "butce-dostu", "kis-tarifi"],
    ingredients: [
      { name: "Tarhana", amount: "4", unit: "yemek kaşığı", sortOrder: 1 },
      { name: "Su", amount: "5", unit: "su bardağı", sortOrder: 2 },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Domates salçası", amount: "1", unit: "tatlı kaşığı", sortOrder: 4 },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Tarhanayı 1 bardak soğuk suyla iyice çözün, topak kalmayacak şekilde karıştırın." },
      { stepNumber: 2, instruction: "Tencereye kalan suyu koyun, tarhana karışımını ekleyin." },
      { stepNumber: 3, instruction: "Sürekli karıştırarak kaynatın, 15-20 dk pişirin.", timerSeconds: 1200 },
      { stepNumber: 4, instruction: "Tereyağında salçayı kavurarak üzerine gezdirin." },
    ],
  },
  {
    title: "Yayla Çorbası", slug: "yayla-corbasi", emoji: "🍲",
    description: "Yoğurt bazlı geleneksel Türk çorbası. Pirinç ve nane ile zenginleştirilir.",
    categorySlug: "corbalar", type: "CORBA" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 25, totalMinutes: 35, servingCount: 4,
    averageCalories: 130, protein: 6, carbs: 16, fat: 4, isFeatured: false,
    tipNote: "Yoğurt karışımını çorbaya eklerken sürekli karıştırın, kesilmesin.",
    servingSuggestion: null,
    tags: ["vejetaryen", "30-dakika-alti", "kis-tarifi"],
    ingredients: [
      { name: "Yoğurt", amount: "2", unit: "su bardağı", sortOrder: 1 },
      { name: "Pirinç", amount: "3", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Yumurta", amount: "1", unit: "adet", sortOrder: 3 },
      { name: "Un", amount: "1", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Su", amount: "5", unit: "su bardağı", sortOrder: 5 },
      { name: "Tereyağı", amount: "1", unit: "yemek kaşığı", sortOrder: 6 },
      { name: "Kuru nane", amount: "1", unit: "tatlı kaşığı", sortOrder: 7 },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı", sortOrder: 8 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Pirinci yıkayıp 3 su bardağı suda haşlayın.", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Yoğurt, yumurta ve unu çırparak karıştırın." },
      { stepNumber: 3, instruction: "Yoğurt karışımına haşlama suyundan yavaş yavaş ekleyin (terbiye)." },
      { stepNumber: 4, instruction: "Pirinçli tencereye yoğurt karışımını ekleyin, karıştırarak kaynatın.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Tereyağında naneyi kavurun, üzerine gezdirin." },
    ],
  },
  // ── BAKLAGİL YEMEKLERİ ──
  {
    title: "Etli Nohut", slug: "etli-nohut", emoji: "🫘",
    description: "Kuşbaşı et ile pişirilen klasik nohut yemeği. Pilavın en iyi dostu.",
    categorySlug: "baklagil-yemekleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
    prepMinutes: 15, cookMinutes: 60, totalMinutes: 75, servingCount: 6,
    averageCalories: 320, protein: 22, carbs: 30, fat: 12, isFeatured: false,
    tipNote: "Nohutu bir gece önceden suda bekletin.",
    servingSuggestion: "Pirinç pilavı ve turşu ile servis edin.",
    tags: ["tek-tencere", "yuksek-protein", "kis-tarifi"],
    ingredients: [
      { name: "Nohut (haşlanmış)", amount: "2", unit: "su bardağı", sortOrder: 1 },
      { name: "Kuşbaşı dana eti", amount: "300", unit: "gr", sortOrder: 2 },
      { name: "Soğan", amount: "1", unit: "adet", sortOrder: 3 },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Tereyağı", amount: "2", unit: "yemek kaşığı", sortOrder: 5 },
      { name: "Tuz, karabiber", amount: "1", unit: "tatlı kaşığı", sortOrder: 6 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Eti tereyağında sote yapın, soğanı ekleyip kavurun." },
      { stepNumber: 2, instruction: "Salçayı ekleyin, 1-2 dakika kavurun." },
      { stepNumber: 3, instruction: "Haşlanmış nohutu ve 2 su bardağı su ekleyin." },
      { stepNumber: 4, instruction: "Kısık ateşte 45-60 dakika pişirin.", timerSeconds: 3600 },
    ],
  },
  {
    title: "Zeytinyağlı Fasulye", slug: "zeytinyagli-fasulye", emoji: "🫘",
    description: "Taze fasulyelerin zeytinyağlı, domatesli sofraya uygun şekilde hazırlanışı.",
    categorySlug: "baklagil-yemekleri", type: "YEMEK" as const, difficulty: "EASY" as const,
    prepMinutes: 15, cookMinutes: 35, totalMinutes: 50, servingCount: 4,
    averageCalories: 150, protein: 5, carbs: 20, fat: 6, isFeatured: false,
    tipNote: "Fasulyeleri çapraz kırın, daha lezzetli olur.",
    servingSuggestion: "Soğuk servis edin, yanında ekmek.",
    tags: ["vegan", "dusuk-kalorili", "yaz-tarifi"],
    ingredients: [
      { name: "Taze fasulye", amount: "500", unit: "gr", sortOrder: 1 },
      { name: "Soğan", amount: "1", unit: "adet", sortOrder: 2 },
      { name: "Domates", amount: "2", unit: "adet", sortOrder: 3 },
      { name: "Zeytinyağı", amount: "4", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Tuz, şeker", amount: "1", unit: "tatlı kaşığı", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Fasulyeleri temizleyin, ikiye kırın." },
      { stepNumber: 2, instruction: "Soğanı zeytinyağında kavurun, doğranmış domatesleri ekleyin." },
      { stepNumber: 3, instruction: "Fasulyeleri ekleyin, 1 su bardağı su, tuz ve bir tutam şeker ekleyin." },
      { stepNumber: 4, instruction: "Kısık ateşte 30-35 dakika pişirin.", timerSeconds: 2100 },
    ],
  },
  // ── SALATALAR ──
  {
    title: "Kısır", slug: "kisir", emoji: "🥗",
    description: "İnce bulgurdan yapılan, bol yeşillikli geleneksel Türk salatası.",
    categorySlug: "salatalar", type: "SALATA" as const, difficulty: "EASY" as const,
    prepMinutes: 20, cookMinutes: 0, totalMinutes: 20, servingCount: 6,
    averageCalories: 160, protein: 5, carbs: 26, fat: 5, isFeatured: false,
    tipNote: "Bulguru sıcak suyla ıslatın ama fazla su koymayın, kabarmasını bekleyin.",
    servingSuggestion: "Marul yaprakları üzerinde servis edin.",
    tags: ["vegan", "30-dakika-alti", "pratik", "yaz-tarifi"],
    ingredients: [
      { name: "İnce bulgur", amount: "2", unit: "su bardağı", sortOrder: 1 },
      { name: "Nar ekşisi", amount: "3", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Domates salçası", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Limon suyu", amount: "2", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Zeytinyağı", amount: "3", unit: "yemek kaşığı", sortOrder: 5 },
      { name: "Maydanoz", amount: "1", unit: "demet", sortOrder: 6 },
      { name: "Taze soğan", amount: "4", unit: "adet", sortOrder: 7 },
      { name: "Domates", amount: "2", unit: "adet", sortOrder: 8 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Bulgura sıcak su ekleyin, kabarmasını bekleyin (15 dk).", timerSeconds: 900 },
      { stepNumber: 2, instruction: "Salça, nar ekşisi, limon suyu ve zeytinyağını ekleyip karıştırın." },
      { stepNumber: 3, instruction: "İnce doğranmış yeşillikleri ve domatesi ekleyin." },
      { stepNumber: 4, instruction: "İyice harmanlayın, soğuk servis edin." },
    ],
  },
  {
    title: "Patlıcan Salatası", slug: "patlican-salatasi", emoji: "🍆",
    description: "Közlenmiş patlıcan ile hazırlanan ferahlatıcı meze salatası.",
    categorySlug: "salatalar", type: "SALATA" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 20, totalMinutes: 30, servingCount: 4,
    averageCalories: 90, protein: 2, carbs: 8, fat: 6, isFeatured: false,
    tipNote: null,
    servingSuggestion: "Ekmek ile meze olarak servis edin.",
    tags: ["vegan", "dusuk-kalorili", "30-dakika-alti", "yaz-tarifi"],
    ingredients: [
      { name: "Patlıcan", amount: "3", unit: "adet", sortOrder: 1 },
      { name: "Sarımsak", amount: "2", unit: "diş", sortOrder: 2 },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı", sortOrder: 5 },
      { name: "Maydanoz", amount: "3", unit: "dal", sortOrder: 6 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Patlıcanları ocak üzerinde veya fırında közleyin." },
      { stepNumber: 2, instruction: "Kabuklarını soyun, doğrayıp ezin." },
      { stepNumber: 3, instruction: "Sarımsak, zeytinyağı, limon suyu ve tuzu ekleyip karıştırın." },
      { stepNumber: 4, instruction: "Maydanoz ile süsleyip soğuk servis edin." },
    ],
  },
  // ── KAHVALTILIKLAR ──
  {
    title: "Sucuklu Yumurta", slug: "sucuklu-yumurta", emoji: "🍳",
    description: "Türk kahvaltısının vazgeçilmezi. Kızgın tavada sucuk ve yumurta buluşması.",
    categorySlug: "kahvaltiliklar", type: "KAHVALTI" as const, difficulty: "EASY" as const,
    prepMinutes: 5, cookMinutes: 8, totalMinutes: 13, servingCount: 2,
    averageCalories: 350, protein: 20, carbs: 2, fat: 28, isFeatured: false,
    tipNote: "Yumurtayı sucuğun yağı çıktıktan sonra kırın.",
    servingSuggestion: null,
    tags: ["pratik", "30-dakika-alti", "yuksek-protein"],
    ingredients: [
      { name: "Sucuk", amount: "100", unit: "gr", sortOrder: 1 },
      { name: "Yumurta", amount: "3", unit: "adet", sortOrder: 2 },
      { name: "Tuz, karabiber", amount: "1", unit: "çay kaşığı", sortOrder: 3 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Sucuğu ince dilimleyin, tavaya dizin." },
      { stepNumber: 2, instruction: "Orta ateşte kendi yağında kızartın.", timerSeconds: 180 },
      { stepNumber: 3, instruction: "Yumurtaları kırın, kapağını kapatıp 2-3 dakika pişirin.", timerSeconds: 180 },
    ],
  },
  {
    title: "Kaşarlı Tost", slug: "kasarli-tost", emoji: "🧀",
    description: "Erimiş kaşar peynirli, çıtır çıtır tost. Hızlı ve doyurucu.",
    categorySlug: "kahvaltiliklar", type: "KAHVALTI" as const, difficulty: "EASY" as const,
    prepMinutes: 3, cookMinutes: 5, totalMinutes: 8, servingCount: 1,
    averageCalories: 320, protein: 14, carbs: 30, fat: 16, isFeatured: false,
    tipNote: null,
    servingSuggestion: null,
    tags: ["pratik", "30-dakika-alti", "cocuk-dostu"],
    ingredients: [
      { name: "Tost ekmeği", amount: "2", unit: "dilim", sortOrder: 1 },
      { name: "Kaşar peyniri", amount: "60", unit: "gr", sortOrder: 2 },
      { name: "Tereyağı", amount: "1", unit: "tatlı kaşığı", sortOrder: 3 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Ekmeklerin arasına kaşar peyniri koyun." },
      { stepNumber: 2, instruction: "Tost makinesinde veya tavada her iki tarafı kızartın.", timerSeconds: 300 },
    ],
  },
  // ── HAMUR İŞLERİ ──
  {
    title: "Lahmacun", slug: "lahmacun", emoji: "🫓",
    description: "İnce hamurun üzerine baharatlı kıyma harcı sürülerek fırında pişirilen Türk pizzası.",
    categorySlug: "hamur-isleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
    prepMinutes: 30, cookMinutes: 15, totalMinutes: 45, servingCount: 6,
    averageCalories: 230, protein: 12, carbs: 28, fat: 8, isFeatured: true,
    tipNote: "Hamuru çok ince açın, kağıt gibi olmalı.",
    servingSuggestion: "Maydanoz, limon ve ayran ile servis edin.",
    tags: ["cocuk-dostu"],
    ingredients: [
      { name: "Un", amount: "3", unit: "su bardağı", sortOrder: 1, group: "Hamur için" },
      { name: "Su", amount: "1", unit: "su bardağı", sortOrder: 2, group: "Hamur için" },
      { name: "Maya", amount: "1", unit: "tatlı kaşığı", sortOrder: 3, group: "Hamur için" },
      { name: "Kıyma", amount: "300", unit: "gr", sortOrder: 4, group: "Harç için" },
      { name: "Soğan", amount: "2", unit: "adet", sortOrder: 5, group: "Harç için" },
      { name: "Domates", amount: "2", unit: "adet", sortOrder: 6, group: "Harç için" },
      { name: "Biber salçası", amount: "2", unit: "yemek kaşığı", sortOrder: 7, group: "Harç için" },
      { name: "Maydanoz", amount: "1", unit: "demet", sortOrder: 8, group: "Harç için" },
      { name: "Pul biber, tuz", amount: "1", unit: "tatlı kaşığı", sortOrder: 9, group: "Harç için" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Un, su, maya ve tuzu yoğurup hamur yapın. 30 dk dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Kıyma, ince doğranmış soğan, domates, salça, maydanoz ve baharatları karıştırarak harç hazırlayın." },
      { stepNumber: 3, instruction: "Hamuru bezlere ayırın, çok ince açın." },
      { stepNumber: 4, instruction: "Harcı ince bir tabaka halinde sürün." },
      { stepNumber: 5, instruction: "250°C fırında 8-10 dakika pişirin.", timerSeconds: 600 },
    ],
  },
  {
    title: "Su Böreği", slug: "su-boregi", emoji: "🥟",
    description: "Haşlanmış yufkaların peynir ve maydanoz ile katlanarak yapıldığı geleneksel börek.",
    categorySlug: "hamur-isleri", type: "YEMEK" as const, difficulty: "HARD" as const,
    prepMinutes: 40, cookMinutes: 40, totalMinutes: 80, servingCount: 8,
    averageCalories: 280, protein: 12, carbs: 26, fat: 14, isFeatured: false,
    tipNote: "Yufkaları kaynar suda çok fazla bekletmeyin, 10 saniye yeterli.",
    servingSuggestion: "Çay ile birlikte sıcak servis edin.",
    tags: ["misafir-sofrasi", "vejetaryen"],
    ingredients: [
      { name: "Börek yufkası", amount: "6", unit: "adet", sortOrder: 1 },
      { name: "Beyaz peynir", amount: "300", unit: "gr", sortOrder: 2 },
      { name: "Maydanoz", amount: "1", unit: "demet", sortOrder: 3 },
      { name: "Yumurta", amount: "3", unit: "adet", sortOrder: 4 },
      { name: "Süt", amount: "1", unit: "su bardağı", sortOrder: 5 },
      { name: "Sıvı yağ", amount: "0.5", unit: "su bardağı", sortOrder: 6 },
      { name: "Tereyağı", amount: "50", unit: "gr", sortOrder: 7 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Büyük bir tencerede su kaynatın. Yumurta, süt ve yağı çırpın." },
      { stepNumber: 2, instruction: "Yufkaları tek tek kaynar suda 10 sn haşlayıp soğuk suya atın." },
      { stepNumber: 3, instruction: "Tepsiye tereyağı sürün. Yufkaları araya peynir-maydanoz koyarak katman katman dizin." },
      { stepNumber: 4, instruction: "Her katmana yumurtalı karışımdan gezdirin." },
      { stepNumber: 5, instruction: "180°C fırında 35-40 dakika kızarana kadar pişirin.", timerSeconds: 2400 },
    ],
  },
  {
    title: "Mantı", slug: "manti", emoji: "🥟",
    description: "Kayseri'nin meşhur mantısı. Küçücük hamur kesecikleri içinde kıyma, yoğurt ve tereyağlı sos ile.",
    categorySlug: "hamur-isleri", type: "YEMEK" as const, difficulty: "HARD" as const,
    prepMinutes: 60, cookMinutes: 20, totalMinutes: 80, servingCount: 4,
    averageCalories: 380, protein: 18, carbs: 42, fat: 14, isFeatured: true,
    tipNote: "Mantılar ne kadar küçük olursa o kadar makbul. Sabırlı olun!",
    servingSuggestion: "Sarımsaklı yoğurt ve pul biberli tereyağı ile servis edin.",
    tags: ["misafir-sofrasi"],
    ingredients: [
      { name: "Un", amount: "3", unit: "su bardağı", sortOrder: 1, group: "Hamur için" },
      { name: "Yumurta", amount: "1", unit: "adet", sortOrder: 2, group: "Hamur için" },
      { name: "Su", amount: "0.5", unit: "su bardağı", sortOrder: 3, group: "Hamur için" },
      { name: "Kıyma", amount: "200", unit: "gr", sortOrder: 4, group: "İç harç için" },
      { name: "Soğan (rendelenmiş)", amount: "1", unit: "adet", sortOrder: 5, group: "İç harç için" },
      { name: "Yoğurt", amount: "300", unit: "gr", sortOrder: 6, group: "Sos için" },
      { name: "Sarımsak", amount: "3", unit: "diş", sortOrder: 7, group: "Sos için" },
      { name: "Tereyağı", amount: "50", unit: "gr", sortOrder: 8, group: "Sos için" },
      { name: "Pul biber", amount: "1", unit: "yemek kaşığı", sortOrder: 9, group: "Sos için" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Un, yumurta, su ve tuzla sert bir hamur yoğurun. 30 dk dinlendirin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Kıyma, rendelenmiş soğan, tuz ve karabiberi karıştırarak iç harç yapın." },
      { stepNumber: 3, instruction: "Hamuru ince açıp küçük kareler kesin, ortasına harç koyup kapatın." },
      { stepNumber: 4, instruction: "Kaynar tuzlu suda 15-20 dakika haşlayın.", timerSeconds: 1200 },
      { stepNumber: 5, instruction: "Sarımsaklı yoğurdu hazırlayın. Tereyağında pul biberi kızdırın." },
      { stepNumber: 6, instruction: "Mantıları tabağa alın, yoğurt ve pul biberli tereyağını gezdirin." },
    ],
  },
  // ── TATLILAR ──
  {
    title: "Künefe", slug: "kunefe", emoji: "🍰",
    description: "Tel kadayıf arasına peynir konularak tereyağında pişirilen, şerbetli sıcak tatlı.",
    categorySlug: "tatlilar", type: "TATLI" as const, difficulty: "MEDIUM" as const,
    prepMinutes: 15, cookMinutes: 20, totalMinutes: 35, servingCount: 4,
    averageCalories: 450, protein: 10, carbs: 55, fat: 22, isFeatured: false,
    tipNote: "Peyniri tuzdan arındırmak için bir gece suda bekletin.",
    servingSuggestion: "Antep fıstığı ile sıcak servis edin.",
    tags: ["misafir-sofrasi"],
    ingredients: [
      { name: "Tel kadayıf", amount: "250", unit: "gr", sortOrder: 1, group: "Künefe için" },
      { name: "Künefe peyniri", amount: "200", unit: "gr", sortOrder: 2, group: "Künefe için" },
      { name: "Tereyağı (eritilmiş)", amount: "100", unit: "gr", sortOrder: 3, group: "Künefe için" },
      { name: "Antep fıstığı", amount: "2", unit: "yemek kaşığı", sortOrder: 4, group: "Künefe için" },
      { name: "Şeker", amount: "2", unit: "su bardağı", sortOrder: 5, group: "Şerbet için" },
      { name: "Su", amount: "1.5", unit: "su bardağı", sortOrder: 6, group: "Şerbet için" },
      { name: "Limon suyu", amount: "1", unit: "tatlı kaşığı", sortOrder: 7, group: "Şerbet için" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Şerbeti hazırlayın: şeker ve suyu kaynatın, limon ekleyin, soğumaya bırakın.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Tel kadayıfı ince ince didikleyin, eritilmiş tereyağı ile karıştırın." },
      { stepNumber: 3, instruction: "Yarısını tepsiye basın, peyniri yayın, kalan kadayıfı üstüne koyun." },
      { stepNumber: 4, instruction: "Orta ateşte her iki tarafını kızartın.", timerSeconds: 600 },
      { stepNumber: 5, instruction: "Soğuk şerbeti sıcak künefeye gezdirin. Fıstık serpin." },
    ],
  },
  {
    title: "Sütlaç", slug: "sutlac", emoji: "🍮",
    description: "Fırında kızartılmış karamelize yüzüyle klasik Türk sütlacı.",
    categorySlug: "tatlilar", type: "TATLI" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 30, totalMinutes: 40, servingCount: 6,
    averageCalories: 220, protein: 6, carbs: 38, fat: 5, isFeatured: false,
    tipNote: "Pirinci önceden haşlayıp süte ekleyin, daha pürüzsüz olur.",
    servingSuggestion: "Soğuk servis edin, tarçın serpebilirsiniz.",
    tags: ["vejetaryen", "cocuk-dostu"],
    ingredients: [
      { name: "Süt", amount: "1", unit: "litre", sortOrder: 1 },
      { name: "Pirinç", amount: "3", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Şeker", amount: "4", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Nişasta", amount: "2", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Vanilya", amount: "1", unit: "paket", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Pirinci yıkayıp 1 su bardağı suda haşlayın.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Sütü kaynatın, haşlanmış pirinci ekleyin." },
      { stepNumber: 3, instruction: "Şeker ve soğuk sütte çözülmüş nişastayı ekleyin, karıştırarak koyulaştırın.", timerSeconds: 900 },
      { stepNumber: 4, instruction: "Kâselere paylaştırın, 200°C fırında üstü kızarana kadar pişirin.", timerSeconds: 900 },
    ],
  },
  {
    title: "Revani", slug: "revani", emoji: "🍰",
    description: "İrmikli, şerbetli klasik Türk tatlısı. Hafif ve ıslak dokusuyla sevilir.",
    categorySlug: "tatlilar", type: "TATLI" as const, difficulty: "EASY" as const,
    prepMinutes: 15, cookMinutes: 30, totalMinutes: 45, servingCount: 8,
    averageCalories: 280, protein: 4, carbs: 50, fat: 8, isFeatured: false,
    tipNote: "Kek sıcakken soğuk şerbet dök. Kek soğumuşsa sıcak şerbet kullan. İkisi birden sıcak olursa kek hamur gibi kalır.",
    servingSuggestion: "Hindistan cevizi ile süsleyerek servis edin.",
    tags: ["pratik", "misafir-sofrasi"],
    ingredients: [
      { name: "İrmik", amount: "1", unit: "su bardağı", sortOrder: 1, group: "Hamur için" },
      { name: "Un", amount: "1", unit: "su bardağı", sortOrder: 2, group: "Hamur için" },
      { name: "Şeker", amount: "1", unit: "su bardağı", sortOrder: 3, group: "Hamur için" },
      { name: "Yumurta", amount: "3", unit: "adet", sortOrder: 4, group: "Hamur için" },
      { name: "Yoğurt", amount: "1", unit: "su bardağı", sortOrder: 5, group: "Hamur için" },
      { name: "Kabartma tozu", amount: "1", unit: "paket", sortOrder: 6, group: "Hamur için" },
      { name: "Şeker", amount: "2", unit: "su bardağı", sortOrder: 7, group: "Şerbet için" },
      { name: "Su", amount: "2.5", unit: "su bardağı", sortOrder: 8, group: "Şerbet için" },
      { name: "Limon suyu", amount: "1", unit: "yemek kaşığı", sortOrder: 9, group: "Şerbet için" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Şerbeti hazırlayın: şeker ve suyu kaynatın, limon ekleyin, soğutun.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Yumurta ve şekeri çırpın. Yoğurt, irmik, un ve kabartma tozunu ekleyin." },
      { stepNumber: 3, instruction: "Yağlanmış tepsiye dökün, 180°C fırında 25-30 dk pişirin.", timerSeconds: 1800 },
      { stepNumber: 4, instruction: "Sıcak kekin üzerine soğuk şerbeti gezdirin." },
    ],
  },
  // ── APERATİFLER ──
  {
    title: "Çiğ Köfte", slug: "cig-kofte", emoji: "🧆",
    description: "Etsiz, ince bulgurdan yapılan acılı ve baharatlı çiğ köfte.",
    categorySlug: "aperatifler", type: "APERATIF" as const, difficulty: "MEDIUM" as const,
    prepMinutes: 30, cookMinutes: 0, totalMinutes: 30, servingCount: 6,
    averageCalories: 140, protein: 4, carbs: 26, fat: 3, isFeatured: false,
    tipNote: "Çok yoğurun! En az 20 dakika yoğurma şart.",
    servingSuggestion: "Marul yaprağı ve limon ile dürüm yaparak servis edin.",
    tags: ["vegan", "30-dakika-alti", "yaz-tarifi"],
    ingredients: [
      { name: "İnce bulgur", amount: "2", unit: "su bardağı", sortOrder: 1 },
      { name: "İsot (pul biber)", amount: "3", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Domates salçası", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Biber salçası", amount: "2", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Soğan (rendelenmiş)", amount: "1", unit: "adet", sortOrder: 5 },
      { name: "Taze soğan, maydanoz", amount: "1", unit: "demet", sortOrder: 6 },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı", sortOrder: 7 },
      { name: "Tuz, kimyon", amount: "1", unit: "tatlı kaşığı", sortOrder: 8 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Bulgura kaynar su ekleyin, kabarmasını bekleyin.", timerSeconds: 600 },
      { stepNumber: 2, instruction: "Salçaları, rendelenmiş soğanı, baharatları ekleyin." },
      { stepNumber: 3, instruction: "En az 20 dakika iyice yoğurun.", timerSeconds: 1200 },
      { stepNumber: 4, instruction: "Doğranmış yeşillikleri ekleyin, şekil verin." },
    ],
  },
  {
    title: "Acılı Ezme", slug: "acili-ezme", emoji: "🌶️",
    description: "Güneydoğu mutfağının vazgeçilmez mezesi. Bol acılı, soğanlı ve domatesli.",
    categorySlug: "aperatifler", type: "APERATIF" as const, difficulty: "EASY" as const,
    prepMinutes: 15, cookMinutes: 0, totalMinutes: 15, servingCount: 4,
    averageCalories: 60, protein: 1, carbs: 8, fat: 3, isFeatured: false,
    tipNote: null,
    servingSuggestion: "Lavaş veya pide ile servis edin.",
    tags: ["vegan", "30-dakika-alti", "dusuk-kalorili", "pratik"],
    ingredients: [
      { name: "Domates", amount: "3", unit: "adet", sortOrder: 1 },
      { name: "Sivri biber", amount: "3", unit: "adet", sortOrder: 2 },
      { name: "Soğan", amount: "1", unit: "adet", sortOrder: 3 },
      { name: "Maydanoz", amount: "0.5", unit: "demet", sortOrder: 4 },
      { name: "Nar ekşisi", amount: "2", unit: "yemek kaşığı", sortOrder: 5 },
      { name: "Pul biber, tuz", amount: "1", unit: "tatlı kaşığı", sortOrder: 6 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Tüm malzemeleri çok ince kıyın (zırh bıçağıyla)." },
      { stepNumber: 2, instruction: "Bir kâsede karıştırın, nar ekşisi ve pul biberi ekleyin." },
      { stepNumber: 3, instruction: "10 dakika dinlendirip servis edin." },
    ],
  },
  // ── MAKARNA & PİLAV ──
  {
    title: "Tereyağlı Pirinç Pilavı", slug: "pirinc-pilavi", emoji: "🍚",
    description: "Tane tane, tereyağlı klasik pirinç pilavı. Her yemeğin yanına yakışır.",
    categorySlug: "makarna-pilav", type: "YEMEK" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 20, totalMinutes: 30, servingCount: 4,
    averageCalories: 210, protein: 4, carbs: 38, fat: 5, isFeatured: false,
    tipNote: "Pirinci bol suda yıkayıp 30 dk sıcak tuzlu suda bekletin.",
    servingSuggestion: null,
    tags: ["pratik", "30-dakika-alti", "vejetaryen"],
    ingredients: [
      { name: "Pirinç", amount: "2", unit: "su bardağı", sortOrder: 1 },
      { name: "Su", amount: "3", unit: "su bardağı", sortOrder: 2 },
      { name: "Tereyağı", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Şehriye", amount: "1", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Pirinci yıkayıp sıcak tuzlu suda 30 dk bekletin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Tereyağında şehriyeyi pembeleşene kadar kavurun." },
      { stepNumber: 3, instruction: "Süzülmüş pirinci ekleyip 2 dk kavurun." },
      { stepNumber: 4, instruction: "Sıcak suyu ekleyin, kaynayınca kısık ateşte 15 dk pişirin.", timerSeconds: 900 },
      { stepNumber: 5, instruction: "Altına havlu koyup 10 dk dinlendirin.", timerSeconds: 600 },
    ],
  },
  {
    title: "Bulgur Pilavı", slug: "bulgur-pilavi", emoji: "🍚",
    description: "Domatesli, biberli klasik bulgur pilavı. Pratik ve doyurucu.",
    categorySlug: "makarna-pilav", type: "YEMEK" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 20, totalMinutes: 30, servingCount: 4,
    averageCalories: 180, protein: 6, carbs: 34, fat: 3, isFeatured: false,
    tipNote: null,
    servingSuggestion: "Cacık ile servis edin.",
    tags: ["vegan", "30-dakika-alti", "butce-dostu"],
    ingredients: [
      { name: "Bulgur (pilavlık)", amount: "2", unit: "su bardağı", sortOrder: 1 },
      { name: "Soğan", amount: "1", unit: "adet", sortOrder: 2 },
      { name: "Domates salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Biber salçası", amount: "1", unit: "tatlı kaşığı", sortOrder: 4 },
      { name: "Sıvı yağ", amount: "2", unit: "yemek kaşığı", sortOrder: 5 },
      { name: "Su", amount: "3", unit: "su bardağı", sortOrder: 6 },
      { name: "Tuz", amount: "1", unit: "tatlı kaşığı", sortOrder: 7 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Soğanı yağda kavurun, salçaları ekleyip 1 dk kavurun." },
      { stepNumber: 2, instruction: "Bulguru ekleyin, karıştırın." },
      { stepNumber: 3, instruction: "Sıcak suyu ekleyin, kaynayınca kısık ateşte 15 dk pişirin.", timerSeconds: 900 },
      { stepNumber: 4, instruction: "Altına havlu koyup 10 dk dinlendirin.", timerSeconds: 600 },
    ],
  },
  // ── SOSLAR & DİPLER ──
  {
    title: "Haydari", slug: "haydari", emoji: "🫙",
    description: "Süzme yoğurt, sarımsak ve nane ile yapılan meşhur Türk mezesi.",
    categorySlug: "soslar-dippler", type: "SOS" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 0, totalMinutes: 10, servingCount: 4,
    averageCalories: 80, protein: 5, carbs: 4, fat: 5, isFeatured: false,
    tipNote: null,
    servingSuggestion: "Ekmek veya pide ile.",
    tags: ["vejetaryen", "30-dakika-alti", "pratik", "dusuk-kalorili"],
    ingredients: [
      { name: "Süzme yoğurt", amount: "400", unit: "gr", sortOrder: 1 },
      { name: "Beyaz peynir", amount: "80", unit: "gr", sortOrder: 2 },
      { name: "Sarımsak", amount: "2", unit: "diş", sortOrder: 3 },
      { name: "Kuru nane", amount: "1", unit: "tatlı kaşığı", sortOrder: 4 },
      { name: "Zeytinyağı", amount: "1", unit: "yemek kaşığı", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Süzme yoğurdu kâseye alın." },
      { stepNumber: 2, instruction: "Beyaz peyniri ufalayıp ekleyin, sarımsağı ezin." },
      { stepNumber: 3, instruction: "Nane ve zeytinyağını ekleyip iyice karıştırın." },
    ],
  },
  {
    title: "Atom Sos", slug: "atom-sos", emoji: "🌶️",
    description: "Yoğurt, mayonez ve sarımsaklı acı sos. Döner ve kebapların vazgeçilmezi.",
    categorySlug: "soslar-dippler", type: "SOS" as const, difficulty: "EASY" as const,
    prepMinutes: 5, cookMinutes: 0, totalMinutes: 5, servingCount: 4,
    averageCalories: 120, protein: 2, carbs: 3, fat: 11, isFeatured: false,
    tipNote: null,
    servingSuggestion: null,
    tags: ["30-dakika-alti", "pratik"],
    ingredients: [
      { name: "Yoğurt", amount: "3", unit: "yemek kaşığı", sortOrder: 1 },
      { name: "Mayonez", amount: "3", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Sarımsak", amount: "2", unit: "diş", sortOrder: 3 },
      { name: "Pul biber", amount: "1", unit: "tatlı kaşığı", sortOrder: 4 },
      { name: "Hardal", amount: "1", unit: "tatlı kaşığı", sortOrder: 5 },
      { name: "Tuz", amount: "1", unit: "çay kaşığı", sortOrder: 6 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Tüm malzemeleri kâsede karıştırın." },
      { stepNumber: 2, instruction: "Sarımsağı ezin, pul biber ve hardalla harmanlayın." },
    ],
  },
  // ── ATISTIRMALIKLAR ──
  {
    title: "Çıtır Patates", slug: "citir-patates", emoji: "🍟",
    description: "Fırında çıtır çıtır pişen baharatlı patates dilimleri.",
    categorySlug: "atistirmaliklar", type: "ATISTIRMALIK" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 30, totalMinutes: 40, servingCount: 4,
    averageCalories: 200, protein: 3, carbs: 32, fat: 7, isFeatured: false,
    tipNote: "Patatesleri 30 dk suda bekletip kurulamak çıtırlık sırrı.",
    servingSuggestion: null,
    tags: ["vejetaryen", "firinda", "cocuk-dostu"],
    ingredients: [
      { name: "Patates", amount: "4", unit: "adet", sortOrder: 1 },
      { name: "Zeytinyağı", amount: "2", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Tuz, karabiber", amount: "1", unit: "tatlı kaşığı", sortOrder: 3 },
      { name: "Kekik", amount: "1", unit: "tatlı kaşığı", sortOrder: 4 },
      { name: "Sarımsak tozu", amount: "0.5", unit: "tatlı kaşığı", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Patatesleri yıkayıp dilimleyin. 30 dk soğuk suda bekletin.", timerSeconds: 1800 },
      { stepNumber: 2, instruction: "Kurulamayıp zeytinyağı ve baharatlarla karıştırın." },
      { stepNumber: 3, instruction: "Fırın tepsisine tek sıra dizin, 220°C'de 25-30 dk pişirin.", timerSeconds: 1800 },
    ],
  },
  // ── İÇECEKLER ──
  {
    title: "Sahlep", slug: "sahlep", emoji: "☕",
    description: "Sıcak süt ve sahlep tozu ile yapılan geleneksel kış içeceği. Tarçın ile servis edilir.",
    categorySlug: "kahve-sicak-icecekler", type: "ICECEK" as const, difficulty: "EASY" as const,
    prepMinutes: 5, cookMinutes: 10, totalMinutes: 15, servingCount: 2,
    averageCalories: 180, protein: 6, carbs: 28, fat: 5, isFeatured: false,
    tipNote: "Sürekli karıştırın, topak olmasın.",
    servingSuggestion: "Tarçın serperek sıcak servis edin.",
    tags: ["vejetaryen", "30-dakika-alti", "kis-tarifi"],
    ingredients: [
      { name: "Süt", amount: "500", unit: "ml", sortOrder: 1 },
      { name: "Sahlep tozu", amount: "2", unit: "yemek kaşığı", sortOrder: 2 },
      { name: "Şeker", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Tarçın", amount: "1", unit: "çay kaşığı", sortOrder: 4 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Soğuk sütte sahlep tozunu ve şekeri çözün." },
      { stepNumber: 2, instruction: "Orta ateşte sürekli karıştırarak kaynatın.", timerSeconds: 600 },
      { stepNumber: 3, instruction: "Koyulaşınca bardaklara paylaştırın, tarçın serpin." },
    ],
  },
  {
    title: "Oralet", slug: "oralet", emoji: "🍊",
    description: "Portakal tozuyla hazırlanan nostaljik sıcak içecek.",
    categorySlug: "kahve-sicak-icecekler", type: "ICECEK" as const, difficulty: "EASY" as const,
    prepMinutes: 2, cookMinutes: 3, totalMinutes: 5, servingCount: 1,
    averageCalories: 80, protein: 0, carbs: 20, fat: 0, isFeatured: false,
    tipNote: null,
    servingSuggestion: null,
    tags: ["pratik", "30-dakika-alti", "cocuk-dostu", "kis-tarifi"],
    ingredients: [
      { name: "Oralet tozu", amount: "2", unit: "yemek kaşığı", sortOrder: 1 },
      { name: "Sıcak su", amount: "200", unit: "ml", sortOrder: 2 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Sıcak suya oralet tozunu ekleyip karıştırın." },
    ],
  },
  // ── KOKTEYLLER ──
  {
    title: "Margarita", slug: "margarita", emoji: "🍸",
    description: "Tekila, lime suyu ve triple sec ile hazırlanan klasik kokteyl.",
    categorySlug: "kokteyller", type: "KOKTEYL" as const, difficulty: "EASY" as const,
    prepMinutes: 5, cookMinutes: 0, totalMinutes: 5, servingCount: 1,
    averageCalories: 200, protein: 0, carbs: 12, fat: 0, isFeatured: false,
    tipNote: "Bardak kenarına tuz çekmek için lime dilimi kullanın.",
    servingSuggestion: null,
    tags: ["alkollu", "30-dakika-alti", "yaz-tarifi"],
    ingredients: [
      { name: "Tekila", amount: "50", unit: "ml", sortOrder: 1 },
      { name: "Lime suyu", amount: "25", unit: "ml", sortOrder: 2 },
      { name: "Triple sec", amount: "20", unit: "ml", sortOrder: 3 },
      { name: "Buz", amount: "5", unit: "adet", sortOrder: 4 },
      { name: "Tuz (kenar için)", amount: "1", unit: "çay kaşığı", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Bardak kenarını lime ile ıslatıp tuza bastırın." },
      { stepNumber: 2, instruction: "Shaker'a tekila, lime suyu, triple sec ve buz koyun." },
      { stepNumber: 3, instruction: "10-15 saniye sert sallayın, süzüp bardağa dökün." },
    ],
  },
  {
    title: "Aperol Spritz", slug: "aperol-spritz", emoji: "🍹",
    description: "İtalyan aperitif klasiği. Aperol, prosecco ve soda ile ferahlatıcı kokteyl.",
    categorySlug: "kokteyller", type: "KOKTEYL" as const, difficulty: "EASY" as const,
    prepMinutes: 3, cookMinutes: 0, totalMinutes: 3, servingCount: 1,
    averageCalories: 170, protein: 0, carbs: 15, fat: 0, isFeatured: true,
    tipNote: null,
    servingSuggestion: "Portakal dilimi ile süsleyin.",
    tags: ["alkollu", "30-dakika-alti", "yaz-tarifi", "pratik"],
    ingredients: [
      { name: "Aperol", amount: "60", unit: "ml", sortOrder: 1 },
      { name: "Prosecco", amount: "90", unit: "ml", sortOrder: 2 },
      { name: "Soda", amount: "30", unit: "ml", sortOrder: 3 },
      { name: "Buz", amount: "5", unit: "adet", sortOrder: 4 },
      { name: "Portakal dilimi", amount: "1", unit: "adet", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Büyük şarap bardağına buz doldurun." },
      { stepNumber: 2, instruction: "Sırasıyla Aperol, prosecco ve sodayı ekleyin." },
      { stepNumber: 3, instruction: "Hafifçe karıştırın, portakal dilimi ile süsleyin." },
    ],
  },
  {
    title: "Gin Tonik", slug: "gin-tonik", emoji: "🍸",
    description: "Cin ve tonik suyunun mükemmel birleşimi. Basit ama şık.",
    categorySlug: "kokteyller", type: "KOKTEYL" as const, difficulty: "EASY" as const,
    prepMinutes: 2, cookMinutes: 0, totalMinutes: 2, servingCount: 1,
    averageCalories: 170, protein: 0, carbs: 14, fat: 0, isFeatured: false,
    tipNote: "İyi kalite tonik suyu farkı büyük.",
    servingSuggestion: null,
    tags: ["alkollu", "30-dakika-alti", "pratik"],
    ingredients: [
      { name: "Gin", amount: "50", unit: "ml", sortOrder: 1 },
      { name: "Tonik suyu", amount: "150", unit: "ml", sortOrder: 2 },
      { name: "Buz", amount: "5", unit: "adet", sortOrder: 3 },
      { name: "Lime dilimi", amount: "1", unit: "adet", sortOrder: 4 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Bardağa buz doldurun." },
      { stepNumber: 2, instruction: "Gin'i ekleyin, tonik suyu yavaşça gezdirin." },
      { stepNumber: 3, instruction: "Lime dilimi ile süsleyin." },
    ],
  },
  {
    title: "Whiskey Sour", slug: "whiskey-sour", emoji: "🥃",
    description: "Viski, limon suyu ve şeker şurubu ile ekşi-tatlı kokteyl.",
    categorySlug: "kokteyller", type: "KOKTEYL" as const, difficulty: "MEDIUM" as const,
    prepMinutes: 5, cookMinutes: 0, totalMinutes: 5, servingCount: 1,
    averageCalories: 180, protein: 0, carbs: 10, fat: 0, isFeatured: false,
    tipNote: "Yumurta akı eklerseniz kadifemsi bir köpük elde edersiniz.",
    servingSuggestion: null,
    tags: ["alkollu", "30-dakika-alti"],
    ingredients: [
      { name: "Bourbon viski", amount: "50", unit: "ml", sortOrder: 1 },
      { name: "Taze limon suyu", amount: "25", unit: "ml", sortOrder: 2 },
      { name: "Şeker şurubu", amount: "15", unit: "ml", sortOrder: 3 },
      { name: "Buz", amount: "5", unit: "adet", sortOrder: 4 },
      { name: "Kiraz (garnitür)", amount: "1", unit: "adet", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Shaker'a viski, limon suyu, şeker şurubu ve buz koyun." },
      { stepNumber: 2, instruction: "15 saniye sert sallayın." },
      { stepNumber: 3, instruction: "Buzlu bardağa süzün, kiraz ile süsleyin." },
    ],
  },
  // ── SMOOTHIE & SHAKE ──
  {
    title: "Mango Smoothie", slug: "mango-smoothie", emoji: "🥭",
    description: "Taze mango, yoğurt ve bal ile hazırlanan tropik smoothie.",
    categorySlug: "smoothie-shake", type: "ICECEK" as const, difficulty: "EASY" as const,
    prepMinutes: 5, cookMinutes: 0, totalMinutes: 5, servingCount: 2,
    averageCalories: 180, protein: 4, carbs: 36, fat: 2, isFeatured: false,
    tipNote: "Dondurulmuş mango kullanırsanız buz eklemenize gerek kalmaz.",
    servingSuggestion: null,
    tags: ["vejetaryen", "30-dakika-alti", "pratik", "yaz-tarifi"],
    ingredients: [
      { name: "Mango", amount: "1", unit: "adet", sortOrder: 1 },
      { name: "Yoğurt", amount: "150", unit: "gr", sortOrder: 2 },
      { name: "Bal", amount: "1", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Süt", amount: "100", unit: "ml", sortOrder: 4 },
      { name: "Buz", amount: "4", unit: "adet", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Mangoyu soyup küp küp doğrayın." },
      { stepNumber: 2, instruction: "Tüm malzemeleri blender'da pürüzsüz olana kadar çekin." },
    ],
  },
  {
    title: "Muzlu Milkshake", slug: "muzlu-milkshake", emoji: "🍌",
    description: "Muz, süt ve dondurma ile hazırlanan kremamsı milkshake.",
    categorySlug: "smoothie-shake", type: "ICECEK" as const, difficulty: "EASY" as const,
    prepMinutes: 5, cookMinutes: 0, totalMinutes: 5, servingCount: 2,
    averageCalories: 250, protein: 6, carbs: 40, fat: 8, isFeatured: false,
    tipNote: "Donmuş muz kullanırsanız daha kremamsı olur.",
    servingSuggestion: null,
    tags: ["vejetaryen", "30-dakika-alti", "cocuk-dostu", "pratik"],
    ingredients: [
      { name: "Muz", amount: "2", unit: "adet", sortOrder: 1 },
      { name: "Süt", amount: "200", unit: "ml", sortOrder: 2 },
      { name: "Vanilyalı dondurma", amount: "2", unit: "top", sortOrder: 3 },
      { name: "Bal", amount: "1", unit: "tatlı kaşığı", sortOrder: 4 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Muzları parçalayın." },
      { stepNumber: 2, instruction: "Tüm malzemeleri blender'da 30 saniye çekin." },
    ],
  },
  // ── İÇECEKLER ──
  {
    title: "Soğuk Çay", slug: "soguk-cay", emoji: "🧊",
    description: "Ev yapımı şeftalili veya limonlu ice tea. Doğal ve ferahlatıcı.",
    categorySlug: "icecekler", type: "ICECEK" as const, difficulty: "EASY" as const,
    prepMinutes: 10, cookMinutes: 5, totalMinutes: 15, servingCount: 4,
    averageCalories: 70, protein: 0, carbs: 18, fat: 0, isFeatured: false,
    tipNote: "Çayı soğutmadan şekeri ekleyin, daha iyi erir.",
    servingSuggestion: "Bol buz ve limon dilimi ile.",
    tags: ["30-dakika-alti", "yaz-tarifi", "alkolsuz"],
    ingredients: [
      { name: "Siyah çay", amount: "4", unit: "poşet", sortOrder: 1 },
      { name: "Su", amount: "1", unit: "litre", sortOrder: 2 },
      { name: "Şeker", amount: "4", unit: "yemek kaşığı", sortOrder: 3 },
      { name: "Limon suyu", amount: "2", unit: "yemek kaşığı", sortOrder: 4 },
      { name: "Buz", amount: "1", unit: "avuç", sortOrder: 5 },
    ],
    steps: [
      { stepNumber: 1, instruction: "Suyu kaynatın, çayları demleyin, 5 dk bekletin.", timerSeconds: 300 },
      { stepNumber: 2, instruction: "Çay poşetlerini çıkarın, şekeri karıştırarak eritin." },
      { stepNumber: 3, instruction: "Limon suyunu ekleyin, soğumaya bırakın." },
      { stepNumber: 4, instruction: "Buzdolabında iyice soğutun, buzlu servis edin." },
    ],
  },
  {
    title: "Boza", slug: "boza", emoji: "🥤",
    description: "Darı unundan yapılan fermente geleneksel Türk içeceği. Kış aylarının favorisi.",
    categorySlug: "icecekler", type: "ICECEK" as const, difficulty: "HARD" as const,
    prepMinutes: 30, cookMinutes: 120, totalMinutes: 150, servingCount: 8,
    averageCalories: 130, protein: 2, carbs: 28, fat: 1, isFeatured: false,
    tipNote: "Mayalanma süresi sıcaklığa göre değişir, 2-3 gün bekleyebilir.",
    servingSuggestion: "Leblebi ve tarçın ile servis edin.",
    tags: ["alkolsuz", "kis-tarifi"],
    ingredients: [
      { name: "Darı unu", amount: "2", unit: "su bardağı", sortOrder: 1 },
      { name: "Şeker", amount: "1.5", unit: "su bardağı", sortOrder: 2 },
      { name: "Su", amount: "8", unit: "su bardağı", sortOrder: 3 },
      { name: "Yaş maya", amount: "0.5", unit: "tatlı kaşığı", sortOrder: 4 },
      { name: "Leblebi", amount: "2", unit: "yemek kaşığı", sortOrder: 5, group: "Servis için" },
    ],
    steps: [
      { stepNumber: 1, instruction: "Darı ununu suyla karıştırıp kısık ateşte 1-2 saat pişirin.", timerSeconds: 7200 },
      { stepNumber: 2, instruction: "Soğumaya bırakın. Ilıyınca şeker ve çözülmüş mayayı ekleyin." },
      { stepNumber: 3, instruction: "Ağzı kapalı serin yerde 24-48 saat mayalanmaya bırakın." },
      { stepNumber: 4, instruction: "Süzüp buzdolabında saklayın. Leblebi ve tarçınla servis edin." },
    ],
  },
];

// ─── Seed Fonksiyonu ─────────────────────────────────────

async function main() {
  const prisma = initPrisma();
  try {
    await runSeed(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

async function runSeed(prisma: PrismaClient) {
  console.log("🌱 Seed başlatılıyor...");

  // ─── 1. PRE-FLIGHT VALIDATION ────────────────────────────
  // Every candidate runs through Zod before any DB write. A single bad
  // row (wrong enum, invalid slug, missing field) no longer blows up the
  // batch — we log the offender + skip it, continue with the rest.
  // For a 500-row Codex batch this is the difference between "one typo
  // wastes the whole run" and "one typo is fixed in the next PR."
  const { valid, errors: validationErrors } = validateSeedRecipes(recipes);
  if (validationErrors.length > 0) {
    console.warn(
      `\n⚠ ${validationErrors.length} tarif şema doğrulamasından geçemedi ve atlanacak:`,
    );
    for (const err of validationErrors) {
      console.warn(`   [${err.index}] ${err.title} — ${err.message}`);
    }
    console.warn("");
  }

  // Mevcut kategori ve etiketleri DB'den al
  const allCategories = await prisma.category.findMany();
  const catMap = Object.fromEntries(allCategories.map((c) => [c.slug, c.id]));

  const allTags = await prisma.tag.findMany();
  const tagMap = Object.fromEntries(allTags.map((t) => [t.slug, t.id]));

  let created = 0;
  let skipped = 0;

  for (const r of valid) {
    const categoryId = catMap[r.categorySlug];
    if (!categoryId) {
      console.warn(`  ⚠️ Kategori bulunamadı: ${r.categorySlug}, atlanıyor: ${r.title}`);
      skipped++;
      continue;
    }

    // Mevcut tarifi kontrol et
    const existing = await prisma.recipe.findUnique({ where: { slug: r.slug } });
    if (existing) {
      console.log(`  ⏭️  ${r.title} zaten var, atlanıyor`);
      skipped++;
      continue;
    }

    const tagIds = r.tags
      .map((slug) => tagMap[slug])
      .filter((id): id is string => Boolean(id));

    await prisma.recipe.create({
      data: {
        title: r.title,
        slug: r.slug,
        description: r.description,
        emoji: r.emoji ?? null,
        categoryId,
        type: r.type,
        difficulty: r.difficulty,
        prepMinutes: r.prepMinutes,
        cookMinutes: r.cookMinutes,
        totalMinutes: r.totalMinutes,
        servingCount: r.servingCount,
        averageCalories: r.averageCalories ?? null,
        protein: r.protein ?? null,
        carbs: r.carbs ?? null,
        fat: r.fat ?? null,
        isFeatured: r.isFeatured,
        tipNote: r.tipNote ?? null,
        servingSuggestion: r.servingSuggestion ?? null,
        // allergens passthrough — Codex-provided explicit list wins; the
        // retrofit script later fills any empty arrays via inference.
        allergens: r.allergens,
        // translations passthrough — optional JSONB bucket for EN/DE etc.
        // Left NULL when not provided; Faz 3 language toggle reads this.
        translations: r.translations ?? undefined,
        ingredients: {
          create: r.ingredients.map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit ?? null,
            sortOrder: ing.sortOrder,
            isOptional: ing.isOptional ?? false,
            group: ing.group ?? null,
          })),
        },
        steps: {
          create: r.steps.map((s) => ({
            stepNumber: s.stepNumber,
            instruction: s.instruction,
            tip: s.tip ?? null,
            timerSeconds: s.timerSeconds ?? null,
          })),
        },
        tags: {
          create: tagIds.map((tagId) => ({ tagId })),
        },
      },
    });

    console.log(`  ✅ ${r.title} eklendi`);
    created++;
  }

  const invalidCount = validationErrors.length;
  console.log(
    `\n🎉 Seed tamamlandı! ${created} yeni tarif eklendi, ${skipped} atlandı (zaten var/kategori yok), ${invalidCount} geçersiz format nedeniyle reddedildi.`,
  );
  if (invalidCount > 0) {
    console.log(
      "   Geçersiz tariflerin hangi alanda hata verdiği yukarıdaki liste ile beraber.",
    );
  }
}

// Only auto-run the seed when this file is the Node entrypoint. Importing
// it (e.g. from validate-batch.ts) yields the `recipes` array without any
// DB side effect.
const isEntrypoint =
  !!process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isEntrypoint) {
  main().catch((err) => {
    console.error("❌ Seed hatası:", err);
    process.exit(1);
  });
}
