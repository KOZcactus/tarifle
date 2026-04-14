import { describe, expect, it } from "vitest";
import { checkBlacklist, checkMultipleTexts } from "@/lib/moderation/blacklist";

describe("checkBlacklist", () => {
  it("returns clean for benign text", () => {
    const result = checkBlacklist("Bu tarif gerçekten çok lezzetliydi.");
    expect(result.isClean).toBe(true);
    expect(result.flaggedWords).toEqual([]);
  });

  it("flags a single banned word", () => {
    const result = checkBlacklist("Bu kaltak bir şey");
    expect(result.isClean).toBe(false);
    expect(result.flaggedWords).toContain("kaltak");
  });

  it("normalizes Turkish characters before matching", () => {
    // `piç` should match even when fed as plain `pic` to normalize
    const result = checkBlacklist("pIç");
    expect(result.isClean).toBe(false);
    expect(result.flaggedWords).toContain("pic");
  });

  it("catches abbreviations that are whole-word matches", () => {
    const result = checkBlacklist("amk çok fena");
    expect(result.isClean).toBe(false);
    expect(result.flaggedWords).toContain("amk");
  });

  it("does not false-positive on substrings of legit words", () => {
    // "amk" as a substring inside "amk" itself is flagged, but "amik" or
    // "lamba" should NOT trigger since the splitter is whitespace-based.
    const result = checkBlacklist("amık ve lambalar");
    expect(result.isClean).toBe(true);
  });

  it("detects multi-word phrases", () => {
    const result = checkBlacklist("Sen tam bir geri zekalı insansın.");
    expect(result.isClean).toBe(false);
    expect(result.flaggedWords).toContain("geri zekali");
  });

  it("deduplicates repeated flagged words", () => {
    const result = checkBlacklist("amk amk amk");
    expect(result.flaggedWords).toEqual(["amk"]);
  });

  it("handles empty string gracefully", () => {
    const result = checkBlacklist("");
    expect(result.isClean).toBe(true);
    expect(result.flaggedWords).toEqual([]);
  });
});

describe("checkMultipleTexts", () => {
  it("returns clean when every text is clean", () => {
    const result = checkMultipleTexts([
      "Fırında 20 dakika pişirin",
      "Tuz ekleyin",
    ]);
    expect(result.isClean).toBe(true);
  });

  it("aggregates flagged words across texts without duplication", () => {
    const result = checkMultipleTexts([
      "ilk metinde amk var",
      "ikinci metinde amk ve kaltak var",
      "üçüncü temiz",
    ]);
    expect(result.isClean).toBe(false);
    expect(result.flaggedWords.sort()).toEqual(["amk", "kaltak"]);
  });

  it("empty array is considered clean", () => {
    const result = checkMultipleTexts([]);
    expect(result.isClean).toBe(true);
    expect(result.flaggedWords).toEqual([]);
  });
});
