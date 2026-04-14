/**
 * E2E test fixtures that need a logged-in user. Creates a throwaway credentials
 * account via Prisma (bcrypt hashed), seeds any requested notifications, and
 * guarantees cleanup via deleteTestUser in afterAll. The ephemeral email uses
 * a timestamp + random suffix so collisions with real users are effectively
 * impossible, and the `@test.tarifle.local` host makes them easy to grep if
 * a cleanup ever leaks.
 *
 * IMPORTANT: These helpers touch the same Neon DB the dev server does. Run
 * them only against your dev branch — do NOT configure CI secrets to point
 * at production.
 */
import { PrismaClient, type NotificationType } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { config } from "dotenv";
import bcrypt from "bcryptjs";

neonConfig.webSocketConstructor = ws;
config({ path: ".env.local" });

let cachedClient: PrismaClient | null = null;

function getPrisma(): PrismaClient {
  if (cachedClient) return cachedClient;
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL missing — needed for E2E test helpers");
  }
  const adapter = new PrismaNeon({ connectionString: url });
  cachedClient = new PrismaClient({ adapter });
  return cachedClient;
}

export interface TestUserSeed {
  email: string;
  password: string;
  name: string;
  username: string;
  userId: string;
}

export interface TestNotificationSeed {
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  isRead?: boolean;
}

/**
 * Create a throwaway credentials user. Returns everything the test needs to
 * log in via the UI and make assertions against its DB records.
 */
export async function createTestUser(
  overrides: Partial<Pick<TestUserSeed, "email" | "password" | "name">> = {},
): Promise<TestUserSeed> {
  const prisma = getPrisma();

  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const email = overrides.email ?? `e2e-${stamp}@test.tarifle.local`;
  const password = overrides.password ?? "e2e-passw0rd";
  const name = overrides.name ?? "E2E TestUser";
  const username = `e2e${stamp.replace(/-/g, "").slice(0, 24)}`;
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: {
      email,
      name,
      username,
      passwordHash,
      emailVerified: new Date(),
      kvkkAccepted: true,
      kvkkVersion: "1.0",
      kvkkDate: new Date(),
    },
    select: { id: true },
  });

  return { email, password, name, username, userId: user.id };
}

/**
 * Seed notifications onto a test user. Returns nothing — callers typically
 * assert on counts or content via the UI and `getUnreadCount` below.
 */
export async function seedNotifications(
  userId: string,
  notifications: TestNotificationSeed[],
): Promise<void> {
  const prisma = getPrisma();
  await prisma.notification.createMany({
    data: notifications.map((n) => ({
      userId,
      type: n.type,
      title: n.title,
      body: n.body ?? null,
      link: n.link ?? null,
      isRead: n.isRead ?? false,
    })),
  });
}

/** Count unread notifications — used to assert persistence after mark-read. */
export async function getUnreadCount(userId: string): Promise<number> {
  const prisma = getPrisma();
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
}

/**
 * Delete a test user + cascading data. `User.onDelete: Cascade` on child
 * relations takes care of notifications, sessions, accounts. Swallows errors
 * so afterAll never throws and masks the real test failure.
 */
export async function deleteTestUser(userId: string): Promise<void> {
  const prisma = getPrisma();
  try {
    await prisma.user.delete({ where: { id: userId } });
  } catch (err) {
    // Already-gone is fine; anything else gets logged but doesn't fail teardown.
    console.warn("[e2e] deleteTestUser:", err);
  }
}

/** Tests only — close the shared Prisma client on teardown. */
export async function closeTestDb(): Promise<void> {
  if (cachedClient) {
    await cachedClient.$disconnect();
    cachedClient = null;
  }
}
