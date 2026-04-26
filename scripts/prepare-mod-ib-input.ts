/**
 * Mod IB icin Codex'e verilecek DB-zenginlestirilmis pair listesi.
 *
 * Kaynak: Mod IA UNCERTAIN classification + butter-chicken featured
 * cluster. DB'den her pair icin tam ingredient listesi + step ilk
 * cumlesi (~50 char) + nutrition farki cikar. Codex DB'ye erisemiyor,
 * bu file'i okuyup karar verecek.
 *
 * Cikti: docs/mod-ib-input.json (Codex'e teslim edilecek)
 *
 * Usage:
 *   npx tsx scripts/prepare-mod-ib-input.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

neonConfig.webSocketConstructor = ws;
const __filename2 = fileURLToPath(import.meta.url);
const __dirname2 = path.dirname(__filename2);
dotenv.config({ path: path.resolve(__dirname2, "..", ".env.local") });

interface PairEntry {
  pair: [string, string];
  classification: "DUPLICATE" | "VARIANT" | "UNCERTAIN";
  winner?: string;
  loser?: string;
  reason: string;
}

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log(`DB: ${new URL(url).host}`);

  // Tum Mod IA batch'lerinden UNCERTAIN'lari topla
  const uncertains: PairEntry[] = [];
  for (const n of [1, 2, 3]) {
    const data = JSON.parse(
      fs.readFileSync(
        path.resolve(process.cwd(), `docs/mod-ia-batch-${n}.json`),
        "utf-8",
      ),
    ) as PairEntry[];
    for (const e of data) {
      if (e.classification === "UNCERTAIN") uncertains.push(e);
    }
  }
  console.log(`UNCERTAIN pair: ${uncertains.length}`);

  // Butter-chicken cluster ekle (Mod IA'da blocked DUPLICATE, Mod IB'de
  // yeniden gozden gecirilecek - tersine cevirme onerisi vs atla)
  const butterChickenSpecial: PairEntry = {
    pair: ["butter-chicken", "delhi-butter-chicken"],
    classification: "UNCERTAIN",
    reason:
      "Mod IA'da DUPLICATE flag'lendi ancak butter-chicken featured + global slug. Sil tehlikeli (SEO+UX kaybi). Tersine cevirme onerisi: canonical=butter-chicken, sil=delhi-butter-chicken (icerik delhi'den butter-chicken'a tasinabilir). Codex DB icerigine bakip canonical tersine onerebilir mi?",
  };
  uncertains.push(butterChickenSpecial);

  // Slug evrenden DB detay cek
  const slugSet = new Set<string>();
  for (const e of uncertains) {
    slugSet.add(e.pair[0]);
    slugSet.add(e.pair[1]);
  }
  const rows = await prisma.recipe.findMany({
    where: { slug: { in: [...slugSet] } },
    select: {
      slug: true,
      title: true,
      cuisine: true,
      type: true,
      description: true,
      tipNote: true,
      servingSuggestion: true,
      averageCalories: true,
      protein: true,
      carbs: true,
      fat: true,
      totalMinutes: true,
      prepMinutes: true,
      cookMinutes: true,
      isFeatured: true,
      ingredients: {
        select: { name: true, amount: true, unit: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
      steps: {
        select: { stepNumber: true, instruction: true },
        orderBy: { stepNumber: "asc" },
      },
    },
  });
  const map = new Map(rows.map((r) => [r.slug, r]));

  // Codex'e teslim edilecek format (compact ama yeterli)
  const enriched = uncertains.map((e) => {
    const a = map.get(e.pair[0]);
    const b = map.get(e.pair[1]);
    return {
      pair: e.pair,
      previousReason: e.reason,
      a: a
        ? {
            slug: a.slug,
            title: a.title,
            cuisine: a.cuisine,
            type: a.type,
            isFeatured: a.isFeatured,
            description: a.description,
            tipNote: a.tipNote,
            servingSuggestion: a.servingSuggestion,
            calories: a.averageCalories,
            macros: { p: a.protein, c: a.carbs, f: a.fat },
            duration: {
              total: a.totalMinutes,
              prep: a.prepMinutes,
              cook: a.cookMinutes,
            },
            ingredients: a.ingredients.map(
              (i) =>
                `${i.amount}${i.unit ? " " + i.unit : ""} ${i.name}`.trim(),
            ),
            steps: a.steps.map((s) =>
              s.instruction.length > 120
                ? s.instruction.slice(0, 120) + "..."
                : s.instruction,
            ),
          }
        : null,
      b: b
        ? {
            slug: b.slug,
            title: b.title,
            cuisine: b.cuisine,
            type: b.type,
            isFeatured: b.isFeatured,
            description: b.description,
            tipNote: b.tipNote,
            servingSuggestion: b.servingSuggestion,
            calories: b.averageCalories,
            macros: { p: b.protein, c: b.carbs, f: b.fat },
            duration: {
              total: b.totalMinutes,
              prep: b.prepMinutes,
              cook: b.cookMinutes,
            },
            ingredients: b.ingredients.map(
              (i) =>
                `${i.amount}${i.unit ? " " + i.unit : ""} ${i.name}`.trim(),
            ),
            steps: b.steps.map((s) =>
              s.instruction.length > 120
                ? s.instruction.slice(0, 120) + "..."
                : s.instruction,
            ),
          }
        : null,
    };
  });

  fs.writeFileSync(
    path.resolve(process.cwd(), "docs/mod-ib-input.json"),
    JSON.stringify(enriched, null, 2),
  );
  console.log(`Yazildi: docs/mod-ib-input.json (${enriched.length} pair)`);

  await prisma.$disconnect();
}

const isEntrypoint =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isEntrypoint) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
