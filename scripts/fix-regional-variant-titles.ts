/**
 * One-shot: 8 recipe pairs share an identical `title` despite representing
 * distinct regional variants (the slug carries the variant marker but the
 * title does not). Users see "Brik" twice in the listing and can't tell
 * which is which. This script rewrites the variant title to include its
 * regional/origin prefix so the listing reads unambiguously.
 *
 * Source: GPT external audit, Duplicate Detection (#13).
 *
 * Idempotent: skips if the title already includes the variant marker.
 * Dev-safe, prod requires --confirm-prod.
 *
 *   npx tsx scripts/fix-regional-variant-titles.ts
 *   npx tsx scripts/fix-regional-variant-titles.ts --apply
 *   npx tsx scripts/fix-regional-variant-titles.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

interface TitleFix {
  slug: string;
  newTitle: string;
  reason: string;
}

const FIXES: readonly TitleFix[] = [
  {
    slug: "hatay-kagit-kebabi",
    newTitle: "Hatay Kağıt Kebabı",
    reason: "Hatay-region variant, listing had two \"Kağıt Kebabı\" entries.",
  },
  {
    slug: "firik-pilavi-gaziantep-usulu",
    newTitle: "Gaziantep Usulü Firik Pilavı",
    reason: "Gaziantep variant, listing had two \"Firik Pilavı\" entries.",
  },
  {
    slug: "mumbar-dolmasi-guneydogu-usulu",
    newTitle: "Güneydoğu Usulü Mumbar Dolması",
    reason: "Southeast variant, listing had two \"Mumbar Dolması\" entries.",
  },
  {
    slug: "vaca-frita-cubana",
    newTitle: "Vaca Frita Cubana",
    reason: "Cuban-style variant, listing had two \"Vaca Frita\" entries.",
  },
  {
    slug: "fasulye-diblesi-giresun-usulu",
    newTitle: "Giresun Usulü Fasulye Diblesi",
    reason: "Giresun variant, listing had two \"Fasulye Diblesi\" entries.",
  },
  {
    slug: "toyga-corbasi-anadolu-usulu",
    newTitle: "Anadolu Usulü Toyga Çorbası",
    reason: "Inner Anatolia variant, listing had two \"Toyga Çorbası\" entries.",
  },
  {
    slug: "brik-tunus-usulu",
    newTitle: "Tunus Usulü Brik",
    reason: "Tunisian variant, listing had two \"Brik\" entries.",
  },
  {
    slug: "etli-ekmek-konya-usulu",
    newTitle: "Konya Usulü Etli Ekmek",
    reason: "Konya variant, listing had two \"Etli Ekmek\" entries.",
  },
];

async function main() {
  if (APPLY) assertDbTarget("fix-regional-variant-titles");

  console.log(`${APPLY ? "APPLYING" : "DRY-RUN"}, regional variant title disambiguation`);

  let applied = 0;
  let skipped = 0;

  for (const fix of FIXES) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, slug: true, title: true },
    });
    if (!recipe) {
      console.log(`❌ [${fix.slug}] not found, skip.`);
      continue;
    }
    if (recipe.title === fix.newTitle) {
      console.log(`⏭️  [${fix.slug}] already "${fix.newTitle}", skip.`);
      skipped++;
      continue;
    }
    console.log(
      `${APPLY ? "✅" : "📋"} [${fix.slug}] "${recipe.title}" → "${fix.newTitle}"`,
    );
    console.log(`     reason: ${fix.reason}`);
    if (APPLY) {
      await prisma.recipe.update({
        where: { id: recipe.id },
        data: { title: fix.newTitle },
      });
      applied++;
    }
  }

  console.log("");
  if (APPLY) {
    console.log(`🎉 done, ${applied} title(s) updated, ${skipped} already correct.`);
  } else {
    console.log(`Dry-run only. Pass --apply to write. ${skipped} already in place, ${applied} would be updated.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
