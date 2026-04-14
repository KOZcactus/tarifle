"use client";

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-text-muted transition-colors hover:border-primary hover:text-primary"
    >
      <PrinterIcon />
      Yazdır
    </button>
  );
}

function PrinterIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <path d="M6 9V3a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v6" />
      <rect x="6" y="14" width="12" height="8" rx="1" />
    </svg>
  );
}
