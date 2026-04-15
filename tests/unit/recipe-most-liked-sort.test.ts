import { describe, expect, it } from "vitest";
import { compareByMostLiked } from "@/lib/queries/recipe";

type Row = { title: string; variations: { likeCount: number }[] };

function row(title: string, likes: number[]): Row {
  return { title, variations: likes.map((likeCount) => ({ likeCount })) };
}

describe("compareByMostLiked", () => {
  it("sorts higher total likes first", () => {
    const rows = [row("A", [1, 2]), row("B", [10]), row("C", [0])];
    const sorted = [...rows].sort(compareByMostLiked);
    expect(sorted.map((r) => r.title)).toEqual(["B", "A", "C"]);
  });

  it("sums across multiple variations", () => {
    const rows = [row("Many", [3, 3, 3, 3]), row("One", [10])];
    // 12 vs 10
    expect([...rows].sort(compareByMostLiked).map((r) => r.title)).toEqual([
      "Many",
      "One",
    ]);
  });

  it("tie-breaks alphabetically (Turkish collation)", () => {
    // Same total (5 each) → title asc. "Ç" comes after "C" in Turkish sort.
    const rows = [row("Çilekli", [5]), row("Cevizli", [5]), row("Cilekli", [5])];
    const sorted = [...rows].sort(compareByMostLiked);
    // Latin "Cevizli" (e) < Latin "Cilekli" (i without dot — ASCII i) < "Çilekli"
    expect(sorted[0]!.title).toBe("Cevizli");
    expect(sorted[sorted.length - 1]!.title).toBe("Çilekli");
  });

  it("handles a recipe with zero variations (total 0)", () => {
    const rows = [row("Zero", []), row("One", [1])];
    expect([...rows].sort(compareByMostLiked).map((r) => r.title)).toEqual([
      "One",
      "Zero",
    ]);
  });

  it("is stable for identical rows", () => {
    const rows = [row("A", [5]), row("A", [5])];
    const sorted = [...rows].sort(compareByMostLiked);
    expect(sorted.length).toBe(2);
    expect(sorted.every((r) => r.title === "A")).toBe(true);
  });

  it("keeps all 0-liked at the bottom in title order", () => {
    const rows = [
      row("Zebra", []),
      row("Apple", []),
      row("Lion", [3]),
      row("Mouse", [7]),
    ];
    expect([...rows].sort(compareByMostLiked).map((r) => r.title)).toEqual([
      "Mouse",
      "Lion",
      "Apple",
      "Zebra",
    ]);
  });
});
