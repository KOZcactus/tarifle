/**
 * Audit current isFeatured coverage + breakdown.
 *
 *   npx tsx scripts/audit-featured-distribution.ts
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

async function main() {
  assertDbTarget("audit-featured-distribution");
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const all = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        isFeatured: true,
        cuisine: true,
        viewCount: true,
        category: { select: { slug: true } },
      },
    });

    const total = all.length;
    const featured = all.filter((r) => r.isFeatured);
    const featuredCount = featured.length;

    let out = `TOTAL: ${total} tarif\n`;
    out += `isFeatured: ${featuredCount} (%${((featuredCount / total) * 100).toFixed(1)})\n`;
    out += `isFeatured=false: ${total - featuredCount}\n\n`;

    // cuisine breakdown
    out += `Cuisine dağılımı (featured / total):\n`;
    const cuisines = new Map<string, { f: number; t: number }>();
    for (const r of all) {
      const c = r.cuisine ?? "?";
      const cur = cuisines.get(c) ?? { f: 0, t: 0 };
      cur.t++;
      if (r.isFeatured) cur.f++;
      cuisines.set(c, cur);
    }
    const sortedC = [...cuisines.entries()].sort((a, b) => b[1].t - a[1].t);
    for (const [c, { f, t }] of sortedC) {
      const pct = ((f / t) * 100).toFixed(1);
      out += `  ${c.padEnd(4)}  ${String(f).padStart(4)} / ${String(t).padEnd(5)}  (%${pct})\n`;
    }

    // category breakdown
    out += `\nKategori dağılımı (featured / total):\n`;
    const cats = new Map<string, { f: number; t: number }>();
    for (const r of all) {
      const c = r.category?.slug ?? "?";
      const cur = cats.get(c) ?? { f: 0, t: 0 };
      cur.t++;
      if (r.isFeatured) cur.f++;
      cats.set(c, cur);
    }
    const sortedCat = [...cats.entries()].sort((a, b) => b[1].t - a[1].t);
    for (const [c, { f, t }] of sortedCat) {
      const pct = ((f / t) * 100).toFixed(1);
      out += `  ${c.padEnd(28)}  ${String(f).padStart(4)} / ${String(t).padEnd(5)}  (%${pct})\n`;
    }

    // View count stats for non-featured (potential boost candidates)
    const nonFeaturedViews = all
      .filter((r) => !r.isFeatured)
      .map((r) => r.viewCount ?? 0)
      .sort((a, b) => b - a);
    const top10 = nonFeaturedViews.slice(0, 10);
    out += `\nTop 10 non-featured view counts: ${top10.join(", ")}\n`;
    const p90 =
      nonFeaturedViews[Math.floor(nonFeaturedViews.length * 0.1)] ?? 0;
    const p75 =
      nonFeaturedViews[Math.floor(nonFeaturedViews.length * 0.25)] ?? 0;
    out += `p90 (top 10%): ${p90}, p75 (top 25%): ${p75}\n`;

    fs.writeFileSync("tmp-featured-audit.txt", out, "utf-8");
    console.log(out);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
