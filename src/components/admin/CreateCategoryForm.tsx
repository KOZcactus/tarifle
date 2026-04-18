"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { createCategoryAction } from "@/lib/actions/admin-taxonomy";

export function CreateCategoryForm() {
  const t = useTranslations("admin.categories");
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [emoji, setEmoji] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    startTransition(async () => {
      const res = await createCategoryAction({
        name: name.trim(),
        slug: slug.trim() || undefined,
        emoji: emoji.trim() || undefined,
        sortOrder: parseInt(sortOrder, 10) || 0,
      });
      if (res.success) {
        setName("");
        setSlug("");
        setEmoji("");
        setSortOrder("0");
        setError(null);
        router.refresh();
      } else {
        setError(res.error ?? t("createError"));
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-bg-card p-3"
    >
      <div className="flex flex-col">
        <label htmlFor="cat-emoji" className="mb-0.5 text-xs text-text-muted">
          {t("createEmojiLabel")}
        </label>
        <input
          id="cat-emoji"
          type="text"
          value={emoji}
          onChange={(e) => setEmoji(e.target.value)}
          maxLength={10}
          placeholder="🍲"
          className="w-20 rounded border border-border bg-bg-card px-2 py-1 text-center text-lg focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="cat-name" className="mb-0.5 text-xs text-text-muted">
          {t("createNameLabel")}
        </label>
        <input
          id="cat-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder={t("createNamePlaceholder")}
          required
          className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="cat-slug" className="mb-0.5 text-xs text-text-muted">
          {t("createSlugLabel")}
        </label>
        <input
          id="cat-slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          maxLength={100}
          placeholder={t("createSlugPlaceholder")}
          className="rounded border border-border bg-bg-card px-2 py-1 font-mono text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label htmlFor="cat-sort" className="mb-0.5 text-xs text-text-muted">
          {t("createOrderLabel")}
        </label>
        <input
          id="cat-sort"
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          min={0}
          max={999}
          className="w-16 rounded border border-border bg-bg-card px-2 py-1 text-right text-sm tabular-nums focus:border-primary focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending || name.trim().length < 2}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? t("createSubmitting") : t("createSubmit")}
      </button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  );
}
