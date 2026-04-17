"use client";

import { useState, useTransition } from "react";
import { broadcastNotificationAction } from "@/lib/actions/admin-ops";

export function BroadcastForm() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [link, setLink] = useState("");
  const [role, setRole] = useState<"" | "USER" | "MODERATOR" | "ADMIN">("");
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [result, setResult] = useState<{
    kind: "idle" | "success" | "error";
    message?: string;
  }>({ kind: "idle" });
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const confirmMsg = `Bu bildirim ${
      role ? `sadece ${role} rolüne` : "tüm kullanıcılara"
    }${onlyVerified ? " (yalnız doğrulanmışlara)" : ""} gidecek. Emin misin?`;
    if (!confirm(confirmMsg)) return;

    startTransition(async () => {
      const res = await broadcastNotificationAction({
        title: title.trim(),
        body: body.trim() || undefined,
        link: link.trim() || undefined,
        role: role || undefined,
        onlyVerified,
      });
      if (res.success) {
        setTitle("");
        setBody("");
        setLink("");
        setResult({
          kind: "success",
          message: `${res.count ?? 0} kullanıcıya bildirim gönderildi.`,
        });
      } else {
        setResult({ kind: "error", message: res.error ?? "Gönderilemedi." });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-xl border border-border bg-bg-card p-4"
    >
      <div className="flex flex-col">
        <label className="mb-0.5 text-xs text-text-muted">Başlık *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
          placeholder="Örn: Yeni özelliğimiz yayında"
          className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-0.5 text-xs text-text-muted">İçerik</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={3}
          placeholder="Kısa açıklama (opsiyonel)"
          className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-0.5 text-xs text-text-muted">
          Link (bildirim kutusundan gidilir)
        </label>
        <input
          type="text"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          maxLength={500}
          placeholder="/tarif/yeni-slug veya https://..."
          className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="flex flex-col">
          <label className="mb-0.5 text-xs text-text-muted">Hedef rol</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
          >
            <option value="">Tüm kullanıcılar</option>
            <option value="USER">Sadece üyeler (USER)</option>
            <option value="MODERATOR">Sadece moderatörler</option>
            <option value="ADMIN">Sadece adminler</option>
          </select>
        </div>
        <label className="flex items-center gap-2 self-end text-sm text-text">
          <input
            type="checkbox"
            checked={onlyVerified}
            onChange={(e) => setOnlyVerified(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Sadece e-posta doğrulanmışlar
        </label>
      </div>

      {result.kind === "success" && (
        <p className="rounded-lg bg-accent-green/15 px-3 py-2 text-sm text-accent-green">
          ✓ {result.message}
        </p>
      )}
      {result.kind === "error" && (
        <p className="rounded-lg bg-error/15 px-3 py-2 text-sm text-error">
          ✕ {result.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending || title.trim().length < 3}
        className="self-start rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
      >
        {pending ? "Gönderiliyor..." : "📣 Gönder"}
      </button>
    </form>
  );
}
