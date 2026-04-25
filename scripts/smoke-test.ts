/**
 * Tarifle launch öncesi + deploy sonrası smoke test (oturum 19 paketi).
 *
 * Kritik endpoint'ler 200 dönüyor mu, security header'lar düşmedi mi,
 * structured data geçerli mi, cron auth guard çalışıyor mu, hepsi
 * 30 saniye altında doğrulanır.
 *
 * Kullanım:
 *   npm run smoke                              # default https://tarifle.app
 *   SMOKE_BASE_URL=http://localhost:3000 npm run smoke
 *
 * Exit 0 her şey geçti, exit 1 başarısız test sayısı kadar.
 *
 * CI/Deploy hook olarak Vercel post-deploy + GitHub Actions cron
 * (haftalık) ile koşulabilir.
 *
 * Test kategorileri:
 *   1. Critical pages (200 status + content check)
 *   2. Sitemap / robots / manifest valid
 *   3. Security headers
 *   4. Cron endpoints auth guard (401)
 *   5. CSP report endpoint POST kabul
 *   6. Article + BreadcrumbList JSON-LD blog detail
 *   7. PWA i18n raw key check (oturum 19 dupe bug regression koruması)
 */

const BASE = process.env.SMOKE_BASE_URL ?? "https://tarifle.app";

interface TestResult {
  name: string;
  pass: boolean;
  detail?: string;
}

const results: TestResult[] = [];

function record(name: string, pass: boolean, detail?: string): void {
  results.push({ name, pass, detail });
  const icon = pass ? "✅" : "❌";
  const tail = detail ? `, ${detail}` : "";
  console.log(`  ${icon} ${name}${tail}`);
}

async function fetchUrl(
  url: string,
  init?: RequestInit,
): Promise<{ status: number; headers: Headers; text: string } | null> {
  try {
    const res = await fetch(url, init);
    const text = await res.text();
    return { status: res.status, headers: res.headers, text };
  } catch (err) {
    return null;
  }
}

async function testCriticalPages(): Promise<void> {
  console.log("\n📄 Kritik sayfalar (200 + içerik):");
  const pages = [
    { path: "/", contains: "Tarifle" },
    { path: "/tarifler", contains: "tarif" },
    { path: "/kategoriler", contains: "kategori" },
    { path: "/blog", contains: "Blog" },
    { path: "/kesfet", contains: "" },
    { path: "/ai-asistan", contains: "" },
    { path: "/menu-planlayici", contains: "" },
    { path: "/giris", contains: "Giriş" },
    { path: "/kayit", contains: "Kayıt" },
    { path: "/yasal", contains: "Yasal" },
    // Diyet skoru endpoint'leri (oturum 20 Faz 1+2)
    { path: "/blog/diyet-skoru-nasil-hesaplanir", contains: "Diyet" },
    { path: "/tarifler?siralama=diet-fit", contains: "tarif" },
    // Oturum 21 yeni blog yazıları (47-50)
    { path: "/blog/yag-kimyasi-ve-duman-noktalari", contains: "Yağ" },
    { path: "/blog/sote-vs-kavurma-vs-bugulama", contains: "Sote" },
    { path: "/blog/limon-ve-limon-suyu", contains: "Limon" },
    { path: "/blog/sirke-cesitleri", contains: "Sirke" },
    { path: "/blog/salamura-ve-marine-bilimi", contains: "Salamura" },
  ];

  for (const p of pages) {
    const r = await fetchUrl(`${BASE}${p.path}`);
    if (!r) {
      record(`GET ${p.path}`, false, "fetch fail");
      continue;
    }
    const okStatus = r.status === 200;
    const okContent = !p.contains || r.text.includes(p.contains);
    record(
      `GET ${p.path}`,
      okStatus && okContent,
      `status=${r.status}${!okContent ? " content-missing" : ""}`,
    );
  }
}

async function testSitemapManifestRobots(): Promise<void> {
  console.log("\n🗺️  Sitemap + robots + manifest:");
  const tests = [
    {
      path: "/sitemap.xml",
      check: (t: string) => t.includes("<urlset") && t.includes("</urlset>"),
    },
    {
      path: "/robots.txt",
      check: (t: string) => /user-agent:/i.test(t) && /sitemap:/i.test(t),
    },
    {
      path: "/manifest.webmanifest",
      check: (t: string) => {
        try {
          const m = JSON.parse(t);
          return m.name && m.start_url && Array.isArray(m.icons);
        } catch {
          return false;
        }
      },
    },
  ];

  for (const t of tests) {
    const r = await fetchUrl(`${BASE}${t.path}`);
    if (!r) {
      record(`GET ${t.path}`, false, "fetch fail");
      continue;
    }
    const ok = r.status === 200 && t.check(r.text);
    record(`GET ${t.path}`, ok, `status=${r.status}`);
  }
}

async function testSecurityHeaders(): Promise<void> {
  console.log("\n🔒 Security header'lar:");
  const r = await fetchUrl(BASE);
  if (!r) {
    record("Security headers", false, "fetch fail");
    return;
  }
  const required = [
    {
      key: "strict-transport-security",
      check: (v: string) => v.includes("max-age="),
    },
    {
      key: "x-content-type-options",
      check: (v: string) => v.toLowerCase() === "nosniff",
    },
    {
      key: "x-frame-options",
      check: (v: string) => v.toUpperCase() === "DENY",
    },
    {
      key: "referrer-policy",
      check: (v: string) => v.includes("strict-origin"),
    },
    {
      key: "permissions-policy",
      check: (v: string) =>
        v.includes("camera") && v.includes("microphone"),
    },
    {
      key: "content-security-policy-report-only",
      check: (v: string) =>
        v.includes("default-src 'self'") && v.includes("report-uri"),
    },
  ];

  for (const h of required) {
    const value = r.headers.get(h.key);
    const ok = value !== null && h.check(value);
    record(
      h.key,
      ok,
      value ? value.slice(0, 60) + (value.length > 60 ? "..." : "") : "missing",
    );
  }
}

