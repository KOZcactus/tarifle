/**
 * Ingredient drift hizli fix. audit-ingredient-standards.ts cikti'sinda
 * tespit edilen 2 drift grup icin standardize:
 *
 *   "Cachaca (rom)" -> "Cachaça rom"      (diacritic + parantez normalize)
 *   "Aci biber püresi" -> "Acı biber püresi" (TR diacritic dogrula)
 *
 * Idempotent: target name zaten varsa update no-op (etkilenen satir 0).
 *
 * Usage:
 *   npx tsx scripts/fix-ingredient-drift.ts            # dev
 *   DATABASE_URL=<prod> ... --confirm-prod            # prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const FIXES: { from: string; to: string }[] = [
  { from: "Cachaca (rom)", to: "Cachaça rom" },
  { from: "Aci biber püresi", to: "Acı biber püresi" },
];

async function main() {
  assertDbTarget("fix-ingredient-drift");
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  let totalUpdated = 0;
  for (const { from, to } of FIXES) {
    const result = await prisma.recipeIngredient.updateMany({
      where: { name: from },
      data: { name: to },
    });
    console.log(`  "${from}" -> "${to}": ${result.count} satır`);
    totalUpdated += result.count;
  }

  console.log(`\n✅ Toplam ${totalUpdated} satır guncellendi`);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e);
  process.exit(1);
});
