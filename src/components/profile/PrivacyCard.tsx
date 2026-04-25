"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  updateUserPrivacyAction,
  type PrivacyInput,
} from "@/lib/actions/user-privacy";
import { setShowDietBadgeAction } from "@/lib/actions/user-diet-profile";

interface PrivacyCardProps {
  initialShowChefScore: boolean;
  initialShowActivity: boolean;
  initialShowFollowCounts: boolean;
  /** Diyet badge gorunurluk toggle (oturum 20). Default true. */
  initialShowDietBadge: boolean;
}

/**
 * Profil gizlilik tercihleri (3 toggle), /ayarlar sayfasinda render edilir.
 *
 * Toggle off → ilgili veri baskalarina goz altinda gizlenir; owner kendi
 * profilinde her zaman gorur. Default hepsi acik.
 */
export function PrivacyCard(props: PrivacyCardProps) {
  const t = useTranslations("settings.privacy");
  const [chef, setChef] = useState(props.initialShowChefScore);
  const [activity, setActivity] = useState(props.initialShowActivity);
  const [follow, setFollow] = useState(props.initialShowFollowCounts);
  const [dietBadge, setDietBadge] = useState(props.initialShowDietBadge);
  const [isPending, startTransition] = useTransition();
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleSubmit(input: PrivacyInput) {
    setStatus("idle");
    setErrorMessage(null);
    startTransition(async () => {
      const result = await updateUserPrivacyAction(input);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "unknown");
      }
    });
  }

  function toggleChef(next: boolean) {
    setChef(next);
    handleSubmit({
      showChefScore: next,
      showActivity: activity,
      showFollowCounts: follow,
    });
  }
  function toggleActivity(next: boolean) {
    setActivity(next);
    handleSubmit({
      showChefScore: chef,
      showActivity: next,
      showFollowCounts: follow,
    });
  }
  function toggleFollow(next: boolean) {
    setFollow(next);
    handleSubmit({
      showChefScore: chef,
      showActivity: activity,
      showFollowCounts: next,
    });
  }
  /** Diyet badge toggle (oturum 20). Ayri server action, privacy
   *  schema'dan bagimsiz. */
  function toggleDietBadge(next: boolean) {
    setDietBadge(next);
    setStatus("idle");
    setErrorMessage(null);
    startTransition(async () => {
      const result = await setShowDietBadgeAction(next);
      if (result.success) {
        setStatus("success");
      } else {
        setStatus("error");
        setErrorMessage(result.error ?? "unknown");
      }
    });
  }

  return (
    <section className="rounded-xl border border-border bg-bg-card p-5">
      <header className="mb-3">
        <h2 className="font-heading text-base font-semibold text-text">
          {t("heading")}
        </h2>
        <p className="mt-1 text-sm text-text-muted">{t("subtitle")}</p>
      </header>

      <div className="divide-y divide-border rounded-lg border border-border">
        <ToggleRow
          label={t("chefScoreLabel")}
          description={t("chefScoreDescription")}
          checked={chef}
          onChange={toggleChef}
          disabled={isPending}
        />
        <ToggleRow
          label={t("activityLabel")}
          description={t("activityDescription")}
          checked={activity}
          onChange={toggleActivity}
          disabled={isPending}
        />
        <ToggleRow
          label={t("followCountsLabel")}
          description={t("followCountsDescription")}
          checked={follow}
          onChange={toggleFollow}
          disabled={isPending}
        />
        <ToggleRow
          label="Diyet uyumu rozeti"
          description="Tarif kartlarında diyet skoru chip'i ve detay sayfasında uyum kartı gösterilsin (Beta)."
          checked={dietBadge}
          onChange={toggleDietBadge}
          disabled={isPending}
        />
      </div>

      <p
        aria-live="polite"
        className={`mt-3 min-h-[1rem] text-xs ${
          status === "success"
            ? "text-accent-green"
            : status === "error"
              ? "text-error"
              : "text-text-muted"
        }`}
      >
        {status === "success" && t("savedMessage")}
        {status === "error" && (errorMessage ?? t("errorMessage"))}
      </p>
    </section>
  );
}

interface ToggleRowProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  disabled?: boolean;
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  disabled,
}: ToggleRowProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5 transition-colors hover:bg-bg-elevated">
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-text">{label}</span>
        <span className="mt-0.5 block text-xs text-text-muted">
          {description}
        </span>
      </span>
      <span className="relative inline-flex shrink-0 items-center">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span
          aria-hidden="true"
          className="block h-5 w-9 rounded-full bg-bg-elevated transition-colors peer-checked:bg-primary peer-disabled:opacity-50"
        />
        <span
          aria-hidden="true"
          className="absolute left-0.5 top-0.5 inline-block h-4 w-4 rounded-full bg-white shadow transition-transform peer-checked:translate-x-4"
        />
      </span>
    </label>
  );
}
