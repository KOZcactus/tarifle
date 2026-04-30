/**
 * Content-quality audit, complements scripts/audit-deep.ts (which covers
 * structural correctness) by checking content fidelity:
 *
 *   1. Composite ingredient names (RECIPE_FORMAT.md §§ban: "Şerbet şekeri"
 *      → must be {name:"Şeker", group:"Şerbet için"})
 *   2. Multi-section content without group structure (description/steps
 *      mention "şerbet/hamur/marine/sos" but no ingredient.group)
 *   3. Suspicious step counts (<3 or >12)
 *   4. Suspicious ingredient counts (<3 or >20)
 *   5. Short descriptions (<30 char)
 *   6. Vague language in instruction/tipNote/servingSuggestion
 *      ("biraz", "azıcık", "iyice", "duruma göre", "ya da tersi")
 *   7. Unit quality (suspicious patterns, missing, excessive uses of "adet")
 *   8. Cuisine NULL on recipes with distinctly foreign slugs
 *   9. Time quality (prep+cook vs totalMinutes deviation)
 *  10. Step instruction too short or generic
 *  11. Ingredient name casing / punctuation / whitespace
 *  12. Emoji vs category consistency (e.g. 🥩 for non-meat)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
interface Finding {
  severity: Severity;
  category: string;
  slug: string;
  title: string;
  message: string;
}

function trLower(s: string): string {
  return s.toLocaleLowerCase("tr-TR");
}

// ── Composite ingredient detection ──────────────────────────────────
//
// Pattern: "SectionWord IngredientNoun" where SectionWord is purely a
// bucket name (never an ingredient itself) and IngredientNoun is a raw
// ingredient primitive with Turkish possessive suffix. "Şerbet şekeri"
//, şerbet (section) + şeker (primitive).
//
// WHITELIST: "Et suyu" (beef broth), "Tavuk suyu" (chicken broth),
// "Krema peyniri" / "Krem peyniri" (cream cheese), "Süzme yoğurt"
// (strained yogurt) are unitary products, not composites.
const LEGITIMATE_COMPOUNDS = new Set([
  "et suyu", "tavuk suyu", "balık suyu", "sebze suyu", "kemik suyu",
  "krema peyniri", "krem peyniri",
  "süzme yoğurt", "tuzsuz tereyağı", "tuzsuz peynir",
  "sıvı yağ", "zeytin yağı", "ay çiçek yağı", "ayçiçek yağı",
  "toz şeker", "esmer şeker", "pudra şekeri",
  "kuru soğan", "taze soğan", "arpacık soğan", "kırmızı soğan",
  "soya sosu", "barbekü sos", "tonkatsu sosu",
]);
const SECTION_WORDS = new Set([
  "şerbet", "hamur", "dolgu", "kaplama", "marine",
  "harç", "üzeri", "iç",
]);
const INGREDIENT_PRIMITIVES = new Set([
  "şeker", "şekeri", "su", "suyu", "un", "unu",
  "yumurta", "yumurtası", "peynir", "peyniri",
  "süt", "sütü", "krema", "kreması", "bal", "balı",
]);

function detectCompositeName(name: string): boolean {
  const lower = trLower(name);
  if (LEGITIMATE_COMPOUNDS.has(lower)) return false;
  const tokens = lower.split(/\s+/).filter(Boolean);
  if (tokens.length !== 2) return false;
  return SECTION_WORDS.has(tokens[0]) && INGREDIENT_PRIMITIVES.has(tokens[1]);
}

/**
 * Detect comma-separated composite rows (different pattern from
 * detectCompositeName: "Tuz, karabiber, pul biber" is a single DB row
 * that lists multiple distinct ingredients).
 */
