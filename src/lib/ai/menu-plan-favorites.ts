/**
 * LocalStorage-backed "saved weekly menu plans" for AI v4.
 *
 * Kullanıcı preview beğendiği kombinasyonu şablon olarak kaydeder
 * (pantry + diet + cuisines + max*Minutes + macro), ileride tek tıkla
 * form'u geri yükler. Client-only, backend yok (KVKK + privacy + sıfır
 * maliyet), cihaz bağımsızlığı için ileride ayrı Pro feature gerek.
 */
import type { MacroPreference } from "./types";

const STORAGE_KEY = "tarifle-menu-plan-favorites";
const MAX_FAVORITES = 10;
const MAX_NAME_LEN = 60;

export interface MenuPlanFavoritePayload {
  ingredients: string[];
  assumePantryStaples: boolean;
  personCount: number;
  dietSlug: string;
  cuisines: string[];
  maxBreakfastMinutes?: number;
  maxLunchMinutes?: number;
  maxDinnerMinutes?: number;
  macroPreference: MacroPreference;
}

export interface MenuPlanFavorite {
  id: string;
  name: string;
  createdAt: number;
  payload: MenuPlanFavoritePayload;
}

function safeParse(raw: string | null): MenuPlanFavorite[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (f): f is MenuPlanFavorite =>
          typeof f === "object" &&
          f !== null &&
          typeof f.id === "string" &&
          typeof f.name === "string" &&
          typeof f.createdAt === "number" &&
          typeof f.payload === "object",
      )
      .slice(0, MAX_FAVORITES);
  } catch {
    return [];
  }
}

export function readMenuPlanFavorites(): MenuPlanFavorite[] {
  if (typeof window === "undefined") return [];
  try {
    return safeParse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeFavorites(list: MenuPlanFavorite[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(list.slice(0, MAX_FAVORITES)),
    );
  } catch {
    /* quota or private mode */
  }
}

function makeId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `fav-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addMenuPlanFavorite(
  name: string,
  payload: MenuPlanFavoritePayload,
): MenuPlanFavorite[] {
  const trimmedName = name.trim().slice(0, MAX_NAME_LEN) || "Menü şablonu";
  const current = readMenuPlanFavorites();
  const fav: MenuPlanFavorite = {
    id: makeId(),
    name: trimmedName,
    createdAt: Date.now(),
    payload,
  };
  const next = [fav, ...current].slice(0, MAX_FAVORITES);
  writeFavorites(next);
  return next;
}

export function removeMenuPlanFavorite(id: string): MenuPlanFavorite[] {
  const next = readMenuPlanFavorites().filter((f) => f.id !== id);
  writeFavorites(next);
  return next;
}
