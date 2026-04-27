import { describe, test, expect } from "vitest";
import { inferCuisineFromRecipe, CUISINE_CODES, CUISINE_LABEL, CUISINE_FLAG } from "@/lib/cuisines";

// Helper, minimal recipe input with only the fields inference uses
function recipe(
  overrides: Partial<{
    title: string;
    slug: string;
    description: string;
    ingredients: { name: string }[];
  }> = {},
) {
  return {
    title: overrides.title ?? "Test Tarif",
    slug: overrides.slug ?? "test-tarif",
    description: overrides.description ?? "Basit bir test tarifi.",
    ingredients: overrides.ingredients ?? [{ name: "Un" }],
  };
}

describe("inferCuisineFromRecipe", () => {
  // ─── Slug-based inference (highest confidence) ────────────

  test("Japanese slug: sushi → jp", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "somon-sushi" }))).toBe("jp");
  });

  test("Japanese slug: ramen → jp", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "tonkotsu-ramen" }))).toBe("jp");
  });

  test("Korean slug: kimchi → kr", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "kimchi-jjigae" }))).toBe("kr");
  });

  test("Korean slug: bibimbap → kr", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "bibimbap" }))).toBe("kr");
  });

  test("Thai slug: pad-thai → th", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "pad-thai" }))).toBe("th");
  });

  test("Indian slug: tikka-masala → in", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "tavuk-tikka-masala" }))).toBe("in");
  });

  test("Mexican slug: guacamole → mx", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "guacamole" }))).toBe("mx");
  });

  test("Italian slug: carbonara → it", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "spagetti-carbonara" }))).toBe("it");
  });

  test("French slug: ratatouille → fr", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "ratatouille" }))).toBe("fr");
  });

  test("Spanish slug: paella → es", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "deniz-urunleri-paella" }))).toBe("es");
  });

  test("Greek slug: moussaka → gr", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "moussaka" }))).toBe("gr");
  });

  test("Chinese slug: wonton → cn", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "wonton-corbasi" }))).toBe("cn");
  });

  test("American slug: burger → us", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "klasik-burger" }))).toBe("us");
  });

  test("Middle Eastern slug: hummus → me", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "hummus" }))).toBe("me");
  });

  test("North African slug: shakshuka → ma", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "shakshuka" }))).toBe("ma");
  });

  // ─── Title keyword inference ──────────────────────────────

  test("title with İtalyan → it", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({ title: "İtalyan Usulü Domates Çorbası", slug: "italyan-domates-corbasi" }),
      ),
    ).toBe("it");
  });

  test("title with Japon → jp", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({ title: "Japon Omlet", slug: "japon-omlet" }),
      ),
    ).toBe("jp");
  });

  test("title with Hint → in", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({ title: "Hint Usulü Mercimek", slug: "hint-mercimek" }),
      ),
    ).toBe("in");
  });

  // ─── Description keyword inference ────────────────────────

  test("description with Fransız → fr", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({
          slug: "bademli-kek",
          description: "Fransız mutfağının zarif tatlısı.",
        }),
      ),
    ).toBe("fr");
  });

  test("description with Kore → kr", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({
          slug: "acili-tavuk",
          description: "Kore usulü acılı tavuk sosu.",
        }),
      ),
    ).toBe("kr");
  });

  // ─── New cuisines (batch 6+) ───────────────────────────────

  test("Vietnamese slug: pho-bo → vn", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "pho-bo" }))).toBe("vn");
  });

  test("Vietnamese slug: banh-mi → vn", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "banh-mi" }))).toBe("vn");
  });

  test("Vietnamese title keyword → vn", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({ title: "Vietnam Buzlu Kahvesi", slug: "vietnam-buzlu-kahvesi" }),
      ),
    ).toBe("vn");
  });

  test("Brazilian slug: feijoada → br", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "feijoada" }))).toBe("br");
  });

  test("Brazilian slug: brigadeiro → br", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "brigadeiro" }))).toBe("br");
  });

  test("Cuban slug: ropa-vieja → cu", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "ropa-vieja" }))).toBe("cu");
  });

  test("Cuban slug: tostones → cu", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "tostones" }))).toBe("cu");
  });

  test("Russian slug: borscht → ru", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "borscht" }))).toBe("ru");
  });

  test("Russian slug: pelmeni → ru", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "pelmeni" }))).toBe("ru");
  });

  test("Hungarian slug: langos → hu", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "langos" }))).toBe("hu");
  });

  test("Hungarian slug: chicken-paprikash → hu", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "chicken-paprikash" }))).toBe("hu");
  });

  test("Scandinavian slug: gravlax → se", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "gravlax" }))).toBe("se");
  });

  test("Scandinavian slug: kanelbulle → se", () => {
    expect(inferCuisineFromRecipe(recipe({ slug: "kanelbulle" }))).toBe("se");
  });

  test("Scandinavian title keyword → se", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({ title: "İskandinav Somon Salatası", slug: "iskandinav-somon" }),
      ),
    ).toBe("se");
  });

  // ─── Tunisian + Argentine (oturum 25) ──────────────────────

  test("Tunisian title keyword → tn", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({ title: "Tunus Usulü Brik", slug: "tunus-brik" }),
      ),
    ).toBe("tn");
  });

  test("Argentine title keyword → ar", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({ title: "Arjantin Usulü Asado", slug: "arjantin-asado" }),
      ),
    ).toBe("ar");
  });

  test("Argentine description keyword (asado) → ar", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({
          slug: "kasarli-tost",
          description: "Pampas asado kültüründen esinlenmiş bir tarif.",
        }),
      ),
    ).toBe("ar");
  });

  // ─── Default to Turkish ───────────────────────────────────

  test("no international markers → default tr", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({
          title: "Kuru Fasulye",
          slug: "kuru-fasulye",
          description: "Geleneksel Türk mutfağının vazgeçilmez yemeği.",
        }),
      ),
    ).toBe("tr");
  });

  test("generic recipe without any cuisine hint → tr", () => {
    expect(
      inferCuisineFromRecipe(
        recipe({
          title: "Patates Kızartması",
          slug: "patates-kizartmasi",
          description: "Çıtır çıtır patates kızartması tarifi.",
        }),
      ),
    ).toBe("tr");
  });

  // ─── Slug priority over description ───────────────────────

  test("slug match takes priority over description keyword", () => {
    // Slug says sushi (jp) but description mentions İtalyan
    expect(
      inferCuisineFromRecipe(
        recipe({
          slug: "sushi-deneme",
          description: "İtalyan esintili bir sushi denemesi.",
        }),
      ),
    ).toBe("jp");
  });
});

describe("cuisine constants", () => {
  test("CUISINE_CODES has 35 entries", () => {
    expect(CUISINE_CODES).toHaveLength(35);
  });

  test("every code has a label", () => {
    for (const code of CUISINE_CODES) {
      expect(CUISINE_LABEL[code]).toBeTruthy();
    }
  });

  test("every code has a flag", () => {
    for (const code of CUISINE_CODES) {
      expect(CUISINE_FLAG[code]).toBeTruthy();
    }
  });
});
