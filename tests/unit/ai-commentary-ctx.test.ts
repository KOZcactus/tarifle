import { describe, expect, it } from "vitest";
import { applyCtx, lowercaseFirstLetterForLocale } from "@/lib/ai/commentary";
import { isPantryStaple } from "@/lib/ai/matcher";

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

describe("commentary input classification (via isPantryStaple)", () => {
  // The three new branches (pantryOnly/singleIngredient/manyIngredients)
  // classify by filtering pantry staples. These tests pin the classifier
  // boundaries used inside `buildOverallCommentary`.

  const filterReal = (list: string[]) => list.filter((i) => !isPantryStaple(i));

  it("treats an all-pantry list as onlyPantry", () => {
    const input = ["tuz", "karabiber", "su", "zeytinyağı"];
    expect(filterReal(input)).toHaveLength(0);
  });

  it("keeps a real vegetable alongside pantry staples", () => {
    const input = ["tuz", "karabiber", "domates"];
    const real = filterReal(input);
    expect(real).toEqual(["domates"]);
  });

  it("classifies 1 real ingredient + pantry as single-ingredient", () => {
    const input = ["tuz", "zeytinyağı", "tavuk"];
    expect(filterReal(input)).toHaveLength(1);
  });

  it("classifies 15+ real ingredients as many-ingredient", () => {
    // Pantry staples (biber/maydanoz/limon are part of PANTRY_STAPLES) get
    // filtered out, so the non-pantry list has to hit 15 on its own.
    const input = [
      "tuz",
      "zeytinyağı",
      // 16 non-pantry
      "domates",
      "soğan",
      "sarımsak",
      "havuç",
      "patates",
      "nohut",
      "mercimek",
      "makarna",
      "peynir",
      "yumurta",
      "tavuk",
      "pirinç",
      "salatalık",
      "brokoli",
      "kabak",
      "ıspanak",
    ];
    expect(filterReal(input).length).toBeGreaterThanOrEqual(15);
  });

  it("does not treat a compound like 'su kabağı' as pantry (false-positive guard)", () => {
    // This guards against the historical 'su' (water) vs 'su kabağı'
    // (zucchini) confusion, the commentary classifier must not strip
    // 'su kabağı' when the user typed that specifically.
    expect(isPantryStaple("su kabağı")).toBe(false);
  });
});
