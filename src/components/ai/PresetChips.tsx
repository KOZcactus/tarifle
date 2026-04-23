"use client";

import { useTranslations } from "next-intl";
import {
  MENU_PRESETS,
  SINGLE_PRESETS,
  type MenuPreset,
  type SinglePreset,
} from "@/lib/ai/presets";

interface SingleProps {
  mode: "single";
  onApply: (preset: SinglePreset) => void;
}

interface MenuProps {
  mode: "menu";
  onApply: (preset: MenuPreset) => void;
}

type Props = (SingleProps | MenuProps) & {
  className?: string;
};

/**
 * Row of "audience" preset chips (e.g. 👨‍👩‍👧 Misafir Sofrası, 🌿 Hafif Akşam).
 * Clicking a chip fires `onApply(preset)` so the parent form can push the
 * preset's values into its own state. Mode decides which preset set is shown
 * because v3 (single-recipe) and v4 (weekly menu) expose different filter
 * surfaces.
 */
export function PresetChips(props: Props) {
  const t = useTranslations("aiPresets");
  const presets = props.mode === "single" ? SINGLE_PRESETS : MENU_PRESETS;

  return (
    <div
      role="group"
      aria-label={t("groupAria")}
      className={`flex flex-wrap items-center gap-1.5 text-xs ${props.className ?? ""}`}
    >
      <span className="text-text-muted">{t("label")}</span>
      {presets.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => {
            if (props.mode === "single") {
              props.onApply(p as SinglePreset);
            } else {
              props.onApply(p as MenuPreset);
            }
          }}
          title={t(`${props.mode}.${p.labelKey}.description`)}
          className="inline-flex items-center gap-1 rounded-full border border-surface-muted bg-surface px-2.5 py-1 text-text-muted transition hover:border-primary/40 hover:bg-primary/5 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <span aria-hidden>{p.icon}</span>
          <span>{t(`${props.mode}.${p.labelKey}.label`)}</span>
        </button>
      ))}
    </div>
  );
}
