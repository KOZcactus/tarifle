import { describe, expect, it } from "vitest";
import { applyCtx, lowercaseFirstLetterForLocale } from "@/lib/ai/commentary";

describe("lowercaseFirstLetterForLocale", () => {
  it("lowercases first letter in English", () => {
    expect(lowercaseFirstLetterForLocale("You can make it.", "en")).toBe(
      "you can make it.",
    );
  });

  it("preserves English first-person pronoun I followed by space", () => {
    expect(lowercaseFirstLetterForLocale("I couldn't find a match.", "en")).toBe(
      "I couldn't find a match.",
    );
  });

  it("preserves English 'I' in contractions (I'll, I've)", () => {
    expect(lowercaseFirstLetterForLocale("I'll suggest alternatives.", "en")).toBe(
      "I'll suggest alternatives.",
    );
  });

  it("lowercases Turkish dotted İ to dotless-aware i (not i̇)", () => {
    expect(lowercaseFirstLetterForLocale("İki tarif hazır.", "tr")).toBe(
      "iki tarif hazır.",
    );
  });

  it("returns body unchanged when it starts with a placeholder brace", () => {
    expect(lowercaseFirstLetterForLocale("{title} is ready.", "en")).toBe(
      "{title} is ready.",
    );
  });

  it("handles empty string safely", () => {
    expect(lowercaseFirstLetterForLocale("", "en")).toBe("");
  });
});

describe("applyCtx", () => {
  const ctxEn = "From Turkish cuisine, ";
  const ctxTr = "Türk mutfağından ";

  it("strips leading {ctx} token and prepends ctx prefix", () => {
    const result = applyCtx(
      "{ctx}You can make 5 recipes exactly with what you have.",
      ctxEn,
      "en",
    );
    expect(result).toBe(
      "From Turkish cuisine, you can make 5 recipes exactly with what you have.",
    );
  });

  it("prepends ctx even for variants without a {ctx} placeholder", () => {
    const result = applyCtx(
      "Closest option is {title}. Grab {missing} and you're set.",
      ctxEn,
      "en",
    );
    expect(result).toBe(
      "From Turkish cuisine, closest option is {title}. Grab {missing} and you're set.",
    );
  });

  it("keeps EN pronoun I capital after ctx prefix", () => {
    const result = applyCtx(
      "{ctx}I couldn't find a recipe you can make with {count} ingredients.",
      ctxEn,
      "en",
    );
    expect(result).toBe(
      "From Turkish cuisine, I couldn't find a recipe you can make with {count} ingredients.",
    );
  });

  it("lowercases Turkish İ correctly after prefix", () => {
    const result = applyCtx(
      "İki tarif için hiçbir şey eksik değil: {title1} ve {title2}.",
      ctxTr,
      "tr",
    );
    expect(result).toBe(
      "Türk mutfağından iki tarif için hiçbir şey eksik değil: {title1} ve {title2}.",
    );
  });

  it("returns body unchanged when ctx is empty", () => {
    const result = applyCtx(
      "You can make 5 recipes exactly with what you have.",
      "",
      "en",
    );
    expect(result).toBe("You can make 5 recipes exactly with what you have.");
  });

  it("strips only a single leading {ctx} token (not mid-string)", () => {
    const result = applyCtx("Nothing {ctx} here", ctxEn, "en");
    expect(result).toBe("From Turkish cuisine, nothing {ctx} here");
  });

  it("does not double-prepend when template starts with {ctx}", () => {
    const result = applyCtx("{ctx}No match for this combination.", ctxEn, "en");
    expect(result.startsWith("From Turkish cuisine, ")).toBe(true);
    expect(result).not.toContain("{ctx}");
    expect(result.match(/From Turkish cuisine,/g)?.length).toBe(1);
  });

  it("produces a natural combined cuisine + filter prefix in EN", () => {
    const combined = "From Turkish cuisine, in soup category ";
    const result = applyCtx(
      "{ctx}You can make 3 recipes exactly with what you have.",
      combined,
      "en",
    );
    expect(result).toBe(
      "From Turkish cuisine, in soup category you can make 3 recipes exactly with what you have.",
    );
  });
});
