/**
 * Unit tests for the full-text search layer's pure helpers. The
 * tsvector/websearch behaviour itself lives in Postgres and is covered
 * by manual smoke tests after the migration is applied, but the input
 * sanitisation is JS-side and guards against injection-like parse
 * failures, so it's worth exercising here.
 */
import { describe, it, expect } from "vitest";
import { sanitizeQueryInput } from "../../src/lib/search/recipe-search";

describe("sanitizeQueryInput()", () => {
  it("trims leading/trailing whitespace", () => {
    expect(sanitizeQueryInput("  mantı  ")).toBe("mantı");
    expect(sanitizeQueryInput("\n\tbörek\n")).toBe("börek");
  });

  it("strips null bytes", () => {
    expect(sanitizeQueryInput("mantı\x00")).toBe("mantı");
    expect(sanitizeQueryInput("an\x00tep")).toBe("antep");
  });

  it("strips ASCII control characters but keeps spaces", () => {
    expect(sanitizeQueryInput("mantı\x01\x02")).toBe("mantı");
    expect(sanitizeQueryInput("an\x7ftep")).toBe("antep");
    expect(sanitizeQueryInput("antep fıstığı")).toBe("antep fıstığı");
  });

  it("preserves websearch_to_tsquery operator characters", () => {
    // quotes, dash (exclusion), parens, websearch syntax uses these
    // naturally, don't strip them.
    expect(sanitizeQueryInput('"adana kebap"')).toBe('"adana kebap"');
    expect(sanitizeQueryInput("köfte -acılı")).toBe("köfte -acılı");
    expect(sanitizeQueryInput("(tatlı)")).toBe("(tatlı)");
  });

  it("keeps Turkish characters intact (unaccent is SQL-side)", () => {
    // Normalize ASLA JS'te değil; Postgres `immutable_unaccent` kolon
    // ve query tarafını eşzamanlı işliyor. JS tarafı normalize etseydik
    // "mantı" ile indexli kolon eşleşmezdi.
    expect(sanitizeQueryInput("Şerbet")).toBe("Şerbet");
    expect(sanitizeQueryInput("Güllaç")).toBe("Güllaç");
    expect(sanitizeQueryInput("İskender")).toBe("İskender");
  });

  it("empty string / whitespace-only → empty result", () => {
    expect(sanitizeQueryInput("")).toBe("");
    expect(sanitizeQueryInput("   ")).toBe("");
    expect(sanitizeQueryInput("\n\t\r")).toBe("");
  });
});
