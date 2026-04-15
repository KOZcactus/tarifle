/**
 * One-shot repair: Revani tarifinin orijinal seed verisinde "Şerbet şekeri"
 * ve "Şerbet suyu" şeklinde yanlış ingredient isimleri vardı — bunlar
 * aslında "Şeker" ve "Su", sadece farklı bir kullanım için (şerbet
 * hazırlama). Yeni `group` alanıyla düzgün bölümleyerek düzeltiyoruz.
 *
 * Idempotent: ikinci kez koşunca "zaten düzenlenmiş" diyerek çıkar.
 *   npx tsx scripts/fix-revani-ingredient-groups.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const recipe = await prisma.recipe.findUnique({
    where: { slug: "revani" },
    select: {
      id: true,
      ingredients: {
        orderBy: { sortOrder: "asc" },
        select: { id: true, name: true, group: true, sortOrder: true },
      },
    },
  });
  if (!recipe) {
    console.log("⚠ Revani bulunamadı. Seed'i çalıştırdın mı?");
    await prisma.$disconnect();
    return;
  }

  const alreadyFixed = recipe.ingredients.some(
    (i) => i.group === "Hamur için" || i.group === "Şerbet için",
  );
  if (alreadyFixed) {
    console.log("✓ Revani zaten düzenlenmiş (group alanları dolu). Çıkılıyor.");
    await prisma.$disconnect();
    return;
  }

  // Target layout — name + group per sortOrder. Amount/unit remain as
  // originally seeded; only name and group are updated here.
  const updates: { match: string; newName: string; group: string }[] = [
    { match: "İrmik", newName: "İrmik", group: "Hamur için" },
    { match: "Un", newName: "Un", group: "Hamur için" },
    { match: "Şeker", newName: "Şeker", group: "Hamur için" }, // the cake sugar
    { match: "Yumurta", newName: "Yumurta", group: "Hamur için" },
    { match: "Yoğurt", newName: "Yoğurt", group: "Hamur için" },
    { match: "Kabartma tozu", newName: "Kabartma tozu", group: "Hamur için" },
    { match: "Şerbet şekeri", newName: "Şeker", group: "Şerbet için" },
    { match: "Şerbet suyu", newName: "Su", group: "Şerbet için" },
    { match: "Limon suyu", newName: "Limon suyu", group: "Şerbet için" },
  ];

  const ops = [];
  for (const u of updates) {
    const hit = recipe.ingredients.find((i) => i.name === u.match);
    if (!hit) {
      console.warn(`  ⚠ "${u.match}" bulunamadı — atlanıyor`);
      continue;
    }
    ops.push(
      prisma.recipeIngredient.update({
        where: { id: hit.id },
        data: { name: u.newName, group: u.group },
      }),
    );
    console.log(
      `  ✏  "${hit.name}" → "${u.newName}"  [${u.group}]`,
    );
  }
  await prisma.$transaction(ops);

  console.log(`\n✅ Revani güncellendi (${ops.length} malzeme).`);
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ fix failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
