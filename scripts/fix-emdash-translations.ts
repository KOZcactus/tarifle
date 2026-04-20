/**
 * Em-dash karakteri (U+2014) temizliği: Recipe.translations JSONB
 * içindeki EN/DE string alanlarından kaldırır, virgülle değiştirir.
 *
 * Kural: docs/EM_DASH_CLEANUP.md. Em-dash "AI yazdı" hissi veriyor,
 * global olarak yasak. Kullanıcı-görülen tarif metinlerinde
 * (title, description, tipNote, servingSuggestion, ingredients[].name,
 * steps[].instruction, steps[].tip) temizlik önceliği.
 *
 *   npx tsx scripts/fix-emdash-translations.ts             # dry-run
 *   npx tsx scripts/fix-emdash-translations.ts --apply     # write dev
 *   DATABASE_URL=<prod> npx tsx scripts/fix-emdash-translations.ts --apply --confirm-prod
 *
 * Idempotent: em-dash içermeyen kayıtlara dokunmaz.
 */
import { PrismaClient, type Prisma } from "@prisma/client";
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
const EM_DASH = "\u2014";

/** Replace em-dash with comma+space in strings, recursively in JSON. */
function cleanValue(value: unknown): { cleaned: unknown; hits: number } {
  if (typeof value === "string") {
    const count = (value.match(/\u2014/g) || []).length;
    if (count === 0) return { cleaned: value, hits: 0 };
    // ", " most common → ", "; standalone "," very rare, also → ", "
    const next = value
      .replace(/ \u2014 /g, ", ")
      .replace(/\u2014 /g, ", ")
      .replace(/ \u2014/g, ",")
      .replace(/\u2014/g, ",");
    return { cleaned: next, hits: count };
  }
  if (Array.isArray(value)) {
    let total = 0;
    const next = value.map((item) => {
      const r = cleanValue(item);
      total += r.hits;
      return r.cleaned;
    });
    return { cleaned: next, hits: total };
  }
  if (value && typeof value === "object") {
    let total = 0;
    const next: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      const r = cleanValue(v);
      total += r.hits;
      next[k] = r.cleaned;
    }
    return { cleaned: next, hits: total };
  }
  return { cleaned: value, hits: 0 };
}

async function main() {
  assertDbTarget("fix-emdash-translations");

  // Sadece translations içinde em-dash olan tarifleri çek (index scan değil,
  // translations JSONB büyük; LIKE hızlı çalışır dev/prod ölçeğinde).
  const candidates = await prisma.$queryRaw<
    { id: string; slug: string; translations: Prisma.JsonValue }[]
  >`
    SELECT id, slug, translations
    FROM recipes
    WHERE translations::text LIKE ${'%' + EM_DASH + '%'}
  `;

  console.log(`\n🔎 Em-dash içeren tarif: ${candidates.length}`);
  let updated = 0;
  let totalHits = 0;
  const samples: string[] = [];

  for (const row of candidates) {
    const before = row.translations;
    const { cleaned, hits } = cleanValue(before);
    if (hits === 0) continue;
    totalHits += hits;
    if (samples.length < 3) {
      samples.push(
        `  ${row.slug}: ${hits} em-dash`,
      );
    }
    if (APPLY) {
      await prisma.recipe.update({
        where: { id: row.id },
        data: { translations: cleaned as Prisma.InputJsonValue },
      });
      updated++;
    }
  }

  console.log(`   Toplam em-dash sayısı: ${totalHits}`);
  if (samples.length) {
    console.log("   Örnek:");
    samples.forEach((s) => console.log(s));
  }

  if (APPLY) {
    console.log(`\n✅ ${updated} tarif güncellendi.`);
  } else {
    console.log(`\n🧪 dry-run: ${candidates.length} kayıt değişecek.`);
    console.log("   Apply için: --apply");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
