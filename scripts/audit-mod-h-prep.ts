/**
 * Mod H prep audit (oturum 21+): Top N ingredient frequency listesi
 * cikarir, Codex batch input olarak kullanilir.
 *
 * Kullanim:
 *   npx tsx scripts/audit-mod-h-prep.ts --top=50
 *   DATABASE_URL=<prod> npx tsx scripts/audit-mod-h-prep.ts --top=50 --confirm-prod
 *
 * Cikti: docs/mod-h-ingredient-list.txt (top N ingredient + freq +
 * sample tarif slug'lari)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { assertDbTarget } from "./lib/db-env";
import { asciiFold } from "../src/lib/nutrition/unit-convert";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  assertDbTarget("audit-mod-h-prep");

  const topArg = process.argv.find((a) => a.startsWith("--top="));
  const TOP_N = topArg ? parseInt(topArg.split("=")[1], 10) : 50;

  // 1. Tum ingredient'lari TR-fold + freq (Prisma client API)
  const allIngs = await prisma.recipeIngredient.findMany({
    select: { name: true, recipe: { select: { status: true } } },
  });
  const ingRows = (() => {
    const map = new Map<string, number>();
    for (const r of allIngs) {
      if (r.recipe.status !== "PUBLISHED") continue;
      map.set(r.name, (map.get(r.name) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, freq]) => ({
      raw_name: name,
      freq,
    }));
  })();

  // TR-fold + lowercase normalize
  const folded = new Map<string, { rawName: string; freq: number }>();
  for (const r of ingRows) {
    const key = asciiFold(r.raw_name.toLocaleLowerCase("tr-TR").trim());
    const existing = folded.get(key);
    if (existing) {
      existing.freq += r.freq;
    } else {
      folded.set(key, { rawName: r.raw_name, freq: r.freq });
    }
  }

  // 2. Top N freq
  const topN = Array.from(folded.entries())
    .sort((a, b) => b[1].freq - a[1].freq)
    .slice(0, TOP_N);

  // 3. Her ingredient icin 3 sample tarif slug
  const lines: string[] = [];
  lines.push(
    `# Mod H prep input (oturum 21)\n# Top ${TOP_N} ingredient by frequency\n# Kolonlar: rank \\t freq \\t name \\t sample_slugs (3 ornek)\n`,
  );

  for (let i = 0; i < topN.length; i++) {
    const [_key, { rawName, freq }] = topN[i];
    const samples = await prisma.recipe.findMany({
      where: {
        status: "PUBLISHED",
        ingredients: { some: { name: { equals: rawName, mode: "insensitive" } } },
      },
      select: { slug: true },
      take: 3,
    });
    const sampleStr = samples.map((s) => s.slug).join(", ");
    lines.push(`${i + 1}\t${freq}\t${rawName}\t${sampleStr}`);
  }

  const out = lines.join("\n") + "\n";
  fs.writeFileSync("docs/mod-h-ingredient-list.txt", out);
  console.log(out);
  console.log(
    `\n✅ docs/mod-h-ingredient-list.txt yazildi (top ${TOP_N} ingredient)`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
