import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import path from "node:path";

neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main() {
  const cols = await prisma.$queryRaw<{ column_name: string }[]>`
    SELECT column_name::text AS column_name FROM information_schema.columns
    WHERE table_name = 'users'
      AND column_name IN ('showChefScore','showActivity','showFollowCounts')
  `;
  console.log("cols:", cols.map((c) => c.column_name));
  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
