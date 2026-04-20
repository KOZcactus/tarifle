"use client";

import { useTranslations } from "next-intl";

interface PdfDownloadButtonProps {
  slug: string;
}

/**
 * Tarif PDF indir butonu, `/tarif/[slug]/pdf` route'una anchor ile
 * yönlendirir. Native browser download davranışı (Content-Disposition
 * inline ile tab'da açılır, kullanıcı ⌘S ile kaydedebilir); direkt
 * kaydettirmek için `download` attribute.
 */
export function PdfDownloadButton({ slug }: PdfDownloadButtonProps) {
  const t = useTranslations("pdf");
  return (
    <a
      href={`/tarif/${slug}/pdf`}
      download={`${slug}.pdf`}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
    >
      <DocumentIcon />
      {t("button")}
    </a>
  );
}

function DocumentIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="12" y1="18" x2="12" y2="12" />
      <polyline points="9 15 12 18 15 15" />
    </svg>
  );
}
