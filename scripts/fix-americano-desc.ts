/**
 * Tek seferlik: Americano tarif description genisletme (oturum 23
 * quality dashboard top 10 son skoru).
 *
 * Idempotent: zaten guncel ise no-op.
 *
 * Usage:
 *   npx tsx scripts/fix-americano-desc.ts                 # dry-run
 *   npx tsx scripts/fix-americano-desc.ts --apply         # dev
 *   npx tsx scripts/fix-americano-desc.ts --apply --confirm-prod
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
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname2, "..", ".env") });

const SLUG = "americano";
const NEW_DESC =
  "Espressonun yaklaşık dört kat sıcak suyla uzatıldığı sade ama gövdeli klasik kahve. Cremanın hafif acılığı ve aroması korunurken içimi yumuşar, sade yudumlamaya uygun olur.";

async function main() {
  assertDbTarget("fix-americano-desc");
  const APPLY = process.argv.includes("--apply");
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`DB: ${new URL(url).host}`);

  const r = await prisma.recipe.findUnique({
    where: { slug: SLUG },
    select: { id: true, description: true },
  });
  if (!r) {
    console.log(`Not found: ${SLUG}`);
    await prisma.$disconnect();
    return;
  }
  if (r.description === NEW_DESC) {
    console.log(`OK ${SLUG} (already updated)`);
    await prisma.$disconnect();
    return;
  }
  console.log(`Before: "${r.description}" (${r.description.length}c)`);
  console.log(`After:  "${NEW_DESC}" (${NEW_DESC.length}c)`);
  if (!APPLY) {
    console.log("Dry-run.");
    await prisma.$disconnect();
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.recipe.update({
      where: { id: r.id },
      data: { description: NEW_DESC },
    });
    await tx.auditLog.create({
      data: {
        action: "DESC_REFINE",
        targetType: "recipe",
        targetId: r.id,
        metadata: { slug: SLUG, before: r.description, after: NEW_DESC },
      },
    });
  });
  console.log("Updated.");
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
