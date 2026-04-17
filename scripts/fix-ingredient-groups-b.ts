/**
 * Fix Category B: 12 recipes with sauce/marinade ingredients but no
 * `group` field. Adds ingredient grouping to production DB.
 *
 * Run:
 *   npx tsx scripts/fix-ingredient-groups-b.ts --dry-run
 *   npx tsx scripts/fix-ingredient-groups-b.ts
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

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Group assignments by slug + sortOrder ──────────────────
// Each entry maps sortOrder → group label. Only ingredients that
// NEED a group are listed; unlisted sortOrders keep null.
interface GroupMap {
  [sortOrder: number]: string;
}

const FIXES: Record<string, GroupMap> = {
  "butter-chicken": {
    1: "Tavuk için", 2: "Tavuk için", 5: "Tavuk için",
    3: "Sos için", 4: "Sos için", 6: "Sos için",
  },
  "chicken-tikka-masala": {
    1: "Tavuk için", 2: "Tavuk için", 5: "Tavuk için",
    3: "Sos için", 4: "Sos için",
  },
  "bulgogi": {
    1: "Et için",
    2: "Marine için", 3: "Marine için", 4: "Marine için", 5: "Marine için",
  },
  "char-siu": {
    1: "Et için",
    2: "Marine için", 3: "Marine için", 4: "Marine için", 5: "Marine için",
  },
  "bici-bici": {
    1: "Muhallebi için", 2: "Muhallebi için",
    3: "Servis için", 4: "Servis için", 5: "Servis için",
  },
  "galbi": {
    1: "Et için",
    2: "Marine için", 3: "Marine için", 4: "Marine için", 5: "Marine için",
  },
  "dakgalbi": {
    1: "Ana malzeme", 2: "Ana malzeme", 3: "Ana malzeme",
    4: "Sos için", 5: "Sos için",
  },
  "bo-luc-lac": {
    1: "Et için",
    2: "Marine için", 3: "Marine için",
    4: "Servis için", 5: "Servis için",
  },
  "com-tam": {
    1: "Pilav için",
    2: "Et için", 4: "Et için",
    3: "Servis için", 5: "Servis için",
  },
  "cao-lau": {
    1: "Erişte için",
    2: "Et için",
    3: "Marine için",
    4: "Servis için",
  },
  "banh-mi": {
    1: "Sandviç için", 5: "Sandviç için",
    2: "Et için", 6: "Et için",
    3: "Turşu için", 4: "Turşu için",
  },
  "karaage": {
    1: "Tavuk için",
    2: "Marine için", 3: "Marine için",
    4: "Kaplama için",
  },
};

async function main(): Promise<void> {
  assertDbTarget("fix-ingredient-groups-b");
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("❌ DATABASE_URL yok");
    process.exit(1);
  }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  });

  try {
    const host = new URL(databaseUrl).host;
    console.log(
      `\n🔧 fix-ingredient-groups-b ${DRY_RUN ? "(dry-run)" : "(apply)"} → ${host}\n`,
    );

    let totalUpdated = 0;

    for (const [slug, groupMap] of Object.entries(FIXES)) {
      const recipe = await prisma.recipe.findUnique({
        where: { slug },
        select: {
          id: true,
          title: true,
          ingredients: {
            select: { id: true, name: true, sortOrder: true, group: true },
            orderBy: { sortOrder: "asc" },
          },
        },
      });

      if (!recipe) {
        console.log(`  ⚠ ${slug} — tarif bulunamadı`);
        continue;
      }

      console.log(`  ${slug} (${recipe.title}):`);
      let recipeUpdated = 0;

      for (const ing of recipe.ingredients) {
        const newGroup = groupMap[ing.sortOrder];
        if (!newGroup) continue;
        if (ing.group === newGroup) {
          console.log(`    ${ing.sortOrder}. ${ing.name.padEnd(25)} — zaten "${newGroup}"`);
          continue;
        }

        const fromLabel = ing.group ? `"${ing.group}"` : "(yok)";
        console.log(`    ${ing.sortOrder}. ${ing.name.padEnd(25)} — ${fromLabel} → "${newGroup}"`);

        if (!DRY_RUN) {
          await prisma.recipeIngredient.update({
            where: { id: ing.id },
            data: { group: newGroup },
          });
        }
        recipeUpdated++;
      }

      totalUpdated += recipeUpdated;
      console.log(`    → ${recipeUpdated} malzeme güncellendi\n`);
    }

    const verb = DRY_RUN ? "Would update" : "Updated";
    console.log(`${verb}: ${totalUpdated} malzeme across ${Object.keys(FIXES).length} tarif`);
    if (DRY_RUN) console.log("(dry run — DB'ye dokunulmadı)");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
