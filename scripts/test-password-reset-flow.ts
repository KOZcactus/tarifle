/**
 * Integration smoke for the password-reset flow. Creates a throwaway user,
 * issues a token via the email helper, then consumes it and verifies the
 * passwordHash changed. Cleans up everything at the end.
 *
 * Does NOT go through the HTTP layer, unit tests cover validator shape and
 * this script covers the DB transaction side. UI rendering is verified by
 * preview snapshot.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "node:path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = `reset-smoke-${Date.now()}@tarifle.test`;
  const username = `smoke${Date.now().toString().slice(-8)}`;
  const originalHash = await bcrypt.hash("oldPassword123", 12);

  const user = await prisma.user.create({
    data: {
      email,
      username,
      name: "Smoke Test",
      passwordHash: originalHash,
      kvkkAccepted: true,
      kvkkVersion: "1.0",
      kvkkDate: new Date(),
    },
    select: { id: true, passwordHash: true },
  });
  console.log(`→ created test user id=${user.id} email=${email}`);

  // Dynamic import so the helper reads env after dotenv loaded.
  const { sendPasswordResetEmail, consumePasswordResetToken } = await import(
    "../src/lib/email/password-reset"
  );

  // Send, also creates a token row. We intercept the token by reading DB
  // after the send; the send itself will hit Resend/console provider which
  // is fine for this test (nobody's inbox owns @tarifle.test).
  const sendResult = await sendPasswordResetEmail(email, "Smoke");
  console.log(`→ send result: ${JSON.stringify(sendResult)}`);

  const tokenRow = await prisma.passwordResetToken.findFirst({
    where: { identifier: email },
    orderBy: { expires: "desc" },
  });
  if (!tokenRow) throw new Error("expected a token row");
  console.log(`→ token present, expires=${tokenRow.expires.toISOString()}`);

  // Consume with a new hash.
  const newHash = await bcrypt.hash("brandNewPass456", 12);
  const consumed = await consumePasswordResetToken(tokenRow.token, newHash);
  console.log(`→ consume result: ${JSON.stringify(consumed)}`);
  if (!consumed.success) throw new Error("consume failed");

  // Verify passwordHash updated.
  const after = await prisma.user.findUnique({
    where: { id: user.id },
    select: { passwordHash: true },
  });
  if (!after?.passwordHash) throw new Error("passwordHash missing after consume");
  if (after.passwordHash === originalHash)
    throw new Error("passwordHash did not change");
  const matchesNew = await bcrypt.compare("brandNewPass456", after.passwordHash);
  if (!matchesNew) throw new Error("new password does not verify");
  console.log("→ passwordHash updated, verifies against new password");

  // Second consume of the same token must fail (wiped on success).
  const secondConsume = await consumePasswordResetToken(tokenRow.token, newHash);
  if (secondConsume.success) throw new Error("token should be single-use");
  console.log(
    `→ second consume correctly denied: reason=${(secondConsume as { reason: string }).reason}`,
  );

  // Cleanup: delete test user. Tokens were already wiped by consume.
  await prisma.user.delete({ where: { id: user.id } });
  console.log("→ test user cleaned up");

  console.log("\n✅ password-reset flow smoke passed");
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ smoke failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
