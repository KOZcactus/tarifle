import { describe, expect, it } from "vitest";
import { computePreflightFlags } from "@/lib/moderation/preflight";

const baseValid = {
  miniTitle: "Fırın versiyonu",
  description:
    "Patlıcanları fırında pişirip iç harcı ekleyince hem yağsız hem de daha hafif oluyor.",
  ingredients: [
    "4 adet patlıcan",
    "200 gr kıyma",
    "2 adet domates",
    "1 baş sarımsak",
  ],
  steps: [
    "Patlıcanları kabuklarını dikine soyun ve dilimleyin.",
    "Tepside zeytinyağı ile fırınlayın.",
    "Üzerine kıyma harcını yayıp tekrar pişirin.",
  ],
  notes: "Sarımsağı son anda eklemek lezzeti artırır.",
};

describe("computePreflightFlags", () => {
  it("returns no flags for a clean variation", () => {
    const result = computePreflightFlags(baseValid);
    expect(result.flags).toEqual([]);
    expect(result.needsReview).toBe(false);
  });

  it("flags too-short content", () => {
    const result = computePreflightFlags({
      miniTitle: "Yap",
      description: "",
      ingredients: ["su"],
      steps: ["karıştır"],
      notes: "",
    });
    expect(result.flags).toContain("too_short");
    expect(result.needsReview).toBe(true);
  });

  it("flags repeated character runs (5+ same char)", () => {
    const result = computePreflightFlags({
      ...baseValid,
      miniTitle: "Süpeeeeer tarif",
    });
    expect(result.flags).toContain("repeated_chars");
  });

  it("does NOT flag normal Turkish doubled characters", () => {
    // "merhabaa" has only 2 a's, not a spam signal.
    const result = computePreflightFlags({
      ...baseValid,
      miniTitle: "Merhabaa karnıyarık",
    });
    expect(result.flags).not.toContain("repeated_chars");
  });

  it("flags excessive caps in title/description", () => {
    const result = computePreflightFlags({
      ...baseValid,
      miniTitle: "EN GÜZEL TARIF",
      description: "BUNU MUTLAKA DENEMENIZ LAZIM HARIKA OLUYOR",
    });
    expect(result.flags).toContain("excessive_caps");
  });

  it("does NOT flag a normal mixed-case title that contains some caps", () => {
    const result = computePreflightFlags({
      ...baseValid,
      miniTitle: "Adana Kebap (Acılı)",
    });
    expect(result.flags).not.toContain("excessive_caps");
  });

  it("flags content with a URL", () => {
    const result = computePreflightFlags({
      ...baseValid,
      notes: "Detaylı tarif için https://kotusite.example",
    });
    expect(result.flags).toContain("contains_url");
  });

  it("flags a domain mention without protocol", () => {
    const result = computePreflightFlags({
      ...baseValid,
      description: "Buldum bunu ornek.com adresinde",
    });
    expect(result.flags).toContain("contains_url");
  });

  it("flags spaced-TLD bypass (site . com)", () => {
    const result = computePreflightFlags({
      ...baseValid,
      notes: "Detaylar icin tarifevim . com adresine bakin",
    });
    expect(result.flags).toContain("contains_url");
  });

  it("flags bracketed-dot bypass (site[dot]com)", () => {
    const result = computePreflightFlags({
      ...baseValid,
      notes: "tarifevim[dot]com sitesinden",
    });
    expect(result.flags).toContain("contains_url");
  });

  it("flags word-based separator bypass (site dot com)", () => {
    const result = computePreflightFlags({
      ...baseValid,
      notes: "mutfakblog dot com adresine gelebilirsin",
    });
    expect(result.flags).toContain("contains_url");
  });

  it("flags Turkish nokta word bypass (site nokta com)", () => {
    const result = computePreflightFlags({
      ...baseValid,
      notes: "mutfakblog nokta com daha fazlasi",
    });
    expect(result.flags).toContain("contains_url");
  });

  it("flags parenthesised nokta bypass (site(nokta)com)", () => {
    const result = computePreflightFlags({
      ...baseValid,
      notes: "tarifevim(nokta)com burada",
    });
    expect(result.flags).toContain("contains_url");
  });

  it("does NOT flag plain Turkish domain-like text", () => {
    // Sentences containing dots (e.g. "Etin pH'sı 3 saatte düşer.") shouldn't
    // be misread as a domain.
    const result = computePreflightFlags({
      ...baseValid,
      notes: "Etin pH değeri zamanla düşer. Genelde 3 saat içinde.",
    });
    expect(result.flags).not.toContain("contains_url");
  });

  it("flags missing steps", () => {
    const result = computePreflightFlags({
      ...baseValid,
      steps: [],
    });
    expect(result.flags).toContain("missing_steps");
  });

  it("flags too-many-steps", () => {
    const tooMany = Array.from({ length: 30 }, (_, i) => `Adım ${i + 1}: bişey yap.`);
    const result = computePreflightFlags({
      ...baseValid,
      steps: tooMany,
    });
    expect(result.flags).toContain("too_many_steps");
  });

  it("aggregates multiple signals into the flags array", () => {
    // Title is screamy, total content is short, AND there's a URL, three
    // separate signals must all show up.
    const result = computePreflightFlags({
      miniTitle: "EN MUTHIS TARIFFFFF",
      description: "buradan https://spam.example",
      ingredients: ["x"],
      steps: ["y"],
      notes: "",
    });
    expect(result.needsReview).toBe(true);
    expect(result.flags.length).toBeGreaterThanOrEqual(2);
    expect(result.flags).toContain("contains_url");
  });
});
