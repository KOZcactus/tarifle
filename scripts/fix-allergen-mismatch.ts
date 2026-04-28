/**
 * Allergen mismatch fix script (oturum 31 yeni audit bulgusu).
 *
 * audit-recipe-quality.ts GATE B sonucu: 198 hit (KUSUYEMIS=58 +
 * GLUTEN=51 + SUT=46 + YUMURTA=21 + SUSAM=11 + HARDAL=4 + DENIZ=4 +
 * SOYA=2 + KEREVIZ=1). Bu script step text/ingredient mention edilen
 * ama allergen array'inde olmayan allergen'leri push eder.
 *
 * Tıbbi öncelik: OVER-flag > UNDER-flag. Kullanıcı false-alarm
 * tolere edebilir ama gerçek alerjisi olan UNDER-flag durumunda
 * yanlış güvende kalır.
 *
 * Idempotent: mevcut allergen ekli ise atlar. AuditLog action
 * 'ALLERGEN_RETROFIT' (yeni eylem türü, mod K manual rev'den ayrı).
 *
 * Usage: npx tsx scripts/fix-allergen-mismatch.ts (DRY-RUN)
 *        npx tsx scripts/fix-allergen-mismatch.ts --env prod --confirm-prod
 */
import { PrismaClient, Allergen } from "@prisma/client";
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

const envIdx = process.argv.indexOf("--env");
const envTarget = envIdx >= 0 && process.argv[envIdx + 1] === "prod" ? "prod" : "dev";
const envFile = envTarget === "prod" ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

const ALLERGEN_KEYWORDS: Record<Allergen, string[]> = {
  GLUTEN: ["un", "buğday", "bulgur", "irmik", "yufka", "ekmek", "makarna", "lavaş", "simit", "bazlama", "kete", "katmer", "börek", "lazanya", "milföy", "panko", "galeta"],
  SUT: ["süt", "yoğurt", "peynir", "tereyağı", "kaymak", "krema", "labne", "ayran", "kefir", "lor", "kaşar", "mozzarella", "ricotta", "tulum"],
  YUMURTA: ["yumurta"],
  KUSUYEMIS: ["badem", "ceviz", "fındık", "kestane", "antep fıstığı", "fıstık", "kaju", "macadamia"],
  YER_FISTIGI: ["yer fıstığı"],
  SOYA: ["soya", "tofu", "edamame", "miso", "tempeh"],
  SUSAM: ["susam", "tahin"],
  DENIZ_URUNLERI: ["balık", "karides", "midye", "ahtapot", "kalamar", "istakoz", "yengeç", "deniz mahsulü", "hamsi", "ringa", "somon", "ton balığı", "lakerda", "morina"],
  HARDAL: ["hardal"],
  KEREVIZ: ["kereviz"],
};

const ALLERGEN_EXCLUDE: Partial<Record<Allergen, string[]>> = {
  SUT: [
    "hindistan cevizi sütü", "hindistan cevizi süt", "badem sütü", "soya sütü",
    "yulaf sütü", "pirinç sütü", "kaju sütü", "fındık sütü",
    "anne sütü", "süt çikolatası dışı",
  ],
  KUSUYEMIS: ["yer fıstığı", "yer fistigi", "kestane şekeri"],
  GLUTEN: [
    "mısır unu", "pirinç unu", "kestane unu", "badem unu", "nohut unu",
    "hindistan cevizi unu", "tapyoka", "tapioka",
  ],
};

function hasAllergenMention(allText: string, allergen: Allergen): { hit: boolean; mention?: string } {
  const keywords = ALLERGEN_KEYWORDS[allergen];
  const excludes = ALLERGEN_EXCLUDE[allergen] || [];
  for (const kw of keywords) {
    const pattern = new RegExp(`\\b${kw}\\b`, "i");
    if (pattern.test(allText)) {
      const idx = allText.toLocaleLowerCase("tr").indexOf(kw.toLocaleLowerCase("tr"));
      if (idx >= 0) {
        const ctxStart = Math.max(0, idx - 25);
        const ctx = allText.substring(ctxStart, idx + kw.length + 5).toLocaleLowerCase("tr");
        const inExclude = excludes.some((ex) => ctx.includes(ex.toLocaleLowerCase("tr")));
        if (!inExclude) return { hit: true, mention: kw };
      }
    }
  }
  return { hit: false };
}

async function main() {
  assertDbTarget("fix-allergen-mismatch");
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  console.log(`DB: ${new URL(url).host}`);

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      allergens: true,
      ingredients: { select: { name: true } },
      steps: { select: { instruction: true } },
    },
  });
  console.log(`Total prod recipes: ${recipes.length}\n`);

  let updated = 0;
  let skipped = 0;
  const allergenAddCount: Record<string, number> = {};

  for (const r of recipes) {
    const stepText = r.steps.map((s) => s.instruction).join(" ").toLocaleLowerCase("tr");
    const ingText = r.ingredients.map((i) => i.name).join(" ").toLocaleLowerCase("tr");
    const allText = stepText + " " + ingText;

    const newAllergens = new Set<Allergen>(r.allergens);
    const added: { allergen: Allergen; mention: string }[] = [];

    for (const allergen of Object.keys(ALLERGEN_KEYWORDS) as Allergen[]) {
      if (newAllergens.has(allergen)) continue;
      const result = hasAllergenMention(allText, allergen);
      if (result.hit) {
        newAllergens.add(allergen);
        added.push({ allergen, mention: result.mention! });
        allergenAddCount[allergen] = (allergenAddCount[allergen] ?? 0) + 1;
      }
    }

    if (added.length === 0) {
      skipped += 1;
      continue;
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: r.id },
        data: { allergens: Array.from(newAllergens) },
      });
      await tx.auditLog.create({
        data: {
          action: "ALLERGEN_RETROFIT",
          userId: null,
          targetType: "recipe",
          targetId: r.id,
          metadata: {
            slug: r.slug,
            paket: "oturum-31-allergen-retrofit",
            previousAllergens: r.allergens,
            newAllergens: Array.from(newAllergens),
            added: added.map((a) => `${a.allergen} (mention '${a.mention}')`),
          },
        },
      });
    });

    updated += 1;
    if (updated <= 30) {
      console.log(`✅ ${r.slug}: +${added.map((a) => a.allergen).join(", ")} (${added.map((a) => a.mention).join(", ")})`);
    }
  }

  console.log(`\nUpdated: ${updated} recipe(s), skipped: ${skipped}`);
  console.log(`Allergen breakdown:`, allergenAddCount);
  await prisma.$disconnect();
}

const isEntrypoint = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) { main().catch((e) => { console.error(e); process.exit(1); }); }
