"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createReport } from "@/lib/actions/report";

interface ReportButtonProps {
  targetType: "VARIATION";
  targetId: string;
}

const REASONS = [
  { value: "SPAM", label: "Spam / Reklam" },
  { value: "PROFANITY", label: "Uygunsuz dil" },
  { value: "MISLEADING", label: "Yanıltıcı bilgi" },
  { value: "HARMFUL", label: "Zararlı içerik" },
  { value: "OTHER", label: "Diğer" },
];

export function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (success) {
    return (
      <span className="text-xs text-accent-green">Raporlandı</span>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => {
          if (!session?.user) {
            router.push("/giris");
            return;
          }
          setIsOpen(true);
        }}
        className="text-xs text-text-muted transition-colors hover:text-error"
        title="Rapor et"
      >
        <FlagIcon />
      </button>
    );
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("targetType", targetType);
    formData.set("targetId", targetId);

    startTransition(async () => {
      const result = await createReport(formData);
      if (result.success) {
        setSuccess(true);
        setIsOpen(false);
      } else {
        setError(result.error || "Bir hata oluştu.");
      }
    });
  }

  return (
    <div className="mt-2 rounded-lg border border-border bg-bg p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-text">Rapor Et</span>
        <button
          onClick={() => setIsOpen(false)}
          className="text-xs text-text-muted hover:text-text"
        >
          İptal
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        {error && (
          <p className="text-xs text-error">{error}</p>
        )}

        <select
          name="reason"
          required
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          defaultValue=""
        >
          <option value="" disabled>Sebep seçin...</option>
          {REASONS.map((r) => (
            <option key={r.value} value={r.value}>{r.label}</option>
          ))}
        </select>

        <textarea
          name="description"
          rows={2}
          maxLength={500}
          className="w-full rounded-lg border border-border bg-bg px-3 py-2 text-xs text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Açıklama (isteğe bağlı)"
        />

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-error px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-error/90 disabled:opacity-50"
        >
          {isPending ? "Gönderiliyor..." : "Raporu Gönder"}
        </button>
      </form>
    </div>
  );
}

function FlagIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
      <line x1="4" x2="4" y1="22" y2="15" />
    </svg>
  );
}
