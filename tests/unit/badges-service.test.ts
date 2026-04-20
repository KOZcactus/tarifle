import { describe, expect, it, beforeEach, vi } from "vitest";

// Prisma + notifications hot-wire'ı sadece unit test kapsamında vi.mock ile
// swap ediyoruz. `vi.hoisted` şart çünkü `vi.mock` her şeyden önce koşuluyor;
// mock objelerinin de o ana kadar kurulu olması gerek. Bu olmadan ReferenceError
// ("Cannot access 'prismaMock' before initialization") fırlar.
const { prismaMock, notifyBadgeAwarded } = vi.hoisted(() => ({
  prismaMock: {
    userBadge: {
      create: vi.fn(),
      findUnique: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    variation: {
      findUnique: vi.fn(),
    },
    collection: {
      count: vi.fn(),
    },
  },
  notifyBadgeAwarded: vi.fn(() => Promise.resolve()),
}));

vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/notifications/service", () => ({ notifyBadgeAwarded }));

// Import AFTER mocks so module picks up mocked deps.
import {
  grantBadge,
  awardEmailVerifiedBadge,
  awardFirstVariationBadge,
  maybeAwardPopularBadge,
  maybeAwardCollectorBadge,
} from "@/lib/badges/service";

beforeEach(() => {
  // Full reset, any per-test stubbing lives in that test.
  for (const g of Object.values(prismaMock)) {
    for (const fn of Object.values(g)) vi.mocked(fn).mockReset();
  }
  notifyBadgeAwarded.mockReset();
  notifyBadgeAwarded.mockResolvedValue(undefined);
});

describe("grantBadge", () => {
  it("returns true on a fresh award and fires a notification", async () => {
    prismaMock.userBadge.create.mockResolvedValueOnce({ id: "b1" });

    const result = await grantBadge("user-1", "EMAIL_VERIFIED");

    expect(result).toBe(true);
    expect(prismaMock.userBadge.create).toHaveBeenCalledWith({
      data: { userId: "user-1", key: "EMAIL_VERIFIED" },
    });
    // Notification fires with the correct badge metadata (label + emoji from
    // BADGES config). It's fire-and-forget so we don't await it, here we
    // just assert it was kicked off with the right userId.
    expect(notifyBadgeAwarded).toHaveBeenCalledTimes(1);
    expect(notifyBadgeAwarded).toHaveBeenCalledWith(
      expect.objectContaining({ userId: "user-1" }),
    );
  });

  it("returns false and skips notification on duplicate (P2002)", async () => {
    const dupErr = Object.assign(new Error("dup"), { code: "P2002" });
    prismaMock.userBadge.create.mockRejectedValueOnce(dupErr);

    const result = await grantBadge("user-1", "EMAIL_VERIFIED");

    expect(result).toBe(false);
    expect(notifyBadgeAwarded).not.toHaveBeenCalled();
  });

  it("re-throws unexpected Prisma errors", async () => {
    const dbErr = Object.assign(new Error("connection lost"), { code: "P1001" });
    prismaMock.userBadge.create.mockRejectedValueOnce(dbErr);

    await expect(grantBadge("user-1", "EMAIL_VERIFIED")).rejects.toThrow(
      "connection lost",
    );
    expect(notifyBadgeAwarded).not.toHaveBeenCalled();
  });
});

describe("awardEmailVerifiedBadge", () => {
  it("is a no-op when user cannot be resolved by email", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce(null);

    await awardEmailVerifiedBadge("ghost@tarifle.app");

    expect(prismaMock.userBadge.create).not.toHaveBeenCalled();
    expect(notifyBadgeAwarded).not.toHaveBeenCalled();
  });

  it("grants the badge when the user is found", async () => {
    prismaMock.user.findUnique.mockResolvedValueOnce({ id: "user-xyz" });
    prismaMock.userBadge.create.mockResolvedValueOnce({ id: "b1" });

    await awardEmailVerifiedBadge("found@tarifle.app");

    expect(prismaMock.userBadge.create).toHaveBeenCalledWith({
      data: { userId: "user-xyz", key: "EMAIL_VERIFIED" },
    });
  });
});

describe("awardFirstVariationBadge", () => {
  it("no-ops when the user already has the badge", async () => {
    prismaMock.userBadge.findUnique.mockResolvedValueOnce({ id: "existing" });

    await awardFirstVariationBadge("user-1");

    expect(prismaMock.userBadge.create).not.toHaveBeenCalled();
  });

  it("creates the badge on the first variation", async () => {
    prismaMock.userBadge.findUnique.mockResolvedValueOnce(null);
    prismaMock.userBadge.create.mockResolvedValueOnce({ id: "b1" });

    await awardFirstVariationBadge("user-1");

    expect(prismaMock.userBadge.create).toHaveBeenCalledWith({
      data: { userId: "user-1", key: "FIRST_VARIATION" },
    });
  });
});

describe("maybeAwardPopularBadge", () => {
  it("does nothing when variation is missing", async () => {
    prismaMock.variation.findUnique.mockResolvedValueOnce(null);

    await maybeAwardPopularBadge("var-1");

    expect(prismaMock.userBadge.create).not.toHaveBeenCalled();
  });

  it("does nothing below the like threshold (10)", async () => {
    prismaMock.variation.findUnique.mockResolvedValueOnce({
      authorId: "author-1",
      likeCount: 9,
    });

    await maybeAwardPopularBadge("var-1");

    expect(prismaMock.userBadge.create).not.toHaveBeenCalled();
  });

  it("awards at the like threshold", async () => {
    prismaMock.variation.findUnique.mockResolvedValueOnce({
      authorId: "author-1",
      likeCount: 10,
    });
    prismaMock.userBadge.create.mockResolvedValueOnce({ id: "b1" });

    await maybeAwardPopularBadge("var-1");

    expect(prismaMock.userBadge.create).toHaveBeenCalledWith({
      data: { userId: "author-1", key: "POPULAR_VARIATION" },
    });
  });
});

describe("maybeAwardCollectorBadge", () => {
  it("does nothing below 5 collections", async () => {
    prismaMock.collection.count.mockResolvedValueOnce(4);

    await maybeAwardCollectorBadge("user-1");

    expect(prismaMock.userBadge.create).not.toHaveBeenCalled();
  });

  it("awards at 5 collections", async () => {
    prismaMock.collection.count.mockResolvedValueOnce(5);
    prismaMock.userBadge.create.mockResolvedValueOnce({ id: "b1" });

    await maybeAwardCollectorBadge("user-1");

    expect(prismaMock.userBadge.create).toHaveBeenCalledWith({
      data: { userId: "user-1", key: "RECIPE_COLLECTOR" },
    });
  });

  it("still awards beyond 5 (idempotent path, P2002 handled by grantBadge)", async () => {
    prismaMock.collection.count.mockResolvedValueOnce(17);
    // Duplicate error exercises the idempotent path; service should not throw.
    prismaMock.userBadge.create.mockRejectedValueOnce(
      Object.assign(new Error("dup"), { code: "P2002" }),
    );

    await expect(maybeAwardCollectorBadge("user-1")).resolves.toBeUndefined();
  });
});
