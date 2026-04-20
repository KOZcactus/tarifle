import { PrismaClient, type Allergen } from "@prisma/client";
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
  const info = assertDbTarget("fix-cevizli-medovik-kusuyemis");
  if (info.isProd && !process.argv.includes("--confirm-prod")) {
    console.error("⛔ prod target without --confirm-prod");
    process.exit(1);
  }
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    const r = await prisma.recipe.findUnique({
      where: { slug: "cevizli-medovik" },
      select: { id: true, allergens: true },
    });
    if (!r) {
      console.log("not found");
      return;
    }
    if (r.allergens.includes("KUSUYEMIS")) {
      console.log("already has KUSUYEMIS:", r.allergens);
      return;
    }
    const next = Array.from(new Set([...r.allergens, "KUSUYEMIS" as Allergen])).sort();
    console.log(`${apply ? "✅" : "•"} was:`, r.allergens, "now:", next);
    if (apply) {
      await prisma.recipe.update({
        where: { id: r.id },
        data: { allergens: next as Allergen[] },
      });
    }
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => { console.error(e); process.exit(1); });
