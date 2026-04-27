/**
 * Mod K (Tarif Kontrol) Codex teslim sonrasi verify pipeline'i.
 * docs/mod-k-batch-N.json'lardaki entry'leri DB'ye karsi dogrular +
 * format integrity + brief §20 kalite kurallari kontrolu yapar +
 * markdown rapor uretir.
 *
 * Apply YAPMAZ. Sadece okur, dogrular, rapor yazar. Apply icin ayri
 * script: apply-mod-k-batch.ts.
 *
 * Cikti:
 *   - docs/mod-k-verify-report.md (markdown rapor: PASS / CORRECTION /
 *     MAJOR_ISSUE counts + issue listesi + ornek 5 entry per kategori)
 *
 * Usage:
 *   npx tsx scripts/verify-mod-k-batch.ts                # tum batch'ler
 *   npx tsx scripts/verify-mod-k-batch.ts --batch 1      # tek batch
 *   npx tsx scripts/verify-mod-k-batch.ts --batch 1,2    # birden cok
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

interface ModKEntry {
  slug: string;
  verdict: "PASS" | "CORRECTION" | "MAJOR_ISSUE";
  issues?: string[];
  corrections?: {
    description?: string;
    cuisine?: string;
    ingredients_add?: Array<{ name: string; amount: string; unit: string; group?: string }>;
    ingredients_remove?: string[];
    ingredients_amount_change?: Array<{ name: string; newAmount: string; newUnit?: string }>;
    steps_replace?: Array<{ stepNumber: number; instruction: string; timerSeconds?: number | null }>;
    tipNote?: string;
    servingSuggestion?: string;
    prepMinutes?: number;
    cookMinutes?: number;
    totalMinutes?: number;
    servingCount?: number;
    averageCalories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    tags_add?: string[];
    tags_remove?: string[];
    allergens_add?: string[];
    allergens_remove?: string[];
  };
  sources?: string[];
  confidence?: "high" | "medium" | "low";
  reason?: string;
}

interface DbRecipe {
  id: string;
  slug: string;
  description: string;
  tipNote: string | null;
  servingSuggestion: string | null;
  status: string;
  totalMinutes: number;
  prepMinutes: number;
  cookMinutes: number;
}

// Kural 10 (oturum 25 GPT audit), yüksek-yağ ingredient lookup. Set
// içinde geçen ingredient adı varsa nutrition anomaly suspect flag.
// TR locale lowercase, ASCII fold + diakritik versiyonları dahil.
const HIGH_FAT_INGREDIENTS = new Set([
  "kuyruk yağı", "kuyruk yagi",
  "tereyağı", "tereyagi", "tere yağı", "tere yagi",
  "zeytinyağı", "zeytinyagi", "zeytin yağı", "zeytin yagi",
  "ay çiçek yağı", "ay cicek yagi", "ayçiçek yağı", "aycicek yagi",
  "mısırözü yağı", "misir ozu yagi", "misirozu yagi",
  "hindistan cevizi yağı", "hindistan cevizi yagi",
  "susam yağı", "susam yagi",
  "yer fıstığı yağı", "yer fistigi yagi",
  "kanola yağı", "kanola yagi",
  "krema",
  "kaymak",
  "badem yağı", "badem yagi",
  "ceviz yağı", "ceviz yagi",
  "fındık yağı", "findik yagi",
]);

interface VerifiedEntry {
  entry: ModKEntry;
  db: DbRecipe | null;
  issues: string[];
  cleanForApply: boolean;
}

const SHISIRME_MAX_RATIO = 1.2; // description/tipNote max %20 uzar
const REASON_MIN = 50;
const REASON_MAX = 300;
const JARGON_YASAK = [
  "emülsiyon", "denatüre", "karamelizasyon", "polifenol", "viskozite",
  "Maillard", "antioksidan", "kapsaisin", "flavonoid", "uçucu yağ",
  "hidrasyon",
];
const TURKISH_CHARS = /[çğıöşüÇĞİÖŞÜ]/;
const ASCII_FOLD_HINTS = [
  "Tavugu", "yogurt", "yumusatir", "sarimsak", "bekletin", "sicakligi",
  "isiyla", "guzel", "lezzetli", "duzenli",
];

// Sub-batch keys: "1a", "1b", "2a", "2b" ...
function parseBatchArg(): string[] | null {
  const idx = process.argv.indexOf("--batch");
  if (idx === -1 || !process.argv[idx + 1]) return null;
  return process.argv[idx + 1]
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter((s) => /^\d+[ab]$/.test(s));
}

function discoverBatchFiles(filter: string[] | null): string[] {
  const docsDir = path.resolve(process.cwd(), "docs");
  const all = fs
    .readdirSync(docsDir)
    .filter((f) => /^mod-k-batch-\d+[ab]\.json$/.test(f))
    .sort();
  if (!filter) return all.map((f) => path.join(docsDir, f));
  const set = new Set(filter);
  return all
    .filter((f) => {
      const m = f.match(/^mod-k-batch-(\d+[ab])\.json$/);
      return m && set.has(m[1]);
    })
    .map((f) => path.join(docsDir, f));
}

// Tarifle enum'lar (brief §5)
const VALID_TAGS = new Set([
  "pratik", "30-dakika-alti", "dusuk-kalorili", "yuksek-protein",
  "firinda", "tek-tencere", "misafir-sofrasi", "cocuk-dostu",
  "butce-dostu", "vegan", "vejetaryen", "alkollu", "alkolsuz",
  "kis-tarifi", "yaz-tarifi",
]);
// Prisma schema enum Allergen (10 deger). KABUKLU_DENIZ/BALIK/FISTIK
// yanlistir; dogru karsiliklar DENIZ_URUNLERI / YER_FISTIGI / KEREVIZ.
const VALID_ALLERGENS = new Set([
  "GLUTEN", "SUT", "YUMURTA", "KUSUYEMIS", "YER_FISTIGI",
  "SOYA", "DENIZ_URUNLERI", "SUSAM", "KEREVIZ", "HARDAL",
]);

// Tarifle CUISINE_CODES (src/lib/cuisines.ts), 37 kod (oturum 25 +tn
// +ar +co +ve +dk +za, oturum 27 +pt Mod K Batch 19b lisbon-portekiz
// gap'i icin eklendi).
const VALID_CUISINES = new Set([
  "tr", "it", "fr", "es", "gr", "jp", "cn", "kr", "th", "in",
  "mx", "us", "me", "ma", "vn", "br", "cu", "ru", "hu", "se",
  "pe", "gb", "pl", "au", "de", "ir", "pk", "id", "et", "ng",
  "tn", "ar", "co", "ve", "dk", "za", "pt", "cl", "ge",
]);

function isHttpUrl(u: string): boolean {
  try {
    const url = new URL(u);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function urlDomain(u: string): string | null {
  try {
    return new URL(u).hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return null;
  }
}

function hasEmDash(s: string | undefined | null): boolean {
  if (!s) return false;
  return /[\u2014\u2013]/.test(s);
}

function looksAsciiFolded(s: string | undefined | null): boolean {
  if (!s) return false;
  // Hicbir TR karakter yoksa ve cumle yeterince uzunsa supheli
  if (s.length < 30) return false;
  if (TURKISH_CHARS.test(s)) return false;
  // Bilinen ASCII fold hint kelime varsa kesin
  for (const hint of ASCII_FOLD_HINTS) {
    if (s.includes(hint)) return true;
  }
  // 30+ char cumle TR karakter icermiyorsa supheli
  return true;
}

function hasJargon(s: string | undefined | null): string | null {
  if (!s) return null;
  const lower = s.toLocaleLowerCase("tr");
  for (const j of JARGON_YASAK) {
    if (lower.includes(j.toLocaleLowerCase("tr"))) return j;
  }
  return null;
}

function validateEntry(entry: ModKEntry, db: DbRecipe | null): string[] {
  const issues: string[] = [];

  if (!entry.slug || typeof entry.slug !== "string") {
    issues.push("slug yok veya gecersiz");
    return issues;
  }
  if (!entry.verdict || !["PASS", "CORRECTION", "MAJOR_ISSUE"].includes(entry.verdict)) {
    issues.push("verdict yok veya gecersiz (PASS/CORRECTION/MAJOR_ISSUE)");
    return issues;
  }
  if (!db) {
    issues.push("DB'de slug bulunamadi (PUBLISHED filter)");
    return issues;
  }
  if (db.status !== "PUBLISHED") {
    issues.push(`status PUBLISHED degil (${db.status})`);
  }

  // Sources >= 2 farkli domain (PASS dahil)
  if (!Array.isArray(entry.sources) || entry.sources.length < 2) {
    issues.push("sources < 2 (en az 2 farkli domain zorunlu)");
  } else {
    const invalidUrls = entry.sources.filter((u) => !isHttpUrl(u));
    if (invalidUrls.length > 0) {
      issues.push(`gecersiz URL(${invalidUrls.length}): ${invalidUrls.slice(0, 2).join(", ")}`);
    }
    const domains = entry.sources
      .map(urlDomain)
      .filter((d): d is string => d !== null);
    const uniqueDomains = new Set(domains);
    if (uniqueDomains.size < 2) {
      issues.push(`farkli domain < 2 (${[...uniqueDomains].join(", ") || "yok"})`);
    }
  }

  // Confidence
  if (!entry.confidence || !["high", "medium", "low"].includes(entry.confidence)) {
    issues.push("confidence high/medium/low olmali");
  }

  // Reason
  if (!entry.reason || entry.reason.trim().length < REASON_MIN) {
    issues.push(`reason cok kisa (<${REASON_MIN} char)`);
  } else if (entry.reason.length > REASON_MAX) {
    issues.push(`reason cok uzun (>${REASON_MAX} char)`);
  }

  // CORRECTION/MAJOR_ISSUE icin corrections obj zorunlu, en az 1 alan
  if (entry.verdict !== "PASS") {
    if (!entry.corrections || Object.keys(entry.corrections).length === 0) {
      issues.push("CORRECTION/MAJOR_ISSUE icin corrections en az 1 alan icermeli");
    } else {
      const c = entry.corrections;

      // Sisirme yasagi: description / tipNote / servingSuggestion max %20 uzar
      if (c.description) {
        const newLen = c.description.length;
        const oldLen = db.description.length;
        if (oldLen > 0 && newLen > oldLen * SHISIRME_MAX_RATIO) {
          issues.push(`description sisirildi (${oldLen} -> ${newLen}, max ${Math.floor(oldLen * SHISIRME_MAX_RATIO)})`);
        }
      }
      if (c.servingSuggestion && db.servingSuggestion) {
        const newLen = c.servingSuggestion.length;
        const oldLen = db.servingSuggestion.length;
        if (oldLen > 0 && newLen > oldLen * SHISIRME_MAX_RATIO) {
          issues.push(`servingSuggestion sisirildi (${oldLen} -> ${newLen}, max ${Math.floor(oldLen * SHISIRME_MAX_RATIO)})`);
        }
      }

      // cuisine enum check (30 mevcut kod, brief §20.2 listesi)
      if (c.cuisine !== undefined && !VALID_CUISINES.has(c.cuisine)) {
        issues.push(
          `cuisine gecersiz kod: ${c.cuisine} (gecerli: ${[...VALID_CUISINES].join(",")})`,
        );
      }

      // tag enum check
      for (const t of c.tags_add ?? []) {
        if (!VALID_TAGS.has(t)) issues.push(`tags_add gecersiz enum: ${t}`);
      }
      for (const t of c.tags_remove ?? []) {
        if (!VALID_TAGS.has(t)) issues.push(`tags_remove gecersiz enum: ${t}`);
      }

      // allergen enum check
      for (const a of c.allergens_add ?? []) {
        if (!VALID_ALLERGENS.has(a)) issues.push(`allergens_add gecersiz enum: ${a}`);
      }
      for (const a of c.allergens_remove ?? []) {
        if (!VALID_ALLERGENS.has(a)) issues.push(`allergens_remove gecersiz enum: ${a}`);
      }

      // macro nutrition makul aralik
      if (c.averageCalories !== undefined && (c.averageCalories < 10 || c.averageCalories > 2000)) {
        issues.push(`averageCalories aralik disi: ${c.averageCalories} (10-2000)`);
      }
      if (c.protein !== undefined && (c.protein < 0 || c.protein > 200)) {
        issues.push(`protein aralik disi: ${c.protein} g (0-200)`);
      }
      if (c.carbs !== undefined && (c.carbs < 0 || c.carbs > 300)) {
        issues.push(`carbs aralik disi: ${c.carbs} g (0-300)`);
      }
      if (c.fat !== undefined && (c.fat < 0 || c.fat > 200)) {
        issues.push(`fat aralik disi: ${c.fat} g (0-200)`);
      }

      // Macro tutarlilik (kalori = 4P + 4C + 9F, %25 toleransla)
      if (c.averageCalories !== undefined && c.protein !== undefined && c.carbs !== undefined && c.fat !== undefined) {
        const calculated = 4 * c.protein + 4 * c.carbs + 9 * c.fat;
        const diff = Math.abs(calculated - c.averageCalories);
        const tolerance = c.averageCalories * 0.25;
        if (diff > tolerance) {
          issues.push(`macro tutarsiz: 4P+4C+9F=${calculated} vs avg ${c.averageCalories} (fark ${Math.round(diff)}, tolerance ${Math.round(tolerance)})`);
        }
      }

      // Kural 9 (oturum 25 GPT audit), süre tutarlılığı kabaca check.
      // description + steps_replace içinde geçen "X saat / Y gün" bahsi
      // toplamı totalMinutes ile karşılaştır. Çok geniş tolerance (%50)
      // çünkü description birden fazla süre bahsedebilir (marine + pişme).
      const targetTotal = c.totalMinutes ?? db.totalMinutes ?? 0;
      if (targetTotal > 0) {
        const desc = c.description ?? db.description ?? "";
        const stepTexts = (c.steps_replace ?? [])
          .map((s) => s.instruction)
          .join(" ");
        const text = (desc + " " + stepTexts).toLocaleLowerCase("tr");
        // Regex: 1 saat, 30 dakika, 2 gün, 45 dk, 1 sa
        const regex = /(\d+(?:[\.,]\d+)?)\s*(saat|sa\b|dakika|dk\b|gün|gun)/g;
        let mentionedTotal = 0;
        let m: RegExpExecArray | null;
        while ((m = regex.exec(text)) !== null) {
          const n = parseFloat(m[1].replace(",", "."));
          const unit = m[2];
          if (unit === "saat" || unit === "sa") mentionedTotal += n * 60;
          else if (unit === "dakika" || unit === "dk") mentionedTotal += n;
          else if (unit === "gün" || unit === "gun") mentionedTotal += n * 1440;
        }
        if (mentionedTotal > 0) {
          const diff = Math.abs(mentionedTotal - targetTotal);
          const tol = targetTotal * 0.5;
          if (diff > tol) {
            issues.push(
              `Kural 9 süre tutarsız: ifade ~${mentionedTotal} dk vs totalMinutes ${targetTotal} dk (fark %${Math.round((diff / targetTotal) * 100)})`,
            );
          }
        }
      }

      // servingCount makul
      if (c.servingCount !== undefined && (c.servingCount < 1 || c.servingCount > 20)) {
        issues.push(`servingCount aralik disi: ${c.servingCount} (1-20)`);
      }
      // tipNote (eski check, korunur)
      if (c.tipNote && db.tipNote) {
      }
      if (entry.corrections.tipNote && db.tipNote) {
        const newLen = entry.corrections.tipNote.length;
        const oldLen = db.tipNote.length;
        if (oldLen > 0 && newLen > oldLen * SHISIRME_MAX_RATIO) {
          issues.push(`tipNote sisirildi (${oldLen} -> ${newLen}, max ${Math.floor(oldLen * SHISIRME_MAX_RATIO)})`);
        }
      }
    }
  }

  // Em-dash + Turkce karakter + jargon check tum string field'larda
  const stringFields: Array<[string, string | undefined]> = [
    ["reason", entry.reason],
    ["corrections.description", entry.corrections?.description],
    ["corrections.tipNote", entry.corrections?.tipNote],
    ["corrections.servingSuggestion", entry.corrections?.servingSuggestion],
  ];
  for (const step of entry.corrections?.steps_replace ?? []) {
    stringFields.push([`step ${step.stepNumber}.instruction`, step.instruction]);
  }
  for (const ing of entry.corrections?.ingredients_add ?? []) {
    stringFields.push([`ingredients_add[${ing.name}].name`, ing.name]);
  }

  for (const [name, val] of stringFields) {
    if (!val) continue;
    if (hasEmDash(val)) issues.push(`em-dash bulundu: ${name}`);
    if (looksAsciiFolded(val)) issues.push(`ASCII fold suphesi (TR karakter eksik): ${name}`);
    const j = hasJargon(val);
    if (j) issues.push(`jargon bulundu (${j}): ${name}`);
  }

  return issues;
}

async function main() {
  const url = process.env.DATABASE_URL!;
  if (!url) {
    console.error("DATABASE_URL yok");
    process.exit(1);
  }
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const filter = parseBatchArg();
  const files = discoverBatchFiles(filter);
  if (files.length === 0) {
    console.error("docs/mod-k-batch-N.json bulunamadi");
    await prisma.$disconnect();
    process.exit(1);
  }
  console.log(`Okunan batch dosyalari: ${files.length}`);

  const all: ModKEntry[] = [];
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(f, "utf-8"));
    if (!Array.isArray(data)) {
      console.error(`${path.basename(f)}: array degil, atlandi`);
      continue;
    }
    for (const e of data) all.push(e as ModKEntry);
    console.log(`  ${path.basename(f)}: ${data.length} entry`);
  }
  console.log(`Toplam entry: ${all.length}`);

  // Slug evren
  const slugs = [...new Set(all.map((e) => e.slug).filter(Boolean))];
  const dbRows = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: {
      id: true,
      slug: true,
      description: true,
      tipNote: true,
      servingSuggestion: true,
      status: true,
      totalMinutes: true,
      prepMinutes: true,
      cookMinutes: true,
      ingredients: { select: { name: true, amount: true, unit: true } },
    },
  });
  const dbMap = new Map<string, DbRecipe>();
  for (const r of dbRows) dbMap.set(r.slug, r as DbRecipe);

  // Verify each
  const verified: VerifiedEntry[] = all.map((entry) => {
    const db = dbMap.get(entry.slug) ?? null;
    const issues = validateEntry(entry, db);
    const cleanForApply = issues.length === 0;
    return { entry, db, issues, cleanForApply };
  });

  // Aggregate
  const passCount = verified.filter((v) => v.entry.verdict === "PASS").length;
  const corrCount = verified.filter((v) => v.entry.verdict === "CORRECTION").length;
  const majorCount = verified.filter((v) => v.entry.verdict === "MAJOR_ISSUE").length;
  const cleanCount = verified.filter((v) => v.cleanForApply).length;
  const blockedCount = verified.length - cleanCount;
  const high = verified.filter((v) => v.entry.confidence === "high").length;
  const medium = verified.filter((v) => v.entry.confidence === "medium").length;
  const low = verified.filter((v) => v.entry.confidence === "low").length;

  // Slug dedup check (across batches)
  const slugCount = new Map<string, number>();
  for (const v of verified) {
    slugCount.set(v.entry.slug, (slugCount.get(v.entry.slug) ?? 0) + 1);
  }
  const duplicateSlugs = [...slugCount.entries()]
    .filter(([, c]) => c > 1)
    .map(([s, c]) => `${s} (x${c})`);

  // Markdown rapor
  const lines: string[] = [];
  lines.push(`# Mod K verify raporu`);
  lines.push("");
  lines.push(`Okunan dosya: ${files.length} batch`);
  lines.push(`Toplam entry: ${all.length}`);
  lines.push("");
  lines.push("## Ozet (verdict)");
  lines.push("");
  lines.push(`- PASS: **${passCount}** (${((passCount / all.length) * 100).toFixed(1)}%)`);
  lines.push(`- CORRECTION: ${corrCount} (${((corrCount / all.length) * 100).toFixed(1)}%)`);
  lines.push(`- MAJOR_ISSUE: ${majorCount} (${((majorCount / all.length) * 100).toFixed(1)}%)`);
  lines.push("");
  lines.push("## Confidence");
  lines.push("");
  lines.push(`- high: ${high}, medium: ${medium}, low: ${low}`);
  lines.push("");
  lines.push("## Format integrity");
  lines.push("");
  lines.push(`- Apply'a hazir (clean format): **${cleanCount}**`);
  lines.push(`- BLOCKED (format issue): ${blockedCount}`);
  if (duplicateSlugs.length > 0) {
    lines.push(`- DUPLICATE slug (batch'ler arasi): ${duplicateSlugs.length}`);
    for (const d of duplicateSlugs) lines.push(`  - \`${d}\``);
  }
  lines.push("");

  if (blockedCount > 0) {
    lines.push("## BLOCKED (format issue, apply yapma)");
    lines.push("");
    lines.push("| Slug | Verdict | Issues |");
    lines.push("|---|---|---|");
    for (const v of verified.filter((x) => x.issues.length > 0)) {
      lines.push(`| \`${v.entry.slug}\` | ${v.entry.verdict} | ${v.issues.join("; ")} |`);
    }
    lines.push("");
  }

  // MAJOR_ISSUE listesi (manuel review zorunlu)
  if (majorCount > 0) {
    lines.push("## MAJOR_ISSUE (manuel review zorunlu)");
    lines.push("");
    for (const v of verified.filter((x) => x.entry.verdict === "MAJOR_ISSUE")) {
      lines.push(`### \`${v.entry.slug}\``);
      lines.push("");
      lines.push(`**Reason**: ${v.entry.reason ?? "(yok)"}`);
      lines.push("");
      if (v.entry.issues) {
        lines.push("**Issues**:");
        for (const i of v.entry.issues) lines.push(`- ${i}`);
        lines.push("");
      }
      if (v.entry.corrections) {
        lines.push("**Corrections** (sample):");
        const c = v.entry.corrections;
        if (c.description) lines.push(`- description: "${c.description.slice(0, 120)}..."`);
        if (c.tipNote) lines.push(`- tipNote: "${c.tipNote.slice(0, 120)}..."`);
        if (c.ingredients_add) lines.push(`- ingredients_add: ${c.ingredients_add.length}`);
        if (c.ingredients_remove) lines.push(`- ingredients_remove: ${c.ingredients_remove.join(", ")}`);
        if (c.steps_replace) lines.push(`- steps_replace: ${c.steps_replace.length}`);
        lines.push("");
      }
    }
  }

  // CORRECTION sample
  if (corrCount > 0) {
    lines.push("## CORRECTION sample (ilk 10)");
    lines.push("");
    lines.push("| Slug | Conf | Issues count | Corrections fields |");
    lines.push("|---|---|---:|---|");
    const sample = verified
      .filter((x) => x.entry.verdict === "CORRECTION")
      .slice(0, 10);
    for (const v of sample) {
      const c = v.entry.corrections ?? {};
      const fields = Object.keys(c).join(", ");
      lines.push(
        `| \`${v.entry.slug}\` | ${v.entry.confidence ?? "?"} | ${v.entry.issues?.length ?? 0} | ${fields} |`,
      );
    }
    lines.push("");
  }

  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/mod-k-verify-report.md"),
    lines.join("\n"),
  );

  // Console summary
  console.log("");
  console.log(`PASS: ${passCount} (${((passCount / all.length) * 100).toFixed(1)}%)`);
  console.log(`CORRECTION: ${corrCount}`);
  console.log(`MAJOR_ISSUE: ${majorCount}`);
  console.log(`Format clean: ${cleanCount}`);
  console.log(`BLOCKED: ${blockedCount}`);
  if (duplicateSlugs.length > 0) {
    console.log(`DUPLICATE slug: ${duplicateSlugs.length}`);
  }
  console.log("");
  console.log(`Yazildi: docs/mod-k-verify-report.md`);
  if (blockedCount > 0) {
    console.log("");
    console.log("BLOCKED entry var, apply oncesi raporu inceleyin.");
    process.exit(2);
  }

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
