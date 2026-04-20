import { describe, expect, it, beforeEach, vi } from "vitest";

/**
 * Unit covers the consume path, token lookup, expiry check, happy-path
 * transaction, best-effort badge grant. sendVerificationEmail is skipped
 * here because it mostly builds HTML + deletes/creates tokens; a smoke
 * against the real email provider lives in the integration script set.
 */
const { prismaMock, awardEmailVerifiedBadge } = vi.hoisted(() => ({
  prismaMock: {
    verificationToken: {
      findUnique: vi.fn(),
      deleteMany: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      updateMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  awardEmailVerifiedBadge: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/badges/service", () => ({ awardEmailVerifiedBadge }));
// constants import is pure; no mock needed.

import { consumeVerificationToken } from "@/lib/email/verification";

beforeEach(() => {
  vi.mocked(prismaMock.verificationToken.findUnique).mockReset();
  vi.mocked(prismaMock.verificationToken.deleteMany).mockReset();
  vi.mocked(prismaMock.verificationToken.create).mockReset();
  vi.mocked(prismaMock.verificationToken.delete).mockReset();
  vi.mocked(prismaMock.user.updateMany).mockReset();
  vi.mocked(prismaMock.$transaction).mockReset();
  awardEmailVerifiedBadge.mockReset();
  awardEmailVerifiedBadge.mockResolvedValue(undefined);
});

describe("consumeVerificationToken", () => {
  it("returns not-found when the token does not exist", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce(null);

    const result = await consumeVerificationToken("bogus-token");

    expect(result).toEqual({ success: false, reason: "not-found" });
    // No writes when there's nothing to consume.
    expect(prismaMock.$transaction).not.toHaveBeenCalled();
    expect(prismaMock.verificationToken.delete).not.toHaveBeenCalled();
    expect(awardEmailVerifiedBadge).not.toHaveBeenCalled();
  });

  it("returns expired when the token is past its expiry and deletes the stale row", async () => {
    const pastExpiry = new Date(Date.now() - 60_000);
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce({
      identifier: "user@tarifle.app",
      token: "expired-token",
      expires: pastExpiry,
    });
    prismaMock.verificationToken.delete.mockResolvedValueOnce({});

    const result = await consumeVerificationToken("expired-token");

    expect(result).toEqual({ success: false, reason: "expired" });
    // Stale token is deleted so the user can request a fresh one without
    // the DB accumulating dead rows. deleteMany is not touched here; the
    // single-row .delete is intentionally narrow.
    expect(prismaMock.verificationToken.delete).toHaveBeenCalledWith({
      where: { token: "expired-token" },
    });
    expect(awardEmailVerifiedBadge).not.toHaveBeenCalled();
  });

  it("tolerates a failed cleanup delete on an expired token (swallowed .catch)", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce({
      identifier: "user@tarifle.app",
      token: "expired-token",
      expires: new Date(Date.now() - 1000),
    });
    prismaMock.verificationToken.delete.mockRejectedValueOnce(
      new Error("temp DB hiccup"),
    );

    // Even if the cleanup throws, we still want to tell the user the token
    // is expired rather than 500. The call site uses `.catch(() => {})`.
    const result = await consumeVerificationToken("expired-token");

    expect(result).toEqual({ success: false, reason: "expired" });
  });

  it("marks the user verified + deletes the token in a transaction on a valid token", async () => {
    const futureExpiry = new Date(Date.now() + 60 * 60_000);
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce({
      identifier: "new-user@tarifle.app",
      token: "good-token",
      expires: futureExpiry,
    });
    prismaMock.$transaction.mockResolvedValueOnce([{ count: 1 }, {}]);

    const result = await consumeVerificationToken("good-token");

    expect(result).toEqual({
      success: true,
      email: "new-user@tarifle.app",
    });
    // Transaction wraps BOTH writes, verifying the user AND deleting the
    // token, so a partial failure can't leave a verified user with a
    // still-live token or vice versa.
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1);
    const txArgs = prismaMock.$transaction.mock.calls[0]?.[0];
    expect(Array.isArray(txArgs)).toBe(true);
    expect(txArgs).toHaveLength(2);
    // Badge grant is fire-and-forget AFTER the tx, never blocks the return.
    expect(awardEmailVerifiedBadge).toHaveBeenCalledWith(
      "new-user@tarifle.app",
    );
  });

  it("does not fail the verification when the badge grant errors (best-effort)", async () => {
    prismaMock.verificationToken.findUnique.mockResolvedValueOnce({
      identifier: "user@tarifle.app",
      token: "good-token",
      expires: new Date(Date.now() + 60_000),
    });
    prismaMock.$transaction.mockResolvedValueOnce([{ count: 1 }, {}]);
    awardEmailVerifiedBadge.mockRejectedValueOnce(new Error("badges offline"));

    // Even with badges borked, the email-verify UX should succeed. We await
    // the promise but the fn returns before `.catch` fires because it's
    // wrapped; we just assert no throw bubbles out.
    const result = await consumeVerificationToken("good-token");
    expect(result.success).toBe(true);
  });
});
