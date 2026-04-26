/**
 * Tum published tarif basliklarini alfabetik sirali TXT olarak dok
 * (oturum 23 kullanici talebi). Manuel "tarif var mi yok mu" kontrol
 * icin tek dosya.
 *
 * - TR locale collation, case-insensitive ("ANZAC" ile "Acaraje" ayni
 *   oncelik, ANZAC bug fix pattern'i ile uyumlu)
 * - Tarif silindiginde script tekrar kosturulur, TXT otomatik
 *   guncellenir (idempotent)
 * - Yeni tarifler eklendiginde ya bu komutla yeniden uret ya da
 *   alt kisma append et (kullanici tercihine gore)
 *
 * Cikti: docs/tarif-listesi.txt
 *
 * Usage:
 *   npx tsx scripts/dump-tarif-listesi.ts                # tum DB
 *   npx tsx scripts/dump-tarif-listesi.ts --with-slug    # title + slug
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const withSlug = process.argv.includes("--with-slug");

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: { title: true, slug: true },
  });

  // TR locale + case-insensitive sort (ANZAC bug fix pattern)
  recipes.sort((a, b) =>
    a.title.localeCompare(b.title, "tr", { sensitivity: "base" }),
  );

  const lines: string[] = [];
  lines.push(`# Tarifle, tarif listesi (alfabetik, TR locale)`);
  lines.push(`# Toplam: ${recipes.length} tarif`);
  lines.push(`# Son guncelleme: ${new Date().toISOString().slice(0, 10)}`);
  lines.push(`#`);
  lines.push(
    `# Bu liste DB'den otomatik uretilir. Tarif silindigi/eklendiginde`,
  );
  lines.push(
    `# 'npx tsx scripts/dump-tarif-listesi.ts' ile yeniden uretilir.`,
  );
  lines.push(``);

  for (const r of recipes) {
    if (withSlug) {
      lines.push(`${r.title}  [${r.slug}]`);
    } else {
      lines.push(r.title);
    }
  }

  const outPath = path.resolve(process.cwd(), "docs/tarif-listesi.txt");
  fs.writeFileSync(outPath, lines.join("\n") + "\n");
  console.log(`Yazildi: ${outPath} (${recipes.length} tarif)`);

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
