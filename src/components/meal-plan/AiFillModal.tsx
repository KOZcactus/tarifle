"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  generateWeeklyMenuAction,
  applyWeeklyMenuAction,
  addRecipesToShoppingListAction,
  regenerateMenuSlotAction,
} from "@/lib/actions/menu";
import type {
  MacroPreference,
  MenuSlot,
  WeeklyMenuResponse,
} from "@/lib/ai/types";
import {
  CUISINE_CODES,
  CUISINE_LABEL,
  type CuisineCode,
} from "@/lib/cuisines";
import {
  IngredientSuggestionBar,
  replaceLastToken,
} from "@/components/ai/IngredientSuggestionBar";
import { PresetChips } from "@/components/ai/PresetChips";
import type { MenuPreset } from "@/lib/ai/presets";
import {
  PantryHistoryChips,
  appendIngredient,
} from "@/components/ai/PantryHistoryChips";
import { pushToPantryHistory } from "@/lib/ai/pantry-history";
import {
  pushGeneratedSlugs,
  readRecentSlugs,
  pushPlanMetrics,
  readAveragePlanMetrics,
  clearMenuHistory,
  type PersonalizedStats,
} from "@/lib/ai/menu-history";
import { buildIcalString } from "@/lib/ai/menu-ical";
import { buildShareText, buildWhatsAppUrl } from "@/lib/ai/menu-share";
import {
  addMenuPlanFavorite,
  readMenuPlanFavorites,
  removeMenuPlanFavorite,
  type MenuPlanFavorite,
} from "@/lib/ai/menu-plan-favorites";
import {
  readV4FormState,
  saveV4FormState,
} from "@/lib/ai/form-persistence";

type View = "form" | "preview";

interface AiFillModalProps {
  /** 7 day labels (Mon..Sun) pre-localized from server. */
  dayLabels: readonly [string, string, string, string, string, string, string];
  /** Meal labels localized (breakfast/lunch/dinner). */
  mealLabels: { BREAKFAST: string; LUNCH: string; DINNER: string };
}

const DIET_OPTIONS = [
  { slug: "", labelKey: "dietAny" },
  { slug: "vegan", labelKey: "dietVegan" },
  { slug: "vejetaryen", labelKey: "dietVegetarian" },
  { slug: "glutensiz", labelKey: "dietGlutenFree" },
  { slug: "sutsuz", labelKey: "dietDairyFree" },
  { slug: "alkolsuz", labelKey: "dietAlcoholFree" },
] as const;

const MACRO_OPTIONS: { value: MacroPreference; labelKey: string }[] = [
  { value: "none", labelKey: "macroNone" },
  { value: "high-protein", labelKey: "macroHighProtein" },
  { value: "low-calorie", labelKey: "macroLowCalorie" },
  { value: "high-fiber", labelKey: "macroHighFiber" },
];

