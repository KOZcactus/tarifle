import { describe, expect, it } from "vitest";
import {
  computeTimeline,
  formatTimelineMinutes,
} from "@/lib/recipe/timeline";

describe("computeTimeline", () => {
  it("simple recipe (no marine): prep + cook only", () => {
    const r = computeTimeline({ prepMinutes: 5, cookMinutes: 15, totalMinutes: 20 });
    expect(r.totalMinutes).toBe(20);
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0]?.kind).toBe("prep");
    expect(r.segments[1]?.kind).toBe("cook");
  });

  it("recipe with wait/marine: prep + wait + cook", () => {
    // Sauerbraten: 20dk prep, 180dk cook, 2900dk total -> 2700dk marine
    const r = computeTimeline({
      prepMinutes: 20,
      cookMinutes: 180,
      totalMinutes: 2900,
    });
    expect(r.segments).toHaveLength(3);
    expect(r.segments[0]?.kind).toBe("prep");
    expect(r.segments[1]?.kind).toBe("wait");
    expect(r.segments[1]?.minutes).toBe(2700);
    expect(r.segments[2]?.kind).toBe("cook");
  });

  it("zero minutes: empty segments", () => {
    const r = computeTimeline({ prepMinutes: 0, cookMinutes: 0, totalMinutes: 0 });
    expect(r.segments).toHaveLength(0);
  });

  it("totalMinutes < prep + cook: wait segment skipped (no negative)", () => {
    const r = computeTimeline({ prepMinutes: 30, cookMinutes: 60, totalMinutes: 50 });
    // wait = max(0, 50 - 30 - 60) = 0, atlanir
    expect(r.segments.find((s) => s.kind === "wait")).toBeUndefined();
    expect(r.segments).toHaveLength(2);
  });

  it("widths sum to ~100%", () => {
    const r = computeTimeline({ prepMinutes: 10, cookMinutes: 20, totalMinutes: 35 });
    const sum = r.segments.reduce((s, x) => s + x.widthPercent, 0);
    expect(sum).toBeCloseTo(100, 1);
  });

  it("very small segment kept visible (post-normalize > 2%, not 0)", () => {
    // 1 dk prep + 2880 dk marine + 1 dk cook = 2882 dk total
    // Raw prep%: 0.03%. Algoritma MIN_PCT=3 base + normalize uygular
    // (normalize sonrasi tek segment 3'un altina inebilir, ama bar'da
    // gozuksun yeterli, gercek raw 0.03 vs normalize ~2.8 ayni mahallede).
    const r = computeTimeline({
      prepMinutes: 1,
      cookMinutes: 1,
      totalMinutes: 2882,
    });
    const prepSeg = r.segments.find((s) => s.kind === "prep");
    expect(prepSeg).toBeDefined();
    expect(prepSeg!.widthPercent).toBeGreaterThan(2);
  });
});

describe("formatTimelineMinutes", () => {
  it("under 60 minutes: 'N dk'", () => {
    expect(formatTimelineMinutes(0)).toBe("0 dk");
    expect(formatTimelineMinutes(15)).toBe("15 dk");
    expect(formatTimelineMinutes(59)).toBe("59 dk");
  });

  it("hours only: 'N sa'", () => {
    expect(formatTimelineMinutes(60)).toBe("1 sa");
    expect(formatTimelineMinutes(120)).toBe("2 sa");
  });

  it("hours + minutes: 'N sa M dk'", () => {
    expect(formatTimelineMinutes(90)).toBe("1 sa 30 dk");
    expect(formatTimelineMinutes(135)).toBe("2 sa 15 dk");
  });

  it("days only: 'N gün'", () => {
    expect(formatTimelineMinutes(24 * 60)).toBe("1 gün");
    expect(formatTimelineMinutes(2 * 24 * 60)).toBe("2 gün");
  });

  it("days + hours: 'N gün M sa'", () => {
    expect(formatTimelineMinutes(24 * 60 + 60)).toBe("1 gün 1 sa");
    expect(formatTimelineMinutes(3 * 24 * 60 + 4 * 60)).toBe("3 gün 4 sa");
  });

  it("Sauerbraten range (2700 dk marine)", () => {
    // 2700 dk = 45 sa = 1 gün 21 sa
    expect(formatTimelineMinutes(2700)).toBe("1 gün 21 sa");
  });
});
