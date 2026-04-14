/**
 * Print every user with their email + whether they have a password (credentials)
 * and which OAuth providers are linked. Useful when debugging sign-in
 * conflicts like "OAuthAccountNotLinked" — shows you the exact DB state.
 *
 * Usage:
 *   npx tsx scripts/list-users.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { config } from "dotenv";

neonConfig.webSocketConstructor = ws;
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing from .env.local");
  process.exit(1);
}
const adapter = new PrismaNeon({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      username: true,
      role: true,
      passwordHash: true,
      emailVerified: true,
      createdAt: true,
      accounts: {
        select: { provider: true, providerAccountId: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\n=== ${users.length} user(s) in DB ===\n`);

  for (const u of users) {
    const hasPassword = u.passwordHash ? "YES" : "no";
    const providers = u.accounts.map((a) => a.provider).join(", ") || "(none)";
    const verified = u.emailVerified ? "YES" : "no";

    console.log(`📧 ${u.email}`);
    console.log(`   id:        ${u.id}`);
    console.log(`   name:      ${u.name ?? "(null)"}`);
    console.log(`   username:  ${u.username ?? "(null)"}`);
    console.log(`   role:      ${u.role}`);
    console.log(`   password:  ${hasPassword}  | verified: ${verified}`);
    console.log(`   providers: ${providers}`);
    console.log(`   created:   ${u.createdAt.toISOString().slice(0, 10)}`);
    console.log();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
