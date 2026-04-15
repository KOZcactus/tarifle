import type { Difficulty, RecipeType } from "@prisma/client";

/**
 * "AI-feel" copy for the daily recipe widget. Entirely rule-based — zero LLM
 * calls — but varied and recipe-aware enough that a casual visitor perceives
 * it as curated. Mirrors the approach in `src/lib/ai/commentary.ts` (same
 * seed-based determinism so reloads are stable).
 *
 * Why rule-based: per `feedback_ai_positioning`, we prefer zero-cost AI-feel
 * over real LLM. The user doesn't notice the difference; we don't add a
 * recurring per-request cost.
 */

/**
 * Multiple opening sentences. One is picked per day via `seed`. Keep the
 * pool small-but-varied: too many = the voice dilutes, too few = feels
 * templated after a week.
 */
const INTRO_VARIANTS: readonly string[] = [
  "Bugün için seçimimiz",
  "Bugün belki bunu denemek istersin",
  "Aklımızda bugün için bu tarif var",
  "Bugünün önerisi",
  "Bugün mutfakta şunu denesek?",
];

/** Features the curator-note rules inspect. Mirror of the recipe fields we need. */
export interface CuratorInput {
  type: RecipeType;
  difficulty: Difficulty;
  totalMinutes: number;
  averageCalories: number | null;
  isFeatured: boolean;
  variationCount: number;
}

/**
 * Rules that map recipe features to a short curator sentence. The list is
 * ordered by specificity — the first rule whose `matches` returns true wins.
 * When multiple specific rules match we deterministically rotate between
 * them using `seed`, so the same day picks the same sentence but different
 * days of the same recipe (if the rotation ever revisits) can differ.
 */
interface Rule {
  /** Stable id for testing + logging. */
  id: string;
  matches: (f: CuratorInput) => boolean;
  /** Usually 1–3 variants; picked via seed when more than one. */
  notes: readonly string[];
}

const RULES: readonly Rule[] = [
  {
    id: "type:tatli",
    matches: (f) => f.type === "TATLI",
    notes: [
      "Tatlı krizini bastırır, misafir gelirse de iş görür.",
      "Ev yapımı tatlı kokusuna karşı koyulmaz.",
    ],
  },
  {
    id: "type:kokteyl",
    matches: (f) => f.type === "KOKTEYL",
    notes: [
      "Hafta sonu geldiğinde bardakları hazırla.",
      "Küçük bir kutlama için fazla emek, büyük bir an için tam kıvamında.",
    ],
  },
  {
    id: "type:corba",
    matches: (f) => f.type === "CORBA",
    notes: [
      "Sıcacık bir başlangıç, soğuk günlerde ilaç gibi.",
      "Günün stresini bir kaşık çorbayla alıp gidiyor.",
    ],
  },
  {
    id: "type:salata",
    matches: (f) => f.type === "SALATA",
    notes: [
      "Sofraya taze bir dokunuş, hem hafif hem doyurucu.",
      "Yan yemek değil, ana yıldız olacak türden bir salata.",
    ],
  },
  {
    id: "type:kahvalti",
    matches: (f) => f.type === "KAHVALTI",
    notes: [
      "Pazar kahvaltısı için biçilmiş kaftan.",
      "Sabahın keyfini birkaç dakikada yükseltir.",
    ],
  },
  {
    id: "type:atistirmalik",
    matches: (f) => f.type === "ATISTIRMALIK",
    notes: ["Ufak ama etkili — film akşamı veya beklenmedik misafir."],
  },
  {
    id: "difficulty:hard",
    matches: (f) => f.difficulty === "HARD",
    notes: [
      "Sabır ister ama sonuç tek kelimeyle etkileyici.",
      "Bir hafta sonu projesi gibi düşün — sofrada karşılığını alırsın.",
    ],
  },
  {
    id: "quick",
    matches: (f) => f.difficulty === "EASY" && f.totalMinutes <= 30,
    notes: [
      "Pratik ve kolay — yorgun günlerin dostu.",
      "Yarım saate kalmayan, doyurucu bir seçenek.",
    ],
  },
  {
    id: "very-quick",
    matches: (f) => f.totalMinutes > 0 && f.totalMinutes <= 20,
    notes: [
      "20 dakikada sofrada — hızlı ama özensiz değil.",
      "Çabuk bir şeyler yapmak istediğinde ilk akla gelen.",
    ],
  },
  {
    id: "light",
    matches: (f) => f.averageCalories !== null && f.averageCalories < 250,
    notes: [
      "Hafif kalmak isteyenlere — tadından ödün vermeden.",
      "Düşük kalorili ama tatmin edici bir seçenek.",
    ],
  },
  {
    id: "hearty",
    matches: (f) => f.averageCalories !== null && f.averageCalories > 500,
    notes: [
      "Doyurucu ve besleyici — açlık bırakmaz.",
      "Uzun bir günün sonunda hak edilmiş bir yemek.",
    ],
  },
  {
    id: "popular-variations",
    matches: (f) => f.variationCount >= 3,
    notes: [
      "Topluluğun denediği, kendi uyarlamalarını eklediği bir tarif.",
      "Kaç farklı yorumunun olduğunu gör — uyarlama sayfasına göz at.",
    ],
  },
  {
    id: "featured",
    matches: (f) => f.isFeatured,
    notes: ["Editör favorisi — sade ama akılda kalıcı bir lezzet."],
  },
];

const FALLBACK_NOTE = "Denemeye değer.";

/**
 * Picks one of the intro sentences deterministically. Exported for unit tests.
 */
export function pickDailyIntro(seed: number): string {
  const i = ((seed % INTRO_VARIANTS.length) + INTRO_VARIANTS.length) % INTRO_VARIANTS.length;
  return INTRO_VARIANTS[i]!;
}

/**
 * Builds the per-recipe curator note. Walks rules in order, grabs the first
 * matcher, then rotates between its `notes` by the provided seed. Falls back
 * to a generic sentence when no rule matches (should be rare — "featured"
 * OR the generic fallback will nearly always cover).
 */
export function buildCuratorNote(features: CuratorInput, seed: number): string {
  for (const rule of RULES) {
    if (!rule.matches(features)) continue;
    if (rule.notes.length === 1) return rule.notes[0]!;
    const i = ((seed % rule.notes.length) + rule.notes.length) % rule.notes.length;
    return rule.notes[i]!;
  }
  return FALLBACK_NOTE;
}

/** Exposed for test introspection. */
export const __INTRO_COUNT = INTRO_VARIANTS.length;
export const __RULE_IDS = RULES.map((r) => r.id);
