/**
 * Mod K title-leak ROUND 4: suffix-bitişik title strip (oturum 34).
 *
 * Round 1+2+3 cümle başı + cümle ortası boşluk-ayrı title'ları temizledi
 * (1471 step). Kalan 145 step **suffix bitişik** pattern:
 *   "Osso bucoyu 120 dakika..."     (Osso buco + yu)
 *   "Etli bezelyeyi 20 dakika..."   (Etli bezelye + yi)
 *   "Tavuk göğsünü suda..."         (Tavuk göğsü + nü)
 *   "Kimchi jeonu 8 dakika..."      (Kimchi jeon + u)
 *   "Hatay paluzesini..."           (Hatay paluze + sini)
 *
 * Round 1+2'de skip ediliyordu (suffix-guard) çünkü title strip yapınca
 * tek başına suffix kalıyordu ("Yu pişirin" anlamsız). Yeni yaklaşım:
 * **suffix dahil strip** + cap kalan.
 *
 * Test:
 *   "Osso bucoyu 120 dakika kısık ateşte pişirin"
 *   → strip "Osso bucoyu " → "120 dakika kısık ateşte pişirin" → cap
 *   → "120 dakika kısık ateşte pişirin" ✓
 *
 *   "Tavuk göğsünü suda 20 dakika haşlayıp süzün"
 *   → strip "Tavuk göğsünü " → "suda 20 dakika..." → cap "Suda..." ✓
 *
 *   "Etli bezelyeyi 20 dakika sebzeler yumuşayana kadar pişirin"
 *   → "20 dakika sebzeler yumuşayana kadar pişirin" ✓
 *
 * Sadece **cümle başı** suffix-bitişik strip yapar. Cümle ortası riskli.
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

function capFirst(s: string): string {
  if (!s) return s;
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
}

/**
 * Cümle başında title + Türkçe ek (suffix) bitişik. Suffix dahil strip,
 * cap kalan.
 *
 * Türkçe sıfat/isim ekleri (case suffixes):
 *   accusative: -i, -ı, -u, -ü, -yi, -yı, -yu, -yü
 *   dative: -e, -a, -ye, -ya
 *   locative: -de, -da
 *   ablative: -den, -dan
 *   genitive: -in, -ın, -un, -ün, -nin, -nın, -nun, -nün
 *   plural+case: -leri, -ları, -lerini, -larını, -leriyle, -larıyla
 *   possessive 3sg: -si, -sı, -su, -sü, -sini, -sını, -sunu, -sünü
 *
 * Pattern: title + 1-5 küçük harf + boşluk + verb/object
 */
function stripSuffixedTitle(instruction: string, title: string): string | null {
  const lower = instruction.toLocaleLowerCase("tr-TR");
  const tLower = title.toLocaleLowerCase("tr-TR");
  if (!lower.startsWith(tLower)) return null;

  const afterTitle = instruction.slice(title.length);
  // Suffix bitişik mi (boşluksuz harf var)
  if (afterTitle.length === 0) return null;
  if (!/^[a-zçğıöşüâîû]/i.test(afterTitle)) return null;

  // 1-5 harf bitişik suffix + boşluk
  const suffixMatch = afterTitle.match(/^([a-zçğıöşüâîû]{1,5})(\s+)(.+)$/iu);
  if (!suffixMatch) return null;
  const rest = suffixMatch[3];

  // Sanity: rest 3+ kelime
  const words = rest.split(/\s+/).filter(Boolean);
  if (words.length < 3) return null;

  // Sanity: rest 15+ char
  if (rest.length < 15) return null;

  // Cap kalan
  return capFirst(rest);
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
  await assertDbTarget("fix-mod-k-suffix-title");
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
      const newText = stripSuffixedTitle(s.instruction, r.title);
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
    `docs/mod-k-suffix-fix-plan-${isProd ? "prod" : "dev"}.csv`,
  );
  const escape = (s: string): string => `"${s.replace(/"/g, '""')}"`;
  const csvLines = [
    "recipeSlug,recipeTitle,stepNumber,before,after",
    ...planned.map((p) => `${p.recipeSlug},${escape(p.recipeTitle)},${p.stepNumber},${escape(p.before)},${escape(p.after)}`),
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");

  console.log(`Planlı step fix: ${planned.length}`);
  console.log(`Sample (ilk 10):`);
  for (const p of planned.slice(0, 10)) {
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
          reason: "Mod K suffix-bitişik title strip (round 4)",
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
