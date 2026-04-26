#!/usr/bin/env node
/**
 * scripts/canonical-rename-list.json'a gore seed-recipes.ts icindeki
 * slug + title string'lerini in-place degistir.
 *
 * Sadece literal `slug: "X"` ve `title: "X"` patternleri targetlenir.
 * Diger metin geçişleri (yorum, README) dokunulmaz.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const seedPath = path.join(ROOT, "scripts/seed-recipes.ts");
const listPath = path.join(ROOT, "scripts/canonical-rename-list.json");

const entries = JSON.parse(fs.readFileSync(listPath, "utf-8"));
let src = fs.readFileSync(seedPath, "utf-8");
const before = src.length;

let totalSlug = 0;
let totalTitle = 0;

for (const e of entries) {
  // slug literal: tek tirnak veya cift tirnak
  const slugRxDouble = new RegExp(`(slug:\\s*)"${escapeRx(e.currentSlug)}"`, "g");
  const slugRxSingle = new RegExp(`(slug:\\s*)'${escapeRx(e.currentSlug)}'`, "g");
  const titleRxDouble = new RegExp(`(title:\\s*)"${escapeRx(e.currentTitle)}"`, "g");
  const titleRxSingle = new RegExp(`(title:\\s*)'${escapeRx(e.currentTitle)}'`, "g");
  const beforeSlug = (src.match(slugRxDouble) || []).length + (src.match(slugRxSingle) || []).length;
  const beforeTitle = (src.match(titleRxDouble) || []).length + (src.match(titleRxSingle) || []).length;
  src = src.replace(slugRxDouble, `$1"${e.proposedSlug}"`);
  src = src.replace(slugRxSingle, `$1'${e.proposedSlug}'`);
  src = src.replace(titleRxDouble, `$1"${e.proposedTitle}"`);
  src = src.replace(titleRxSingle, `$1'${e.proposedTitle}'`);
  console.log(`${e.currentSlug} -> ${e.proposedSlug}: ${beforeSlug} slug + ${beforeTitle} title replaced`);
  totalSlug += beforeSlug;
  totalTitle += beforeTitle;
}

fs.writeFileSync(seedPath, src);
console.log(`\nTotal: ${totalSlug} slug + ${totalTitle} title literals replaced.`);
console.log(`File size: ${before} -> ${src.length}`);

function escapeRx(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
