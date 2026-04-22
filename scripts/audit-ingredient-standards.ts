/**
 * Ingredient name standardı audit. RecipeIngredient.name kolonunda
 * duplicate/case/accent drift sorunlarini tespit eder. Sadece RAPOR uretir,
 * fix uygulamaz (apply ayri scriptte ya da manuel SQL).
 *
 * Tespit ettikleri:
 * 1. **Tam duplicate**: ayni name string'i x kullanim
 * 2. **Case drift**: "Tavuk gogsu" vs "tavuk gogsu" (case-insensitive ayni)
 * 3. **Accent drift**: "kirmizi biber" vs "kırmızı biber" (TR diacritic farkı)
 * 4. **Trailing whitespace**: " tuz" veya "tuz "
 * 5. **Normalize collision**: alphanumeric+lowercase normalize edince
 *    catisanlar (en yaygin standardizasyon hedefi)
 *
 * Usage:
 *   npx tsx scripts/audit-ingredient-standards.ts [--json]
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const JSON_OUT = process.argv.includes("--json");

/** Tum lowercase, accent strip, whitespace collapse. */
function normalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replace(/ç/g, "c")
    .replace(/ğ/g, "g")
    .replace(/ı/g, "i")
    .replace(/ö/g, "o")
    .replace(/ş/g, "s")
    .replace(/ü/g, "u")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function main() {
  const rows = await prisma.recipeIngredient.findMany({
    select: { name: true },
  });

  console.log(`📥 ${rows.length} ingredient row taranıyor`);

  const exactCounts = new Map<string, number>();
  const normalizedToVariants = new Map<string, Set<string>>();
  const trailingSpace: string[] = [];

  for (const row of rows) {
    const name = row.name;
    if (name !== name.trim()) trailingSpace.push(name);
    exactCounts.set(name, (exactCounts.get(name) ?? 0) + 1);
    const norm = normalize(name);
    if (norm.length === 0) continue;
    if (!normalizedToVariants.has(norm)) {
      normalizedToVariants.set(norm, new Set());
    }
    normalizedToVariants.get(norm)!.add(name);
  }

  // 1. Unique exact names
  console.log(`✅ Unique exact name: ${exactCounts.size}`);

  // 2. Trailing whitespace
  const trailingUnique = Array.from(new Set(trailingSpace));
  console.log(`⚠️  Trailing whitespace: ${trailingUnique.length} farklı isim`);

  // 3. Normalize collision (drift candidates)
  const collisions: { normalized: string; variants: string[]; totalUses: number }[] = [];
  for (const [norm, variants] of normalizedToVariants) {
    if (variants.size <= 1) continue;
    const variantList = Array.from(variants);
    const totalUses = variantList.reduce((sum, v) => sum + (exactCounts.get(v) ?? 0), 0);
    collisions.push({ normalized: norm, variants: variantList, totalUses });
  }
  collisions.sort((a, b) => b.totalUses - a.totalUses);

  console.log(
    `🚨 Normalize collision (drift): ${collisions.length} grup (${collisions.reduce(
      (s, c) => s + c.variants.length,
      0,
    )} toplam variant)`,
  );

  if (JSON_OUT) {
    console.log(JSON.stringify({ trailingUnique, collisions }, null, 2));
  } else {
    console.log("\n=== TOP 20 DRIFT GRUBU (sik kullanilan) ===");
    collisions.slice(0, 20).forEach((c, i) => {
      console.log(`${i + 1}. [${c.totalUses} kullanim] ${c.normalized}`);
      c.variants.forEach((v) => {
        console.log(`     - "${v}" (${exactCounts.get(v)}x)`);
      });
    });
    if (trailingUnique.length > 0) {
      console.log("\n=== TRAILING WHITESPACE ===");
      trailingUnique.slice(0, 10).forEach((n) => console.log(`  "${n}"`));
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e);
  process.exit(1);
});
