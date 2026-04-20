import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import * as fs from "node:fs";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

async function main() {
  assertDbTarget("inspect-4-edge-cases");
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  try {
    const slugs = [
      "dut-pekmezli-kete-kup-erzurum-usulu",
      "cheddarli-mantarli-crumpet-ingiltere-usulu",
      "avokadolu-misir-mucver-stack-avustralya-usulu",
      "misirli-pazili-tava-ekmegi-rize-usulu",
    ];
    const rows = await prisma.recipe.findMany({
      where: { slug: { in: slugs } },
      select: {
        slug: true, title: true, allergens: true,
        ingredients: { select: { name: true, amount: true, unit: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    let out = "";
    for (const r of rows) {
      out += `=== ${r.slug} | ${r.title}\n  DB allergens: ${JSON.stringify(r.allergens)}\n  DB ingredients:\n`;
      for (const i of r.ingredients) out += `    ${i.sortOrder}. ${i.name} ${i.amount} ${i.unit ?? ""}\n`;
      out += "\n";
    }
    fs.writeFileSync("tmp-edge-cases.txt", out, "utf-8");
    console.log(out);
  } finally { await prisma.$disconnect(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
