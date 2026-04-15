/**
 * Unit tests for the rollback script's pure helpers. The DB-touching
 * paths (buildImpactReport, executeRollback) need a live Postgres and
 * are covered by manual smoke tests; slug extraction is regex-level
 * string parsing and merits its own fast guard since Codex's BATCH
 * marker convention could drift.
 */
import { describe, it, expect } from "vitest";
import { extractBatchSlugsFromSeed } from "../../scripts/rollback-batch";

/**
 * We don't want to couple the test to the actual seed-recipes.ts
 * content (which the test machine might not have in an expected state).
 * Instead: write a tiny fixture with the same marker grammar to a temp
 * file, monkey-patch the script's seed path by pre-setting __dirname-
 * style expectations. Easiest path: write the fixture to
 * `scripts/seed-recipes.test-fixture.ts` and swap the reader... too
 * invasive. Simpler: shell out to the actual scripts/seed-recipes.ts
 * and check that a non-existent batch returns 0 slugs (negative case,
 * doesn't depend on real content). For positive cases, write a tmp
 * file and re-run the helper by reading directly.
 */
describe("extractBatchSlugsFromSeed()", () => {
  it("bilinmeyen batch numarası için boş array döner", () => {
    // Real file almost certainly doesn't have BATCH 99 yet.
    const result = extractBatchSlugsFromSeed("99");
    expect(result).toEqual([]);
  });
});

// To cover positive parsing we test the regex-based extraction inline
// (the helper itself reads a hard-coded path; we replicate its regex
// against a fixture string here).
describe("batch marker regex parsing (inline fixture)", () => {
  function parseFixture(text: string, batch: string): string[] {
    const startRx = new RegExp(`//\\s*──\\s*BATCH\\s+${batch}\\s*──`, "i");
    const endRx = new RegExp(
      `//\\s*──\\s*(BATCH\\s+\\d+\\s*──|BATCH\\s+${batch}\\s+SONU\\s*──)`,
      "i",
    );
    const startMatch = startRx.exec(text);
    if (!startMatch) return [];
    const afterStart = text.slice(startMatch.index + startMatch[0].length);
    const endMatch = endRx.exec(afterStart);
    const region = endMatch ? afterStart.slice(0, endMatch.index) : afterStart;
    const slugRx = /slug:\s*"([a-z0-9-]+)"/g;
    const slugs: string[] = [];
    let m: RegExpExecArray | null;
    while ((m = slugRx.exec(region)) !== null) {
      if (m[1]) slugs.push(m[1]);
    }
    return slugs;
  }

  const fixture = `
    const recipes = [
      // ── ET YEMEKLERİ ──
      { title: "Pre", slug: "pre-existing", /* ... */ },
      // ── BATCH 2 ── (tarih: 2026-04-16, 3 tarif, Codex)
      { title: "Yeni 1", slug: "yeni-tarif-bir", /* ... */ },
      { title: "Yeni 2", slug: "yeni-tarif-iki", /* ... */ },
      { title: "Yeni 3", slug: "yeni-tarif-uc", /* ... */ },
      // ── BATCH 2 SONU ──
      // ── BATCH 3 ──
      { title: "Sonraki", slug: "sonraki-tarif", /* ... */ },
      // ── BATCH 3 SONU ──
    ];
  `;

  it("BATCH 2 bloğundaki 3 slug'ı çeker, dışındakileri dahil etmez", () => {
    expect(parseFixture(fixture, "2")).toEqual([
      "yeni-tarif-bir",
      "yeni-tarif-iki",
      "yeni-tarif-uc",
    ]);
  });

  it("BATCH 3'te tek slug var", () => {
    expect(parseFixture(fixture, "3")).toEqual(["sonraki-tarif"]);
  });

  it("bilinmeyen batch → boş array", () => {
    expect(parseFixture(fixture, "99")).toEqual([]);
  });

  it("BATCH SONU marker yoksa sonraki BATCH marker'ına kadar alır", () => {
    const noEndMarker = `
      // ── BATCH 2 ──
      { slug: "a-tarif" },
      { slug: "b-tarif" },
      // ── BATCH 3 ──
      { slug: "sonraki" },
    `;
    expect(parseFixture(noEndMarker, "2")).toEqual(["a-tarif", "b-tarif"]);
  });

  it("BATCH SONU ve BATCH N+1 yoksa sona kadar alır", () => {
    const onlyStart = `
      // ── BATCH 5 ──
      { slug: "tek-tarif" },
    `;
    expect(parseFixture(onlyStart, "5")).toEqual(["tek-tarif"]);
  });
});
