/**
 * Restore DB-only slugs back into scripts/seed-recipes.ts.
 *
 * 34 slug var DB'de (prod + dev) ama seed'de yok (duplicate-merge +
 * early-batch drift tortusu). Seed re-run regression riski: bu
 * tarifler DB'den silinmez ama eğer bir gün seed authoritative olmak
 * istenirse bu slug'lar kaybolur.
 *
 * Stratejimiz: DB'den full snapshot çek, legacy IIFE format'ında
 * (batch 12-27 ile uyumlu) bir 'DRIFT RESTORE' bloğu oluştur, seed'in
 * sonundaki `];` bracket'inin üstüne ekle.
 *
 *   npx tsx scripts/restore-missing-slugs-to-seed.ts          # dry (count + preview)
 *   npx tsx scripts/restore-missing-slugs-to-seed.ts --apply  # seed'e yaz
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const SEED = path.resolve(__d, "seed-recipes.ts");

function q(s: string): string {
  return JSON.stringify(s);
}

function formatIngredientLegacy(i: {
  name: string; amount: string; unit: string | null;
  group: string | null; isOptional: boolean;
}): string {
  if (i.group || i.isOptional) {
    // Legacy pipe format cannot encode group/isOptional; omit them for
    // now, safe because these flags are optional. Edge case flagged in
    // summary.
  }
  return q(`${i.name}|${i.amount}|${i.unit ?? ""}`);
}

function formatStepLegacy(s: {
  instruction: string; tip: string | null; timerSeconds: number | null;
}): string {
  if (s.tip) {
    // Legacy cannot encode tip; safe to omit (rare field).
  }
  if (s.timerSeconds !== null) {
    return q(`${s.instruction}||${s.timerSeconds}`);
  }
  return q(s.instruction);
}

/** Translations JSONB -> legacy t(enTitle,enDesc,deTitle,deDesc) helper call
 *  when only title+description are set. Fall back to inline object if Mod B
 *  is full (ingredients + steps also present in translations JSONB).
 */
function formatTranslations(translations: unknown): string {
  if (!translations || typeof translations !== "object") {
    return `t("", "", "", "")`;
  }
  const t = translations as Record<string, Record<string, unknown>>;
  const enTitle = (t.en?.title as string) ?? "";
  const enDesc = (t.en?.description as string) ?? "";
  const deTitle = (t.de?.title as string) ?? "";
  const deDesc = (t.de?.description as string) ?? "";
  // If Mod B extended fields present, emit full object literal (legacy
  // helper only wraps title+description).
  const hasEnIng = Array.isArray(t.en?.ingredients);
  const hasDeIng = Array.isArray(t.de?.ingredients);
  if (hasEnIng || hasDeIng) {
    return JSON.stringify(translations);
  }
  return `t(${q(enTitle)}, ${q(enDesc)}, ${q(deTitle)}, ${q(deDesc)})`;
}

interface Recipe {
  id: string;
  title: string;
  slug: string;
  emoji: string | null;
  cuisine: string;
  description: string;
  categorySlug: string;
  type: string;
  difficulty: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number;
  protein: number;
  carbs: number;
  fat: number;
  hungerBar: number | null;
  isFeatured: boolean;
  tipNote: string | null;
  servingSuggestion: string | null;
  allergens: string[];
  translations: unknown;
  tags: string[];
  ingredients: {
    name: string; amount: string; unit: string | null;
    group: string | null; isOptional: boolean;
  }[];
  steps: { instruction: string; tip: string | null; timerSeconds: number | null }[];
}

function formatRecipe(r: Recipe): string {
  const parts: string[] = [
    `title: ${q(r.title)}`,
    `slug: ${q(r.slug)}`,
    r.emoji ? `emoji: ${q(r.emoji)}` : `emoji: "🍽️"`,
    `cuisine: ${q(r.cuisine)}`,
    `description: ${q(r.description)}`,
    `categorySlug: ${q(r.categorySlug)}`,
    `type: ${q(r.type)}`,
    `difficulty: ${q(r.difficulty)}`,
    `prepMinutes: ${r.prepMinutes}`,
    `cookMinutes: ${r.cookMinutes}`,
    `totalMinutes: ${r.totalMinutes}`,
    `servingCount: ${r.servingCount}`,
    `averageCalories: ${r.averageCalories}`,
    `protein: ${r.protein}`,
    `carbs: ${r.carbs}`,
    `fat: ${r.fat}`,
    `isFeatured: ${r.isFeatured}`,
    r.tipNote ? `tipNote: ${q(r.tipNote)}` : null,
    r.servingSuggestion ? `servingSuggestion: ${q(r.servingSuggestion)}` : null,
    `tags: ${JSON.stringify(r.tags)}`,
    `allergens: ${JSON.stringify(r.allergens)} as const`,
    `translations: ${formatTranslations(r.translations)}`,
    `ingredients: [${r.ingredients.map(formatIngredientLegacy).join(",")}]`,
    `steps: [${r.steps.map(formatStepLegacy).join(",")}]`,
  ].filter(Boolean) as string[];

  return `      r({ ${parts.join(", ")} }),`;
}

