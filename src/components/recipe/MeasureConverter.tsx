"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  QUICK_REFERENCES,
  convert,
  formatConverted,
  getUnit,
  unitsByDomain,
  type MeasureDomain,
} from "@/lib/recipe/measure-conversions";

type Locale = "tr" | "en";

function unitLabel(unitId: string, locale: Locale): string {
  const u = getUnit(unitId);
  if (!u) return unitId;
  return locale === "en" ? u.shortEn : u.shortTr;
}

function unitLongLabel(unitId: string, locale: Locale): string {
  const u = getUnit(unitId);
  if (!u) return unitId;
  return locale === "en" ? u.longEn : u.longTr;
}

interface MeasureConverterProps {
  /** UI dili (TR/EN). Default TR. */
  locale?: Locale;
}

/**
 * Tarif detay sayfasında ingredient listesi yanında küçük çevirici.
 * Kullanıcı 1 su bardağı = 240 ml gibi ihtiyaç duyduğu çevrimi anında
 * görür, ayrı sekmeye gidip aramak zorunda kalmaz.
 *
 * Default kapalı (collapsed). Tek tıklama ile açılır, kullanıcı dilediği
 * iki birim arasında çevrim yapar veya hızlı referans tablosuna bakar.
 */
export function MeasureConverter({ locale = "tr" }: MeasureConverterProps) {
  const t = useTranslations("recipe.measureConverter");
  const [open, setOpen] = useState(false);
  const [domain, setDomain] = useState<MeasureDomain>("volume");
  const [fromValue, setFromValue] = useState<string>("1");
  const [fromUnit, setFromUnit] = useState<string>("su-bardagi");
  const [toUnit, setToUnit] = useState<string>("ml");
  const [showQuickRef, setShowQuickRef] = useState(false);

  const volumeUnits = useMemo(() => unitsByDomain("volume"), []);
  const weightUnits = useMemo(() => unitsByDomain("weight"), []);
  const activeUnits = domain === "volume" ? volumeUnits : weightUnits;

  function handleDomainChange(next: MeasureDomain) {
    setDomain(next);
    if (next === "volume") {
      setFromUnit("su-bardagi");
      setToUnit("ml");
    } else {
      setFromUnit("kg");
      setToUnit("gr");
    }
  }

  function swap() {
    setFromUnit(toUnit);
    setToUnit(fromUnit);
  }

  const numericValue = parseFloat(fromValue);
  const result = isNaN(numericValue)
    ? NaN
    : convert(numericValue, fromUnit, toUnit);
  const formatted = formatConverted(result);

  return (
    <div className="rounded-lg border border-border/70 bg-bg-elevated/40 print:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-xs font-medium text-text transition-colors hover:bg-bg-elevated/80"
      >
        <span className="flex items-center gap-1.5">
          <span aria-hidden="true">📏</span>
          {t("title")}
        </span>
        <span aria-hidden="true" className="text-text-muted">
          {open ? "▾" : "▸"}
        </span>
      </button>

      {open && (
        <div className="border-t border-border/60 p-3">
          {/* Domain switch */}
          <div
            className="mb-3 inline-flex rounded-md border border-border/60 p-0.5 text-xs"
            role="tablist"
            aria-label={t("domainLabel")}
          >
            <button
              type="button"
              role="tab"
              aria-selected={domain === "volume"}
              onClick={() => handleDomainChange("volume")}
              className={`rounded px-2.5 py-1 transition-colors ${
                domain === "volume"
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {t("volume")}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={domain === "weight"}
              onClick={() => handleDomainChange("weight")}
              className={`rounded px-2.5 py-1 transition-colors ${
                domain === "weight"
                  ? "bg-primary text-white"
                  : "text-text-muted hover:text-text"
              }`}
            >
              {t("weight")}
            </button>
          </div>

          {/* Converter row */}
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <input
              type="number"
              value={fromValue}
              onChange={(e) => setFromValue(e.target.value)}
              step="any"
              min={0}
              className="w-20 rounded-md border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
              aria-label={t("amountLabel")}
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="max-w-[10rem] rounded-md border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
              aria-label={t("fromUnitLabel")}
            >
              {activeUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {unitLongLabel(u.id, locale)}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={swap}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-border text-xs transition-colors hover:bg-bg-elevated"
              aria-label={t("swap")}
              title={t("swap")}
            >
              ⇄
            </button>

            <span aria-hidden="true" className="text-text-muted">
              =
            </span>
            <span className="min-w-[3rem] rounded-md bg-bg-card px-2 py-1 text-right font-medium text-primary">
              {formatted}
            </span>
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="max-w-[10rem] rounded-md border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
              aria-label={t("toUnitLabel")}
            >
              {activeUnits.map((u) => (
                <option key={u.id} value={u.id}>
                  {unitLongLabel(u.id, locale)}
                </option>
              ))}
            </select>
          </div>

          {/* Quick reference toggle */}
          <button
            type="button"
            onClick={() => setShowQuickRef((v) => !v)}
            aria-expanded={showQuickRef}
            className="mt-3 text-xs text-accent-blue underline-offset-2 hover:underline"
          >
            {showQuickRef ? t("hideQuickRef") : t("showQuickRef")}
          </button>

          {showQuickRef && (
            <ul className="mt-2 grid grid-cols-1 gap-1 text-xs text-text-muted sm:grid-cols-2">
              {QUICK_REFERENCES.map((ref) => {
                const value = convert(
                  ref.fromValue,
                  ref.fromUnitId,
                  ref.toUnitId,
                );
                return (
                  <li
                    key={`${ref.fromUnitId}-${ref.toUnitId}`}
                    className="flex justify-between rounded bg-bg-card/60 px-2 py-1"
                  >
                    <span>
                      {ref.fromValue} {unitLongLabel(ref.fromUnitId, locale)}
                    </span>
                    <span className="font-medium text-text">
                      {formatConverted(value)}{" "}
                      {unitLabel(ref.toUnitId, locale)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
