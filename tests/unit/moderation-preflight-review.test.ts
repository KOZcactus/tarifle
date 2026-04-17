import { describe, expect, it } from "vitest";
import { computeReviewPreflightFlags } from "@/lib/moderation/preflight-review";

describe("computeReviewPreflightFlags", () => {
  it("returns no flags for a clean comment", () => {
    const result = computeReviewPreflightFlags({
      comment: "Tarifi denedim, çok lezzetli oldu. Teşekkürler.",
    });
    expect(result.flags).toEqual([]);
    expect(result.needsReview).toBe(false);
  });

  it("returns no flags when comment is null (rating-only submission)", () => {
    const result = computeReviewPreflightFlags({ comment: null });
    expect(result.flags).toEqual([]);
    expect(result.needsReview).toBe(false);
  });

  it("returns no flags for whitespace-only comments", () => {
    const result = computeReviewPreflightFlags({ comment: "   \n  " });
    expect(result.flags).toEqual([]);
    expect(result.needsReview).toBe(false);
  });

  it("flags 5+ repeated characters as spam pattern", () => {
    const result = computeReviewPreflightFlags({
      comment: "Çooooook güzeldi, bayıldım.",
    });
    expect(result.flags).toContain("repeated_chars");
    expect(result.needsReview).toBe(true);
  });

  it("does NOT flag 4-char Turkish emphasis (merhabaaa style)", () => {
    const result = computeReviewPreflightFlags({
      comment: "Harikaa, tarife bayıldım ve tekrar yapacağım.",
    });
    expect(result.flags).not.toContain("repeated_chars");
  });

  it("flags raw URLs", () => {
    const result = computeReviewPreflightFlags({
      comment: "Aynı tarif benim sitemde https://example.com adresinde var.",
    });
    expect(result.flags).toContain("contains_url");
    expect(result.needsReview).toBe(true);
  });

  it("flags obfuscated URLs (site . com)", () => {
    const result = computeReviewPreflightFlags({
      comment: "Daha iyisi mysite . com adresinde, oraya bakın derim.",
    });
    expect(result.flags).toContain("contains_url");
  });

  it("flags obfuscated URLs (site[dot]com)", () => {
    const result = computeReviewPreflightFlags({
      comment: "Başka tarifler için foo[dot]com sitesine bakın lütfen.",
    });
    expect(result.flags).toContain("contains_url");
  });

  it("flags excessive caps (shouting review)", () => {
    const result = computeReviewPreflightFlags({
      comment: "HARİKA BİR TARİF OLDUĞUNU DÜŞÜNÜYORUM KESİNLİKLE DENEYİN.",
    });
    expect(result.flags).toContain("excessive_caps");
    expect(result.needsReview).toBe(true);
  });

  it("does NOT flag normal capitalised proper nouns", () => {
    const result = computeReviewPreflightFlags({
      comment:
        "Annem İzmir'den bu tarifi öğrenmişti, bize Ankara'dan getirmişti sonra.",
    });
    expect(result.flags).not.toContain("excessive_caps");
  });

  it("combines multiple flags when more than one fires", () => {
    const result = computeReviewPreflightFlags({
      comment: "ÇOKKKKK GÜZEL, DETAY İÇİN mysite.com ADRESİNE BAKIN MUHAKKAK.",
    });
    expect(result.flags).toContain("repeated_chars");
    expect(result.flags).toContain("excessive_caps");
    expect(result.flags).toContain("contains_url");
    expect(result.needsReview).toBe(true);
  });
});
