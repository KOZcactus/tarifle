/**
 * audit-duplicate-titles çıktısı üzerinden her grupta KANONİK tarif
 * seçer (en zengin = en çok ingredient + en çok step + en yeni
 * createdAt) ve diğerlerini SLUG listesi olarak yazar.
 *
 * Kullanım:
 *   npx tsx scripts/pick-duplicate-canonical.ts
 *
 * Çıktı: docs/duplicate-rollback-slugs.txt (rollback-batch için)
 *
 * Karar kuralı (oturum 21 Mod A drift cleanup):
 * 1. En çok ingredient (zenginlik proxy)
 * 2. Tie: en çok step
 * 3. Tie: en yeni createdAt (Codex'in daha rafine versiyonu)
 * 4. Tie: slug alfabetik ilk (deterministik)
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import fs from "node:fs";
import { assertDbTarget } from "./lib/db-env";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
neonConfig.webSocketConstructor = ws;

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

interface RecipeRow {
  id: string;
  slug: string;
  title: string;
  createdAt: Date;
  ingredientCount: number;
  stepCount: number;
}

async function main() {
  assertDbTarget("pick-duplicate-canonical");

  const recipes = await prisma.recipe.findMany({
    where: { status: "PUBLISHED" },
    select: {
      id: true,
      slug: true,
      title: true,
      createdAt: true,
      _count: { select: { ingredients: true, steps: true } },
    },
  });

  // Group by normalized title
  const byTitle = new Map<string, RecipeRow[]>();
  for (const r of recipes) {
    const key = r.title.toLocaleLowerCase("tr-TR").trim();
    const row: RecipeRow = {
      id: r.id,
      slug: r.slug,
      title: r.title,
      createdAt: r.createdAt,
      ingredientCount: r._count.ingredients,
      stepCount: r._count.steps,
    };
    const list = byTitle.get(key) ?? [];
    list.push(row);
    byTitle.set(key, list);
  }

  const dupGroups = Array.from(byTitle.entries()).filter(
    ([, rs]) => rs.length > 1,
  );
  console.log("Duplicate gruplar:", dupGroups.length);

  const toDelete: string[] = [];
  const toKeep: string[] = [];

  for (const [title, rows] of dupGroups) {
    // Sort by canonical priority
    rows.sort((a, b) => {
      if (b.ingredientCount !== a.ingredientCount)
        return b.ingredientCount - a.ingredientCount;
      if (b.stepCount !== a.stepCount) return b.stepCount - a.stepCount;
      const aTs = a.createdAt.getTime();
      const bTs = b.createdAt.getTime();
      if (bTs !== aTs) return bTs - aTs;
      return a.slug.localeCompare(b.slug);
    });

    const canonical = rows[0];
    const losers = rows.slice(1);
    toKeep.push(canonical.slug);
    losers.forEach((l) => toDelete.push(l.slug));

    console.log(
      `\n"${title}" × ${rows.length}\n  ✅ KEEP: ${canonical.slug} (ing=${canonical.ingredientCount}, step=${canonical.stepCount})`,
    );
    losers.forEach((l) =>
      console.log(
        `  ❌ DELETE: ${l.slug} (ing=${l.ingredientCount}, step=${l.stepCount})`,
      ),
    );
  }

  console.log(
    `\n📊 Sonuc: ${toKeep.length} kanonik kalir, ${toDelete.length} silinir`,
  );

  // Write outputs
  fs.writeFileSync(
    "docs/duplicate-rollback-slugs.txt",
    toDelete.join("\n") + "\n",
  );
  fs.writeFileSync(
    "docs/duplicate-keep-slugs.txt",
    toKeep.join("\n") + "\n",
  );
  console.log(
    `\n✅ docs/duplicate-rollback-slugs.txt yazildi (${toDelete.length} slug)`,
  );
  console.log(
    `✅ docs/duplicate-keep-slugs.txt yazildi (${toKeep.length} slug)`,
  );

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
