/**
 * Fix 3 ingredient-step drift TR tarifleri (Codex backfill-08 issues):
 *
 *   dereotlu-olivier-salatasi: step 2 turşu bahsediyor, ingredient'te yok
 *     + title 'Dereotlu' ama dereotu da eksik
 *   kolbaszli-lecso: Macar sosis ingredient'te, step'te geçmiyor
 *   cevizli-medovik: title 'Cevizli' ama ingredient'te ceviz yok
 *
 * Her tarife minimum fix: eksik ingredient'i ekle, ilgili step'i
 * güncelle (veya yeni step ekle). Bölgesel/kültürel tarif tutarlılığı
 * esas; kornişon turşusu olivier salatasında klasik, ceviz medovik
 * katları arası geleneksel.
 *
 *   npx tsx scripts/fix-backfill08-issues.ts             # dry
 *   npx tsx scripts/fix-backfill08-issues.ts --apply     # dev
 *   DATABASE_URL=<prod> ... --apply --confirm-prod       # prod
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

interface IngredientAdd {
  name: string; amount: string; unit: string; sortOrder: number;
}

interface StepUpdate {
  stepNumber: number; newInstruction: string;
}

interface Fix {
  slug: string;
  reason: string;
  addIngredients?: IngredientAdd[];
  updateSteps?: StepUpdate[];
}

const FIXES: Fix[] = [
  {
    slug: "dereotlu-olivier-salatasi",
    reason: "step 2 turşu var ingredient'te yok + title dereotlu ama dereotu eksik",
    addIngredients: [
      { name: "Kornişon turşusu", amount: "100", unit: "gr", sortOrder: 5 },
      { name: "Dereotu", amount: "0.25", unit: "demet", sortOrder: 6 },
    ],
    updateSteps: [
      {
        stepNumber: 2,
        newInstruction: "Bezelye ve küp doğranmış turşuyla karıştırın.",
      },
      {
        stepNumber: 3,
        newInstruction: "Mayonez ve ince kıyılmış dereotuyla harmanlayıp soğutun.",
      },
    ],
  },
  {
    slug: "kolbaszli-lecso",
    reason: "Macar sosis ingredient'te var ama step'te geçmiyor",
    updateSteps: [
      {
        stepNumber: 2,
        newInstruction:
          "Biberleri ve dilimlenmiş Macar sosisi ekleyip 8 dakika soteleyin.",
      },
    ],
  },
  {
    slug: "cevizli-medovik",
    reason: "title cevizli ama ingredient'te ceviz yok, katlar arası ceviz klasik",
    addIngredients: [
      { name: "Ceviz içi", amount: "100", unit: "gr", sortOrder: 5 },
    ],
    updateSteps: [
      {
        stepNumber: 3,
        newInstruction:
          "Ekşi kremayla katlayıp aralarına iri kıyılmış cevizi serpip dinlendirin.",
      },
    ],
  },
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-backfill08-issues");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    for (const f of FIXES) {
      const r = await prisma.recipe.findUnique({
        where: { slug: f.slug },
        select: {
          id: true,
          slug: true,
          ingredients: { select: { id: true, name: true, sortOrder: true } },
          steps: { select: { id: true, stepNumber: true, instruction: true } },
        },
      });
      if (!r) {
        console.log(`  ⚠  not found: ${f.slug}`);
        continue;
      }
      console.log(`\n=== ${f.slug}  (${f.reason})`);

      if (f.addIngredients) {
        for (const ing of f.addIngredients) {
          const exists = r.ingredients.find(
            (i) => i.name.toLowerCase() === ing.name.toLowerCase(),
          );
          if (exists) {
            console.log(`  ⏭  ingredient already present: ${ing.name}`);
            continue;
          }
          console.log(
            `  ${apply ? "✅" : "•"} ADD ingredient ${ing.sortOrder}. ${ing.name} ${ing.amount} ${ing.unit}`,
          );
          if (apply) {
            await prisma.recipeIngredient.create({
              data: {
                recipeId: r.id,
                name: ing.name,
                amount: ing.amount,
                unit: ing.unit,
                sortOrder: ing.sortOrder,
              },
            });
          }
        }
      }

      if (f.updateSteps) {
        for (const st of f.updateSteps) {
          const existing = r.steps.find((s) => s.stepNumber === st.stepNumber);
          if (!existing) {
            console.log(`  ⚠  step ${st.stepNumber} not found`);
            continue;
          }
          if (existing.instruction === st.newInstruction) {
            console.log(`  ⏭  step ${st.stepNumber} already matches`);
            continue;
          }
          console.log(`  ${apply ? "✅" : "•"} UPDATE step ${st.stepNumber}`);
          console.log(`      was: ${existing.instruction}`);
          console.log(`      now: ${st.newInstruction}`);
          if (apply) {
            await prisma.recipeStep.update({
              where: { id: existing.id },
              data: { instruction: st.newInstruction },
            });
          }
        }
      }
    }
    console.log(`\n${apply ? "applied" : "dry-run"}, re-run with --apply to write.`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
