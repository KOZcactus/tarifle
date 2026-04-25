"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { Allergen } from "@prisma/client";
import {
  updateUserPreferencesAction,
  type PreferencesInput,
} from "@/lib/actions/user-preferences";
import {
  CUISINE_CODES,
  CUISINE_FLAG,
  type CuisineCode,
} from "@/lib/cuisines";
import { ALLERGEN_ORDER, ALLERGEN_EMOJI } from "@/lib/allergens";

/**
 * Personal preferences card, /ayarlar sayfasında render edilir.
 *
 * Üç bölüm (toggle chips, çoklu seçim) accordion'da:
 *   - favoriteTags        → ilgilendiğin etiketler (vejetaryen, dusuk-kalorili…)
 *   - allergenAvoidances  → kaçındığın alerjenler (GLUTEN, SUT…)
 *   - favoriteCuisines    → favori mutfakların (tr/it/fr…)
 *
 * Oturum 21 revize: 55 chip (15+10+30) tek liste yerine 3 accordion
 * başlığı; kapalıyken seçili sayı badge'i, açıkken chip ızgarası.
 * Default: hepsi kapalı, kullanıcı ihtiyaç duyunca açar.
 */

const FAVORITE_TAG_SLUGS = [
  "pratik",
  "30-dakika-alti",
  "dusuk-kalorili",
  "yuksek-protein",
  "firinda",
  "tek-tencere",
  "misafir-sofrasi",
  "cocuk-dostu",
  "butce-dostu",
  "vegan",
  "vejetaryen",
  "alkollu",
  "alkolsuz",
  "kis-tarifi",
  "yaz-tarifi",
] as const;

interface PreferencesCardProps {
  initialFavoriteTags: string[];
  initialAllergenAvoidances: Allergen[];
  initialFavoriteCuisines: string[];
}

