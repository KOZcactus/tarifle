/**
 * Batch fix: pantry staple eksikliği (audit-content STEP_INGREDIENT_MISSING).
 *
 * Audit 430 HIGH bulgu: tarif step text'inde tuz/karabiber/pul biber/un
 * mention edilmiş ama ingredient list'te yok. UX: kullanıcı tarif
 * eksik gibi görür. Profesyonel tarif her staple'ı miktarla yazar.
 *
 * KULLANICI DİREKTİFİ (oturum 34): "tarifi en doğru şekilde verelim,
 * eksik ya da hatalı bir şey olmasın". Bu yüzden:
 * 1. SABIT default amount değil, tip + servingCount duyarlı matrix
 * 2. TATLI/KOKTEYL/ICECEK SKIP (tuz/karabiber/pul biber default ekleme
 *    bu tip'lerde yanlış olur, "bir tutam" düzeyi step text'te bile
 *    güvenilmez)
 * 3. Un kapsam dışı (kaplama/bağlama/harç farklı amaçlar, default amount
 *    riskli)
 * 4. Default --apply YOK, önce CSV preview + manuel review
 *
 * Amount matrix (DB'de mevcut tarif pattern'lerinden gözlemlenen
 * dağılımı yansıtır, en yaygın default'lar):
 *   YEMEK/CORBA + serving 1-4:  Tuz 1 çay kaşığı, Karabiber 0.5 ç.k., Pul biber 0.5 ç.k.
 *   YEMEK/CORBA + serving 5-8:  Tuz 1 tatlı kaşığı, Karabiber 1 ç.k., Pul biber 0.5 ç.k.
 *   YEMEK/CORBA + serving 9+:   Tuz 1.5 tatlı kaşığı, Karabiber 1 ç.k., Pul biber 1 ç.k.
 *   SALATA/SOS/APERATIF/ATISTIRMALIK/KAHVALTI: Tuz 0.5 ç.k., Karabiber 0.25 ç.k., Pul biber 0.25 ç.k.
 *
 * Idempotent: ingredient zaten varsa atlar (case-insensitive name match).
 * AuditLog action INGREDIENT_RETROFIT.
 *
 * Usage:
 *   npx tsx scripts/fix-missing-pantry-staples.ts                    # dev DRY-RUN + CSV
 *   npx tsx scripts/fix-missing-pantry-staples.ts --apply            # dev apply
 *   npx tsx scripts/fix-missing-pantry-staples.ts --apply --confirm-prod  # prod apply
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);

const APPLY = process.argv.includes("--apply");
const isProd = process.argv.includes("--confirm-prod");
const envFile = isProd ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

interface Staple {
  re: RegExp;
  name: string;
}

// audit-content STEP_BASELINE_PATTERNS ile aynı regex'ler.
const STAPLES: Staple[] = [
  { re: /(?:^|[\s,;.!?/()\-])tuz(?=$|[\s,;.!?/()\-lu])/i, name: "Tuz" },
  { re: /(?:^|[\s,;.!?/()\-])karabiber(?=$|[\s,;.!?/()\-li])/i, name: "Karabiber" },
  { re: /(?:^|[\s,;.!?/()\-])pul biber(?=$|[\s,;.!?/()\-li])/i, name: "Pul biber" },
];

const SKIP_TYPES = new Set(["TATLI", "KOKTEYL", "ICECEK"]);

interface Defaults {
  amount: string;
  unit: string;
}

function getDefaults(
  staple: string,
  type: string,
  servingCount: number,
): Defaults {
  const isMain = type === "YEMEK" || type === "CORBA";
  if (isMain) {
    if (servingCount >= 9) {
      if (staple === "Tuz") return { amount: "1.5", unit: "tatlı kaşığı" };
      if (staple === "Karabiber") return { amount: "1", unit: "çay kaşığı" };
      return { amount: "1", unit: "çay kaşığı" }; // pul biber
    }
    if (servingCount >= 5) {
      if (staple === "Tuz") return { amount: "1", unit: "tatlı kaşığı" };
      if (staple === "Karabiber") return { amount: "1", unit: "çay kaşığı" };
      return { amount: "0.5", unit: "çay kaşığı" }; // pul biber
    }
    // serving 1-4
    if (staple === "Tuz") return { amount: "1", unit: "çay kaşığı" };
    if (staple === "Karabiber") return { amount: "0.5", unit: "çay kaşığı" };
    return { amount: "0.5", unit: "çay kaşığı" }; // pul biber
  }
  // SALATA/SOS/APERATIF/ATISTIRMALIK/KAHVALTI
  if (staple === "Tuz") return { amount: "0.5", unit: "çay kaşığı" };
  if (staple === "Karabiber") return { amount: "0.25", unit: "çay kaşığı" };
  return { amount: "0.25", unit: "çay kaşığı" }; // pul biber
}

function ingredientHasName(ingredients: { name: string }[], target: string): boolean {
  const t = target.toLocaleLowerCase("tr-TR");
  return ingredients.some((i) => i.name.toLocaleLowerCase("tr-TR").includes(t));
}

interface PlannedFix {
  recipeId: string;
  recipeSlug: string;
  type: string;
  servingCount: number;
  staple: string;
  amount: string;
  unit: string;
  sortOrder: number;
}

async function main(): Promise<void> {
  await assertDbTarget("fix-missing-pantry-staples");

  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipes = await prisma.recipe.findMany({
    select: {
      id: true,
      slug: true,
      type: true,
      servingCount: true,
      ingredients: { select: { id: true, name: true, sortOrder: true } },
      steps: { select: { instruction: true } },
    },
  });

  console.log(`Total recipes: ${recipes.length}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const planned: PlannedFix[] = [];
  let skippedByType = 0;
  let alreadyHas = 0;

  for (const r of recipes) {
    if (SKIP_TYPES.has(r.type)) {
      skippedByType++;
      continue;
    }
    const stepText = r.steps.map((s) => s.instruction).join(" ");
    const maxSort = r.ingredients.reduce((m, i) => Math.max(m, i.sortOrder), 0);
    let sortOffset = 1;
    for (const staple of STAPLES) {
      if (!staple.re.test(stepText)) continue;
      if (ingredientHasName(r.ingredients, staple.name)) {
        alreadyHas++;
        continue;
      }
      const def = getDefaults(staple.name, r.type, r.servingCount);
      planned.push({
        recipeId: r.id,
        recipeSlug: r.slug,
        type: r.type,
        servingCount: r.servingCount,
        staple: staple.name,
        amount: def.amount,
        unit: def.unit,
        sortOrder: maxSort + sortOffset,
      });
      sortOffset++;
    }
  }

  // CSV preview output
  const csvPath = path.resolve(
    __dirname2,
    "..",
    `docs/pantry-staples-fix-plan-${isProd ? "prod" : "dev"}.csv`,
  );
  const csvLines = [
    "recipeSlug,type,servingCount,staple,amount,unit",
    ...planned.map(
      (p) => `${p.recipeSlug},${p.type},${p.servingCount},${p.staple},${p.amount},${p.unit}`,
    ),
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");

  const breakdown: Record<string, number> = {};
  const byType: Record<string, number> = {};
  for (const p of planned) {
    breakdown[p.staple] = (breakdown[p.staple] ?? 0) + 1;
    byType[p.type] = (byType[p.type] ?? 0) + 1;
  }

  console.log(`Skipped by type (TATLI/KOKTEYL/ICECEK): ${skippedByType}`);
  console.log(`Already has ingredient: ${alreadyHas}`);
  console.log(`\nPlanned fixes: ${planned.length}`);
  console.log(`  By staple:`);
  for (const [name, count] of Object.entries(breakdown).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${name}: ${count}`);
  }
  console.log(`  By type:`);
  for (const [type, count] of Object.entries(byType).sort((a, b) => b[1] - a[1])) {
    console.log(`    ${type}: ${count}`);
  }
  console.log(`\nCSV preview: ${csvPath}`);

  if (!APPLY) {
    console.log("\nDry-run, kayıt yapılmadı. Apply için --apply.");
    await prisma.$disconnect();
    return;
  }

  // APPLY
  let applied = 0;
  for (const p of planned) {
    const created = await prisma.recipeIngredient.create({
      data: {
        recipeId: p.recipeId,
        name: p.staple,
        amount: p.amount,
        unit: p.unit,
        sortOrder: p.sortOrder,
      },
    });
    await prisma.auditLog.create({
      data: {
        action: "INGREDIENT_RETROFIT",
        targetType: "RecipeIngredient",
        targetId: created.id,
        metadata: {
          recipeSlug: p.recipeSlug,
          recipeType: p.type,
          servingCount: p.servingCount,
          added: { name: p.staple, amount: p.amount, unit: p.unit },
          reason: "audit-content STEP_INGREDIENT_MISSING pantry staple retrofit (tip+serving matrix)",
        },
      },
    });
    applied++;
  }

  console.log(`\nAPPLIED: ${applied} ingredient retrofit'i`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
