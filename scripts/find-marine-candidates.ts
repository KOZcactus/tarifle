/**
 * Mod M (Marine) audit script: DB'de "marine" + benzer kelimeler iceren
 * tarifleri tespit edip Codex'e teslim icin liste cikarir.
 *
 * Hangi pattern'leri ariyoruz:
 *  - title/description/tipNote/servingSuggestion: "marine", "marina",
 *    "marinasyon", "salamura", "tuzlama", "soslama", "terbiye", "shorba"
 *  - steps[].instruction: "marine" + "X saat bekletin/dinlendirin"
 *    pattern'i
 *  - ingredients: "marine sosu", "marine sivisi" gibi malzemeler
 *
 * Çıktı: docs/mod-m-candidates.md (Codex'e referans).
 *
 * Toplam tarif sayisi 3517 (post oturum 23 + Sauerbraten). Beklenen
 * marine aday sayisi ~50-150.
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

const MARINE_KEYWORDS = [
  "marine",
  "marina",
  "marinasyon",
  "marina edin",
  "marine edin",
  "salamura",
  "soslama",
  "terbiye",
  // Yoğurtla bekletmek de marine sayilir (TR mutfagi: tavuk sis, dana
  // sis vb.):
  "yoğurtla bekletin",
  "sütle bekletin",
  "sirke ile bekletin",
  "şarapla bekletin",
  // Uluslararasi:
  "marinade",
  "marinated",
];

const TIME_PATTERNS = [
  /(\d+)\s*saat\s*(bekleti|dinlendir|marine)/i,
  /(\d+)\s*gün\s*(bekleti|dinlendir|marine)/i,
  /(?:bir|1)\s*gece\s*(bekleti|dinlendir|marine|buzdolab)/i,
  /(\d+)-(\d+)\s*saat/i,
];

interface MatchInfo {
  field: "title" | "description" | "tipNote" | "servingSuggestion" | "step" | "ingredient";
  text: string;
  matchedKeyword: string;
  stepNumber?: number;
}

interface Candidate {
  slug: string;
  title: string;
  cuisine: string | null;
  type: string;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  matches: MatchInfo[];
  hasTimePattern: boolean;
  // Tahmin: total - (prep + cook) > 0 ise zaten marine modellenmis
  alreadyHasWaitTime: boolean;
}

function findMatches(text: string): { hit: boolean; keyword: string } {
  const lower = text.toLocaleLowerCase("tr");
  for (const kw of MARINE_KEYWORDS) {
    if (lower.includes(kw)) return { hit: true, keyword: kw };
  }
  return { hit: false, keyword: "" };
}

function hasTimeInText(text: string): boolean {
  return TIME_PATTERNS.some((re) => re.test(text));
}

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      cuisine: true,
      type: true,
      description: true,
      tipNote: true,
      servingSuggestion: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      ingredients: { select: { name: true } },
      steps: {
        select: { stepNumber: true, instruction: true },
        orderBy: { stepNumber: "asc" },
      },
    },
  });
  console.log(`Toplam published tarif: ${recipes.length}`);

  const candidates: Candidate[] = [];
  for (const r of recipes) {
    const matches: MatchInfo[] = [];

    const titleM = findMatches(r.title);
    if (titleM.hit)
      matches.push({ field: "title", text: r.title, matchedKeyword: titleM.keyword });

    const descM = findMatches(r.description);
    if (descM.hit)
      matches.push({
        field: "description",
        text: r.description.slice(0, 120),
        matchedKeyword: descM.keyword,
      });

    if (r.tipNote) {
      const tipM = findMatches(r.tipNote);
      if (tipM.hit)
        matches.push({
          field: "tipNote",
          text: r.tipNote.slice(0, 120),
          matchedKeyword: tipM.keyword,
        });
    }

    if (r.servingSuggestion) {
      const ssM = findMatches(r.servingSuggestion);
      if (ssM.hit)
        matches.push({
          field: "servingSuggestion",
          text: r.servingSuggestion.slice(0, 120),
          matchedKeyword: ssM.keyword,
        });
    }

    let hasTimePattern = false;
    for (const s of r.steps) {
      const stepM = findMatches(s.instruction);
      if (stepM.hit) {
        matches.push({
          field: "step",
          text: s.instruction.slice(0, 150),
          matchedKeyword: stepM.keyword,
          stepNumber: s.stepNumber,
        });
        if (hasTimeInText(s.instruction)) hasTimePattern = true;
      }
    }

    for (const ing of r.ingredients) {
      const ingM = findMatches(ing.name);
      if (ingM.hit)
        matches.push({
          field: "ingredient",
          text: ing.name,
          matchedKeyword: ingM.keyword,
        });
    }

    if (matches.length > 0) {
      const waitTime = r.totalMinutes - r.prepMinutes - r.cookMinutes;
      candidates.push({
        slug: r.slug,
        title: r.title,
        cuisine: r.cuisine,
        type: r.type as string,
        prepMinutes: r.prepMinutes,
        cookMinutes: r.cookMinutes,
        totalMinutes: r.totalMinutes,
        matches,
        hasTimePattern,
        alreadyHasWaitTime: waitTime > 0,
      });
    }
  }

  // Sort: zaten wait time'i olanlari en sona, time pattern'i olanlari one
  candidates.sort((a, b) => {
    if (a.alreadyHasWaitTime !== b.alreadyHasWaitTime)
      return a.alreadyHasWaitTime ? 1 : -1;
    if (a.hasTimePattern !== b.hasTimePattern)
      return a.hasTimePattern ? -1 : 1;
    return a.cuisine !== b.cuisine
      ? (a.cuisine ?? "").localeCompare(b.cuisine ?? "")
      : a.title.localeCompare(b.title, "tr");
  });

  // Markdown
  const lines: string[] = [];
  lines.push(`# Mod M (Marine) candidate listesi`);
  lines.push("");
  lines.push(`Toplam aday: ${candidates.length}`);
  lines.push(
    `- Zaten total > prep+cook (marine modellenmis): ${candidates.filter((c) => c.alreadyHasWaitTime).length}`,
  );
  lines.push(
    `- Step'te zaman pattern'i tespit edildi: ${candidates.filter((c) => c.hasTimePattern).length}`,
  );
  lines.push("");
  lines.push("## Adaylar (oncelik: time pattern + alreadyHasWaitTime=false)");
  lines.push("");

  for (const c of candidates) {
    const flags: string[] = [];
    if (c.alreadyHasWaitTime) flags.push("✅ wait modellenmis");
    if (c.hasTimePattern) flags.push("⏱ zaman pattern");
    lines.push(
      `### \`${c.slug}\` ${c.title} [${c.cuisine}/${c.type}]${flags.length > 0 ? " " + flags.join(", ") : ""}`,
    );
    lines.push("");
    lines.push(
      `prep ${c.prepMinutes} + cook ${c.cookMinutes} + ${c.totalMinutes - c.prepMinutes - c.cookMinutes} wait = ${c.totalMinutes} dk total`,
    );
    lines.push("");
    for (const m of c.matches) {
      const loc =
        m.field === "step" ? `step ${m.stepNumber}` : m.field;
      lines.push(`- **${loc}** [${m.matchedKeyword}]: ${m.text}`);
    }
    lines.push("");
  }

  const outPath = path.resolve(process.cwd(), "docs/mod-m-candidates.md");
  fs.writeFileSync(outPath, lines.join("\n"));
  console.log(`Toplam aday: ${candidates.length}`);
  console.log(
    `Already wait modeled: ${candidates.filter((c) => c.alreadyHasWaitTime).length}`,
  );
  console.log(
    `Has time pattern: ${candidates.filter((c) => c.hasTimePattern).length}`,
  );
  console.log(`Yazildi: ${outPath}`);

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
