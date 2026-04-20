/**
 * Unit tests for the batch pre-flight validator's semantic layer. These
 * guard the regex-based muğlak ifade detection, TR normalisation, kcal/
 * makro check, and alcohol-tag cross-check, the parts that catch Codex
 * format drift BEFORE the seed script runs.
 *
 * Pure helpers are exported from scripts/validate-batch.ts; importing
 * the module does NOT run the CLI (entrypoint guard). We stub a minimal
 * SeedRecipe shape rather than coupling tests to the full Zod type.
 */
import { describe, it, expect } from "vitest";
import {
  normalize,
  findForbidden,
  ERROR_PATTERN,
  WARN_PATTERN,
  runSemanticChecks,
} from "../../scripts/validate-batch";
import type { SeedRecipe } from "../../src/lib/seed/recipe-schema";

function makeRecipe(overrides: Partial<SeedRecipe> = {}): SeedRecipe {
  return {
    title: "Test Tarifi",
    slug: "test-tarifi",
    emoji: null,
    description:
      "Bu test için uydurulmuş uzunca bir açıklama cümlesi, en az yirmi karakter.",
    categorySlug: "et-yemekleri",
    type: "YEMEK",
    difficulty: "EASY",
    prepMinutes: 10,
    cookMinutes: 20,
    totalMinutes: 30,
    servingCount: 2,
    averageCalories: null,
    protein: null,
    carbs: null,
    fat: null,
    isFeatured: false,
    tipNote: null,
    servingSuggestion: null,
    tags: [],
    allergens: [],
    translations: null,
    ingredients: [
      { name: "Su", amount: "1", unit: "bardak", sortOrder: 1 },
    ],
    steps: [{ stepNumber: 1, instruction: "Kaynat." }],
    ...overrides,
  } as SeedRecipe;
}

describe("normalize()", () => {
  it("aksanlı TR karakterleri ASCII'ye çevirir", () => {
    expect(normalize("Şerbet şekeri")).toBe("serbet sekeri");
    expect(normalize("BÜTÇE DOSTU")).toBe("butce dostu");
    expect(normalize("ığĞİöÖü")).toBe("iggioou");
  });

  it("lowercase yapar", () => {
    expect(normalize("BIRAZ")).toBe("biraz");
    expect(normalize("İyice")).toBe("iyice");
  });
});

describe("findForbidden(), muğlak ifade tespiti", () => {
  it("ERROR kelimeleri (biraz/epey/ya da tersi) bulur", () => {
    expect(findForbidden("Biraz tuz ekleyin.", ERROR_PATTERN)).toBe("biraz");
    expect(findForbidden("Epey bekletin.", ERROR_PATTERN)).toBe("epey");
    expect(findForbidden("Soğuk ya da tersi olabilir.", ERROR_PATTERN)).toBe(
      "ya da tersi",
    );
    expect(findForbidden("Duruma göre karar verin.", ERROR_PATTERN)).toBe(
      "duruma gore",
    );
  });

  it("kelime sınırı saygılı, 'bırakın' 'biraz' olarak eşleşmez", () => {
    expect(findForbidden("Soğumaya bırakın.", ERROR_PATTERN)).toBeNull();
    expect(findForbidden("Hazırlayın.", ERROR_PATTERN)).toBeNull();
  });

  it("WARNING kelimeleri (iyice/güzelce) ayrı pattern'de", () => {
    expect(findForbidden("İyice karıştırın.", WARN_PATTERN)).toBe("iyice");
    expect(findForbidden("Güzelce yıkayın.", WARN_PATTERN)).toBe("guzelce");
    expect(findForbidden("İyice karıştırın.", ERROR_PATTERN)).toBeNull();
  });

  it("null/undefined input'ta null döner", () => {
    expect(findForbidden(null, ERROR_PATTERN)).toBeNull();
    expect(findForbidden(undefined, ERROR_PATTERN)).toBeNull();
    expect(findForbidden("", ERROR_PATTERN)).toBeNull();
  });
});

describe("runSemanticChecks(), muğlak ifade", () => {
  it("description'da 'biraz' varsa ERROR verir", () => {
    const r = makeRecipe({
      description: "Yirmi karakter üzeri bir açıklama, biraz tuzlu bir yemek.",
    });
    const issues = runSemanticChecks(r);
    const err = issues.find(
      (i) => i.field === "description" && i.severity === "ERROR",
    );
    expect(err).toBeDefined();
    expect(err?.message).toContain("biraz");
  });

  it("step.instruction'da 'iyice' varsa WARNING verir", () => {
    const r = makeRecipe({
      steps: [
        {
          stepNumber: 1,
          instruction: "Karışımı iyice çırpın.",
        },
      ],
    });
    const issues = runSemanticChecks(r);
    const warn = issues.find((i) => i.severity === "WARNING");
    expect(warn).toBeDefined();
    expect(warn?.field).toContain("steps[0].instruction");
  });

  it("alan başına yalnızca ilk eşleşmeyi raporlar (gürültü önleme)", () => {
    const r = makeRecipe({
      tipNote: "Biraz tuz, biraz da biber ekleyin.",
    });
    const issues = runSemanticChecks(r);
    const tipIssues = issues.filter((i) => i.field === "tipNote");
    expect(tipIssues.length).toBe(1);
  });
});

