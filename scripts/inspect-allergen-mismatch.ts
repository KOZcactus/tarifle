/**
 * Top 10 quality issue tariflerin ingredient + allergen detayini cek.
 * computeAllergenConfidence ne neden yanlis inferring yapiyor goster.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { computeAllergenConfidence } from "../src/lib/recipe/allergen-confidence";
import {
  ingredientMatchesAllergen,
  ALLERGEN_RULES,
} from "../src/lib/allergen-matching";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

const SLUGS = [
  "americano",
  "pao-de-queijo-waffle-brezilya-usulu",
  "corekotlu-mercimek-corbasi-kayseri-usulu",
  "firinda-tavuk-baget",
  "turos-palacsinta-kup-macaristan-usulu",
];

async function main() {
  const url = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString: url });
  const prisma = new PrismaClient({ adapter });
  console.log(`DB: ${new URL(url).host}`);

  const recipes = await prisma.recipe.findMany({
    where: { slug: { in: SLUGS } },
    select: {
      slug: true,
      title: true,
      allergens: true,
      ingredients: { select: { name: true } },
    },
  });

  for (const r of recipes) {
    console.log(`\n=== ${r.title} [${r.slug}] ===`);
    console.log(`declared: [${r.allergens.join(", ")}]`);
    console.log(`ingredients (${r.ingredients.length}):`);
    for (const i of r.ingredients) {
      const matches = ALLERGEN_RULES.filter((rule) =>
        ingredientMatchesAllergen(i.name, rule),
      ).map((rule) => rule.allergen);
      console.log(`  - "${i.name}"${matches.length > 0 ? ` -> [${matches.join(", ")}]` : ""}`);
    }
    const conf = computeAllergenConfidence(r.allergens, r.ingredients);
    console.log(`inferred: [${conf.inferred.join(", ")}]`);
    console.log(`extraInferred (eksik tag): [${conf.extraInferred.join(", ")}]`);
    console.log(`extraDeclared (false-pos): [${conf.extraDeclared.join(", ")}]`);
  }

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
