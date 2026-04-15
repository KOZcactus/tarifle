/**
 * Multi-recipe ingredient group retrofit.
 *
 * Some seed recipes were authored with composite ingredient names like
 * "Şerbet şekeri" (really: "Şeker" for the şerbet section) or with
 * parenthetical section hints like "Leblebi (servis)". Both hurt matching
 * (AI asistan keys on ingredient names) and readability. The `group` column
 * added in the previous change gives us a clean separation channel; this
 * script applies per-recipe mappings and is idempotent — re-running after
 * a partial edit just skips already-grouped recipes.
 *
 *   npx tsx scripts/fix-ingredient-groups.ts             # apply
 *   npx tsx scripts/fix-ingredient-groups.ts --dry-run   # preview
 *
 * Adding a new recipe to the mapping? Put it in RECIPE_FIXES below and
 * update scripts/seed-recipes.ts with the same `group` values so fresh
 * seeds stay aligned. The script doesn't read from seed-recipes.ts — it's
 * the source of truth for which rows to mutate in an already-seeded DB.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const DRY_RUN = process.argv.includes("--dry-run");

/**
 * Per-recipe instruction. `matchName` is the EXACT current ingredient name
 * in DB (case-sensitive). `newName` is applied when it differs from matchName
 * (e.g. "Şerbet şekeri" → "Şeker"). `group` is the section header to set.
 */
type IngredientFix = {
  matchName: string;
  newName?: string;
  group: string;
};

const RECIPE_FIXES: Record<string, IngredientFix[]> = {
  revani: [
    { matchName: "İrmik", group: "Hamur için" },
    { matchName: "Un", group: "Hamur için" },
    { matchName: "Şeker", group: "Hamur için" },
    { matchName: "Yumurta", group: "Hamur için" },
    { matchName: "Yoğurt", group: "Hamur için" },
    { matchName: "Kabartma tozu", group: "Hamur için" },
    { matchName: "Şerbet şekeri", newName: "Şeker", group: "Şerbet için" },
    { matchName: "Şerbet suyu", newName: "Su", group: "Şerbet için" },
    { matchName: "Limon suyu", group: "Şerbet için" },
  ],
  baklava: [
    { matchName: "Baklava yufkası", group: "Baklava için" },
    { matchName: "Ceviz içi", group: "Baklava için" },
    { matchName: "Tereyağı", group: "Baklava için" },
    { matchName: "Şeker", group: "Şerbet için" },
    { matchName: "Su", group: "Şerbet için" },
    { matchName: "Limon suyu", group: "Şerbet için" },
  ],
  kunefe: [
    { matchName: "Tel kadayıf", group: "Künefe için" },
    { matchName: "Künefe peyniri", group: "Künefe için" },
    { matchName: "Tereyağı (eritilmiş)", group: "Künefe için" },
    { matchName: "Antep fıstığı", group: "Künefe için" },
    { matchName: "Şeker", group: "Şerbet için" },
    { matchName: "Su", group: "Şerbet için" },
    { matchName: "Limon suyu", group: "Şerbet için" },
  ],
  manti: [
    { matchName: "Un", group: "Hamur için" },
    { matchName: "Yumurta", group: "Hamur için" },
    { matchName: "Su", group: "Hamur için" },
    { matchName: "Kıyma", group: "İç harç için" },
    { matchName: "Soğan (rendelenmiş)", group: "İç harç için" },
    { matchName: "Yoğurt", group: "Sos için" },
    { matchName: "Sarımsak", group: "Sos için" },
    { matchName: "Tereyağı", group: "Sos için" },
    { matchName: "Pul biber", group: "Sos için" },
  ],
  lahmacun: [
    { matchName: "Un", group: "Hamur için" },
    { matchName: "Su", group: "Hamur için" },
    { matchName: "Maya", group: "Hamur için" },
    { matchName: "Kıyma", group: "Harç için" },
    { matchName: "Soğan", group: "Harç için" },
    { matchName: "Domates", group: "Harç için" },
    { matchName: "Biber salçası", group: "Harç için" },
    { matchName: "Maydanoz", group: "Harç için" },
    { matchName: "Pul biber, tuz", group: "Harç için" },
  ],
  "ali-nazik": [
    { matchName: "Kuşbaşı kuzu eti", group: "Üstü için" },
    { matchName: "Tereyağı", group: "Üstü için" },
    { matchName: "Tuz, pul biber", group: "Üstü için" },
    { matchName: "Patlıcan", group: "Tabanı için" },
    { matchName: "Süzme yoğurt", group: "Tabanı için" },
    { matchName: "Sarımsak", group: "Tabanı için" },
  ],
  "hunkar-begendi": [
    { matchName: "Kuşbaşı kuzu eti", group: "Et sosu için" },
    { matchName: "Soğan", group: "Et sosu için" },
    { matchName: "Domates", group: "Et sosu için" },
    { matchName: "Patlıcan", group: "Beğendi için" },
    { matchName: "Tereyağı", group: "Beğendi için" },
    { matchName: "Un", group: "Beğendi için" },
    { matchName: "Süt", group: "Beğendi için" },
    { matchName: "Kaşar peyniri", group: "Beğendi için" },
  ],
  boza: [
    { matchName: "Leblebi (servis)", newName: "Leblebi", group: "Servis için" },
  ],
};

async function applyRecipe(
  slug: string,
  fixes: IngredientFix[],
): Promise<{ slug: string; touched: number; skipped: number }> {
  const recipe = await prisma.recipe.findUnique({
    where: { slug },
    select: {
      id: true,
      ingredients: {
        select: { id: true, name: true, group: true },
      },
    },
  });
  if (!recipe) {
    console.warn(`  ⚠ ${slug}: tarif bulunamadı — atlanıyor`);
    return { slug, touched: 0, skipped: 0 };
  }

  let touched = 0;
  let skipped = 0;

  for (const fix of fixes) {
    const hit = recipe.ingredients.find((i) => i.name === fix.matchName);
    if (!hit) {
      console.warn(
        `  ⚠ ${slug}: "${fix.matchName}" bulunamadı — atlanıyor (belki isim değişti?)`,
      );
      continue;
    }

    const nextName = fix.newName ?? hit.name;
    const alreadyAligned = hit.group === fix.group && hit.name === nextName;
    if (alreadyAligned) {
      skipped++;
      continue;
    }

    const label =
      hit.name !== nextName
        ? `"${hit.name}" → "${nextName}" [${fix.group}]`
        : `"${hit.name}" [${fix.group}]`;
    console.log(`  ✏  ${slug}: ${label}`);

    if (!DRY_RUN) {
      await prisma.recipeIngredient.update({
        where: { id: hit.id },
        data: { name: nextName, group: fix.group },
      });
    }
    touched++;
  }

  return { slug, touched, skipped };
}

async function main() {
  console.log(
    `\n🧩 Ingredient group retrofit ${DRY_RUN ? "(dry-run)" : ""}`,
  );
  console.log(`   ${Object.keys(RECIPE_FIXES).length} tarif tarayacak.\n`);

  let totalTouched = 0;
  let totalSkipped = 0;

  for (const [slug, fixes] of Object.entries(RECIPE_FIXES)) {
    const r = await applyRecipe(slug, fixes);
    totalTouched += r.touched;
    totalSkipped += r.skipped;
  }

  const verb = DRY_RUN ? "Would update" : "Updated";
  console.log(
    `\n${verb} ${totalTouched} ingredient(s) · Already aligned: ${totalSkipped}`,
  );
  if (DRY_RUN) console.log("(dry run — no writes)");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ retrofit failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
