/**
 * Unit tests for the featured-recipes weekly rotation math. The DB call
 * itself needs a live Postgres; the rotation logic (week-index + offset
 * modulo pool size) is pure arithmetic and worth guarding — off-by-one
 * here would mean the homepage shows wrong content for a whole week.
 *
 * `getWeekIndex(now)` is the injection point: pass a fake `Date` and
 * assert the computed index is stable across the same week but shifts
 * on Thursday midnight UTC (start of ISO week convention used here).
 */
import { describe, it, expect } from "vitest";
import { getWeekIndex } from "../../src/lib/queries/recipe";

describe("getWeekIndex()", () => {
  it("Unix epoch baseline → 0", () => {
    expect(getWeekIndex(new Date("1970-01-01T00:00:00Z"))).toBe(0);
  });

  it("7 gün sonrası 1. hafta", () => {
    expect(getWeekIndex(new Date("1970-01-08T00:00:00Z"))).toBe(1);
  });

  it("aynı hafta içinde stabil (Perşembe-Çarşamba penceresi)", () => {
    // Epoch 1970-01-01 Perşembe olduğu için bucket'lar
    // Perşembe 00:00 → sonraki Çarşamba 23:59:59 UTC. İki tarih aynı
    // pencereye düşerse aynı haftayı raporlar.
    const thu = getWeekIndex(new Date("2026-04-16T12:00:00Z"));
    const wed = getWeekIndex(new Date("2026-04-22T12:00:00Z"));
    expect(thu).toBe(wed);
  });

  it("hafta sınırında (Perşembe 00:00 UTC) indeks artar", () => {
    const wed = getWeekIndex(new Date("2026-04-15T23:59:59Z"));
    const thu = getWeekIndex(new Date("2026-04-16T00:00:00Z"));
    expect(thu - wed).toBe(1);
  });

  it("monotonic — ileri tarihler artıyor, geri değil", () => {
    const d1 = getWeekIndex(new Date("2026-01-01"));
    const d2 = getWeekIndex(new Date("2026-06-01"));
    const d3 = getWeekIndex(new Date("2027-01-01"));
    expect(d2).toBeGreaterThan(d1);
    expect(d3).toBeGreaterThan(d2);
  });
});

describe("rotation arithmetic (kullandığımız offset formülü)", () => {
  // Bu getFeaturedRecipes içinde uygulanan mantığın aynası — pure math,
  // rotation algorithm'inin off-by-one'a düşmediğini doğrular.
  function rotate<T>(
    pool: readonly T[],
    weekIndex: number,
    limit: number,
  ): T[] {
    if (pool.length <= limit) return [...pool];
    const offset = weekIndex % pool.length;
    const out: T[] = [];
    for (let i = 0; i < limit; i++) {
      const idx = (offset + i) % pool.length;
      const item = pool[idx];
      if (item) out.push(item);
    }
    return out;
  }

  const pool = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j"];

  it("hafta 0: ilk `limit` eleman", () => {
    expect(rotate(pool, 0, 3)).toEqual(["a", "b", "c"]);
  });

  it("hafta 1: offset 1, bir kaydırır", () => {
    expect(rotate(pool, 1, 3)).toEqual(["b", "c", "d"]);
  });

  it("pool sonunda wrap-around", () => {
    // offset 9 → [j, a, b]
    expect(rotate(pool, 9, 3)).toEqual(["j", "a", "b"]);
  });

  it("offset pool.length'e eşitse başa döner", () => {
    expect(rotate(pool, 10, 3)).toEqual(["a", "b", "c"]);
  });

  it("pool <= limit → rotation no-op, tümü döner", () => {
    expect(rotate(["a", "b"], 5, 6)).toEqual(["a", "b"]);
  });

  it("büyük hafta indeksi (2026'da ~2900 civarı) taşmaz", () => {
    const big = 2900;
    const out = rotate(pool, big, 3);
    expect(out).toHaveLength(3);
    // 2900 % 10 = 0 → baştan başlar
    expect(out).toEqual(["a", "b", "c"]);
  });
});
