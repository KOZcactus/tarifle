import { describe, expect, it } from "vitest";
import {
  buildCuratorNote,
  pickDailyIntro,
  __INTRO_COUNT,
  __RULE_IDS,
  type CuratorInput,
} from "@/lib/ai/recipe-of-the-day-commentary";
import { daysSinceEpoch } from "@/lib/queries/recipe-of-the-day";

const baseRecipe: CuratorInput = {
  type: "YEMEK",
  difficulty: "MEDIUM",
  totalMinutes: 60,
  averageCalories: 400,
  isFeatured: false,
  variationCount: 0,
};

describe("pickDailyIntro", () => {
  it("is deterministic for the same seed", () => {
    expect(pickDailyIntro(42)).toBe(pickDailyIntro(42));
  });

  it("returns a non-empty string from the fixed pool", () => {
    for (let seed = 0; seed < 20; seed++) {
      const v = pickDailyIntro(seed);
      expect(v).toBeTruthy();
      expect(typeof v).toBe("string");
    }
  });

  it("covers all variants over a full rotation", () => {
    const seen = new Set<string>();
    for (let s = 0; s < __INTRO_COUNT; s++) seen.add(pickDailyIntro(s));
    expect(seen.size).toBe(__INTRO_COUNT);
  });

  it("handles negative seeds without crashing or returning undefined", () => {
    expect(pickDailyIntro(-1)).toBeTruthy();
    expect(pickDailyIntro(-9999)).toBeTruthy();
  });
});

describe("buildCuratorNote", () => {
  it("picks the TATLI rule for a dessert", () => {
    const note = buildCuratorNote({ ...baseRecipe, type: "TATLI" }, 0);
    expect(note.toLowerCase()).toMatch(/tatlı|ev yapımı/);
  });

  it("picks the KOKTEYL rule for a cocktail", () => {
    const note = buildCuratorNote({ ...baseRecipe, type: "KOKTEYL" }, 0);
    expect(note.toLowerCase()).toMatch(/bardak|kutlama|hafta sonu/);
  });

  it("picks the CORBA rule for a soup", () => {
    const note = buildCuratorNote({ ...baseRecipe, type: "CORBA" }, 0);
    expect(note.toLowerCase()).toMatch(/çorba|sıcacık|kaşık/);
  });

  it("picks HARD-difficulty note for a hard recipe", () => {
    const note = buildCuratorNote(
      { ...baseRecipe, difficulty: "HARD" },
      0,
    );
    expect(note.toLowerCase()).toMatch(/sabır|hafta sonu projesi/);
  });

  it("picks quick/easy note for easy ≤30 min", () => {
    const note = buildCuratorNote(
      { ...baseRecipe, difficulty: "EASY", totalMinutes: 25 },
      0,
    );
    expect(note.toLowerCase()).toMatch(/pratik|yorgun|yarım saat/);
  });

  it("picks hearty note when calories > 500", () => {
    const note = buildCuratorNote(
      { ...baseRecipe, averageCalories: 750 },
      0,
    );
    expect(note.toLowerCase()).toMatch(/doyurucu|uzun bir gün/);
  });

  it("picks light note when calories < 250", () => {
    const note = buildCuratorNote(
      { ...baseRecipe, averageCalories: 180 },
      0,
    );
    expect(note.toLowerCase()).toMatch(/hafif|düşük kalori/);
  });

  it("picks popular-variations note when ≥3 uyarlama", () => {
    const note = buildCuratorNote(
      { ...baseRecipe, variationCount: 5 },
      0,
    );
    expect(note.toLowerCase()).toMatch(/topluluk|uyarlama/);
  });

  it("falls back to generic note when nothing specific matches", () => {
    // YEMEK + MEDIUM + 60min + 400cal + not featured + 0 variations:
    // none of the rules match.
    const note = buildCuratorNote(baseRecipe, 0);
    expect(note).toBe("Denemeye değer.");
  });

  it("returns the same note for the same (features, seed) pair", () => {
    const a = buildCuratorNote(
      { ...baseRecipe, type: "TATLI" },
      42,
    );
    const b = buildCuratorNote(
      { ...baseRecipe, type: "TATLI" },
      42,
    );
    expect(a).toBe(b);
  });

  it("rule ids are unique (no accidental duplicates)", () => {
    const unique = new Set(__RULE_IDS);
    expect(unique.size).toBe(__RULE_IDS.length);
  });
});

describe("daysSinceEpoch", () => {
  it("returns the same integer for two times within the same UTC day", () => {
    const a = new Date("2026-04-15T01:00:00Z");
    const b = new Date("2026-04-15T23:59:00Z");
    expect(daysSinceEpoch(a)).toBe(daysSinceEpoch(b));
  });

  it("advances by 1 between consecutive UTC days", () => {
    const d1 = new Date("2026-04-15T12:00:00Z");
    const d2 = new Date("2026-04-16T12:00:00Z");
    expect(daysSinceEpoch(d2) - daysSinceEpoch(d1)).toBe(1);
  });

  it("is a non-negative integer for reasonable dates", () => {
    const v = daysSinceEpoch(new Date("2026-04-15T00:00:00Z"));
    expect(v).toBeGreaterThan(0);
    expect(Number.isInteger(v)).toBe(true);
  });
});
