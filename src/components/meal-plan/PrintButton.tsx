"use client";

interface PrintButtonProps {
  label: string;
}

/** Small client wrapper — invokes the browser print dialog.  `@media print`
 *  CSS utility classes (`print:hidden`) strip the toolbar + interactive
 *  buttons from the printed view so the output is a clean grid. */
export function PrintButton({ label }: PrintButtonProps) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-card px-3 py-2 text-sm text-text transition-colors hover:border-primary hover:text-primary"
    >
      <span aria-hidden="true">🖨️</span>
      {label}
    </button>
  );
}
