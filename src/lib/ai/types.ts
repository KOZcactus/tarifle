import type { Difficulty, RecipeType } from "@prisma/client";
import type { PantryMatchSummary, PantryStockItem } from "@/lib/pantry/match";

/**
 * Input a user provides to the AI assistant.
 */
export interface AiSuggestInput {
  /** Raw ingredient names the user has at home, untrimmed, case-insensitive. */
  ingredients: string[];
  /** Recipe category filter. */
  type?: RecipeType;
  /** Maximum total cooking time (in minutes). */
  maxMinutes?: number;
  /** Target difficulty. */
  difficulty?: Difficulty;
  /** If true, common pantry staples (tuz, karabiber, su, yağ) are assumed on hand. */
  assumePantryStaples?: boolean;
  /** Cuisine filter, recipe.cuisine must match one of these codes.
   *  Empty/undefined = no filter (all cuisines, "Hepsi" mode). */
  cuisines?: string[];
  /** Ingredients to exclude, any recipe containing a matching ingredient
   *  is disqualified regardless of match score. */
  excludeIngredients?: string[];
  /** Diet slug filter (vegan / vejetaryen / glutensiz / sutsuz / alkolsuz).
   *  vegan/vejetaryen/alkolsuz tag bazlı filtre, glutensiz/sutsuz allergen
   *  exclusion. Empty/undefined = kısıt yok. */
  dietSlug?: string;
  /** E: "Beğenmedim, farklı dene" akışında reddedilen slug'lar. Her
   *  tıklamada önceki sonuçlardaki slug'lar bu listeye eklenir; provider
   *  sonuçlardan bunları çıkarır. Max 60 ile sınırlı (schema guard). */
  excludeSlugs?: string[];
  /** E: Reddet sayacı, kaç kez "Beğenmedim" tıklandı? 2+ ise UI filter
   *  paneline doğru hint banner gösterir. Provider bilmez, sadece log. */
  rejectRound?: number;
}

/**
 * A single suggested recipe with commentary.
 */
export interface AiSuggestion {
  recipeId: string;
  slug: string;
  title: string;
  emoji: string | null;
  imageUrl: string | null;
  categoryName: string;
  cuisine: string | null;
  difficulty: Difficulty;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  /** Açlık barı, 1-10 porsiyon başı tokluk. "En tok" sort + acıktım
   *  senaryosunda kullanılır. Null = hesaplanmamış (retrofit bekler). */
  hungerBar: number | null;
  /** 0..1, ratio of recipe ingredients the user already has. */
  matchScore: number;
  /** Ingredient names the user had that matched this recipe. */
  matchedIngredients: string[];
  /** Ingredient names the user needs to buy. */
  missingIngredients: string[];
  /** v4.3+ quantity-aware pantry match summary. Only present when
   *  WeeklyMenuInput.pantryStock supplied. UI shopping diff'te miktar
   *  detay icin kullanilir. */
  pantryMatch?: PantryMatchSummary;
  /** Recipe tag slugs for display (pratik, 30-dakika-alti, vegan...). */
  tags: string[];
  /** v4.4+ kullanicinin diyet profili varsa pre-computed RecipeDietScore'tan
   *  enjekte edilen kompakt skor verisi (oturum 20, DIET_SCORE_PLAN). Suggest
   *  + menu planner action'larinda inject edilir, UI'da kart kosenle chip. */
  dietBadge?: {
    score: number;
    rating: "excellent" | "good" | "fair" | "weak" | "poor";
    isBeta: boolean;
  };
  /** Optional per-recipe AI commentary (empty for rule-based provider). */
  note?: string;
  /** Kural tabanlı explain chip'ler, "neden bu tarif" bilgisi. Kısa (4
   *  kelimeden az), localize edilmiş. UI chip olarak sıralar. Örn:
   *  [{kind:"pantry", text:"Tek eksik: un"}, {kind:"time", text:"⚡ 18 dakikada hazır"}].
   *  v3 sıkılaştırma eklendi, v4.3'te kind eklendi (UI renk + emoji prefix). */
  reasons?: AiReason[];
}

/** AI reason chip kategorisi. UI kind'a göre renk + emoji verir:
 *   - "time": ⏱ mavi (süre urgency)
 *   - "pantry": 🧺 yeşil (dolap uyumu)
 *   - "cuisine": 🌍 mor (mutfak + diyet bağlam, şu an reserve) */
export type AiReasonKind = "time" | "pantry" | "cuisine";
export interface AiReason {
  kind: AiReasonKind;
  text: string;
}