function splitCsv(raw: string): string[] {
  return raw
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function AiFillModal({ dayLabels, mealLabels }: AiFillModalProps) {
  const t = useTranslations("mealPlanner.aiFill");
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasInitedFromUrlRef = useRef(false);
  const [open, setOpen] = useState(false);
  const [shareCopiedStatus, setShareCopiedStatus] = useState<string | null>(null);
  const [view, setView] = useState<View>("form");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<WeeklyMenuResponse | null>(null);
  const [isGenerating, startGenerate] = useTransition();
  const [isApplying, startApply] = useTransition();
  const [isShopping, startShopping] = useTransition();
  const [isRegenerating, startRegenerate] = useTransition();
  const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
  /** #4 Commentary personalization: bu generate'den ÖNCE okunan
   *  geçmiş plan ortalamaları. Yeni plan'la karşılaştırıp
   *  "senin tipik menün vs bu plan" kişisel satırı gösterir. */
  const [prevStats, setPrevStats] = useState<PersonalizedStats | null>(null);
  const [replaceExisting, setReplaceExisting] = useState(false);
  const [shoppingStatus, setShoppingStatus] = useState<string | null>(null);

  const [ingredientsText, setIngredientsText] = useState("");
  const [assumeStaples, setAssumeStaples] = useState(true);
  const [personCount, setPersonCount] = useState<number>(2);
  const [dietSlug, setDietSlug] = useState<string>("");
  const [selectedCuisines, setSelectedCuisines] = useState<CuisineCode[]>([]);
  const [maxBreakfast, setMaxBreakfast] = useState<number | undefined>(undefined);
  const [maxLunch, setMaxLunch] = useState<number | undefined>(undefined);
  const [maxDinner, setMaxDinner] = useState<number | undefined>(undefined);
  const [macroPreference, setMacroPreference] = useState<MacroPreference>("none");
  const [historyBump, setHistoryBump] = useState(0);
  const [favorites, setFavorites] = useState<MenuPlanFavorite[]>([]);
  const [saveFavOpen, setSaveFavOpen] = useState(false);
  const [saveFavName, setSaveFavName] = useState("");

  function toggleCuisine(code: CuisineCode) {
    setSelectedCuisines((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  }

  function applyMenuPreset(preset: MenuPreset) {
    if (preset.values.dietSlug !== undefined) {
      setDietSlug(preset.values.dietSlug);
    }
    if (preset.values.cuisines !== undefined) {
      const validCuisines = preset.values.cuisines.filter(
        (c): c is CuisineCode =>
          (CUISINE_CODES as readonly string[]).includes(c),
      );
      setSelectedCuisines(validCuisines);
    }
    setMaxBreakfast(preset.values.maxBreakfastMinutes);
    setMaxLunch(preset.values.maxLunchMinutes);
    setMaxDinner(preset.values.maxDinnerMinutes);
  }

  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) dlg.showModal();
    if (!open && dlg.open) dlg.close();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFavorites(readMenuPlanFavorites());
  }, [open]);

  // #6 URL-state paylaşılabilir link: URL'de `m=tavuk,pirinc&diet=vegan`
  // varsa modal otomatik açılır + form hydrate. Localstorage'dan önce
  // çalışır ki paylaş link her zaman baskın.
  useEffect(() => {
    if (hasInitedFromUrlRef.current) return;
    const m = searchParams.get("m");
    if (!m) return;
    hasInitedFromUrlRef.current = true;
    // Mount-once sync from URL query params to component state; the ref
    // guards re-runs so cascading renders won't happen in practice.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIngredientsText(m.split(",").map((s) => s.trim()).filter(Boolean).join(", "));
    const diet = searchParams.get("diet");
    if (diet) setDietSlug(diet);
    const macro = searchParams.get("macro");
    if (
      macro === "none" ||
      macro === "high-protein" ||
      macro === "low-calorie" ||
      macro === "high-fiber"
    ) {
      setMacroPreference(macro);
    }
    const kisi = searchParams.get("kisi");
    if (kisi) {
      const n = Number(kisi);
      if (Number.isFinite(n) && n >= 1 && n <= 12) setPersonCount(n);
    }
    const cuisinesRaw = searchParams.get("cuisines");
    if (cuisinesRaw) {
      const codes = cuisinesRaw
        .split(",")
        .map((s) => s.trim())
        .filter((c): c is CuisineCode =>
          (CUISINE_CODES as readonly string[]).includes(c),
        );
      if (codes.length > 0) setSelectedCuisines(codes);
    }
    const maxb = searchParams.get("maxb");
    if (maxb) {
      const n = Number(maxb);
      if (Number.isFinite(n)) setMaxBreakfast(n);
    }
    const maxl = searchParams.get("maxl");
    if (maxl) {
      const n = Number(maxl);
      if (Number.isFinite(n)) setMaxLunch(n);
    }
    const maxd = searchParams.get("maxd");
    if (maxd) {
      const n = Number(maxd);
      if (Number.isFinite(n)) setMaxDinner(n);
    }
    const ss = searchParams.get("ss");
    if (ss === "0") setAssumeStaples(false);
    // Modal otomatik aç, user'a formun hazır olduğunu göster.
    setOpen(true);
  }, [searchParams]);

  // #5 v4 form persistence: modal ilk açıldığında son form state'ini
  // hydrate et. Modal kapat + aç senaryosunda kullanıcı aynı ayarları
  // yeniden girmek zorunda kalmaz.
  const hasHydratedRef = useRef(false);
  useEffect(() => {
    if (!open || hasHydratedRef.current) return;
    hasHydratedRef.current = true;
    const saved = readV4FormState();
    if (!saved) return;
    // Mount-once sync from localStorage into state (same pattern as the
    // favorites effect above); hasHydratedRef guards against re-runs.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved.ingredientsText) setIngredientsText(saved.ingredientsText);
    if (typeof saved.assumeStaples === "boolean")
      setAssumeStaples(saved.assumeStaples);
    if (typeof saved.personCount === "number")
      setPersonCount(saved.personCount);
    if (typeof saved.dietSlug === "string") setDietSlug(saved.dietSlug);
    if (Array.isArray(saved.selectedCuisines)) {
      setSelectedCuisines(
        saved.selectedCuisines.filter((c): c is CuisineCode =>
          (CUISINE_CODES as readonly string[]).includes(c),
        ),
      );
    }
    if (typeof saved.maxBreakfast === "number")
      setMaxBreakfast(saved.maxBreakfast);
    if (typeof saved.maxLunch === "number") setMaxLunch(saved.maxLunch);
    if (typeof saved.maxDinner === "number") setMaxDinner(saved.maxDinner);
    if (
      saved.macroPreference === "none" ||
      saved.macroPreference === "high-protein" ||
      saved.macroPreference === "low-calorie" ||
      saved.macroPreference === "high-fiber"
    ) {
      setMacroPreference(saved.macroPreference);
    }
  }, [open]);

  // Değer değiştikçe localStorage'a yaz. Modal kapalıyken de hydrate
  // değerlerin yazımı olur (idempotent), cost düşük.
  useEffect(() => {
    saveV4FormState({
      ingredientsText,
      assumeStaples,
      personCount,
      dietSlug,
      selectedCuisines,
      maxBreakfast,
      maxLunch,
      maxDinner,
      macroPreference,
    });
  }, [
    ingredientsText,
    assumeStaples,
    personCount,
    dietSlug,
    selectedCuisines,
    maxBreakfast,
    maxLunch,
    maxDinner,
    macroPreference,
  ]);

  function applyFavorite(fav: MenuPlanFavorite) {
    const p = fav.payload;
    setIngredientsText(p.ingredients.join(", "));
    setAssumeStaples(p.assumePantryStaples);
    setPersonCount(p.personCount);
    setDietSlug(p.dietSlug);
    setSelectedCuisines(
      p.cuisines.filter((c): c is CuisineCode =>
        (CUISINE_CODES as readonly string[]).includes(c),
      ),
    );
    setMaxBreakfast(p.maxBreakfastMinutes);
    setMaxLunch(p.maxLunchMinutes);
    setMaxDinner(p.maxDinnerMinutes);
    setMacroPreference(p.macroPreference);
  }

  function confirmSaveFavorite() {
    const name = saveFavName.trim() || t("favoriteDefaultName");
    const ingredients = splitCsv(ingredientsText);
    const next = addMenuPlanFavorite(name, {
      ingredients,
      assumePantryStaples: assumeStaples,
      personCount,
      dietSlug,
      cuisines: selectedCuisines,
      maxBreakfastMinutes: maxBreakfast,
      maxLunchMinutes: maxLunch,
      maxDinnerMinutes: maxDinner,
      macroPreference,
    });
    setFavorites(next);
    setSaveFavName("");
    setSaveFavOpen(false);
  }

  function handleRemoveFavorite(id: string) {
    setFavorites(removeMenuPlanFavorite(id));
  }

  function reset() {
    setView("form");
    setResult(null);
    setError(null);
  }

  function closeDialog() {
    setOpen(false);
    reset();
  }

  function runGenerate(seedOverride?: string) {
    const ingredients = splitCsv(ingredientsText);
    if (ingredients.length === 0) {
      setError(t("errorNoIngredients"));
      return;
    }
    setError(null);
    // v4.3 anti-repeat: son 14 gün içinde önerilmiş tariflerden kaçın.
    // Her üretim sonrası yeni slug'lar history'ye eklenir.
    const excludeSlugs = readRecentSlugs();
    // #4 Commentary: bu üretimden ÖNCEKİ ortalamayı not et (yeni
    // snapshot henüz push edilmedi). Yeni plan bu çıpa ile karşılaştırılır.
    const statsBeforeThisPlan = readAveragePlanMetrics(5);
    setPrevStats(statsBeforeThisPlan);
    startGenerate(async () => {
      const res = await generateWeeklyMenuAction({
        ingredients,
        assumePantryStaples: assumeStaples,
        personCount,
        dietSlug: dietSlug || undefined,
        cuisines: selectedCuisines.length > 0 ? selectedCuisines : undefined,
        seed: seedOverride,
        maxBreakfastMinutes: maxBreakfast,
        maxLunchMinutes: maxLunch,
        maxDinnerMinutes: maxDinner,
        macroPreference,
        excludeSlugs: excludeSlugs.length > 0 ? excludeSlugs : undefined,
      });
      if (!res.success || !res.data) {
        setError(res.error ?? t("errorGeneric"));
        return;
      }
      setResult(res.data);
      setView("preview");
      pushToPantryHistory(ingredients);
      setHistoryBump((x) => x + 1);
      // Yeni planın dolu slot slug'larını history'ye push, bir sonraki
      // generate'de bu tarifler çıkarılır.
      const filled = res.data.slots.filter(
        (s): s is MenuSlot & { recipe: NonNullable<MenuSlot["recipe"]> } =>
          s.recipe !== null,
      );
      const newSlugs = filled.map((s) => s.recipe.slug);
      if (newSlugs.length > 0) pushGeneratedSlugs(newSlugs);
      // #4 Commentary personalization: bu plan'ın makro snapshot'ını
      // geçmişe ekle (bir sonraki plan ile karşılaştırılmak üzere).
      if (filled.length > 0) {
        const sumMin = filled.reduce((acc, s) => acc + s.recipe.totalMinutes, 0);
        const sumCal = filled.reduce(
          (acc, s) => acc + (s.recipe.averageCalories ?? 0),
          0,
        );
        pushPlanMetrics({
          avgMinutes: Math.round(sumMin / filled.length),
          avgCalories: Math.round(sumCal / filled.length),
          fillCount: filled.length,
        });
      }
    });
  }

  function handleGenerate() {
    runGenerate();
  }

  function handleRegenerate() {
    // Fresh seed each click; keeps form inputs as-is, just varies plan.
    const seed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    runGenerate(seed);
  }

  function handleRegenerateSlot(
    day: number,
    meal: "BREAKFAST" | "LUNCH" | "DINNER",
  ) {
    if (!result) return;
    const key = `${day}-${meal}`;
    setRegeneratingKey(key);
    setError(null);
    const currentSlots = result.slots
      .filter(
        (s): s is MenuSlot & { recipe: NonNullable<MenuSlot["recipe"]> } =>
          s.recipe !== null,
      )
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        mealType: s.mealType,
        slug: s.recipe.slug,
        categoryName: s.recipe.categoryName,
        cuisine: s.recipe.cuisine,
      }));
    const ingredients = splitCsv(ingredientsText);
    if (ingredients.length === 0) {
      setError(t("errorNoIngredients"));
      setRegeneratingKey(null);
      return;
    }
    startRegenerate(async () => {
      const res = await regenerateMenuSlotAction({
        input: {
          ingredients,
          assumePantryStaples: assumeStaples,
          personCount,
          dietSlug: dietSlug || undefined,
          cuisines: selectedCuisines.length > 0 ? selectedCuisines : undefined,
          maxBreakfastMinutes: maxBreakfast,
          maxLunchMinutes: maxLunch,
          maxDinnerMinutes: maxDinner,
          macroPreference,
        },
        targetDay: day,
        targetMeal: meal,
        currentSlots,
      });
      setRegeneratingKey(null);
      if (!res.success || !res.data) {
        setError(res.error ?? t("errorGeneric"));
        return;
      }
      const { recipe, reason } = res.data;
      setResult((prev) => {
        if (!prev) return prev;
        const nextSlots = prev.slots.map((s) =>
          s.dayOfWeek === day && s.mealType === meal
            ? { ...s, recipe, reason }
            : s,
        );
        return { ...prev, slots: nextSlots };
      });
      // v4.3 anti-repeat: yeni seçilen slug da history'ye eklensin,
      // bir sonraki tam plan üretiminde bu tarif çıkarılır.
      if (recipe?.slug) pushGeneratedSlugs([recipe.slug]);
    });
  }

  function handleShoppingList() {
    if (!result) return;
    const recipeIds = Array.from(
      new Set(
        result.slots
          .map((s) => s.recipe?.recipeId)
          .filter((id): id is string => Boolean(id)),
      ),
    );
    if (recipeIds.length === 0) {
      setError(t("errorNoSlots"));
      return;
    }
    setShoppingStatus(null);
    startShopping(async () => {
      const res = await addRecipesToShoppingListAction({
        recipeIds,
        personCount,
      });
      if (!res.success || !res.data) {
        setError(res.error ?? t("errorShopping"));
        return;
      }
      setShoppingStatus(
        t("shoppingSuccess", {
          recipeCount: res.data.recipeCount,
          addedCount: res.data.totalAdded,
          mergedCount: res.data.totalMerged,
        }),
      );
    });
  }

  /**
   * #6 Paylaşılabilir link: form değerlerini URL query string'e kodla
   * + clipboard'a kopyala. Alıcı linki açınca modal otomatik açılır +
   * aynı form değerleriyle dolar.
   */
  async function handleCopyShareLink() {
    const ingredients = splitCsv(ingredientsText);
    const params = new URLSearchParams();
    if (ingredients.length > 0) params.set("m", ingredients.join(","));
    if (dietSlug) params.set("diet", dietSlug);
    if (macroPreference !== "none") params.set("macro", macroPreference);
    if (personCount !== 2) params.set("kisi", String(personCount));
    if (selectedCuisines.length > 0)
      params.set("cuisines", selectedCuisines.join(","));
    if (maxBreakfast) params.set("maxb", String(maxBreakfast));
    if (maxLunch) params.set("maxl", String(maxLunch));
    if (maxDinner) params.set("maxd", String(maxDinner));
    if (!assumeStaples) params.set("ss", "0");
    const base =
      typeof window !== "undefined"
        ? `${window.location.origin}/menu-planlayici`
        : "/menu-planlayici";
    const url = `${base}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareCopiedStatus(t("shareLinkCopied"));
      setTimeout(() => setShareCopiedStatus(null), 2500);
    } catch {
      // Clipboard izin yok, fallback: show URL in status
      setShareCopiedStatus(url);
      setTimeout(() => setShareCopiedStatus(null), 5000);
    }
  }

  /**
   * #12 iCal export: v4 preview'den Blob indir. Mobil takvim +
   * Google/Outlook import uyumlu, floating local time.
   */
  function handleIcalDownload() {
    if (!result) return;
    const ics = buildIcalString({ slots: result.slots });
    const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tarifle-haftalik-menu.ics";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * #13 WhatsApp paylaş: mobilde Web Share API, desktop'ta wa.me
   * fallback. Metin formatlanmış 7 gün × dolu slot + tarif URL'leri.
   */
  async function handleShareWhatsApp() {
    if (!result) return;
    const text = buildShareText({ slots: result.slots });
    // Mobile Web Share API (iOS/Android): WhatsApp dahil tüm uygulama
    // share sheet'te.
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({
          title: t("shareTitle"),
          text,
        });
        return;
      } catch {
        // Kullanıcı iptal etti veya mobile share reject; desktop
        // fallback'e düş.
      }
    }
    // Desktop / share unsupported: wa.me deep link yeni sekmede aç.
    const url = buildWhatsAppUrl(text);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleApply() {
    if (!result) return;
    const slotsToApply = result.slots
      .filter((s): s is MenuSlot & { recipe: NonNullable<MenuSlot["recipe"]> } =>
        s.recipe !== null,
      )
      .map((s) => ({
        dayOfWeek: s.dayOfWeek,
        mealType: s.mealType,
        recipeId: s.recipe.recipeId,
      }));
    if (slotsToApply.length === 0) {
      setError(t("errorNoSlots"));
      return;
    }
    startApply(async () => {
      const res = await applyWeeklyMenuAction({
        slots: slotsToApply,
        replace: replaceExisting,
      });
      if (!res.success || !res.data) {
        setError(res.error ?? t("errorApply"));
        return;
      }
      closeDialog();
      router.refresh();
    });
  }

  const slotsByKey = useMemo(() => {
    const map = new Map<string, MenuSlot>();
    if (!result) return map;
    for (const s of result.slots) {
      map.set(`${s.dayOfWeek}-${s.mealType}`, s);
    }
    return map;
  }, [result]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        aria-label={t("triggerAria")}
      >
        <span aria-hidden>✨</span>
        {t("trigger")}
      </button>

      <dialog
        ref={dialogRef}
        className="w-full max-w-3xl rounded-xl border border-surface-muted bg-surface p-0 shadow-xl backdrop:bg-black/40"
        onClose={closeDialog}
      >
        <div className="flex items-start justify-between border-b border-surface-muted px-5 py-4">
          <div>
            <h2 className="font-heading text-lg font-bold text-text">
              {view === "form" ? t("formTitle") : t("previewTitle")}
            </h2>
            <p className="mt-0.5 text-sm text-text-muted">
              {view === "form" ? t("formSubtitle") : t("previewSubtitle")}
            </p>
          </div>
          <button
            type="button"
            onClick={closeDialog}
            className="rounded p-1 text-text-muted transition hover:bg-surface-muted hover:text-text"
            aria-label={t("close")}
          >
            ✕
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5">
          {error && (
            <div
              role="alert"
              className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
            >
              {error}
            </div>
          )}

          {view === "form" && (
            <div className="space-y-4">
              {favorites.length > 0 && (
                <div className="rounded-md border border-surface-muted bg-surface-muted/30 px-3 py-2">
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="font-medium text-text">
                      {t("favoritesLabel")}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {favorites.map((fav) => (
                      <div
                        key={fav.id}
                        className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 pl-2.5 pr-1 py-0.5 text-xs text-primary"
                      >
                        <button
                          type="button"
                          onClick={() => applyFavorite(fav)}
                          className="font-medium hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          aria-label={t("favoriteApplyAria", { name: fav.name })}
                        >
                          {fav.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFavorite(fav.id)}
                          className="rounded-full px-1 text-primary/60 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                          aria-label={t("favoriteRemoveAria", { name: fav.name })}
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <PresetChips mode="menu" onApply={applyMenuPreset} />
              <div>
                <label
                  htmlFor="ai-fill-ingredients"
                  className="mb-1 block text-sm font-medium text-text"
                >
                  {t("ingredientsLabel")}
                </label>
                <textarea
                  id="ai-fill-ingredients"
                  value={ingredientsText}
                  onChange={(e) => setIngredientsText(e.target.value)}
                  rows={4}
                  placeholder={t("ingredientsPlaceholder")}
                  className="w-full rounded-md border border-surface-muted bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
                />
                <p className="mt-1 text-xs text-text-muted">
                  {t("ingredientsHelp")}
                </p>
                <IngredientSuggestionBar
                  className="mt-2"
                  text={ingredientsText}
                  onReplaceLast={(name) =>
                    setIngredientsText((prev) => replaceLastToken(prev, name))
                  }
                />
                <PantryHistoryChips
                  className="mt-2"
                  refreshKey={historyBump}
                  onAdd={(name) =>
                    setIngredientsText((prev) => appendIngredient(prev, name))
                  }
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="ai-fill-person"
                    className="mb-1 block text-sm font-medium text-text"
                  >
                    {t("personCountLabel")}
                  </label>
                  <input
                    id="ai-fill-person"
                    type="number"
                    min={1}
                    max={12}
                    value={personCount}
                    onChange={(e) =>
                      setPersonCount(
                        Math.max(1, Math.min(12, Number(e.target.value) || 1)),
                      )
                    }
                    className="w-full rounded-md border border-surface-muted bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label
                    htmlFor="ai-fill-diet"
                    className="mb-1 block text-sm font-medium text-text"
                  >
                    {t("dietLabel")}
                  </label>
                  <select
                    id="ai-fill-diet"
                    value={dietSlug}
                    onChange={(e) => setDietSlug(e.target.value)}
                    className="w-full rounded-md border border-surface-muted bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                  >
                    {DIET_OPTIONS.map((d) => (
                      <option key={d.slug || "any"} value={d.slug}>
                        {t(d.labelKey)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="ai-fill-macro"
                  className="mb-1 block text-sm font-medium text-text"
                >
                  {t("macroLabel")}
                </label>
                <select
                  id="ai-fill-macro"
                  value={macroPreference}
                  onChange={(e) =>
                    setMacroPreference(e.target.value as MacroPreference)
                  }
                  className="w-full rounded-md border border-surface-muted bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
                >
                  {MACRO_OPTIONS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {t(m.labelKey)}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-text-muted">{t("macroHint")}</p>
              </div>

              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={assumeStaples}
                  onChange={(e) => setAssumeStaples(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-muted text-primary focus:ring-primary"
                />
                {t("assumeStaplesLabel")}
              </label>

              <div>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-text">
                    {t("cuisinesLabel")}
                  </span>
                  {selectedCuisines.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setSelectedCuisines([])}
                      className="text-xs text-text-muted underline underline-offset-2 hover:text-text"
                    >
                      {t("cuisinesClear")}
                    </button>
                  )}
                </div>
                <p className="mb-2 text-xs text-text-muted">
                  {selectedCuisines.length === 0
                    ? t("cuisinesHintAll")
                    : t("cuisinesHintSelected", {
                        count: selectedCuisines.length,
                      })}
                </p>
                <div
                  role="group"
                  aria-label={t("cuisinesLabel")}
                  className="flex flex-wrap gap-1.5"
                >
                  {CUISINE_CODES.map((code) => {
                    const active = selectedCuisines.includes(code);
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => toggleCuisine(code)}
                        aria-pressed={active}
                        className={`rounded-full border px-2.5 py-1 text-xs font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                          active
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-surface-muted bg-surface text-text-muted hover:border-primary/40 hover:text-text"
                        }`}
                      >
                        {CUISINE_LABEL[code]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {shareCopiedStatus && (
                <div
                  className="rounded-md border border-emerald-300/60 bg-emerald-50/70 px-3 py-2 text-xs text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-950/30 dark:text-emerald-200"
                  role="status"
                >
                  <span aria-hidden className="mr-1">✓</span>
                  {shareCopiedStatus}
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-2 border-t border-surface-muted pt-4">
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-1 rounded-md border border-surface-muted bg-surface px-3 py-2 text-xs font-medium text-text-muted transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={t("shareLinkAria")}
                  title={t("shareLinkAria")}
                >
                  <span aria-hidden>🔗</span>
                  {t("shareLinkButton")}
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={isGenerating}
                    className="rounded-md px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isGenerating ? t("generating") : t("generate")}
                  </button>
                </div>
              </div>
            </div>
          )}

          {view === "preview" && result && (
            <div className="space-y-4">
              <div className="rounded-md bg-surface-muted/40 px-3 py-2 text-sm text-text">
                {result.commentary}
              </div>

              {/* #6 edge UX: anti-repeat filter çok agresif davranıp
                  pool'u tüketirse kullanıcı "hep aynı boş slot" görür.
                  3+ unfilled + en az 1 history snapshot varsa temizle +
                  yeniden üret butonu göster. */}
              {result.unfilledCount >= 3 &&
                readRecentSlugs().length > 0 && (
                  <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-200">
                    <span className="flex-1">
                      <span aria-hidden className="mr-1">♻️</span>
                      {t("antiRepeatWarning", { count: result.unfilledCount })}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        clearMenuHistory();
                        runGenerate(
                          `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                        );
                      }}
                      disabled={isGenerating || isApplying || isRegenerating}
                      className="shrink-0 rounded-md border border-amber-400/60 bg-amber-100 px-2 py-1 text-xs font-semibold text-amber-900 transition hover:bg-amber-200 disabled:cursor-not-allowed disabled:opacity-60 dark:border-amber-500/40 dark:bg-amber-900/60 dark:text-amber-100 dark:hover:bg-amber-900"
                    >
                      {t("antiRepeatClearButton")}
                    </button>
                  </div>
                )}

              {(() => {
                if (!prevStats) return null;
                const filled = result.slots.filter(
                  (s): s is MenuSlot & { recipe: NonNullable<MenuSlot["recipe"]> } =>
                    s.recipe !== null,
                );
                if (filled.length === 0) return null;
                const curMin = Math.round(
                  filled.reduce((acc, s) => acc + s.recipe.totalMinutes, 0) /
                    filled.length,
                );
                const curCal = Math.round(
                  filled.reduce(
                    (acc, s) => acc + (s.recipe.averageCalories ?? 0),
                    0,
                  ) / filled.length,
                );
                const minDelta = prevStats.avgMinutes
                  ? Math.round(
                      ((curMin - prevStats.avgMinutes) / prevStats.avgMinutes) *
                        100,
                    )
                  : 0;
                const calDelta = prevStats.avgCalories
                  ? Math.round(
                      ((curCal - prevStats.avgCalories) /
                        prevStats.avgCalories) *
                        100,
                    )
                  : 0;
                const minLabel =
                  Math.abs(minDelta) < 5
                    ? t("personalizedBenzer")
                    : minDelta > 0
                      ? t("personalizedUst", { percent: minDelta })
                      : t("personalizedAlt", { percent: Math.abs(minDelta) });
                const calLabel =
                  Math.abs(calDelta) < 5
                    ? t("personalizedBenzer")
                    : calDelta > 0
                      ? t("personalizedUst", { percent: calDelta })
                      : t("personalizedAlt", { percent: Math.abs(calDelta) });
                return (
                  <div className="rounded-md border border-sky-200/60 bg-sky-50/60 px-3 py-2 text-xs text-sky-900 dark:border-sky-500/30 dark:bg-sky-950/30 dark:text-sky-200">
                    <span className="mr-1" aria-hidden>📊</span>
                    {t("personalizedPrefix", {
                      count: prevStats.sampleSize,
                      avgMinutes: prevStats.avgMinutes,
                      avgCalories: prevStats.avgCalories,
                    })}{" "}
                    <span className="font-medium">
                      {t("personalizedCurrent", {
                        curMinutes: curMin,
                        curCalories: curCal,
                      })}
                    </span>{" "}
                    <span className="text-sky-700 dark:text-sky-300">
                      {t("personalizedDelta", {
                        timeLabel: minLabel,
                        calLabel,
                      })}
                    </span>
                  </div>
                );
              })()}

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-surface-muted text-xs font-medium uppercase tracking-wider text-text-muted">
                      <th className="px-2 py-2"></th>
                      {(["BREAKFAST", "LUNCH", "DINNER"] as const).map((m) => (
                        <th key={m} className="px-2 py-2">
                          {mealLabels[m]}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {dayLabels.map((dayLabel, dayIdx) => (
                      <tr
                        key={dayIdx}
                        className="border-b border-surface-muted/60 align-top last:border-b-0"
                      >
                        <th
                          scope="row"
                          className="px-2 py-2 text-xs font-medium text-text-muted"
                        >
                          {dayLabel}
                        </th>
                        {(["BREAKFAST", "LUNCH", "DINNER"] as const).map(
                          (meal) => {
                            const slot = slotsByKey.get(`${dayIdx}-${meal}`);
                            if (!slot?.recipe) {
                              return (
                                <td
                                  key={meal}
                                  className="px-2 py-2 text-xs italic text-text-muted"
                                >
                                  {t("slotEmpty")}
                                </td>
                              );
                            }
                            const matchPct = Math.round(
                              (slot.recipe.matchScore ?? 0) * 100,
                            );
                            const perfect =
                              slot.recipe.missingIngredients.length === 0;
                            const cellKey = `${dayIdx}-${meal}`;
                            const isThisRegen = regeneratingKey === cellKey;
                            return (
                              <td key={meal} className="px-2 py-2">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-medium text-text">
                                      {slot.recipe.emoji && (
                                        <span aria-hidden className="mr-1">
                                          {slot.recipe.emoji}
                                        </span>
                                      )}
                                      {slot.recipe.title}
                                    </div>
                                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-text-muted">
                                      <span>{slot.recipe.totalMinutes} dk</span>
                                      <span
                                        className={`font-semibold ${
                                          perfect
                                            ? "text-accent-green"
                                            : matchPct >= 70
                                              ? "text-secondary"
                                              : "text-text-muted"
                                        }`}
                                        aria-label={t("matchAria", {
                                          percent: matchPct,
                                        })}
                                      >
                                        %{matchPct} {t("matchLabel")}
                                      </span>
                                      {slot.reason && <span>· {slot.reason}</span>}
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRegenerateSlot(dayIdx, meal)
                                    }
                                    disabled={
                                      isRegenerating ||
                                      isGenerating ||
                                      isApplying
                                    }
                                    className="shrink-0 rounded-md border border-surface-muted bg-surface px-1.5 py-0.5 text-xs leading-none text-text-muted transition hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                    aria-label={t("regenerateSlotAria")}
                                    title={t("regenerateSlotTitle")}
                                  >
                                    {isThisRegen ? "⏳" : "🎲"}
                                  </button>
                                </div>
                              </td>
                            );
                          },
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <label className="flex items-center gap-2 text-sm text-text">
                <input
                  type="checkbox"
                  checked={replaceExisting}
                  onChange={(e) => setReplaceExisting(e.target.checked)}
                  className="h-4 w-4 rounded border-surface-muted text-primary focus:ring-primary"
                />
                {t("replaceLabel")}
              </label>

              <div className="flex flex-wrap items-center gap-3 rounded-md border border-surface-muted bg-surface-muted/30 px-3 py-2">
                <div className="flex-1 text-xs text-text">
                  {shoppingStatus ??
                    (() => {
                      // #9 Alışveriş diff özeti: plan'daki dolu slot
                      // recipe'lerinden benzersiz eksik + dolap malzeme
                      // sayısı. shoppingHint fallback yerine dinamik
                      // satır, "X eksik, Y dolabında".
                      const filled = result.slots.filter(
                        (s): s is MenuSlot & { recipe: NonNullable<MenuSlot["recipe"]> } =>
                          s.recipe !== null,
                      );
                      if (filled.length === 0) return t("shoppingHint");
                      const missing = new Set<string>();
                      const have = new Set<string>();
                      for (const s of filled) {
                        for (const m of s.recipe.missingIngredients) {
                          missing.add(m.toLocaleLowerCase("tr"));
                        }
                        for (const m of s.recipe.matchedIngredients) {
                          have.add(m.toLocaleLowerCase("tr"));
                        }
                      }
                      return t("shoppingDiffSummary", {
                        recipeCount: filled.length,
                        missingCount: missing.size,
                        haveCount: have.size,
                      });
                    })()}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleShoppingList}
                    disabled={isShopping || isApplying || isGenerating}
                    className="inline-flex items-center gap-1 rounded-md border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={t("shoppingAria")}
                  >
                    <span aria-hidden>🛒</span>
                    {isShopping ? t("shoppingAdding") : t("shoppingButton")}
                  </button>
                  <button
                    type="button"
                    onClick={handleIcalDownload}
                    disabled={isApplying || isGenerating}
                    className="inline-flex items-center gap-1 rounded-md border border-sky-300/60 bg-sky-50 px-3 py-1.5 text-xs font-medium text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-sky-500/40 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-900/40"
                    aria-label={t("icalAria")}
                  >
                    <span aria-hidden>📅</span>
                    {t("icalButton")}
                  </button>
                  <button
                    type="button"
                    onClick={handleShareWhatsApp}
                    disabled={isApplying || isGenerating}
                    className="inline-flex items-center gap-1 rounded-md border border-emerald-300/60 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-emerald-500/40 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
                    aria-label={t("shareAria")}
                  >
                    <span aria-hidden>💬</span>
                    {t("shareButton")}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap justify-between gap-2 border-t border-surface-muted pt-4">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setView("form")}
                    disabled={isApplying || isGenerating}
                    className="rounded-md px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("back")}
                  </button>
                  <button
                    type="button"
                    onClick={handleRegenerate}
                    disabled={isApplying || isGenerating}
                    className="rounded-md border border-primary/30 bg-primary/5 px-4 py-2 text-sm font-medium text-primary transition hover:bg-primary/10 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={t("regenerateAria")}
                  >
                    {isGenerating ? t("generating") : t("regenerate")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSaveFavName("");
                      setSaveFavOpen(true);
                    }}
                    disabled={isApplying || isGenerating}
                    className="rounded-md border border-surface-muted bg-surface px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={t("favoriteSaveAria")}
                  >
                    ⭐ {t("favoriteSaveButton")}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={closeDialog}
                    disabled={isApplying || isGenerating}
                    className="rounded-md px-4 py-2 text-sm font-medium text-text-muted hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {t("cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleApply}
                    disabled={isApplying || isGenerating}
                    className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isApplying ? t("applying") : t("apply")}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {saveFavOpen && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/30 p-4">
            <div className="w-full max-w-sm rounded-xl border border-surface-muted bg-surface p-4 shadow-lg">
              <h3 className="text-sm font-semibold text-text">
                {t("favoriteSavePrompt")}
              </h3>
              <input
                type="text"
                autoFocus
                value={saveFavName}
                onChange={(e) => setSaveFavName(e.target.value)}
                maxLength={60}
                placeholder={t("favoriteSavePlaceholder")}
                className="mt-2 w-full rounded-md border border-surface-muted bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
              />
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSaveFavOpen(false);
                    setSaveFavName("");
                  }}
                  className="rounded-md px-3 py-1.5 text-sm text-text-muted hover:bg-surface-muted"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={confirmSaveFavorite}
                  className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
                >
                  {t("favoriteSaveConfirm")}
                </button>
              </div>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
