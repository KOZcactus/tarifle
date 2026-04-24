/**
 * AI Asistan form persistence (oturum 17 #5).
 * Son ziyarette girilen form değerleri localStorage'da tutulur, kullanıcı
 * sayfayı yeniden açtığında elle yeniden girmek zorunda kalmaz.
 *
 * Güvenli kullanım:
 *   - Schema JSON compatible (primitive + array + flat obj)
 *   - 30 gün TTL, eski kayıt silinir (stale form durumu kullanıcıyı
 *     şaşırtmasın)
 *   - Parse hatasında sessizce null döner (privacy modu, quota dolu)
 *   - SSR-safe: typeof window undefined'sa noop
 *
 * v3 ve v4 ayrı key, ayrı form yapısı.
 */

const V3_KEY = "tarifle.ai.v3.form.v1";
const V4_KEY = "tarifle.ai.v4.form.v1";
const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 gün

interface Wrapper<T> {
  at: number;
  data: T;
}

function safeRead<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Wrapper<T>;
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.at !== "number"
    ) {
      return null;
    }
    if (Date.now() - parsed.at > TTL_MS) {
      window.localStorage.removeItem(key);
      return null;
    }
    return parsed.data;
  } catch {
    return null;
  }
}

function safeWrite<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  try {
    const wrapper: Wrapper<T> = { at: Date.now(), data };
    window.localStorage.setItem(key, JSON.stringify(wrapper));
  } catch {
    // Quota / privacy; sessizce geç.
  }
}

// ── v3 AI Asistan form state ────────────────────────────────────

export interface V3FormSnapshot {
  ingredients: string[];
  excludeIngredients: string[];
  type: string;
  difficulty: string;
  maxMinutes: string;
  cuisine: string;
  dietSlug: string;
  assumePantry: boolean;
}

export function saveV3FormState(state: V3FormSnapshot): void {
  safeWrite(V3_KEY, state);
}

export function readV3FormState(): V3FormSnapshot | null {
  return safeRead<V3FormSnapshot>(V3_KEY);
}

// ── v4 Menü Planlayıcı form state ───────────────────────────────

export interface V4FormSnapshot {
  ingredientsText: string;
  assumeStaples: boolean;
  personCount: number;
  dietSlug: string;
  selectedCuisines: string[];
  maxBreakfast?: number;
  maxLunch?: number;
  maxDinner?: number;
  macroPreference: string;
}

export function saveV4FormState(state: V4FormSnapshot): void {
  safeWrite(V4_KEY, state);
}

export function readV4FormState(): V4FormSnapshot | null {
  return safeRead<V4FormSnapshot>(V4_KEY);
}
