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
  assertDbTarget("inspect-backfill08-issues");
  const adapter = new PrismaNeon({
    connectionString: process.env.DATABASE_URL!,
  });
  const prisma = new PrismaClient({ adapter });
  try {
    const slugs = [
      "kolbaszli-lecso",
      "dereotlu-olivier-salatasi",
      "cevizli-medovik",
    ];
    const rows = await prisma.recipe.findMany({
      where: { slug: { in: slugs } },
      select: {
        slug: true,
        title: true,
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
    let out = "";
    for (const r of rows) {
      out += `=== ${r.slug} | ${r.title}\n  INGREDIENTS:\n`;
      for (const i of r.ingredients) {
        out += `    ${i.sortOrder}. ${i.name} ${i.amount} ${i.unit ?? ""}\n`;
      }
      out += `  STEPS:\n`;
      for (const s of r.steps) {
        out += `    ${s.stepNumber}. ${s.instruction}\n`;
      }
      out += `\n`;
    }
    fs.writeFileSync("tmp-backfill08-inspect.txt", out, "utf-8");
    console.log(out);
  } finally {
    await prisma.$disconnect();
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
