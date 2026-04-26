/**
 * /admin/kalite top 10 listesini standalone CLI'a yansit.
 * Editor manuel rafine icin issue + score detay.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { computeAllergenConfidence } from "../src/lib/recipe/allergen-confidence";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

const MIN_STEPS_BY_TYPE: Record<string, number> = {
  YEMEK: 5,
  CORBA: 5,
  SALATA: 5,
  TATLI: 5,
  KAHVALTI: 5,
  ATISTIRMALIK: 4,
  APERATIF: 4,
  KOKTEYL: 4,
  ICECEK: 3,
  SOS: 3,
};

interface Issue {
  code: string;
  weight: number;
  detail?: string;
}

async function main() {
  const url = process.env.DATABASE_URL!;
  const adapter = new PrismaNeon({ connectionString: url });
  const prisma = new PrismaClient({ adapter });
  console.log(`DB: ${new URL(url).host}`);

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      type: true,
      cuisine: true,
      description: true,
      tipNote: true,
      servingSuggestion: true,
      allergens: true,
      _count: { select: { steps: true } },
      ingredients: { select: { name: true } },
    },
  });

  const scored = recipes.map((r) => {
    const issues: Issue[] = [];
    if (r.description.length < 50) {
      issues.push({ code: "shortDesc", weight: 20, detail: `${r.description.length}c` });
    } else if (r.description.split(/\s+/).length < 12) {
      issues.push({ code: "fewWords", weight: 5 });
    }
    if (!r.tipNote || r.tipNote.length < 8) {
      issues.push({ code: "missingTip", weight: 10 });
    }
    if (!r.servingSuggestion || r.servingSuggestion.length < 8) {
      issues.push({ code: "missingSug", weight: 10 });
    }
    const minSteps = MIN_STEPS_BY_TYPE[r.type] ?? 4;
    if (r._count.steps < minSteps) {
      issues.push({
        code: "shortSteps",
        weight: 20,
        detail: `${r._count.steps}/${minSteps}`,
      });
    }
    const conf = computeAllergenConfidence(r.allergens, r.ingredients);
    if (conf.extraInferred.length > 0) {
      issues.push({
        code: "missingAllergen",
        weight: 15 * conf.extraInferred.length,
        detail: conf.extraInferred.join(", "),
      });
    }
    if (conf.extraDeclared.length > 0) {
      issues.push({
        code: "extraDeclared",
        weight: 3 * conf.extraDeclared.length,
        detail: conf.extraDeclared.join(", "),
      });
    }
    const totalScore = issues.reduce((s, i) => s + i.weight, 0);
    return { ...r, issues, totalScore };
  });

  const top = scored
    .filter((r) => r.totalScore > 0)
    .sort((a, b) => b.totalScore - a.totalScore)
    .slice(0, 10);

  console.log(`\nTop 10 weakest published recipes (${recipes.length} total):`);
  console.log("=".repeat(80));
  for (const r of top) {
    console.log(`\n[${r.totalScore}] ${r.title} [${r.cuisine}/${r.type}]`);
    console.log(`  slug: ${r.slug}`);
    console.log(`  desc: "${r.description.slice(0, 80)}${r.description.length > 80 ? "..." : ""}" (${r.description.length}c)`);
    console.log(`  tipNote: ${r.tipNote ? `"${r.tipNote.slice(0, 60)}..."` : "NULL"}`);
    console.log(`  servingSuggestion: ${r.servingSuggestion ? `"${r.servingSuggestion.slice(0, 60)}..."` : "NULL"}`);
    console.log(`  steps: ${r._count.steps} (min ${MIN_STEPS_BY_TYPE[r.type] ?? 4})`);
    console.log(`  allergens: [${r.allergens.join(", ")}]`);
    console.log(`  issues:`);
    for (const i of r.issues) {
      console.log(`    - ${i.code} (+${i.weight})${i.detail ? ` [${i.detail}]` : ""}`);
    }
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
