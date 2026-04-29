/**
 * pyzy-polonya-usulu SUT allergen ek (oturum 33 nihai temizlik audit).
 *
 * GATE B prod hit: step instruction "Tereyağı veya soğanlı yağla sıcak
 * servis edin." → ingredient list'te tereyağı yok ama servis tavsiyesi
 * tereyağı seçeneği sunuyor. Allergen accuracy ilkesi (OVER-flag >
 * UNDER-flag): kullanıcı tereyağı seçeneğini alırsa SUT maruz kalır,
 * o yüzden allergen array'e SUT ekle.
 *
 * Idempotent (allergen zaten varsa atlar). AuditLog action ALLERGEN_RETROFIT.
 *
 * Usage:
 *   npx tsx scripts/fix-pyzy-sut-allergen.ts (dev)
 *   npx tsx scripts/fix-pyzy-sut-allergen.ts --env prod --confirm-prod
 */
import { PrismaClient, Allergen } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";
neonConfig.webSocketConstructor = ws;

const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
const envIdx = process.argv.indexOf("--env");
const envTarget = envIdx >= 0 && process.argv[envIdx + 1] === "prod" ? "prod" : "dev";
const envFile = envTarget === "prod" ? ".env.production.local" : ".env.local";
dotenv.config({ path: path.resolve(__dirname2, "..", envFile), override: true });

async function main() {
  assertDbTarget("fix-pyzy-sut-allergen");
  const url = process.env.DATABASE_URL!;
  console.log(`DB: ${new URL(url).host}\n`);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: url }) });

  try {
    const r = await prisma.recipe.findUnique({
      where: { slug: "pyzy-polonya-usulu" },
      select: { id: true, slug: true, allergens: true },
    });
    if (!r) {
      console.log("⏭  pyzy-polonya-usulu bulunamadı.");
      return;
    }
    if (r.allergens.includes("SUT")) {
      console.log(`⏭  Idempotent: SUT zaten var (${r.allergens.join(", ")}).`);
      return;
    }
    const newAllergens = [...r.allergens, "SUT" as Allergen];
    await prisma.$transaction(async (tx) => {
      await tx.recipe.update({
        where: { id: r.id },
        data: { allergens: { set: newAllergens } },
      });
      await tx.auditLog.create({
        data: {
          action: "ALLERGEN_RETROFIT",
          targetType: "recipe",
          targetId: r.id,
          metadata: {
            slug: r.slug,
            paket: "oturum-33-nihai-temizlik",
            previousAllergens: r.allergens,
            newAllergens,
            added: ["SUT (mention 'tereyağı veya soğanlı yağ' servis tavsiyesi)"],
          },
        },
      });
    });
    console.log(`✅ ${r.slug}: +SUT (${r.allergens.join(", ")} → ${newAllergens.join(", ")})`);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
