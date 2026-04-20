/**
 * Duplicate title inceleme, audit-db-integrity tespiti sonrası drill-down.
 * Aynı title case-insensitive N+ kez tekrar ediyorsa, iki olasılık var:
 *   - Bölgesel varyant (farklı cuisine/description/ingredients) → legitimate
 *   - Copy-paste (aynı içerik, sadece slug farklı) → merge candidate
 *
 * Bu script her duplicate grubu için slug + cuisine + description özetini
 * döker ki manuel review edilsin.
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

async function main(): Promise<void> {
  const dups: Array<{ title_lower: string; count: bigint; slugs: string[] }> = await prisma.$queryRaw`
    SELECT LOWER(title) AS title_lower, COUNT(*) AS count, ARRAY_AGG(slug ORDER BY slug) AS slugs
    FROM recipes
    GROUP BY LOWER(title)
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC, LOWER(title)
  `;

  console.log(`Total duplicate-title groups: ${dups.length}\n`);

  for (const d of dups) {
    console.log(`══ "${d.title_lower}" × ${Number(d.count)} ══`);
    const recipes = await prisma.recipe.findMany({
      where: { slug: { in: d.slugs } },
      select: {
        slug: true,
        title: true,
        cuisine: true,
        description: true,
        totalMinutes: true,
        _count: { select: { ingredients: true, steps: true } },
      },
      orderBy: { slug: "asc" },
    });
    for (const r of recipes) {
      console.log(`  [${r.slug}]`);
      console.log(`    title: "${r.title}"`);
      console.log(`    cuisine: ${r.cuisine ?? "NULL"}, time: ${r.totalMinutes}dk, ingredients: ${r._count.ingredients}, steps: ${r._count.steps}`);
      console.log(`    desc: ${r.description.slice(0, 120)}${r.description.length > 120 ? "…" : ""}`);
    }
    console.log("");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
