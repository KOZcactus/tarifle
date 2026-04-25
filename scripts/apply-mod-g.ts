/**
 * Mod G apply (oturum 21+): tipNote + servingSuggestion boilerplate
 * revize JSON'unu Recipe tablosuna atomic update olarak uygular.
 *
 * Brief: docs/CODEX_BATCH_BRIEF.md §17. JSON sema:
 *   [{
 *     slug: string,
 *     tipNote?: string | null,         // null = degistirme, mevcut kalsin
 *     servingSuggestion?: string | null
 *   }]
 *
 * **Davranis:**
 *   - Atomic update: sadece verilen alan(lar) update edilir
 *   - null = mevcut alan korunur (skip update)
 *   - Slug DB'de yoksa skip + warning
 *   - Her cumle 8-30 kelime arasi olmali (Brief §17.3 kalite kurali)
 *
 * Usage:
 *   npx tsx scripts/apply-mod-g.ts --file docs/mod-g-batch-1.json           # dry-run
 *   npx tsx scripts/apply-mod-g.ts --file docs/mod-g-batch-1.json --apply   # dev
 *   npx tsx scripts/apply-mod-g.ts --file docs/mod-g-batch-1.json --apply --confirm-prod
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

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");

const ItemSchema = z.object({
  slug: z.string().min(1),
  tipNote: z.string().min(1).nullable().optional(),
  servingSuggestion: z.string().min(1).nullable().optional(),
});

const BatchSchema = z.array(ItemSchema);

function getFileArg(): string {
  const eq = process.argv.find((a) => a.startsWith("--file="));
  if (eq) return eq.slice("--file=".length);
  const idx = process.argv.indexOf("--file");
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  console.error("Missing --file <path>.");
  process.exit(1);
}

function wordCount(s: string): number {
  return s.trim().split(/\s+/).length;
}

function validateQualityRules(items: z.infer<typeof BatchSchema>): {
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  const tipSeen = new Map<string, number>();
  const sugSeen = new Map<string, number>();

  for (const item of items) {
    if (item.tipNote) {
      const wc = wordCount(item.tipNote);
      if (wc < 8 || wc > 25) {
        errors.push(
          `[${item.slug}] tipNote ${wc} kelime (8-25 dısı): "${item.tipNote.slice(0, 60)}..."`,
        );
      }
      if (/[\u2014\u2013]/.test(item.tipNote)) {
        errors.push(`[${item.slug}] tipNote em-dash içeriyor`);
      }
      tipSeen.set(item.tipNote, (tipSeen.get(item.tipNote) ?? 0) + 1);
    }
    if (item.servingSuggestion) {
      const wc = wordCount(item.servingSuggestion);
      if (wc < 8 || wc > 30) {
        errors.push(
          `[${item.slug}] servingSuggestion ${wc} kelime (8-30 dısı)`,
        );
      }
      if (/[\u2014\u2013]/.test(item.servingSuggestion)) {
        errors.push(`[${item.slug}] servingSuggestion em-dash içeriyor`);
      }
      sugSeen.set(
        item.servingSuggestion,
        (sugSeen.get(item.servingSuggestion) ?? 0) + 1,
      );
    }
  }

  // Boilerplate engellemesi: aynı cümle 2+ kez geçmesin (batch içinde)
  for (const [text, n] of tipSeen) {
    if (n >= 2) {
      warnings.push(`tipNote "${text.slice(0, 50)}..." ${n} tarifte tekrar`);
    }
  }
  for (const [text, n] of sugSeen) {
    if (n >= 2) {
      warnings.push(
        `servingSuggestion "${text.slice(0, 50)}..." ${n} tarifte tekrar`,
      );
    }
  }

  return { errors, warnings };
}

async function main() {
  assertDbTarget("apply-mod-g");
  const filePath = getFileArg();
  console.log(`📄 Read: ${path.resolve(filePath)}`);
  console.log(`🎯 Target: ${process.env.DATABASE_URL?.includes("ep-icy-mountain") ? "production" : "dev"}`);
  console.log(`⚙️  Mode: ${APPLY ? "APPLY" : "DRY-RUN"}\n`);

  const raw = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const parsed = BatchSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("❌ Sema validation FAIL:");
    parsed.error.issues.slice(0, 10).forEach((e) =>
      console.error(`   ${e.path.join(".")}: ${e.message}`),
    );
    process.exit(1);
  }
  console.log(`✅ Sema validation: ${parsed.data.length} item temiz`);

  const { errors, warnings } = validateQualityRules(parsed.data);
  if (warnings.length > 0) {
    console.warn(`\n⚠ Uyarilar (${warnings.length}):`);
    warnings.forEach((w) => console.warn(`   ${w}`));
  }
  if (errors.length > 0) {
    console.error(`\n❌ Kalite kurallari FAIL (${errors.length}):`);
    errors.slice(0, 20).forEach((e) => console.error(`   ${e}`));
    process.exit(1);
  }

  let updated = 0;
  let skipped = 0;
  let tipUpdates = 0;
  let sugUpdates = 0;

  for (const item of parsed.data) {
    const recipe = await prisma.recipe.findUnique({
      where: { slug: item.slug },
      select: { id: true },
    });
    if (!recipe) {
      console.warn(`⏭  Slug yok: ${item.slug}`);
      skipped++;
      continue;
    }

    const data: { tipNote?: string; servingSuggestion?: string } = {};
    if (item.tipNote) {
      data.tipNote = item.tipNote;
      tipUpdates++;
    }
    if (item.servingSuggestion) {
      data.servingSuggestion = item.servingSuggestion;
      sugUpdates++;
    }
    if (Object.keys(data).length === 0) {
      skipped++;
      continue;
    }

    if (APPLY) {
      await prisma.recipe.update({ where: { id: recipe.id }, data });
    }
    updated++;
  }

  console.log(`\n📊 Sonuc:`);
  console.log(`  Toplam item:     ${parsed.data.length}`);
  console.log(`  Update edilen:   ${updated}`);
  console.log(`  Skip:            ${skipped}`);
  console.log(`  tipNote update:  ${tipUpdates}`);
  console.log(`  servSugg update: ${sugUpdates}`);
  console.log(`\n${APPLY ? "✅ Apply tamamlandi." : "💡 Apply icin --apply ekle."}`);

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
