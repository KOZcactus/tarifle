import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock Prisma, auth, rate-limit + revalidatePath before importing actions.
vi.mock("@/lib/prisma", () => ({
  prisma: {
    userPantryItem: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      upsert: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}));

const mockAuth = vi.fn();
vi.mock("@/lib/auth", () => ({ auth: (...args: unknown[]) => mockAuth(...args) }));

const mockCheckRateLimit = vi.fn();
const mockIdentifier = vi.fn(() => "test-user-id");
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: (...args: unknown[]) => mockCheckRateLimit(...args),
  rateLimitIdentifier: (...args: unknown[]) => mockIdentifier(...args),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import {
  addPantryItemAction,
  bulkAddPantryItemsAction,
  updatePantryItemAction,
  removePantryItemAction,
  getUserPantryAction,
} from "@/lib/actions/pantry";
import { prisma } from "@/lib/prisma";

type M<T extends (...a: unknown[]) => unknown> = ReturnType<typeof vi.fn>;
const pantryMock = prisma.userPantryItem as unknown as {
  findMany: M<typeof vi.fn>;
  findUnique: M<typeof vi.fn>;
  upsert: M<typeof vi.fn>;
  update: M<typeof vi.fn>;
  delete: M<typeof vi.fn>;
};

function rowFactory(overrides: Record<string, unknown> = {}) {
  return {
    id: "item-1",
    userId: "user-1",
    ingredientName: "tavuk göğsü",
    displayName: "Tavuk Göğsü",
    quantity: 500,
    unit: "gr",
    expiryDate: null,
    note: null,
    addedAt: new Date("2026-04-24T10:00:00Z"),
    updatedAt: new Date("2026-04-24T10:00:00Z"),
    ...overrides,
  };
}

describe("pantry actions (oturum 17)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCheckRateLimit.mockResolvedValue({ success: true });
  });

  describe("getUserPantryAction", () => {
    it("rejects anonymous user", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await getUserPantryAction();
      expect(res.success).toBe(false);
      expect(res.error).toBe("auth-required");
    });

    it("returns items sorted by expiry ascending", async () => {
      pantryMock.findMany.mockResolvedValue([
        rowFactory({ id: "a", expiryDate: new Date("2026-04-25") }),
        rowFactory({ id: "b", expiryDate: null }),
      ]);
      const res = await getUserPantryAction();
      expect(res.success).toBe(true);
      expect(res.data).toHaveLength(2);
      expect(res.data?.[0].id).toBe("a");
      expect(pantryMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: "user-1" },
        }),
      );
    });

    it("computes daysToExpiry correctly (0 for today)", async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      pantryMock.findMany.mockResolvedValue([
        rowFactory({ expiryDate: today }),
      ]);
      const res = await getUserPantryAction();
      expect(res.data?.[0].daysToExpiry).toBe(0);
    });

    it("null expiry returns null daysToExpiry", async () => {
      pantryMock.findMany.mockResolvedValue([rowFactory({ expiryDate: null })]);
      const res = await getUserPantryAction();
      expect(res.data?.[0].daysToExpiry).toBeNull();
    });
  });

  describe("addPantryItemAction", () => {
    it("normalizes ingredient name to lowercase TR", async () => {
      pantryMock.upsert.mockResolvedValue(
        rowFactory({ ingredientName: "tavuk göğsü", displayName: "Tavuk Göğsü" }),
      );
      const res = await addPantryItemAction({
        name: "Tavuk Göğsü",
        quantity: 500,
        unit: "gr",
      });
      expect(res.success).toBe(true);
      expect(pantryMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId_ingredientName: {
              userId: "user-1",
              ingredientName: "tavuk göğsü",
            },
          },
        }),
      );
    });

    it("rejects invalid quantity", async () => {
      const res = await addPantryItemAction({
        name: "tavuk",
        quantity: -5,
      });
      expect(res.success).toBe(false);
    });

    it("rejects empty name", async () => {
      const res = await addPantryItemAction({ name: "" });
      expect(res.success).toBe(false);
    });

    it("rate limit blocks when exceeded", async () => {
      mockCheckRateLimit.mockResolvedValue({
        success: false,
        message: "Çok fazla istek.",
      });
      const res = await addPantryItemAction({ name: "tavuk" });
      expect(res.success).toBe(false);
      expect(res.error).toBe("Çok fazla istek.");
    });
  });

  describe("bulkAddPantryItemsAction", () => {
    it("upserts each name separately", async () => {
      pantryMock.upsert.mockImplementation(async () => rowFactory());
      const res = await bulkAddPantryItemsAction({
        names: ["tavuk", "yumurta", "pirinç"],
      });
      expect(res.success).toBe(true);
      expect(pantryMock.upsert).toHaveBeenCalledTimes(3);
    });

    it("rejects over 50 items", async () => {
      const names = Array.from({ length: 51 }, (_, i) => `item-${i}`);
      const res = await bulkAddPantryItemsAction({ names });
      expect(res.success).toBe(false);
    });

    it("rejects empty array", async () => {
      const res = await bulkAddPantryItemsAction({ names: [] });
      expect(res.success).toBe(false);
    });
  });

  describe("updatePantryItemAction", () => {
    it("rejects update for other user's item", async () => {
      pantryMock.findUnique.mockResolvedValue({ userId: "someone-else" });
      const res = await updatePantryItemAction({
        id: "item-1",
        quantity: 10,
      });
      expect(res.success).toBe(false);
      expect(res.error).toBe("not-found");
    });

    it("updates partial fields only", async () => {
      pantryMock.findUnique.mockResolvedValue({ userId: "user-1" });
      pantryMock.update.mockResolvedValue(rowFactory({ quantity: 3 }));
      const res = await updatePantryItemAction({
        id: "item-1",
        quantity: 3,
      });
      expect(res.success).toBe(true);
      expect(pantryMock.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { quantity: 3 },
      });
    });

    it("handles null expiry (clear)", async () => {
      pantryMock.findUnique.mockResolvedValue({ userId: "user-1" });
      pantryMock.update.mockResolvedValue(rowFactory({ expiryDate: null }));
      const res = await updatePantryItemAction({
        id: "item-1",
        expiryDate: null,
      });
      expect(res.success).toBe(true);
      expect(pantryMock.update).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: { expiryDate: null },
      });
    });
  });

  describe("removePantryItemAction", () => {
    it("deletes if user owns item", async () => {
      pantryMock.findUnique.mockResolvedValue({ userId: "user-1" });
      pantryMock.delete.mockResolvedValue(rowFactory());
      const res = await removePantryItemAction("item-1");
      expect(res.success).toBe(true);
      expect(pantryMock.delete).toHaveBeenCalledWith({ where: { id: "item-1" } });
    });

    it("rejects delete for other user's item", async () => {
      pantryMock.findUnique.mockResolvedValue({ userId: "someone-else" });
      const res = await removePantryItemAction("item-1");
      expect(res.success).toBe(false);
      expect(res.error).toBe("not-found");
      expect(pantryMock.delete).not.toHaveBeenCalled();
    });

    it("rejects anonymous", async () => {
      mockAuth.mockResolvedValue(null);
      const res = await removePantryItemAction("item-1");
      expect(res.success).toBe(false);
      expect(res.error).toBe("auth-required");
    });
  });
});
