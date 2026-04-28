/**
 * Verify-untracked MAJOR kuyrugu icin jenerik scaffold pattern arama.
 * Prod step instruction'larinda olusan jenerik sablon pattern'lerini
 * tarayip, paketi 16-24'te kapatilmayan slug'lari list eder.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local"), override: true });

// Jenerik scaffold pattern'leri (paketi 16-36 deneyiminden + oturum 31 yeni keşif)
const SCAFFOLD_PATTERNS = [
  // Mevcut 13 (paketi 16-24 deneyiminden)
  "kalan malzemeleri ölçün ve kesilecek sebze",
  "son tuz, yağ ve ekşi dengesini kontrol",
  "tabakta su salıp dokusu kaymasın",
  "tavayı orta ateşte 2 dakika ısıtın",
  "sosunu veya bağlayıcı harcını ayrı kapta",
  "şekil verecek kıvama gelene kadar toparlayın",
  "tüm malzemeyi servis öncesi hazırlayın",
  "sıvılarını ve aromatiklerini dengeli biçimde karıştırın",
  "kuru ve yaş malzemeleri ayırın",
  "soğursa gevrek kenarlar yumuşar",
  "peynirli doku sertleşir",
  "tuz, baharat ve ekşi malzemeyi ayrı kapta birleştirin",
  "servis tabağını ve yan malzemeleri hazırlayın",
  // 8 yeni pattern (oturum 31 keşif, find-new-boilerplate-patterns.ts)
  "ılık tabaklara alın, yanında çayla",
  "son dokusunu kontrol edip tabaklayın",
  "ritim bozulmasın",
  "gluten gevşesin",
  "akışı için",
  "sıcak servis kıvamı korur",
  "sıcak adımlarda arama yapılmasın",
  "akışında kullanılacak tava",
];

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log("DB:", new URL(url).host);

  // Closed slug listesi (paketi 1-39)
  const closedSlugs = new Set<string>();
  for (let i = 1; i <= 39; i++) {
    const file = path.resolve(`scripts/fix-mini-rev-batch-${i}.ts`);
    if (!fs.existsSync(file)) continue;
    const content = fs.readFileSync(file, "utf-8");
    const matches = content.matchAll(/slug: "([^"]+)"/g);
    for (const m of matches) closedSlugs.add(m[1]);
  }
  console.log(`Closed slugs (paketi 1-39): ${closedSlugs.size}`);

  // Tüm prod tariflerini çek, scaffold pattern içerenleri filter
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      steps: { select: { instruction: true } },
    },
  });
  console.log(`Total prod recipes: ${recipes.length}`);

  type Hit = { slug: string; title: string; matchedPatterns: string[] };
  const hits: Hit[] = [];

  for (const r of recipes) {
    if (closedSlugs.has(r.slug)) continue;
    const allText = r.steps.map((s) => s.instruction).join(" ").toLowerCase();
    const matched: string[] = [];
    for (const p of SCAFFOLD_PATTERNS) {
      if (allText.includes(p.toLowerCase())) matched.push(p);
    }
    if (matched.length >= 2) {
      hits.push({ slug: r.slug, title: r.title, matchedPatterns: matched });
    }
  }

  hits.sort((a, b) => b.matchedPatterns.length - a.matchedPatterns.length);

  console.log(`\n=== Hit count: ${hits.length} (jenerik scaffold pattern, paketi 1-39'te kapatılmamış) ===`);
  console.log(`Top 30 (matched count desc):\n`);
  hits.slice(0, 30).forEach((h, i) => {
    console.log(`${i + 1}. ${h.slug}`);
    console.log(`   "${h.title}" | ${h.matchedPatterns.length} pattern`);
  });

  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
