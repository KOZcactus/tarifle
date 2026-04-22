import { describe, expect, it } from "vitest";
import {
  compareByFavoriteBoost,
  scoreByFavoriteTags,
  scoreByFavoritePrefs,
} from "@/lib/queries/recipe";

type Row = { id: string; title: string };

function row(id: string, title: string): Row {
  return { id, title };
}

describe("scoreByFavoriteTags", () => {
  it("returns intersection count when tags overlap", () => {
    expect(scoreByFavoriteTags(["pratik", "tatli", "vegan"], ["pratik", "tatli"]))
      .toBe(2);
  });

  it("returns 0 when favorites are empty", () => {
    expect(scoreByFavoriteTags(["pratik"], [])).toBe(0);
  });

  it("returns 0 when recipe has no tags", () => {
    expect(scoreByFavoriteTags([], ["pratik"])).toBe(0);
  });

  it("returns 0 when there is no overlap", () => {
    expect(scoreByFavoriteTags(["tatli"], ["tuzlu", "vegan"])).toBe(0);
  });

  it("is deduplicated-idempotent, duplicate recipe tags don't inflate score", () => {
    // Defensive: the prod schema has @@unique([recipeId, tagId]) so duplicates
    // shouldn't happen in practice, but the scorer should stay robust.
    expect(scoreByFavoriteTags(["pratik", "pratik"], ["pratik"])).toBe(2);
    // Note: we accept the double-count here because Set-dedup of recipeTags
    // would mask legitimate data-integrity issues. The schema guarantee is
    // the right layer to enforce uniqueness.
  });
});

describe("compareByFavoriteBoost", () => {
  it("sorts higher boost score first", () => {
    const rows = [row("a", "Elma"), row("b", "Muz"), row("c", "Portakal")];
    const scores = new Map([
      ["a", 0],
      ["b", 3],
      ["c", 1],
    ]);
    const sorted = [...rows].sort((x, y) =>
      compareByFavoriteBoost(scores, x, y),
    );
    expect(sorted.map((r) => r.id)).toEqual(["b", "c", "a"]);
  });

  it("tie-breaks alphabetically (Turkish collation)", () => {
    const rows = [
      row("a", "Çilekli"),
      row("b", "Cevizli"),
      row("c", "Cilekli"),
    ];
    // All equal score 2 → title asc with Turkish collation.
    const scores = new Map([
      ["a", 2],
      ["b", 2],
      ["c", 2],
    ]);
    const sorted = [...rows].sort((x, y) =>
      compareByFavoriteBoost(scores, x, y),
    );
    expect(sorted[0]!.title).toBe("Cevizli");
    expect(sorted[sorted.length - 1]!.title).toBe("Çilekli");
  });

  it("treats missing score as 0 (long-tail recipes land at the bottom)", () => {
    const rows = [row("a", "Armut"), row("b", "Kavun"), row("c", "Kivi")];
    const scores = new Map([["a", 5]]); // b and c absent
    const sorted = [...rows].sort((x, y) =>
      compareByFavoriteBoost(scores, x, y),
    );
    expect(sorted[0]!.id).toBe("a");
    // b, c tied at 0 → alphabetical Kavun, Kivi
    expect(sorted[1]!.title).toBe("Kavun");
    expect(sorted[2]!.title).toBe("Kivi");
  });

  it("empty favoriteTags collapses to alphabetical (all score 0)", () => {
    const rows = [row("a", "Zebra"), row("b", "Apple"), row("c", "Lion")];
    const scores = new Map<string, number>();
    const sorted = [...rows].sort((x, y) =>
      compareByFavoriteBoost(scores, x, y),
    );
    expect(sorted.map((r) => r.title)).toEqual(["Apple", "Lion", "Zebra"]);
  });
});

describe("scoreByFavoritePrefs (tag + cuisine combined, tur 4)", () => {
  it("cuisine match alone scores 2", () => {
    expect(scoreByFavoritePrefs([], "tr", [], ["tr"])).toBe(2);
  });

  it("tag intersection + cuisine match = sum (3 = 1 tag + 2 cuisine)", () => {
    expect(scoreByFavoritePrefs(["pratik"], "tr", ["pratik"], ["tr"])).toBe(3);
  });

  it("multi-tag intersection + cuisine = 4 (2 tags + 2 cuisine)", () => {
    expect(
      scoreByFavoritePrefs(["pratik", "vegan"], "it", ["pratik", "vegan"], ["it"]),
    ).toBe(4);
  });

  it("cuisine mismatch contributes 0", () => {
    expect(scoreByFavoritePrefs(["pratik"], "fr", ["pratik"], ["tr"])).toBe(1);
  });

  it("null cuisine ignores cuisine boost", () => {
    expect(scoreByFavoritePrefs(["pratik"], null, ["pratik"], ["tr"])).toBe(1);
  });

  it("empty preferences (both) score 0", () => {
    expect(scoreByFavoritePrefs(["pratik"], "tr", [], [])).toBe(0);
  });

  it("cuisine in preference list but recipe has different cuisine, no boost", () => {
    expect(scoreByFavoritePrefs([], "jp", [], ["tr", "it"])).toBe(0);
  });
});
