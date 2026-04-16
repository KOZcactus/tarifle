/**
 * Natural-language commentary generation for suggestions. Designed to feel
 * conversational and varied so the rule-based provider reads like a real
 * assistant rather than a template.
 *
 * Variation strategy: for each scenario we keep multiple phrasings and pick
 * one pseudo-randomly based on a stable seed (user ingredients), so repeated
 * requests with the same input don't flip wording but different requests feel
 * fresh.
 */
import type { AiSuggestion } from "./types";
import { CUISINE_LABEL, type CuisineCode } from "@/lib/cuisines";

function pick<T>(options: T[], seed: string): T {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  const index = Math.abs(hash) % options.length;
  return options[index];
}

function formatList(items: string[], max = 2): string {
  const trimmed = items.slice(0, max);
  if (items.length <= max) {
    if (trimmed.length === 1) return trimmed[0];
    if (trimmed.length === 2) return `${trimmed[0]} ve ${trimmed[1]}`;
  }
  return `${trimmed.join(", ")} gibi ${items.length - max} malzeme`;
}

/**
 * Build a cuisine context prefix for the commentary. Examples:
 * - cuisines=["tr"] → "Türk mutfağından "
 * - cuisines=["jp","kr"] → "Japon ve Kore mutfağından "
 * - cuisines undefined/empty → "" (no prefix, "Hepsi" mode)
 */
function cuisinePrefix(cuisines?: string[]): string {
  if (!cuisines || cuisines.length === 0) return "";
  const labels = cuisines
    .map((c) => CUISINE_LABEL[c as CuisineCode])
    .filter(Boolean);
  if (labels.length === 0) return "";
  if (labels.length === 1) return `${labels[0]} mutfağından `;
  if (labels.length === 2) return `${labels[0]} ve ${labels[1]} mutfağından `;
  return `${labels.slice(0, 2).join(", ")} ve ${labels.length - 2} mutfak daha arasından `;
}

export function buildOverallCommentary(
  userIngredients: string[],
  results: AiSuggestion[],
  cuisines?: string[],
): string {
  const seed = userIngredients.join("|").toLocaleLowerCase("tr");
  const cp = cuisinePrefix(cuisines);

  if (results.length === 0) {
    return pick(
      [
        `${cp}${userIngredients.length} malzemenle yapılabilecek tarif çıkmadı. Bir iki şey daha ekler misin, yoksa filtreleri gevşetelim mi?`,
        `Bu kombinasyonla eşleşen tarifim yok. Biraz daha malzeme yaz, ya da tür/süre filtrelerini gevşet.`,
        `Elindekinle bir şey bulamadım. Daha temel malzemelerle (yumurta, soğan, domates gibi) dene.`,
      ],
      seed,
    );
  }

  const perfect = results.filter((r) => r.missingIngredients.length === 0);
  const closeCall = results.filter(
    (r) => r.missingIngredients.length > 0 && r.missingIngredients.length <= 2,
  );
  const top = results[0];

  if (perfect.length >= 3) {
    return pick(
      [
        `${cp}${perfect.length} tarifi elindekilerle tam olarak yapabilirsin. Üstte en hızlı olanları bıraktım.`,
        `Güzel bir dolap: ${perfect.length} tarif için alışveriş yapman bile gerekmiyor.`,
        `Neyse ki ${perfect.length} seçeneğin var — hepsi elindekiyle tamam.`,
      ],
      seed,
    );
  }

  if (perfect.length === 2) {
    return pick(
      [
        `${cp}İki tarif için hiçbir şey eksik değil: ${perfect[0].title} ve ${perfect[1].title}. Hangisine ruh halindesin?`,
        `Elindekiyle ${perfect[0].title} veya ${perfect[1].title} yapabilirsin. İkisi de 0 eksik.`,
        `Tam uyum 2 tarifte: ${perfect[0].title} ve ${perfect[1].title}. Gerisi için birkaç şey almak gerek.`,
      ],
      seed,
    );
  }

  if (perfect.length === 1) {
    const p = perfect[0];
    return pick(
      [
        `${cp}${p.title} için hiçbir şey almana gerek yok — tam uyum. Altında birkaç yakın alternatif var.`,
        `Hemen mutfağa gidebilirsin: ${p.title} elindekiyle tamam. Diğerleri için ufak eksikler var.`,
        `Tam çıkan tek tarif: ${p.title}. Alternatif arıyorsan alttakilerden biri için 1-2 malzeme yeter.`,
      ],
      seed,
    );
  }

  if (closeCall.length > 0) {
    const missing = formatList(top.missingIngredients);
    return pick(
      [
        `${cp}Tam eşleşme yok ama ${top.title} için sadece ${missing} eksik — market turu kısa.`,
        `En yakın seçenek ${top.title}. Sadece ${missing} alırsan başlayabilirsin.`,
        `${top.title}'nda ${missing} eksik. Onun dışında her şey elinde.`,
      ],
      seed,
    );
  }

  return pick(
    [
      `${cp}Tam eşleşme çıkmadı, ama ${top.title} en çok malzemeni kullanıyor. Eksikler liste halinde altında.`,
      `En uygun aday ${top.title}. Eksiklerle birlikte aşağıda sıraladım.`,
      `${top.title} iyi bir başlangıç. Neyin eksik olduğunu kartta görebilirsin.`,
    ],
    seed,
  );
}

