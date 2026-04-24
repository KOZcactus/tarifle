import { describe, expect, it } from "vitest";
import { buildIcalString } from "@/lib/ai/menu-ical";
import { buildShareText, buildWhatsAppUrl } from "@/lib/ai/menu-share";
import type { MenuSlot, AiSuggestion } from "@/lib/ai/types";

function mockSuggestion(overrides: Partial<AiSuggestion> = {}): AiSuggestion {
  return {
    recipeId: "r1",
    slug: "test-tarif",
    title: "Test Tarif",
    emoji: "🍳",
    imageUrl: null,
    categoryName: "Kahvaltılıklar",
    cuisine: "tr",
    difficulty: "EASY",
    totalMinutes: 20,
    servingCount: 4,
    averageCalories: 200,
    hungerBar: 5,
    matchScore: 0.9,
    matchedIngredients: ["yumurta"],
    missingIngredients: [],
    tags: ["pratik"],
    ...overrides,
  };
}

function mockSlot(
  dayOfWeek: number,
  mealType: MenuSlot["mealType"],
  recipeOverrides: Partial<AiSuggestion> = {},
): MenuSlot {
  return {
    dayOfWeek,
    mealType,
    recipe: mockSuggestion(recipeOverrides),
  };
}

describe("buildIcalString (v4.3 #12)", () => {
  it("filters null-recipe slots, produces VEVENT per filled", () => {
    const slots: MenuSlot[] = [
      mockSlot(0, "BREAKFAST", { slug: "menemen", title: "Menemen" }),
      mockSlot(0, "LUNCH", { slug: "mercimek", title: "Mercimek" }),
      { dayOfWeek: 1, mealType: "DINNER", recipe: null },
    ];
    const ics = buildIcalString({ slots, weekStartIso: "2026-04-27" });
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("END:VCALENDAR");
    const eventCount = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(eventCount).toBe(2);
    expect(ics).toContain("SUMMARY:Kahvaltı: Menemen");
    expect(ics).toContain("SUMMARY:Öğle: Mercimek");
  });

  it("escapes RFC 5545 special characters in summary + description", () => {
    const slots: MenuSlot[] = [
      mockSlot(0, "DINNER", {
        title: "Et, biber; yoğurt",
        slug: "et-biber-yogurt",
      }),
    ];
    const ics = buildIcalString({ slots, weekStartIso: "2026-04-27" });
    // Comma + semicolon escape
    expect(ics).toContain("Et\\, biber\\; yoğurt");
  });

  it("generates unique UIDs per slot (day+meal+slug)", () => {
    const slots: MenuSlot[] = [
      mockSlot(0, "BREAKFAST", { slug: "a" }),
      mockSlot(0, "LUNCH", { slug: "b" }),
      mockSlot(1, "BREAKFAST", { slug: "a" }),
    ];
    const ics = buildIcalString({ slots, weekStartIso: "2026-04-27" });
    const uids = [...ics.matchAll(/UID:([^\r\n]+)/g)].map((m) => m[1]);
    expect(new Set(uids).size).toBe(uids.length);
  });
});

describe("buildShareText (v4.3 #13)", () => {
  it("groups by day, skips empty days, orders meals B→L→D", () => {
    const slots: MenuSlot[] = [
      mockSlot(0, "DINNER", { slug: "d1", title: "Kebap" }),
      mockSlot(0, "BREAKFAST", { slug: "b1", title: "Menemen" }),
      mockSlot(2, "LUNCH", { slug: "l3", title: "Çorba" }),
    ];
    const text = buildShareText({ slots });
    expect(text).toContain("Pazartesi");
    expect(text).toContain("Çarşamba");
    expect(text).not.toContain("Salı");
    // Meal order in Pazartesi: Kahvaltı before Akşam
    const breakfastIdx = text.indexOf("Kahvaltı");
    const dinnerIdx = text.indexOf("Akşam");
    expect(breakfastIdx).toBeGreaterThan(-1);
    expect(dinnerIdx).toBeGreaterThan(breakfastIdx);
  });

  it("includes recipe URL per slot", () => {
    const slots: MenuSlot[] = [
      mockSlot(0, "BREAKFAST", { slug: "menemen" }),
    ];
    const text = buildShareText({ slots, siteUrl: "https://tarifle.app" });
    expect(text).toContain("https://tarifle.app/tarif/menemen");
  });

  it("buildWhatsAppUrl URL-encodes share text", () => {
    const text = "Bu hafta: pilav & çorba";
    const url = buildWhatsAppUrl(text);
    expect(url).toContain("https://wa.me/?text=");
    expect(url).toContain(encodeURIComponent(text));
  });
});
