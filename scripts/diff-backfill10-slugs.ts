import * as fs from "node:fs";

const jsonSlugs = new Set<string>(
  (
    JSON.parse(
      fs.readFileSync("docs/translations-backfill-10.json", "utf-8"),
    ) as { slug: string }[]
  ).map((r) => r.slug),
);
const dbSlugs = new Set<string>(
  fs
    .readFileSync("tmp-db-slugs.txt", "utf-8")
    .split(/\r?\n/)
    .filter(Boolean),
);
const missing = [...jsonSlugs].filter((s) => !dbSlugs.has(s));
const lines = [`missing: ${missing.length}`, ...missing.map((s) => `  ${s}`)];
fs.writeFileSync("tmp-backfill10-missing.txt", lines.join("\n"), "utf-8");
console.log(lines.join("\n"));
