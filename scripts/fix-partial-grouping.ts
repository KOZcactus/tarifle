/**
 * Fix 13 partial-grouping WARNINGs: each recipe has 2+ ingredient groups
 * but 1 ingredient sits ungrouped. Two strategies:
 *
 *   1. Transfer — add the stray ingredient to the most-related existing
 *      group (e.g. fındık on şekerpare → "Hamur için" since it's bastırılır
 *      onto the dough ball)
 *   2. Flatten — clear all groups in the recipe when the stray ingredient
 *      doesn't meaningfully fit any bucket (frying oil, whole rice as
 *      main component, etc.)
 *
 *   npx tsx scripts/fix-partial-grouping.ts              # dry run
 *   npx tsx scripts/fix-partial-grouping.ts --apply      # write
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

type Action =
  | { kind: "transfer"; slug: string; ingredientName: string; newGroup: string; reason: string }
  | { kind: "flatten"; slug: string; reason: string };

const ACTIONS: Action[] = [
  {
    kind: "transfer", slug: "peynirli-gozleme", ingredientName: "Tereyağı",
    newGroup: "İç için", reason: "Peynirli iç yağlanır",
  },
  {
    kind: "transfer", slug: "peynirli-pogaca", ingredientName: "Yumurta sarısı",
    newGroup: "Hamur için", reason: "Hamur üstüne sürülür",
  },
  {
    kind: "transfer", slug: "sekerpare", ingredientName: "Fındık",
    newGroup: "Hamur için", reason: "Hamur topunun üstüne bastırılır",
  },
  {
    kind: "transfer", slug: "cannoli", ingredientName: "Antep fıstığı",
    newGroup: "Dolgu için", reason: "Dolgu süslemesi",
  },
  {
    kind: "transfer", slug: "kunafa-arap-usulu", ingredientName: "Antep fıstığı",
    newGroup: "Tatlı için", reason: "Tatlının süslemesi",
  },
  {
    kind: "transfer", slug: "sambousek", ingredientName: "Yoğurt",
    newGroup: "İç için", reason: "İçle birlikte servis yoğurdu",
  },
  {
    kind: "transfer", slug: "kayseri-yaglamasi", ingredientName: "Yoğurt",
    newGroup: "Sos için", reason: "Sos yoğurtlu",
  },
  // Flatten — frying oil or main ingredient with no clear bucket fit
  { kind: "flatten", slug: "lokma-tatlisi", reason: "Sıvı yağ kızartma için, mevcut gruplara uymuyor" },
  { kind: "flatten", slug: "ciborek", reason: "Sıvı yağ kızartma için" },
  // Tulumba "Hamur için" + "Şerbet için" ikisinde "Su" var — flatten
  // duplicate Su yaratırdı. Sıvı yağ'ı hamur grubuna at (kızartma hamur
  // prosedürünün uzantısı), yapı korunsun.
  {
    kind: "transfer", slug: "tulumba-tatlisi", ingredientName: "Sıvı yağ",
    newGroup: "Hamur için", reason: "Kızartma hamur prosedürünün parçası; Su duplicate engellemek için flatten değil transfer",
  },
  { kind: "flatten", slug: "sebzeli-dumpling", reason: "Un hamur grubu yok, partial yapı" },
  { kind: "flatten", slug: "com-tam", reason: "Kırık pirinç ana malzeme, grup yapısı tutarsız" },
  { kind: "flatten", slug: "bo-luc-lac", reason: "Dana bonfile ana malzeme, grup yapısı tutarsız" },
];

async function main(): Promise<void> {
  assertDbTarget("fix-partial-grouping");
  console.log(
    `🔧 fix-partial-grouping (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  let transfers = 0;
  let flattens = 0;

  for (const action of ACTIONS) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: action.slug },
      select: {
        id: true,
        ingredients: { select: { id: true, name: true, group: true } },
      },
    });
    if (!recipe) {
      console.error(`❌ Slug not in DB: ${action.slug}`);
      continue;
    }

    if (action.kind === "transfer") {
      const ing = recipe.ingredients.find((i) => i.name === action.ingredientName);
      if (!ing) {
        console.error(`❌ ${action.slug}: ingredient "${action.ingredientName}" not found`);
        continue;
      }
      if (ing.group === action.newGroup) continue;
      transfers++;
      console.log(
        `  TRANSFER  ${action.slug.padEnd(28)} "${ing.name}" (${ing.group ?? "null"} → ${action.newGroup})  — ${action.reason}`,
      );
      if (APPLY) {
        await prisma.recipeIngredient.update({
          where: { id: ing.id },
          data: { group: action.newGroup },
        });
      }
    } else {
      const hasAnyGroup = recipe.ingredients.some((i) => i.group !== null);
      if (!hasAnyGroup) continue;
      flattens++;
      console.log(
        `  FLATTEN   ${action.slug.padEnd(28)} (clear all groups)  — ${action.reason}`,
      );
      if (APPLY) {
        await prisma.recipeIngredient.updateMany({
          where: { recipeId: recipe.id, group: { not: null } },
          data: { group: null },
        });
      }
    }
  }

  const verb = APPLY ? "Applied" : "Would apply";
  console.log(`\n${verb}: ${transfers} transfer(s) + ${flattens} flatten(s)`);
  if (!APPLY) console.log("(dry run — re-run with --apply to write)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
