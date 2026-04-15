/**
 * Unit tests for the similar-recipes scoring algorithm. The DB-touching
 * path (`getSimilarRecipes`) needs a live Postgres; the pure scorer
 * (`scoreCandidates`) captures the actual signal matrix and merits
 * coverage.
 */
import { describe, it, expect } from "vitest";
import {
  scoreCandidates,
  type SimilarTarget,
} from "../../src/lib/queries/similar-recipes";

function c(overrides: {
  id: string;
  title?: string;
  categoryId?: string;
  type?: string;
  difficulty?: string;
  createdAt?: Date;
  tagSlugs?: string[];
}) {
  return {
    id: overrides.id,
    title: overrides.title ?? `Recipe ${overrides.id}`,
    categoryId: overrides.categoryId ?? "cat-different",
    type: overrides.type ?? "TATLI",
    difficulty: overrides.difficulty ?? "EASY",
    createdAt: overrides.createdAt ?? new Date("2026-01-01"),
    tagSlugs: overrides.tagSlugs ?? [],
  };
}

const target: SimilarTarget = {
  id: "target",
  categoryId: "cat-yemek",
  type: "YEMEK",
  difficulty: "MEDIUM",
  tagSlugs: ["misafir-sofrasi", "yuksek-protein", "firinda"],
};

describe("scoreCandidates — ağırlıklar", () => {
  it("aynı kategori +3 puan", () => {
    const r = scoreCandidates(target, [
      c({ id: "same-cat", categoryId: "cat-yemek", type: "ICECEK" }),
    ]);
    expect(r).toHaveLength(1);
    expect(r[0]?.score).toBe(3);
  });

  it("aynı type +2 puan", () => {
    const r = scoreCandidates(target, [
      c({ id: "same-type", categoryId: "cat-xxx", type: "YEMEK" }),
    ]);
    expect(r[0]?.score).toBe(2);
  });

  it("aynı difficulty +0.5", () => {
    const r = scoreCandidates(target, [
      c({ id: "same-diff", categoryId: "cat-xxx", type: "TATLI", difficulty: "MEDIUM", tagSlugs: ["firinda"] }),
    ]);
    // +0.5 (difficulty) + 1 (shared tag "firinda") = 1.5
    expect(r[0]?.score).toBe(1.5);
  });

  it("her ortak tag +1 (max 3 shared = +3)", () => {
    const r = scoreCandidates(target, [
      c({
        id: "all-tags",
        categoryId: "cat-xxx",
        type: "ICECEK",
        tagSlugs: ["misafir-sofrasi", "yuksek-protein", "firinda"],
      }),
    ]);
    expect(r[0]?.score).toBe(3);
  });

  it("yalnızca farklı tag'lar ortak değildir → 0 skor → elenir", () => {
    const r = scoreCandidates(target, [
      c({
        id: "no-signal",
        categoryId: "cat-xxx",
        type: "ICECEK",
        difficulty: "EASY",
        tagSlugs: ["vegan", "yaz-tarifi"],
      }),
    ]);
    expect(r).toHaveLength(0);
  });

  it("kombinasyon: kategori + type + 2 tag + difficulty = 3+2+2+0.5 = 7.5", () => {
    const r = scoreCandidates(target, [
      c({
        id: "max-match",
        categoryId: "cat-yemek",
        type: "YEMEK",
        difficulty: "MEDIUM",
        tagSlugs: ["misafir-sofrasi", "firinda"],
      }),
    ]);
    expect(r[0]?.score).toBe(7.5);
  });
});

describe("scoreCandidates — sıralama", () => {
  it("score desc önce", () => {
    const r = scoreCandidates(target, [
      c({ id: "low", categoryId: "cat-yemek", type: "ICECEK" }), // +3
      c({ id: "high", categoryId: "cat-yemek", type: "YEMEK" }), // +5
    ]);
    expect(r.map((x) => x.id)).toEqual(["high", "low"]);
  });

  it("aynı score'da daha yeni önce", () => {
    const r = scoreCandidates(target, [
      c({
        id: "older",
        categoryId: "cat-yemek",
        createdAt: new Date("2026-01-01"),
      }),
      c({
        id: "newer",
        categoryId: "cat-yemek",
        createdAt: new Date("2026-03-01"),
      }),
    ]);
    expect(r.map((x) => x.id)).toEqual(["newer", "older"]);
  });

  it("aynı score aynı tarih → TR alfabetik sort", () => {
    const date = new Date("2026-01-01");
    const r = scoreCandidates(target, [
      c({ id: "b", title: "Şiş Kebap", categoryId: "cat-yemek", createdAt: date }),
      c({ id: "a", title: "Adana Kebap", categoryId: "cat-yemek", createdAt: date }),
    ]);
    expect(r.map((x) => x.id)).toEqual(["a", "b"]);
  });
});

describe("scoreCandidates — kenar durumlar", () => {
  it("kendi ID'sini sonuçta göstermez", () => {
    const r = scoreCandidates(target, [
      c({ id: "target", categoryId: "cat-yemek" }),
      c({ id: "other", categoryId: "cat-yemek" }),
    ]);
    expect(r.map((x) => x.id)).toEqual(["other"]);
  });

  it("boş aday listesi → boş sonuç", () => {
    expect(scoreCandidates(target, [])).toEqual([]);
  });

  it("hepsi signal'siz → boş sonuç (hiçbir kart gösterilmez)", () => {
    const r = scoreCandidates(target, [
      c({ id: "a", categoryId: "cat-xxx", type: "TATLI", difficulty: "HARD" }),
      c({ id: "b", categoryId: "cat-zzz", type: "ICECEK", difficulty: "EASY" }),
    ]);
    expect(r).toEqual([]);
  });
});
