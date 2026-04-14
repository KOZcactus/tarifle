/**
 * Delete a user (and their cascading data — bookmarks, variations, collections,
 * shopping lists, badges, sessions, accounts) by email. Used once to clean up
 * a broken OAuth-only user whose Account row never got created because of a
 * misconfigured signIn callback.
 *
 * Usage:
 *   npx tsx scripts/delete-user.ts <email>
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { config } from "dotenv";

neonConfig.webSocketConstructor = ws;
config({ path: ".env.local" });

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx tsx scripts/delete-user.ts <email>");
  process.exit(1);
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL missing");
  process.exit(1);
}

const adapter = new PrismaNeon({ connectionString: url });
const prisma = new PrismaClient({ adapter });

async function main() {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      _count: {
        select: {
          bookmarks: true,
          variations: true,
          collections: true,
          shoppingLists: true,
          badges: true,
          accounts: true,
          sessions: true,
        },
      },
    },
  });

  if (!user) {
    console.log(`No user with email ${email}`);
    return;
  }

  console.log(`\nAbout to delete user:`);
  console.log(`  id:       ${user.id}`);
  console.log(`  email:    ${user.email}`);
  console.log(`  name:     ${user.name ?? "(null)"}`);
  console.log(`  username: ${user.username ?? "(null)"}`);
  console.log(`  counts:`);
  for (const [k, v] of Object.entries(user._count)) {
    console.log(`    ${k}: ${v}`);
  }
  console.log();

  await prisma.user.delete({ where: { id: user.id } });
  console.log(`✅ Deleted user ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