async function testCronAuthGuard(): Promise<void> {
  console.log("\n🔐 Cron endpoint auth guard (401 beklenir):");
  const cronPaths = [
    "/api/cron/newsletter",
    "/api/cron/audit-report",
    "/api/cron/indexnow",
    "/api/cron/leaderboard",
  ];
  for (const p of cronPaths) {
    const r = await fetchUrl(`${BASE}${p}`);
    if (!r) {
      record(`GET ${p}`, false, "fetch fail");
      continue;
    }
    const ok = r.status === 401 || r.status === 403 || r.status === 503;
    record(`GET ${p}`, ok, `status=${r.status}`);
  }
}

async function testCspReportEndpoint(): Promise<void> {
  console.log("\n📡 CSP Report endpoint (POST):");
  const fakeReport = {
    "csp-report": {
      "document-uri": `${BASE}/`,
      "violated-directive": "script-src",
      "effective-directive": "script-src",
      "blocked-uri": "https://example.com/evil.js",
      "original-policy": "default-src 'self'",
    },
  };
  const r = await fetchUrl(`${BASE}/api/csp-report`, {
    method: "POST",
    headers: { "Content-Type": "application/csp-report" },
    body: JSON.stringify(fakeReport),
  });
  if (!r) {
    record("POST /api/csp-report", false, "fetch fail");
    return;
  }
  // 204 No Content veya 200 OK kabul
  const ok = r.status === 204 || r.status === 200;
  record("POST /api/csp-report", ok, `status=${r.status}`);
}

async function testJsonLdOnBlogDetail(): Promise<void> {
  console.log("\n📚 Blog detay JSON-LD (Article + BreadcrumbList):");
  // Önce blog listesinden bir slug çek
  const list = await fetchUrl(`${BASE}/blog`);
  if (!list) {
    record("Blog detay JSON-LD", false, "blog listesi fetch fail");
    return;
  }
  // Basit slug yakalama: href="/blog/<slug>"
  const slugMatch = list.text.match(/href="\/blog\/([a-z0-9\-]+)"/);
  if (!slugMatch) {
    record("Blog detay JSON-LD", false, "slug bulunamadı");
    return;
  }
  const slug = slugMatch[1];
  const r = await fetchUrl(`${BASE}/blog/${slug}`);
  if (!r || r.status !== 200) {
    record("Blog detay JSON-LD", false, `slug=${slug} status=${r?.status}`);
    return;
  }
  const hasArticle = r.text.includes('"@type":"Article"');
  const hasBreadcrumb = r.text.includes('"@type":"BreadcrumbList"');
  record(
    `Article schema /blog/${slug}`,
    hasArticle,
    hasArticle ? "var" : "eksik",
  );
  record(
    `BreadcrumbList schema /blog/${slug}`,
    hasBreadcrumb,
    hasBreadcrumb ? "var" : "eksik",
  );
}

async function testI18nKeysResolve(): Promise<void> {
  console.log("\n🌐 i18n raw key regression (oturum 19 dupe bug):");
  const r = await fetchUrl(BASE);
  if (!r) {
    record("i18n raw key check", false, "fetch fail");
    return;
  }
  // Raw key görünmemeli: "home.heroTitle", "home.searchPlaceholder",
  // "home.sectionFeatured" gibi
  const rawPatterns = [
    /home\.heroTitle/,
    /home\.searchPlaceholder/,
    /home\.sectionFeatured/,
    /home\.sectionCuisines/,
    /home\.aiBannerTitle/,
  ];
  let leakCount = 0;
  for (const p of rawPatterns) {
    if (p.test(r.text)) leakCount++;
  }
  record(
    "Anasayfa i18n raw key sayısı",
    leakCount === 0,
    leakCount === 0 ? "0 leak" : `${leakCount} raw key görünüyor`,
  );
}

async function main(): Promise<void> {
  const start = Date.now();
  console.log(`\n🚀 Tarifle smoke test → ${BASE}\n${"━".repeat(50)}`);

  await testCriticalPages();
  await testSitemapManifestRobots();
  await testSecurityHeaders();
  await testCronAuthGuard();
  await testCspReportEndpoint();
  await testJsonLdOnBlogDetail();
  await testI18nKeysResolve();

  const duration = ((Date.now() - start) / 1000).toFixed(1);
  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass);

  console.log(`\n${"━".repeat(50)}`);
  console.log(`📊 Sonuç (${duration}s): ${passed}/${results.length} PASS`);
  if (failed.length > 0) {
    console.log(`\n❌ ${failed.length} başarısız:`);
    for (const f of failed) {
      console.log(`   - ${f.name} ${f.detail ? `(${f.detail})` : ""}`);
    }
    process.exit(1);
  } else {
    console.log("✅ Tüm smoke testler PASS");
  }
}

main().catch((err) => {
  console.error("smoke test crash:", err);
  process.exit(1);
});
