import { describe, expect, it } from "vitest";
import { buildPageItems } from "@/components/listing/Pagination";

describe("buildPageItems — pagination windowing", () => {
  it("renders every page when totalPages is small (≤ threshold)", () => {
    expect(buildPageItems(1, 1)).toEqual([1]);
    expect(buildPageItems(1, 4)).toEqual([1, 2, 3, 4]);
    expect(buildPageItems(3, 4)).toEqual([1, 2, 3, 4]);
    expect(buildPageItems(5, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it("current page near the start uses leading window + trailing ellipsis", () => {
    // 20 total, current 1 → 1 [2 3] … 20 (current ± 2 collapses to 2..3 at the edge)
    expect(buildPageItems(1, 20)).toEqual([1, 2, 3, "…", 20]);
    // current 2 → 1 2 3 4 … 20 (window includes 1 naturally, no leading ellipsis)
    expect(buildPageItems(2, 20)).toEqual([1, 2, 3, 4, "…", 20]);
    // current 4 → 1 2 3 4 5 6 … 20
    expect(buildPageItems(4, 20)).toEqual([1, 2, 3, 4, 5, 6, "…", 20]);
  });

  it("current page in the middle shows ellipsis on both sides", () => {
    expect(buildPageItems(10, 20)).toEqual([
      1,
      "…",
      8,
      9,
      10,
      11,
      12,
      "…",
      20,
    ]);
  });

  it("current page near the end uses leading ellipsis + trailing window", () => {
    expect(buildPageItems(19, 20)).toEqual([1, "…", 17, 18, 19, 20]);
    // current 20 (last) → 1 … 18 19 20
    expect(buildPageItems(20, 20)).toEqual([1, "…", 18, 19, 20]);
  });

  it("large total (117 pages, /tarifler scale) — window stays bounded", () => {
    // Real-world: 1401 recipes / 12 per page ≈ 117 pages. Middle page
    // shouldn't render anywhere near 117 links.
    const items = buildPageItems(60, 117);
    expect(items.length).toBeLessThanOrEqual(9);
    expect(items[0]).toBe(1);
    expect(items[items.length - 1]).toBe(117);
    expect(items).toContain(60);
  });

  it("threshold boundary — 9 pages full, 10 pages windowed", () => {
    expect(buildPageItems(5, 9)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    const tenItems = buildPageItems(5, 10);
    expect(tenItems).toContain("…");
    expect(tenItems[0]).toBe(1);
    expect(tenItems[tenItems.length - 1]).toBe(10);
  });
});
