/**
 * Soft-match duplicate title audit. Exact-match audit (audit-duplicate-
 * titles.ts) bölgesel "... usulü" suffix'leri farklı title sayıyor;
 * "Tarhana Çorbası" ve "Tarhana Çorbası Antep Usulü" aynı base tarif
 * ama exact audit yakalamaz.
 *
 * Normalization:
 *   - TR diacritics fold (ğ/ş/ı/ö/ü/ç → ascii)
 *   - Parantez içerik ve parantez sil: "X (Y Usulü)" → "X"
 *   - Trailing "[bölge] usulü" (1-3 kelime + usulu): "X Antep Usulü" → "X"
 *   - Trailing "tarifi": "X Tarifi" → "X"
 *   - Collapse whitespace
 *
 * Rapor (stdout + tmp-duplicate-titles-soft.txt):
 *   - Her soft-match grup için üyeler (slug + title + cuisine + macros)
 *   - SIGNAL sınıflandırma:
 *     * MERGE-CANDIDATE: aynı cuisine + benzer ingredient/step count
 *       (muhtemelen copy-paste loser, duplicate-merge P3 gibi)
 *     * LEGIT-VARIANT: farklı cuisine veya fark belirgin (regional
 *       varyant, tutulur)
 *   - Exact-match zaten audit-duplicate-titles çıktısında, bunlar
 *     ayıklanır (soft-match farkı: yeni group'lar).
 *
 *   npx tsx scripts/audit-duplicate-titles-soft.ts           # dev (default)
 *   DATABASE_URL=<prod> ... --confirm-prod                   # prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

function asciiFold(s: string): string {
  return s
    .replace(/ğ/g, "g")
    .replace(/Ğ/g, "g")
    .replace(/ş/g, "s")
    .replace(/Ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/İ/g, "i")
    .replace(/ö/g, "o")
    .replace(/Ö/g, "o")
    .replace(/ü/g, "u")
    .replace(/Ü/g, "u")
    .replace(/ç/g, "c")
    .replace(/Ç/g, "c");
}

/** Soft-match key üretir. Aynı key'e düşen title'lar potansiyel
 *  duplicate grubu. */
export function normalizeTitleSoft(title: string): string {
  let t = asciiFold(title.toLowerCase());
  // Parantez ve içerik sil
  t = t.replace(/\s*\([^)]*\)\s*/g, " ");
  // Trailing "<bölge/mutfak> usulü" formlarını kaldır. En çok 3 kelime
  // önce + usulu: "X Antep Usulu" veya "X Kuzey Trakya Usulu" gibi.
  // Greedy, baştan iterative drop.
  for (let i = 0; i < 4; i++) {
    const prev = t;
    t = t.replace(/\s+[a-z0-9]+\s+usulu\s*$/, "");
    if (t === prev) break;
  }
  t = t.replace(/\s+usulu\s*$/, "");
  // "Tarifi" suffix
  t = t.replace(/\s+tarifi\s*$/, "");
  // "Tatlısı" / "Yemeği" / "Çorbası" trailing DEĞİŞİKLİK YAPMIYORUZ;
  // bunlar tarif karakterinin parçası, normalize dışı.
  // Whitespace clean
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

async function main(): Promise<void> {
  const info = assertDbTarget("audit-duplicate-titles-soft");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });
  try {
    const recipes = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        cuisine: true,
        description: true,
        totalMinutes: true,
        _count: { select: { ingredients: true, steps: true } },
      },
    });

    const groups = new Map<
      string,
      typeof recipes
    >();
    for (const r of recipes) {
      const key = normalizeTitleSoft(r.title);
      if (!key) continue;
      const g = groups.get(key) ?? [];
      g.push(r);
      groups.set(key, g);
    }

    const softGroups = [...groups.entries()]
      .filter(([, g]) => g.length > 1)
      .sort((a, b) => b[1].length - a[1].length);

    let out = `Total soft-match duplicate groups: ${softGroups.length}\n\n`;

    // Sınıflandırma
    let mergeCandidateGroups = 0;
    let legitVariantGroups = 0;
    let exactGroups = 0;

    for (const [key, grp] of softGroups) {
      const titles = [...new Set(grp.map((r) => r.title))];
      const cuisines = [...new Set(grp.map((r) => r.cuisine))];
      const ingCounts = [...new Set(grp.map((r) => r._count.ingredients))];
      const stepCounts = [...new Set(grp.map((r) => r._count.steps))];

      const isExact = titles.length === 1;
      // Aynı cuisine + benzer ingredient/step count → merge candidate
      const sameCuisine = cuisines.length === 1;
      const similarStructure =
        Math.max(...ingCounts) - Math.min(...ingCounts) <= 2 &&
        Math.max(...stepCounts) - Math.min(...stepCounts) <= 2;
      const mergeCandidate = sameCuisine && similarStructure && !isExact;
      const classification = isExact
        ? "EXACT"
        : mergeCandidate
          ? "MERGE-CANDIDATE"
          : "LEGIT-VARIANT";

      if (classification === "EXACT") exactGroups++;
      else if (classification === "MERGE-CANDIDATE") mergeCandidateGroups++;
      else legitVariantGroups++;

      out += `══ [${classification}] "${key}" × ${grp.length} ══\n`;
      for (const r of grp) {
        out += `  [${r.slug}]  "${r.title}"  ${r.cuisine ?? "NULL"}  ${r.totalMinutes}dk  ${r._count.ingredients}ing/${r._count.steps}step\n`;
      }
      out += "\n";
    }

    const summary = `\n═══ SUMMARY ═══\nTotal soft-match groups: ${softGroups.length}\n  EXACT (already in audit-duplicate-titles): ${exactGroups}\n  MERGE-CANDIDATE (same cuisine + similar structure): ${mergeCandidateGroups}\n  LEGIT-VARIANT (different cuisine/structure): ${legitVariantGroups}\n`;
    out += summary;

    fs.writeFileSync("tmp-duplicate-titles-soft.txt", out, "utf-8");
    console.log(out.slice(0, 5000));
    if (out.length > 5000) console.log(`\n... (truncated, full output in tmp-duplicate-titles-soft.txt, ${out.length} chars)`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
