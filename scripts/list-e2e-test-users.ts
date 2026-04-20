/**
 * E2E test user listesi, read-only. name='E2E TestUser' veya username
 * "e2e..." prefix'li kullanıcıları bulur, referans sayılarını döker.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

async function main(): Promise<void> {
  const host = (() => {
    try { return new URL(process.env.DATABASE_URL ?? "").host; } catch { return "unknown"; }
  })();
  console.log(`List E2E test users, host: ${host}`);

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: "E2E TestUser" },
        { name: { contains: "E2E" } },
        { name: { contains: "TestUser" } },
        { email: { contains: "e2e" } },
        { email: { contains: "test" } },
        { username: { contains: "e2e" } },
        { username: { contains: "test" } },
      ],
    },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      role: true,
      createdAt: true,
      _count: {
        select: {
          variations: true,
          bookmarks: true,
          likes: true,
          reviews: true,
          collections: true,
          followers: true,
          following: true,
          notifications: true,
          recipePhotos: true,
          mealPlans: true,
          shoppingLists: true,
          badges: true,
          reports: true,
          auditLogs: true,
          moderationActions: true,
          newsletterSubscriptions: true,
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  console.log(`\nFound ${users.length} E2E test users\n`);
  let totalRefs = 0;
  for (const u of users) {
    const refs = Object.values(u._count).reduce((a, b) => a + b, 0);
    totalRefs += refs;
    const role = u.role === "USER" ? "USER" : `⚠️ ${u.role}`;
    const critical = Object.entries(u._count).filter(([, v]) => v > 0);
    console.log(
      `  ${u.username.padEnd(40)}  ${u.name ?? "-"}  ${role}  (${u.createdAt.toISOString().slice(0, 10)})`,
    );
    if (critical.length > 0) {
      for (const [k, v] of critical) {
        console.log(`     └─ ${k}: ${v}`);
      }
    }
  }
  console.log(`\nTotal refs across all E2E users: ${totalRefs}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