describe("runSemanticChecks(), kcal/makro uyumu", () => {
  it("4·P + 4·C + 9·F vs kcal uyumluysa issue yok", () => {
    // 30 protein * 4 + 20 carbs * 4 + 15 fat * 9 = 335 kcal
    const r = makeRecipe({
      averageCalories: 340,
      protein: 30,
      carbs: 20,
      fat: 15,
    });
    const issues = runSemanticChecks(r);
    expect(issues.filter((i) => i.field === "averageCalories")).toHaveLength(
      0,
    );
  });

  it("%15'ten fazla sapma varsa WARNING verir", () => {
    // 10 protein * 4 + 10 carbs * 4 + 5 fat * 9 = 125 kcal
    // averageCalories = 400 → %68 sapma
    const r = makeRecipe({
      averageCalories: 400,
      protein: 10,
      carbs: 10,
      fat: 5,
    });
    const issues = runSemanticChecks(r);
    const macro = issues.find((i) => i.field === "averageCalories");
    expect(macro?.severity).toBe("WARNING");
    expect(macro?.message).toMatch(/125 kcal/);
  });

  it("alkollü tariflerde makro kontrolü atlanır (ethanol 7 kcal/gr)", () => {
    // Kokteyl: düşük makro, yüksek kcal normal
    const r = makeRecipe({
      averageCalories: 200,
      protein: 0,
      carbs: 10,
      fat: 0,
      tags: ["alkollu"],
      ingredients: [
        { name: "Votka", amount: "45", unit: "ml", sortOrder: 1 },
        { name: "Limon suyu", amount: "15", unit: "ml", sortOrder: 2 },
      ],
    });
    const issues = runSemanticChecks(r);
    expect(issues.filter((i) => i.field === "averageCalories")).toHaveLength(
      0,
    );
  });

  it("herhangi bir makro eksikse sessizce atlar", () => {
    const r = makeRecipe({
      averageCalories: 500,
      protein: 30,
      carbs: null,
      fat: 20,
    });
    const issues = runSemanticChecks(r);
    expect(issues.filter((i) => i.field === "averageCalories")).toHaveLength(
      0,
    );
  });
});

describe("runSemanticChecks(), alkol tag tutarlılığı", () => {
  it("alkollü malzeme var + 'alkollu' tag yok → ERROR", () => {
    const r = makeRecipe({
      tags: [],
      ingredients: [
        { name: "Votka", amount: "45", unit: "ml", sortOrder: 1 },
      ],
    });
    const issues = runSemanticChecks(r);
    const err = issues.find(
      (i) => i.field === "tags" && i.severity === "ERROR",
    );
    expect(err).toBeDefined();
    expect(err?.message).toContain("18+");
  });

  it("'alkollu' tag var + alkollü malzeme yok → WARNING", () => {
    const r = makeRecipe({
      tags: ["alkollu"],
      ingredients: [{ name: "Limon suyu", amount: "30", unit: "ml", sortOrder: 1 }],
    });
    const issues = runSemanticChecks(r);
    const warn = issues.find(
      (i) => i.field === "tags" && i.severity === "WARNING",
    );
    expect(warn).toBeDefined();
  });

  it("ikisi birden varsa / ikisi birden yoksa issue yok", () => {
    const coherentAlcoholic = makeRecipe({
      tags: ["alkollu"],
      ingredients: [{ name: "Rom", amount: "45", unit: "ml", sortOrder: 1 }],
    });
    expect(
      runSemanticChecks(coherentAlcoholic).filter((i) => i.field === "tags"),
    ).toHaveLength(0);

    const coherentSober = makeRecipe({
      tags: [],
      ingredients: [{ name: "Su", amount: "1", unit: "bardak", sortOrder: 1 }],
    });
    expect(
      runSemanticChecks(coherentSober).filter((i) => i.field === "tags"),
    ).toHaveLength(0);
  });
});

describe("runSemanticChecks(), slug çakışması", () => {
  it("existingSlugs set'inde slug varsa ERROR", () => {
    const r = makeRecipe({ slug: "adana-kebap" });
    const issues = runSemanticChecks(r, new Set(["adana-kebap", "baklava"]));
    const err = issues.find((i) => i.field === "slug");
    expect(err?.severity).toBe("ERROR");
  });

  it("set null ise kontrol atlanır", () => {
    const r = makeRecipe({ slug: "adana-kebap" });
    const issues = runSemanticChecks(r, null);
    expect(issues.filter((i) => i.field === "slug")).toHaveLength(0);
  });

  it("set'te yoksa issue yok", () => {
    const r = makeRecipe({ slug: "yeni-tarif" });
    const issues = runSemanticChecks(r, new Set(["adana-kebap"]));
    expect(issues.filter((i) => i.field === "slug")).toHaveLength(0);
  });
});
