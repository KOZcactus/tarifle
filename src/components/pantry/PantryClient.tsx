"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  addPantryItemAction,
  removePantryItemAction,
  updatePantryItemAction,
  bulkAddPantryItemsAction,
  type UserPantryItemView,
} from "@/lib/actions/pantry";
import {
  classifyIngredient,
  SUPERMARKET_CATEGORY_META,
  SUPERMARKET_CATEGORY_ORDER,
  type SupermarketCategory,
} from "@/lib/shopping/supermarket-categories";

interface PantryClientProps {
  initialItems: UserPantryItemView[];
}

function splitCsv(raw: string): string[] {
  return raw
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function PantryClient({ initialItems }: PantryClientProps) {
  const t = useTranslations("pantry");
  const tCat = useTranslations("shoppingList.category");
  const [items, setItems] = useState<UserPantryItemView[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Yaklaşan son kullanma (0-3 gün) bannerı
  const expiringSoon = useMemo(
    () => items.filter((i) => i.daysToExpiry !== null && i.daysToExpiry <= 3),
    [items],
  );

  // Kategori bazlı gruplama
  const byCategory = useMemo(() => {
    const map = new Map<SupermarketCategory, UserPantryItemView[]>();
    for (const cat of SUPERMARKET_CATEGORY_ORDER) map.set(cat, []);
    for (const item of items) {
      const cat = classifyIngredient(item.ingredientName);
      map.get(cat)!.push(item);
    }
    return map;
  }, [items]);

  function handleQuickAdd() {
    const name = newName.trim();
    if (!name) return;
    setError(null);
    startTransition(async () => {
      const res = await addPantryItemAction({ name });
      if (!res.success || !res.data) {
        setError(res.error ?? t("errors.add"));
        return;
      }
      setItems((prev) => {
        const existing = prev.findIndex((i) => i.id === res.data!.id);
        if (existing >= 0) {
          const clone = [...prev];
          clone[existing] = res.data!;
          return clone;
        }
        return [res.data!, ...prev];
      });
      setNewName("");
    });
  }

  function handleBulkAdd() {
    const names = splitCsv(bulkText);
    if (names.length === 0) return;
    setError(null);
    startTransition(async () => {
      const res = await bulkAddPantryItemsAction({ names });
      if (!res.success || !res.data) {
        setError(res.error ?? t("errors.bulk"));
        return;
      }
      setStatusMsg(
        t("bulkSuccess", { added: res.data.added, updated: res.data.updated }),
      );
      setBulkText("");
      setBulkOpen(false);
      // Yeni liste için /dolap'ı refresh etmektense server fetch yapalım.
      // Basit yaklaşım: window.location.reload() yerine state sync için
      // bir re-fetch action yazabiliriz ama şimdilik reload pratik.
      setTimeout(() => window.location.reload(), 500);
    });
  }

  function handleRemove(id: string) {
    const prev = items;
    setItems(items.filter((i) => i.id !== id));
    startTransition(async () => {
      const res = await removePantryItemAction(id);
      if (!res.success) {
        setItems(prev);
        setError(res.error ?? t("errors.remove"));
      }
    });
  }

  function handleQuantityChange(id: string, value: string) {
    const num = value === "" ? null : Number(value);
    if (num !== null && (!Number.isFinite(num) || num < 0)) return;
    startTransition(async () => {
      const res = await updatePantryItemAction({
        id,
        quantity: num,
      });
      if (res.success && res.data) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? res.data! : i)),
        );
      }
    });
  }

  function handleExpiryChange(id: string, value: string) {
    startTransition(async () => {
      const res = await updatePantryItemAction({
        id,
        expiryDate: value || null,
      });
      if (res.success && res.data) {
        setItems((prev) =>
          prev.map((i) => (i.id === id ? res.data! : i)),
        );
      }
    });
  }

  return (
    <div className="space-y-6">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/50 dark:text-red-300"
        >
          {error}
        </div>
      )}
      {statusMsg && (
        <div
          role="status"
          className="rounded-md border border-emerald-300/60 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          {statusMsg}
        </div>
      )}

      {expiringSoon.length > 0 && (
        <div className="rounded-xl border border-amber-300/60 bg-amber-50/70 p-4 dark:border-amber-500/30 dark:bg-amber-950/30">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            <span aria-hidden className="mr-1">⚠️</span>
            {t("expiringSoonTitle", { count: expiringSoon.length })}
          </p>
          <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
            {expiringSoon
              .map((i) =>
                i.daysToExpiry === 0
                  ? t("expiringToday", { name: i.displayName })
                  : i.daysToExpiry === 1
                    ? t("expiringTomorrow", { name: i.displayName })
                    : t("expiringInDays", {
                        name: i.displayName,
                        days: i.daysToExpiry!,
                      }),
              )
              .join(" · ")}
          </p>
        </div>
      )}

      <section className="rounded-xl border border-border bg-bg-card p-4 sm:p-5">
        <h2 className="mb-3 font-heading text-base font-semibold">
          {t("addSectionTitle")}
        </h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleQuickAdd();
              }
            }}
            placeholder={t("addPlaceholder")}
            disabled={isPending}
            className="flex-1 min-w-[200px] rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isPending || !newName.trim()}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {t("addButton")}
          </button>
          <button
            type="button"
            onClick={() => setBulkOpen((v) => !v)}
            disabled={isPending}
            className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-medium text-text-muted transition hover:border-primary/40 hover:text-primary"
          >
            {bulkOpen ? t("bulkCancel") : t("bulkOpen")}
          </button>
        </div>
        {bulkOpen && (
          <div className="mt-3 space-y-2">
            <p className="text-xs text-text-muted">{t("bulkHelper")}</p>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={3}
              placeholder={t("bulkPlaceholder")}
              className="w-full rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={handleBulkAdd}
              disabled={isPending || !bulkText.trim()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t("bulkAddButton")}
            </button>
          </div>
        )}
      </section>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-12 text-center">
          <p className="text-sm text-text-muted">{t("emptyBody")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-text-muted">
            {t("totalItems", { count: items.length })}
          </p>
          {SUPERMARKET_CATEGORY_ORDER.map((cat) => {
            const groupItems = byCategory.get(cat) ?? [];
            if (groupItems.length === 0) return null;
            const meta = SUPERMARKET_CATEGORY_META[cat];
            return (
              <section
                key={cat}
                className="rounded-xl border border-border bg-bg-card p-4"
              >
                <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-text">
                  <span aria-hidden>{meta.emoji}</span>
                  {tCat(cat)}
                  <span className="text-xs text-text-muted">
                    ({groupItems.length})
                  </span>
                </h3>
                <ul className="space-y-2">
                  {groupItems.map((item) => {
                    const urgent =
                      item.daysToExpiry !== null && item.daysToExpiry <= 3;
                    const expired =
                      item.daysToExpiry !== null && item.daysToExpiry < 0;
                    return (
                      <li
                        key={item.id}
                        className={`flex flex-wrap items-center gap-2 rounded-lg border px-3 py-2 ${
                          expired
                            ? "border-red-300/60 bg-red-50 dark:border-red-500/40 dark:bg-red-950/30"
                            : urgent
                              ? "border-amber-300/60 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-950/30"
                              : "border-border bg-bg"
                        }`}
                      >
                        <span className="flex-1 text-sm font-medium text-text">
                          {item.displayName}
                        </span>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          value={item.quantity ?? ""}
                          onChange={(e) =>
                            handleQuantityChange(item.id, e.target.value)
                          }
                          placeholder={t("quantityPlaceholder")}
                          disabled={isPending}
                          className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text focus:border-primary focus:outline-none"
                          aria-label={t("quantityAria", { name: item.displayName })}
                        />
                        <input
                          type="text"
                          value={item.unit ?? ""}
                          onChange={(e) => {
                            const unit = e.target.value;
                            startTransition(async () => {
                              await updatePantryItemAction({
                                id: item.id,
                                unit: unit || null,
                              });
                            });
                            setItems((prev) =>
                              prev.map((i) =>
                                i.id === item.id ? { ...i, unit } : i,
                              ),
                            );
                          }}
                          placeholder={t("unitPlaceholder")}
                          disabled={isPending}
                          className="w-20 rounded-md border border-border bg-surface px-2 py-1 text-xs text-text focus:border-primary focus:outline-none"
                          aria-label={t("unitAria", { name: item.displayName })}
                        />
                        <input
                          type="date"
                          value={item.expiryDate ?? ""}
                          onChange={(e) =>
                            handleExpiryChange(item.id, e.target.value)
                          }
                          disabled={isPending}
                          className={`rounded-md border bg-surface px-2 py-1 text-xs focus:border-primary focus:outline-none ${
                            expired
                              ? "border-red-400 text-red-700 dark:text-red-300"
                              : urgent
                                ? "border-amber-400 text-amber-800 dark:text-amber-200"
                                : "border-border text-text"
                          }`}
                          aria-label={t("expiryAria", { name: item.displayName })}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemove(item.id)}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-text-muted transition hover:bg-red-100 hover:text-red-700 dark:hover:bg-red-950/40 dark:hover:text-red-300"
                          aria-label={t("removeAria", { name: item.displayName })}
                          title={t("removeTitle")}
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
                      </li>
                    );
                  })}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
