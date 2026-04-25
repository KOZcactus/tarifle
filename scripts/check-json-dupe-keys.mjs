#!/usr/bin/env node
/**
 * JSON duplicate top-level key guard (oturum 19 PWA i18n bug dersi).
 *
 * JSON.parse() ikinci duplicate top-level key'i birinciyi SESSIZCE
 * override ediyor. messages/tr.json'a `home` namespace iki kere
 * yazildiginda tum home.* i18n key'leri undefined oldu, ekranda raw
 * key'ler goruldu (home.heroTitle, home.sectionFeatured vs).
 *
 * Bu script `messages/*.json` dosyalarinda duplicate top-level key var
 * mi regex ile kontrol eder. Bulursa pre-push'u bloklar.
 *
 * Exit 0 temiz, exit 1 dupe bulundu.
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const dir = "messages";
const files = readdirSync(dir).filter((f) => f.endsWith(".json"));

let totalHits = 0;

for (const f of files) {
  const raw = readFileSync(join(dir, f), "utf8");
  const seen = new Set();
  const dupes = [];
  for (const m of raw.matchAll(/^ {2}"([a-zA-Z_][a-zA-Z0-9_-]*)":/gm)) {
    const key = m[1];
    if (seen.has(key)) {
      dupes.push(key);
    } else {
      seen.add(key);
    }
  }
  if (dupes.length > 0) {
    console.error(`❌ pre-push: ${join(dir, f)} duplicate top-level key:`);
    for (const k of dupes) {
      console.error(`   "${k}"`);
    }
    totalHits += dupes.length;
  }
}

if (totalHits > 0) {
  console.error(
    `\n  ${totalHits} duplicate key bulundu. JSON.parse() ikinci key'i\n` +
      `  birinciyi override ediyor; i18n key'leri kaybolur, ekranda raw\n` +
      `  key gorur. Duplicate key'i birinci namespace icine tasi.\n`,
  );
  process.exit(1);
}
