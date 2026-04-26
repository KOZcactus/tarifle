/**
 * Tum yayinda tariflerin baslik + slug + cuisine + type + ingredient
 * count'unu .md dosyasina dump et. Codex + Claude duplicate spot
 * audit'i icin alfabetik liste.
 *
 * Cikti: docs/all-recipe-titles.md
 *
 * Format:
 *   ## tr / TATLI (N)
 *   - **Title** [slug] (cuisine, type, Xi/Ys, Zdk)
 *
 * Cuisine + type ile gruplanmis, alfabetik. Aynı grup içindeki tarifler
 * yan yana, manuel inspection ile duplicate görünüm hızlanır.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

async function main(): Promise<void> {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      slug: true,
      title: true,
      cuisine: true,
      type: true,
      totalMinutes: true,
      averageCalories: true,
      isFeatured: true,
      _count: { select: { ingredients: true, steps: true } },
    },
    orderBy: [{ cuisine: "asc" }, { type: "asc" }, { title: "asc" }],
  });

  const groups = new Map<string, typeof recipes>();
  for (const r of recipes) {
    const key = `${r.cuisine ?? "?"} / ${r.type}`;
    if (!groups.has(key)) groups.set(key, [] as typeof recipes);
    groups.get(key)!.push(r);
  }

  const lines: string[] = [];
  lines.push("# Tarifle, tüm yayında tarif başlıkları");
  lines.push("");
  lines.push(
    `Toplam: **${recipes.length} tarif** (cuisine + type bazında gruplanmış, alfabetik).`,
  );
  lines.push(
    "Duplicate spot audit için: aynı grup içindeki yakın başlıklar yan yana.",
  );
  lines.push("");
  lines.push(`Üretildi: ${new Date().toISOString().slice(0, 10)}`);
  lines.push("");

  for (const [groupKey, rows] of [...groups.entries()].sort()) {
    lines.push(`## ${groupKey} (${rows.length})`);
    lines.push("");
    for (const r of rows) {
      const star = r.isFeatured ? "⭐" : "";
      lines.push(
        `- ${star}**${r.title}** [${r.slug}] (${r._count.ingredients}i/${r._count.steps}s, ${r.totalMinutes}dk, ${r.averageCalories ?? "?"}kcal)`,
      );
    }
    lines.push("");
  }

  const outFile = path.resolve(process.cwd(), "docs/all-recipe-titles.md");
  fs.writeFileSync(outFile, lines.join("\n"));
  console.log(`✅ ${outFile} yazıldı, ${recipes.length} tarif, ${groups.size} cuisine/type grubu.`);
  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
