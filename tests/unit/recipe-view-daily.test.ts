import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { toUtcDateBucket } from "@/lib/queries/recipe-view-daily";

describe("toUtcDateBucket", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("drops hour/minute/second into the UTC day bucket", () => {
    const instant = new Date("2026-04-20T14:37:42.123Z");
    const bucket = toUtcDateBucket(instant);
    expect(bucket.toISOString()).toBe("2026-04-20T00:00:00.000Z");
  });

  it("uses UTC, not local — a 23:30 TSİ timestamp stays on the UTC day", () => {
    // 23:30 TSİ = 20:30 UTC → UTC günü aynı
    const instant = new Date("2026-04-20T20:30:00.000Z");
    const bucket = toUtcDateBucket(instant);
    expect(bucket.toISOString()).toBe("2026-04-20T00:00:00.000Z");
  });

  it("crosses the UTC date boundary at 00:00 UTC (03:00 TSİ)", () => {
    // 03:00 TSİ = 00:00 UTC sonrası → UTC günü +1
    const beforeMidnight = new Date("2026-04-20T23:59:59.000Z");
    const afterMidnight = new Date("2026-04-21T00:00:00.000Z");
    expect(toUtcDateBucket(beforeMidnight).toISOString()).toBe(
      "2026-04-20T00:00:00.000Z",
    );
    expect(toUtcDateBucket(afterMidnight).toISOString()).toBe(
      "2026-04-21T00:00:00.000Z",
    );
  });

  it("default arg (no instant) uses current time", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));
    const bucket = toUtcDateBucket();
    expect(bucket.toISOString()).toBe("2026-04-20T00:00:00.000Z");
  });
});

describe("getDailyViewTrend — shape and fill behavior", () => {
  // Bu test Prisma client'ı mock'lar; asıl aggregate DB'ye gittiği için
  // sadece output shape + 0-fill davranışını doğruluyoruz.
  beforeEach(() => {
    vi.resetModules();
  });

  it("fills missing days with 0 views", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-04-20T12:00:00.000Z"));

    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        recipeViewDaily: {
          groupBy: vi.fn().mockResolvedValue([
            {
              date: new Date("2026-04-18T00:00:00.000Z"),
              _sum: { count: 42 },
            },
            {
              date: new Date("2026-04-20T00:00:00.000Z"),
              _sum: { count: 17 },
            },
          ]),
        },
      },
    }));

    const { getDailyViewTrend } = await import(
      "@/lib/queries/recipe-view-daily"
    );
    const trend = await getDailyViewTrend(5);

    expect(trend).toHaveLength(5);
    expect(trend.map((t) => t.date)).toEqual([
      "2026-04-16",
      "2026-04-17",
      "2026-04-18",
      "2026-04-19",
      "2026-04-20",
    ]);
    expect(trend.map((t) => t.views)).toEqual([0, 0, 42, 0, 17]);

    vi.useRealTimers();
  });

  it("returns empty array for days < 1", async () => {
    vi.doMock("@/lib/prisma", () => ({
      prisma: {
        recipeViewDaily: {
          groupBy: vi.fn(),
        },
      },
    }));
    const { getDailyViewTrend } = await import(
      "@/lib/queries/recipe-view-daily"
    );
    expect(await getDailyViewTrend(0)).toEqual([]);
    expect(await getDailyViewTrend(-1)).toEqual([]);
  });
});
