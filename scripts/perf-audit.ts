/**
 * DB hot-path EXPLAIN ANALYZE runner — 306+ tarif ölçeğinde Tarifle'nin
 * en sık tetiklenen sorgularını analiz eder. 1000 tarife gitmeden önce
 * baseline ve darboğaz tespiti.
 *
 * Hedef sorgular (en sık):
 *   1. Ana sayfa: getFeaturedRecipes pool fetch
 *   2. Ana sayfa: getRecentRecipes (son 14 gün)
 *   3. /tarifler: plain listeleme (status=PUBLISHED + alphabetical)
 *   4. /tarifler: kategori filter
 *   5. /tarifler: allergens hasNone (GIN index)
 *   6. /tarifler: FTS — websearch_to_tsquery + ts_rank_cd (GIN tsvector)
 *   7. /tarif/[slug]: getRecipeBySlug (ingredients + steps + tags + variations)
 *   8. /tarif/[slug]: getSimilarRecipes (category OR type subset)
 *   9. AI Asistan DB filter
 *
 * Her sorgu için: plan kısa özeti, süre, buffer stats, seq scan uyarısı.
 * Yorum: rapor sonunda fix önerisi (index, query reshape, vb).
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

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

interface QueryCase {
  label: string;
  sql: string;
  params?: readonly unknown[];
}

const CASES: QueryCase[] = [
  {
    label: "1. Featured pool (homepage rotation)",
    sql: `SELECT id, title, slug FROM recipes
          WHERE status = 'PUBLISHED' AND "isFeatured" = true
          ORDER BY slug ASC`,
  },
  {
    label: "2. Recent recipes (son 14 gün, ana sayfa Yeni Eklenenler)",
    sql: `SELECT id, title, slug, "createdAt" FROM recipes
          WHERE status = 'PUBLISHED'
            AND "createdAt" >= NOW() - INTERVAL '14 days'
          ORDER BY "createdAt" DESC
          LIMIT 8`,
  },
  {
    label: "3. /tarifler base list (alphabetical, 1. sayfa)",
    sql: `SELECT id, title, slug FROM recipes
          WHERE status = 'PUBLISHED'
          ORDER BY title ASC
          LIMIT 12`,
  },
  {
    label: "4. /tarifler category filter (et-yemekleri)",
    sql: `SELECT r.id, r.title, r.slug
          FROM recipes r
          INNER JOIN categories c ON r."categoryId" = c.id
          WHERE r.status = 'PUBLISHED' AND c.slug = 'et-yemekleri'
          ORDER BY r.title ASC
          LIMIT 12`,
  },
  {
    label: "5. /tarifler allergen exclusion (GIN hasSome)",
    sql: `SELECT id, title, slug FROM recipes
          WHERE status = 'PUBLISHED'
            AND NOT (allergens && ARRAY['GLUTEN', 'SUT']::"Allergen"[])
          ORDER BY title ASC
          LIMIT 12`,
  },
  {
    label: "6. FTS: websearch_to_tsquery + ts_rank_cd ('peynirli')",
    sql: `SELECT r.id, r.title,
                 ts_rank_cd(r."searchVector", q.query) AS rank
          FROM recipes r,
               websearch_to_tsquery('turkish', public.immutable_unaccent('peynirli')) AS q(query)
          WHERE r."searchVector" @@ q.query
            AND r.status = 'PUBLISHED'
          ORDER BY rank DESC
          LIMIT 12`,
  },
  {
    label: "7. getRecipeBySlug (adana-kebap) — recipe row only",
    sql: `SELECT id, title, slug, description, emoji, type, difficulty,
                 "prepMinutes", "cookMinutes", "totalMinutes", "servingCount",
                 "averageCalories", protein, carbs, fat,
                 "imageUrl", status, "viewCount", "tipNote",
                 "servingSuggestion", allergens, "createdAt", "categoryId"
          FROM recipes WHERE slug = 'adana-kebap'`,
  },
  {
    label: "7b. Ingredients + steps (for recipe id)",
    sql: `SELECT id, name, amount, unit, "sortOrder", "isOptional", "group"
          FROM recipe_ingredients
          WHERE "recipeId" = (SELECT id FROM recipes WHERE slug = 'adana-kebap')
          ORDER BY "sortOrder"`,
  },
  {
    label: "7c. Published variations for recipe",
    sql: `SELECT id, "miniTitle", "likeCount", "createdAt"
          FROM variations
          WHERE "recipeId" = (SELECT id FROM recipes WHERE slug = 'adana-kebap')
            AND status = 'PUBLISHED'
          ORDER BY "likeCount" DESC`,
  },
  {
    label: "8. Similar recipes pool (category OR type)",
    sql: `SELECT id, title, slug
          FROM recipes
          WHERE status = 'PUBLISHED'
            AND id != (SELECT id FROM recipes WHERE slug = 'adana-kebap')
            AND (
              "categoryId" = (SELECT "categoryId" FROM recipes WHERE slug = 'adana-kebap')
              OR type = (SELECT type FROM recipes WHERE slug = 'adana-kebap')
            )
          LIMIT 50`,
  },
  {
    label: "9. AI Asistan-style filter: difficulty + maxMinutes + type",
    sql: `SELECT r.id, r.title, r.slug
          FROM recipes r
          WHERE r.status = 'PUBLISHED'
            AND r.difficulty = 'EASY'
            AND r."totalMinutes" <= 30
            AND r.type = 'YEMEK'
          ORDER BY r."viewCount" DESC
          LIMIT 20`,
  },
];

interface PlanRow {
  "QUERY PLAN": string;
}

function summarizePlan(rows: readonly PlanRow[]): {
  seqScans: string[];
  indexScans: string[];
  totalMs: number | null;
  planningMs: number | null;
} {
  const lines = rows.map((r) => r["QUERY PLAN"]);
  const seqScans: string[] = [];
  const indexScans: string[] = [];
  let totalMs: number | null = null;
  let planningMs: number | null = null;
  for (const line of lines) {
    const trimmed = line.trim();
    // EXPLAIN çıktısı genelde "->  Seq Scan" / "->  Index Scan" şeklinde
    // başlar; basit startsWith işe yaramaz — includes kullan.
    if (/Seq Scan on /.test(trimmed)) seqScans.push(trimmed);
    if (
      /Index Scan /.test(trimmed) ||
      /Index Only Scan /.test(trimmed) ||
      /Bitmap Index Scan /.test(trimmed)
    ) {
      indexScans.push(trimmed);
    }
    const exec = trimmed.match(/Execution Time:\s*([\d.]+)\s*ms/);
    if (exec) totalMs = parseFloat(exec[1] ?? "0");
    const plan = trimmed.match(/Planning Time:\s*([\d.]+)\s*ms/);
    if (plan) planningMs = parseFloat(plan[1] ?? "0");
  }
  return { seqScans, indexScans, totalMs, planningMs };
}

async function runOne(qc: QueryCase): Promise<void> {
  console.log(`\n━━━ ${qc.label} ━━━`);
  const explainSql = `EXPLAIN (ANALYZE, BUFFERS, VERBOSE OFF) ${qc.sql}`;
  try {
    const rows = await prisma.$queryRawUnsafe<PlanRow[]>(explainSql);
    const summary = summarizePlan(rows);

    // Plan satırlarını kısaltılmış yaz — ilk 6 + son 3 genelde yeterli.
    const preview = rows.map((r) => r["QUERY PLAN"]);
    const head = preview.slice(0, 8);
    const tail = preview.slice(-3).filter((l) => !head.includes(l));
    for (const line of head) console.log(`  ${line}`);
    if (preview.length > 11) console.log(`  ... (${preview.length - 11} satır kısaltıldı)`);
    for (const line of tail) console.log(`  ${line}`);

    // Summary
    const flag = summary.seqScans.length > 0 ? "⚠" : "✅";
    console.log(
      `  ${flag} Seq scans: ${summary.seqScans.length} | Index scans: ${summary.indexScans.length} | Planning: ${summary.planningMs?.toFixed(2) ?? "?"}ms | Execution: ${summary.totalMs?.toFixed(2) ?? "?"}ms`,
    );
    if (summary.seqScans.length > 0) {
      for (const s of summary.seqScans) console.log(`    → ${s.substring(0, 100)}`);
    }
  } catch (err) {
    console.log(
      `  ❌ Sorgu hatası: ${err instanceof Error ? err.message : String(err)}`,
    );
  }
}

async function main() {
  // Connection info
  const url = new URL(process.env.DATABASE_URL!);
  console.log(`🔌 DB: ${url.host}\n`);

  // Table sizes (reference)
  const sizes = await prisma.$queryRaw<
    { table: string; rows: bigint }[]
  >`
    SELECT 'recipes' AS table, COUNT(*)::bigint AS rows FROM recipes
    UNION ALL
    SELECT 'recipe_ingredients', COUNT(*)::bigint FROM recipe_ingredients
    UNION ALL
    SELECT 'recipe_steps', COUNT(*)::bigint FROM recipe_steps
    UNION ALL
    SELECT 'variations', COUNT(*)::bigint FROM variations
    UNION ALL
    SELECT 'recipe_tags', COUNT(*)::bigint FROM recipe_tags
  `;
  console.log("Tablo boyutları:");
  for (const s of sizes) console.log(`  ${s.table.padEnd(22)} ${s.rows}`);

  // Run cases
  for (const qc of CASES) {
    await runOne(qc);
  }

  console.log("\n━━━ DEĞERLENDİRME ━━━");
  console.log(
    "Seq scans: 100+ satırlı tabloda varsa incele; <100 satırda planner " +
      "seq scan'i tercih edebilir (index setup cost > benefit).",
  );
}

main()
  .catch((err) => {
    console.error("❌", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
