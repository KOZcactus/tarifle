"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  createAnnouncementAction,
  updateAnnouncementAction,
  deleteAnnouncementAction,
} from "@/lib/actions/admin-ops";

type Variant = "INFO" | "WARNING" | "SUCCESS";

interface InitialValues {
  id?: string;
  title?: string;
  body?: string | null;
  link?: string | null;
  variant?: Variant;
  startsAt?: Date | null;
  endsAt?: Date | null;
}

interface Props {
  initial?: InitialValues;
  /** Mevcut kaydı düzenleme modunda onClose → listeyi yenile + formu gizle. */
  onClose?: () => void;
}

function toLocalInput(d: Date | null | undefined): string {
  if (!d) return "";
  // datetime-local expects "YYYY-MM-DDTHH:mm" local time
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function AnnouncementForm({ initial, onClose }: Props) {
  const t = useTranslations("admin.announcements");
  const tActions = useTranslations("admin.actions");
  const router = useRouter();
  const isEdit = !!initial?.id;

  const [title, setTitle] = useState(initial?.title ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [link, setLink] = useState(initial?.link ?? "");
  const [variant, setVariant] = useState<Variant>(initial?.variant ?? "INFO");
  const [startsAt, setStartsAt] = useState(toLocalInput(initial?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(initial?.endsAt));
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const input = {
      title: title.trim(),
      body: body.trim() || undefined,
      link: link.trim() || undefined,
      variant,
      startsAt: startsAt || undefined,
      endsAt: endsAt || undefined,
    };
    startTransition(async () => {
      const res = isEdit
        ? await updateAnnouncementAction({ id: initial!.id!, patch: input })
        : await createAnnouncementAction(input);
      if (res.success) {
        if (!isEdit) {
          setTitle("");
          setBody("");
          setLink("");
          setVariant("INFO");
          setStartsAt("");
          setEndsAt("");
        }
        setError(null);
        onClose?.();
        router.refresh();
      } else {
        setError(res.error ?? t("createError"));
      }
    });
  }

  async function handleDelete() {
    if (!isEdit || !initial?.id) return;
    if (!confirm(t("rowDeleteConfirm", { title: initial.title ?? "" }))) return;
    startTransition(async () => {
      const res = await deleteAnnouncementAction({ id: initial.id! });
      if (res.success) {
        onClose?.();
        router.refresh();
      } else {
        setError(res.error ?? t("rowDeleteFailed"));
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-2 rounded-xl border border-border bg-bg-card p-4"
    >
      <div className="grid gap-2 md:grid-cols-[1fr_140px]">
        <div className="flex flex-col">
          <label className="mb-0.5 text-xs text-text-muted">{t("titleLabel")}</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            required
            className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex flex-col">
          <label className="mb-0.5 text-xs text-text-muted">{t("variantLabel")}</label>
          <select
            value={variant}
            onChange={(e) => setVariant(e.target.value as Variant)}
            className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
          >
            <option value="INFO">{t("variantInfo")}</option>
            <option value="WARNING">{t("variantWarning")}</option>
            <option value="SUCCESS">{t("variantSuccess")}</option>
          </select>
        </div>
      </div>
      <div className="flex flex-col">
        <label className="mb-0.5 text-xs text-text-muted">{t("bodyLabel")}</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          maxLength={1000}
          rows={2}
          placeholder={t("bodyPlaceholder")}
          className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="flex flex-col">
        <label className="mb-0.5 text-xs text-text-muted">{t("linkLabel")}</label>
        <input
          type="url"
          value={link}
          onChange={(e) => setLink(e.target.value)}
          maxLength={500}
          placeholder={t("linkPlaceholder")}
          className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
        />
      </div>
      <div className="grid gap-2 md:grid-cols-2">
        <div className="flex flex-col">
          <label className="mb-0.5 text-xs text-text-muted">{t("startsAtLabel")}</label>
          <input
            type="datetime-local"
            value={startsAt}
            onChange={(e) => setStartsAt(e.target.value)}
            className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
          />
          <p className="mt-0.5 text-[10px] text-text-muted">{t("startsAtHelp")}</p>
        </div>
        <div className="flex flex-col">
          <label className="mb-0.5 text-xs text-text-muted">{t("endsAtLabel")}</label>
          <input
            type="datetime-local"
            value={endsAt}
            onChange={(e) => setEndsAt(e.target.value)}
            className="rounded border border-border bg-bg-card px-2 py-1 text-sm focus:border-primary focus:outline-none"
          />
          <p className="mt-0.5 text-[10px] text-text-muted">{t("endsAtHelp")}</p>
        </div>
      </div>

      {error && <p className="text-xs text-error">{error}</p>}

      <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending || title.trim().length < 3}
            className="rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? t("submitting") : t("submit")}
          </button>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              disabled={pending}
              className="rounded-lg border border-border px-3 py-1.5 text-sm text-text-muted hover:bg-bg-elevated"
            >
              {tActions("clear")}
            </button>
          )}
        </div>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-lg border border-error/30 px-3 py-1.5 text-sm text-error hover:bg-error/10"
          >
            {t("rowDelete")}
          </button>
        )}
      </div>
    </form>
  );
}
