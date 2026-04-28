import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local"), override: true });

const slugs = [
  "sakizli-kabak-cicegi-dolmasi-mugla-usulu",
  "susamli-biber-dizmesi-kocaeli-usulu",
  "tandir-otlu-gozleme-sirnak-usulu",
  "tarcinli-ananas-kup-peru-usulu",
  "zeytin-ezmeli-lorlu-katmer-ayvalik-usulu",
  "tavuklu-bulgurlu-nohut-pilavi-siirt-usulu",
  "papatyali-soguk-limonata-yalova-usulu",
];

async function main() {
  const url = process.env.DATABASE_URL!;
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: url }),
  });
  console.log("DB:", new URL(url).host);
  for (const slug of slugs) {
    const r = await prisma.recipe.findUnique({
      where: { slug },
      select: {
        id: true, title: true, description: true, cuisine: true, type: true,
        difficulty: true, prepMinutes: true, cookMinutes: true, totalMinutes: true,
        averageCalories: true, allergens: true, tipNote: true, servingSuggestion: true,
        ingredients: { select: { name: true, amount: true, unit: true }, orderBy: { sortOrder: "asc" } },
        steps: { select: { stepNumber: true, instruction: true, timerSeconds: true }, orderBy: { stepNumber: "asc" } },
      },
    });
    if (!r) { console.log("NOT FOUND:", slug); continue; }
    console.log("\n=== " + slug + " ===");
    console.log("title:", r.title);
    console.log("description:", r.description);
    console.log("cuisine:", r.cuisine, "| type:", r.type, "| diff:", r.difficulty,
      "| prep/cook/total:", r.prepMinutes, "/", r.cookMinutes, "/", r.totalMinutes,
      "| kcal:", r.averageCalories);
    console.log("allergens:", r.allergens);
    console.log("tipNote:", r.tipNote);
    console.log("servingSuggestion:", r.servingSuggestion);
    console.log("ingredients:");
    r.ingredients.forEach((i) =>
      console.log("  - " + i.name + " | " + i.amount + " " + i.unit),
    );
    console.log("steps:");
    r.steps.forEach((s) =>
      console.log("  " + s.stepNumber + " [" + (s.timerSeconds ?? "-") + "] " + s.instruction.slice(0, 120)),
    );
  }
  await prisma.$disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
