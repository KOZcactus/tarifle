"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  addCustomItemAction,
  clearAllItemsAction,
  clearCheckedItemsAction,
  moveCheckedToPantryAction,
  removeItemAction,
  toggleItemAction,
} from "@/lib/actions/shopping-list";
import {
  classifyIngredient,
  SUPERMARKET_CATEGORY_META,
  SUPERMARKET_CATEGORY_ORDER,
  type SupermarketCategory,
} from "@/lib/shopping/supermarket-categories";

interface Item {
  id: string;
  name: string;
  amount: string | null;
  unit: string | null;
  isChecked: boolean;
}

interface ShoppingListClientProps {
  initialItems: Item[];
}

export function ShoppingListClient({ initialItems }: ShoppingListClientProps) {
  const t = useTranslations("shoppingList");
  const tErrors = useTranslations("shoppingList.errors");
  const [items, setItems] = useState<Item[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { unchecked, checked, uncheckedByCategory } = useMemo(() => {
    const u = items.filter((i) => !i.isChecked);
    const c = items.filter((i) => i.isChecked);
    // Akilli grupland: her unchecked item'i supermarket kategorisine ata.
    // Map insertion sirasi SUPERMARKET_CATEGORY_ORDER ile sabitlenir,
    // boylece manav-kasap-sut-firin-... sirayla render edilir.
    const grouped = new Map<SupermarketCategory, typeof u>();
    for (const cat of SUPERMARKET_CATEGORY_ORDER) grouped.set(cat, []);
    for (const item of u) {
      const cat = classifyIngredient(item.name);
      grouped.get(cat)!.push(item);
    }
    return { unchecked: u, checked: c, uncheckedByCategory: grouped };
  }, [items]);

  function handleToggle(id: string) {
    const prev = items;
    setItems(items.map((i) => (i.id === id ? { ...i, isChecked: !i.isChecked } : i)));
    startTransition(async () => {
      const result = await toggleItemAction(id);
      if (!result.success) {
        setItems(prev);
        setError(result.error ?? tErrors("update"));
      } else {
        setError(null);
      }
    });
  }

  function handleRemove(id: string) {
    const prev = items;
    setItems(items.filter((i) => i.id !== id));
    startTransition(async () => {
      const result = await removeItemAction(id);
      if (!result.success) {
        setItems(prev);
        setError(result.error ?? tErrors("remove"));
      } else {
        setError(null);
      }
    });
  }

  function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (name.length < 1) return;

    startTransition(async () => {
      const result = await addCustomItemAction({
        name,
        amount: newAmount.trim() || undefined,
      });
      if (!result.success) {
        setError(result.error ?? tErrors("add"));
        return;
      }
      // Optimistic: we don't know the new id yet. Instead of refreshing whole page,
      // add a temp item with negative id until next server load. Simpler: add + reload.
      // We'll add locally with a synthetic id, server revalidates on next visit.
      setItems((list) => [
        ...list,
        {
          id: `temp-${Date.now()}`,
          name,
          amount: newAmount.trim() || null,
          unit: null,
          isChecked: false,
        },
      ]);
      setNewName("");
      setNewAmount("");
      setError(null);
    });
  }

  function handleClearChecked() {
    if (checked.length === 0) return;
    const prev = items;
    setItems(items.filter((i) => !i.isChecked));
    startTransition(async () => {
      const result = await clearCheckedItemsAction();
      if (!result.success) {
        setItems(prev);
        setError(result.error ?? tErrors("clear"));
      } else {
        setError(null);
      }
    });
  }

  function handleMoveToPantry() {
    if (checked.length === 0) return;
    const prev = items;
    // Optimistic: checked olanlar listeden kalksin (pantry'ye tasindi).
    setItems(items.filter((i) => !i.isChecked));
    startTransition(async () => {
      const result = await moveCheckedToPantryAction();
      if (!result.success) {
        setItems(prev);
        setError(result.error ?? tErrors("clear"));
      } else {
        setError(null);
      }
    });
  }

  function handleClearAll() {
    if (items.length === 0) return;
    const confirmed = window.confirm(t("clearAllConfirm"));
    if (!confirmed) return;

    const prev = items;
    setItems([]);
    startTransition(async () => {
      const result = await clearAllItemsAction();
      if (!result.success) {
        setItems(prev);
        setError(result.error ?? tErrors("clear"));
      } else {
        setError(null);
      }
    });
  }

  return (
    <div className="space-y-6">
      {/* Quick add */}
      <form
        onSubmit={handleAdd}
        className="flex gap-2 rounded-xl border border-border bg-bg-card p-3"
      >
        <input
          type="text"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder={t("addPlaceholder")}
          maxLength={200}
          className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          type="text"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder={t("addAmountPlaceholder")}
          maxLength={50}
          className="w-28 rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={isPending || newName.trim().length === 0}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {t("addButton")}
        </button>
      </form>

      {error && (
        <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      {/* Unchecked items */}
      {unchecked.length === 0 && checked.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-10 text-center">
          <p className="text-text-muted">{t("empty")}</p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-text-muted">
              {t("toShopHeader", { count: unchecked.length })}
            </h2>
            {unchecked.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
                {t("allChecked")}
              </p>
            ) : (
              <div className="space-y-4">
                {SUPERMARKET_CATEGORY_ORDER.map((cat) => {
                  const list = uncheckedByCategory.get(cat) ?? [];
                  if (list.length === 0) return null;
                  const meta = SUPERMARKET_CATEGORY_META[cat];
                  return (
                    <div key={cat}>
                      <h3 className="mb-1.5 flex items-center gap-2 px-1 text-xs font-semibold uppercase tracking-wide text-text-muted">
                        <span aria-hidden="true">{meta.emoji}</span>
                        {t(`category.${cat}`)}
                        <span className="ml-auto rounded-full bg-bg-elevated px-2 py-0.5 text-[10px] font-medium tabular-nums text-text">
                          {list.length}
                        </span>
                      </h3>
                      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card">
                        {list.map((item) => (
                          <ItemRow
                            key={item.id}
                            item={item}
                            onToggle={handleToggle}
                            onRemove={handleRemove}
                            disabled={isPending}
                          />
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {checked.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">
                  {t("boughtHeader", { count: checked.length })}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleMoveToPantry}
                    disabled={isPending}
                    className="rounded-full border border-emerald-300/60 bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-900 transition-colors hover:border-emerald-500 hover:bg-emerald-100 dark:border-emerald-700/60 dark:bg-emerald-950/40 dark:text-emerald-100 dark:hover:border-emerald-500"
                    title={t("moveToPantryTitle")}
                  >
                    🎒 {t("moveToPantry")}
                  </button>
                  <button
                    onClick={handleClearChecked}
                    disabled={isPending}
                    className="text-xs text-text-muted transition-colors hover:text-error"
                  >
                    {t("clearChecked")}
                  </button>
                </div>
              </div>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card opacity-70">
                {checked.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onRemove={handleRemove}
                    disabled={isPending}
                  />
                ))}
              </ul>
            </section>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleClearAll}
              disabled={isPending}
              className="text-xs text-text-muted transition-colors hover:text-error"
            >
              {t("clearAll")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

interface ItemRowProps {
  item: Item;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  disabled: boolean;
}

function ItemRow({ item, onToggle, onRemove, disabled }: ItemRowProps) {
  return (
    <li className="flex items-center gap-3 px-4 py-3">
      <button
        onClick={() => onToggle(item.id)}
        disabled={disabled || item.id.startsWith("temp-")}
        aria-checked={item.isChecked}
        role="checkbox"
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors ${
          item.isChecked
            ? "border-accent-green bg-accent-green text-white"
            : "border-border hover:border-primary"
        }`}
      >
        {item.isChecked && (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="20 6 9 17 4 12" />
          </svg>
        )}
      </button>
      <span
        className={`flex-1 text-sm ${
          item.isChecked ? "text-text-muted line-through" : "text-text"
        }`}
      >
        {item.name}
        {(item.amount || item.unit) && (
          <span className="ml-2 text-xs text-text-muted">
            {item.amount}
            {item.unit ? ` ${item.unit}` : ""}
          </span>
        )}
      </span>
      <button
        onClick={() => onRemove(item.id)}
        disabled={disabled || item.id.startsWith("temp-")}
        aria-label="Sil"
        className="text-text-muted transition-colors hover:text-error"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14Z" />
        </svg>
      </button>
    </li>
  );
}
