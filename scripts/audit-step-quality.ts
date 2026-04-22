/**
 * Mod E step kalite audit. Tum PUBLISHED tariflerin adimlarini 6 sorun
 * kategorisine gore tarar, skor hesaplar, en sorunlu tarifleri raporlar.
 *
 * **Sorun tipleri (issue codes):**
 *   - `few-steps` (AGIR): toplam <4 adim (Pide ornegi 3 adimdi)
 *   - `no-temp` (AGIR): firin/pisir deyip sicaklik yok (50 derece, 220°C vb.)
 *   - `no-time` (AGIR): pisirme/dinlendirme step'i zaman yok
 *   - `short-step` (ORTA): step <8 kelime
 *   - `vague-noun` (ORTA): "sebzeleri", "malzemeleri", "harci" bagimsiz
 *   - `em-dash` (KRITIK): U+2014 veya U+2013 karakter (AGENTS.md yasak)
 *
 * **Skor:** AGIR +3, ORTA +1, KRITIK +5. Yuksek skor = oncelikli revize.
 *
 * **Cikti:**
 *   - Konsol: ozet + top 30 aday
 *   - `docs/step-audit-report.json`: tum sorunlu slug'lar + issue listesi
 *   - `docs/step-review-batch-N.csv`: Codex'e Mod E input (top 100/batch)
 *
 * Usage:
 *   npx tsx scripts/audit-step-quality.ts                    # rapor only
 *   npx tsx scripts/audit-step-quality.ts --batch 1          # + CSV 1
 *   npx tsx scripts/audit-step-quality.ts --batch 1 --top 100
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import fs from "node:fs";
import path from "node:path";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

type Severity = "KRITIK" | "AGIR" | "ORTA";
type IssueCode = "em-dash" | "few-steps" | "no-temp" | "no-time" | "short-step" | "vague-noun";

const SEVERITY_WEIGHT: Record<Severity, number> = {
  KRITIK: 5,
  AGIR: 3,
  ORTA: 1,
};

const ISSUE_SEVERITY: Record<IssueCode, Severity> = {
  "em-dash": "KRITIK",
  "few-steps": "AGIR",
  "no-temp": "AGIR",
  "no-time": "AGIR",
  "short-step": "ORTA",
  "vague-noun": "ORTA",
};

// Firin/pisir + zaman gecen step regex
const OVEN_WORDS = /\b(f[ı\u0131]r[ı\u0131]n(?:a|da|dan|l[ı\u0131])?|p[ıi]sir)/i;
const TEMP_PATTERN = /(\d{2,3})\s*(?:°|°c|derece|santigrat)/i;
const TIME_PATTERN = /\d+\s*(?:dakika|dk|saniye|sn|saat|sa)/i;
const COOK_TIME_WORDS = /\b(p[iı]s[iı]r|dinlendir|kaynat|haslat|hasla|kavur|kavurun|sote|demle|bekletin|bekle|firinla|firinla|marin|izgara)/i;

const VAGUE_NOUN_PATTERN = /^(?:Sebzeleri|Malzemeleri|Harci|Ic[iı]ni|Hamur[ıu])\s+(?:koyun|serpin|yerlestirin|ekleyin|bulayin|ince|\.?)$/i;

function checkTextEmDash(text: string): boolean {
  return text.includes("\u2014") || text.includes("\u2013");
}

function wordCount(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

function detectIssues(
  steps: { stepNumber: number; instruction: string }[],
): IssueCode[] {
  const issues: IssueCode[] = [];
  const totalText = steps.map((s) => s.instruction).join(" ");

  // 1. few-steps: <5 adim (Kerem karari: "3 adim az, en az 4-5 olmali")
  //    Mevcut catalog'da 3-adimli tarifler cogunluk (Mod A boilerplate),
  //    bunlar mutlaka revize edilmeli. 4 adim minimum.
  if (steps.length < 5) issues.push("few-steps");

  // 2. em-dash: herhangi step (KRITIK)
  if (steps.some((s) => checkTextEmDash(s.instruction))) issues.push("em-dash");

  // 3. no-temp: firin/pisir deyip sicaklik yok (gercek problem)
  const hasOvenMention = steps.some((s) => OVEN_WORDS.test(s.instruction));
  const hasTemp = TEMP_PATTERN.test(totalText);
  if (hasOvenMention && !hasTemp) issues.push("no-temp");

  // 4. no-time: pisir/dinlendir/kaynat step'inde zaman yok (gercek problem)
  const hasCookWithoutTime = steps.some((s) => {
    if (!COOK_TIME_WORDS.test(s.instruction)) return false;
    return !TIME_PATTERN.test(s.instruction);
  });
  if (hasCookWithoutTime) issues.push("no-time");

  // 5. short-step: 2+ step <5 kelime (eski 8 cok kati, "Tuzu son anda
  //    ekleyin" gibi 4-kelime adımlar bilinçli kısa olabilir; 2'den
  //    fazla cok-kisa step olunca "anlamlı kısa" değil "yetersiz" sinyal)
  const veryShortCount = steps.filter((s) => wordCount(s.instruction) < 5).length;
  if (veryShortCount >= 2) issues.push("short-step");

  // 6. vague-noun: "Sebzeleri ince yerleştirin" gibi context'siz çoğul
  if (steps.some((s) => VAGUE_NOUN_PATTERN.test(s.instruction.trim())))
    issues.push("vague-noun");

  return issues;
}

function scoreIssues(issues: IssueCode[]): number {
  return issues.reduce((sum, code) => sum + SEVERITY_WEIGHT[ISSUE_SEVERITY[code]], 0);
}

function parseIntArg(flag: string, fallback: number | null = null): number {
  const idx = process.argv.indexOf(flag);
  if (idx < 0 || !process.argv[idx + 1]) {
    if (fallback !== null) return fallback;
    throw new Error(`${flag} N zorunlu`);
  }
  const n = Number(process.argv[idx + 1]);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`gecersiz ${flag}`);
  return n;
}

function csvEscape(val: string | number | null | undefined): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

interface AuditEntry {
  slug: string;
  title: string;
  category: string;
  cuisine: string;
  ingredientsText: string;
  currentStepsText: string;
  stepCount: number;
  issues: IssueCode[];
  score: number;
}

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });

  const batch = process.argv.includes("--batch") ? parseIntArg("--batch") : null;
  const top = parseIntArg("--top", 100);

  console.log(`📥 PUBLISHED tarif tarama basliyor...`);
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      cuisine: true,
      category: { select: { slug: true } },
      ingredients: {
        select: { name: true, amount: true, unit: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
      steps: { select: { stepNumber: true, instruction: true }, orderBy: { stepNumber: "asc" } },
    },
  });
  console.log(`   Toplam ${recipes.length} tarif`);

  const entries: AuditEntry[] = [];
  for (const r of recipes) {
    const issues = detectIssues(r.steps);
    if (issues.length === 0) continue;
    const score = scoreIssues(issues);
    entries.push({
      slug: r.slug,
      title: r.title,
      category: r.category.slug,
      cuisine: r.cuisine ?? "",
      ingredientsText: r.ingredients
        .map((i) => `${i.name} ${i.amount} ${i.unit ?? ""}`.replace(/\s+/g, " ").trim())
        .join(" | "),
      currentStepsText: r.steps
        .map((s, idx) => `${idx + 1}. ${s.instruction}`)
        .join(" || "),
      stepCount: r.steps.length,
      issues,
      score,
    });
  }
  entries.sort((a, b) => b.score - a.score);

  // Ozet
  const total = entries.length;
  const byIssue: Record<IssueCode, number> = {
    "em-dash": 0,
    "few-steps": 0,
    "no-temp": 0,
    "no-time": 0,
    "short-step": 0,
    "vague-noun": 0,
  };
  for (const e of entries) for (const i of e.issues) byIssue[i]++;

  console.log(`\n=== OZET ===`);
  console.log(`Sorunlu tarif: ${total} / ${recipes.length} (%${((total / recipes.length) * 100).toFixed(1)})`);
  console.log(`Issue dagilimi:`);
  for (const [code, count] of Object.entries(byIssue)) {
    console.log(`  ${code.padEnd(12)} ${count}`);
  }

  console.log(`\n=== TOP 30 SORUNLU ===`);
  entries.slice(0, 30).forEach((e) => {
    console.log(`  [skor ${e.score}] ${e.slug} (${e.stepCount} adim, ${e.issues.join(", ")})`);
  });

  // JSON audit raporu
  fs.writeFileSync(
    "docs/step-audit-report.json",
    JSON.stringify(
      {
        scannedAt: new Date().toISOString(),
        totalRecipes: recipes.length,
        flaggedRecipes: total,
        byIssue,
        entries: entries.map((e) => ({ slug: e.slug, score: e.score, issues: e.issues, stepCount: e.stepCount })),
      },
      null,
      2,
    ),
    "utf8",
  );
  console.log(`\n✅ Full rapor: docs/step-audit-report.json`);

  // Batch CSV (opsiyonel)
  if (batch !== null) {
    const start = (batch - 1) * top;
    const end = start + top;
    const slice = entries.slice(start, end);
    if (slice.length === 0) {
      console.log(`⚠️  Batch ${batch} bos (top ${top} skoru asan tarif kalmadi)`);
    } else {
      const header = [
        "slug",
        "title",
        "category",
        "cuisine",
        "stepCount",
        "score",
        "issues",
        "ingredients_tr",
        "current_steps_tr",
      ];
      const lines = [header.join(",")];
      for (const e of slice) {
        lines.push(
          [
            e.slug,
            e.title,
            e.category,
            e.cuisine,
            e.stepCount,
            e.score,
            e.issues.join(";"),
            e.ingredientsText,
            e.currentStepsText,
          ]
            .map(csvEscape)
            .join(","),
        );
      }
      const out = `docs/step-review-batch-${batch}.csv`;
      fs.writeFileSync(out, lines.join("\n") + "\n", "utf8");
      console.log(`✅ Batch ${batch} CSV: ${out} (${slice.length} tarif)`);
      console.log(`   Codex'e komut: "Mod E. Batch ${batch}."`);
    }
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error("HATA:", e);
  process.exit(1);
});
