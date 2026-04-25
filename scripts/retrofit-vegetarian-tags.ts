/**
 * Vejetaryen + vegan tag retrofit (oturum 20, DIET_SCORE_PLAN B*).
 *
 * audit-vegetarian-coverage.ts pattern'lerini kullanarak et icermeyen
 * tarifleri "vejetaryen" tag'iyle, hayvansal urun de icermeyen tarifleri
 * "vegan" tag'iyle isaretler.
 *
 * Mantik:
 *   - meatHit yok ise -> vejetaryen tag eklenir (yoksa)
 *   - meatHit + animalHit yok ise -> vegan tag de eklenir (yoksa, vegan
 *     dis kume vejetaryen icinde, her ikisi de baglanir)
 *
 * Idempotent: ayni script tekrar koşturulursa zaten tag'i olan tarifler
 * skip edilir.
 *
 * Kullanim:
 *   npx tsx scripts/retrofit-vegetarian-tags.ts                # dry-run
 *   npx tsx scripts/retrofit-vegetarian-tags.ts --apply         # dev
 *   npx tsx scripts/retrofit-vegetarian-tags.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const APPLY = process.argv.includes("--apply");

// Pattern'ler audit-vegetarian-coverage.ts'den (single source of truth
// gelecekte, simdilik dual-maintain).
const MEAT_PREFIX = [
  "kıyma", "kiyma",
  "dana", "kuzu", "koyun", "sığır", "sigir",
  "biftek", "antrikot", "kontrfile", "bonfile", "pirzola",
  "tavuk", "piliç", "pilic", "hindi", "ördek", "ordek",
  "domuz", "jambon",
  "sucuk", "sosis", "salam", "pastırma", "pastirma",
  "ciğer", "ciger", "böbrek", "bobrek", "yürek", "yurek", "işkembe", "iskembe",
  "balık", "balik",
  "hamsi", "palamut", "lüfer", "lufer", "uskumru", "çipura", "cipura", "levrek",
  "somon", "ton", "trança", "tranca",
  "karides", "kalamar", "ahtapot", "midye", "mussel",
  "barbun", "istavrit", "mezgit",
];

const MEAT_EXACT = ["et", "etli", "etsiz", "kaz"];

const ANIMAL_PRODUCT_PREFIX = [
  "süt", "sut", "yoğurt", "yogurt", "ayran",
  "peynir", "kaşar", "kasar", "lor", "labne", "tulum",
  "ezine", "feta", "mozzarella", "parmesan", "ricotta", "graviera",
  "saganaki", "halloumi", "twarog", "çökelek", "cokelek",
  "tereyağ", "tereyag",
  "yumurta",
  "krema", "kaymak", "kremali", "kremalı",
  "süt tozu", "sut tozu",
  "kurut",
];

const ANIMAL_PRODUCT_EXACT = [
  "bal", "süzme", "manda yogurdu", "kefir",
];

function checkPatterns(name: string, prefixes: string[], exact: string[]): boolean {
  const n = name.toLowerCase().trim();
  const words = n.split(/\s+/);
  for (const e of exact) {
    if (words.includes(e)) return true;
  }
  for (const p of prefixes) {
    for (const w of words) {
      if (w === p || w.startsWith(p)) return true;
    }
  }
  return false;
}

const hasMeat = (name: string) => checkPatterns(name, MEAT_PREFIX, MEAT_EXACT);
const hasAnimalProduct = (name: string) =>
  checkPatterns(name, ANIMAL_PRODUCT_PREFIX, ANIMAL_PRODUCT_EXACT);

async function main() {
  assertDbTarget("retrofit-vegetarian-tags");

  // Tag'leri DB'den oku (var oldugundan emin ol)
  const [vejTag, veganTag] = await Promise.all([
    prisma.tag.findUnique({ where: { slug: "vejetaryen" } }),
    prisma.tag.findUnique({ where: { slug: "vegan" } }),
  ]);
  if (!vejTag || !veganTag) {
    console.error("❌ vejetaryen veya vegan tag DB'de yok. Once tag eklenmeli.");
    process.exit(1);
  }
  console.log("✅ Tag'ler bulundu: vejetaryen(" + vejTag.id + "), vegan(" + veganTag.id + ")\n");

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      ingredients: { select: { name: true } },
      tags: { select: { tagId: true, tag: { select: { slug: true } } } },
    },
  });

  console.log("📊 " + recipes.length + " tarif analiz ediliyor");
  console.log("⚙️  Mode: " + (APPLY ? "APPLY" : "DRY-RUN") + "\n");

  let vejAdded = 0;
  let veganAdded = 0;
  let alreadyVeg = 0;
  let alreadyVegan = 0;
  let omnivore = 0;
  const vejInsertBatch: { recipeId: string; tagId: string }[] = [];
  const veganInsertBatch: { recipeId: string; tagId: string }[] = [];

  for (const r of recipes) {
    const tagSlugs = new Set(r.tags.map((t) => t.tag.slug));
    const meatHit = r.ingredients.some((i) => hasMeat(i.name));
    if (meatHit) {
      omnivore++;
      continue;
    }

    // Vejetaryen aday
    const animalHit = r.ingredients.some((i) => hasAnimalProduct(i.name));
    const isVegan = !animalHit;

    // Vejetaryen tag eklenecek mi
    if (!tagSlugs.has("vejetaryen") && !tagSlugs.has("vegetarian")) {
      vejAdded++;
      vejInsertBatch.push({ recipeId: r.id, tagId: vejTag.id });
    } else {
      alreadyVeg++;
    }

    // Vegan tag eklenecek mi (sadece animalHit yoksa)
    if (isVegan) {
      if (!tagSlugs.has("vegan")) {
        veganAdded++;
        veganInsertBatch.push({ recipeId: r.id, tagId: veganTag.id });
      } else {
        alreadyVegan++;
      }
    }
  }

  console.log("📈 Sonuc:");
  console.log("  Et iceren tarif:                  " + omnivore);
  console.log("  Yeni vejetaryen tag eklenecek:    " + vejAdded);
  console.log("  Yeni vegan tag eklenecek:         " + veganAdded);
  console.log("  Zaten vejetaryen tag'li:          " + alreadyVeg);
  console.log("  Zaten vegan tag'li:               " + alreadyVegan);
  console.log("");

  if (APPLY && (vejInsertBatch.length > 0 || veganInsertBatch.length > 0)) {
    console.log("💾 Tag'ler ekleniyor...");

    if (vejInsertBatch.length > 0) {
      const result = await prisma.recipeTag.createMany({
        data: vejInsertBatch,
        skipDuplicates: true,
      });
      console.log("  vejetaryen +" + result.count);
    }
    if (veganInsertBatch.length > 0) {
      const result = await prisma.recipeTag.createMany({
        data: veganInsertBatch,
        skipDuplicates: true,
      });
      console.log("  vegan +" + result.count);
    }

    console.log("✅ Retrofit tamamlandi");
  } else if (!APPLY) {
    console.log("💡 Apply icin --apply ekle");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
