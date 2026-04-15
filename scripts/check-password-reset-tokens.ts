import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

(async () => {
  const tokens = await prisma.passwordResetToken.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { identifier: true, token: true, expires: true, createdAt: true },
  });
  console.log(`Recent password reset tokens (${tokens.length}):`);
  for (const t of tokens) {
    console.log(
      `  ${t.identifier} | token=${t.token.slice(0, 20)}... | expires=${t.expires.toISOString()} | created=${t.createdAt.toISOString()}`,
    );
  }
  await prisma.$disconnect();
})();
