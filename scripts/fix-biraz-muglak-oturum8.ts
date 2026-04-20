/**
 * Fix 4 "biraz" muğlak ifade validate-batch ERROR'larını, tipNote /
 * servingSuggestion alanlarını somut ölçüyle değiştir.
 *
 * CI pipeline'ındaki `content:validate` step 4 ERROR ile düşüyordu
 * (bütün son 15+ push CI red). seed-recipes.ts kaynak patch'lenmişti,
 * prod DB'de de Recipe.tipNote/servingSuggestion aynı ifadeye yazılmış
 * olduğu için mevcut kayıt update gerekiyor (seed idempotent, yeni
 * slug eklemiyor ama mevcut satırı da dokunmuyor).
 *
 * İdempotent: fix script iki kez koşsa ikinci sefer "zaten temiz".
 *
 *   npx tsx scripts/fix-biraz-muglak-oturum8.ts             # dry run
 *   npx tsx scripts/fix-biraz-muglak-oturum8.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-biraz-muglak-oturum8.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

const FIXES: readonly {
  slug: string;
  field: "tipNote" | "servingSuggestion";
  from: string;
  to: string;
}[] = [
  {
    slug: "pekmezli-misir-unu-muhallebisi-trabzon-usulu",
    field: "servingSuggestion",
    from: "Üzerine biraz ceviz serperek ılık servis edin.",
    to: "Üzerine 1 yemek kaşığı iri doğranmış ceviz serperek ılık servis edin.",
  },
  {
    slug: "hashasli-cevizli-irmik-tatlisi-usak-usulu",
    field: "servingSuggestion",
    from: "Üzerine biraz daha ceviz serpip ılık servis edin.",
    to: "Üzerine 1 yemek kaşığı daha ceviz serpip ılık servis edin.",
  },
  {
    slug: "cevizli-biber-kavurmasi-adiyaman-usulu",
    field: "tipNote",
    from: "Biberleri tavadan sonra biraz dinlendirmek cevizle daha kolay ezilmelerini sağlar.",
    to: "Biberleri tavadan sonra 5 dakika dinlendirmek cevizle daha kolay ezilmelerini sağlar.",
  },
  {
    slug: "madimakli-bulgur-pilavi-sivas-usulu",
    field: "tipNote",
    from: "Madımağı bulgura göre biraz iri bırakmak pilavda kaybolmadan seçilmesini sağlar.",
    to: "Madımağı bulgura göre iri (1-2 cm) bırakmak pilavda kaybolmadan seçilmesini sağlar.",
  },
];

async function main(): Promise<void> {
  assertDbTarget("fix-biraz-muglak-oturum8");
  console.log(
    `🔧 fix-biraz (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  let updated = 0;
  let alreadyClean = 0;
  let missing = 0;

  for (const fix of FIXES) {
    const row = await prisma.recipe.findUnique({
      where: { slug: fix.slug },
      select: { id: true, tipNote: true, servingSuggestion: true },
    });
    if (!row) {
      console.log(`  ⚠ ${fix.slug}, DB'de yok`);
      missing++;
      continue;
    }
    const current =
      fix.field === "tipNote" ? row.tipNote : row.servingSuggestion;

    if (current === fix.to) {
      console.log(`  ⏭  ${fix.slug}.${fix.field}, zaten temiz`);
      alreadyClean++;
      continue;
    }
    if (current !== fix.from) {
      console.log(
        `  ⚠ ${fix.slug}.${fix.field}, mevcut değer beklenenden farklı:\n     "${current}"`,
      );
      continue;
    }

    console.log(
      `  ${APPLY ? "✅" : "🔍"} ${fix.slug}.${fix.field}, "biraz" → somut`,
    );

    if (APPLY) {
      await prisma.recipe.update({
        where: { id: row.id },
        data: { [fix.field]: fix.to },
      });
      updated++;
    }
  }

  console.log(
    `\nÖzet: ${APPLY ? `${updated} güncellendi` : "dry-run"}, ${alreadyClean} zaten temiz, ${missing} DB'de yok.`,
  );
}

main()
  .catch((err) => {
    console.error("Hata:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
