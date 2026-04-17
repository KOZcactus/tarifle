"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createTagAction } from "@/lib/actions/admin-taxonomy";

export function CreateTagForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) return;
    startTransition(async () => {
      const res = await createTagAction({
        name: name.trim(),
        slug: slug.trim() || undefined,
      });
      if (res.success) {
        setName("");
        setSlug("");
        setError(null);
        router.refresh();
      } else {
        setError(res.error ?? "Oluşturulamadı.");
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mb-4 flex flex-wrap items-end gap-2 rounded-xl border border-border bg-bg-card p-3"
    >
      <div className="flex flex-col">
        <label
          htmlFor="tag-name"
          className="mb-0.5 text-xs text-text-muted"
        >
          Etiket adı
        </label>
        <input
          id="tag-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={50}
          placeholder="örn: Kahvaltı Favorisi"
          required
          className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label
          htmlFor="tag-slug"
          className="mb-0.5 text-xs text-text-muted"
        >
          Slug (boş = otomatik)
        </label>
        <input
          id="tag-slug"
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          maxLength={50}
          placeholder="kahvalti-favorisi"
          className="rounded border border-border bg-bg-card px-2 py-1 font-mono text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={pending || name.trim().length < 2}
        className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Oluşturuluyor..." : "+ Etiket Ekle"}
      </button>
      {error && <p className="w-full text-xs text-error">{error}</p>}
    </form>
  );
}
