/**
 * One-off backfill: normalize all User.email values (trim + lowercase).
 *
 * Run when migrating an existing DB to the new email-normalized auth flow,
 * or after restoring data from an older snapshot.
 *
 * Usage: npx tsx scripts/normalize-emails.ts
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

async function main(): Promise<void> {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL gerekli");

  const adapter = new PrismaNeon({ connectionString });
  const prisma = new PrismaClient({ adapter });

  const users = await prisma.user.findMany({ select: { id: true, email: true } });
  let updated = 0;
  let conflicts = 0;

  for (const u of users) {
    const normalized = u.email.trim().toLowerCase();
    if (normalized === u.email) continue;

    const conflict = await prisma.user.findFirst({
      where: { email: normalized, id: { not: u.id } },
    });
    if (conflict) {
      console.warn(
        `CONFLICT: ${u.email} normalizes to existing account ${conflict.email} — manual merge needed`,
      );
      conflicts += 1;
      continue;
    }

    await prisma.user.update({ where: { id: u.id }, data: { email: normalized } });
    console.log(`updated ${u.email} -> ${normalized}`);
    updated += 1;
  }

  console.log(`\nDone. Updated: ${updated}, Conflicts: ${conflicts}, Total: ${users.length}`);
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
