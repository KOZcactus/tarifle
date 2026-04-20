import { describe, expect, it } from "vitest";
import {
  rangeToWhere,
  resolveRange,
} from "@/lib/queries/admin-reviews-browse";

describe("resolveRange, URL → range object", () => {
  it("defaults to last7 when no preset or dates provided", () => {
    expect(resolveRange({})).toEqual({ kind: "last7" });
    expect(resolveRange({ preset: null, from: null, to: null })).toEqual({
      kind: "last7",
    });
  });

  it("recognizes preset strings", () => {
    expect(resolveRange({ preset: "last30" })).toEqual({ kind: "last30" });
    expect(resolveRange({ preset: "thisMonth" })).toEqual({ kind: "thisMonth" });
    expect(resolveRange({ preset: "all" })).toEqual({ kind: "all" });
  });

  it("parses custom range when both dates valid and ordered", () => {
    const r = resolveRange({
      preset: "custom",
      from: "2026-04-01",
      to: "2026-04-15",
    });
    expect(r.kind).toBe("custom");
    if (r.kind === "custom") {
      expect(r.from.toISOString().slice(0, 10)).toBe("2026-04-01");
      expect(r.to.toISOString().slice(0, 10)).toBe("2026-04-15");
      // `to` is pushed to end-of-day so single-day ranges include the
      // whole day (same start+end should cover 00:00:00–23:59:59).
      expect(r.to.getHours()).toBe(23);
    }
  });

  it("falls back to last7 when custom from > to (invalid order)", () => {
    expect(
      resolveRange({ preset: "custom", from: "2026-04-15", to: "2026-04-01" }),
    ).toEqual({ kind: "last7" });
  });

  it("falls back to last7 when one custom date is missing", () => {
    expect(resolveRange({ preset: "custom", from: "2026-04-15" })).toEqual({
      kind: "last7",
    });
    expect(resolveRange({ preset: "custom", to: "2026-04-15" })).toEqual({
      kind: "last7",
    });
  });

  it("falls back to last7 when dates are unparseable", () => {
    expect(
      resolveRange({ preset: "custom", from: "nonsense", to: "also-bad" }),
    ).toEqual({ kind: "last7" });
  });

  it("ignores unknown preset string (defaults to last7)", () => {
    expect(resolveRange({ preset: "forever" })).toEqual({ kind: "last7" });
  });
});

describe("rangeToWhere, range → Prisma where fragment", () => {
  it("returns empty where when range is all (no date filter)", () => {
    expect(rangeToWhere({ kind: "all" })).toEqual({});
  });

  it("returns gte clause for last7 (7 days ago)", () => {
    const w = rangeToWhere({ kind: "last7" });
    expect(w.createdAt?.gte).toBeInstanceOf(Date);
    const diffMs = Date.now() - (w.createdAt!.gte!.getTime());
    // Should be ≈ 7 days (allow 1 second skew for test execution).
    const sevenDays = 7 * 24 * 60 * 60 * 1000;
    expect(Math.abs(diffMs - sevenDays)).toBeLessThan(1000);
    expect(w.createdAt?.lte).toBeUndefined();
  });

  it("returns gte clause for last30 (30 days ago)", () => {
    const w = rangeToWhere({ kind: "last30" });
    const diffMs = Date.now() - (w.createdAt!.gte!.getTime());
    const thirtyDays = 30 * 24 * 60 * 60 * 1000;
    expect(Math.abs(diffMs - thirtyDays)).toBeLessThan(1000);
  });

  it("returns gte clause for thisMonth (first day of current month 00:00)", () => {
    const w = rangeToWhere({ kind: "thisMonth" });
    const gte = w.createdAt!.gte!;
    const now = new Date();
    expect(gte.getFullYear()).toBe(now.getFullYear());
    expect(gte.getMonth()).toBe(now.getMonth());
    expect(gte.getDate()).toBe(1);
    expect(gte.getHours()).toBe(0);
  });

  it("returns gte+lte clause for custom range", () => {
    const from = new Date("2026-04-01");
    const to = new Date("2026-04-15T23:59:59.999");
    const w = rangeToWhere({ kind: "custom", from, to });
    expect(w.createdAt?.gte).toBe(from);
    expect(w.createdAt?.lte).toBe(to);
  });
});
