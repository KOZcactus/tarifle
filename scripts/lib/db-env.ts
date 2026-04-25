/**
 * Tarifle'nin iki Neon branch'i var:
 *   - production (main) → tarifle.app + Vercel Production env
 *   - dev (child, main'den fork)  → lokal + Vercel Preview/Development
 *
 * Destructive script'ler (seed, fix, retrofit, rollback) default olarak hangi
 * DATABASE_URL set edilmişse oraya yazar. Yanlışlıkla prod'a yazmamak için
 * her destructive script başlatırken `assertDbTarget()` çağırır.
 *
 * Oturum 15 Neon -> Vercel Marketplace taşıması, oturum 20'de eski prefix'ler
 * kaldırıldı (5 günlük stabilite kanıtı sonrası, finansal aciliyet yok çünkü
 * Vercel Pro DB credits yeni branch'leri karşılıyor).
 */

/** Production Neon branch host prefix'leri (Vercel-managed Neon). */
const PROD_HOST_PREFIXES = [
  "ep-icy-mountain", // Vercel-managed Neon main branch (23 Nis 2026+)
] as const;

/** Dev Neon branch host prefix'leri (Vercel-managed Neon child branch). */
const DEV_HOST_PREFIXES = [
  "ep-jolly-haze", // Vercel-managed Neon dev branch (23 Nis 2026+)
] as const;

export type DbBranch = "production" | "dev" | "unknown";

export interface DbTargetInfo {
  branch: DbBranch;
  host: string;
  isProd: boolean;
}

/**
 * DATABASE_URL'deki host'tan hangi Neon branch olduğunu çıkar.
 * Unknown dönerse URL beklenmedik bir host'a işaret ediyor, ya bir test
 * ortamı, ya mis-configured .env. Caller karar verir.
 */
export function detectDbTarget(databaseUrl: string | undefined): DbTargetInfo {
  if (!databaseUrl) {
    return { branch: "unknown", host: "(DATABASE_URL missing)", isProd: false };
  }
  let host: string;
  try {
    host = new URL(databaseUrl).host;
  } catch {
    return { branch: "unknown", host: "(invalid URL)", isProd: false };
  }
  if (PROD_HOST_PREFIXES.some((p) => host.startsWith(p))) {
    return { branch: "production", host, isProd: true };
  }
  if (DEV_HOST_PREFIXES.some((p) => host.startsWith(p))) {
    return { branch: "dev", host, isProd: false };
  }
  return { branch: "unknown", host, isProd: false };
}

/**
 * Her destructive script'in ilk satırında çağır. Davranış:
 *   - dev  → info banner bas, devam et
 *   - unknown → uyarı bas, devam et (local docker / test branch olabilir)
 *   - prod → --confirm-prod flag yoksa process.exit(1); flag varsa kocaman
 *            uyarı banner'ı bas ve 3 saniye bekle (son şans iptal)
 *
 * Prod koşusu için beklenen pattern:
 *   $env:DATABASE_URL=(cat .env.production.local | grep ^DATABASE_URL | cut -d'"' -f2)
 *   npx tsx scripts/X.ts --confirm-prod
 *
 * Tek bir scripte iki kez çağırmaktan çekinme; idempotent.
 */
export function assertDbTarget(scriptName: string): DbTargetInfo {
  const info = detectDbTarget(process.env.DATABASE_URL);
  const flagPresent = process.argv.includes("--confirm-prod");

  if (info.branch === "unknown") {
    console.warn(
      `⚠️  [${scriptName}] Unknown DB host: ${info.host}, devam ediliyor.`,
    );
    return info;
  }

  if (info.branch === "dev") {
    console.log(`🌳 [${scriptName}] dev branch (${info.host})`);
    return info;
  }

  // PRODUCTION
  if (!flagPresent) {
    console.error(
      `\n⛔  [${scriptName}] PRODUCTION DB (${info.host})\n` +
        `\n` +
        `Bu script prod'a yazıyor. Emin değilsen durdur.\n` +
        `Devam etmek için: --confirm-prod flag'i gerekli.\n` +
        `\n` +
        `Doğru akış (docs/PROD_PROMOTE.md):\n` +
        `  1) Dev'de test + audit\n` +
        `  2) .env.production.local'deki URL'i env'e geçici set et\n` +
        `  3) Scripti --confirm-prod ile koş\n`,
    );
    process.exit(1);
  }

  // Flag var → 3 sn son şans
  console.warn(
    `\n⚠️  [${scriptName}] PRODUCTION write (${info.host}), 3 saniye içinde başlayacak...\n` +
      `   İptal için Ctrl+C (şimdi).\n`,
  );
  const start = Date.now();
  // Busy-wait 3 saniye, script başlamadan gözlerini kapat sayısı.
  while (Date.now() - start < 3_000) {
    // intentional: block main thread for 3s
  }
  return info;
}
