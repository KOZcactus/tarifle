"use client";

import { useState, useTransition, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import {
  suggestRecipesAction,
  getIngredientCompletionsAction,
  type IngredientCompletion,
} from "@/lib/actions/ai";
import type { AiSuggestResponse } from "@/lib/ai/types";
import { DIFFICULTY_OPTIONS, RECIPE_TYPE_LABELS, SITE_URL } from "@/lib/constants";
import {
  CUISINE_CODES,
  CUISINE_LABEL,
  CUISINE_FLAG,
  type CuisineCode,
} from "@/lib/cuisines";
import { ShareMenu } from "@/components/recipe/ShareMenu";
import { PresetChips } from "@/components/ai/PresetChips";
import { PantryHistoryChips } from "@/components/ai/PantryHistoryChips";
import { LoadPantryButton } from "@/components/ai/LoadPantryButton";
import { getUserPantryAction } from "@/lib/actions/pantry";
import { pushToPantryHistory } from "@/lib/ai/pantry-history";
import {
  readV3FormState,
  saveV3FormState,
} from "@/lib/ai/form-persistence";
import { getTimeHint, type TimeHint } from "@/lib/ai/time-context";

/** Popular ingredients shown as quick-add chips when input is empty. */
const POPULAR_INGREDIENTS = [
  "tavuk", "soğan", "domates", "yumurta", "patates", "biber",
  "pirinç", "makarna", "peynir", "havuç", "kabak", "nohut",
];

/** Suggest these when no results found, common combos that always match. */
const FALLBACK_COMBOS = [
  ["tavuk", "soğan", "biber"],
  ["yumurta", "peynir", "domates"],
  ["makarna", "domates", "sarımsak"],
  ["patates", "soğan", "yumurta"],
];

/** Color tokens for tag chips, labels come from i18n (form.tags.*). */
const TAG_COLOR: Record<string, string> = {
  "pratik": "bg-accent-green/15 text-accent-green",
  "30-dakika-alti": "bg-accent-blue/15 text-accent-blue",
  "vegan": "bg-accent-green/15 text-accent-green",
  "vejetaryen": "bg-accent-green/15 text-accent-green",
  "tek-tencere": "bg-secondary/15 text-secondary",
  "cocuk-dostu": "bg-primary/15 text-primary",
  "butce-dostu": "bg-secondary/15 text-secondary",
  "misafir-sofrasi": "bg-primary/15 text-primary",
  "yuksek-protein": "bg-accent-blue/15 text-accent-blue",
  "dusuk-kalorili": "bg-accent-green/15 text-accent-green",
};

const TIME_OPTIONS: { value: number; key: "min15" | "min30" | "hr1" | "hr2" }[] = [
  { value: 15, key: "min15" },
  { value: 30, key: "min30" },
  { value: 60, key: "hr1" },
  { value: 120, key: "hr2" },
];

const DIFFICULTY_KEY = {
  EASY: "difficultyEasy",
  MEDIUM: "difficultyMedium",
  HARD: "difficultyHard",
} as const;

type CardT = (key: string, values?: Record<string, string | number>) => string;

function formatMinutesI18n(minutes: number, t: CardT): string {
  if (minutes < 60) return t("minutesShort", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return t("hoursShort", { n: hours });
  return t("hoursMinutes", { h: hours, m: remaining });
}

interface InitialPrefs {
  cuisine: string;
  dietSlug: string;
  personalized: boolean;
}

interface AiAssistantFormProps {
  /** Pre-fetched unique ingredient names for autocomplete. */
  knownIngredients?: string[];
  /** Logged-in user'in /ayarlar tercihlerinden turetilen on-doldurma
   *  (Personalization tur 5). Anonymous user veya tercih yoksa
   *  cuisine="tr", dietSlug="", personalized=false. */
  initialPrefs?: InitialPrefs;
  /** Oturum varsa UserPantry "Dolabımı getir" buton görünür. */
  isAuthenticated?: boolean;
  /** Home'dan `?autoPantry=1` ile geliniyorsa mount effect'te pantry
   *  otomatik yüklenir, kullanıcı hiç tıklamadan ingredient listesi
   *  hazır. H: hızlı win. */
  autoLoadPantry?: boolean;
}

/**
 * Normalize for Turkish-aware fuzzy matching.
 * "Tav" should match "Tavuk", "İsp" should match "Ispanak".
 */
function trNormalize(s: string): string {
  return s
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ş", "s")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c");
}

const DEFAULT_PREFS: InitialPrefs = { cuisine: "tr", dietSlug: "", personalized: false };

export function AiAssistantForm({
  knownIngredients = [],
  initialPrefs = DEFAULT_PREFS,
  isAuthenticated = false,
  autoLoadPantry = false,
}: AiAssistantFormProps) {
  const t = useTranslations("aiAssistant");
  const tForm = useTranslations("aiAssistant.form");
  const tTime = useTranslations("aiAssistant.form.timeOptions");
  const tType = useTranslations("aiAssistant.recipeTypes");
  const tErr = useTranslations("aiAssistant.errors");
  const tResult = useTranslations("aiAssistant.result");
  const tTag = useTranslations("aiAssistant.tags");
  const tCard = useTranslations("recipes.card");
  const tCuisine = useTranslations("cuisines");
  const [ingredients, setIngredients] = useState<string[]>([]);
  const hasAutoPantryRef = useRef(false);
  const [currentInput, setCurrentInput] = useState("");
  const [excludeIngredients, setExcludeIngredients] = useState<string[]>([]);
  const [excludeInput, setExcludeInput] = useState("");
  const [type, setType] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");
  const [maxMinutes, setMaxMinutes] = useState<string>("");
  const [cuisine, setCuisine] = useState<string>(initialPrefs.cuisine);
  const [dietSlug, setDietSlug] = useState<string>(initialPrefs.dietSlug);
  const [assumePantry, setAssumePantry] = useState(true);
  const [historyBump, setHistoryBump] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(-1);
  const [sortMode, setSortMode] = useState<
    "match" | "fastest" | "least-missing" | "most-filling"
  >("match");
  const [result, setResult] = useState<AiSuggestResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  // E: "Beğenmedim, farklı dene" state. Rejected slug seti biriktirir,
  // her reject'te önceki sonuçlardaki slug'lar eklenir + form resubmit.
  // rejectRound 2+ ise UI daha spesifik filter hint'i gösterir.
  const [rejectedSlugs, setRejectedSlugs] = useState<Set<string>>(new Set());
  const [rejectRound, setRejectRound] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[][]>([]);
  const formRef = useRef<HTMLFormElement>(null);
  const searchParams = useSearchParams();
  const hasInitedFromUrl = useRef(false);
  // #13 Fırsat öneri: result.suggestions.length === 0 olduğunda server'dan
  // top popular ingredient fetch, "+un (1200 tarifte)" chip göster.
  const [completions, setCompletions] = useState<IngredientCompletion[]>([]);
  const [isLoadingCompletions, setIsLoadingCompletions] = useState(false);
  // #11 Saate göre öneri ipucu. Mount'ta hesaplanır + her saatte bir
  // yenilenebilir ama zaten single-page form, mount yeterli.
  const [timeHint, setTimeHint] = useState<TimeHint | null>(null);
  const [timeHintDismissed, setTimeHintDismissed] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTimeHint(getTimeHint());
  }, []);

  // #13 Fırsat öneri helper: submit handler çağırır, server action'dan
  // top popular ingredient döner. Effect değil, submit sonucu explicit.
  async function fetchCompletions(currentIngredients: string[]) {
    setIsLoadingCompletions(true);
    const res = await getIngredientCompletionsAction({
      currentIngredients,
    });
    setIsLoadingCompletions(false);
    if (res.success && res.data) {
      setCompletions(res.data);
    } else {
      setCompletions([]);
    }
  }
  // #7 Sesli malzeme girişi: Web Speech API. Desteklenmezse button gizli.
  // SpeechRecognition type'ı lib.dom'da yok, minimal interface + window cast.
  interface MinSpeechRecognition {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    onresult: (e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void;
    onend: () => void;
    onerror: () => void;
    start: () => void;
    stop: () => void;
  }
  const [isListening, setIsListening] = useState(false);
  const speechRef = useRef<MinSpeechRecognition | null>(null);
  const speechSupported =
    typeof window !== "undefined" &&
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in window);

  function handleVoiceInput() {
    if (!speechSupported) return;
    if (isListening) {
      speechRef.current?.stop();
      return;
    }
    const win = window as unknown as {
      SpeechRecognition?: new () => MinSpeechRecognition;
      webkitSpeechRecognition?: new () => MinSpeechRecognition;
    };
    const SR = win.SpeechRecognition ?? win.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = "tr-TR";
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.onresult = (e) => {
      const transcript = e.results[0]?.[0]?.transcript ?? "";
      // "tavuk domates pirinç" veya "tavuk, domates ve pirinç"
      const parts = transcript
        .split(/[,\s]+|\s+ve\s+/gi)
        .map((p: string) => p.trim())
        .filter((p: string) => p.length > 1);
      if (parts.length > 0) {
        setIngredients((prev) => [
          ...prev,
          ...parts.filter(
            (p: string) =>
              !prev.some(
                (existing) =>
                  existing.toLocaleLowerCase("tr") ===
                  p.toLocaleLowerCase("tr"),
              ),
          ),
        ]);
      }
    };
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    speechRef.current = recognition;
    setIsListening(true);
    recognition.start();
  }

  // Load state from URL params (shared link).
  // setState inside this effect is intentional: we sync one-time from an
  // external source (URLSearchParams) into component state. The hasInited
  // ref guards against re-runs, so no cascading renders in practice.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (hasInitedFromUrl.current) return;
    const m = searchParams.get("m");
    if (!m) return;
    hasInitedFromUrl.current = true;
    const urlIngredients = m.split(",").map((s) => s.trim()).filter(Boolean);
    if (urlIngredients.length === 0) return;
    setIngredients(urlIngredients);

    const urlCuisine = searchParams.get("mutfak");
    if (urlCuisine) setCuisine(urlCuisine);
    const urlType = searchParams.get("tur");
    if (urlType) setType(urlType);
    const urlDiff = searchParams.get("zorluk");
    if (urlDiff) setDifficulty(urlDiff);
    const urlTime = searchParams.get("sure");
    if (urlTime) setMaxMinutes(urlTime);
    const urlExclude = searchParams.get("haric");
    if (urlExclude) {
      setExcludeIngredients(urlExclude.split(",").map((s) => s.trim()).filter(Boolean));
    }
    const urlDiet = searchParams.get("diyet");
    if (urlDiet) setDietSlug(urlDiet);
    const urlPantry = searchParams.get("pantry");
    // URL param missing → default true stays. Only flip to false when explicit "0".
    if (urlPantry === "0") setAssumePantry(false);
    const urlSort = searchParams.get("sirala");
    if (
      urlSort === "fastest" ||
      urlSort === "least-missing" ||
      urlSort === "most-filling"
    ) {
      setSortMode(urlSort);
    }

    // Auto-submit after a tick
    setTimeout(() => formRef.current?.requestSubmit(), 100);
  }, [searchParams]);

  // Load recent searches from localStorage on mount.
  // Mount-only one-shot sync from an external storage source, same reason
  // as above, setState here isn't a cascading-render hazard.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("ai-recent-searches");
      if (stored) setRecentSearches(JSON.parse(stored));
    } catch {
      // localStorage unavailable or corrupt, ignore
    }
  }, []);

  // H: Home 🎒 CTA'dan ?autoPantry=1 ile gelinirse mount'ta pantry
  // otomatik yüklenir. URL'den gelen m= param'ı varsa ona saygı göster
  // (çakışmasın), sadece ingredient listesi boşsa dolduralım.
  useEffect(() => {
    if (!autoLoadPantry || !isAuthenticated) return;
    if (hasAutoPantryRef.current) return;
    hasAutoPantryRef.current = true;
    (async () => {
      const res = await getUserPantryAction();
      if (!res.success || !res.data || res.data.length === 0) return;
      const names = res.data
        .map((item) => item.ingredientName)
        .filter((n): n is string => typeof n === "string" && n.length > 0);
      // Yalnızca başka ingredient eklenmemişse auto-doldur.
      setIngredients((prev) => (prev.length > 0 ? prev : names));
    })();
  }, [autoLoadPantry, isAuthenticated]);

  // #5 Form persistence: son ziyaretten değerleri geri yükle. URL
  // paramlarından gelen değerler (shared link) persistence'dan önce
  // çalıştığı için öncelikli, burada URL init zaten olmadıysa kaydedilen
  // form state'ini hydrate ediyoruz.
  useEffect(() => {
    if (hasInitedFromUrl.current) return;
    const saved = readV3FormState();
    if (!saved) return;
    if (saved.ingredients?.length > 0) setIngredients(saved.ingredients);
    if (saved.excludeIngredients?.length > 0)
      setExcludeIngredients(saved.excludeIngredients);
    if (saved.type) setType(saved.type);
    if (saved.difficulty) setDifficulty(saved.difficulty);
    if (saved.maxMinutes) setMaxMinutes(saved.maxMinutes);
    if (saved.cuisine) setCuisine(saved.cuisine);
    if (saved.dietSlug) setDietSlug(saved.dietSlug);
    if (typeof saved.assumePantry === "boolean")
      setAssumePantry(saved.assumePantry);
  }, []);

  // Her form state değişikliğinde localStorage'a kaydet (debounce'suz,
  // write sık ama localStorage sync ucuz, onChange'de lag yok).
  useEffect(() => {
    saveV3FormState({
      ingredients,
      excludeIngredients,
      type,
      difficulty,
      maxMinutes,
      cuisine,
      dietSlug,
      assumePantry,
    });
  }, [
    ingredients,
    excludeIngredients,
    type,
    difficulty,
    maxMinutes,
    cuisine,
    dietSlug,
    assumePantry,
  ]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const saveSearch = useCallback((ings: string[]) => {
    try {
      const key = ings.map((i) => i.toLocaleLowerCase("tr")).sort().join(",");
      const existing = JSON.parse(localStorage.getItem("ai-recent-searches") ?? "[]") as string[][];
      // Dedup by sorted key
      const filtered = existing.filter(
        (e) => e.map((i) => i.toLocaleLowerCase("tr")).sort().join(",") !== key,
      );
      const updated = [ings, ...filtered].slice(0, 3);
      localStorage.setItem("ai-recent-searches", JSON.stringify(updated));
      setRecentSearches(updated);
    } catch {
      // ignore
    }
  }, []);

  function addIngredient(raw: string) {
    const trimmed = raw.trim().replace(/,$/, "");
    if (!trimmed) return;
    if (ingredients.includes(trimmed.toLocaleLowerCase("tr"))) return;
    setIngredients([...ingredients, trimmed]);
    setCurrentInput("");
  }

  // Autocomplete suggestions, filtered by current input, max 6
  const autocompleteSuggestions = (() => {
    if (!currentInput.trim() || currentInput.trim().length < 2) return [];
    const query = trNormalize(currentInput.trim());
    const alreadyAdded = new Set(ingredients.map((i) => i.toLocaleLowerCase("tr")));
    return knownIngredients
      .filter((name) => {
        const norm = trNormalize(name);
        return norm.includes(query) && !alreadyAdded.has(name.toLocaleLowerCase("tr"));
      })
      .slice(0, 6);
  })();

  function selectSuggestion(name: string) {
    addIngredient(name);
    setShowSuggestions(false);
    setSelectedSuggestionIdx(-1);
  }

  /**
   * Build a shareable URL that restores the full AI assistant query state.
   * Keeps defaults (cuisine="all", assumePantry=true, sortMode="match") out
   * of the URL so the link stays short for non-default choices.
   * `origin` is read from window on the client; SSR paths use SITE_URL as
   * fallback (share menu only opens after hydration, so window is always
   * defined in practice, but the guard keeps TypeScript happy for prerender).
   */
  function buildShareUrl(): string {
    const params = new URLSearchParams();
    if (ingredients.length > 0) params.set("m", ingredients.join(","));
    if (cuisine && cuisine !== "all") params.set("mutfak", cuisine);
    if (type) params.set("tur", type);
    if (difficulty) params.set("zorluk", difficulty);
    if (maxMinutes) params.set("sure", maxMinutes);
    if (excludeIngredients.length > 0) params.set("haric", excludeIngredients.join(","));
    if (dietSlug) params.set("diyet", dietSlug);
    if (!assumePantry) params.set("pantry", "0");
    if (sortMode !== "match") params.set("sirala", sortMode);
    const origin = typeof window !== "undefined" ? window.location.origin : SITE_URL;
    return `${origin}/ai-asistan?${params.toString()}`;
  }

  function addExclude(raw: string) {
    const trimmed = raw.trim().replace(/,$/, "");
    if (!trimmed) return;
    if (excludeIngredients.includes(trimmed.toLocaleLowerCase("tr"))) return;
    setExcludeIngredients([...excludeIngredients, trimmed]);
    setExcludeInput("");
  }

  function handleExcludeKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addExclude(excludeInput);
    } else if (e.key === "Backspace" && !excludeInput && excludeIngredients.length > 0) {
      setExcludeIngredients(excludeIngredients.slice(0, -1));
    }
  }

  function removeExclude(index: number) {
    setExcludeIngredients(excludeIngredients.filter((_, i) => i !== index));
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    // Autocomplete navigation
    if (showSuggestions && autocompleteSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedSuggestionIdx((prev) =>
          prev < autocompleteSuggestions.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedSuggestionIdx((prev) =>
          prev > 0 ? prev - 1 : autocompleteSuggestions.length - 1,
        );
        return;
      }
      if (e.key === "Enter" && selectedSuggestionIdx >= 0) {
        e.preventDefault();
        selectSuggestion(autocompleteSuggestions[selectedSuggestionIdx]!);
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        setSelectedSuggestionIdx(-1);
        return;
      }
    }

    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addIngredient(currentInput);
      setShowSuggestions(false);
    } else if (e.key === "Backspace" && !currentInput && ingredients.length > 0) {
      setIngredients(ingredients.slice(0, -1));
    }
  }

  function removeIngredient(index: number) {
    setIngredients(ingredients.filter((_, i) => i !== index));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // If the user typed something but didn't press Enter, accept it
    const finalIngredients =
      currentInput.trim().length > 0
        ? [...ingredients, currentInput.trim()]
        : ingredients;

    if (finalIngredients.length === 0) {
      setError(tErr("ingredientRequired"));
      return;
    }

    submitWithOptions(finalIngredients, {
      resetRejects: true,
    });
  }

  function submitWithOptions(
    finalIngredients: string[],
    opts: { resetRejects?: boolean; addRejects?: string[] } = {},
  ) {
    let nextRejected = rejectedSlugs;
    let nextRound = rejectRound;
    if (opts.resetRejects) {
      nextRejected = new Set();
      nextRound = 0;
      setRejectedSlugs(nextRejected);
      setRejectRound(nextRound);
    } else if (opts.addRejects && opts.addRejects.length > 0) {
      nextRejected = new Set(rejectedSlugs);
      opts.addRejects.forEach((s) => nextRejected.add(s));
      nextRound = rejectRound + 1;
      setRejectedSlugs(nextRejected);
      setRejectRound(nextRound);
    }

    startTransition(async () => {
      const payload = {
        ingredients: finalIngredients,
        type: type || undefined,
        difficulty: difficulty || undefined,
        maxMinutes: maxMinutes ? Number(maxMinutes) : undefined,
        assumePantryStaples: assumePantry,
        cuisines: cuisine ? (cuisine === "all" ? undefined : [cuisine]) : undefined,
        dietSlug: dietSlug || undefined,
        excludeIngredients: excludeIngredients.length > 0 ? excludeIngredients : undefined,
        excludeSlugs: nextRejected.size > 0 ? Array.from(nextRejected) : undefined,
        rejectRound: nextRound > 0 ? nextRound : undefined,
      };
      const response = await suggestRecipesAction(payload);
      if (!response.success || !response.data) {
        setError(response.error ?? tErr("suggestionsFailed"));
        setResult(null);
        return;
      }
      setIngredients(finalIngredients);
      setCurrentInput("");
      setResult(response.data);
      saveSearch(finalIngredients);
      pushToPantryHistory(finalIngredients);
      setHistoryBump((x) => x + 1);
      // #13 Fırsat öneri: 0 match ise server'dan top ingredient fetch.
      if (response.data.suggestions.length === 0) {
        fetchCompletions(finalIngredients);
      } else {
        setCompletions([]);
      }
    });
  }

  // E: "Beğenmedim, farklı dene" — mevcut result slug'larını reddet
  // setine ekle, form'u ingredient listesi ile yeniden submit.
  function handleRejectResults() {
    if (!result || result.suggestions.length === 0) return;
    const slugsToExclude = result.suggestions.map((s) => s.slug);
    submitWithOptions(ingredients, { addRejects: slugsToExclude });
  }

  return (
    <div className="space-y-8">
      {/* Personalization tur 5 (oturum 13): user tercihlerine gore on-doldurma
          chip'i. Sadece logged-in user'da ve gercekten tercih varsa gorunur. */}
      {initialPrefs.personalized && (
        <div className="flex items-start gap-2 rounded-lg border border-accent-blue/30 bg-accent-blue/5 px-3 py-2 text-xs text-accent-blue">
          <span aria-hidden="true">✨</span>
          <span className="flex-1">{tForm("personalizedHint")}</span>
        </div>
      )}

      {/* Recent searches */}
      {recentSearches.length > 0 && !result && (
        <div className="rounded-lg border border-dashed border-border bg-bg-card/50 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-text-muted">
            {t("recentSearches")}
          </p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((search, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setIngredients(search);
                  setCurrentInput("");
                  setResult(null);
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
              >
                <span aria-hidden="true">🕒</span>
                {search.slice(0, 3).join(", ")}
                {search.length > 3 && ` +${search.length - 3}`}
              </button>
            ))}
          </div>
        </div>
      )}

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="rounded-2xl border border-border bg-bg-card p-5 sm:p-6"
      >
        {/* #11 Saate göre öneri banner'ı. Hint kind "none" değilse ve
            kullanıcı kapatmadıysa üstte ince bant. suggestedMaxMinutes
            varsa tek tıkla maxMinutes filter'ı uygulanır. */}
        {timeHint &&
          timeHint.kind !== "none" &&
          !timeHintDismissed && (
            <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-sky-200/60 bg-sky-50/70 px-3 py-2 text-xs text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/30 dark:text-sky-200">
              <span aria-hidden>🕒</span>
              <span className="flex-1">
                {tForm(`timeHint.${timeHint.labelKey}`)}
              </span>
              {timeHint.suggestedMaxMinutes && (
                <button
                  type="button"
                  onClick={() => {
                    setMaxMinutes(String(timeHint.suggestedMaxMinutes));
                    setTimeHintDismissed(true);
                  }}
                  className="rounded-md border border-sky-400/60 bg-sky-100 px-2 py-0.5 font-medium text-sky-900 transition hover:bg-sky-200 dark:border-sky-500/40 dark:bg-sky-900/60 dark:text-sky-100"
                >
                  {tForm("timeHint.apply", {
                    minutes: timeHint.suggestedMaxMinutes,
                  })}
                </button>
              )}
              <button
                type="button"
                onClick={() => setTimeHintDismissed(true)}
                className="text-sky-700/70 transition hover:text-sky-900 dark:text-sky-300/70 dark:hover:text-sky-200"
                aria-label={tForm("timeHint.dismiss")}
              >
                ✕
              </button>
            </div>
          )}
        <PresetChips
          mode="single"
          className="mb-4"
          onApply={(preset) => {
            if (preset.values.type !== undefined) setType(preset.values.type);
            if (preset.values.difficulty !== undefined)
              setDifficulty(preset.values.difficulty);
            if (preset.values.maxMinutes !== undefined)
              setMaxMinutes(String(preset.values.maxMinutes));
            if (preset.values.dietSlug !== undefined)
              setDietSlug(preset.values.dietSlug);
          }}
        />
        {/* Ingredients chips input */}
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <label className="block text-sm font-medium text-text">
              {tForm("ingredientsLabel")}
            </label>
            {/* #7 Sesli malzeme girişi: desteklenen tarayıcılarda 🎤 buton,
                tıklayınca SpeechRecognition TR-TR dinlemeye başlar, sonuç
                ingredients'a eklenir. Desteklenmeyen platformda gizli. */}
            {speechSupported && (
              <button
                type="button"
                onClick={handleVoiceInput}
                aria-label={tForm(isListening ? "voice.stop" : "voice.start")}
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                  isListening
                    ? "border-red-400/60 bg-red-50 text-red-700 dark:border-red-500/40 dark:bg-red-950/40 dark:text-red-300"
                    : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                }`}
              >
                <span aria-hidden>{isListening ? "⏺" : "🎤"}</span>
                {tForm(isListening ? "voice.listening" : "voice.button")}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 focus-within:border-primary">
            {ingredients.map((ing, i) => (
              <span
                key={`${ing}-${i}`}
                className="flex items-center gap-1.5 rounded-full bg-accent-blue/10 px-3 py-1 text-sm text-accent-blue"
              >
                {ing}
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  aria-label={tForm("ingredientChipRemove", { ingredient: ing })}
                  className="text-accent-blue/60 transition-colors hover:text-accent-blue"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={currentInput}
              onChange={(e) => {
                setCurrentInput(e.target.value);
                setShowSuggestions(e.target.value.trim().length >= 2);
                setSelectedSuggestionIdx(-1);
              }}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                // Delay to allow click on suggestion
                setTimeout(() => {
                  if (currentInput.trim()) addIngredient(currentInput);
                  setShowSuggestions(false);
                }, 150);
              }}
              onFocus={() => {
                if (currentInput.trim().length >= 2) setShowSuggestions(true);
              }}
              placeholder={
                ingredients.length === 0
                  ? tForm("ingredientsPlaceholderEmpty")
                  : tForm("ingredientsPlaceholderMore")
              }
              className="min-w-[200px] flex-1 bg-transparent text-sm outline-none"
              autoComplete="off"
              role="combobox"
              aria-expanded={showSuggestions && autocompleteSuggestions.length > 0}
              aria-autocomplete="list"
              aria-controls="ai-ingredient-suggestions-listbox"
            />
          </div>
          {/* Autocomplete dropdown */}
          {showSuggestions && autocompleteSuggestions.length > 0 && (
            <ul
              id="ai-ingredient-suggestions-listbox"
              className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-bg-card shadow-lg"
              role="listbox"
            >
              {autocompleteSuggestions.map((name, idx) => (
                <li
                  key={name}
                  role="option"
                  aria-selected={idx === selectedSuggestionIdx}
                  className={`cursor-pointer px-3 py-2 text-sm transition-colors ${
                    idx === selectedSuggestionIdx
                      ? "bg-primary/10 text-primary"
                      : "text-text hover:bg-bg-elevated"
                  }`}
                  onMouseDown={(e) => {
                    e.preventDefault(); // prevent blur
                    selectSuggestion(name);
                  }}
                >
                  {name}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-1.5 text-xs text-text-muted">
            {tForm("ingredientsHelper")}
          </p>
          <div className="mt-2">
            <LoadPantryButton
              isAuthenticated={isAuthenticated}
              onLoad={(names) => {
                const currentLower = new Set(
                  ingredients.map((i) => i.toLocaleLowerCase("tr")),
                );
                const fresh = names.filter(
                  (n) => !currentLower.has(n.toLocaleLowerCase("tr")),
                );
                if (fresh.length > 0)
                  setIngredients([...ingredients, ...fresh]);
              }}
            />
          </div>
          <PantryHistoryChips
            className="mt-2"
            refreshKey={historyBump}
            onAdd={(name) => {
              const alreadyIn = ingredients.some(
                (i) => i.toLocaleLowerCase("tr") === name.toLocaleLowerCase("tr"),
              );
              if (!alreadyIn) setIngredients([...ingredients, name]);
            }}
          />
          {/* Popular ingredient quick-add chips */}
          {ingredients.length === 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {POPULAR_INGREDIENTS.map((ing) => (
                <button
                  key={ing}
                  type="button"
                  onClick={() => addIngredient(ing)}
                  className="rounded-full border border-dashed border-border px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
                >
                  + {ing}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Exclude ingredients chips input */}
        <div className="mt-4">
          <label className="mb-2 block text-sm font-medium text-text">
            {tForm("excludeLabel")}
            <span className="ml-1 text-xs font-normal text-text-muted">{tForm("excludeOptional")}</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border bg-bg-elevated px-3 py-2 focus-within:border-error/60">
            {excludeIngredients.map((ing, i) => (
              <span
                key={`ex-${ing}-${i}`}
                className="flex items-center gap-1.5 rounded-full bg-error/10 px-3 py-1 text-sm text-error"
              >
                {ing}
                <button
                  type="button"
                  onClick={() => removeExclude(i)}
                  aria-label={tForm("excludeChipRemove", { ingredient: ing })}
                  className="text-error/60 transition-colors hover:text-error"
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <input
              type="text"
              value={excludeInput}
              onChange={(e) => setExcludeInput(e.target.value)}
              onKeyDown={handleExcludeKeyDown}
              onBlur={() => excludeInput.trim() && addExclude(excludeInput)}
              placeholder={
                excludeIngredients.length === 0
                  ? tForm("excludePlaceholderEmpty")
                  : tForm("excludePlaceholderMore")
              }
              className="min-w-[200px] flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          <div>
            <label
              htmlFor="ai-filter-type"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("typeLabel")}
            </label>
            <select
              id="ai-filter-type"
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">{tForm("anyOption")}</option>
              {Object.keys(RECIPE_TYPE_LABELS).map((val) => (
                <option key={val} value={val}>
                  {tType(val)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ai-filter-time"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("timeLabel")}
            </label>
            <select
              id="ai-filter-time"
              value={maxMinutes}
              onChange={(e) => setMaxMinutes(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">{tForm("anyOption")}</option>
              {TIME_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {tTime(opt.key)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ai-filter-difficulty"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("difficultyLabel")}
            </label>
            <select
              id="ai-filter-difficulty"
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">{tForm("anyOption")}</option>
              {DIFFICULTY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {tCard(DIFFICULTY_KEY[opt.value])}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="ai-filter-cuisine"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("cuisineLabel")}
            </label>
            <select
              id="ai-filter-cuisine"
              value={cuisine}
              onChange={(e) => setCuisine(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="all">{tForm("allCuisinesOption")}</option>
              {CUISINE_CODES.map((code) => (
                <option key={code} value={code}>
                  {CUISINE_FLAG[code]} {tCuisine.has(code) ? tCuisine(code) : CUISINE_LABEL[code]}
                </option>
              ))}
            </select>
          </div>

          {/* Diet filter, vegan/vejetaryen/glutensiz/sutsuz/alkolsuz.
              Diet config src/lib/diets.ts; "Farketmez" seçiliyse
              kısıt yok. Tag-based diyetler tag filter'ı, allergen-based
              diyetler allergen exclusion ile DB-side filtrelenir. */}
          <div>
            <label
              htmlFor="ai-filter-diet"
              className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-text-muted"
            >
              {tForm("dietLabel")}
            </label>
            <select
              id="ai-filter-diet"
              value={dietSlug}
              onChange={(e) => setDietSlug(e.target.value)}
              className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">{tForm("dietAnyOption")}</option>
              <option value="vegan">🌱 {tForm("dietVegan")}</option>
              <option value="vejetaryen">🥗 {tForm("dietVejetaryen")}</option>
              <option value="glutensiz">🌾 {tForm("dietGlutensiz")}</option>
              <option value="sutsuz">🥛 {tForm("dietSutsuz")}</option>
              <option value="alkolsuz">🥤 {tForm("dietAlkolsuz")}</option>
            </select>
          </div>
        </div>

        {/* Pantry toggle */}
        <label className="mt-4 flex cursor-pointer items-start gap-3 rounded-lg border border-border bg-bg-elevated p-3">
          <input
            type="checkbox"
            checked={assumePantry}
            onChange={(e) => setAssumePantry(e.target.checked)}
            className="mt-0.5 h-4 w-4 cursor-pointer accent-primary"
          />
          <span className="flex-1 text-sm">
            <span className="font-medium text-text">
              {tForm("pantryLabel")}
            </span>
            <span className="mt-0.5 block text-xs text-text-muted">
              {tForm("pantryHelper")}
            </span>
          </span>
        </label>

        {error && (
          <div className="mt-4 rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-75 sm:w-auto"
        >
          {isPending ? (
            <>
              <span className="inline-flex gap-0.5" aria-hidden="true">
                <span className="h-1.5 w-1.5 animate-[pulse_1.4s_ease-in-out_infinite] rounded-full bg-white" />
                <span
                  className="h-1.5 w-1.5 animate-[pulse_1.4s_ease-in-out_0.2s_infinite] rounded-full bg-white"
                  style={{ animationDelay: "0.2s" }}
                />
                <span
                  className="h-1.5 w-1.5 animate-[pulse_1.4s_ease-in-out_0.4s_infinite] rounded-full bg-white"
                  style={{ animationDelay: "0.4s" }}
                />
              </span>
              {tForm("submitting")}
            </>
          ) : (
            tForm("submit")
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <section>
          {/* Share bar, always available when there is a result, regardless
              of whether the assistant produced a commentary or zero matches
              came back. Uses the recipe ShareMenu (WhatsApp / X / Pinterest
              / copy) so the viral paths defined in rekabet §8 work the same
              way they do on a tarif detay. */}
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-text-muted">
              {tResult("shareHint", {
                count: ingredients.length,
                defaultValue: "",
              })}
            </p>
            <ShareMenu
              title={tResult("shareTitle")}
              url={buildShareUrl()}
              text={
                result.commentary
                  ? result.commentary
                  : tResult("shareTextFallback", {
                      ingredients: ingredients.slice(0, 4).join(", "),
                    })
              }
            />
          </div>

          {result.commentary && (
            <div className="mb-6 rounded-xl border border-accent-blue/30 bg-accent-blue/5 p-4">
              <p className="text-sm leading-relaxed text-text">
                <span className="mr-1 font-semibold text-accent-blue">
                  {tResult("assistantPrefix")}
                </span>
                {result.commentary}
              </p>
            </div>
          )}

          {/* #10 "Dolabını tamamla" önerisi: mevcut tariflerin en sık
              eksik ingredient'ları. Ortalama match <%60 VE en az 3 öneri
              varsa, kullanıcıya "X ingredient eklersen kaç tarif tam
              match olur" chip'i. Click → ingredient ekle + otomatik
              tekrar submit. */}
          {(() => {
            if (result.suggestions.length < 3) return null;
            const avgMatch =
              result.suggestions.reduce((sum, s) => sum + s.matchScore, 0) /
              result.suggestions.length;
            if (avgMatch >= 0.6) return null;
            // Top missing ingredient frequency + her biri kaç tarifi tam
            // match'e çevirir hesabı.
            const freq = new Map<string, number>();
            const existingLower = new Set(
              ingredients.map((i) => i.toLocaleLowerCase("tr")),
            );
            for (const s of result.suggestions) {
              for (const m of s.missingIngredients) {
                const k = m.toLocaleLowerCase("tr");
                if (existingLower.has(k)) continue;
                freq.set(k, (freq.get(k) ?? 0) + 1);
              }
            }
            if (freq.size === 0) return null;
            const top = Array.from(freq.entries())
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3);
            return (
              <div className="mb-6 rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-950/30">
                <p className="mb-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                  <span className="mr-1" aria-hidden>💡</span>
                  {tResult("completionHint")}
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {top.map(([ing, count]) => (
                    <button
                      key={ing}
                      type="button"
                      onClick={() => {
                        setIngredients([...ingredients, ing]);
                        setCurrentInput("");
                        setTimeout(
                          () => formRef.current?.requestSubmit(),
                          50,
                        );
                      }}
                      className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-200 dark:border-amber-500/40 dark:bg-amber-900/60 dark:text-amber-100 dark:hover:bg-amber-900"
                    >
                      <span>+{ing}</span>
                      <span className="text-amber-700 dark:text-amber-300">
                        {tResult("completionRecipeCount", { count })}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Sort toggle */}
          {result.suggestions.length > 1 && (
            <>
              <div className="mb-2 flex flex-wrap items-center gap-1 text-xs">
                <span className="mr-2 text-text-muted">{tResult("sortLabel")}</span>
                {([
                  { key: "match" as const, label: tResult("sortMatch") },
                  { key: "fastest" as const, label: tResult("sortFastest") },
                  { key: "least-missing" as const, label: tResult("sortLeastMissing") },
                  { key: "most-filling" as const, label: tResult("sortMostFilling") },
                ]).map(({ key, label }) => {
                  const isActive = sortMode === key;
                  // 'most-filling' active'de hunger theme rengi (sıcak kahverengi);
                  // diğer sort active'leri neutral card bg. Görünürlük boost,
                  // "Acıktım" sort session 10'da eklendi, kullanıcılar fark
                  // etmiyor; renk + emoji tanınırlık artırır.
                  const activeClass =
                    key === "most-filling"
                      ? "bg-primary/10 font-semibold text-primary ring-1 ring-primary/30"
                      : "bg-bg-card font-medium text-text";
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSortMode(key)}
                      className={`rounded-md px-2.5 py-1 transition-colors ${
                        isActive ? activeClass : "text-text-muted hover:bg-bg-card"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
              {sortMode === "most-filling" && (
                <p className="mb-4 text-xs leading-snug text-text-muted">
                  {tResult("sortMostFillingHint")}
                </p>
              )}
            </>
          )}

          {/* E: "Beğenmedim, farklı dene" toolbar. Yalnızca result dolu
              ve kullanıcı zaten 0+ defa reddetmediyse göster (resubmit
              sonrasında rejectRound artsa da yine render). */}
          {result.suggestions.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-bg-card px-3 py-2 text-xs">
              <span className="text-text-muted">
                {rejectRound > 0
                  ? tResult("rejectStatus", { count: rejectRound })
                  : tResult("rejectHint")}
              </span>
              <button
                type="button"
                onClick={handleRejectResults}
                disabled={isPending}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-3 py-1 font-medium text-text-muted transition-colors hover:border-accent-blue hover:text-accent-blue disabled:opacity-60"
              >
                <span aria-hidden>👎</span>
                {tResult("rejectButton")}
              </button>
            </div>
          )}

          {/* E: 2+ reddet sonrası filter hint banner */}
          {rejectRound >= 2 && result.suggestions.length > 0 && (
            <div className="mb-4 rounded-xl border border-accent-blue/30 bg-accent-blue/5 p-3 text-xs text-accent-blue">
              <span className="mr-1" aria-hidden>💡</span>
              {tResult("rejectRefineHint")}
            </div>
          )}

          {result.suggestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-text-muted">
                {tResult("emptyTitle")}
              </p>

              {/* #13 Fırsat öneri: server'dan popüler ingredient
                  completion'ları. Empty result'ta "Dolabına +X eklersen Y
                  tarif açılır" chip'leri. Click → ingredient ekle + form
                  resubmit. */}
              {completions.length > 0 && (
                <>
                  <p className="mt-4 text-xs font-medium text-amber-700 dark:text-amber-300">
                    <span aria-hidden className="mr-1">💡</span>
                    {tResult("opportunityHint")}
                  </p>
                  <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                    {completions.map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() => {
                          setIngredients([...ingredients, c.name]);
                          setCurrentInput("");
                          setTimeout(
                            () => formRef.current?.requestSubmit(),
                            50,
                          );
                        }}
                        className="inline-flex items-center gap-1 rounded-full border border-amber-400/60 bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-900 transition hover:bg-amber-200 dark:border-amber-500/40 dark:bg-amber-900/60 dark:text-amber-100 dark:hover:bg-amber-900"
                      >
                        <span>+{c.name}</span>
                        <span className="text-amber-700 dark:text-amber-300">
                          {tResult("opportunityRecipeCount", {
                            count: c.recipeCount,
                          })}
                        </span>
                      </button>
                    ))}
                  </div>
                </>
              )}
              {isLoadingCompletions && (
                <p className="mt-3 text-xs text-text-muted">
                  {tResult("opportunityLoading")}
                </p>
              )}

              <p className="mt-6 text-xs text-text-muted">{tResult("emptyComboHint")}</p>
              <div className="mt-2 flex flex-wrap justify-center gap-2">
                {FALLBACK_COMBOS.map((combo, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setIngredients(combo);
                      setCurrentInput("");
                      setResult(null);
                    }}
                    className="rounded-full border border-border bg-bg px-3 py-1.5 text-xs text-text-muted transition-colors hover:border-primary hover:text-primary"
                  >
                    {combo.join(", ")}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {[...result.suggestions]
                .sort((a, b) => {
                  if (sortMode === "fastest") return a.totalMinutes - b.totalMinutes;
                  if (sortMode === "least-missing") return a.missingIngredients.length - b.missingIngredients.length;
                  if (sortMode === "most-filling") {
                    // Null hungerBar en sona (eski tarifler retrofit bekler);
                    // tie-break matchScore desc ki kullanıcının eldeki
                    // malzemeleriyle en iyi eşleşen tok tarifler üstte kalsın.
                    const aH = a.hungerBar ?? -1;
                    const bH = b.hungerBar ?? -1;
                    if (aH !== bH) return bH - aH;
                    return b.matchScore - a.matchScore;
                  }
                  return b.matchScore - a.matchScore; // default: match
                })
                .map((s) => (
                <SuggestionCard
                  key={s.recipeId}
                  suggestion={s}
                  tCard={tCard}
                  tCuisine={tCuisine as (k: string) => string}
                  hasCuisineLabel={(code) => tCuisine.has(code)}
                  tTag={tTag as (k: string) => string}
                  hasTagLabel={(slug) => tTag.has(slug)}
                  tResult={tResult}
                  difficultyLabel={(d) => tCard(DIFFICULTY_KEY[d])}
                  sortMode={sortMode}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}

interface SuggestionCardProps {
  suggestion: AiSuggestResponse["suggestions"][number];
  tCard: CardT;
  tCuisine: (k: string) => string;
  hasCuisineLabel: (code: string) => boolean;
  tTag: (k: string) => string;
  hasTagLabel: (slug: string) => boolean;
  tResult: (key: string, values?: Record<string, string | number>) => string;
  difficultyLabel: (d: "EASY" | "MEDIUM" | "HARD") => string;
  sortMode: "match" | "fastest" | "least-missing" | "most-filling";
}

function SuggestionCard({
  suggestion: s,
  tCard,
  tCuisine,
  hasCuisineLabel,
  tTag,
  hasTagLabel,
  tResult,
  difficultyLabel,
  sortMode,
}: SuggestionCardProps) {
  const matchPercent = Math.round(s.matchScore * 100);
  const perfect = s.missingIngredients.length === 0;
  const cuisineCode = s.cuisine as CuisineCode | null | undefined;
  const cuisineLabel =
    cuisineCode && hasCuisineLabel(cuisineCode)
      ? tCuisine(cuisineCode)
      : cuisineCode
        ? CUISINE_LABEL[cuisineCode]
        : "";

  return (
    <Link
      href={`/tarif/${s.slug}`}
      className="group flex gap-4 overflow-hidden rounded-xl border border-border bg-bg-card p-4 transition-all hover:border-primary hover:shadow-sm"
    >
      <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-lg bg-bg-elevated">
        {s.imageUrl ? (
          <img
            src={s.imageUrl}
            alt=""
            className="h-full w-full rounded-lg object-cover"
          />
        ) : (
          <span className="text-4xl">{s.emoji}</span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs text-text-muted">
              {cuisineCode && CUISINE_FLAG[cuisineCode] && (
                <span className="mr-1" aria-label={cuisineLabel}>
                  {CUISINE_FLAG[cuisineCode]}
                </span>
              )}
              {s.categoryName}
            </p>
            <h3 className="font-heading text-lg font-bold text-text transition-colors group-hover:text-primary">
              {s.title}
            </h3>
          </div>
          {/* Match score with progress bar */}
          <div className="shrink-0 text-right">
            <span
              className={`text-xs font-semibold ${
                perfect
                  ? "text-accent-green"
                  : matchPercent >= 70
                    ? "text-secondary"
                    : "text-text-muted"
              }`}
            >
              {tResult("matchPercent", { percent: matchPercent })}
            </span>
            <div className="mt-1 h-1.5 w-16 overflow-hidden rounded-full bg-bg-elevated">
              <div
                className={`h-full rounded-full transition-all ${
                  perfect
                    ? "bg-accent-green"
                    : matchPercent >= 70
                      ? "bg-secondary"
                      : "bg-text-muted/40"
                }`}
                style={{ width: `${matchPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tag chips */}
        {s.tags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {s.tags
              .filter((slug) => hasTagLabel(slug) && TAG_COLOR[slug])
              .slice(0, 3)
              .map((slug) => (
                <span
                  key={slug}
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${TAG_COLOR[slug]}`}
                >
                  {tTag(slug)}
                </span>
              ))}
          </div>
        )}

        {/* Reason chips, "neden bu tarif?" açıklaması (v3 + v4.3 renk kodu).
         *  kind → renk: time=mavi, pantry=yeşil, cuisine=mor. Görsel hiyerarşi
         *  kullanıcıya tek bakışta hangi sinyalin dolap uyumu hangisinin süre
         *  olduğunu söyler. */}
        {s.reasons && s.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {s.reasons.map((reason, idx) => {
              const chipClass =
                reason.kind === "time"
                  ? "border-sky-300/60 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-300"
                  : reason.kind === "pantry"
                    ? "border-emerald-300/60 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "border-purple-300/60 bg-purple-50 text-purple-700 dark:border-purple-500/40 dark:bg-purple-950/40 dark:text-purple-300";
              return (
                <span
                  key={idx}
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${chipClass}`}
                >
                  {reason.text}
                </span>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-1.5 text-xs text-text-muted">
          <span>{difficultyLabel(s.difficulty)}</span>
          <span>·</span>
          <span>⏱ {formatMinutesI18n(s.totalMinutes, tCard)}</span>
          {s.averageCalories && (
            <>
              <span>·</span>
              <span>{tResult("calories", { kcal: s.averageCalories })}</span>
            </>
          )}
          {s.hungerBar !== null && s.hungerBar !== undefined && (
            <>
              <span>·</span>
              <span
                className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 tabular-nums transition-colors ${
                  sortMode === "most-filling"
                    ? "bg-primary/15 font-semibold text-primary"
                    : "bg-bg-elevated"
                }`}
                title={tResult("hungerBarTitle", { value: s.hungerBar })}
                aria-label={tResult("hungerBarTitle", { value: s.hungerBar })}
              >
                🍖 {s.hungerBar}/10
              </span>
            </>
          )}
        </div>

        {/* F: pantryMatch varsa (login user + UserPantry dolu) quantity-aware
           shortage detayı göster. Yoksa eski binary missing listesi. */}
        {s.pantryMatch && s.pantryMatch.total > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="rounded-full border border-emerald-300/60 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-900 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100">
              🎒 {s.pantryMatch.covered + s.pantryMatch.presentUnknown + s.pantryMatch.partial}/{s.pantryMatch.total}
            </span>
            {s.pantryMatch.shortages.slice(0, 2).map((sh) => {
              const amt = Number.isInteger(sh.shortage)
                ? String(sh.shortage)
                : sh.shortage.toFixed(1).replace(/\.0$/, "");
              return (
                <span
                  key={sh.name}
                  className="rounded-full border border-amber-300/60 bg-amber-50 px-2 py-0.5 font-medium text-amber-900 dark:border-amber-700/60 dark:bg-amber-950/40 dark:text-amber-100"
                >
                  {sh.name} ({amt}
                  {sh.unit ? ` ${sh.unit}` : ""} eksik)
                </span>
              );
            })}
            {s.pantryMatch.missing > 0 && (
              <span className="rounded-full border border-gray-300/60 bg-gray-50 px-2 py-0.5 font-medium text-gray-900 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100">
                +{s.pantryMatch.missing} yok
              </span>
            )}
          </div>
        ) : (
          s.missingIngredients.length > 2 && (
            <p className="text-xs text-text-muted">
              <span className="font-medium text-warning">{tResult("missingPrefix")}</span>{" "}
              {s.missingIngredients.slice(0, 4).join(", ")}
              {s.missingIngredients.length > 4 &&
                ` ${tResult("missingMore", { count: s.missingIngredients.length - 4 })}`}
            </p>
          )
        )}
        {s.note && (
          <p className="mt-0.5 text-xs italic text-accent-blue">, {s.note}</p>
        )}
      </div>
    </Link>
  );
}
