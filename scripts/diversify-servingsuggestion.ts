/**
 * Diversify servingSuggestion boilerplate'lerini generator çıktılarıyla.
 *
 * BATCH 0-26 dönemi Codex'in standart çıkışları tek-satır tek-kalıp
 * cümlelerden ibaret (~1070 tarif). Generator'ın rule-based "AI hissi"
 * varyantlarıyla overwrite ediyoruz. Whitelist dışındaki özgün ve uzun
 * varyantlara DOKUNMUYORUZ.
 *
 * Sadece tam eşleşme (exact string match) whitelist ile güvenlik:
 *   "Ilık servis edin." vs "Yanına limon dilimleri koyarak sıcak
 *   servis edin." farkını korumak için string fuzzy match YOK.
 *
 *   npx tsx scripts/diversify-servingsuggestion.ts            # dry run + 15 örnek
 *   npx tsx scripts/diversify-servingsuggestion.ts --apply    # dev write
 *   DATABASE_URL=<prod> npx tsx scripts/diversify-servingsuggestion.ts --apply --confirm-prod
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

/**
 * Overwrite target: sadece bu 9 boilerplate'den biri DB'de yazıyorsa
 * generator varyantıyla değiştirilir. Bu dizide olmayan herhangi bir
 * servingSuggestion özgün kabul edilir, dokunulmaz.
 */
const BOILERPLATE_WHITELIST: string[] = [
  "Ilık servis edin.",
  "Soğuk servis edin.",
  "Sıcak servis edin.",
  "Çok soğuk servis edin.",
  "Ilık ya da soğuk servis edin.",
  "Soğuk ya da ılık servis edin.",
  "Üzerine kuru nane serperek sıcak servis edin.",
  "Üzerine zeytinyağı gezdirip soğuk servis edin.",
  "Yanına limon dilimleri koyarak sıcak servis edin.",
];

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("diversify-servingsuggestion");
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
        servingSuggestion: { in: BOILERPLATE_WHITELIST },
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
        servingSuggestion: true,
        category: { select: { slug: true } },
        ingredients: {
          select: { name: true },
          orderBy: { sortOrder: "asc" },
        },
      },
    });

    console.log(`  scope: ${rows.length} tarif (boilerplate servingSuggestion)`);

    const ruleHist = new Map<string, number>();
    const samples: string[] = [];
    let patched = 0;
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
      ruleHist.set(g.servRule, (ruleHist.get(g.servRule) ?? 0) + 1);
      if (samples.length < 15) {
        samples.push(
          `${r.slug}  [${r.type}, ${r.category?.slug}]\n  was:  "${r.servingSuggestion}"\n  now:  [${g.servRule}] ${g.servingSuggestion}`,
        );
      }
      if (apply) {
        await prisma.recipe.update({
          where: { id: r.id },
          data: { servingSuggestion: g.servingSuggestion },
        });
      }
      patched++;
    }

    console.log(`\n  samples (ilk 15):`);
    for (const s of samples) console.log("  " + s.replace(/\n/g, "\n  "));

    console.log(`\n  rule distribution:`);
    const sorted = [...ruleHist.entries()].sort((a, b) => b[1] - a[1]);
    for (const [r, n] of sorted) {
      console.log(`    ${n.toString().padStart(4)}x  ${r}`);
    }

    console.log(
      `\n${apply ? "applied" : "dry-run"}: ${patched} tarif diversified`,
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
