/**
 * Hafif DB integrity audit, haftalık cron'un koşturduğu tek çekirdek.
 * scripts/audit-db-integrity.ts full script değil; sadece hızlı
 * count-based check'ler. Cron için tasarlandı, <3 sn tamamlanmalı.
 *
 * Findings kategorileri:
 *   - critical: orphan FK, duplicate email/username, moderation > 14 gün
 *   - warning: duplicate title > 10 group, PENDING > 7 gün, token cleanup
 *   - info: retention adayları, recipe count delta
 */
import { prisma } from "@/lib/prisma";

export type IntegritySeverity = "CRITICAL" | "WARNING" | "INFO";

export interface IntegrityFinding {
  severity: IntegritySeverity;
  category: string;
  message: string;
  value?: number;
}

export interface IntegrityReport {
  timestamp: string;
  totals: {
    recipes: number;
    users: number;
    variations: number;
    reviews: number;
  };
  findings: IntegrityFinding[];
  summary: {
    critical: number;
    warning: number;
    info: number;
  };
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Runs a fast, read-only integrity audit. Intended for cron monitoring,
 * not ad-hoc debugging (full script'te 10 kategori daha var).
 */
export async function runIntegrityAudit(): Promise<IntegrityReport> {
  const now = Date.now();

  const [
    recipes,
    users,
    variations,
    reviews,
    orphanRecipeAuthorsRaw,
    orphanModActionsRaw,
    orphanReportsRaw,
    dupEmailsRaw,
    dupUsernamesRaw,
    dupTitlesRaw,
    oldPendingVariations,
    oldPendingReviews,
    oldPendingReports,
    reportInconsistency,
    expiredVerifTokens,
    expiredResetTokens,
    expiredSessions,
  ] = await Promise.all([
    prisma.recipe.count(),
    prisma.user.count(),
    prisma.variation.count(),
    prisma.review.count(),
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM recipes r
      WHERE r."authorId" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM users u WHERE u.id = r."authorId")
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM moderation_actions ma
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = ma."moderatorId")
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM reports r
      WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.id = r."reporterId")
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM (
        SELECT LOWER(email) FROM users GROUP BY LOWER(email) HAVING COUNT(*) > 1
      ) dup
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM (
        SELECT LOWER(username) FROM users GROUP BY LOWER(username) HAVING COUNT(*) > 1
      ) dup
    `,
    prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) AS count FROM (
        SELECT LOWER(title) FROM recipes GROUP BY LOWER(title) HAVING COUNT(*) > 1
      ) dup
    `,
    prisma.variation.count({
      where: { status: "PENDING_REVIEW", createdAt: { lt: new Date(now - FOURTEEN_DAYS_MS) } },
    }),
    prisma.review.count({
      where: { status: "PENDING_REVIEW", createdAt: { lt: new Date(now - FOURTEEN_DAYS_MS) } },
    }),
    prisma.report.count({
      where: { status: "PENDING", createdAt: { lt: new Date(now - SEVEN_DAYS_MS) } },
    }),
    prisma.report.count({
      where: { reviewedBy: { not: null }, status: "PENDING" },
    }),
    prisma.verificationToken.count({ where: { expires: { lt: new Date() } } }),
    prisma.passwordResetToken.count({ where: { expires: { lt: new Date() } } }),
    prisma.session.count({ where: { expires: { lt: new Date() } } }),
  ]);

  const findings: IntegrityFinding[] = [];

  const orphanRecipeAuthors = Number(orphanRecipeAuthorsRaw[0]?.count ?? 0);
  const orphanModActions = Number(orphanModActionsRaw[0]?.count ?? 0);
  const orphanReports = Number(orphanReportsRaw[0]?.count ?? 0);
  const dupEmails = Number(dupEmailsRaw[0]?.count ?? 0);
  const dupUsernames = Number(dupUsernamesRaw[0]?.count ?? 0);
  const dupTitles = Number(dupTitlesRaw[0]?.count ?? 0);

  if (orphanRecipeAuthors > 0) {
    findings.push({
      severity: "CRITICAL",
      category: "orphan-fk",
      message: `${orphanRecipeAuthors} recipes point to deleted users via authorId`,
      value: orphanRecipeAuthors,
    });
  }
  if (orphanModActions > 0) {
    findings.push({
      severity: "CRITICAL",
      category: "orphan-fk",
      message: `${orphanModActions} moderation_actions rows point to deleted moderator`,
      value: orphanModActions,
    });
  }
  if (orphanReports > 0) {
    findings.push({
      severity: "CRITICAL",
      category: "orphan-fk",
      message: `${orphanReports} reports rows point to deleted reporter`,
      value: orphanReports,
    });
  }
  if (dupEmails > 0) {
    findings.push({
      severity: "CRITICAL",
      category: "duplicate-email",
      message: `${dupEmails} duplicate user emails (case-insensitive) detected`,
      value: dupEmails,
    });
  }
  if (dupUsernames > 0) {
    findings.push({
      severity: "CRITICAL",
      category: "duplicate-username",
      message: `${dupUsernames} duplicate usernames (case-insensitive) detected`,
      value: dupUsernames,
    });
  }
  if (oldPendingVariations > 0) {
    findings.push({
      severity: "CRITICAL",
      category: "moderation-stale",
      message: `${oldPendingVariations} variations in PENDING_REVIEW for 14+ days`,
      value: oldPendingVariations,
    });
  }
  if (oldPendingReviews > 0) {
    findings.push({
      severity: "CRITICAL",
      category: "moderation-stale",
      message: `${oldPendingReviews} reviews in PENDING_REVIEW for 14+ days`,
      value: oldPendingReviews,
    });
  }

  if (dupTitles > 10) {
    findings.push({
      severity: "WARNING",
      category: "duplicate-title",
      message: `${dupTitles} recipe title groups duplicate (case-insensitive)`,
      value: dupTitles,
    });
  }
  if (oldPendingReports > 0) {
    findings.push({
      severity: "WARNING",
      category: "report-backlog",
      message: `${oldPendingReports} reports unclosed for 7+ days`,
      value: oldPendingReports,
    });
  }
  if (reportInconsistency > 0) {
    findings.push({
      severity: "WARNING",
      category: "status-inconsistency",
      message: `${reportInconsistency} reports have reviewedBy but still PENDING status`,
      value: reportInconsistency,
    });
  }

  if (expiredVerifTokens > 500) {
    findings.push({
      severity: "INFO",
      category: "token-cleanup",
      message: `${expiredVerifTokens} expired verification tokens, prune candidate`,
      value: expiredVerifTokens,
    });
  }
  if (expiredResetTokens > 200) {
    findings.push({
      severity: "INFO",
      category: "token-cleanup",
      message: `${expiredResetTokens} expired password reset tokens, prune candidate`,
      value: expiredResetTokens,
    });
  }
  if (expiredSessions > 1000) {
    findings.push({
      severity: "INFO",
      category: "token-cleanup",
      message: `${expiredSessions} expired sessions, prune candidate`,
      value: expiredSessions,
    });
  }

  const summary = {
    critical: findings.filter((f) => f.severity === "CRITICAL").length,
    warning: findings.filter((f) => f.severity === "WARNING").length,
    info: findings.filter((f) => f.severity === "INFO").length,
  };

  return {
    timestamp: new Date(now).toISOString(),
    totals: { recipes, users, variations, reviews },
    findings,
    summary,
  };
}
