/**
 * Mod K title-leak ROUND 3: cümle ortası title temizlik (oturum 34).
 *
 * Round 1 + 2 cümle başı title'ları temizledi (1445 step). Kalan 171
 * step'in çoğu **cümle ortasında** title geçiyor:
 *   "..., {Title} servis dengesi korunur"
 *   "..., {Title} için ölçü şaşmasın"
 *   "Soğanı çevirin, {title} tabanı çiğ kalmasın"
 *   "böylece {Title} servis dengesi korunur"
 *   "böylece {Title} için hazır tutun"
 *
 * Bu script güvenli pattern'leri yakalar:
 *   ", {Title} servis dengesi"      → ", servis dengesi"
 *   ", {Title} için {kalan}"        → ", {kalan}"
 *   ", {Title} tabanı"              → ", tabanı"
 *   "böylece {Title} servis dengesi" → "böylece servis dengesi"
 *   "böylece {Title} için"          → "böylece"
 *
 * Suffix bitişik durumlar (Title{u/yi/yu}) skip, riskli, manuel review.
 *
 * Idempotent: title kalmayan step skip. AuditLog STEP_TITLE_LEAK_FIX.
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

/**
 * Cümle ortası title-leak strip. Sadece güvenli pattern'leri yakalar.
 * Title sonrası boşluk + bilinen leksikal kelime (için, servis, tabanı,
 * vs.) → strip. Suffix bitişik (Titleyi, Titleyu) skip.
 */
function stripMidSentence(instruction: string, title: string): string | null {
  const lower = instruction.toLocaleLowerCase("tr-TR");
  const tLower = title.toLocaleLowerCase("tr-TR");

  // Title cümle başında değil, ortada (idx > 0)
  const idx = lower.indexOf(tLower);
  if (idx <= 0) return null;

  const afterTitleStart = idx + title.length;
  const afterTitle = instruction.slice(afterTitleStart);

  // Suffix bitişik (Titleyi, Titleyu, Titlenu) → skip
  if (afterTitle.length > 0 && /^[a-zçğıöşüâîû]/i.test(afterTitle)) {
    return null;
  }

  // Title öncesi karakter: ", " veya " " olmalı (cümle ortası, yanlış kelime
  // başı değil)
  const before = instruction.slice(0, idx);
  const beforeTrim = before.trimEnd();
  const lastChar = beforeTrim.slice(-1);
  if (!/[,.;:\s]/.test(lastChar) && beforeTrim !== "") return null;

  const afterTitleTrimmed = afterTitle.trim();
  const afterLower = afterTitleTrimmed.toLocaleLowerCase("tr-TR");

  // Safe pattern listesi (cümle ortası):
  const stripPatterns: { prefix: string; replacement: string }[] = [
    { prefix: "için ", replacement: "" }, // ", Title için X" → ", X"
    { prefix: "servis dengesi", replacement: "servis dengesi" }, // ", Title servis dengesi" → ", servis dengesi"
    { prefix: "için hazır tutun", replacement: "hazır tutun" },
    { prefix: "için ölçü şaşmasın", replacement: "ölçü şaşmasın" },
    { prefix: "tabanı", replacement: "taban" },
    { prefix: "servis dengesi korunur", replacement: "servis dengesi korunur" },
    { prefix: "tamamlanınca", replacement: "tamamlanınca" },
  ];

  let found = false;
  let stripped = "";
  for (const sp of stripPatterns) {
    if (afterLower.startsWith(sp.prefix)) {
      stripped = sp.replacement + afterTitleTrimmed.slice(sp.prefix.length);
      found = true;
      break;
    }
  }
  if (!found) return null;

  // Birleştir: before + (space if needed) + replacement + remaining
  let result = beforeTrim;
  if (result.endsWith(",")) result = result + " ";
  else if (!/\s$/.test(result) && stripped) result = result + " ";
  result = result + stripped;

  // Çoklu boşluk normalize
  result = result.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim();

  // Sanity: en az %40 length, en az 15 char
  if (result.length < 15 || result.length < instruction.length * 0.4) return null;

  return result;
}

interface PlannedFix {
  recipeSlug: string;
  recipeTitle: string;
  stepId: string;
  stepNumber: number;
  before: string;
  after: string;
}

async function main(): Promise<void> {
  await assertDbTarget("fix-mod-k-mid-sentence-title");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipes = await prisma.recipe.findMany({
    select: {
      slug: true,
      title: true,
      steps: { select: { id: true, stepNumber: true, instruction: true } },
    },
  });

  console.log(`Total recipes: ${recipes.length}`);
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const planned: PlannedFix[] = [];
  for (const r of recipes) {
    const titleParts = r.title.split(/\s+/).filter((w) => w.length >= 3);
    if (titleParts.length < 2) continue; // single-word skip
    for (const s of r.steps) {
      const newText = stripMidSentence(s.instruction, r.title);
      if (newText === null) continue;
      if (newText === s.instruction) continue;
      planned.push({
        recipeSlug: r.slug,
        recipeTitle: r.title,
        stepId: s.id,
        stepNumber: s.stepNumber,
        before: s.instruction,
        after: newText,
      });
    }
  }

  // CSV preview
  const csvPath = path.resolve(
    __dirname2,
    "..",
    `docs/mod-k-mid-sentence-fix-plan-${isProd ? "prod" : "dev"}.csv`,
  );
  const escape = (s: string): string => `"${s.replace(/"/g, '""')}"`;
  const csvLines = [
    "recipeSlug,recipeTitle,stepNumber,before,after",
    ...planned.map((p) => `${p.recipeSlug},${escape(p.recipeTitle)},${p.stepNumber},${escape(p.before)},${escape(p.after)}`),
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");

  console.log(`Planlı step fix: ${planned.length}`);
  console.log(`Sample (ilk 8):`);
  for (const p of planned.slice(0, 8)) {
    console.log(`\n  [${p.recipeSlug}] step ${p.stepNumber}`);
    console.log(`  ÖNCE:  ${p.before.slice(0, 110)}`);
    console.log(`  SONRA: ${p.after.slice(0, 110)}`);
  }
  console.log(`\nCSV: ${csvPath}`);

  if (!APPLY) {
    console.log("\nDry-run. Apply için --apply.");
    await prisma.$disconnect();
    return;
  }

  let applied = 0;
  for (const p of planned) {
    await prisma.recipeStep.update({
      where: { id: p.stepId },
      data: { instruction: p.after },
    });
    await prisma.auditLog.create({
      data: {
        action: "STEP_TITLE_LEAK_FIX",
        targetType: "RecipeStep",
        targetId: p.stepId,
        metadata: {
          recipeSlug: p.recipeSlug,
          stepNumber: p.stepNumber,
          before: p.before,
          after: p.after,
          reason: "Mod K mid-sentence title-leak strip (round 3)",
        },
      },
    });
    applied++;
  }
  console.log(`\nAPPLIED: ${applied} step rewrite`);
  await prisma.$disconnect();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
