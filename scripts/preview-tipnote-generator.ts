/**
 * Preview generator output on random 20 empty-tipNote recipes.
 * Before committing to DB apply, inspect generated output for realism.
 *
 *   npx tsx scripts/preview-tipnote-generator.ts
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
import { generate, type RecipeSignal } from "./lib/tipnote-generator";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

async function main() {
  assertDbTarget("preview-tipnote-generator");
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
      take: 25,
    });
    let out = `PREVIEW: ${rows.length} tarif\n` + "=".repeat(70) + "\n\n";
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
      out += `${r.slug} | ${r.title}  [${r.type}, ${r.category?.slug}]\n`;
      out += `  ingredients: ${sig.ingredients.slice(0, 6).join(", ")}${sig.ingredients.length > 6 ? ", ..." : ""}\n`;
      out += `  tip:   [${g.tipRule}]  ${g.tipNote}\n`;
      out += `  serv:  [${g.servRule}]  ${g.servingSuggestion}\n`;
      out += `  (eski tip="${r.tipNote ?? ""}" eski serv="${r.servingSuggestion ?? ""}")\n`;
      out += "\n";
    }
    fs.writeFileSync("tmp-tipnote-preview.txt", out, "utf-8");
    console.log(out);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
