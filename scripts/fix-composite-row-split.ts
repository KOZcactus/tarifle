/**
 * Split composite ingredient rows, virgülle birleşik ("Tuz, şeker,
 * maydanoz") row'ları ayrı RecipeIngredient kayıtlarına böl.
 *
 * strategy:
 *   "auto"   → --apply ile batch split. Eşit amount veya tekrarlanan tek
 *              amount ile her part için yeni row insert, orijinal row silinir.
 *   "manual" → sadece dry-run'da gösterilir; amount dağıtımı tarife özel
 *              karar gerektirir (örn. "Zeytinyağı, limon, tuz", 3'ü farklı
 *              form).
 *
 * Kullanım:
 *   npx tsx scripts/fix-composite-row-split.ts             # dry run
 *   npx tsx scripts/fix-composite-row-split.ts --apply     # auto'yu yaz
 *   npx tsx scripts/fix-composite-row-split.ts --include-manual --apply
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const INCLUDE_MANUAL = process.argv.includes("--include-manual");

interface Split {
  slug: string;
  /** Mevcut row'un adı ("Tuz, karabiber" gibi), match key. */
  currentName: string;
  /** Yeni ingredient'ların her biri. */
  newIngredients: { name: string; amount: string; unit: string }[];
  strategy: "auto" | "manual";
  /** Optional group preserve. */
  preserveGroup?: boolean;
}

