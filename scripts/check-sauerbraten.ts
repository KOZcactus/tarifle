import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function main() {
  const prisma = new PrismaClient({
    adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
  });
  const r = await prisma.recipe.findUnique({
    where: { slug: "sauerbraten" },
    select: {
      id: true,
      status: true,
      prepMinutes: true,
      cookMinutes: true,
      totalMinutes: true,
      _count: { select: { ingredients: true, steps: true } },
    },
  });
  console.log("found:", JSON.stringify(r, null, 2));
  await prisma.$disconnect();
}

main().catch(console.error);