function detectCommaComposite(name: string): string[] | null {
  if (!name.includes(",")) return null;
  // Oturum 34 rafine: parantez içindeki comma flag'lenmesin (false positive).
  // 'Su (hamur için, ılık)' = 1 ingredient + 2 not, gerçek dupe değil.
  // Sadece parantez DIŞINDAKI comma'lar gerçek composite.
  const stripParens = name.replace(/\([^)]*\)/g, "").trim();
  if (!stripParens.includes(",")) return null;
  const parts = stripParens.split(",").map((p) => p.trim()).filter(Boolean);
  return parts.length >= 2 ? parts : null;
}

// Baseline step-ingredient mismatch keywords (lighter version of
// scripts/audit-step-ingredient-mismatch.ts, only HIGH confidence triggers
// so this audit doesn't flood with REVIEW items).
const STEP_BASELINE_PATTERNS: { re: RegExp; keywords: string[]; label: string }[] = [
  { re: /(?:^|[\s,;.!?/()\-])tuz(?=$|[\s,;.!?/()\-lu])/i, keywords: ["tuz"], label: "tuz" },
  {
    re: /(?:^|[\s,;.!?/()\-])karabiber(?=$|[\s,;.!?/()\-li])/i,
    keywords: ["karabiber"],
    label: "karabiber",
  },
  {
    re: /(?:^|[\s,;.!?/()\-])pul biber(?=$|[\s,;.!?/()\-li])/i,
    keywords: ["pul biber"],
    label: "pul biber",
  },
  { re: /(?:^|[\s,;.!?/()\-])un(?=$|[\s,;.!?/()\-lu])/i, keywords: ["un"], label: "un" },
];

// Step text'inde 'un' mention false positive guard: 'un EKLEMEDEN'
// (tarif un kullanmıyor, negative reference). Oturum 34 audit refine.
const UN_NEGATIVE_PATTERNS = [/un\s+ekle(meden|mez|miyor)/i];

// ── Multi-section content detection ─────────────────────────────────
//
// If description/steps mention "şerbetle", "hamur", "marine edin",
// "sos hazırlayın", but NO ingredient has a group → missing structure.
const MULTI_SECTION_MARKERS = [
  /şerbet(i|ini|le)/i,
  /hamur(u|un|una|da)/i,
  /marine\s+edin/i,
  /sos(u|un)\s+(hazırla|yap)/i,
  /dolgu(yu|sunu)\s+(hazırla|yap)/i,
  /iç(i|ini|in)\s+(hazırla|yap)/i,
  /kapla(ma|yın|yarak)/i,
];

function hasMultiSectionText(text: string): string[] {
  const hits: string[] = [];
  for (const re of MULTI_SECTION_MARKERS) {
    const m = re.exec(text);
    if (m) hits.push(m[0]);
  }
  return hits;
}

// ── Vague language patterns ─────────────────────────────────────────
// Oturum 34 rafine: 'biraz' Türkçede iki kullanımı var:
//   A) Vague miktar ("biraz tuz", "biraz su") → flag (kullanıcı için belirsiz)
//   B) Niteleyici/comparative ("biraz daha sert", "biraz koyu", "biraz daha
//      pişirin") → flag DEĞİL, doğal dil
// Comparative pattern'ler exclude edilir, sadece miktar belirsizliği yakalanır.
const VAGUE_BIRAZ_EXCLUDE = [
  /\bbiraz(cık)?\s+daha\b/i, // "biraz daha pişirin/karıştırın/koyu"
  /\bbiraz(cık)?\s+(sert|yumuşak|koyu|sulu|kalın|ince|açık|sıkı|gevşek|hafif|yoğun|sıcak|soğuk|ılık|açıp|açın)\b/i,
  /\bkeskinliğinin biraz\b/i, // "keskinliğinin biraz yumuşaması"
  /\bkıvamın(d|ı)an biraz\b/i, // "kıvamından biraz koyu"
  /\bmemesinden biraz\b/i, // "kulak memesinden biraz sert"
];
const VAGUE_PATTERNS: { re: RegExp; tag: string; exclude?: RegExp[] }[] = [
  { re: /\bbiraz(cık)?\b/i, tag: "biraz/birazcık", exclude: VAGUE_BIRAZ_EXCLUDE },
  { re: /\bazıcık\b/i, tag: "azıcık" },
  { re: /\byeteri kadar\b/i, tag: "yeteri kadar" },
  { re: /\bepey(ce)?\b/i, tag: "epey/epeyce" },
  { re: /\bduruma göre\b/i, tag: "duruma göre" },
  { re: /\bya da tersi\b/i, tag: "ya da tersi" },
  { re: /\bkararına kalmış\b/i, tag: "kararına kalmış" },
  { re: /\biyice\b/i, tag: "iyice" },
  { re: /\bgüzelce\b/i, tag: "güzelce" },
  { re: /\bbelki\b/i, tag: "belki" },
];

