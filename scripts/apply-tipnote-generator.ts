/**
 * Apply tipNote + servingSuggestion generator to all PUBLISHED recipes.
 * Merge stratejisi: sadece mevcut alan BOŞ ise generator çıktısını yaz.
 * Dolu alana asla dokunulmaz.
 *
 *   npx tsx scripts/apply-tipnote-generator.ts             # dry run (sayar, 20 örnek)
 *   npx tsx scripts/apply-tipnote-generator.ts --apply     # dev write
 *   DATABASE_URL=<prod> npx tsx scripts/apply-tipnote-generator.ts --apply --confirm-prod
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";
import { generate, type RecipeSignal } from "./lib/tipnote-generator";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

function isEmpty(s: string | null | undefined): boolean {
  return !s || s.trim() === "";
}

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("apply-tipnote-generator");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }

  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });

  try {
    const rows = await prisma.recipe.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { tipNote: null },
          { tipNote: "" },
          { servingSuggestion: null },
          { servingSuggestion: "" },
        ],
      },
      select: {
        id: true,
        slug: true,
        title: true,
        type: true,
        cuisine: true,
        difficulty: true,
        prepMinutes: true,
        cookMinutes: true,
        tipNote: true,
        servingSuggestion: true,
        category: { select: { slug: true } },
        ingredients: {
          select: { name: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    console.log(`  scope: ${rows.length} tarif (en az biri boş)`);
    let tipPatched = 0;
    let servPatched = 0;
    let bothSkipped = 0;
    const samples: string[] = [];

    for (const r of rows) {
      const sig: RecipeSignal = {
        slug: r.slug,
        title: r.title,
        type: r.type as RecipeSignal["type"],
        categorySlug: r.category?.slug ?? "",
        cuisine: r.cuisine ?? "tr",
        difficulty: r.difficulty as RecipeSignal["difficulty"],
        prepMinutes: r.prepMinutes ?? 0,
        cookMinutes: r.cookMinutes ?? 0,
        ingredients: r.ingredients.map((i) => i.name),
      };
      const g = generate(sig);
      const tipEmpty = isEmpty(r.tipNote);
      const servEmpty = isEmpty(r.servingSuggestion);

      const patch: { tipNote?: string; servingSuggestion?: string } = {};
      if (tipEmpty) patch.tipNote = g.tipNote;
      if (servEmpty) patch.servingSuggestion = g.servingSuggestion;
      if (!tipEmpty && !servEmpty) {
        bothSkipped++;
        continue;
      }
      if (tipEmpty) tipPatched++;
      if (servEmpty) servPatched++;

      if (samples.length < 10) {
        samples.push(
          `${r.slug}` +
            (tipEmpty ? `\n  tip+ [${g.tipRule}] ${g.tipNote}` : "") +
            (servEmpty ? `\n  srv+ [${g.servRule}] ${g.servingSuggestion}` : ""),
        );
      }

      if (apply) {
        await prisma.recipe.update({
          where: { id: r.id },
          data: patch,
        });
      }
    }

    console.log(`\n  samples:`);
    for (const s of samples) console.log("  " + s.replace(/\n/g, "\n  "));
    console.log(
      `\n${apply ? "applied" : "dry-run"}: tip +${tipPatched}, serv +${servPatched}, both-already-full ${bothSkipped}`,
    );
    if (!apply) console.log("re-run with --apply to write.");
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
