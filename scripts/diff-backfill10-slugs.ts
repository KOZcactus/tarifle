import * as fs from "node:fs";

const jsonSlugs = new Set(
  JSON.parse(fs.readFileSync("docs/translations-backfill-10.json", "utf-8"))
    .map((r: { slug: string }) => r.slug),
);
const dbSlugs = new Set(
  fs
    .readFileSync("tmp-db-slugs.txt", "utf-8")
    .split(/\r?\n/)
    .filter(Boolean),
);
const missing = [...jsonSlugs].filter((s) => !dbSlugs.has(s));
const lines = [`missing: ${missing.length}`, ...missing.map((s) => `  ${s}`)];
fs.writeFileSync("tmp-backfill10-missing.txt", lines.join("\n"), "utf-8");
console.log(lines.join("\n"));