// ── Main ────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const findings: Finding[] = [];
  const add = (
    severity: Severity,
    category: string,
    slug: string,
    title: string,
    message: string,
  ): void => {
    findings.push({ severity, category, slug, title, message });
  };

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    include: {
      ingredients: {
        select: { name: true, amount: true, unit: true, group: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
      steps: {
        select: { stepNumber: true, instruction: true, tip: true, timerSeconds: true },
        orderBy: { stepNumber: "asc" },
      },
      category: { select: { slug: true } },
    },
    orderBy: { slug: "asc" },
  });

  console.log("=".repeat(70));
  console.log(`  CONTENT QUALITY AUDIT, ${recipes.length} recipes`);
  console.log("=".repeat(70));

  // ── Global accumulators ──
  const unitUsage = new Map<string, number>();
  const amountValues = new Map<string, number>();

  for (const r of recipes) {
    const { slug, title, ingredients, steps } = r;
    const stepsText = steps.map((s) => s.instruction).join(" ");

    // ── 1. Composite ingredient names (section-prefix pattern) ──
    for (const ing of ingredients) {
      if (detectCompositeName(ing.name)) {
        add(
          "CRITICAL",
          "COMPOSITE_NAME",
          slug,
          title,
          `Composite name "${ing.name}", use {name:"${ing.name.split(/\s+/)[1]}", group:"${ing.name.split(/\s+/)[0]} için"} instead`,
        );
      }

      // ── 1b. Comma-separated composite (multi-ingredient in single row) ──
      const commaParts = detectCommaComposite(ing.name);
      if (commaParts) {
        const sev: Severity = commaParts.length >= 3 ? "HIGH" : "MEDIUM";
        add(
          sev,
          "COMPOSITE_COMMA",
          slug,
          title,
          `Comma-composite row "${ing.name}", split into ${commaParts.length} rows: ${commaParts.join(" | ")}`,
        );
      }
    }

    // ── 1c. Step ↔ Ingredient mismatch (HIGH-confidence baselines only) ──
    const ingTextLower = trLower(ingredients.map((i) => i.name).join(" | "));
    const flaggedBaselines = new Set<string>();
    for (const step of steps) {
      const instrLower = trLower(step.instruction);
      for (const bp of STEP_BASELINE_PATTERNS) {
        if (flaggedBaselines.has(bp.label)) continue;
        if (!bp.re.test(instrLower)) continue;
        // 'un' negative reference guard: 'un eklemeden/eklemez/eklemiyor'
        // tarif un kullanmıyor demek, false positive flag'i engelle.
        if (bp.label === "un" && UN_NEGATIVE_PATTERNS.some((np) => np.test(instrLower))) continue;
        const found = bp.keywords.some((kw) => ingTextLower.includes(kw));
        if (found) continue;
        flaggedBaselines.add(bp.label);
        add(
          "HIGH",
          "STEP_INGREDIENT_MISSING",
          slug,
          title,
          `Step ${step.stepNumber} mentions "${bp.label}" but ingredient list has no match`,
        );
      }
    }

    // ── 2. Multi-section content without groups ──
    // Only flag when recipe has BOTH: (a) no group structure AND (b) TWO
    // DIFFERENT section concepts in text (e.g. "hamur" AND "şerbet" both
    // mentioned → needs 2-bucket grouping). Single "hamuru açın" is a
    // normal action verb and doesn't require a separate section.
    const groupCount = new Set(
      ingredients.filter((i) => i.group).map((i) => i.group),
    ).size;
    if (groupCount === 0) {
      const hits = [
        ...hasMultiSectionText(r.description),
        ...hasMultiSectionText(stepsText),
      ];
      // Canonicalize each hit to its section concept (hamur/şerbet/...)
      const sectionConcepts = new Set<string>();
      for (const h of hits) {
        const lower = h.toLowerCase();
        if (/^hamur/.test(lower)) sectionConcepts.add("hamur");
        else if (/^şerbet/.test(lower)) sectionConcepts.add("şerbet");
        else if (/^marine/.test(lower)) sectionConcepts.add("marine");
        else if (/^sos/.test(lower)) sectionConcepts.add("sos");
        else if (/^dolgu/.test(lower)) sectionConcepts.add("dolgu");
        else if (/^iç/.test(lower)) sectionConcepts.add("iç");
        else if (/^kapla/.test(lower)) sectionConcepts.add("kaplama");
      }
      if (sectionConcepts.size >= 2) {
        add(
          "HIGH",
          "MISSING_GROUPS",
          slug,
          title,
          `Text mentions [${[...sectionConcepts].join(", ")}] but all ingredients ungrouped, likely needs bucket groups`,
        );
      }
    }

    // ── 3. Suspicious step counts ──
    if (steps.length < 3) {
      add(
        "HIGH",
        "STEP_COUNT",
        slug,
        title,
        `Only ${steps.length} step(s), a real recipe typically has 3-10`,
      );
    } else if (steps.length > 12) {
      add(
        "MEDIUM",
        "STEP_COUNT",
        slug,
        title,
        `${steps.length} steps, check if mergeable or over-decomposed`,
      );
    }

    // ── 4. Suspicious ingredient counts (tip-aware) ──
    // ICECEK tipi 2 ingredient ile geçerli (americano = kahve + su, latte =
    // espresso + süt, oralet = toz oralet + sıcak su). Oturum 34 audit
    // refine: ICECEK için min 2, diğer tip'ler min 3.
    const minIngredients = r.type === "ICECEK" ? 2 : 3;
    if (ingredients.length < minIngredients) {
      add(
        "HIGH",
        "INGREDIENT_COUNT",
        slug,
        title,
        `Only ${ingredients.length} ingredient(s), suspicious for a published recipe`,
      );
    } else if (ingredients.length > 20) {
      add(
        "MEDIUM",
        "INGREDIENT_COUNT",
        slug,
        title,
        `${ingredients.length} ingredients, very long, check duplication`,
      );
    }

    // ── 5. Short description ──
    if (r.description.length < 30) {
      add(
        "MEDIUM",
        "DESCRIPTION",
        slug,
        title,
        `Description only ${r.description.length} chars, too short (<30)`,
      );
    }

    // ── 6. Vague language ──
    const vagueHits = new Map<string, number>();
    const matchVague = (text: string): void => {
      for (const { re, tag, exclude } of VAGUE_PATTERNS) {
        if (!re.test(text)) continue;
        // Exclude pattern'lerden biri eşleşirse atla (false positive guard)
        if (exclude && exclude.some((ex) => ex.test(text))) continue;
        vagueHits.set(tag, (vagueHits.get(tag) ?? 0) + 1);
      }
    };
    for (const step of steps) matchVague(step.instruction);
    matchVague(r.tipNote ?? "");
    matchVague(r.servingSuggestion ?? "");
    if (vagueHits.size > 0) {
      // Oturum 34 rafine: 'biraz/birazcık' Türkçe doğal dilde çok yaygın
      // (comparative 'biraz daha sert/koyu', küçük miktar 'biraz isot serpin'),
      // çoğu kullanım vague değil. HIGH severity'den çıkar, LOW threshold'da
      // kalsın. Gerçek vague: 'yeteri kadar', 'duruma göre', 'ya da tersi'.
      const sev: Severity = vagueHits.has("ya da tersi") || vagueHits.has("duruma göre") || vagueHits.has("yeteri kadar")
        ? "HIGH" : "LOW";
      add(
        sev,
        "VAGUE_LANGUAGE",
        slug,
        title,
        `Vague words: ${[...vagueHits.entries()].map(([t, c]) => `${t} (${c})`).join(", ")}`,
      );
    }

    // ── 7. Unit issues ──
    for (const ing of ingredients) {
      if (ing.unit && ing.unit.trim()) {
        unitUsage.set(ing.unit, (unitUsage.get(ing.unit) ?? 0) + 1);
      }
      // Empty amount with unit
      if ((!ing.amount || ing.amount.trim() === "") && ing.unit) {
        add("MEDIUM", "UNIT_AMOUNT", slug, title,
          `"${ing.name}" has unit="${ing.unit}" but empty amount`);
      }
      // Collect amounts for distribution
      if (ing.amount) amountValues.set(ing.amount, (amountValues.get(ing.amount) ?? 0) + 1);
    }

    // ── 8. Cuisine NULL ──
    if (r.cuisine === null) {
      add(
        "LOW",
        "CUISINE_NULL",
        slug,
        title,
        `No cuisine assigned`,
      );
    }

    // ── 9. Time deviation, handled in audit-deep already, spot check ──
    if (r.prepMinutes + r.cookMinutes < r.totalMinutes - 30) {
      add(
        "MEDIUM",
        "TIME_GAP",
        slug,
        title,
        `prep(${r.prepMinutes})+cook(${r.cookMinutes})=${r.prepMinutes + r.cookMinutes} << total(${r.totalMinutes}), missing rest/marinate time?`,
      );
    }

    // ── 10. Short step instructions (oturum 34 rafine) ──
    // Önceki threshold <20 char OR <4 kelime çok agresif idi:
    // 'Soğuk servis edin.' (18c, 3w) gibi meşru servis cümleleri yakalanıyordu.
    // Yeni threshold <15 char OR <3 kelime, gerçek yetersiz step'leri yakalar
    // ('Buzu ekleyin.', 'Soğanı kavurun.' tarzı tek-eylem yetersiz).
    for (const step of steps) {
      const instr = step.instruction.trim();
      const wordCount = instr.split(/\s+/).length;
      if (instr.length < 15 || wordCount < 3) {
        add(
          "MEDIUM",
          "STEP_TOO_SHORT",
          slug,
          title,
          `Step ${step.stepNumber}: "${instr}" (${instr.length} chars, ${wordCount} words)`,
        );
      }
    }

    // ── 11. Ingredient name hygiene (capitalize, punctuation, whitespace) ──
    for (const ing of ingredients) {
      if (ing.name !== ing.name.trim()) {
        add("LOW", "NAME_HYGIENE", slug, title,
          `Ingredient "${ing.name}" has leading/trailing whitespace`);
      }
      if (/\s{2,}/.test(ing.name)) {
        add("LOW", "NAME_HYGIENE", slug, title,
          `Ingredient "${ing.name}" has double space`);
      }
      // First char should be uppercase (Turkish proper)
      const firstChar = ing.name[0];
      if (firstChar && firstChar !== firstChar.toLocaleUpperCase("tr-TR")) {
        add("LOW", "NAME_HYGIENE", slug, title,
          `Ingredient "${ing.name}" starts with lowercase`);
      }
    }

    // ── 12. Emoji-category sanity check ──
    const emoji = r.emoji;
    if (emoji && r.category.slug === "tatlilar" && ["🥩","🍗","🐟","🐠"].includes(emoji)) {
      add("MEDIUM", "EMOJI_MISMATCH", slug, title,
        `Category "tatlilar" but emoji "${emoji}" suggests savory`);
    }
    if (emoji && r.category.slug === "et-yemekleri" && ["🍰","🍮","🍪","🧁","🍨"].includes(emoji)) {
      add("MEDIUM", "EMOJI_MISMATCH", slug, title,
        `Category "et-yemekleri" but emoji "${emoji}" suggests dessert`);
    }
  }

  // ── Output ──

  const bySev = (s: Severity) => findings.filter((f) => f.severity === s);
  const byCat = (cat: string) => findings.filter((f) => f.category === cat);

  const cats = [
    "COMPOSITE_NAME",
    "COMPOSITE_COMMA",
    "STEP_INGREDIENT_MISSING",
    "MISSING_GROUPS",
    "STEP_COUNT",
    "INGREDIENT_COUNT",
    "DESCRIPTION",
    "VAGUE_LANGUAGE",
    "UNIT_AMOUNT",
    "CUISINE_NULL",
    "TIME_GAP",
    "STEP_TOO_SHORT",
    "NAME_HYGIENE",
    "EMOJI_MISMATCH",
  ];

  console.log(`\n  Total findings: CRITICAL ${bySev("CRITICAL").length}  HIGH ${bySev("HIGH").length}  MEDIUM ${bySev("MEDIUM").length}  LOW ${bySev("LOW").length}`);
  console.log("\n=== PER-CATEGORY SUMMARY ===");
  for (const cat of cats) {
    const items = byCat(cat);
    if (items.length === 0) continue;
    const c = items.filter((f) => f.severity === "CRITICAL").length;
    const h = items.filter((f) => f.severity === "HIGH").length;
    const m = items.filter((f) => f.severity === "MEDIUM").length;
    const l = items.filter((f) => f.severity === "LOW").length;
    console.log(`  ${cat.padEnd(22)} CRIT ${String(c).padStart(3)}  HIGH ${String(h).padStart(3)}  MED ${String(m).padStart(3)}  LOW ${String(l).padStart(3)}  (total ${items.length})`);
  }

  // Detail CRITICAL + HIGH
  const important = findings.filter((f) => f.severity === "CRITICAL" || f.severity === "HIGH");
  if (important.length > 0) {
    console.log(`\n=== CRITICAL + HIGH DETAIL (${important.length}) ===`);
    for (const f of important) {
      console.log(`  [${f.severity.padEnd(8)}] [${f.category}] ${f.slug}`);
      console.log(`             ${f.message}`);
    }
  }

  // MEDIUM + LOW per-category samples (up to 10 each)
  for (const cat of cats) {
    const items = byCat(cat).filter((f) => f.severity === "MEDIUM" || f.severity === "LOW");
    if (items.length === 0) continue;
    console.log(`\n--- ${cat} (${items.length}, showing ${Math.min(15, items.length)}) ---`);
    for (const f of items.slice(0, 15)) {
      console.log(`  [${f.severity.padEnd(6)}] ${f.slug.padEnd(34)} ${f.message.slice(0, 110)}`);
    }
  }

  console.log("\n=== UNIT USAGE DISTRIBUTION (top 20) ===");
  const sortedUnits = [...unitUsage.entries()].sort((a, b) => b[1] - a[1]);
  for (const [u, n] of sortedUnits.slice(0, 20)) {
    console.log(`  ${u.padEnd(24)} ${n}`);
  }
  if (sortedUnits.length > 20) {
    console.log(`  ... ${sortedUnits.length - 20} more unit forms`);
  }
}

main()
  .catch((err) => {
    console.error("content audit failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
