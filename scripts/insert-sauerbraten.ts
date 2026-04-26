/**
 * Tek-seferlik: Sauerbraten tarifini DB'ye ekle (oturum 23, timeline
 * visual demo). 3 gun marine + 30dk prep + 180dk cook = 4530 dk total,
 * timeline'da 3 segment olarak gozukur.
 *
 * Idempotent: zaten varsa atla.
 *
 * Usage:
 *   npx tsx scripts/insert-sauerbraten.ts                # dev dry-run
 *   npx tsx scripts/insert-sauerbraten.ts --apply         # dev
 *   npx tsx scripts/insert-sauerbraten.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

const SAUERBRATEN = {
  title: "Sauerbraten",
  slug: "sauerbraten",
  emoji: "🍖",
  cuisine: "de",
  description:
    "Almanya'nın geleneksel ekşi tatlı dana tarifi. Et 3 gün boyunca sirke, kırmızı şarap, yıldız anason ve sebzelerle marine edilir; ardından tencerede yavaş pişirilir. Marine sırasında kazandığı derin aromayla ünlüdür.",
  categorySlug: "et-yemekleri",
  type: "YEMEK" as const,
  difficulty: "HARD" as const,
  prepMinutes: 30,
  cookMinutes: 180,
  totalMinutes: 4530,
  servingCount: 6,
  averageCalories: 480,
  protein: 38,
  carbs: 8,
  fat: 28,
  isFeatured: false,
  tipNote:
    "Marine süresini en az 48 saat tutun; üç gün etin daha derin aroma çekmesini sağlar.",
  servingSuggestion:
    "Alman patates topları (Klöße) veya haşlanmış lahana ile sıcak servis edin.",
  status: "PUBLISHED" as const,
  allergens: [] as string[],
  translations: {
    en: {
      title: "Sauerbraten",
      description:
        "A traditional German sour and sweet beef braise marinated for three days in vinegar, red wine, and spices, then slow-cooked until tender.",
    },
    de: {
      title: "Sauerbraten",
      description:
        "Ein traditionelles deutsches sauer-suesses Schmorgericht, das drei Tage in Essig, Rotwein und Gewuerzen mariniert und dann langsam geschmort wird.",
    },
  },
  ingredients: [
    { name: "Dana but eti", amount: "1.2", unit: "kg", sortOrder: 1 },
    { name: "Soğan", amount: "2", unit: "adet", sortOrder: 2 },
    { name: "Havuç", amount: "1", unit: "adet", sortOrder: 3 },
    { name: "Pırasa", amount: "1", unit: "adet", sortOrder: 4 },
    { name: "Kırmızı şarap sirkesi", amount: "500", unit: "ml", sortOrder: 5 },
    { name: "Kırmızı şarap", amount: "250", unit: "ml", sortOrder: 6 },
    { name: "Yıldız anason", amount: "3", unit: "adet", sortOrder: 7 },
    { name: "Defne yaprağı", amount: "3", unit: "adet", sortOrder: 8 },
    { name: "Karanfil", amount: "6", unit: "adet", sortOrder: 9 },
    { name: "Tuz", amount: "1", unit: "yemek kaşığı", sortOrder: 10 },
  ],
  steps: [
    {
      stepNumber: 1,
      instruction:
        "Dana eti büyük parçalar halinde temizleyin. Soğan, havuç ve pırasayı iri doğrayın.",
    },
    {
      stepNumber: 2,
      instruction:
        "Cam veya seramik kapta sirke, şarap, yıldız anason, defne, karanfil ve sebzeleri karıştırın. Eti ekleyip tüm yüzeyi sıvıyla kaplı olacak şekilde batırın.",
    },
    {
      stepNumber: 3,
      instruction:
        "Kabı buzdolabında 3 gün bekletin; günde bir kez eti çevirin.",
    },
    {
      stepNumber: 4,
      instruction:
        "Üçüncü gün sonu eti marine sıvısından çıkarın, kağıt havluyla kurulayın. Tencerede tüm yüzeyleri yağsız tavada kızartın.",
      timerSeconds: 480,
    },
    {
      stepNumber: 5,
      instruction:
        "Marine sebzeleri ve sıvının yarısını ekleyin. Kapağı kapatıp kısık ateşte 3 saat yavaş pişirin.",
      timerSeconds: 10800,
    },
    {
      stepNumber: 6,
      instruction:
        "Sosu süzüp gerekirse az una karıştırarak koyulaştırın. Eti dilimleyip sosla servis edin.",
    },
  ],
  tags: ["misafir-sofrasi", "alkollu"],
  hungerBar: 8,
};

async function main() {
  assertDbTarget("insert-sauerbraten");
  const APPLY = process.argv.includes("--apply");
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });

  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`DB: ${new URL(url).host}`);

  const existing = await prisma.recipe.findUnique({
    where: { slug: SAUERBRATEN.slug },
    select: { id: true },
  });
  if (existing) {
    console.log(`SKIP: sauerbraten zaten var (id=${existing.id})`);
    await prisma.$disconnect();
    return;
  }

  if (!APPLY) {
    console.log(
      `DRY-RUN: Sauerbraten DB'de yok, --apply ile ekle. Toplam:`,
    );
    console.log(`  prep ${SAUERBRATEN.prepMinutes} dk + cook ${SAUERBRATEN.cookMinutes} dk + wait ${SAUERBRATEN.totalMinutes - SAUERBRATEN.prepMinutes - SAUERBRATEN.cookMinutes} dk = ${SAUERBRATEN.totalMinutes} dk total`);
    await prisma.$disconnect();
    return;
  }

  // Category lookup
  const category = await prisma.category.findUnique({
    where: { slug: SAUERBRATEN.categorySlug },
    select: { id: true },
  });
  if (!category) {
    throw new Error(`Category not found: ${SAUERBRATEN.categorySlug}`);
  }

  // Tag lookup or create
  const tagIds: string[] = [];
  for (const tagSlug of SAUERBRATEN.tags) {
    const tag = await prisma.tag.findUnique({ where: { slug: tagSlug } });
    if (!tag) {
      console.log(`Tag '${tagSlug}' yok, atla.`);
      continue;
    }
    tagIds.push(tag.id);
  }

  // Insert
  const created = await prisma.recipe.create({
    data: {
      title: SAUERBRATEN.title,
      slug: SAUERBRATEN.slug,
      emoji: SAUERBRATEN.emoji,
      cuisine: SAUERBRATEN.cuisine,
      description: SAUERBRATEN.description,
      type: SAUERBRATEN.type,
      difficulty: SAUERBRATEN.difficulty,
      prepMinutes: SAUERBRATEN.prepMinutes,
      cookMinutes: SAUERBRATEN.cookMinutes,
      totalMinutes: SAUERBRATEN.totalMinutes,
      servingCount: SAUERBRATEN.servingCount,
      averageCalories: SAUERBRATEN.averageCalories,
      protein: SAUERBRATEN.protein,
      carbs: SAUERBRATEN.carbs,
      fat: SAUERBRATEN.fat,
      isFeatured: SAUERBRATEN.isFeatured,
      tipNote: SAUERBRATEN.tipNote,
      servingSuggestion: SAUERBRATEN.servingSuggestion,
      status: SAUERBRATEN.status,
      allergens: SAUERBRATEN.allergens as never[],
      hungerBar: SAUERBRATEN.hungerBar,
      translations: SAUERBRATEN.translations,
      categoryId: category.id,
      ingredients: { create: SAUERBRATEN.ingredients },
      steps: { create: SAUERBRATEN.steps },
      tags: {
        create: tagIds.map((tagId) => ({ tagId })),
      },
    },
    select: { id: true, slug: true },
  });
  console.log(`✅ Eklendi: ${created.slug} (id=${created.id})`);

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
