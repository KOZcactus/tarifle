/**
 * goi-ga-bap-cai (Vietnam tavuk-lahana salatası): step 2 limon suyu
 * bahsediyor ama ingredient'te yok. Vietnamese goi (salata) klasiğinde
 * lime/limon suyu standart sos bileşeni; ingredient ekle.
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

async function main() {
  const apply = process.argv.includes("--apply");
  const info = assertDbTarget("fix-goi-ga-bap-cai");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    const r = await prisma.recipe.findUnique({
      where: { slug: "goi-ga-bap-cai" },
      select: {
        id: true,
        ingredients: { select: { name: true, sortOrder: true } },
      },
    });
    if (!r) {
      console.log("not found");
      return;
    }
    const hasLemon = r.ingredients.some((i) =>
      /limon|lime/i.test(i.name),
    );
    if (hasLemon) {
      console.log("  ⏭  already has lime/limon:", r.ingredients.map((i) => i.name));
      return;
    }
    const nextOrder = r.ingredients.length + 1;
    console.log(
      `  ${apply ? "✅" : "•"} add Lime suyu sortOrder=${nextOrder} to goi-ga-bap-cai`,
    );
    if (apply) {
      await prisma.recipeIngredient.create({
        data: {
          recipeId: r.id,
          name: "Lime suyu",
          amount: "2",
          unit: "yemek kaşığı",
          sortOrder: nextOrder,
        },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