/**
 * Aggregated response from an AI provider.
 */
export interface AiSuggestResponse {
  /** Top suggestions sorted by matchScore descending. */
  suggestions: AiSuggestion[];
  /** Provider-level commentary / summary shown above the results (optional). */
  commentary?: string;
  /** Which provider handled this request, useful for UI badges and logs. */
  provider: "rule-based" | "claude-haiku";
}

/**
 * AI provider abstraction. Swap implementations by changing the factory.
 */
export interface AiProvider {
  readonly name: AiSuggestResponse["provider"];
  suggest(input: AiSuggestInput): Promise<AiSuggestResponse>;
}

// ── AI v4 (Weekly Menu Planner) ────────────────────────────────────

/**
 * Macro preference: optional scoring layer on top of pantry matching.
 * "high-protein" and "high-fiber" are currently tag-based heuristics
 * with a nutrition fallback; "low-calorie" uses Recipe.averageCalories.
 * Omit or "none" = disabled, planner falls back to the v4.1 ordering.
 */
export type MacroPreference =
  | "none"
  | "high-protein"
  | "low-calorie"
  | "high-fiber";

/**
 * Input for planning a full 7-day menu (3 meals × 7 days = 21 slots).
 * Reuses AiSuggestInput pantry + diet filters, adds menu-specific options.
 */
export interface WeeklyMenuInput {
  /** Pantry ingredients the user has at home. */
  ingredients: string[];
  /** If true, common staples (tuz/yağ/su/karabiber) assumed available. */
  assumePantryStaples?: boolean;
  /** Optional cuisine filter. Empty = all cuisines allowed. */
  cuisines?: string[];
  /** Optional diet slug (vegan/vejetaryen/glutensiz/sutsuz/alkolsuz). */
  dietSlug?: string;
  /** Ingredients to exclude (any recipe containing them is skipped). */
  excludeIngredients?: string[];
  /** Person count (adjusts scaling notes, doesn't filter). Default 2. */
  personCount?: number;
  /** Max time per breakfast meal (minutes). Default 25 (quick mornings). */
  maxBreakfastMinutes?: number;
  /** Max time per lunch meal (minutes). Default 45. */
  maxLunchMinutes?: number;
  /** Max time per dinner meal (minutes). Default 60. */
  maxDinnerMinutes?: number;
  /** Deterministic seed for reproducible plans (test + replay). */
  seed?: string;
  /** Optional macro bias to weight recipe picking. */
  macroPreference?: MacroPreference;
  /** v4.3 anti-repeat: son 14 gün içinde önerilmiş slug'lar, planner
   *  bu pool'dan seçmez. Client localStorage history'den gelir. */
  excludeSlugs?: string[];
  /** v4.3+ miktar farkindaligi: kullanici UserPantry stock'unu server'a
   *  gecirir (quantity + unit ile). Varsa planner her aday icin
   *  computePantryMatch ile quantity-aware summary hesaplar. Yoksa
   *  eski binary match korunur. */
  pantryStock?: PantryStockItem[];
  /** v4.3+ filter: true ise sadece pantry'nin tam (veya yeterince)
   *  karsiladigi adaylari plana al. `pantryStock` gereklidir, yoksa
   *  sessizce gormezden gelinir. */
  requireFullyStocked?: boolean;
}

/** One slot in the 7×3 grid. */
export interface MenuSlot {
  /** 0 = Monday ... 6 = Sunday. */
  dayOfWeek: number;
  /** Fixed meal type. */
  mealType: "BREAKFAST" | "LUNCH" | "DINNER";
  /** Filled recipe (null if algorithm couldn't find a match under filters). */
  recipe: AiSuggestion | null;
  /** Rule-based note explaining why this slot got this recipe. */
  reason?: string;
}

export interface WeeklyMenuResponse {
  /** 21 slots, sorted by dayOfWeek then mealType. */
  slots: MenuSlot[];
  /** Overall commentary (e.g. "Bu hafta 4 farklı mutfak, 7 farklı kategori"). */
  commentary?: string;
  /** How many slots could not be filled (pantry too narrow / filters too strict). */
  unfilledCount: number;
  /** Provider identifier. */
  provider: "rule-based" | "claude-haiku";
}

/** AI menu planner abstraction, parallel to AiProvider. */
export interface AiMenuPlanner {
  readonly name: WeeklyMenuResponse["provider"];
  plan(input: WeeklyMenuInput): Promise<WeeklyMenuResponse>;
}
