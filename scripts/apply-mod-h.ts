/**
 * Mod H apply (oturum 21+): IngredientGuide tablosuna Codex teslim
 * JSON'unu upsert eder.
 *
 * Brief: docs/CODEX_BATCH_BRIEF.md §18. JSON sema:
 *   [{
 *     name: string,                  // ingredient adi (TR)
 *     whyUsed: string,               // 8-40 kelime, gunluk dil
 *     substitutes: string[],         // 2-4 alternatif
 *     notes?: string | null          // opsiyonel ek not (8-40 kelime)
 *   }]
 *
 * Davranis:
 *   - upsert by name (mevcut ingredient zaten varsa update, yoksa create)
 *   - source = "Mod H Batch N" (--batch flag ile set)
 *   - Otomatik validate: kelime sayisi + em-dash + jargon yasak liste +
 *     substitute count + Turkce karakter
 *
 * Usage:
 *   npx tsx scripts/apply-mod-h.ts --file docs/mod-h-batch-1.json --batch 1           # dry-run
 *   npx tsx scripts/apply-mod-h.ts --file docs/mod-h-batch-1.json --batch 1 --apply   # dev
 *   npx tsx scripts/apply-mod-h.ts --file docs/mod-h-batch-1.json --batch 1 --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";
import { z } from "zod";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const APPLY = process.argv.includes("--apply");

// Yasak akademik/teknik jargon (Brief §18.3 Kural 5 (Türk teyze testi)
const JARGON_BLACKLIST = [
  "emülsiyon",
  "emulsiyon",
  "denatüre",
  "denature",
  "karamelizasyon",
  "polifenol",
  "viskozite",
  "uçucu yağ",
  "ucucu yag",
  "maillard",
  "denitrifikasyon",
  "hidrasyon",
  "antioksidan",
  "kapsaisin",
  "flavonoid",
];

const ItemSchema = z.object({
  name: z.string().min(1).max(200),
  whyUsed: z.string().min(1).max(500),
  substitutes: z.array(z.string().min(1)).min(2).max(4),
  notes: z.string().min(1).max(500).nullable().optional(),
});
const BatchSchema = z.array(ItemSchema);

function getStrArg(name: string, fallback?: string): string | undefined {
  const eq = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (eq) return eq.slice(name.length + 3);
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return fallback;
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

function validateQuality(items: z.infer<typeof BatchSchema>): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const item of items) {
    const wc = wordCount(item.whyUsed);
    if (wc < 8 || wc > 40) {
      errors.push(`[${item.name}] whyUsed ${wc} kelime (8-40 dısı)`);
    }
    if (/[\u2014\u2013]/.test(item.whyUsed)) {
      errors.push(`[${item.name}] whyUsed em-dash içeriyor`);
    }
    const lower = item.whyUsed.toLocaleLowerCase("tr-TR");
    for (const j of JARGON_BLACKLIST) {
      if (lower.includes(j)) {
        errors.push(`[${item.name}] whyUsed jargon "${j}" içeriyor (anlasilir dil)`);
      }
    }
    if (item.notes) {
      const wcN = wordCount(item.notes);
      if (wcN < 8 || wcN > 40) {
        errors.push(`[${item.name}] notes ${wcN} kelime (8-40 dısı)`);
      }
      if (/[\u2014\u2013]/.test(item.notes)) {
        errors.push(`[${item.name}] notes em-dash içeriyor`);
      }
      const lowerN = item.notes.toLocaleLowerCase("tr-TR");
      for (const j of JARGON_BLACKLIST) {
        if (lowerN.includes(j)) {
          errors.push(`[${item.name}] notes jargon "${j}" içeriyor`);
        }
      }
    }
    // substitutes word count: her alternatif 1-8 kelime
    for (const s of item.substitutes) {
      const swc = wordCount(s);
      if (swc < 1 || swc > 8) {
        warnings.push(
          `[${item.name}] substitute "${s}" ${swc} kelime (1-8 ideal)`,
        );
      }
    }
  }

  // Boilerplate engelleyici: aynı whyUsed cümlesi 2+ entry'de tekrar
  const seen = new Map<string, number>();
  for (const item of items) {
    seen.set(item.whyUsed, (seen.get(item.whyUsed) ?? 0) + 1);
  }
  for (const [text, n] of seen) {
    if (n >= 2) {
      warnings.push(`whyUsed "${text.slice(0, 60)}..." ${n} ingredient'ta tekrar`);
    }
  }

  return { errors, warnings };
}

async function main() {
  assertDbTarget("apply-mod-h");

  const filePath = getStrArg("file");
  if (!filePath) {
    console.error("Missing --file <path>");
    process.exit(1);
  }
  const batchId = getStrArg("batch", "?");

  console.log(`📄 Read: ${path.resolve(filePath)}`);
  console.log(
    `🎯 Target: ${process.env.DATABASE_URL?.includes("ep-icy-mountain") ? "production" : "dev"}`,
  );
  console.log(`⚙️  Mode: ${APPLY ? "APPLY" : "DRY-RUN"}`);
  console.log(`🔖 Source tag: Mod H Batch ${batchId}\n`);

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const parsed = BatchSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("❌ Sema validation FAIL:");
    parsed.error.issues
      .slice(0, 10)
      .forEach((e) => console.error(`   ${e.path.join(".")}: ${e.message}`));
    process.exit(1);
  }
  console.log(`✅ Sema validation: ${parsed.data.length} item temiz`);

  const { errors, warnings } = validateQuality(parsed.data);
  if (warnings.length > 0) {
    console.warn(`\n⚠ Uyarilar (${warnings.length}):`);
    warnings.slice(0, 20).forEach((w) => console.warn(`   ${w}`));
  }
  if (errors.length > 0) {
    console.error(`\n❌ Kalite kurallari FAIL (${errors.length}):`);
    errors.slice(0, 30).forEach((e) => console.error(`   ${e}`));
    process.exit(1);
  }

  let created = 0;
  let updated = 0;

  for (const item of parsed.data) {
    if (APPLY) {
      const existing = await prisma.ingredientGuide.findUnique({
        where: { name: item.name },
      });
      await prisma.ingredientGuide.upsert({
        where: { name: item.name },
        update: {
          whyUsed: item.whyUsed,
          substitutes: item.substitutes,
          notes: item.notes ?? null,
          source: `Mod H Batch ${batchId}`,
        },
        create: {
          name: item.name,
          whyUsed: item.whyUsed,
          substitutes: item.substitutes,
          notes: item.notes ?? null,
          source: `Mod H Batch ${batchId}`,
        },
      });
      if (existing) updated++;
      else created++;
    }
  }

  console.log(`\n📊 Sonuc:`);
  console.log(`  Toplam item:    ${parsed.data.length}`);
  console.log(`  Created:        ${created}`);
  console.log(`  Updated:        ${updated}`);
  console.log(
    `\n${APPLY ? "✅ Apply tamamlandi." : "💡 Apply icin --apply ekle."}`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
