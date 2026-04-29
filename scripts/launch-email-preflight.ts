/**
 * Lansman öncesi (T-7 gün) email altyapısı preflight kontrolü.
 *
 * Kontrol ettikleri:
 *   1. RESEND_API_KEY tanımlı mı, Resend `tarifle.app` domain VERIFIED mi
 *   2. SPF (TXT @) Resend include barındırıyor mu
 *   3. DKIM CNAME (resend._domainkey) çözümleniyor mu
 *   4. DMARC TXT (_dmarc) tanımlı mı (en az p=none)
 *   5. MX kayıtları Cloudflare Email Routing'e işaret ediyor mu
 *      (route1/2/3.mx.cloudflare.net)
 *
 * Asıl 6 alias'ın (iletisim/destek/kvkk/basin/editor/noreply) Cloudflare
 * dashboard'da forward kuralı kurulduğu DNS'ten doğrulanamaz, manuel
 * test maili at (her alias'a tek tek). Bu script altyapı tarafını
 * doğrular.
 *
 * Kullanim: npx tsx scripts/launch-email-preflight.ts
 *
 * docs/EMAIL_TEMPLATES.md §1 ve docs/FUTURE_PLANS.md Web Launch Checklist
 * bağlamında referans.
 */
import { promises as dns } from "node:dns";
import * as path from "node:path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env.local") });
dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const DOMAIN = "tarifle.app";
const EXPECTED_FROM = `noreply@${DOMAIN}`;
const RESEND_API = "https://api.resend.com/domains";

type CheckResult = {
  name: string;
  status: "PASS" | "FAIL" | "WARN";
  detail: string;
};

async function checkResendDomain(): Promise<CheckResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return {
      name: "Resend API key",
      status: "FAIL",
      detail: "RESEND_API_KEY .env.local'de tanımlı değil",
    };
  }

  try {
    const res = await fetch(RESEND_API, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      return {
        name: "Resend domain status",
        status: "FAIL",
        detail: `Resend API ${res.status} ${res.statusText}`,
      };
    }
    const body = (await res.json()) as { data?: Array<{ name: string; status: string }> };
    const found = body.data?.find((d) => d.name === DOMAIN);
    if (!found) {
      return {
        name: "Resend domain status",
        status: "FAIL",
        detail: `${DOMAIN} Resend dashboard'da kayıtlı değil (Add Domain)`,
      };
    }
    if (found.status !== "verified") {
      return {
        name: "Resend domain status",
        status: "FAIL",
        detail: `Resend domain status="${found.status}" (verified bekleniyordu)`,
      };
    }
    return {
      name: "Resend domain status",
      status: "PASS",
      detail: `${DOMAIN} verified, FROM=${EXPECTED_FROM} kullanıma hazır`,
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "bilinmeyen hata";
    return {
      name: "Resend domain status",
      status: "FAIL",
      detail: `Resend API çağrısı başarısız: ${msg}`,
    };
  }
}

async function checkSpf(): Promise<CheckResult> {
  try {
    const records = await dns.resolveTxt(DOMAIN);
    const flat = records.map((r) => r.join(""));
    const spf = flat.find((r) => r.startsWith("v=spf1"));
    if (!spf) {
      return {
        name: "SPF (TXT @)",
        status: "FAIL",
        detail: "v=spf1 TXT kaydı bulunamadı",
      };
    }
    if (!spf.includes("include:amazonses.com") && !spf.includes("include:_spf.resend.com")) {
      return {
        name: "SPF (TXT @)",
        status: "WARN",
        detail: `SPF var ama Resend include eksik: ${spf}`,
      };
    }
    return { name: "SPF (TXT @)", status: "PASS", detail: spf };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "bilinmeyen hata";
    return { name: "SPF (TXT @)", status: "FAIL", detail: msg };
  }
}

async function checkDkim(): Promise<CheckResult> {
  const host = `resend._domainkey.${DOMAIN}`;
  try {
    const records = await dns.resolveCname(host).catch(() => [] as string[]);
    if (records.length > 0) {
      return { name: "DKIM CNAME", status: "PASS", detail: `${host} → ${records[0]}` };
    }
    const txt = await dns.resolveTxt(host);
    if (txt.length > 0) {
      return { name: "DKIM TXT", status: "PASS", detail: `${host} TXT kayıt mevcut` };
    }
    return { name: "DKIM", status: "FAIL", detail: `${host} CNAME/TXT yok` };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "bilinmeyen hata";
    return { name: "DKIM", status: "FAIL", detail: `${host} çözümlenemedi: ${msg}` };
  }
}

async function checkDmarc(): Promise<CheckResult> {
  const host = `_dmarc.${DOMAIN}`;
  try {
    const records = await dns.resolveTxt(host);
    const flat = records.map((r) => r.join(""));
    const dmarc = flat.find((r) => r.startsWith("v=DMARC1"));
    if (!dmarc) {
      return { name: "DMARC", status: "WARN", detail: `${host} v=DMARC1 yok (p=none önerilir)` };
    }
    return { name: "DMARC", status: "PASS", detail: dmarc };
  } catch {
    return {
      name: "DMARC",
      status: "WARN",
      detail: `${host} TXT yok (opsiyonel ama önerilir)`,
    };
  }
}

async function checkMx(): Promise<CheckResult> {
  try {
    const mx = await dns.resolveMx(DOMAIN);
    const cfRoutes = mx.filter((r) => r.exchange.endsWith("mx.cloudflare.net"));
    if (cfRoutes.length === 0) {
      return {
        name: "MX (Cloudflare Email Routing)",
        status: "FAIL",
        detail: `MX yok veya Cloudflare değil: ${mx.map((r) => r.exchange).join(", ") || "boş"}`,
      };
    }
    return {
      name: "MX (Cloudflare Email Routing)",
      status: "PASS",
      detail: cfRoutes.map((r) => `${r.priority} ${r.exchange}`).join(", "),
    };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "bilinmeyen hata";
    return { name: "MX", status: "FAIL", detail: msg };
  }
}

async function main(): Promise<void> {
  console.log(`\n=== Tarifle Email Preflight: ${DOMAIN} ===\n`);

  const results = await Promise.all([
    checkResendDomain(),
    checkSpf(),
    checkDkim(),
    checkDmarc(),
    checkMx(),
  ]);

  const symbol = (s: CheckResult["status"]): string =>
    s === "PASS" ? "[OK]" : s === "WARN" ? "[!!]" : "[XX]";

  for (const r of results) {
    console.log(`${symbol(r.status)} ${r.name}\n     ${r.detail}\n`);
  }

  const failed = results.filter((r) => r.status === "FAIL").length;
  const warned = results.filter((r) => r.status === "WARN").length;

  console.log(`Sonuç: ${results.length - failed - warned} PASS, ${warned} WARN, ${failed} FAIL`);
  if (failed > 0) {
    console.log("\nLansman öncesi FAIL kayıtları çöz, sonra tekrar koştur.");
    console.log("Cloudflare Email Routing kurulumu: docs/EMAIL_TEMPLATES.md §1.3");
    process.exit(1);
  }
  if (warned > 0) {
    console.log("\nWARN kayıtları opsiyonel ama önerilir (DMARC vs.).");
  }
  console.log("\nManuel test: 6 alias için (iletisim/destek/kvkk/basin/editor/noreply)");
  console.log("test maili at + Gmail'e ulaştığını doğrula.");
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
