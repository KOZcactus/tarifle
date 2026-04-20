/**
 * E2E test user cascade silme. name='E2E TestUser' ve username "e2e"
 * prefix'li kullanıcıları bulur, cascade silme için önce manuel FK olan
 * kayıtları temizler (Variation, ModerationAction, Report), sonra User'ı
 * siler (User cascade: Bookmark, Like, Collection, ShoppingList, Session,
 * Account, Notification, UserBadge, Follow, Review, MealPlan otomatik
 * siliniyor; AuditLog + RecipePhoto + NewsletterSubscription SetNull).
 *
 * Usage:
 *   npx tsx scripts/delete-e2e-test-users.ts              # dry-run
 *   npx tsx scripts/delete-e2e-test-users.ts --apply      # dev
 *   DATABASE_URL=<prod> npx tsx scripts/delete-e2e-test-users.ts --apply --confirm-prod
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
const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }),
});

const APPLY = process.argv.includes("--apply");

async function main(): Promise<void> {
  if (APPLY) assertDbTarget("delete-e2e-test-users");

  const users = await prisma.user.findMany({
    where: {
      OR: [
        { name: "E2E TestUser" },
        { username: { startsWith: "e2e" } },
      ],
    },
    select: {
      id: true,
      username: true,
      name: true,
      email: true,
      _count: {
        select: {
          variations: true,
          bookmarks: true,
          likes: true,
          reviews: true,
          collections: true,
          notifications: true,
          badges: true,
          reports: true,
          moderationActions: true,
        },
      },
    },
  });

  console.log(`📋 ${users.length} E2E test user tespit edildi\n`);

  if (users.length === 0) {
    console.log("Hiç E2E test user yok, atlanıyor.");
    return;
  }

  for (const u of users) {
    console.log(
      `  ${u.username} (${u.name ?? "-"}) refs: var=${u._count.variations}, bm=${u._count.bookmarks}, rev=${u._count.reviews}, rep=${u._count.reports}, mod=${u._count.moderationActions}`,
    );
  }

  if (!APPLY) {
    console.log("\n(dry-run, --apply ile silinir)");
    return;
  }

  const userIds = users.map((u) => u.id);

  // Manuel FK cascade (schema.prisma'da cascade yok olanlar):
  // 1. Variation.authorId (no cascade) → önce sil
  const delVar = await prisma.variation.deleteMany({
    where: { authorId: { in: userIds } },
  });
  console.log(`\n  Variations silindi: ${delVar.count}`);

  // 2. ModerationAction.moderatorId (no cascade) → sil
  const delMod = await prisma.moderationAction.deleteMany({
    where: { moderatorId: { in: userIds } },
  });
  console.log(`  ModerationActions silindi: ${delMod.count}`);

  // 3. Report.reporterId (no cascade) → sil
  const delRep = await prisma.report.deleteMany({
    where: { reporterId: { in: userIds } },
  });
  console.log(`  Reports silindi: ${delRep.count}`);

  // 4. User cascade: Bookmark/Like/Collection/ShoppingList/Session/Account/
  //    Notification/UserBadge/Follow/Review/MealPlan otomatik.
  //    AuditLog.userId SetNull, RecipePhoto.userId SetNull, NewsletterSubscription.userId SetNull.
  const delUser = await prisma.user.deleteMany({
    where: { id: { in: userIds } },
  });
  console.log(`  Users silindi: ${delUser.count}`);

  console.log(`\n✅ E2E test user cleanup tamam`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
