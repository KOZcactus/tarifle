"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { uploadRecipePhotoAction } from "@/lib/actions/recipe-photo";

interface UserPhotoUploadProps {
  recipeId: string;
}

const MAX_BYTES = 5 * 1024 * 1024;

/**
 * User photo upload widget, tarif detay sayfasındaki "Topluluk Fotoğrafları"
 * bölümünün üstünde render edilir (ancak feature flag açıksa). Authenticated
 * + email-verified kullanıcılar için açık; diğerleri için action server-side
 * reddeder ve mesaj i18n'e yansır.
 *
 * File'ı client'ta preview eder, caption alır, FormData ile server action'a
 * gönderir. `useTransition` pending state'i sırasında buton disabled kalır.
 */
export function UserPhotoUpload({ recipeId }: UserPhotoUploadProps) {
  const t = useTranslations("recipe.userPhotos");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = e.target.files?.[0] ?? null;
    setError(null);
    setSuccess(false);
    if (!picked) {
      setFile(null);
      setPreview(null);
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError(t("errorFileTooLarge"));
      setFile(null);
      setPreview(null);
      return;
    }
    setFile(picked);
    setPreview(URL.createObjectURL(picked));
  }

  function reset() {
    setFile(null);
    setPreview(null);
    setCaption("");
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setError(t("errorFileRequired"));
      return;
    }
    setError(null);
    setSuccess(false);

    const formData = new FormData();
    formData.set("recipeId", recipeId);
    formData.set("photo", file);
    if (caption) formData.set("caption", caption);

    startTransition(async () => {
      const result = await uploadRecipePhotoAction(formData);
      if (result.success) {
        setSuccess(true);
        reset();
      } else {
        const key = `error_${result.error ?? "unknown"}`;
        // i18n map, known codes have translated strings, else fallback.
        const knownErrors: Record<string, string> = {
          "error_auth-required": t("errorAuthRequired"),
          "error_email-not-verified": t("errorEmailNotVerified"),
          "error_account-suspended": t("errorAccountSuspended"),
          "error_feature-disabled": t("errorFeatureDisabled"),
          "error_rate-limited": t("errorRateLimited"),
          "error_file-required": t("errorFileRequired"),
          "error_file-too-large": t("errorFileTooLarge"),
          "error_file-type-unsupported": t("errorFileType"),
          "error_upload-failed": t("errorUploadFailed"),
          "error_recipe-not-found": t("errorRecipeNotFound"),
        };
        setError(knownErrors[key] ?? t("errorUnknown"));
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-dashed border-border bg-bg-card/60 p-4"
    >
      <div className="flex flex-wrap items-start gap-4">
        <label
          htmlFor="user-photo-file"
          className="flex h-24 w-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-border bg-bg-elevated text-3xl text-text-muted transition-colors hover:border-primary hover:text-primary"
        >
          {preview ? (
            <img src={preview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">📸</span>
          )}
          <input
            ref={inputRef}
            id="user-photo-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic"
            onChange={handleFileChange}
            className="sr-only"
          />
        </label>
        <div className="min-w-0 flex-1">
          <label
            htmlFor="user-photo-caption"
            className="mb-1 block text-sm font-medium text-text"
          >
            {t("uploadLabel")}
          </label>
          <p className="mb-2 text-xs text-text-muted">{t("uploadHelper")}</p>
          <input
            id="user-photo-caption"
            type="text"
            maxLength={200}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t("captionPlaceholder")}
            className="w-full rounded-md border border-border bg-bg-elevated px-3 py-2 text-sm outline-none focus:border-primary"
          />
        </div>
      </div>
      {error && (
        <p className="mt-3 rounded-lg bg-error/10 px-3 py-2 text-xs text-error">
          {error}
        </p>
      )}
      {success && (
        <p className="mt-3 rounded-lg bg-accent-green/10 px-3 py-2 text-xs text-accent-green">
          {t("uploadSuccess")}
        </p>
      )}
      <div className="mt-3 flex justify-end gap-2">
        {file && (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border border-border px-3 py-1.5 text-xs text-text-muted hover:text-text"
          >
            {t("cancel")}
          </button>
        )}
        <button
          type="submit"
          disabled={isPending || !file}
          className="rounded-lg bg-primary px-4 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isPending ? t("submitting") : t("submit")}
        </button>
      </div>
    </form>
  );
}
