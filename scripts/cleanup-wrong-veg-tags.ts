/**
 * Yanlış vegan/vejetaryen tag'leri temizle (oturum 20, audit-deep 26 CRITICAL).
 *
 * retrofit-vegetarian-tags.ts ingredient name pattern'lerini kullaniyordu
 * ama Recipe.allergens enum'una bakmiyordu. Sonuc: "Tartar Sos" gibi
 * tarif YUMURTA allergen'i flagli oldugu halde vegan tag'lendi.
 *
 * Bu script:
 *   - allergens'inde YUMURTA / SUT / DENIZ_URUNLERI olan vegan tag'lari kaldirir
 *   - allergens'inde DENIZ_URUNLERI olan vejetaryen tag'lari kaldirir (deniz
 *     urunu et sayilir, vejetaryen tanimi gerekli)
 *
 * Idempotent: zaten dogru olan tarif'lerde bir sey yapmaz.
 *
 * Kullanim:
 *   npx tsx scripts/cleanup-wrong-veg-tags.ts                  # dry-run
 *   npx tsx scripts/cleanup-wrong-veg-tags.ts --apply           # dev
 *   npx tsx scripts/cleanup-wrong-veg-tags.ts --apply --confirm-prod
 */
import { PrismaClient, Allergen } from "@prisma/client";
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

const VEGAN_BLOCKING: Allergen[] = ["YUMURTA", "SUT", "DENIZ_URUNLERI"];
const VEGETARIAN_BLOCKING: Allergen[] = ["DENIZ_URUNLERI"];

async function main() {
  assertDbTarget("cleanup-wrong-veg-tags");

  const [vejTag, veganTag] = await Promise.all([
    prisma.tag.findUnique({ where: { slug: "vejetaryen" } }),
    prisma.tag.findUnique({ where: { slug: "vegan" } }),
  ]);
  if (!vejTag || !veganTag) {
    console.error("❌ vejetaryen veya vegan tag DB'de yok");
    process.exit(1);
  }

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      allergens: true,
      tags: { select: { tag: { select: { slug: true } } } },
    },
  });

  const wrongVegan: { id: string; slug: string; title: string; reason: string }[] = [];
  const wrongVeg: { id: string; slug: string; title: string; reason: string }[] = [];

  for (const r of recipes) {
    const slugs = new Set(r.tags.map((t) => t.tag.slug));
    const blockedVegan = VEGAN_BLOCKING.filter((a) => r.allergens.includes(a));
    const blockedVeg = VEGETARIAN_BLOCKING.filter((a) => r.allergens.includes(a));

    if (slugs.has("vegan") && blockedVegan.length > 0) {
      wrongVegan.push({
        id: r.id,
        slug: r.slug,
        title: r.title,
        reason: blockedVegan.join("+"),
      });
    }
    if (
      (slugs.has("vejetaryen") || slugs.has("vegetarian")) &&
      blockedVeg.length > 0
    ) {
      wrongVeg.push({
        id: r.id,
        slug: r.slug,
        title: r.title,
        reason: blockedVeg.join("+"),
      });
    }
  }

  console.log("📊 Tarama sonucu:");
  console.log("  Yanlış vegan tag (YUMURTA/SUT/DENIZ_URUNLERI):  " + wrongVegan.length);
  console.log("  Yanlış vejetaryen tag (DENIZ_URUNLERI):         " + wrongVeg.length);
  console.log("");

  if (wrongVegan.length > 0) {
    console.log("Yanlış vegan tag'li tarifler (ilk 15):");
    wrongVegan.slice(0, 15).forEach((r, i) => {
      console.log("  " + (i + 1) + ". [" + r.reason + "] " + r.slug);
    });
    console.log("");
  }
  if (wrongVeg.length > 0) {
    console.log("Yanlış vejetaryen tag'li tarifler (ilk 15):");
    wrongVeg.slice(0, 15).forEach((r, i) => {
      console.log("  " + (i + 1) + ". [" + r.reason + "] " + r.slug);
    });
    console.log("");
  }

  if (APPLY && (wrongVegan.length > 0 || wrongVeg.length > 0)) {
    console.log("💾 Yanlış tag'ler kaldırılıyor...");
    if (wrongVegan.length > 0) {
      const result = await prisma.recipeTag.deleteMany({
        where: {
          tagId: veganTag.id,
          recipeId: { in: wrongVegan.map((r) => r.id) },
        },
      });
      console.log("  vegan -" + result.count);
    }
    if (wrongVeg.length > 0) {
      const result = await prisma.recipeTag.deleteMany({
        where: {
          tagId: vejTag.id,
          recipeId: { in: wrongVeg.map((r) => r.id) },
        },
      });
      console.log("  vejetaryen -" + result.count);
    }
    console.log("✅ Cleanup tamamlandı");
  } else if (!APPLY) {
    console.log("💡 Apply için --apply ekle");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