interface AccordionSectionProps {
  label: string;
  count: number;
  open: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function AccordionSection({
  label,
  count,
  open,
  onToggle,
  children,
}: AccordionSectionProps) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 py-3 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-text">
          {label}
          {count > 0 && (
            <span className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-primary/10 px-1.5 text-xs font-semibold text-primary">
              {count}
            </span>
          )}
        </span>
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`shrink-0 text-text-muted transition-transform ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}

export function PreferencesCard({
  initialFavoriteTags,
  initialAllergenAvoidances,
  initialFavoriteCuisines,
}: PreferencesCardProps) {
  const t = useTranslations("settings.preferences");
  const tTags = useTranslations("tags");
  const tAllergens = useTranslations("allergens");
  const tCuisines = useTranslations("cuisines");

  const [favoriteTags, setFavoriteTags] = useState<string[]>(initialFavoriteTags);
  const [allergenAvoidances, setAllergenAvoidances] = useState<Allergen[]>(
    initialAllergenAvoidances,
  );
  const [favoriteCuisines, setFavoriteCuisines] = useState<string[]>(
    initialFavoriteCuisines,
  );
  const [openSection, setOpenSection] = useState<
    "tags" | "allergens" | "cuisines" | null
  >(null);
  const [pending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<
    { kind: "success" | "error"; message: string } | null
  >(null);

  const toggleSection = (s: "tags" | "allergens" | "cuisines") => {
    setOpenSection((current) => (current === s ? null : s));
  };

  const toggleIn = <T extends string>(
    list: T[],
    value: T,
    setter: (next: T[]) => void,
  ): void => {
    if (list.includes(value)) {
      setter(list.filter((v) => v !== value));
    } else {
      setter([...list, value]);
    }
  };

  const handleSave = (): void => {
    setFeedback(null);
    const input: PreferencesInput = {
      favoriteTags,
      allergenAvoidances,
      favoriteCuisines: favoriteCuisines as CuisineCode[],
    };
    startTransition(async () => {
      const result = await updateUserPreferencesAction(input);
      setFeedback(
        result.success
          ? { kind: "success", message: t("savedFeedback") }
          : { kind: "error", message: t("errorFeedback") },
      );
    });
  };

  const hasChanges =
    JSON.stringify([...favoriteTags].sort()) !==
      JSON.stringify([...initialFavoriteTags].sort()) ||
    JSON.stringify([...allergenAvoidances].sort()) !==
      JSON.stringify([...initialAllergenAvoidances].sort()) ||
    JSON.stringify([...favoriteCuisines].sort()) !==
      JSON.stringify([...initialFavoriteCuisines].sort());

  return (
    <section className="rounded-xl border border-border bg-bg-card p-5">
      <header className="mb-3">
        <h2 className="font-heading text-base font-semibold text-text">
          {t("title")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">{t("description")}</p>
      </header>

      <div className="rounded-lg border border-border">
        <AccordionSection
          label={t("tagsTitle")}
          count={favoriteTags.length}
          open={openSection === "tags"}
          onToggle={() => toggleSection("tags")}
        >
          <p className="mb-3 px-1 text-xs text-text-muted">{t("tagsHelp")}</p>
          <div className="flex flex-wrap gap-2 px-1">
            {FAVORITE_TAG_SLUGS.map((slug) => {
              const active = favoriteTags.includes(slug);
              const label = tTags.has(slug) ? tTags(slug) : slug;
              return (
                <button
                  key={slug}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    toggleIn(favoriteTags, slug, (next) =>
                      setFavoriteTags(next),
                    )
                  }
                  disabled={pending}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                    active
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-bg text-text-muted hover:border-primary/50 hover:text-text"
                  }`}
                >
                  {active && (
                    <span className="mr-1" aria-hidden="true">
                      ✓
                    </span>
                  )}
                  #{label}
                </button>
              );
            })}
          </div>
        </AccordionSection>

        <AccordionSection
          label={t("allergensTitle")}
          count={allergenAvoidances.length}
          open={openSection === "allergens"}
          onToggle={() => toggleSection("allergens")}
        >
          <p className="mb-3 px-1 text-xs text-text-muted">
            {t("allergensHelp")}
          </p>
          <div className="flex flex-wrap gap-2 px-1">
            {ALLERGEN_ORDER.map((allergen) => {
              const active = allergenAvoidances.includes(allergen);
              const label = tAllergens.has(allergen)
                ? tAllergens(allergen)
                : allergen;
              return (
                <button
                  key={allergen}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    toggleIn(allergenAvoidances, allergen, (next) =>
                      setAllergenAvoidances(next),
                    )
                  }
                  disabled={pending}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                    active
                      ? "border-error bg-error/10 text-error"
                      : "border-border bg-bg text-text-muted hover:border-error/50 hover:text-text"
                  }`}
                >
                  <span aria-hidden="true" className="mr-1">
                    {ALLERGEN_EMOJI[allergen]}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </AccordionSection>

        <AccordionSection
          label={t("cuisinesTitle")}
          count={favoriteCuisines.length}
          open={openSection === "cuisines"}
          onToggle={() => toggleSection("cuisines")}
        >
          <p className="mb-3 px-1 text-xs text-text-muted">
            {t("cuisinesHelp")}
          </p>
          <div className="flex flex-wrap gap-2 px-1">
            {CUISINE_CODES.map((code) => {
              const active = favoriteCuisines.includes(code);
              const label = tCuisines.has(code) ? tCuisines(code) : code;
              return (
                <button
                  key={code}
                  type="button"
                  aria-pressed={active}
                  onClick={() =>
                    toggleIn(favoriteCuisines, code, (next) =>
                      setFavoriteCuisines(next),
                    )
                  }
                  disabled={pending}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                    active
                      ? "border-accent-blue bg-accent-blue/10 text-accent-blue"
                      : "border-border bg-bg text-text-muted hover:border-accent-blue/50 hover:text-text"
                  }`}
                >
                  <span aria-hidden="true" className="mr-1">
                    {CUISINE_FLAG[code]}
                  </span>
                  {label}
                </button>
              );
            })}
          </div>
        </AccordionSection>
      </div>

      {/* Save button + feedback */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending || !hasChanges}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {pending ? t("saving") : t("save")}
        </button>
        {feedback && (
          <p
            role="status"
            className={`text-sm ${
              feedback.kind === "success" ? "text-accent-green" : "text-error"
            }`}
          >
            {feedback.message}
          </p>
        )}
      </div>
    </section>
  );
}
