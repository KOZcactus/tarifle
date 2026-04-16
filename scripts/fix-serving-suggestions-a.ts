/**
 * Fix Category A: 4 recipes with misleading servingSuggestion referencing
 * sauces that aren't explained or aren't readily available.
 *
 * Run:
 *   npx tsx scripts/fix-serving-suggestions-a.ts --dry-run
 *   npx tsx scripts/fix-serving-suggestions-a.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const DRY_RUN = process.argv.includes("--dry-run");

const FIXES: Record<string, { servingSuggestion: string }> = {
  "banh-xeo": {
    servingSuggestion: "Marul yaprağına sarıp limon sıkarak yiyin.",
  },
  "panna-cotta": {
    servingSuggestion: "Taze orman meyveleri veya reçelle servis edin.",
  },
  "tamale": {
    servingSuggestion: "Salsa veya ekşi kremayla servis edin.",
  },
  "tavuk-katsu": {
    servingSuggestion: "Lahana salatası ve hazır tonkatsu sosuyla servis edin.",
  },
};

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) { console.error("❌ DATABASE_URL yok"); process.exit(1); }

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: databaseUrl }),
  });

  try {
    const host = new URL(databaseUrl).host;
    console.log(`\n🔧 fix-serving-suggestions-a ${DRY_RUN ? "(dry-run)" : "(apply)"} → ${host}\n`);

    let updated = 0;
    for (const [slug, fix] of Object.entries(FIXES)) {
      const r = await prisma.recipe.findUnique({
        where: { slug },
        select: { id: true, title: true, servingSuggestion: true },
      });
      if (!r) { console.log(`  ⚠ ${slug} bulunamadı`); continue; }

      console.log(`  ${slug.padEnd(20)} "${r.servingSuggestion}" → "${fix.servingSuggestion}"`);
      if (!DRY_RUN) {
        await prisma.recipe.update({
          where: { id: r.id },
          data: { servingSuggestion: fix.servingSuggestion },
        });
      }
      updated++;
    }

    console.log(`\n${DRY_RUN ? "Would update" : "Updated"}: ${updated}`);
    if (DRY_RUN) console.log("(dry run)");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => { console.error("❌", err); process.exit(1); });
