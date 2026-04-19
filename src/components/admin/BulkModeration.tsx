"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
} from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  bulkModerateAction,
  type BulkModerateResult,
} from "@/lib/actions/admin";

/**
 * Çoklu moderasyon UI — admin/incelemeler + admin/yorumlar sayfalarında
 * kullanılır. Tek context + 3 parça:
 *
 *   <BulkModerationProvider targetType="VARIATION">
 *     <BulkToolbar .../>
 *     <list>
 *       {items.map(item => <><BulkCheckbox id={item.id} /> ...</>)}
 *     </list>
 *   </BulkModerationProvider>
 *
 * State sadece client-side; sayfa server component kalabilir, provider
 * wrapper client.
 */

type TargetType = "VARIATION" | "REVIEW";

interface BulkModerationContextValue {
  targetType: TargetType;
  selected: Set<string>;
  toggle: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clear: () => void;
  run: (action: "hide" | "approve") => Promise<BulkModerateResult>;
  isPending: boolean;
}

const BulkModerationContext = createContext<BulkModerationContextValue | null>(null);

interface BulkModerationProviderProps {
  targetType: TargetType;
  children: React.ReactNode;
}

export function BulkModerationProvider({
  targetType,
  children,
}: BulkModerationProviderProps) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const everySelected = ids.every((id) => next.has(id));
      if (everySelected) {
        for (const id of ids) next.delete(id);
      } else {
        for (const id of ids) next.add(id);
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setSelected(new Set()), []);

  const run = useCallback(
    async (action: "hide" | "approve"): Promise<BulkModerateResult> => {
      const ids = [...selected];
      if (ids.length === 0) {
        return { success: false, processed: 0, skipped: 0, error: "no-ids" };
      }
      return new Promise<BulkModerateResult>((resolve) => {
        startTransition(async () => {
          const res = await bulkModerateAction(targetType, action, ids);
          if (res.success) {
            setSelected(new Set());
            router.refresh();
          }
          resolve(res);
        });
      });
    },
    [selected, targetType, router],
  );

  const value = useMemo(
    () => ({
      targetType,
      selected,
      toggle,
      selectAll,
      clear,
      run,
      isPending,
    }),
    [targetType, selected, toggle, selectAll, clear, run, isPending],
  );

  return (
    <BulkModerationContext.Provider value={value}>
      {children}
    </BulkModerationContext.Provider>
  );
}

function useBulkModeration(): BulkModerationContextValue {
  const ctx = useContext(BulkModerationContext);
  if (!ctx) {
    throw new Error(
      "BulkModeration bileşenleri BulkModerationProvider içinde render edilmeli.",
    );
  }
  return ctx;
}

interface BulkCheckboxProps {
  id: string;
  ariaLabel?: string;
}

export function BulkCheckbox({ id, ariaLabel }: BulkCheckboxProps) {
  const { selected, toggle, isPending } = useBulkModeration();
  const t = useTranslations("admin.bulkModeration");
  return (
    <input
      type="checkbox"
      checked={selected.has(id)}
      onChange={() => toggle(id)}
      disabled={isPending}
      aria-label={ariaLabel ?? t("rowCheckboxAria")}
      className="h-4 w-4 shrink-0 cursor-pointer accent-primary"
    />
  );
}

interface BulkToolbarProps {
  allIds: string[];
}

export function BulkToolbar({ allIds }: BulkToolbarProps) {
  const { selected, selectAll, clear, run, isPending } = useBulkModeration();
  const [message, setMessage] = useState<string | null>(null);
  const t = useTranslations("admin.bulkModeration");
  const count = selected.size;

  async function handle(action: "hide" | "approve") {
    setMessage(null);
    const res = await run(action);
    if (res.success) {
      setMessage(t(action === "hide" ? "hideSuccess" : "approveSuccess", {
        processed: res.processed,
      }));
    } else {
      setMessage(t(`error_${res.error ?? "unknown"}` as "error_unknown"));
    }
  }

  if (count === 0 && allIds.length === 0) return null;

  return (
    <div className="sticky top-2 z-10 mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-bg-card/95 px-4 py-2 shadow-sm backdrop-blur">
      <button
        type="button"
        onClick={() => selectAll(allIds)}
        disabled={isPending || allIds.length === 0}
        className="text-xs font-medium text-text-muted transition-colors hover:text-primary disabled:opacity-50"
      >
        {t("selectAll", { count: allIds.length })}
      </button>
      <span className="text-xs text-text-muted">
        {count > 0 ? t("selected", { count }) : t("selectedEmpty")}
      </span>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => handle("approve")}
          disabled={isPending || count === 0}
          className="rounded-md bg-accent-green px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-accent-green/90 disabled:opacity-60"
        >
          {t("bulkApprove")}
        </button>
        <button
          type="button"
          onClick={() => handle("hide")}
          disabled={isPending || count === 0}
          className="rounded-md bg-error px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-error/90 disabled:opacity-60"
        >
          {t("bulkHide")}
        </button>
        <button
          type="button"
          onClick={clear}
          disabled={isPending || count === 0}
          className="rounded-md border border-border px-3 py-1.5 text-xs text-text-muted transition-colors hover:text-text disabled:opacity-60"
        >
          {t("clearSelection")}
        </button>
      </div>
      {message && (
        <p className="basis-full text-xs text-text-muted">{message}</p>
      )}
    </div>
  );
}
