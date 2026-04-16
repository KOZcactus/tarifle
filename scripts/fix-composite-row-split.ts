/**
 * Split composite ingredient rows — virgülle birleşik ("Tuz, şeker,
 * maydanoz") row'ları ayrı RecipeIngredient kayıtlarına böl.
 *
 * strategy:
 *   "auto"   → --apply ile batch split. Eşit amount veya tekrarlanan tek
 *              amount ile her part için yeni row insert, orijinal row silinir.
 *   "manual" → sadece dry-run'da gösterilir; amount dağıtımı tarife özel
 *              karar gerektirir (örn. "Zeytinyağı, limon, tuz" — 3'ü farklı
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

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const INCLUDE_MANUAL = process.argv.includes("--include-manual");

interface Split {
  slug: string;
  /** Mevcut row'un adı ("Tuz, karabiber" gibi) — match key. */
  currentName: string;
  /** Yeni ingredient'ların her biri. */
  newIngredients: { name: string; amount: string; unit: string }[];
  strategy: "auto" | "manual";
  /** Optional group preserve. */
  preserveGroup?: boolean;
}

// ═══════ SPLITS — Codex2 listesi geldiğinde buraya doldurulacak ═══════
//
// Claude'un audit-composite-rows.ts çıktısı önkontrol için. Codex2'nin
// tarif-özel amount kararları daha güvenilir — final splits Codex2'den gelir.
//
const SPLITS: Split[] = [
  // ═══════ AWAIT CODEX2 LIST ═══════
  // Example format:
  // {
  //   slug: "citir-patates",
  //   currentName: "Tuz, karabiber",
  //   newIngredients: [
  //     { name: "Tuz", amount: "1", unit: "çay kaşığı" },
  //     { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" },
  //   ],
  //   strategy: "auto",
  //   preserveGroup: true,
  // },
];

// ═════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  console.log(
    `🔧 fix-composite-row-split (${APPLY ? "APPLY" : "DRY RUN"}, manual ${INCLUDE_MANUAL ? "IN" : "EX"}cluded) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  if (SPLITS.length === 0) {
    console.log(
      "ℹ️  SPLITS array boş — Codex2 listesi geldiğinde yukarıdaki bloğa ekle.\n" +
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
  if (!APPLY) console.log("(dry run — re-run with --apply)");
}

main()
  .catch((err) => {
    console.error("split failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