// ═══════ SPLITS, Codex2 listesi geldiğinde buraya doldurulacak ═══════
//
// Claude'un audit-composite-rows.ts çıktısı önkontrol için. Codex2'nin
// tarif-özel amount kararları daha güvenilir, final splits Codex2'den gelir.
//
const SPLITS: Split[] = [
  // ═══════ Codex2 list (2026-04-17, 24 rows) ═══════
  // AUTO (7): orijinal row'un amount/unit'i boş, split de boş, güvenli
  { slug: "imam-bayildi", currentName: "Tuz, şeker, maydanoz", newIngredients: [{ name: "Tuz", amount: "", unit: "" }, { name: "Şeker", amount: "", unit: "" }, { name: "Maydanoz", amount: "", unit: "" }], strategy: "auto", preserveGroup: true },
  { slug: "kuru-fasulye", currentName: "Tuz, karabiber, pul biber", newIngredients: [{ name: "Tuz", amount: "", unit: "" }, { name: "Karabiber", amount: "", unit: "" }, { name: "Pul biber", amount: "", unit: "" }], strategy: "auto", preserveGroup: true },
  { slug: "coban-salatasi", currentName: "Zeytinyağı, limon, tuz", newIngredients: [{ name: "Zeytinyağı", amount: "", unit: "" }, { name: "Limon", amount: "", unit: "" }, { name: "Tuz", amount: "", unit: "" }], strategy: "auto", preserveGroup: true },
  { slug: "tavuk-sote", currentName: "Sıvı yağ, tuz, baharatlar", newIngredients: [{ name: "Sıvı yağ", amount: "", unit: "" }, { name: "Tuz", amount: "", unit: "" }, { name: "Baharatlar", amount: "", unit: "" }], strategy: "auto", preserveGroup: true },
  { slug: "humus", currentName: "Zeytinyağı, tuz, kimyon", newIngredients: [{ name: "Zeytinyağı", amount: "", unit: "" }, { name: "Tuz", amount: "", unit: "" }, { name: "Kimyon", amount: "", unit: "" }], strategy: "auto", preserveGroup: true },
  { slug: "menemen", currentName: "Tuz, karabiber, pul biber", newIngredients: [{ name: "Tuz", amount: "", unit: "" }, { name: "Karabiber", amount: "", unit: "" }, { name: "Pul biber", amount: "", unit: "" }], strategy: "auto", preserveGroup: true },
  { slug: "mercimek-corbasi", currentName: "Tuz, karabiber, kimyon", newIngredients: [{ name: "Tuz", amount: "", unit: "" }, { name: "Karabiber", amount: "", unit: "" }, { name: "Kimyon", amount: "", unit: "" }], strategy: "auto", preserveGroup: true },
  // MANUAL (17): orijinal amount/unit dolu ama split için ratio kararı manuel
  { slug: "firinda-tavuk-baget", currentName: "Tuz, karabiber", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "tavuk-sis", currentName: "Tuz, karabiber", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "lahmacun", currentName: "Pul biber, tuz", newIngredients: [{ name: "Pul biber", amount: "0.5", unit: "çay kaşığı" }, { name: "Tuz", amount: "1", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "patates-oturtma", currentName: "Tuz, karabiber, kimyon", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }, { name: "Kimyon", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "cig-kofte", currentName: "Taze soğan, maydanoz", newIngredients: [{ name: "Taze soğan", amount: "0.5", unit: "demet" }, { name: "Maydanoz", amount: "0.5", unit: "demet" }], strategy: "manual", preserveGroup: true },
  { slug: "cig-kofte", currentName: "Tuz, kimyon", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Kimyon", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "citir-patates", currentName: "Tuz, karabiber", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "zeytinyagli-fasulye", currentName: "Tuz, şeker", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Şeker", amount: "1", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "etli-nohut", currentName: "Tuz, karabiber", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "kabak-mucveri", currentName: "Tuz, karabiber", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "sucuklu-yumurta", currentName: "Tuz, karabiber", newIngredients: [{ name: "Tuz", amount: "0.5", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "karniyarik", currentName: "Tuz, karabiber", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "yaprak-sarma", currentName: "Tuz, karabiber, yenibahar", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }, { name: "Yenibahar", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "ali-nazik", currentName: "Tuz, pul biber", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Pul biber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "ezogelin-corbasi", currentName: "Nane, pul biber", newIngredients: [{ name: "Nane", amount: "1", unit: "çay kaşığı" }, { name: "Pul biber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "iskender-kebap", currentName: "Tuz, karabiber", newIngredients: [{ name: "Tuz", amount: "1", unit: "çay kaşığı" }, { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
  { slug: "acili-ezme", currentName: "Pul biber, tuz", newIngredients: [{ name: "Pul biber", amount: "1", unit: "çay kaşığı" }, { name: "Tuz", amount: "1", unit: "çay kaşığı" }], strategy: "manual", preserveGroup: true },
];

// ═════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  assertDbTarget("fix-composite-row-split");
  console.log(
    `🔧 fix-composite-row-split (${APPLY ? "APPLY" : "DRY RUN"}, manual ${INCLUDE_MANUAL ? "IN" : "EX"}cluded) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  if (SPLITS.length === 0) {
    console.log(
      "ℹ️  SPLITS array boş, Codex2 listesi geldiğinde yukarıdaki bloğa ekle.\n" +
      "    scripts/audit-composite-rows.ts çıktısı önkontrol için.",
    );
    return;
  }

  let willSplit = 0;
  let skipManual = 0;
  let alreadyDone = 0;

  const runSplit = async (split: Split): Promise<void> => {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: split.slug },
      select: {
        id: true,
        ingredients: {
          select: { id: true, name: true, sortOrder: true, group: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });
    if (!recipe) {
      console.error(`  ❌ ${split.slug} not in DB`);
      return;
    }

    const target = recipe.ingredients.find((i) => i.name === split.currentName);
    if (!target) {
      // Check if already split (new names present)
      const allNewPresent = split.newIngredients.every((n) =>
        recipe.ingredients.some((i) => i.name === n.name),
      );
      if (allNewPresent) {
        alreadyDone++;
        return;
      }
      console.error(
        `  ❌ ${split.slug}: "${split.currentName}" not found (current: ${recipe.ingredients.map((i) => i.name).join(" | ")})`,
      );
      return;
    }

    willSplit++;
    console.log(
      `  ${split.slug.padEnd(28)} "${split.currentName}" → ${split.newIngredients.map((n) => `${n.amount} ${n.unit} ${n.name}`).join(" | ")}`,
    );

    if (APPLY) {
      const baseSort = target.sortOrder;
      const preservedGroup = split.preserveGroup ? target.group : null;
      // Shift existing rows with sortOrder > target
      const laterRows = recipe.ingredients.filter((i) => i.sortOrder > baseSort);
      const shift = split.newIngredients.length - 1;

      await prisma.$transaction([
        prisma.recipeIngredient.delete({ where: { id: target.id } }),
        ...laterRows.map((row) =>
          prisma.recipeIngredient.update({
            where: { id: row.id },
            data: { sortOrder: row.sortOrder + shift },
          }),
        ),
        ...split.newIngredients.map((n, idx) =>
          prisma.recipeIngredient.create({
            data: {
              recipeId: recipe.id,
              name: n.name,
              amount: n.amount,
              unit: n.unit,
              sortOrder: baseSort + idx,
              group: preservedGroup,
            },
          }),
        ),
      ]);
    }
  };

  console.log("--- AUTO splits ---");
  for (const s of SPLITS.filter((x) => x.strategy === "auto")) {
    await runSplit(s);
  }

  console.log("\n--- MANUAL splits ---");
  for (const s of SPLITS.filter((x) => x.strategy === "manual")) {
    if (!INCLUDE_MANUAL) {
      skipManual++;
      console.log(
        `  ${s.slug.padEnd(28)} SKIP (manual): "${s.currentName}" → ${s.newIngredients.map((n) => `${n.amount} ${n.unit} ${n.name}`).join(" | ")}`,
      );
      continue;
    }
    await runSplit(s);
  }

  const verb = APPLY ? "Split" : "Would split";
  console.log(
    `\n${verb}: ${willSplit} row(s) | Skipped (already done): ${alreadyDone} | Skipped (manual): ${skipManual}`,
  );
  if (!APPLY) console.log("(dry run, re-run with --apply)");
}

main()
  .catch((err) => {
    console.error("split failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