/**
 * Per-recipe short note. We assign roles based on position and stats so each
 * card has a personality: the best match, the fastest, the ambitious one, etc.
 */
export function assignRecipeNotes(results: AiSuggestion[]): AiSuggestion[] {
  if (results.length === 0) return results;

  // Find reference points
  const fastestIndex = results.reduce(
    (best, r, i) => (r.totalMinutes < results[best].totalMinutes ? i : best),
    0,
  );
  const longestIndex = results.reduce(
    (best, r, i) => (r.totalMinutes > results[best].totalMinutes ? i : best),
    0,
  );

  return results.map((s, i) => {
    const perfect = s.missingIngredients.length === 0;
    const oneMissing = s.missingIngredients.length === 1;
    const twoMissing = s.missingIngredients.length === 2;

    // Highest priority first — first matching rule wins
    let note = "";

    if (i === 0 && perfect) {
      note = pick(
        [
          "En iyi eşleşme. Elindekilerin tamamını değerlendirebilirsin.",
          "Zirvedeki seçenek — tam uyum ve en güçlü sonuç.",
          "Birinci öneri. Hiç eksik yok.",
        ],
        s.recipeId,
      );
    } else if (i === 0 && oneMissing) {
      note = pick(
        [
          `Neredeyse tam — sadece ${s.missingIngredients[0]} almak yeter.`,
          `Tek adım uzakta: ${s.missingIngredients[0]}.`,
          `Bir malzeme eksik (${s.missingIngredients[0]}), gerisi hazır.`,
        ],
        s.recipeId,
      );
    } else if (i === fastestIndex && s.totalMinutes <= 20) {
      note = pick(
        [
          `En hızlı seçenek — ${s.totalMinutes} dakikada sofrada.`,
          `Acele edenlere: ${s.totalMinutes} dakika.`,
          `En çabuk çıkan. Aç gelen misafire ideal.`,
        ],
        s.recipeId,
      );
    } else if (perfect) {
      note = pick(
        [
          "Hiçbir şey eksik değil, bunu da seçebilirsin.",
          "Elinde her şey var — plan B olarak dursun.",
          "Tam çıkanlardan. Alternatif olarak kafana yat.",
        ],
        s.recipeId,
      );
    } else if (oneMissing) {
      note = `Sadece ${s.missingIngredients[0]} eksik.`;
    } else if (twoMissing) {
      note = `${s.missingIngredients[0]} ve ${s.missingIngredients[1]} almak gerek.`;
    } else if (s.difficulty === "HARD" && i < 3) {
      note = pick(
        [
          "Sabır ister ama sonucu etkileyici.",
          "Biraz iddialı — vaktin varsa dene.",
          "Ustalık gerektirir, ancak masaya kim otursa fark eder.",
        ],
        s.recipeId,
      );
    } else if (i === longestIndex && s.totalMinutes >= 60) {
      note = "Uzun pişer ama ocakta unutabilirsin.";
    }

    return { ...s, note };
  });
}
