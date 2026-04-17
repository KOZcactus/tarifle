/**
 * Minimal, dependency-free CSV encoder for admin exports.
 *
 * RFC 4180 compatible:
 *   - Values containing commas, quotes, or newlines are quoted
 *   - Embedded quotes are doubled ("foo ""bar""" → foo "bar")
 *   - CRLF line ending (\r\n)
 *
 * UTF-8 BOM prepended so Excel opens Turkish characters correctly; without it
 * "ğ/ş/ü" land as mojibake.
 */

export type CsvCell = string | number | boolean | Date | null | undefined;
export type CsvRow = CsvCell[];

function escape(cell: CsvCell): string {
  if (cell === null || cell === undefined) return "";
  if (cell instanceof Date) return cell.toISOString();
  if (typeof cell === "boolean") return cell ? "true" : "false";
  const s = String(cell);
  if (/[",\r\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function toCsv(headers: string[], rows: CsvRow[]): string {
  const lines = [headers.map(escape).join(",")];
  for (const row of rows) {
    lines.push(row.map(escape).join(","));
  }
  const body = lines.join("\r\n");
  // UTF-8 BOM for Excel compatibility
  return `\ufeff${body}`;
}

/**
 * Build a Next.js Response with proper CSV headers + Content-Disposition so
 * the browser saves to disk with a sensible filename.
 */
export function csvResponse(csv: string, filename: string): Response {
  // Sanitise filename — keep ASCII letters/digits/dash/underscore/dot only.
  const safe = filename.replace(/[^\w.-]/g, "_");
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${safe}"`,
      "Cache-Control": "no-store",
    },
  });
}
