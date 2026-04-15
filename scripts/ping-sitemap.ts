/**
 * Standalone sitemap ping runner. Her Codex batch seed + retrofit
 * sonrası otomatik çalışır (retrofit-all.ts zincirine eklendi), ancak
 * manuel çağırmak gerekirse:
 *
 *   npm run content:ping                         # varsayılan sitemap URL
 *   npm run content:ping -- --url https://.../  # custom URL override
 *
 * Exit kodu her zaman 0 — ping başarısızlığı batch pipeline'ını
 * durdurmamalı (search engine crawl gecikmesi kritik değil, seed
 * + retrofit çoktan DB'yi yazdı).
 */
import { pingSitemap, formatPingReport } from "../src/lib/seo-ping";

function parseUrl(argv: string[]): string | undefined {
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--url" && argv[i + 1]) return argv[i + 1];
  }
  return undefined;
}

async function main(): Promise<void> {
  const override = parseUrl(process.argv.slice(2));
  const target = override ?? "https://tarifle.app/sitemap.xml";

  console.log(`\n📡 Sitemap ping → ${target}\n`);
  const results = await pingSitemap(target);
  console.log(formatPingReport(results));

  const failCount = results.filter((r) => r.status === "failed").length;
  if (failCount > 0) {
    console.log(
      `\n⚠ ${failCount}/${results.length} ping başarısız — crawl gecikmesi olabilir ama seed/retrofit tamam.`,
    );
  } else {
    console.log(`\n✅ Tüm ping'ler başarılı.`);
  }
}

main().catch((err) => {
  // Non-fatal — seed pipeline zaten bitti. Sadece logla.
  console.error("⚠ Ping runner hatası:", err);
});
