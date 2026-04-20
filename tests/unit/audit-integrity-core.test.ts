import { describe, expect, it, vi, beforeEach } from "vitest";

// Prisma'yı mock'lıyoruz, integrity core sadece count/raw çağrıları yapar
// → test'te DB bağımlılığı yok. Module path'e göre resolve ediliyor.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    recipe: { count: vi.fn() },
    user: { count: vi.fn() },
    variation: { count: vi.fn() },
    review: { count: vi.fn() },
    report: { count: vi.fn() },
    verificationToken: { count: vi.fn() },
    passwordResetToken: { count: vi.fn() },
    session: { count: vi.fn() },
    $queryRaw: vi.fn(),
  },
}));

import { runIntegrityAudit } from "@/lib/audit/integrity-core";
import { prisma } from "@/lib/prisma";

type MockedPrisma = {
  recipe: { count: ReturnType<typeof vi.fn> };
  user: { count: ReturnType<typeof vi.fn> };
  variation: { count: ReturnType<typeof vi.fn> };
  review: { count: ReturnType<typeof vi.fn> };
  report: { count: ReturnType<typeof vi.fn> };
  verificationToken: { count: ReturnType<typeof vi.fn> };
  passwordResetToken: { count: ReturnType<typeof vi.fn> };
  session: { count: ReturnType<typeof vi.fn> };
  $queryRaw: ReturnType<typeof vi.fn>;
};

const mocked = prisma as unknown as MockedPrisma;

function happyPath(): void {
  mocked.recipe.count.mockResolvedValue(2454);
  mocked.user.count.mockResolvedValue(10);
  // variation.count: 1st call total, 2nd call PENDING_REVIEW > 14d
  mocked.variation.count.mockResolvedValueOnce(7).mockResolvedValueOnce(0);
  // review.count: 1st total, 2nd PENDING_REVIEW > 14d
  mocked.review.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
  // report.count: 1st PENDING > 7d, 2nd reviewedBy+PENDING
  mocked.report.count.mockResolvedValue(0);
  mocked.verificationToken.count.mockResolvedValue(2);
  mocked.passwordResetToken.count.mockResolvedValue(0);
  mocked.session.count.mockResolvedValue(0);
  mocked.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("runIntegrityAudit", () => {
  it("happy path, 0 critical, healthy DB", async () => {
    happyPath();
    const report = await runIntegrityAudit();
    expect(report.summary.critical).toBe(0);
    expect(report.summary.warning).toBe(0);
    expect(report.totals.recipes).toBe(2454);
    expect(report.totals.users).toBe(10);
    expect(report.findings.length).toBe(0);
  });

  it("orphan recipe authors flag CRITICAL", async () => {
    happyPath();
    // First $queryRaw call is orphan Recipe.authorId; return 5 orphans
    mocked.$queryRaw.mockImplementation((strings: TemplateStringsArray) => {
      const query = String(strings.raw[0] ?? "");
      if (query.includes("recipes r") && query.includes("authorId")) {
        return Promise.resolve([{ count: BigInt(5) }]);
      }
      return Promise.resolve([{ count: BigInt(0) }]);
    });
    const report = await runIntegrityAudit();
    expect(report.summary.critical).toBeGreaterThanOrEqual(1);
    const finding = report.findings.find((f) => f.category === "orphan-fk");
    expect(finding).toBeDefined();
    expect(finding?.value).toBe(5);
  });

  it("duplicate emails → CRITICAL", async () => {
    happyPath();
    mocked.$queryRaw.mockImplementation((strings: TemplateStringsArray) => {
      const query = String(strings.raw[0] ?? "");
      if (query.includes("LOWER(email)")) {
        return Promise.resolve([{ count: BigInt(2) }]);
      }
      return Promise.resolve([{ count: BigInt(0) }]);
    });
    const report = await runIntegrityAudit();
    const finding = report.findings.find((f) => f.category === "duplicate-email");
    expect(finding?.severity).toBe("CRITICAL");
    expect(finding?.value).toBe(2);
  });

  it("14+ gün PENDING_REVIEW variation CRITICAL", async () => {
    // happyPath çağırmıyoruz çünkü variation.count zincirini override etmek
    // mockResolvedValueOnce ile sorunlu. Manuel kurulum:
    mocked.recipe.count.mockResolvedValue(2454);
    mocked.user.count.mockResolvedValue(10);
    mocked.variation.count
      .mockResolvedValueOnce(7) // total
      .mockResolvedValueOnce(3); // PENDING > 14d
    mocked.review.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
    mocked.report.count.mockResolvedValue(0);
    mocked.verificationToken.count.mockResolvedValue(0);
    mocked.passwordResetToken.count.mockResolvedValue(0);
    mocked.session.count.mockResolvedValue(0);
    mocked.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);

    const report = await runIntegrityAudit();
    const finding = report.findings.find(
      (f) => f.category === "moderation-stale" && f.message.includes("variations"),
    );
    expect(finding?.severity).toBe("CRITICAL");
    expect(finding?.value).toBe(3);
  });

  it("duplicate title > 10 WARNING, <=10 yok", async () => {
    happyPath();
    mocked.$queryRaw.mockImplementation((strings: TemplateStringsArray) => {
      const query = String(strings.raw[0] ?? "");
      if (query.includes("LOWER(title)")) {
        return Promise.resolve([{ count: BigInt(15) }]);
      }
      return Promise.resolve([{ count: BigInt(0) }]);
    });
    const report = await runIntegrityAudit();
    const finding = report.findings.find((f) => f.category === "duplicate-title");
    expect(finding?.severity).toBe("WARNING");
    expect(finding?.value).toBe(15);
  });

  it("expired tokens > 500 INFO", async () => {
    happyPath();
    mocked.verificationToken.count.mockResolvedValue(750);
    const report = await runIntegrityAudit();
    const finding = report.findings.find(
      (f) => f.category === "token-cleanup" && f.message.includes("verification"),
    );
    expect(finding?.severity).toBe("INFO");
    expect(finding?.value).toBe(750);
  });

  it("report reviewedBy+PENDING WARNING inconsistency", async () => {
    mocked.recipe.count.mockResolvedValue(2454);
    mocked.user.count.mockResolvedValue(10);
    mocked.variation.count.mockResolvedValueOnce(7).mockResolvedValueOnce(0);
    mocked.review.count.mockResolvedValueOnce(3).mockResolvedValueOnce(0);
    mocked.report.count
      .mockResolvedValueOnce(0) // PENDING > 7 gün
      .mockResolvedValueOnce(4); // reviewedBy set + PENDING
    mocked.verificationToken.count.mockResolvedValue(0);
    mocked.passwordResetToken.count.mockResolvedValue(0);
    mocked.session.count.mockResolvedValue(0);
    mocked.$queryRaw.mockResolvedValue([{ count: BigInt(0) }]);

    const report = await runIntegrityAudit();
    const finding = report.findings.find((f) => f.category === "status-inconsistency");
    expect(finding?.severity).toBe("WARNING");
    expect(finding?.value).toBe(4);
  });

  it("report output timestamp ISO format", async () => {
    happyPath();
    const report = await runIntegrityAudit();
    expect(report.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});