async function main() {
  const apply = process.argv.includes("--apply");
  assertDbTarget("restore-missing-slugs-to-seed");
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const source = fs.readFileSync(SEED, "utf-8");
    const all = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        id: true, slug: true, title: true, emoji: true,
        cuisine: true, description: true, type: true, difficulty: true,
        prepMinutes: true, cookMinutes: true, totalMinutes: true,
        servingCount: true, averageCalories: true, protein: true,
        carbs: true, fat: true, hungerBar: true, isFeatured: true,
        tipNote: true, servingSuggestion: true, allergens: true,
        translations: true,
        category: { select: { slug: true } },
        ingredients: {
          select: { name: true, amount: true, unit: true, group: true, isOptional: true },
          orderBy: { sortOrder: "asc" },
        },
        steps: {
          select: { instruction: true, tip: true, timerSeconds: true },
          orderBy: { stepNumber: "asc" },
        },
        tags: { select: { tag: { select: { slug: true } } } },
      },
      orderBy: { slug: "asc" },
    });

    const missing = all.filter((r) => !source.includes(`slug: "${r.slug}"`));
    console.log(`  total DB recipes: ${all.length}`);
    console.log(`  missing from seed: ${missing.length}`);
    console.log(`  slugs:`);
    for (const r of missing) console.log(`    ${r.slug}`);

    if (missing.length === 0) {
      console.log(`\n  nothing to restore, seed in sync`);
      return;
    }

    const mapped: Recipe[] = missing.map((r) => ({
      id: r.id,
      title: r.title,
      slug: r.slug,
      emoji: r.emoji,
      cuisine: r.cuisine ?? "tr",
      description: r.description,
      categorySlug: r.category?.slug ?? "diger",
      type: r.type,
      difficulty: r.difficulty,
      prepMinutes: r.prepMinutes ?? 0,
      cookMinutes: r.cookMinutes ?? 0,
      totalMinutes: r.totalMinutes ?? 0,
      servingCount: r.servingCount ?? 1,
      averageCalories: r.averageCalories ?? 0,
      protein: r.protein ?? 0,
      carbs: r.carbs ?? 0,
      fat: r.fat ?? 0,
      hungerBar: r.hungerBar,
      isFeatured: r.isFeatured ?? false,
      tipNote: r.tipNote,
      servingSuggestion: r.servingSuggestion,
      allergens: r.allergens as string[],
      translations: r.translations,
      tags: r.tags.map((t) => t.tag.slug),
      ingredients: r.ingredients.map((i) => ({
        name: i.name,
        amount: i.amount,
        unit: i.unit,
        group: i.group,
        isOptional: i.isOptional ?? false,
      })),
      steps: r.steps.map((s) => ({
        instruction: s.instruction,
        tip: s.tip,
        timerSeconds: s.timerSeconds,
      })),
    }));

    // Build a new IIFE block with the same helper shape as legacy batches
    const lines: string[] = [
      `  // ── DRIFT RESTORE (${new Date().toISOString().slice(0, 10)}, ${mapped.length} tarif) ──`,
      `  ...(() => {`,
      `    const t = (enTitle: string, enDescription: string, deTitle: string, deDescription: string) => ({ en: { title: enTitle, description: enDescription }, de: { title: deTitle, description: deDescription } });`,
      `    const ing = (specs: string[]) => specs.map((s, i) => { const [name, amount, unit] = s.split("|"); return { name, amount, unit, sortOrder: i + 1 }; });`,
      `    const st = (specs: string[]) => specs.map((s, i) => { const [instruction, timer] = s.split("||"); return timer ? { stepNumber: i + 1, instruction, timerSeconds: Number(timer) } : { stepNumber: i + 1, instruction }; });`,
      `    const r = (o: Omit<SeedRecipe, "ingredients" | "steps"> & { ingredients: string[] | ReturnType<typeof ing>; steps: string[] | ReturnType<typeof st> }) => ({ ...o, ingredients: Array.isArray(o.ingredients) && typeof o.ingredients[0] === "string" ? ing(o.ingredients as string[]) : o.ingredients as ReturnType<typeof ing>, steps: Array.isArray(o.steps) && typeof o.steps[0] === "string" ? st(o.steps as string[]) : o.steps as ReturnType<typeof st> });`,
      `    return [`,
      ...mapped.map(formatRecipe),
      `    ];`,
      `  })(),`,
    ];
    const block = lines.join("\n");

    // Locate the final `];` bracket (outermost recipes array close)
    const finalBracketRe = /\n\];\s*$/m;
    const match = finalBracketRe.exec(source);
    if (!match) {
      console.error(`\n❌ cannot locate final '];' in seed`);
      process.exit(1);
    }
    const insertAt = match.index + 1; // keep leading newline
    const newSource = source.slice(0, insertAt) + block + "\n" + source.slice(insertAt);

    console.log(`\n  block length: ${block.length} chars`);
    console.log(`  first 2 recipe lines preview:`);
    for (const l of block.split("\n").slice(7, 9)) console.log(`    ${l.slice(0, 150)}...`);

    if (apply) {
      fs.writeFileSync(SEED, newSource, "utf-8");
      console.log(`\n✅ wrote ${mapped.length} tarif to seed (DRIFT RESTORE block appended)`);
    } else {
      console.log(`\n  dry-run, re-run with --apply to write.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
