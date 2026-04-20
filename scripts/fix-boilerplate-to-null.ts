/**
 * Scan all published recipes and null out tipNote / servingSuggestion
 * values that are shared across 3+ recipes, these are always
 * .map()-generated boilerplate (CODEX_HANDOFF.md §6.5 bans them).
 *
 * Null render's cleanly in the UI (section hidden), RECIPE_FORMAT.md
 * "sahte tip yerine null" rule. Real per-recipe text can be filled in
 * later, one recipe at a time.
 *
 *   npx tsx scripts/fix-boilerplate-to-null.ts              # dry run
 *   npx tsx scripts/fix-boilerplate-to-null.ts --apply      # write
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
// Same text appearing in ≥6 recipes = almost certainly .map()-generated
// boilerplate. 3-5 tarif range preserves authentic cultural servis notes
// ("Sarımsaklı yoğurtla servis edin." on 5 mantı/köfte recipes, etc).
const BOILERPLATE_THRESHOLD = 6;

async function main(): Promise<void> {
  assertDbTarget("fix-boilerplate-to-null");
  console.log(
    `🔧 fix-boilerplate-to-null (${APPLY ? "APPLY" : "DRY RUN"}) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: { id: true, slug: true, tipNote: true, servingSuggestion: true },
  });

  // Group values → recipe IDs
  const tipNoteMap = new Map<string, string[]>();
  const servingMap = new Map<string, string[]>();
  for (const r of recipes) {
    if (r.tipNote && r.tipNote.trim()) {
      (tipNoteMap.get(r.tipNote) ?? tipNoteMap.set(r.tipNote, []).get(r.tipNote)!).push(r.id);
    }
    if (r.servingSuggestion && r.servingSuggestion.trim()) {
      (servingMap.get(r.servingSuggestion) ?? servingMap.set(r.servingSuggestion, []).get(r.servingSuggestion)!).push(r.id);
    }
  }

  // Find boilerplate: value shared across ≥ threshold recipes
  const tipBoilerplate = [...tipNoteMap.entries()].filter(
    ([, ids]) => ids.length >= BOILERPLATE_THRESHOLD,
  );
  const servingBoilerplate = [...servingMap.entries()].filter(
    ([, ids]) => ids.length >= BOILERPLATE_THRESHOLD,
  );

  console.log(`--- Boilerplate tipNote patterns (${tipBoilerplate.length}) ---`);
  for (const [text, ids] of tipBoilerplate.sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${ids.length.toString().padStart(3)} tarif, "${text.slice(0, 70)}${text.length > 70 ? "..." : ""}"`);
  }
  console.log(
    `\n--- Boilerplate servingSuggestion patterns (${servingBoilerplate.length}) ---`,
  );
  for (const [text, ids] of servingBoilerplate.sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${ids.length.toString().padStart(3)} tarif, "${text.slice(0, 70)}${text.length > 70 ? "..." : ""}"`);
  }

  const tipTotal = tipBoilerplate.reduce((sum, [, ids]) => sum + ids.length, 0);
  const servingTotal = servingBoilerplate.reduce((sum, [, ids]) => sum + ids.length, 0);

  console.log(
    `\n=== Impact ===`,
    `\n  tipNote         → null: ${tipTotal} tarif (${tipBoilerplate.length} pattern)`,
    `\n  servingSuggest  → null: ${servingTotal} tarif (${servingBoilerplate.length} pattern)`,
  );

  if (APPLY) {
    // Flatten all affected IDs
    const tipIds = tipBoilerplate.flatMap(([, ids]) => ids);
    const servingIds = servingBoilerplate.flatMap(([, ids]) => ids);
    if (tipIds.length > 0) {
      await prisma.recipe.updateMany({
        where: { id: { in: tipIds } },
        data: { tipNote: null },
      });
    }
    if (servingIds.length > 0) {
      await prisma.recipe.updateMany({
        where: { id: { in: servingIds } },
        data: { servingSuggestion: null },
      });
    }
    console.log(
      `\n✅ Nulled ${tipIds.length} tipNote + ${servingIds.length} servingSuggestion`,
    );
  } else {
    console.log("\n(dry run, re-run with --apply to write)");
  }
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
