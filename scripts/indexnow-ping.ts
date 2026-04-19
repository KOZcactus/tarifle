/**
 * IndexNow CLI — Bing/Yandex/Seznam'a batch URL ping.
 *
 * Kullanım:
 *   # Son N yeni/güncellenen tarifi ping (default 50)
 *   npx tsx scripts/indexnow-ping.ts
 *   npx tsx scripts/indexnow-ping.ts --recent 200
 *
 *   # Tüm PUBLISHED tarifleri ping (ilk setup veya rotate)
 *   npx tsx scripts/indexnow-ping.ts --all
 *
 *   # Spesifik URL'ler
 *   npx tsx scripts/indexnow-ping.ts --urls https://tarifle.app/tarif/abc,https://tarifle.app/tarif/def
 *
 *   # search-submission-urls.txt'i kaynak olarak kullan
 *   npx tsx scripts/indexnow-ping.ts --file docs/search-submission-urls.txt
 *
 * Env: `INDEXNOW_KEY` set olmalı (.env.local veya inline).
 *      `NEXT_PUBLIC_SITE_URL` default "https://tarifle.app".
 *
 * Not: API tek istekte 10 000 URL'ye kadar kabul eder; helper otomatik
 * chunk'lar. Günlük limit yok — idempotent, aynı URL tekrar gönderilebilir.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { pingIndexNow, getSiteBaseUrl, isValidKey } from "../src/lib/indexnow";

neonConfig.webSocketConstructor = ws;
const __d = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__d, "..", ".env.local") });

function flagValue(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return undefined;
  return process.argv[idx + 1];
}
function flagPresent(flag: string): boolean {
  return process.argv.includes(flag);
}

async function collectUrls(): Promise<{ urls: string[]; source: string }> {
  const base = getSiteBaseUrl();

  const inlineUrls = flagValue("--urls");
  if (inlineUrls) {
    return {
      urls: inlineUrls.split(",").map((s) => s.trim()).filter(Boolean),
      source: "inline",
    };
  }

  const filePath = flagValue("--file");
  if (filePath) {
    const abs = resolve(process.cwd(), filePath);
    const lines = readFileSync(abs, "utf8")
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith("#"));
    return { urls: lines, source: `file:${filePath}` };
  }

  // DB tabanlı seçenekler Prisma gerekir
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });
  try {
    if (flagPresent("--all")) {
      const recipes = await prisma.recipe.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true },
      });
      return {
        urls: recipes.map((r) => `${base}/tarif/${r.slug}`),
        source: `db:all (${recipes.length})`,
      };
    }

    const n = parseInt(flagValue("--recent") ?? "50", 10);
    const recipes = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { updatedAt: "desc" },
      take: isNaN(n) ? 50 : n,
      select: { slug: true },
    });
    return {
      urls: recipes.map((r) => `${base}/tarif/${r.slug}`),
      source: `db:recent (${recipes.length})`,
    };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  if (!isValidKey(process.env.INDEXNOW_KEY)) {
    console.error("❌ INDEXNOW_KEY env set değil (veya invalid format).");
    console.error(
      "   .env.local'e ekle: INDEXNOW_KEY=<32-char hex lowercase>",
    );
    process.exit(1);
  }

  const { urls, source } = await collectUrls();
  console.log(`📥 Source: ${source}`);
  console.log(`📤 Ping'lenecek URL sayısı: ${urls.length}`);

  if (urls.length === 0) {
    console.log("⚠️  Hiç URL yok, çıkılıyor.");
    return;
  }

  const result = await pingIndexNow(urls);
  if (result.ok) {
    console.log(`✅ IndexNow ${result.status} — ${result.submitted} URL ping'lendi`);
    if (result.skipped) {
      console.log(`   Atlandı: ${result.skipped} (host mismatch veya malformed)`);
    }
  } else {
    console.error(`❌ IndexNow başarısız: ${result.reason}`);
    console.error(`   Status: ${result.status}, Submitted: ${result.submitted}`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
