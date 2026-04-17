/**
 * Promote a user to ADMIN role (or demote back to USER).
 *
 *   npx tsx scripts/set-admin.ts <email-or-username>                # dry run
 *   npx tsx scripts/set-admin.ts <email-or-username> --apply        # promote
 *   npx tsx scripts/set-admin.ts <email-or-username> --apply --demote  # revert
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

assertDbTarget("set-admin");

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const args = process.argv.slice(2);
const APPLY = args.includes("--apply");
const DEMOTE = args.includes("--demote");
const identifier = args.find((a) => !a.startsWith("--"));

async function main(): Promise<void> {
  if (!identifier) {
    console.error("Usage: npx tsx scripts/set-admin.ts <email-or-username> [--apply] [--demote]");
    process.exit(1);
  }

  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier.toLowerCase() },
      ],
    },
    select: { id: true, email: true, username: true, name: true, role: true },
  });

  if (!user) {
    console.error(`❌ User not found: "${identifier}"`);
    process.exit(1);
  }

  const newRole = DEMOTE ? "USER" : "ADMIN";
  console.log(
    `User: ${user.name ?? "-"} (@${user.username}, ${user.email})`,
  );
  console.log(`  Current role: ${user.role}`);
  console.log(`  Target role:  ${newRole}`);

  if (user.role === newRole) {
    console.log("  ✓ Already in target role — no change");
    return;
  }

  if (!APPLY) {
    console.log("\n(dry run — re-run with --apply to write)");
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { role: newRole },
  });
  console.log(`\n✅ ${user.username}: ${user.role} → ${newRole}`);
}

main()
  .catch((e) => {
    console.error("failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
