/**
 * Vejetaryen/vegan tag coverage audit (oturum 20, DIET_SCORE_PLAN B*).
 *
 * Mevcut tag durumu + et icermeyen tariflerin tespiti:
 *   1. vejetaryen / vegan / etsiz tag'leri var mi, kac tarif?
 *   2. Et iceren ingredient regex'le tarama (positive list yerine
 *      negative list daha guvenli, "tavuk gogsu" vs "tavuk soslu" gibi
 *      false-positive engelle)
 *   3. Hayvansal urun listesi (vegan icin daha sıkı): süt, yoğurt,
 *      peynir, tereyağı, yumurta, bal, vb.
 *
 * Cikti: dev DB hangi tariflerin tag eksik, kac yeni tag eklenebilir,
 * vejetaryen + vegan + omnivor breakdown.
 *
 * Kullanim: npx tsx scripts/audit-vegetarian-coverage.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

// Pattern matching strategy:
//  - PREFIX: ingredient name kelime sininin basinda match (et, eti, etli)
//  - EXACT_WORD: tum ingredient adi tam pattern (et tek basina; "etiket"
//    yanlis match yapmasin diye)
// Turkce ek/cekim yapilarina karsi prefix yaklaiimi: "peynir" -> "peyniri",
// "peynirli", "peynirin" otomatik kapsanir.

// Et + balik + deniz urunu, prefix-match (hayvansal protein kelime stemleri)
const MEAT_PREFIX = [
  "kıyma", "kiyma",
  "dana", "kuzu", "koyun", "sığır", "sigir",
  "biftek", "antrikot", "kontrfile", "bonfile", "pirzola",
  "tavuk", "piliç", "pilic", "hindi", "ördek", "ordek",
  "domuz", "jambon",
  "sucuk", "sosis", "salam", "pastırma", "pastirma",
  "ciğer", "ciger", "böbrek", "bobrek", "yürek", "yurek", "işkembe", "iskembe",
  // Balik + deniz urunu
  "balık", "balik",
  "hamsi", "palamut", "lüfer", "lufer", "uskumru", "çipura", "cipura", "levrek",
  "somon", "ton", "trança", "tranca",
  "karides", "kalamar", "ahtapot", "midye", "mussel",
  "barbun", "istavrit", "mezgit",
];

// Et-bazli kelimelerin tam-kelime versiyonu (et basina cok aggressive).
const MEAT_EXACT = [
  "et", "etli", "etsiz", // "et" alone, with -li/-siz suffix exact
  "kaz",
  // koftet exact match birakildi, mercimek koftesi gibi degisik tipler
  // ingredient'larda zaten ayri var (mercimek + un + ...).
];

// Vegan ihlal eden hayvansal urun (peynir, sut, yumurta, vb.).
const ANIMAL_PRODUCT_PREFIX = [
  "süt", "sut", "yoğurt", "yogurt", "ayran",
  "peynir", "kaşar", "kasar", "lor", "labne", "tulum",
  "ezine", "feta", "mozzarella", "parmesan", "ricotta", "graviera",
  "saganaki", "halloumi", "twarog", "çökelek", "cokelek",
  "tereyağ", "tereyag",
  "yumurta",
  "krema", "kaymak", "kremali", "kremalı",
  "süt tozu", "sut tozu",
];

const ANIMAL_PRODUCT_EXACT = [
  "bal",  // honey, exact word; "balık" ayri pattern'da
  "süzme", // hep yogurt anlaminda kullanilir Turkce'de
  "manda yogurdu", "kefir",
];

interface PatternResult {
  matched: boolean;
  reason?: string;
}

function checkPatterns(
  name: string,
  prefixes: string[],
  exact: string[],
): PatternResult {
  const n = name.toLowerCase().trim();
  const words = n.split(/\s+/);

  // Exact word match anywhere in tokens
  for (const e of exact) {
    if (words.includes(e)) return { matched: true, reason: `exact:${e}` };
  }

  // Prefix match: any token starts with prefix
  for (const p of prefixes) {
    for (const w of words) {
      if (w === p || w.startsWith(p)) {
        return { matched: true, reason: `prefix:${p}->${w}` };
      }
    }
  }
  return { matched: false };
}

function hasMeat(name: string): PatternResult {
  return checkPatterns(name, MEAT_PREFIX, MEAT_EXACT);
}

function hasAnimalProduct(name: string): PatternResult {
  return checkPatterns(name, ANIMAL_PRODUCT_PREFIX, ANIMAL_PRODUCT_EXACT);
}

async function main() {
  console.log("═══════════════════════════════════════════════════════════");
  console.log("  Vejetaryen/Vegan Tag Coverage Audit");
  console.log("═══════════════════════════════════════════════════════════\n");

  // 1. Mevcut tag durumu
  const tags = await prisma.tag.findMany({
    where: {
      slug: { in: ["vejetaryen", "vegetarian", "vegan", "vejeteryan", "etsiz"] },
    },
    select: { slug: true, name: true, _count: { select: { recipeTags: true } } },
  });
  console.log("1. MEVCUT TAG DURUMU");
  if (tags.length === 0) {
    console.log("   Hiç vejetaryen/vegan tag bulunamadi");
  } else {
    tags.forEach((t) => console.log("   " + t.slug + " | " + t.name + " | " + t._count.recipeTags + " tarif"));
  }
  console.log("");

  // 2. Tum published tarifleri ingredient'lariyla cek
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      ingredients: { select: { name: true, isOptional: true } },
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });

  console.log("2. TARIFLER ANALIZ EDILIYOR (" + recipes.length + " tarif)\n");

  let isVegetarian = 0;
  let isVegan = 0;
  let hasMeatTagged = 0;
  let alreadyHasVegTag = 0;
  let alreadyHasVeganTag = 0;
  const candidateVegetarian: { slug: string; title: string }[] = [];
  const candidateVegan: { slug: string; title: string }[] = [];

  for (const r of recipes) {
    const slugs = new Set(r.tags.map((t) => t.tag.slug));
    const ingNames = r.ingredients.map((i) => i.name);

    const meatHit = ingNames.some((n) => hasMeat(n).matched);
    const animalHit = ingNames.some((n) => hasAnimalProduct(n).matched);

    if (meatHit) hasMeatTagged++;

    if (slugs.has("vejetaryen") || slugs.has("vegetarian")) alreadyHasVegTag++;
    if (slugs.has("vegan")) alreadyHasVeganTag++;

    if (!meatHit) {
      isVegetarian++;
      if (!slugs.has("vejetaryen") && !slugs.has("vegetarian")) {
        candidateVegetarian.push({ slug: r.slug, title: r.title });
      }
      if (!animalHit) {
        isVegan++;
        if (!slugs.has("vegan")) {
          candidateVegan.push({ slug: r.slug, title: r.title });
        }
      }
    }
  }

  console.log("3. SONUC OZETI");
  console.log("   Et iceren tarif:                  " + hasMeatTagged + " (%" + ((hasMeatTagged / recipes.length) * 100).toFixed(0) + ")");
  console.log("   Vejetaryen tarif (et yok):        " + isVegetarian + " (%" + ((isVegetarian / recipes.length) * 100).toFixed(0) + ")");
  console.log("   Vegan tarif (hayvansal urun yok): " + isVegan + " (%" + ((isVegan / recipes.length) * 100).toFixed(0) + ")");
  console.log("");
  console.log("   Mevcut vejetaryen tag'li:         " + alreadyHasVegTag);
  console.log("   Mevcut vegan tag'li:              " + alreadyHasVeganTag);
  console.log("   Yeni vejetaryen tag adayi:        " + candidateVegetarian.length);
  console.log("   Yeni vegan tag adayi:             " + candidateVegan.length);
  console.log("");

  console.log("4. ORNEK YENI VEJETARYEN ADAY (ilk 15)");
  candidateVegetarian.slice(0, 15).forEach((r, i) => {
    console.log("   " + (i + 1) + ". " + r.slug + ": " + r.title.slice(0, 60));
  });
  console.log("");
  console.log("5. ORNEK YENI VEGAN ADAY (ilk 15)");
  candidateVegan.slice(0, 15).forEach((r, i) => {
    console.log("   " + (i + 1) + ". " + r.slug + ": " + r.title.slice(0, 60));
  });

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
