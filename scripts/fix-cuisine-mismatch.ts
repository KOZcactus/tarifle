/**
 * Cuisine mismatch fix script (oturum 31 yeni audit GATE D bulgusu).
 *
 * audit-recipe-quality.ts GATE D rafine sonucu (606 → 4 hit, word
 * boundary + 'hindistan-cevizi'/'lima-soup'/'santiago-de-compostela'
 * exclude pattern eklendi). 4 gerçek cuisine yanlış mismatch:
 *
 *   1. zeytinli-labneli-kahvalti-ekmegi-fas-usulu: 'me' (Levant) → 'ma' (Fas)
 *   2. ananasli-lime-agua-fresca-kuba-usulu: 'mx' (Meksika) → 'cu' (Küba)
 *   3. ananasli-zencefil-agua-fresca-kuba-usulu: 'mx' → 'cu'
 *   4. siyah-fasulyeli-yumurta-tostada-kuba-usulu: 'mx' → 'cu'
 *
 * AuditLog action 'CUISINE_FIX'. Idempotent (cuisine zaten doğruysa atlar).
 *
 * Usage: npx tsx scripts/fix-cuisine-mismatch.ts (DRY-RUN dev)
 *        npx tsx scripts/fix-cuisine-mismatch.ts --env prod --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
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

const FIXES: { slug: string; from: string; to: string; reason: string }[] = [
  {
    slug: "zeytinli-labneli-kahvalti-ekmegi-fas-usulu",
    from: "me",
    to: "ma",
    reason: "Slug 'fas-usulu' Fas mutfağına işaret ediyor; 'me' (Levant/Orta Doğu) yerine 'ma' (Kuzey Afrika/Fas) doğru kod.",
  },
  {
    slug: "ananasli-lime-agua-fresca-kuba-usulu",
    from: "mx",
    to: "cu",
    reason: "Slug 'kuba-usulu' Küba mutfağına işaret ediyor; agua fresca Latin Amerika'da yaygın ama 'kuba-usulu' tag'i Meksika 'mx' yerine Küba 'cu' kodu gerektirir.",
  },
  {
    slug: "ananasli-zencefil-agua-fresca-kuba-usulu",
    from: "mx",
    to: "cu",
    reason: "Slug 'kuba-usulu' Küba mutfağına işaret ediyor; 'mx' yerine 'cu' kodu doğru.",
  },
  {
    slug: "siyah-fasulyeli-yumurta-tostada-kuba-usulu",
    from: "mx",
    to: "cu",
    reason: "Slug 'kuba-usulu' Küba mutfağına işaret ediyor; siyah fasulye + tostada Küba klasiği (frijoles negros + tostada cubana). 'mx' yerine 'cu' doğru.",
  },
  // Oturum 33 nihai temizlik audit GATE D 3 yeni hit
  {
    slug: "lagos-yer-fistikli-tatli-patates-guveci",
    from: "ma",
    to: "ng",
    reason: "Lagos = Nijerya en büyük şehri. Yer fıstıklı tatlı patates güveci Batı Afrika klasiği. 'ma' (Fas/Mağrib) yerine 'ng' (Nijerya) doğru kod.",
  },
  {
    slug: "lima-kinoali-tavuk-aguadito",
    from: "mx",
    to: "pe",
    reason: "Lima = Peru başkenti. Aguadito Peru klasik tavuk çorbası, kinoa And bölgesi. 'mx' (Meksika) yerine 'pe' (Peru) doğru kod.",
  },
  {
    slug: "kopenhag-smorrebrod-ringa",
    from: "se",
    to: "dk",
    reason: "Kopenhag = Danimarka başkenti. Smørrebrød Danimarka açık sandviç klasiği. 'se' (İsveç) yerine 'dk' (Danimarka) doğru kod.",
  },
];

async function main() {
  assertDbTarget("fix-cuisine-mismatch");
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });
  console.log(`DB: ${new URL(url).host}\n`);

  let updated = 0;
  let skipped = 0;
  let notFound = 0;

  for (const fix of FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, slug: true, title: true, cuisine: true },
    });
    if (!recipe) {
      console.error(`⚠️  ${fix.slug}: bulunamadı`);
      notFound += 1;
      continue;
    }
    if (recipe.cuisine === fix.to) {
      console.log(`⏭️  ${fix.slug}: zaten cuisine='${fix.to}', SKIP (idempotent)`);
      skipped += 1;
      continue;
    }
    if (recipe.cuisine !== fix.from) {
      console.warn(`⚠️  ${fix.slug}: beklenen current='${fix.from}', mevcut='${recipe.cuisine}', GENEDE update`);
    }

    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: recipe.id },
        data: { cuisine: fix.to },
      });
      await tx.auditLog.create({
        data: {
          action: "CUISINE_FIX",
          userId: null,
          targetType: "recipe",
          targetId: recipe.id,
          metadata: {
            slug: fix.slug,
            paket: "oturum-31-cuisine-mismatch-fix",
            previousCuisine: recipe.cuisine,
            newCuisine: fix.to,
            reason: fix.reason,
          },
        },
      });
    });

    console.log(`✅ ${fix.slug}: cuisine '${recipe.cuisine}' → '${fix.to}'`);
    updated += 1;
  }

  console.log(`\nUpdated: ${updated}, skipped (idempotent): ${skipped}, not_found: ${notFound}`);
  await prisma.$disconnect();
}

const isEntrypoint = !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) { main().catch((e) => { console.error(e); process.exit(1); }); }
