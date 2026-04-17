/**
 * admin-ops.ts server action'larının Zod şemalarını doğrular. Action
 * dosyası 'use server' direktifi içerdiği için şemaları inline duplicate
 * ediyoruz — action'ı direkt import etsek module load side-effect'lerini
 * tetikler (auth/prisma/revalidatePath). Küçük duplication kabul.
 */
import { describe, it, expect } from "vitest";
import { z } from "zod";

// ─── Suspension ───────────────────────────────────────────

const suspendUserSchema = z.object({
  userId: z.string().min(1),
  reason: z.string().trim().max(500).optional(),
});

describe("suspendUser validation", () => {
  it("accepts minimal input", () => {
    expect(
      suspendUserSchema.safeParse({ userId: "abc" }).success,
    ).toBe(true);
  });

  it("accepts reason", () => {
    expect(
      suspendUserSchema.safeParse({ userId: "abc", reason: "Spam" }).success,
    ).toBe(true);
  });

  it("rejects empty userId", () => {
    expect(suspendUserSchema.safeParse({ userId: "" }).success).toBe(false);
  });

  it("rejects 501-char reason", () => {
    expect(
      suspendUserSchema.safeParse({
        userId: "abc",
        reason: "x".repeat(501),
      }).success,
    ).toBe(false);
  });
});

// ─── Announcement ─────────────────────────────────────────

const announcementSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().max(1000).optional(),
  link: z.string().trim().url().max(500).optional().or(z.literal("")),
  variant: z.enum(["INFO", "WARNING", "SUCCESS"]).default("INFO"),
  startsAt: z.string().optional(),
  endsAt: z.string().optional(),
});

describe("announcement validation", () => {
  it("accepts minimal title", () => {
    expect(
      announcementSchema.safeParse({ title: "Test duyuru" }).success,
    ).toBe(true);
  });

  it("rejects 2-char title", () => {
    expect(announcementSchema.safeParse({ title: "xx" }).success).toBe(false);
  });

  it("defaults variant to INFO", () => {
    const r = announcementSchema.parse({ title: "Test" });
    expect(r.variant).toBe("INFO");
  });

  it("accepts empty link literal", () => {
    expect(
      announcementSchema.safeParse({ title: "Test", link: "" }).success,
    ).toBe(true);
  });

  it("accepts https URL in link", () => {
    expect(
      announcementSchema.safeParse({
        title: "Test",
        link: "https://tarifle.app/kampanya",
      }).success,
    ).toBe(true);
  });

  it("rejects invalid link URL", () => {
    expect(
      announcementSchema.safeParse({ title: "Test", link: "not a url" })
        .success,
    ).toBe(false);
  });

  it("rejects invalid variant", () => {
    expect(
      announcementSchema.safeParse({ title: "Test", variant: "ERROR" as "INFO" })
        .success,
    ).toBe(false);
  });
});

// ─── Broadcast ────────────────────────────────────────────

const broadcastSchema = z.object({
  title: z.string().trim().min(3).max(200),
  body: z.string().trim().max(1000).optional(),
  link: z.string().trim().max(500).optional(),
  role: z.enum(["USER", "MODERATOR", "ADMIN"]).optional(),
  onlyVerified: z.boolean().optional(),
});

describe("broadcast validation", () => {
  it("accepts minimal title (no role = everyone)", () => {
    const r = broadcastSchema.safeParse({ title: "Duyuru" });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.role).toBeUndefined();
      expect(r.data.onlyVerified).toBeUndefined();
    }
  });

  it("accepts role filter", () => {
    expect(
      broadcastSchema.safeParse({ title: "Test", role: "MODERATOR" }).success,
    ).toBe(true);
  });

  it("rejects invalid role", () => {
    expect(
      broadcastSchema.safeParse({ title: "Test", role: "BANNED" as "USER" })
        .success,
    ).toBe(false);
  });

  it("accepts onlyVerified boolean", () => {
    expect(
      broadcastSchema.safeParse({ title: "Test", onlyVerified: true }).success,
    ).toBe(true);
  });

  it("rejects 201-char title", () => {
    expect(
      broadcastSchema.safeParse({ title: "x".repeat(201) }).success,
    ).toBe(false);
  });
});

// ─── Active announcement window logic ─────────────────────

function isActive(
  startsAt: Date | null,
  endsAt: Date | null,
  now: Date = new Date(),
): boolean {
  if (startsAt && startsAt > now) return false;
  if (endsAt && endsAt < now) return false;
  return true;
}

describe("active announcement window", () => {
  const now = new Date("2026-04-17T12:00:00Z");
  const earlier = new Date("2026-04-17T10:00:00Z");
  const later = new Date("2026-04-17T14:00:00Z");

  it("null/null is active (süresiz)", () => {
    expect(isActive(null, null, now)).toBe(true);
  });

  it("started, no end is active", () => {
    expect(isActive(earlier, null, now)).toBe(true);
  });

  it("no start, not yet ended is active", () => {
    expect(isActive(null, later, now)).toBe(true);
  });

  it("started, ended is inactive", () => {
    expect(isActive(earlier, earlier, now)).toBe(false);
  });

  it("future start is inactive", () => {
    expect(isActive(later, null, now)).toBe(false);
  });

  it("window includes both start and end", () => {
    expect(isActive(earlier, later, now)).toBe(true);
  });
});
