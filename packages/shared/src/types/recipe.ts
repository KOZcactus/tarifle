/**
 * Recipe domain types, web + mobile shared.
 *
 * Backend Prisma şeması ile uyumlu, ama mobile/web client tarafında
 * kullanılan minimum subset. Backend full schema: prisma/schema.prisma.
 */

export type RecipeType =
  | "YEMEK"
  | "CORBA"
  | "TATLI"
  | "KAHVALTI"
  | "ATISTIRMALIK"
  | "APERATIF"
  | "SALATA"
  | "SOS"
  | "ICECEK"
  | "KOKTEYL";

export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export type Allergen =
  | "GLUTEN"
  | "SUT"
  | "YUMURTA"
  | "KUSUYEMIS"
  | "YER_FISTIGI"
  | "SOYA"
  | "SUSAM"
  | "KEREVIZ"
  | "HARDAL"
  | "DENIZ_URUNLERI";

export type CuisineCode =
  | "tr" | "it" | "fr" | "es" | "gr" | "jp" | "cn" | "kr" | "th" | "in"
  | "mx" | "us" | "vn" | "gb" | "pt" | "br" | "pe" | "ru" | "hu" | "ma"
  | "me" | "se" | "no" | "dk" | "fi" | "cl" | "ge" | "at" | "ca" | "pl"
  | "cu" | "au" | "de" | "id" | "ng" | "et" | "pk" | "tn" | "ir" | "ar" | "za";

export interface RecipeIngredient {
  name: string;
  amount: string;
  unit?: string | null;
  isOptional?: boolean;
}

export interface RecipeStep {
  stepNumber: number;
  instruction: string;
  tip?: string | null;
  timerSeconds?: number | null;
}

export interface RecipeListItem {
  slug: string;
  title: string;
  description: string;
  emoji: string | null;
  type: RecipeType;
  cuisine: CuisineCode | null;
  difficulty: Difficulty;
  prepMinutes: number;
  cookMinutes: number;
  totalMinutes: number;
  servingCount: number;
  averageCalories: number | null;
  isFeatured: boolean;
  imageUrl: string | null;
  allergens: Allergen[];
}

export interface RecipeDetail extends RecipeListItem {
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  tipNote: string | null;
  servingSuggestion: string | null;
  ingredients: RecipeIngredient[];
  steps: RecipeStep[];
  tags: { slug: string; name: string }[];
  category: { slug: string; name: string };
  hungerBar: number | null;
}
