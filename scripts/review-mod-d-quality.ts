/**
 * Mod D batch kalite review aracisi. Codex teslimlerinin elle review
 * yardimcisi; ileride yeni batch geldikce tekrar kosturulabilir.
 *
 * IKI tarama:
 * 1. Codex'in REVIZE ETTIGI tariflerin (verilen batch JSON'larinin union'i)
 *    tipNote + servingSuggestion icinde generic/vague/subjective ifade
 *    var mi? Brief §13.4 "supheliyse DOKUNMA" ilkesi tutarli mi?
 * 2. Codex'in DOKUNMADIGI tariflerin (top N - revise edilen) DB'deki
 *    mevcut tipNote + serv degerlerinde hala generic ifade var mi?
 *    False-negative riski - Codex kacirdiysa biz manual flag ederiz.
 *
 * Usage:
 *   # Default: batch 1+2 (top 200) tarama
 *   npx tsx scripts/review-mod-d-quality.ts
 *
 *   # Belirli batch'leri tara
 *   npx tsx scripts/review-mod-d-quality.ts --batches 3,4,5
 *
 *   # Tum mevcut batch'leri otomatik bul + tara
 *   npx tsx scripts/review-mod-d-quality.ts --all
 *
 * Suspect patterns:
 *   - "iyice", "biraz", "bolca", "az" (vague olcu)
 *   - "cok guzel", "bayilacaksiniz", "harika" (subjective)
 *   - "Sicak servis edin." (generic boilerplate, period sonu)
 *   - <8 kelime (cok kisa)
 *   - "olur", "edilir" basla (pasif boilerplate)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const VAGUE_RE = /\b(iyice|biraz|bolca|az\s+miktar|hafifce|gerektigi\s+kadar|gerektigi\s+gibi|tadina\s+gore)\b/i;
const SUBJECTIVE_RE = /\b(cok\s+guzel|bayilacak|harika|muhtesem|mukemmel|en\s+iyisi|essiz)\b/i;
const GENERIC_SERV_RE = /^(Sicak\s+servis\s+edin|Soguk\s+servis\s+edin|Ilik\s+servis\s+edin)\.?$/i;
const PASSIVE_START_RE = /^(Olur|Edilir|Yapilir)\b/i;

function trAsciiFold(s: string): string {
  return s
    .replace(/ç/g, "c").replace(/Ç/g, "C")
    .replace(/ğ/g, "g").replace(/Ğ/g, "G")
    .replace(/ı/g, "i").replace(/İ/g, "I")
    .replace(/ö/g, "o").replace(/Ö/g, "O")
    .replace(/ş/g, "s").replace(/Ş/g, "S")
    .replace(/ü/g, "u").replace(/Ü/g, "U");
}

function checkText(text: string): { issues: string[]; wc: number } {
  const ascii = trAsciiFold(text);
  const issues: string[] = [];
  const wc = text.split(/\s+/).filter(Boolean).length;
  if (wc < 8) issues.push(`kisa ${wc} kelime`);
  if (wc > 20) issues.push(`uzun ${wc} kelime`);
  if (VAGUE_RE.test(ascii)) issues.push("vague (iyice/biraz/bolca)");
  if (SUBJECTIVE_RE.test(ascii)) issues.push("subjective (cok guzel/harika)");
  if (GENERIC_SERV_RE.test(text)) issues.push("generic servis boilerplate");
  if (PASSIVE_START_RE.test(text)) issues.push("pasif boilerplate basla");
  return { issues, wc };
}

function parseBatchesArg(): number[] {
  if (process.argv.includes("--all")) {
    const dir = "docs";
    const re = /^editorial-revisions-batch-(\d+)\.json$/;
    return fs
      .readdirSync(dir)
      .map((f) => f.match(re)?.[1])
      .filter((n): n is string => Boolean(n))
      .map((n) => parseInt(n, 10))
      .sort((a, b) => a - b);
  }
  const idx = process.argv.indexOf("--batches");
  if (idx >= 0 && process.argv[idx + 1]) {
    return process.argv[idx + 1]!
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => Number.isInteger(n) && n > 0);
  }
  // Default: batch 1+2 (top 200)
  return [1, 2];
}

async function main() {
  const batches = parseBatchesArg();
  if (batches.length === 0) {
    console.error("HATA: hic batch yok (--batches N1,N2 veya --all kullan).");
    process.exit(1);
  }

  // 1. Verilen batch JSON'lardan revize edilen slug'lar union
  const allRevisedSlugs = new Set<string>();
  const batchSummary: { batch: number; count: number }[] = [];
  for (const n of batches) {
    const file = `docs/editorial-revisions-batch-${n}.json`;
    if (!fs.existsSync(file)) {
      console.warn(`⚠️  ${file} yok, atlandi`);
      continue;
    }
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    data.forEach((d: { slug: string }) => allRevisedSlugs.add(d.slug));
    batchSummary.push({ batch: n, count: data.length });
  }

  console.log(
    `📥 Batch'ler: ${batchSummary.map((b) => `B${b.batch}(${b.count})`).join(" + ")} = ${allRevisedSlugs.size} unique revize`,
  );

  // 2. Top N viewCount tarif (her batch 100, top N = batches.length × 100)
  const topN = batches.length * 100;
  const topRecipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    orderBy: [{ viewCount: "desc" }, { slug: "asc" }],
    take: topN,
    select: { slug: true, title: true, tipNote: true, servingSuggestion: true, viewCount: true },
  });

  console.log(`📥 Top ${topN} viewCount cekildi: ${topRecipes.length} tarif\n`);
  // Local alias to keep downstream code names readable.
  const top200 = topRecipes;

  // CHECK A: Codex revize edenlerin kalitesi
  const revisedFlags: { slug: string; field: string; issues: string[]; text: string }[] = [];
  for (const r of top200) {
    if (!allRevisedSlugs.has(r.slug)) continue;
    if (r.tipNote) {
      const { issues } = checkText(r.tipNote);
      if (issues.length) revisedFlags.push({ slug: r.slug, field: "tipNote", issues, text: r.tipNote });
    }
    if (r.servingSuggestion) {
      const { issues } = checkText(r.servingSuggestion);
      if (issues.length) revisedFlags.push({ slug: r.slug, field: "serv", issues, text: r.servingSuggestion });
    }
  }

  // CHECK B: Codex dokunmadiklarinin durumu (false-negative)
  const untouchedFlags: { slug: string; field: string; issues: string[]; text: string }[] = [];
  for (const r of top200) {
    if (allRevisedSlugs.has(r.slug)) continue;
    if (r.tipNote) {
      const { issues } = checkText(r.tipNote);
      if (issues.length) untouchedFlags.push({ slug: r.slug, field: "tipNote", issues, text: r.tipNote });
    }
    if (r.servingSuggestion) {
      const { issues } = checkText(r.servingSuggestion);
      if (issues.length) untouchedFlags.push({ slug: r.slug, field: "serv", issues, text: r.servingSuggestion });
    }
  }

  console.log(`=== CHECK A: Codex REVIZE ettiklerinde sorun ===`);
  console.log(
    `Toplam revize alan (tip+serv): ${revisedFlags.length === 0 ? "0 sorun ✅" : revisedFlags.length + " flag"}`,
  );
  revisedFlags.forEach((f) => {
    console.log(`  [${f.slug}] ${f.field}: ${f.issues.join(", ")}`);
    console.log(`     → "${f.text}"`);
  });

  console.log(`\n=== CHECK B: Codex DOKUNMADIGI tariflerde gizli kalitesizlik ===`);
  const untouchedCount = top200.length - allRevisedSlugs.size;
  console.log(
    `Dokunulmamis: ${untouchedCount} tarif, ${untouchedFlags.length === 0 ? "0 false-negative ✅" : untouchedFlags.length + " flag"}`,
  );
  untouchedFlags.slice(0, 30).forEach((f) => {
    console.log(`  [${f.slug}] ${f.field}: ${f.issues.join(", ")}`);
    console.log(`     → "${f.text}"`);
  });
  if (untouchedFlags.length > 30) {
    console.log(`  ... +${untouchedFlags.length - 30} daha`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e);
  process.exit(1);
});
