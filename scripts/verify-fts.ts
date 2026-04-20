/**
 * One-off smoke check for the full-text search migration. Verifies:
 *   - Turkish stemmer produces expected lexemes
 *   - immutable_unaccent wrapper maps TR chars to ASCII
 *   - searchVector column is populated for all existing recipes
 *   - websearch_to_tsquery + GIN index actually return matches
 *   - EXPLAIN plan uses the GIN index (Bitmap Index Scan)
 *
 * Keep around for the next time someone tweaks the tsvector definition;
 * re-run to confirm nothing regressed. Not wired into CI because it
 * requires a live DB connection.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __dirname2 = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Test 1: Turkish stemming");
  const stem1 = await prisma.$queryRaw<{ lexemes: string }[]>`
    SELECT to_tsvector('turkish', 'mantı mantılar mantının peynirli peynir')::text AS lexemes
  `;
  console.log(`  lexemes → ${stem1[0]?.lexemes}`);

  console.log("\nTest 2: unaccent wrapper");
  const u = await prisma.$queryRaw<{ r: string }[]>`
    SELECT public.immutable_unaccent('Şerbet Mantı Güllaç İskender') AS r
  `;
  console.log(`  "Şerbet Mantı Güllaç İskender" → "${u[0]?.r}"`);

  console.log("\nTest 3: searchVector populated");
  const filled = await prisma.$queryRaw<{ cnt: bigint }[]>`
    SELECT COUNT(*) AS cnt FROM recipes WHERE "searchVector" IS NOT NULL
  `;
  console.log(`  NOT NULL row count: ${filled[0]?.cnt}`);

  console.log("\nTest 4: accent-insensitive search for 'manti'");
  const hit1 = await prisma.$queryRaw<{ title: string; rank: number }[]>`
    SELECT title, ts_rank_cd("searchVector", q.query)::float AS rank
    FROM recipes, websearch_to_tsquery('turkish', public.immutable_unaccent('manti')) AS q(query)
    WHERE "searchVector" @@ q.query AND status = 'PUBLISHED'
    ORDER BY rank DESC LIMIT 3
  `;
  console.log(`  hits: ${hit1.map((h) => `${h.title}(${h.rank.toFixed(3)})`).join(", ")}`);

  console.log("\nTest 5: stemming, 'peynir' stem bulmalı");
  const hit2 = await prisma.$queryRaw<{ title: string }[]>`
    SELECT title
    FROM recipes, websearch_to_tsquery('turkish', public.immutable_unaccent('peynir')) AS q(query)
    WHERE "searchVector" @@ q.query AND status = 'PUBLISHED'
    ORDER BY ts_rank_cd("searchVector", q.query) DESC LIMIT 5
  `;
  console.log(`  hits: ${hit2.length} tarif → ${hit2.map((h) => h.title).join(", ")}`);

  console.log("\nTest 6: EXPLAIN plan (GIN index kullanıyor mu?)");
  const plan = await prisma.$queryRaw<{ "QUERY PLAN": string }[]>`
    EXPLAIN SELECT id FROM recipes
    WHERE "searchVector" @@ websearch_to_tsquery('turkish', public.immutable_unaccent('mantı'))
  `;
  plan.forEach((p) => console.log(`  ${p["QUERY PLAN"]}`));
}

main()
  .catch((err) => {
    console.error("❌", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
