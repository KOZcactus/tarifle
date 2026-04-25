/**
 * Mod G batch input zenginleştirme scripti.
 *
 * docs/mod-g-boilerplate-slugs.txt'den N slug alır, her biri için DB'den
 * mevcut tipNote + servingSuggestion + ingredient (kısa liste) + step
 * (kısa özet) + cuisine + categorySlug + type bilgisini çeker, Codex'e
 * gönderilecek zenginleştirilmiş JSON üretir.
 *
 * Codex bu JSON'u alır + brief §17 disiplini ile tarif-özgü tipNote/sug
 * yazar (boilerplate yerine). Tarifin gerçek içeriğine UYGUN cümle
 * üretilebilmesi için bu içerik şart.
 *
 * Usage:
 *   npx tsx scripts/prepare-mod-g-input.ts --batch 1 --size 100
 *   # docs/mod-g-batch-1-input.json üretir
 *
 *   npx tsx scripts/prepare-mod-g-input.ts --batch 2 --size 100 --offset 100
 *   # docs/mod-g-batch-2-input.json üretir (slug 101-200)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

interface BoilerplateRow {
  slug: string;
  title: string;
  flags: string;
}

interface EnrichedEntry {
  slug: string;
  title: string;
  flags: string;
  cuisine: string | null;
  categorySlug: string | null;
  type: string;
  currentTipNote: string | null;
  currentServingSuggestion: string | null;
  ingredients: string[];
  steps: string[];
}

function parseArgs(): { batch: number; size: number; offset: number } {
  const args = process.argv.slice(2);
  const get = (k: string, def: string): string => {
    const eq = args.find((a) => a.startsWith(`${k}=`));
    if (eq) return eq.slice(k.length + 1);
    const idx = args.indexOf(k);
    if (idx >= 0 && args[idx + 1]) return args[idx + 1];
    return def;
  };
  return {
    batch: Number(get("--batch", "1")),
    size: Number(get("--size", "100")),
    offset: Number(get("--offset", "0")),
  };
}

function readBoilerplateFile(): BoilerplateRow[] {
  const file = path.resolve(process.cwd(), "docs/mod-g-boilerplate-slugs.txt");
  const lines = fs
    .readFileSync(file, "utf8")
    .split("\n")
    .filter((l) => l.trim().length > 0 && !l.startsWith("#"));
  return lines.map((line) => {
    const [slug, title, flags] = line.split("\t");
    return { slug, title, flags: flags ?? "" };
  });
}

async function main(): Promise<void> {
  const { batch, size, offset } = parseArgs();
  const allRows = readBoilerplateFile();
  const slice = allRows.slice(offset, offset + size);
  console.log(
    `📄 ${allRows.length} boilerplate satırı okundu, ${slice.length} slug işlenecek (offset ${offset}, size ${size}).`,
  );

  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const enriched: EnrichedEntry[] = [];
  let missing = 0;

  for (const row of slice) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: row.slug },
      select: {
        slug: true,
        title: true,
        cuisine: true,
        type: true,
        tipNote: true,
        servingSuggestion: true,
        category: { select: { slug: true } },
        ingredients: {
          orderBy: { sortOrder: "asc" },
          select: { name: true, amount: true, unit: true },
          take: 12,
        },
        steps: {
          orderBy: { stepNumber: "asc" },
          select: { instruction: true },
          take: 8,
        },
      },
    });
    if (!recipe) {
      missing++;
      console.warn(`⏭  Slug yok: ${row.slug}`);
      continue;
    }
    enriched.push({
      slug: recipe.slug,
      title: recipe.title,
      flags: row.flags,
      cuisine: recipe.cuisine ?? null,
      categorySlug: recipe.category?.slug ?? null,
      type: recipe.type,
      currentTipNote: recipe.tipNote ?? null,
      currentServingSuggestion: recipe.servingSuggestion ?? null,
      ingredients: recipe.ingredients.map(
        (i) => `${i.name}${i.amount ? ` (${i.amount}${i.unit ?? ""})` : ""}`,
      ),
      steps: recipe.steps.map((s) => s.instruction),
    });
  }

  const outFile = path.resolve(
    process.cwd(),
    `docs/mod-g-batch-${batch}-input.json`,
  );
  fs.writeFileSync(outFile, JSON.stringify(enriched, null, 2) + "\n");

  const tipBoiler = enriched.filter((e) => e.flags.includes("TIP")).length;
  const sugBoiler = enriched.filter((e) => e.flags.includes("SUG")).length;
  console.log(`\n✅ ${outFile} yazıldı.`);
  console.log(`   ${enriched.length} tarif zenginleştirildi.`);
  console.log(`   tipNote boilerplate: ${tipBoiler}`);
  console.log(`   servingSuggestion boilerplate: ${sugBoiler}`);
  if (missing > 0) console.log(`   ⏭  Slug yok: ${missing}`);

  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
