import { describe, expect, it } from "vitest";
import {
  computeBoost,
  applyBoostAndSort,
  emptyProfile,
  type UserPreferenceProfile,
} from "@/lib/ai/preference-boost";

function makeProfile(overrides: Partial<UserPreferenceProfile> = {}): UserPreferenceProfile {
  return {
    favoriteCuisines: new Set(),
    favoriteTags: new Set(),
    bookmarkedCuisineWeights: new Map(),
    bookmarkedTagWeights: new Map(),
    ...overrides,
  };
}

describe("computeBoost", () => {
  it("returns 0 for empty profile", () => {
    expect(computeBoost({ cuisine: "tr", tags: [] }, emptyProfile())).toBe(0);
  });

  it("adds 0.12 for explicit cuisine match", () => {
    const p = makeProfile({ favoriteCuisines: new Set(["tr"]) });
    expect(computeBoost({ cuisine: "tr", tags: [] }, p)).toBeCloseTo(0.12);
  });

  it("adds 0.05 for implicit cuisine (bookmark >=2)", () => {
    const p = makeProfile({
      bookmarkedCuisineWeights: new Map([["tr", 3]]),
    });
    expect(computeBoost({ cuisine: "tr", tags: [] }, p)).toBeCloseTo(0.05);
  });

  it("stacks explicit + implicit cuisine (0.17)", () => {
    const p = makeProfile({
      favoriteCuisines: new Set(["tr"]),
      bookmarkedCuisineWeights: new Map([["tr", 5]]),
    });
    expect(computeBoost({ cuisine: "tr", tags: [] }, p)).toBeCloseTo(0.17);
  });

  it("caps tag boost at 0.15", () => {
    const p = makeProfile({
      favoriteTags: new Set(["vegan", "30-dakika-alti", "pratik", "misafir-sofrasi", "cok-protein"]),
    });
    // 5 tag * 0.05 = 0.25, cap'lenir 0.15
    const tags = ["vegan", "30-dakika-alti", "pratik", "misafir-sofrasi", "cok-protein"];
    expect(computeBoost({ cuisine: null, tags }, p)).toBeCloseTo(0.15);
  });

  it("returns 0 when cuisine null and tags empty", () => {
    const p = makeProfile({ favoriteCuisines: new Set(["tr"]) });
    expect(computeBoost({ cuisine: null, tags: [] }, p)).toBe(0);
  });
});

describe("applyBoostAndSort", () => {
  const suggestions = [
    { cuisine: "it", tags: ["pratik"], matchScore: 0.7, id: "s1" },
    { cuisine: "tr", tags: ["vegan"], matchScore: 0.6, id: "s2" },
    { cuisine: "fr", tags: [], matchScore: 0.8, id: "s3" },
  ];

  it("returns unchanged order when profile is empty", () => {
    const result = applyBoostAndSort(suggestions, emptyProfile());
    expect(result.map((s) => s.id)).toEqual(["s1", "s2", "s3"]);
  });

  it("promotes suggestions matching favorite cuisine", () => {
    const p = makeProfile({ favoriteCuisines: new Set(["tr"]) });
    const result = applyBoostAndSort(suggestions, p);
    // s2 (tr) boosted 0.6 + 0.12 = 0.72 → s3 (0.8) hala ilk
    // Ama tag "vegan" explicit tag'te yoksa sadece cuisine boost
    expect(result[0]?.id).toBe("s3"); // 0.8 > 0.72
  });

  it("promotes suggestion with big enough boost to beat higher matchScore", () => {
    const p = makeProfile({
      favoriteCuisines: new Set(["tr"]),
      favoriteTags: new Set(["vegan", "pratik"]),
      bookmarkedCuisineWeights: new Map([["tr", 5]]),
    });
    // s2: 0.6 + 0.12 (cuisine) + 0.05 (implicit) + 0.05 (vegan) = 0.82
    // s3: 0.8 + 0 = 0.8
    const result = applyBoostAndSort(suggestions, p);
    expect(result[0]?.id).toBe("s2");
  });

  it("does not mutate original matchScore on returned items", () => {
    const p = makeProfile({ favoriteCuisines: new Set(["tr"]) });
    const result = applyBoostAndSort(suggestions, p);
    expect(result.find((s) => s.id === "s2")?.matchScore).toBe(0.6);
  });
});
