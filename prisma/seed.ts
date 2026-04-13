import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

// Node.js ortamında WebSocket desteği
neonConfig.webSocketConstructor = ws;

// ESM-compatible __dirname
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname2, "..", ".env") });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL ortam değişkeni tanımlı değil!");
}

const adapter = new PrismaNeon({ connectionString: databaseUrl });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Seed başlatılıyor...");

  // ─── Kategoriler ───────────────────────────────────
  const categories = await Promise.all([
    prisma.category.upsert({ where: { slug: "et-yemekleri" }, update: {}, create: { name: "Et Yemekleri", slug: "et-yemekleri", emoji: "🥩", sortOrder: 1 } }),
    prisma.category.upsert({ where: { slug: "tavuk-yemekleri" }, update: {}, create: { name: "Tavuk Yemekleri", slug: "tavuk-yemekleri", emoji: "🍗", sortOrder: 2 } }),
    prisma.category.upsert({ where: { slug: "sebze-yemekleri" }, update: {}, create: { name: "Sebze Yemekleri", slug: "sebze-yemekleri", emoji: "🥦", sortOrder: 3 } }),
    prisma.category.upsert({ where: { slug: "corbalar" }, update: {}, create: { name: "Çorbalar", slug: "corbalar", emoji: "🍲", sortOrder: 4 } }),
    prisma.category.upsert({ where: { slug: "baklagil-yemekleri" }, update: {}, create: { name: "Baklagil Yemekleri", slug: "baklagil-yemekleri", emoji: "🫘", sortOrder: 5 } }),
    prisma.category.upsert({ where: { slug: "salatalar" }, update: {}, create: { name: "Salatalar", slug: "salatalar", emoji: "🥗", sortOrder: 6 } }),
    prisma.category.upsert({ where: { slug: "kahvaltiliklar" }, update: {}, create: { name: "Kahvaltılıklar", slug: "kahvaltiliklar", emoji: "🍳", sortOrder: 7 } }),
    prisma.category.upsert({ where: { slug: "hamur-isleri" }, update: {}, create: { name: "Hamur İşleri", slug: "hamur-isleri", emoji: "🥟", sortOrder: 8 } }),
    prisma.category.upsert({ where: { slug: "tatlilar" }, update: {}, create: { name: "Tatlılar", slug: "tatlilar", emoji: "🍰", sortOrder: 9 } }),
    prisma.category.upsert({ where: { slug: "aperatifler" }, update: {}, create: { name: "Aperatifler", slug: "aperatifler", emoji: "🧆", sortOrder: 10 } }),
    prisma.category.upsert({ where: { slug: "icecekler" }, update: {}, create: { name: "İçecekler", slug: "icecekler", emoji: "🥤", sortOrder: 11 } }),
    prisma.category.upsert({ where: { slug: "kokteyller" }, update: {}, create: { name: "Kokteyller", slug: "kokteyller", emoji: "🍹", sortOrder: 12 } }),
    prisma.category.upsert({ where: { slug: "kahve-sicak-icecekler" }, update: {}, create: { name: "Kahve & Sıcak İçecekler", slug: "kahve-sicak-icecekler", emoji: "☕", sortOrder: 13 } }),
    prisma.category.upsert({ where: { slug: "makarna-pilav" }, update: {}, create: { name: "Makarna & Pilav", slug: "makarna-pilav", emoji: "🍝", sortOrder: 14 } }),
    prisma.category.upsert({ where: { slug: "soslar-dippler" }, update: {}, create: { name: "Soslar & Dippler", slug: "soslar-dippler", emoji: "🫙", sortOrder: 15 } }),
    prisma.category.upsert({ where: { slug: "smoothie-shake" }, update: {}, create: { name: "Smoothie & Shake", slug: "smoothie-shake", emoji: "🥤", sortOrder: 16 } }),
    prisma.category.upsert({ where: { slug: "atistirmaliklar" }, update: {}, create: { name: "Atıştırmalıklar", slug: "atistirmaliklar", emoji: "🍿", sortOrder: 17 } }),
  ]);
  console.log(`✅ ${categories.length} kategori oluşturuldu`);

  const catMap = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  // ─── Etiketler ─────────────────────────────────────
  const tagData = [
    { name: "Pratik", slug: "pratik" },
    { name: "30 Dakika Altı", slug: "30-dakika-alti" },
    { name: "Düşük Kalorili", slug: "dusuk-kalorili" },
    { name: "Yüksek Protein", slug: "yuksek-protein" },
    { name: "Fırında", slug: "firinda" },
    { name: "Tek Tencere", slug: "tek-tencere" },
    { name: "Misafir Sofrası", slug: "misafir-sofrasi" },
    { name: "Çocuk Dostu", slug: "cocuk-dostu" },
    { name: "Bütçe Dostu", slug: "butce-dostu" },
    { name: "Vegan", slug: "vegan" },
    { name: "Vejetaryen", slug: "vejetaryen" },
    { name: "Alkollü", slug: "alkollu" },
    { name: "Alkolsüz", slug: "alkolsuz" },
    { name: "Kış Tarifi", slug: "kis-tarifi" },
    { name: "Yaz Tarifi", slug: "yaz-tarifi" },
  ];
  const tags = await Promise.all(
    tagData.map((t) => prisma.tag.upsert({ where: { slug: t.slug }, update: {}, create: t })),
  );
  console.log(`✅ ${tags.length} etiket oluşturuldu`);
  const tagMap = Object.fromEntries(tags.map((t) => [t.slug, t.id]));

  // ─── Tarifler ──────────────────────────────────────
  const recipes = [
    {
      title: "Karnıyarık", slug: "karniyarik", emoji: "🍆",
      description: "Türk mutfağının vazgeçilmez et yemeklerinden biri. Kızartılmış patlıcanların arasına kıymalı harç doldurularak fırında pişirilir.",
      categorySlug: "et-yemekleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
      prepMinutes: 20, cookMinutes: 40, totalMinutes: 60, servingCount: 4,
      averageCalories: 320, protein: 18, carbs: 22, fat: 15, isFeatured: true,
      tipNote: "Patlıcanları tuzlu suda bekletmek hem acılığını alır hem de yağ çekmesini azaltır.",
      servingSuggestion: "Pilav ve cacık ile servis edin.",
      tags: ["firinda", "misafir-sofrasi"],
      ingredients: [
        { name: "Patlıcan", amount: "4", unit: "adet", sortOrder: 1 },
        { name: "Kıyma", amount: "300", unit: "gr", sortOrder: 2 },
        { name: "Soğan", amount: "2", unit: "adet", sortOrder: 3 },
        { name: "Domates", amount: "2", unit: "adet", sortOrder: 4 },
        { name: "Biber salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 5 },
        { name: "Sivri biber", amount: "2", unit: "adet", sortOrder: 6, isOptional: true },
        { name: "Sarımsak", amount: "3", unit: "diş", sortOrder: 7 },
        { name: "Tuz, karabiber", amount: "1", unit: "tatlı kaşığı", sortOrder: 8 },
        { name: "Sıvı yağ", amount: "3", unit: "yemek kaşığı", sortOrder: 9 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Patlıcanları yıkayın ve alacalı soyun. Ortadan yarıp tuzlu suda 15 dakika bekletin.", tip: "Tuzlu su hem acılığı alır hem de yağ çekmesini azaltır.", timerSeconds: 900 },
        { stepNumber: 2, instruction: "Patlıcanları sudan çıkarıp kurulayın. Kızgın yağda her iki tarafını kızartın." },
        { stepNumber: 3, instruction: "Soğanları ince doğrayın. Ayrı bir tavada yağda pembeleşene kadar kavurun." },
        { stepNumber: 4, instruction: "Kıymayı ekleyin, suyunu çekene kadar karıştırarak pişirin.", tip: "Kıymayı sürekli karıştırın ki topaklanmasın." },
        { stepNumber: 5, instruction: "Doğranmış domatesleri, salçayı, sarımsağı ve baharatları ekleyin. 5 dakika pişirin.", timerSeconds: 300 },
        { stepNumber: 6, instruction: "Kızartılmış patlıcanları tepsiye dizin, ortalarını açıp kıymalı harcı doldurun." },
        { stepNumber: 7, instruction: "Önceden ısıtılmış 180°C fırında 25 dakika pişirin.", tip: "Üzerine biraz sıcak su eklemek pişirmeyi kolaylaştırır.", timerSeconds: 1500 },
      ],
    },
    {
      title: "Mercimek Çorbası", slug: "mercimek-corbasi", emoji: "🍲",
      description: "Türk sofrasının olmazsa olmazı, besleyici ve doyurucu kırmızı mercimek çorbası.",
      categorySlug: "corbalar", type: "CORBA" as const, difficulty: "EASY" as const,
      prepMinutes: 10, cookMinutes: 25, totalMinutes: 35, servingCount: 6,
      averageCalories: 180, protein: 12, carbs: 28, fat: 4, isFeatured: true,
      tipNote: "Limon sıkarak servis edin, lezzeti katlayacaktır.",
      tags: ["30-dakika-alti", "butce-dostu", "vegan", "tek-tencere", "kis-tarifi"],
      ingredients: [
        { name: "Kırmızı mercimek", amount: "1.5", unit: "su bardağı", sortOrder: 1 },
        { name: "Soğan", amount: "1", unit: "adet", sortOrder: 2 },
        { name: "Havuç", amount: "1", unit: "adet", sortOrder: 3 },
        { name: "Patates", amount: "1", unit: "adet", sortOrder: 4 },
        { name: "Domates salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 5 },
        { name: "Su", amount: "6", unit: "su bardağı", sortOrder: 6 },
        { name: "Tereyağı", amount: "1", unit: "yemek kaşığı", sortOrder: 7 },
        { name: "Tuz, karabiber, kimyon", amount: "", unit: "", sortOrder: 8 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Mercimekleri yıkayın. Soğanı, havucu ve patatesi küçük küçük doğrayın." },
        { stepNumber: 2, instruction: "Tencereye az yağ koyun, soğanı kavurun. Diğer sebzeleri ekleyin." },
        { stepNumber: 3, instruction: "Mercimekleri ve suyu ekleyin. Kaynamaya bırakın.", timerSeconds: 1200 },
        { stepNumber: 4, instruction: "Mercimekler yumuşayınca blender ile pürüzsüz hale getirin." },
        { stepNumber: 5, instruction: "Tuz, karabiber ve kimyon ekleyin. Tereyağı ile servis edin." },
      ],
    },
    {
      title: "Menemen", slug: "menemen", emoji: "🍳",
      description: "Domates, biber ve yumurtanın buluştuğu pratik ve lezzetli Türk kahvaltısı.",
      categorySlug: "kahvaltiliklar", type: "KAHVALTI" as const, difficulty: "EASY" as const,
      prepMinutes: 5, cookMinutes: 10, totalMinutes: 15, servingCount: 2,
      averageCalories: 220, protein: 14, carbs: 10, fat: 14, isFeatured: false,
      tags: ["pratik", "30-dakika-alti", "vejetaryen"],
      ingredients: [
        { name: "Yumurta", amount: "3", unit: "adet", sortOrder: 1 },
        { name: "Domates", amount: "2", unit: "adet", sortOrder: 2 },
        { name: "Sivri biber", amount: "2", unit: "adet", sortOrder: 3 },
        { name: "Tereyağı", amount: "1", unit: "yemek kaşığı", sortOrder: 4 },
        { name: "Tuz, karabiber, pul biber", amount: "", unit: "", sortOrder: 5 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Domatesleri ve biberleri küçük küçük doğrayın." },
        { stepNumber: 2, instruction: "Tavada tereyağını eritin, biberleri kavurun." },
        { stepNumber: 3, instruction: "Domatesleri ekleyin, suyunu çekene kadar pişirin.", timerSeconds: 300 },
        { stepNumber: 4, instruction: "Yumurtaları kırıp ekleyin, hafifçe karıştırın. Pişince servis edin." },
      ],
    },
    {
      title: "Tavuk Sote", slug: "tavuk-sote", emoji: "🍗",
      description: "Sebzeli tavuk sote, pratik ve doyurucu bir ana yemek.",
      categorySlug: "tavuk-yemekleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
      prepMinutes: 15, cookMinutes: 30, totalMinutes: 45, servingCount: 4,
      averageCalories: 350, protein: 28, carbs: 18, fat: 16, isFeatured: true,
      tags: ["yuksek-protein", "tek-tencere"],
      ingredients: [
        { name: "Tavuk göğsü", amount: "500", unit: "gr", sortOrder: 1 },
        { name: "Soğan", amount: "1", unit: "adet", sortOrder: 2 },
        { name: "Biber", amount: "2", unit: "adet", sortOrder: 3 },
        { name: "Domates", amount: "2", unit: "adet", sortOrder: 4 },
        { name: "Patates", amount: "2", unit: "adet", sortOrder: 5, isOptional: true },
        { name: "Sıvı yağ, tuz, baharatlar", amount: "", unit: "", sortOrder: 6 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Tavuğu kuşbaşı doğrayın. Sebzeleri doğrayın." },
        { stepNumber: 2, instruction: "Yağda tavuğu sote edin. Soğanları ekleyin." },
        { stepNumber: 3, instruction: "Biberleri ve domatesleri ekleyin. Kısık ateşte pişirin.", timerSeconds: 1200 },
        { stepNumber: 4, instruction: "Baharatları ekleyin, 5 dakika daha pişirin." },
      ],
    },
    {
      title: "Kuru Fasulye", slug: "kuru-fasulye", emoji: "🫘",
      description: "Türk mutfağının efsanesi, pilav ile mükemmel uyum.",
      categorySlug: "baklagil-yemekleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
      prepMinutes: 15, cookMinutes: 60, totalMinutes: 75, servingCount: 6,
      averageCalories: 280, protein: 16, carbs: 42, fat: 6, isFeatured: true,
      tipNote: "Fasulyeleri bir gece önceden ıslatın.",
      tags: ["butce-dostu", "yuksek-protein", "kis-tarifi"],
      ingredients: [
        { name: "Kuru fasulye", amount: "2", unit: "su bardağı", sortOrder: 1 },
        { name: "Soğan", amount: "1", unit: "adet", sortOrder: 2 },
        { name: "Domates salçası", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
        { name: "Biber salçası", amount: "1", unit: "yemek kaşığı", sortOrder: 4 },
        { name: "Sıvı yağ", amount: "3", unit: "yemek kaşığı", sortOrder: 5 },
        { name: "Sıcak su", amount: "4", unit: "su bardağı", sortOrder: 6 },
        { name: "Tuz, karabiber, pul biber", amount: "", unit: "", sortOrder: 7 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Fasulyeleri bir gece suda bekletin. Ertesi gün süzün." },
        { stepNumber: 2, instruction: "Soğanı yağda kavurun. Salçaları ekleyin." },
        { stepNumber: 3, instruction: "Fasulyeleri ve sıcak suyu ekleyin. Kısık ateşte pişirin.", timerSeconds: 3600 },
        { stepNumber: 4, instruction: "Yumuşayınca tuz ve baharatları ekleyin." },
      ],
    },
    {
      title: "Çoban Salatası", slug: "coban-salatasi", emoji: "🥗",
      description: "Taze sebzelerle hazırlanan, her sofraya yakışan klasik Türk salatası.",
      categorySlug: "salatalar", type: "SALATA" as const, difficulty: "EASY" as const,
      prepMinutes: 10, cookMinutes: 0, totalMinutes: 10, servingCount: 4,
      averageCalories: 90, protein: 2, carbs: 8, fat: 5, isFeatured: false,
      tags: ["pratik", "30-dakika-alti", "dusuk-kalorili", "vegan"],
      ingredients: [
        { name: "Domates", amount: "3", unit: "adet", sortOrder: 1 },
        { name: "Salatalık", amount: "2", unit: "adet", sortOrder: 2 },
        { name: "Sivri biber", amount: "2", unit: "adet", sortOrder: 3 },
        { name: "Soğan", amount: "1", unit: "adet", sortOrder: 4 },
        { name: "Maydanoz", amount: "1", unit: "demet", sortOrder: 5 },
        { name: "Zeytinyağı, limon, tuz", amount: "", unit: "", sortOrder: 6 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Tüm sebzeleri küçük küçük doğrayın." },
        { stepNumber: 2, instruction: "Derin bir kaseye alın." },
        { stepNumber: 3, instruction: "Zeytinyağı, limon suyu ve tuz ile harmanlayın." },
      ],
    },
    {
      title: "Sigara Böreği", slug: "sigara-boregi", emoji: "🥟",
      description: "Çıtır çıtır, peynirli veya patatesli hazırlanan klasik Türk böreği.",
      categorySlug: "hamur-isleri", type: "APERATIF" as const, difficulty: "MEDIUM" as const,
      prepMinutes: 20, cookMinutes: 15, totalMinutes: 35, servingCount: 4,
      averageCalories: 280, protein: 10, carbs: 24, fat: 16, isFeatured: false,
      tags: ["vejetaryen", "cocuk-dostu"],
      ingredients: [
        { name: "Yufka", amount: "3", unit: "adet", sortOrder: 1 },
        { name: "Beyaz peynir", amount: "200", unit: "gr", sortOrder: 2 },
        { name: "Maydanoz", amount: "1", unit: "demet", sortOrder: 3 },
        { name: "Kızartma yağı", amount: "", unit: "", sortOrder: 4 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Peyniri ufalayın, maydanozu kıyın, karıştırın." },
        { stepNumber: 2, instruction: "Yufkayı üçgen kesin, iç harcı koyup rulo yapın." },
        { stepNumber: 3, instruction: "Kızgın yağda altın rengi olana kadar kızartın.", timerSeconds: 300 },
      ],
    },
    {
      title: "İmam Bayıldı", slug: "imam-bayildi", emoji: "🍆",
      description: "Zeytinyağlı Türk mutfağının en sevilen yemeklerinden, soğuk servis edilir.",
      categorySlug: "sebze-yemekleri", type: "YEMEK" as const, difficulty: "MEDIUM" as const,
      prepMinutes: 20, cookMinutes: 40, totalMinutes: 60, servingCount: 4,
      averageCalories: 200, protein: 4, carbs: 18, fat: 12, isFeatured: true,
      tags: ["vegan", "misafir-sofrasi"],
      ingredients: [
        { name: "Patlıcan", amount: "4", unit: "adet", sortOrder: 1 },
        { name: "Soğan", amount: "3", unit: "adet", sortOrder: 2 },
        { name: "Domates", amount: "3", unit: "adet", sortOrder: 3 },
        { name: "Sarımsak", amount: "4", unit: "diş", sortOrder: 4 },
        { name: "Zeytinyağı", amount: "1/2", unit: "su bardağı", sortOrder: 5 },
        { name: "Tuz, şeker, maydanoz", amount: "", unit: "", sortOrder: 6 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Patlıcanları alacalı soyun, yarın ve tuzlu suda bekletin.", timerSeconds: 900 },
        { stepNumber: 2, instruction: "Soğanları halka kesin, zeytinyağında kavurun." },
        { stepNumber: 3, instruction: "Domatesleri rendeleyin, sarımsakla ekleyin." },
        { stepNumber: 4, instruction: "Patlıcanları tepsiye dizin, harcı doldurun." },
        { stepNumber: 5, instruction: "Üzerine sıcak su ekleyin, 180°C fırında 40 dk pişirin.", timerSeconds: 2400 },
      ],
    },
    {
      title: "Humus", slug: "humus", emoji: "🧆",
      description: "Nohut ezmesi ile yapılan, tahini, limon ve zeytinyağı ile servis edilen Ortadoğu lezzeti.",
      categorySlug: "aperatifler", type: "APERATIF" as const, difficulty: "EASY" as const,
      prepMinutes: 10, cookMinutes: 0, totalMinutes: 10, servingCount: 4,
      averageCalories: 170, protein: 8, carbs: 20, fat: 7, isFeatured: false,
      tags: ["pratik", "vegan", "30-dakika-alti"],
      ingredients: [
        { name: "Haşlanmış nohut", amount: "400", unit: "gr", sortOrder: 1 },
        { name: "Tahin", amount: "3", unit: "yemek kaşığı", sortOrder: 2 },
        { name: "Limon suyu", amount: "2", unit: "yemek kaşığı", sortOrder: 3 },
        { name: "Sarımsak", amount: "1", unit: "diş", sortOrder: 4 },
        { name: "Zeytinyağı, tuz, kimyon", amount: "", unit: "", sortOrder: 5 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Tüm malzemeleri blender'a koyun." },
        { stepNumber: 2, instruction: "Pürüzsüz olana kadar çekin. Gerekirse su ekleyin." },
        { stepNumber: 3, instruction: "Tabağa alın, zeytinyağı ve pul biber ile süsleyin." },
      ],
    },
    {
      title: "Baklava", slug: "baklava", emoji: "🍯",
      description: "Türk tatlı kültürünün simgesi. İnce yufkalar arasında ceviz veya fıstık ile hazırlanır.",
      categorySlug: "tatlilar", type: "TATLI" as const, difficulty: "HARD" as const,
      prepMinutes: 45, cookMinutes: 45, totalMinutes: 90, servingCount: 12,
      averageCalories: 450, protein: 6, carbs: 52, fat: 24, isFeatured: true,
      tipNote: "Şerbeti soğuk, baklava sıcak olmalı — ya da tersi.",
      tags: ["misafir-sofrasi", "firinda"],
      ingredients: [
        { name: "Baklava yufkası", amount: "500", unit: "gr", sortOrder: 1 },
        { name: "Ceviz içi", amount: "300", unit: "gr", sortOrder: 2 },
        { name: "Tereyağı", amount: "250", unit: "gr", sortOrder: 3 },
        { name: "Şeker", amount: "3", unit: "su bardağı", sortOrder: 4 },
        { name: "Su", amount: "2", unit: "su bardağı", sortOrder: 5 },
        { name: "Limon suyu", amount: "1", unit: "tatlı kaşığı", sortOrder: 6 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Cevizleri çekin. Tereyağını eritin." },
        { stepNumber: 2, instruction: "Yufkaları tepsiye sererek aralarına tereyağı sürün." },
        { stepNumber: 3, instruction: "Her 3-4 yufkada bir ceviz serpin." },
        { stepNumber: 4, instruction: "Baklava şeklinde kesin. 170°C fırında 45 dk pişirin.", timerSeconds: 2700 },
        { stepNumber: 5, instruction: "Şerbeti hazırlayın: şeker ve suyu kaynatın, limon ekleyin." },
        { stepNumber: 6, instruction: "Sıcak baklavaya soğuk şerbeti gezdirin." },
      ],
    },
    // ─── İçecekler ─────────────────────────────────────
    {
      title: "Türk Kahvesi", slug: "turk-kahvesi", emoji: "☕",
      description: "UNESCO somut olmayan kültürel miras listesindeki geleneksel Türk kahvesi.",
      categorySlug: "kahve-sicak-icecekler", type: "ICECEK" as const, difficulty: "EASY" as const,
      prepMinutes: 2, cookMinutes: 5, totalMinutes: 7, servingCount: 2,
      averageCalories: 15, protein: 0, carbs: 3, fat: 0, isFeatured: false,
      tipNote: "Kahveyi asla karıştırmayın, köpüğü bozarsınız.",
      tags: ["pratik", "30-dakika-alti"],
      ingredients: [
        { name: "Türk kahvesi", amount: "2", unit: "tatlı kaşığı", sortOrder: 1 },
        { name: "Su", amount: "2", unit: "fincan", sortOrder: 2 },
        { name: "Şeker", amount: "", unit: "isteğe bağlı", sortOrder: 3 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Cezveye su ve şekeri (varsa) koyun." },
        { stepNumber: 2, instruction: "Kahveyi ekleyin, karıştırmadan kısık ateşe koyun." },
        { stepNumber: 3, instruction: "Köpük yükselince fincanlara paylaştırın. Tekrar köpürtüp dökün." },
      ],
    },
    {
      title: "Ayran", slug: "ayran", emoji: "🥛",
      description: "Yoğurt, su ve tuzdan yapılan ferahlatıcı Türk içeceği.",
      categorySlug: "icecekler", type: "ICECEK" as const, difficulty: "EASY" as const,
      prepMinutes: 3, cookMinutes: 0, totalMinutes: 3, servingCount: 2,
      averageCalories: 60, protein: 4, carbs: 5, fat: 2, isFeatured: false,
      tags: ["pratik", "30-dakika-alti", "vejetaryen"],
      ingredients: [
        { name: "Yoğurt", amount: "2", unit: "su bardağı", sortOrder: 1 },
        { name: "Su", amount: "1", unit: "su bardağı", sortOrder: 2 },
        { name: "Tuz", amount: "1/2", unit: "tatlı kaşığı", sortOrder: 3 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Yoğurt, su ve tuzu derin bir kaba alın." },
        { stepNumber: 2, instruction: "Blender veya çırpıcı ile köpürene kadar çırpın." },
        { stepNumber: 3, instruction: "Soğuk servis edin." },
      ],
    },
    {
      title: "Mojito", slug: "mojito", emoji: "🍹",
      description: "Nane ve lime ile hazırlanan, ferahlatıcı Küba kokteyli.",
      categorySlug: "kokteyller", type: "KOKTEYL" as const, difficulty: "EASY" as const,
      prepMinutes: 5, cookMinutes: 0, totalMinutes: 5, servingCount: 1,
      averageCalories: 150, protein: 0, carbs: 18, fat: 0, isFeatured: false,
      tags: ["yaz-tarifi", "alkollu"],
      ingredients: [
        { name: "Beyaz rom", amount: "50", unit: "ml", sortOrder: 1 },
        { name: "Lime", amount: "1", unit: "adet", sortOrder: 2 },
        { name: "Nane yaprakları", amount: "8-10", unit: "adet", sortOrder: 3 },
        { name: "Şeker", amount: "2", unit: "tatlı kaşığı", sortOrder: 4 },
        { name: "Soda", amount: "", unit: "tamamlayacak kadar", sortOrder: 5 },
        { name: "Buz", amount: "", unit: "bol", sortOrder: 6 },
      ],
      steps: [
        { stepNumber: 1, instruction: "Bardağa nane yapraklarını, lime dilimlerini ve şekeri koyun. Muddler ile ezin." },
        { stepNumber: 2, instruction: "Buz ekleyin, romu dökün." },
        { stepNumber: 3, instruction: "Soda ile tamamlayın, nazikçe karıştırın." },
      ],
    },
    {
      title: "Limonata", slug: "limonata", emoji: "🍋",
      description: "Ev yapımı taze limonata, yaz sıcaklarının vazgeçilmezi.",
      categorySlug: "icecekler", type: "ICECEK" as const, difficulty: "EASY" as const,
      prepMinutes: 10, cookMinutes: 0, totalMinutes: 10, servingCount: 4,
      averageCalories: 80, protein: 0, carbs: 20, fat: 0, isFeatured: false,
      tags: ["pratik", "30-dakika-alti", "yaz-tarifi", "alkolsuz"],
      ingredients: [
        { name: "Limon", amount: "4", unit: "adet", sortOrder: 1 },
        { name: "Şeker", amount: "4", unit: "yemek kaşığı", sortOrder: 2 },
        { name: "Su", amount: "1", unit: "litre", sortOrder: 3 },
        { name: "Nane", amount: "", unit: "süslemek için", sortOrder: 4, isOptional: true },
      ],
      steps: [
        { stepNumber: 1, instruction: "Limonların kabuğunu rendeleyin, suyunu sıkın." },
        { stepNumber: 2, instruction: "Blender'a limon suyu, kabuk rendesi, şeker ve suyu koyun." },
        { stepNumber: 3, instruction: "Kısa süre çekin (kabuğu parçalamayın), süzün. Soğuk servis edin." },
      ],
    },
    {
      title: "Şalgam Suyu", slug: "salgam-suyu", emoji: "🥤",
      description: "Adana'nın meşhur fermente içeceği, kebap yanında vazgeçilmez.",
      categorySlug: "icecekler", type: "ICECEK" as const, difficulty: "EASY" as const,
      prepMinutes: 5, cookMinutes: 0, totalMinutes: 5, servingCount: 2,
      averageCalories: 30, protein: 1, carbs: 6, fat: 0, isFeatured: false,
      tipNote: "Acılı versiyonu için pul biber ekleyebilirsiniz.",
      tags: ["pratik", "dusuk-kalorili"],
      ingredients: [
        { name: "Hazır şalgam suyu", amount: "500", unit: "ml", sortOrder: 1 },
        { name: "Limon", amount: "1", unit: "dilim", sortOrder: 2, isOptional: true },
      ],
      steps: [
        { stepNumber: 1, instruction: "Şalgam suyunu bardaklara paylaştırın." },
        { stepNumber: 2, instruction: "Buz ve limon dilimi ile servis edin." },
      ],
    },
  ];

  for (const r of recipes) {
    const existing = await prisma.recipe.findUnique({ where: { slug: r.slug } });
    if (existing) {
      console.log(`  ⏭️  ${r.title} zaten var, atlanıyor`);
      continue;
    }

    await prisma.recipe.create({
      data: {
        title: r.title,
        slug: r.slug,
        emoji: r.emoji,
        description: r.description,
        categoryId: catMap[r.categorySlug],
        type: r.type,
        difficulty: r.difficulty,
        prepMinutes: r.prepMinutes,
        cookMinutes: r.cookMinutes,
        totalMinutes: r.totalMinutes,
        servingCount: r.servingCount,
        averageCalories: r.averageCalories,
        protein: r.protein,
        carbs: r.carbs,
        fat: r.fat,
        isFeatured: r.isFeatured,
        tipNote: r.tipNote ?? null,
        servingSuggestion: r.servingSuggestion ?? null,
        ingredients: {
          create: r.ingredients.map((ing) => ({
            name: ing.name,
            amount: ing.amount,
            unit: ing.unit ?? null,
            sortOrder: ing.sortOrder,
            isOptional: "isOptional" in ing ? (ing.isOptional ?? false) : false,
          })),
        },
        steps: {
          create: r.steps.map((s) => ({
            stepNumber: s.stepNumber,
            instruction: s.instruction,
            tip: "tip" in s ? (s.tip ?? null) : null,
            timerSeconds: "timerSeconds" in s ? (s.timerSeconds ?? null) : null,
          })),
        },
        tags: {
          create: (r.tags ?? [])
            .filter((slug) => tagMap[slug])
            .map((slug) => ({ tagId: tagMap[slug] })),
        },
      },
    });
    console.log(`  ✅ ${r.title} eklendi`);
  }

  console.log("\n🎉 Seed tamamlandı!");
}

main()
  .catch((e) => {
    console.error("❌ Seed hatası:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
