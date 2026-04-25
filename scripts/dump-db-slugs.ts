/**
 * Quick dev tool: dumps all Recipe slugs from the connected DB to
 * /tmp/db-slugs.txt for diffing against source. Used once during
 * source duplicate cleanup verification.
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
  const recipes = await prisma.recipe.findMany({ select: { slug: true } });
  const slugs = recipes.map((r) => r.slug).sort();
  const out = process.argv[2] ?? "/tmp/db-slugs.txt";
  fs.writeFileSync(out, slugs.join("\n") + "\n");
  console.log(`db slug count: ${slugs.length} (written to ${out})`);
  await prisma.$disconnect();
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
