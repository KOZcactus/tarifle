import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import fs from "node:fs";

neonConfig.webSocketConstructor = ws;

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
  const data = JSON.parse(
    fs.readFileSync("docs/editorial-revisions-batch-4.json", "utf8"),
  );
  const slugs = data.map((d: { slug: string }) => d.slug);
  const found = await prisma.recipe.findMany({
    where: { slug: { in: slugs } },
    select: { slug: true },
  });
  const foundSet = new Set(found.map((f) => f.slug));
  const missing = slugs.filter((s: string) => !foundSet.has(s));
  console.log("Missing in prod:", missing);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
