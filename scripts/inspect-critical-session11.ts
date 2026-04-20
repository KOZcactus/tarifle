import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { writeFileSync } from "node:fs";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const slugs = [
  "cokelekli-biber-dolmasi-mugla-usulu",
  "anzak-biskuvili-kup-avustralya-usulu",
  "muzlu-tapyoka-kup-vietnam-usulu",
  "hindistancevizli-tavuk-corbasi-vietnam-usulu",
  "kahveli-hindistancevizli-shaker-vietnam-usulu",
  "ayvali-kereviz-guveci-canakkale-usulu",
  "muzlu-tapiyoka-kup-vietnam-usulu",
  "balkabakli-hindistancevizli-corba-avustralya-usulu",
  "lamington-trifle-kup-avustralya-usulu",
  "hindistancevizli-flan-kup-kuba-usulu",
  "pao-de-queijo-waffle-brezilya-usulu",
  "reyhanli-tavuklu-yogurt-corbasi-osmaniye-usulu",
  "kapros-zoldbabfozelek-macar-usulu",
  "ayranli-yesil-mercimek-corbasi-erzurum-yayla-usulu",
  "yogurtlu-nohut-yahni-konya-ova-usulu",
  "kurutlu-semizotu-corbasi-erzincan-usulu",
  "rosehip-soup-iskandinav-usulu",
  "katikli-patates-corbasi-sivas-usulu",
  "zahterli-yogurt-corbasi-hatay-koy-usulu",
];

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const rows = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true,
      title: true,
      allergens: true,
      ingredients: {
        select: { name: true, sortOrder: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  });
  let out = `total rows: ${rows.length}\n`;
  for (const r of rows) {
    out += "\n=== " + r.slug + " | " + r.title + "\n";
    out += "  ALLERGENS: " + JSON.stringify(r.allergens) + "\n";
    out += "  INGREDIENTS:\n";
    for (const i of r.ingredients) out += "    - " + i.name + "\n";
  }
  writeFileSync("tmp-critical-inspect.txt", out, "utf-8");
  process.stdout.write(`wrote ${rows.length} rows to tmp-critical-inspect.txt\n`);
}
main().finally(() => prisma.$disconnect());
