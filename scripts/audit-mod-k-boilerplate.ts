/**
 * Prod source-DB drift audit: Mod K kalıntı boilerplate step text'leri.
 *
 * Pattern: step.instruction içinde recipe.title tekrar ediyorsa boilerplate
 * ihtimali yüksek. Klasik Mod K çıktısı (oturum 31 öncesi):
 *   "Peynirli Milföy ana malzemelerini ölçüp hazırlayın..."
 *   "Lorlu Zahterli Yumurta Pide yapmadan önce..."
 *   "{Title} 3 dakika dinlensin..."
 *
 * Eski Codex Mod K her step'i tarif başlığıyla başlatma alışkanlığı vardı.
 * Mod A v2'de bu kapatıldı, source'ta temiz step'ler. Ama prod'da Mod K
 * batch'lerinden kalan tarif'ler hala bu drift'le.
 *
 * Bu audit prod'u tarayıp:
 *   - Step text'inde recipe.title geçen tarifleri sayar
 *   - Recipe sayısı + step sayısı raporlar
 *   - Top 50 sample slug listeler
 *
 * Source-DB sync için ayrı bir fix script gerek (Codex'e Mod F gibi
 * boilerplate cleanup batch'i ya da source'tan re-apply).
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.production.local"), override: true });

interface Hit {
  recipeSlug: string;
  recipeTitle: string;
  affectedSteps: number;
  totalSteps: number;
  sample: string;
}

async function main(): Promise<void> {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });

  const recipes = await prisma.recipe.findMany({
    select: {
      slug: true,
      title: true,
      steps: { select: { stepNumber: true, instruction: true } },
    },
  });
  console.log(`Total recipes: ${recipes.length}\n`);

  const hits: Hit[] = [];
  for (const r of recipes) {
    if (r.steps.length === 0) continue;
    // Title-tekrar pattern: step instruction içinde tarif başlığı geçiyor mu
    // (case-insensitive substring). Title 3+ kelime ise daha güvenilir match.
    const titleParts = r.title.split(/\s+/).filter((w) => w.length >= 3);
    if (titleParts.length < 2) continue; // tek kelime başlıklar (Mantı, Kunefe) skip
    const titleLower = r.title.toLocaleLowerCase("tr-TR");
    let affected = 0;
    let firstSample = "";
    for (const s of r.steps) {
      const instrLower = s.instruction.toLocaleLowerCase("tr-TR");
      if (instrLower.includes(titleLower)) {
        affected++;
        if (!firstSample) firstSample = s.instruction;
      }
    }
    if (affected > 0) {
      hits.push({
        recipeSlug: r.slug,
        recipeTitle: r.title,
        affectedSteps: affected,
        totalSteps: r.steps.length,
        sample: firstSample.slice(0, 120),
      });
    }
  }

  hits.sort((a, b) => b.affectedSteps - a.affectedSteps);

  // CSV
  const csvPath = path.resolve("docs/mod-k-boilerplate-drift-prod.csv");
  const escape = (s: string): string => `"${s.replace(/"/g, '""')}"`;
  const csvLines = [
    "recipeSlug,recipeTitle,affectedSteps,totalSteps,sample",
    ...hits.map((h) => `${h.recipeSlug},${escape(h.recipeTitle)},${h.affectedSteps},${h.totalSteps},${escape(h.sample)}`),
  ];
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf8");

  console.log(`Mod K boilerplate drift: ${hits.length} tarif`);
  const totalAffected = hits.reduce((sum, h) => sum + h.affectedSteps, 0);
  console.log(`Toplam affected step: ${totalAffected}`);
  console.log(`\nTop 25 (en çok step):`);
  for (const h of hits.slice(0, 25)) {
    console.log(`  ${h.recipeSlug} (${h.affectedSteps}/${h.totalSteps}): ${h.sample}`);
  }
  console.log(`\nCSV: ${csvPath}`);
  await prisma.$disconnect();
}
main().catch(console.error);
