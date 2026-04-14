"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addCustomItemAction,
  clearAllItemsAction,
  clearCheckedItemsAction,
  removeItemAction,
  toggleItemAction,
} from "@/lib/actions/shopping-list";

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
  const [items, setItems] = useState<Item[]>(initialItems);
  const [newName, setNewName] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const { unchecked, checked } = useMemo(() => {
    return {
      unchecked: items.filter((i) => !i.isChecked),
      checked: items.filter((i) => i.isChecked),
    };
  }, [items]);

  function handleToggle(id: string) {
    const prev = items;
    setItems(items.map((i) => (i.id === id ? { ...i, isChecked: !i.isChecked } : i)));
    startTransition(async () => {
      const result = await toggleItemAction(id);
      if (!result.success) {
        setItems(prev);
        setError(result.error ?? "Güncellenemedi.");
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
        setError(result.error ?? "Silinemedi.");
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
        setError(result.error ?? "Eklenemedi.");
        return;
      }
      // Optimistic: we don't know the new id yet. Instead of refreshing whole page,
      // add a temp item with negative id until next server load. Simpler: add + reload.
      // We'll add locally with a synthetic id — server revalidates on next visit.
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
        setError(result.error ?? "Temizlenemedi.");
      } else {
        setError(null);
      }
    });
  }

  function handleClearAll() {
    if (items.length === 0) return;
    const confirmed = window.confirm("Tüm liste silinsin mi?");
    if (!confirmed) return;

    const prev = items;
    setItems([]);
    startTransition(async () => {
      const result = await clearAllItemsAction();
      if (!result.success) {
        setItems(prev);
        setError(result.error ?? "Temizlenemedi.");
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
          placeholder="Manuel malzeme ekle (örn. Tuz)"
          maxLength={200}
          className="flex-1 rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <input
          type="text"
          value={newAmount}
          onChange={(e) => setNewAmount(e.target.value)}
          placeholder="Miktar"
          maxLength={50}
          className="w-28 rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
        />
        <button
          type="submit"
          disabled={isPending || newName.trim().length === 0}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          Ekle
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
          <p className="text-text-muted">Liste boş. Bir tarif aç ve malzemeleri ekle.</p>
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-2 text-sm font-medium uppercase tracking-wide text-text-muted">
              Alınacaklar ({unchecked.length})
            </h2>
            {unchecked.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-text-muted">
                Tüm malzemeleri işaretledin.
              </p>
            ) : (
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-card">
                {unchecked.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onRemove={handleRemove}
                    disabled={isPending}
                  />
                ))}
              </ul>
            )}
          </section>

          {checked.length > 0 && (
            <section>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-medium uppercase tracking-wide text-text-muted">
                  Alındı ({checked.length})
                </h2>
                <button
                  onClick={handleClearChecked}
                  disabled={isPending}
                  className="text-xs text-text-muted transition-colors hover:text-error"
                >
                  İşaretlileri sil
                </button>
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
              Tüm listeyi temizle
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
