/**
 * Tarifle DB sistem-sağlık audit'i. audit-db-quality.ts içerik kalitesi
 * (isFeatured, nutrition, tipNote vs), audit-content.ts + audit-deep.ts
 * tarif seviyesi (ingredient/step/slug) denetler; bu script onların dışında
 * kalan **operational + FK integrity + moderation backlog** kategorilerini
 * kapsar:
 *
 *   1. Orphan records (FK referans var, target kayıt yok)
 *   2. Duplicate detection (case-insensitive title, email, username)
 *   3. Status distribution (Recipe/Variation/Review tablo bazlı)
 *   4. Translations coverage gap (Mod A title+desc vs Mod B ingredients+steps)
 *   5. Moderation backlog yaşı (PENDING_REVIEW 7+ gün bekleyen)
 *   6. Unclosed reports + notification backlog
 *   7. Expired token temizliği (VerificationToken/PasswordResetToken)
 *   8. Log tablo retention (AuditLog, SearchQuery, RecipeViewDaily eski kayıt)
 *   9. Orphan user artifacts (suspended/deleted user + user_id cascade)
 *  10. Postgres operational: table size, dead tuple oranı, unused index
 *
 * Çalıştırma (read-only, destructive değil):
 *   npx tsx scripts/audit-db-integrity.ts
 *
 * Flags:
 *   --json   Bulguları JSON olarak stdout'a bas (pipe için)
 *   --prod   Prod branch hedefliyor; `assertDbTarget` ile --confirm-prod ister
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { detectDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type Severity = "CRITICAL" | "WARNING" | "INFO";
interface Finding {
  severity: Severity;
  category: string;
  message: string;
  sampleIds?: string[];
}

const findings: Finding[] = [];
const flagJson = process.argv.includes("--json");

function report(severity: Severity, category: string, message: string, sampleIds?: string[]): void {
  findings.push({ severity, category, message, sampleIds });
}
function header(title: string): void {
  if (flagJson) return;
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  ${title}`);
  console.log("=".repeat(60));
}
function log(msg: string): void {
  if (!flagJson) console.log(msg);
}

async function main(): Promise<void> {
  const target = detectDbTarget(process.env.DATABASE_URL);
  log(`\nTarifle DB Integrity + Operational Audit`);
  log(`Branch: ${target.branch} (${target.host})`);
  log(`Timestamp: ${new Date().toISOString()}`);

  // ─── 1. Orphan records ─────────────────────────────────
  header("1. Orphan Records (FK integrity)");

  // Recipe.authorId → User (nullable, SetNull beklenir)
  const orphanRecipeAuthors: Array<{ id: string; slug: string }> = await prisma.$queryRaw`
    SELECT r.id, r.slug
    FROM recipes r
    WHERE r."authorId" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = r."authorId")
    LIMIT 10
  `;
  log(`  Recipe.authorId orphan: ${orphanRecipeAuthors.length}${orphanRecipeAuthors.length === 10 ? "+" : ""}`);
  if (orphanRecipeAuthors.length > 0) {
    report("CRITICAL", "orphan-fk", `${orphanRecipeAuthors.length}+ recipes point to deleted users via authorId`, orphanRecipeAuthors.map((r) => r.slug));
  }

  // AuditLog.userId → User (nullable)
  const orphanAuditLogs: Array<{ count: bigint }> = await prisma.$queryRaw`
    SELECT COUNT(*) AS count
    FROM audit_log a
    WHERE a."userId" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = a."userId")
  `;
  const auditOrphanCount = Number(orphanAuditLogs[0]?.count ?? 0);
  log(`  AuditLog.userId orphan: ${auditOrphanCount}`);
  if (auditOrphanCount > 0) {
    report("WARNING", "orphan-fk", `${auditOrphanCount} audit_log rows have userId pointing to deleted users`);
  }

  // MediaAsset.uploaderId → User (nullable)
  const orphanMedia: Array<{ count: bigint }> = await prisma.$queryRaw`
    SELECT COUNT(*) AS count
    FROM media_assets m
    WHERE m."uploaderId" IS NOT NULL
      AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = m."uploaderId")
  `;
  const mediaOrphanCount = Number(orphanMedia[0]?.count ?? 0);
  log(`  MediaAsset.uploaderId orphan: ${mediaOrphanCount}`);
  if (mediaOrphanCount > 0) {
    report("WARNING", "orphan-fk", `${mediaOrphanCount} media_assets rows have uploaderId pointing to deleted users`);
  }

  // ModerationAction.moderatorId → User (required FK, cascade yok, Restrict tarzı)
  const orphanModActions: Array<{ count: bigint }> = await prisma.$queryRaw`
    SELECT COUNT(*) AS count
    FROM moderation_actions ma
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ma."moderatorId")
  `;
  const modActionOrphanCount = Number(orphanModActions[0]?.count ?? 0);
  log(`  ModerationAction.moderatorId orphan: ${modActionOrphanCount}`);
  if (modActionOrphanCount > 0) {
    report("CRITICAL", "orphan-fk", `${modActionOrphanCount} moderation_actions rows point to deleted moderator`);
  }

  // Report.reporterId → User
  const orphanReports: Array<{ count: bigint }> = await prisma.$queryRaw`
    SELECT COUNT(*) AS count
    FROM reports r
    WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = r."reporterId")
  `;
  const reportOrphanCount = Number(orphanReports[0]?.count ?? 0);
  log(`  Report.reporterId orphan: ${reportOrphanCount}`);
  if (reportOrphanCount > 0) {
    report("CRITICAL", "orphan-fk", `${reportOrphanCount} reports rows point to deleted reporter`);
  }

  // Report.targetId dangling (targetType = VARIATION/COMMENT/REVIEW; no FK constraint, polymorphic)
  const danglingVariationReports: Array<{ count: bigint }> = await prisma.$queryRaw`
    SELECT COUNT(*) AS count
    FROM reports r
    WHERE r."targetType" = 'VARIATION'
      AND NOT EXISTS (SELECT 1 FROM variations v WHERE v.id = r."targetId")
  `;
  const danglingReviewReports: Array<{ count: bigint }> = await prisma.$queryRaw`
    SELECT COUNT(*) AS count
    FROM reports r
    WHERE r."targetType" = 'REVIEW'
      AND NOT EXISTS (SELECT 1 FROM reviews rv WHERE rv.id = r."targetId")
  `;
  const danglingVar = Number(danglingVariationReports[0]?.count ?? 0);
  const danglingRev = Number(danglingReviewReports[0]?.count ?? 0);
  log(`  Report.targetId dangling (variation): ${danglingVar}`);
  log(`  Report.targetId dangling (review): ${danglingRev}`);
  if (danglingVar > 0) report("WARNING", "dangling-polymorphic-fk", `${danglingVar} VARIATION reports point to deleted variations`);
  if (danglingRev > 0) report("WARNING", "dangling-polymorphic-fk", `${danglingRev} REVIEW reports point to deleted reviews`);

  // ─── 2. Duplicate detection ────────────────────────────
  header("2. Duplicates (case-insensitive)");

  const dupRecipeTitles: Array<{ title_lower: string; count: bigint; slugs: string[] }> = await prisma.$queryRaw`
    SELECT LOWER(title) AS title_lower, COUNT(*) AS count, ARRAY_AGG(slug) AS slugs
    FROM recipes
    GROUP BY LOWER(title)
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
    LIMIT 20
  `;
  log(`  Recipe title duplicates (case-insensitive): ${dupRecipeTitles.length}${dupRecipeTitles.length === 20 ? "+" : ""}`);
  for (const d of dupRecipeTitles.slice(0, 5)) {
    log(`    - "${d.title_lower}" × ${Number(d.count)}: [${d.slugs.join(", ")}]`);
  }
  if (dupRecipeTitles.length > 0) {
    report("WARNING", "duplicate-title", `${dupRecipeTitles.length}+ recipe titles repeat case-insensitively`, dupRecipeTitles.slice(0, 5).map((d) => d.slugs.join("|")));
  }

  // User email case-insensitive duplicate (normalizeEmail sonrası hiç olmamalı)
  const dupEmails: Array<{ email_lower: string; count: bigint }> = await prisma.$queryRaw`
    SELECT LOWER(email) AS email_lower, COUNT(*) AS count
    FROM users
    GROUP BY LOWER(email)
    HAVING COUNT(*) > 1
    LIMIT 10
  `;
  log(`  User email duplicates (case-insensitive): ${dupEmails.length}`);
  if (dupEmails.length > 0) {
    report("CRITICAL", "duplicate-email", `${dupEmails.length} duplicate user emails (case-insensitive) detected`);
  }

  // User username
  const dupUsernames: Array<{ username_lower: string; count: bigint }> = await prisma.$queryRaw`
    SELECT LOWER(username) AS username_lower, COUNT(*) AS count
    FROM users
    GROUP BY LOWER(username)
    HAVING COUNT(*) > 1
    LIMIT 10
  `;
  log(`  Username duplicates (case-insensitive): ${dupUsernames.length}`);
  if (dupUsernames.length > 0) {
    report("CRITICAL", "duplicate-username", `${dupUsernames.length} duplicate usernames (case-insensitive) detected`);
  }

  // ─── 3. Status distribution ───────────────────────────
  header("3. Status Distribution");
  const recipeStatus = await prisma.recipe.groupBy({
    by: ["status"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  log("  Recipe.status:");
  for (const s of recipeStatus) log(`    ${s.status.padEnd(16)} ${s._count.id}`);

  const variationStatus = await prisma.variation.groupBy({
    by: ["status"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  log("  Variation.status:");
  for (const s of variationStatus) log(`    ${s.status.padEnd(16)} ${s._count.id}`);

  const reviewStatus = await prisma.review.groupBy({
    by: ["status"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
  });
  log("  Review.status:");
  for (const s of reviewStatus) log(`    ${s.status.padEnd(16)} ${s._count.id}`);

  const photoStatus = await prisma.recipePhoto.groupBy({
    by: ["status"],
    _count: { id: true },
  });
  log("  RecipePhoto.status:");
  for (const s of photoStatus) log(`    ${s.status.padEnd(16)} ${s._count.id}`);

  // ─── 4. Translations coverage ─────────────────────────
  header("4. Translations Coverage (Mod A vs Mod B gap)");
  const recipes: Array<{ id: string; slug: string; translations: unknown }> = await prisma.recipe.findMany({
    select: { id: true, slug: true, translations: true },
  });
  let modAOnly = 0;
  let modBComplete = 0;
  let noneBoth = 0;
  let partialEn = 0;
  let partialDe = 0;
  const incompleteSamples: string[] = [];

  for (const r of recipes) {
    const t = r.translations as {
      en?: { title?: string; description?: string; ingredients?: unknown[]; steps?: unknown[] };
      de?: { title?: string; description?: string; ingredients?: unknown[]; steps?: unknown[] };
    } | null;
    if (!t) {
      noneBoth++;
      continue;
    }
    const enHasTitle = !!t.en?.title;
    const enHasIng = Array.isArray(t.en?.ingredients) && (t.en.ingredients?.length ?? 0) > 0;
    const deHasTitle = !!t.de?.title;
    const deHasIng = Array.isArray(t.de?.ingredients) && (t.de.ingredients?.length ?? 0) > 0;

    if (!enHasTitle && !deHasTitle) {
      noneBoth++;
    } else if ((enHasTitle && !enHasIng) || (deHasTitle && !deHasIng)) {
      modAOnly++;
      if (enHasTitle && !enHasIng) partialEn++;
      if (deHasTitle && !deHasIng) partialDe++;
      if (incompleteSamples.length < 5) incompleteSamples.push(r.slug);
    } else if (enHasTitle && enHasIng && deHasTitle && deHasIng) {
      modBComplete++;
    }
  }
  log(`  Mod A only (title+desc only): ${modAOnly} (EN partial: ${partialEn}, DE partial: ${partialDe})`);
  log(`  Mod B complete (ingredients+steps): ${modBComplete}`);
  log(`  No translations: ${noneBoth}`);
  if (noneBoth > 0) {
    report("WARNING", "translations-gap", `${noneBoth} recipes have zero translations (both EN and DE NULL)`);
  }
  report("INFO", "translations-gap", `Mod B gap: ${modAOnly} recipes await ingredients+steps translation (EN: ${partialEn}, DE: ${partialDe})`);

  // ─── 5. Moderation backlog yaşı ───────────────────────
  header("5. Moderation Backlog Age");
  const now = Date.now();
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

  const oldPendingVariations = await prisma.variation.findMany({
    where: { status: "PENDING_REVIEW", createdAt: { lt: new Date(now - sevenDaysMs) } },
    select: { id: true, miniTitle: true, createdAt: true },
    orderBy: { createdAt: "asc" },
    take: 10,
  });
  log(`  Variation PENDING_REVIEW > 7 days: ${oldPendingVariations.length}${oldPendingVariations.length === 10 ? "+" : ""}`);
  for (const v of oldPendingVariations.slice(0, 5)) {
    const ageDays = Math.floor((now - v.createdAt.getTime()) / (24 * 60 * 60 * 1000));
    log(`    - [${v.id}] "${v.miniTitle.slice(0, 40)}" ${ageDays}d`);
  }
  if (oldPendingVariations.length > 0) {
    report("WARNING", "moderation-backlog", `${oldPendingVariations.length}+ variations in PENDING_REVIEW queue for 7+ days`);
  }

  const oldPendingReviews = await prisma.review.count({
    where: { status: "PENDING_REVIEW", createdAt: { lt: new Date(now - sevenDaysMs) } },
  });
  log(`  Review PENDING_REVIEW > 7 days: ${oldPendingReviews}`);
  if (oldPendingReviews > 0) {
    report("WARNING", "moderation-backlog", `${oldPendingReviews} reviews in PENDING_REVIEW queue for 7+ days`);
  }

  // ─── 6. Unclosed reports + notification backlog ───────
  header("6. Unclosed Reports + Notifications");
  const pendingReports = await prisma.report.count({ where: { status: "PENDING" } });
  const oldPendingReports = await prisma.report.count({
    where: { status: "PENDING", createdAt: { lt: new Date(now - sevenDaysMs) } },
  });
  log(`  Report PENDING total: ${pendingReports}`);
  log(`  Report PENDING > 7 days: ${oldPendingReports}`);
  if (oldPendingReports > 0) {
    report("WARNING", "report-backlog", `${oldPendingReports} reports unclosed for 7+ days`);
  }

  // Report with reviewedBy set but status still PENDING (inconsistency)
  const reportInconsistency = await prisma.report.count({
    where: { reviewedBy: { not: null }, status: "PENDING" },
  });
  log(`  Report reviewedBy set but status PENDING: ${reportInconsistency}`);
  if (reportInconsistency > 0) {
    report("WARNING", "status-inconsistency", `${reportInconsistency} reports have reviewedBy but still PENDING status`);
  }

  const unreadNotifs = await prisma.notification.count({ where: { isRead: false } });
  const totalNotifs = await prisma.notification.count();
  log(`  Notifications unread: ${unreadNotifs} / ${totalNotifs}`);
  // User başına unread > 50 olanlar (spam potansiyeli)
  const heavyUsers: Array<{ user_id: string; count: bigint }> = await prisma.$queryRaw`
    SELECT "userId" AS user_id, COUNT(*) AS count
    FROM notifications
    WHERE "isRead" = false
    GROUP BY "userId"
    HAVING COUNT(*) > 50
    ORDER BY COUNT(*) DESC
    LIMIT 5
  `;
  log(`  Users with >50 unread notifications: ${heavyUsers.length}`);
  if (heavyUsers.length > 0) {
    report("INFO", "notification-backlog", `${heavyUsers.length} users have >50 unread notifications (possible UX issue)`);
  }

  // ─── 7. Expired tokens ─────────────────────────────────
  header("7. Expired Tokens");
  const expiredVerif = await prisma.verificationToken.count({
    where: { expires: { lt: new Date() } },
  });
  const expiredReset = await prisma.passwordResetToken.count({
    where: { expires: { lt: new Date() } },
  });
  const expiredSessions = await prisma.session.count({
    where: { expires: { lt: new Date() } },
  });
  log(`  VerificationToken expired: ${expiredVerif}`);
  log(`  PasswordResetToken expired: ${expiredReset}`);
  log(`  Session expired: ${expiredSessions}`);
  if (expiredVerif > 100) report("INFO", "token-cleanup", `${expiredVerif} expired verification tokens, prune candidate`);
  if (expiredReset > 50) report("INFO", "token-cleanup", `${expiredReset} expired password reset tokens, prune candidate`);
  if (expiredSessions > 500) report("INFO", "token-cleanup", `${expiredSessions} expired sessions, prune candidate`);

  // ─── 8. Log tablo retention ────────────────────────────
  header("8. Log Table Retention");
  const ninetyDaysAgo = new Date(now - 90 * 24 * 60 * 60 * 1000);
  const oneEightyDaysAgo = new Date(now - 180 * 24 * 60 * 60 * 1000);

  const oldSearchQueries = await prisma.searchQuery.count({
    where: { createdAt: { lt: ninetyDaysAgo } },
  });
  const totalSearchQueries = await prisma.searchQuery.count();
  log(`  SearchQuery > 90 days: ${oldSearchQueries} / ${totalSearchQueries}`);
  if (oldSearchQueries > 1000) {
    report("INFO", "retention", `${oldSearchQueries} search_queries rows older than 90 days, prune policy pending`);
  }

  const oldViewDaily = await prisma.recipeViewDaily.count({
    where: { date: { lt: oneEightyDaysAgo } },
  });
  const totalViewDaily = await prisma.recipeViewDaily.count();
  log(`  RecipeViewDaily > 180 days: ${oldViewDaily} / ${totalViewDaily}`);
  if (oldViewDaily > 1000) {
    report("INFO", "retention", `${oldViewDaily} recipe_view_daily rows older than 180 days`);
  }

  const oldAuditLogs = await prisma.auditLog.count({
    where: { createdAt: { lt: oneEightyDaysAgo } },
  });
  const totalAuditLogs = await prisma.auditLog.count();
  log(`  AuditLog > 180 days: ${oldAuditLogs} / ${totalAuditLogs}`);

  // ─── 9. Suspended / deleted user artifacts ────────────
  header("9. User State Coherence");
  const suspendedUsers = await prisma.user.count({ where: { suspendedAt: { not: null } } });
  const softDeletedUsers = await prisma.user.count({ where: { deletedAt: { not: null } } });
  log(`  Suspended users (suspendedAt != null): ${suspendedUsers}`);
  log(`  Soft-deleted users (deletedAt != null): ${softDeletedUsers}`);

  // Soft-deleted user kayıt tutarlılığı: hâlâ Variation PUBLISHED yazıyorsa
  const softDeletedWithActive: Array<{ count: bigint }> = await prisma.$queryRaw`
    SELECT COUNT(*) AS count
    FROM users u
    WHERE u."deletedAt" IS NOT NULL
      AND EXISTS (SELECT 1 FROM variations v WHERE v."authorId" = u.id AND v.status = 'PUBLISHED')
  `;
  const softDeletedActive = Number(softDeletedWithActive[0]?.count ?? 0);
  if (softDeletedActive > 0) {
    log(`  Soft-deleted users with active PUBLISHED variations: ${softDeletedActive}`);
    report("WARNING", "user-state", `${softDeletedActive} soft-deleted users still have PUBLISHED variations`);
  }

  // ─── 10. Postgres operational ──────────────────────────
  header("10. Postgres Operational Health");

  // Table size, en büyük 15. relname pg_stat_user_tables'ta `name` tipi,
  // Prisma Neon adapter name'i deserialize edemiyor; ::text cast zorunlu.
  const tableSizes: Array<{
    table_name: string;
    total_size: string;
    total_bytes: bigint;
    row_estimate: bigint;
  }> = await prisma.$queryRaw`
    SELECT
      relname::text AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_total_relation_size(relid) AS total_bytes,
      n_live_tup AS row_estimate
    FROM pg_stat_user_tables
    ORDER BY pg_total_relation_size(relid) DESC
    LIMIT 15
  `;
  log("  Top 15 tables by size:");
  for (const t of tableSizes) {
    log(`    ${t.table_name.padEnd(32)} ${t.total_size.padStart(10)}  rows~${Number(t.row_estimate)}`);
  }

  // Dead tuple oranı, vacuum ihtiyacı
  const deadTuples: Array<{ table_name: string; dead: bigint; live: bigint; dead_pct: number }> = await prisma.$queryRaw`
    SELECT
      relname::text AS table_name,
      n_dead_tup AS dead,
      n_live_tup AS live,
      CASE WHEN n_live_tup > 0 THEN ROUND((n_dead_tup::numeric / n_live_tup) * 100, 1) ELSE 0 END AS dead_pct
    FROM pg_stat_user_tables
    WHERE n_dead_tup > 100
    ORDER BY (CASE WHEN n_live_tup > 0 THEN n_dead_tup::numeric / n_live_tup ELSE 0 END) DESC
    LIMIT 10
  `;
  log("\n  Tables with dead_tup > 100 (vacuum candidates):");
  for (const t of deadTuples) {
    const pct = Number(t.dead_pct);
    const flag = pct > 20 ? " <-- HIGH" : "";
    log(`    ${t.table_name.padEnd(32)} dead=${Number(t.dead)} live=${Number(t.live)} ${pct}%${flag}`);
    if (pct > 20) {
      report("WARNING", "vacuum-needed", `${t.table_name} has ${pct}% dead tuples (vacuum recommended)`);
    }
  }

  // Unused index (idx_scan = 0, schema public)
  const unusedIndexes: Array<{ index_name: string; table_name: string; size: string }> = await prisma.$queryRaw`
    SELECT
      indexrelname::text AS index_name,
      relname::text AS table_name,
      pg_size_pretty(pg_relation_size(indexrelid)) AS size
    FROM pg_stat_user_indexes
    WHERE idx_scan = 0
      AND schemaname = 'public'
      AND indexrelname::text NOT LIKE '%_pkey'
      AND indexrelname::text NOT LIKE '%_key'
    ORDER BY pg_relation_size(indexrelid) DESC
    LIMIT 15
  `;
  log(`\n  Unused indexes (idx_scan=0, non-PK/unique): ${unusedIndexes.length}${unusedIndexes.length === 15 ? "+" : ""}`);
  for (const i of unusedIndexes) {
    log(`    ${i.index_name.padEnd(50)} ${i.size.padStart(10)}  on ${i.table_name}`);
  }
  if (unusedIndexes.length > 5) {
    report("INFO", "unused-index", `${unusedIndexes.length}+ indexes never used since last stats reset, review for drop`);
  }

  // Table count summary
  log("");
  const counts = {
    users: await prisma.user.count(),
    recipes: await prisma.recipe.count(),
    variations: await prisma.variation.count(),
    reviews: await prisma.review.count(),
    bookmarks: await prisma.bookmark.count(),
    likes: await prisma.like.count(),
    collections: await prisma.collection.count(),
    notifications: totalNotifs,
    follows: await prisma.follow.count(),
    newsletterSubscriptions: await prisma.newsletterSubscription.count(),
  };
  log("  Row counts (sanity):");
  for (const [k, v] of Object.entries(counts)) log(`    ${k.padEnd(28)} ${v}`);

  // ─── Summary ───────────────────────────────────────────
  header("AUDIT SUMMARY");
  const criticals = findings.filter((f) => f.severity === "CRITICAL");
  const warnings = findings.filter((f) => f.severity === "WARNING");
  const infos = findings.filter((f) => f.severity === "INFO");

  if (flagJson) {
    console.log(JSON.stringify({ target, counts, findings }, null, 2));
  } else {
    if (criticals.length) {
      log("\n  CRITICAL:");
      for (const f of criticals) log(`    [${f.category}] ${f.message}`);
    }
    if (warnings.length) {
      log("\n  WARNING:");
      for (const f of warnings) log(`    [${f.category}] ${f.message}`);
    }
    if (infos.length) {
      log("\n  INFO:");
      for (const f of infos) log(`    [${f.category}] ${f.message}`);
    }
    log(`\n  Totals: ${criticals.length} CRITICAL, ${warnings.length} WARNING, ${infos.length} INFO\n`);
  }
}

main()
  .catch((err) => {
    console.error("Audit failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
