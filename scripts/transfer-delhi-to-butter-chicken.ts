/**
 * Mod IB sonrasi tek-tarif icerik transferi: silinen
 * `delhi-butter-chicken` Delhi otantik versiyonunun zenginlik
 * unsurlarini canonical `butter-chicken` slug'ina aktarir.
 *
 * Aktarim kapsami (hafif merge, mevcut "ev versiyon" karakterini
 * korur):
 *
 *   1. ingredient ekle: Zencefil (1 yk) + Sarimsak (4 dis)
 *      - step 1 zaten "yogurt, limon suyu, sarimsak ve baharatla
 *        kaplayin" diyor ama sarimsak ingredient list'te yok (Kural 6
 *        ihlali). Iki ekleme hem ihlali duzeltir hem otantik Delhi
 *        baharat tabani verir.
 *      - sortOrder zincirine eklenir (mevcut max + 1, max + 2)
 *      - group: "Tavuk icin"
 *      - idempotent: ayni isimde ingredient varsa create yapmaz
 *
 *   2. tipNote update: 30 dk minimum + 3 saat ideal Delhi otantik
 *      tadi + zencefil/sarimsak ezmesi notu
 *      - mevcut tipNote'u arsivler (AuditLog metadata'da)
 *
 *   3. AuditLog: action="DELHI_BUTTER_MERGE", metadata: origin slug,
 *      eklenen ingredient'lar, eski/yeni tipNote
 *
 * Idempotent: aynki tipNote zaten yazılmissa veya ingredient'lar
 * zaten varsa skip + log "zaten guncel".
 *
 * Source seed-recipes.ts senkronu BU scriptte YAPILMAZ (DB primary,
 * source rollback icin sekonder; ayri smart-source-clean tipinde
 * pass'e birakilir).
 *
 * Usage:
 *   npx tsx scripts/transfer-delhi-to-butter-chicken.ts            # dry-run
 *   npx tsx scripts/transfer-delhi-to-butter-chicken.ts --apply    # dev
 *   npx tsx scripts/transfer-delhi-to-butter-chicken.ts --apply --confirm-prod
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

// --env prod ile .env.production.local yuklenir (prod DB hedefler);
// default .env.local (dev DB). migrate-prod.ts pattern'iyle paralel.
const envIdx = process.argv.indexOf("--env");
const envTarget = envIdx >= 0 && process.argv[envIdx + 1] === "prod" ? "prod" : "dev";
const envFile = envTarget === "prod" ? ".env.production.local" : ".env.local";
dotenv.config({
  path: path.resolve(__dirname2, "..", envFile),
  override: true,
});

const NEW_TIPNOTE =
  "Tavuğu yoğurtlu marinada en az 30 dakika bekletin, otantik Delhi tadı için 3 saate kadar uzatabilirsiniz. Zencefil ve sarımsak ezmesi marinaya yumuşak baharat tabanı verir.";

interface IngredientToAdd {
  name: string;
  amount: string;
  unit: string;
  group: string;
}

const INGREDIENTS_TO_ADD: IngredientToAdd[] = [
  { name: "Zencefil", amount: "1", unit: "yemek kaşığı", group: "Tavuk için" },
  { name: "Sarımsak", amount: "4", unit: "diş", group: "Tavuk için" },
];

async function main() {
  assertDbTarget("transfer-delhi-to-butter-chicken");
  const APPLY = process.argv.includes("--apply");

  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`DB: ${new URL(url).host}`);
  console.log("");

  const recipe = await prisma.recipe.findUnique({
    where: { slug: "butter-chicken" },
    select: {
      id: true,
      slug: true,
      title: true,
      tipNote: true,
      status: true,
      ingredients: {
        select: { id: true, name: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  if (!recipe) {
    console.error("butter-chicken DB'de yok");
    await prisma.$disconnect();
    process.exit(1);
  }
  if (recipe.status !== "PUBLISHED") {
    console.error(`butter-chicken status=${recipe.status} (PUBLISHED bekleniyor)`);
    await prisma.$disconnect();
    process.exit(1);
  }

  const existingNames = new Set(
    recipe.ingredients.map((i) => i.name.toLocaleLowerCase("tr")),
  );
  const maxSortOrder = recipe.ingredients.reduce(
    (m, i) => Math.max(m, i.sortOrder),
    0,
  );

  const toCreate = INGREDIENTS_TO_ADD.filter(
    (i) => !existingNames.has(i.name.toLocaleLowerCase("tr")),
  );
  const tipNoteChanged = recipe.tipNote !== NEW_TIPNOTE;

  console.log(`Mevcut ingredient sayisi: ${recipe.ingredients.length}`);
  console.log(`Eklenecek ingredient: ${toCreate.length}/${INGREDIENTS_TO_ADD.length}`);
  for (const i of toCreate) {
    console.log(`  + ${i.name} (${i.amount} ${i.unit})`);
  }
  for (const i of INGREDIENTS_TO_ADD) {
    if (existingNames.has(i.name.toLocaleLowerCase("tr"))) {
      console.log(`  ~ ${i.name} (zaten var, skip)`);
    }
  }
  console.log("");
  console.log(`tipNote degisecek: ${tipNoteChanged ? "EVET" : "HAYIR (zaten guncel)"}`);
  if (tipNoteChanged) {
    console.log(`  ESKI: ${recipe.tipNote ?? "(null)"}`);
    console.log(`  YENI: ${NEW_TIPNOTE}`);
  }

  if (toCreate.length === 0 && !tipNoteChanged) {
    console.log("");
    console.log("Hicbir degisiklik yok (idempotent skip).");
    await prisma.$disconnect();
    return;
  }

  if (!APPLY) {
    console.log("");
    console.log("DRY-RUN. --apply ile DB'ye yaz.");
    await prisma.$disconnect();
    return;
  }

  await prisma.$transaction(async (tx) => {
    for (const [idx, i] of toCreate.entries()) {
      await tx.recipeIngredient.create({
        data: {
          recipeId: recipe.id,
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          sortOrder: maxSortOrder + 1 + idx,
          group: i.group,
        },
      });
    }
    if (tipNoteChanged) {
      await tx.recipe.update({
        where: { id: recipe.id },
        data: { tipNote: NEW_TIPNOTE },
      });
    }
    await tx.auditLog.create({
      data: {
        action: "DELHI_BUTTER_MERGE",
        targetType: "recipe",
        targetId: recipe.id,
        metadata: {
          slug: "butter-chicken",
          origin_slug: "delhi-butter-chicken",
          added_ingredients: toCreate.map((i) => i.name),
          tipNote_old: recipe.tipNote ?? null,
          tipNote_new: NEW_TIPNOTE,
          notes:
            "Mod IB silinen delhi-butter-chicken Delhi otantik versiyonunun baharat marine zenginlik unsurlari (zencefil + sarimsak ezmesi + uzun marine tavsiyesi) butter-chicken global slug'ina aktarildi. Ev versiyon karakteri korundu (kompakt step + saniyeler).",
        },
      },
    });
  });

  console.log("");
  console.log(`OK butter-chicken updated (${toCreate.length} ingredient added, tipNote ${tipNoteChanged ? "updated" : "unchanged"})`);
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
