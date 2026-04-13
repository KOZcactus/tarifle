export const SITE_NAME = "Tarifle";
export const SITE_SLOGAN = "Make Eat";
export const SITE_DESCRIPTION =
  "Yemek, içecek ve kokteyl tariflerini sade, hızlı okunur ve topluluk katkısına açık şekilde sunan modern tarif platformu.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://tarifle.com";

export const ITEMS_PER_PAGE = 12;
export const SEARCH_DEBOUNCE_MS = 300;
export const MAX_RECIPE_TITLE_LENGTH = 200;
export const MAX_VARIATION_TITLE_LENGTH = 200;
export const MAX_BIO_LENGTH = 300;
export const MAX_USERNAME_LENGTH = 50;

export const DIFFICULTY_OPTIONS = [
  { value: "EASY", label: "Kolay" },
  { value: "MEDIUM", label: "Orta" },
  { value: "HARD", label: "Zor" },
] as const;

export const RECIPE_TYPE_LABELS: Record<string, string> = {
  YEMEK: "Yemek",
  TATLI: "Tatlı",
  ICECEK: "İçecek",
  KOKTEYL: "Kokteyl",
  APERATIF: "Aperatif",
  SALATA: "Salata",
  CORBA: "Çorba",
  KAHVALTI: "Kahvaltı",
  ATISTIRMALIK: "Atıştırmalık",
  SOS: "Sos",
};
