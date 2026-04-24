import { describe, expect, it } from "vitest";
import { scaleAmount } from "@/lib/queries/shopping-list";

describe("scaleAmount", () => {
  it("passes through when factor is 1", () => {
    expect(scaleAmount("2", 1)).toBe("2");
    expect(scaleAmount("tat için", 1)).toBe("tat için");
  });
  it("scales plain numbers", () => {
    expect(scaleAmount("2", 2)).toBe("4");
    expect(scaleAmount("2.5", 2)).toBe("5");
    expect(scaleAmount("2,5", 2)).toBe("5");
    expect(scaleAmount("3", 0.5)).toBe("1.5");
  });
  it("scales fractions", () => {
    expect(scaleAmount("1/2", 2)).toBe("1");
    expect(scaleAmount("3/4", 2)).toBe("1.5");
  });
  it("scales ranges", () => {
    expect(scaleAmount("1-2", 2)).toBe("2-4");
    expect(scaleAmount("0.5-1", 4)).toBe("2-4");
  });
  it("passes through non-numeric", () => {
    expect(scaleAmount("tat için", 2)).toBe("tat için");
    expect(scaleAmount("yeterince", 3)).toBe("yeterince");
    expect(scaleAmount("1 tutam", 2)).toBe("1 tutam");
  });
  it("rounds to 2 decimals, strips trailing zeros", () => {
    expect(scaleAmount("1", 0.333)).toBe("0.33");
    expect(scaleAmount("3", 0.333)).toBe("1");
    expect(scaleAmount("3", 1.5)).toBe("4.5");
  });
});
