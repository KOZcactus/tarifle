/**
 * Audit tipNote + servingSuggestion coverage across prod tarifleri.
 *
 * "Boş" = null / undefined / empty string.
 * "Boilerplate" = bir havuz, ~50 tarif altında kullanılan generic cümle.
 * Bu script prod'da ne kadar eski tarif "AI hissi" notundan yoksun
 * gösterir. Rule-based generator hedefleri buradan çıkar.
 *
 *   npx tsx scripts/audit-tipnote-coverage.ts       # dev (default)
 *   DATABASE_URL=<prod> npx tsx scripts/audit-tipnote-coverage.ts --confirm-prod
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

function isEmpty(s: string | null | undefined): boolean {
  return !s || s.trim() === "";
}

async function main() {
  assertDbTarget("audit-tipnote-coverage");
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const rows = await prisma.recipe.findMany({
      where: { status: "PUBLISHED" },
      select: {
        slug: true,
        title: true,
        tipNote: true,
        servingSuggestion: true,
        category: { select: { slug: true } },
      },
    });
    let emptyTip = 0;
    let emptyServ = 0;
    let both = 0;
    const tipHist = new Map<string, number>();
    const servHist = new Map<string, number>();
    const emptyTipSlugs: string[] = [];
    const emptyServSlugs: string[] = [];
    for (const r of rows) {
      const et = isEmpty(r.tipNote);
      const es = isEmpty(r.servingSuggestion);
      if (et) {
        emptyTip++;
        emptyTipSlugs.push(r.slug);
      } else {
        tipHist.set(r.tipNote!, (tipHist.get(r.tipNote!) ?? 0) + 1);
      }
      if (es) {
        emptyServ++;
        emptyServSlugs.push(r.slug);
      } else {
        servHist.set(
          r.servingSuggestion!,
          (servHist.get(r.servingSuggestion!) ?? 0) + 1,
        );
      }
      if (et && es) both++;
    }
    const topDuplicatesTip = [...tipHist.entries()]
      .filter(([, n]) => n >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    const topDuplicatesServ = [...servHist.entries()]
      .filter(([, n]) => n >= 5)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20);
    let out = `TOTAL: ${rows.length} tarif\n\n`;
    out += `tipNote boş: ${emptyTip} (%${((emptyTip / rows.length) * 100).toFixed(1)})\n`;
    out += `servingSuggestion boş: ${emptyServ} (%${((emptyServ / rows.length) * 100).toFixed(1)})\n`;
    out += `ikisi de boş: ${both}\n\n`;
    out += `Top duplicate tipNote (5+ kullanım, muhtemel boilerplate):\n`;
    for (const [t, n] of topDuplicatesTip) {
      out += `  [${n}x] ${t}\n`;
    }
    out += `\nTop duplicate servingSuggestion (5+ kullanım, muhtemel boilerplate):\n`;
    for (const [s, n] of topDuplicatesServ) {
      out += `  [${n}x] ${s}\n`;
    }
    out += `\nfirst 20 empty-tip slugs:\n${emptyTipSlugs.slice(0, 20).map((s) => "  " + s).join("\n")}\n`;
    fs.writeFileSync("tmp-tipnote-audit.txt", out, "utf-8");
    console.log(out);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
