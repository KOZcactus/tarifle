/**
 * Source-DB ingredient sync for 11 SKIP_FINDINGS drift slug'ları.
 *
 * 9 slug: source ingredient list eksik, DB'den çekilen tam liste source'a yazılır.
 * 2 slug: source-DB ingredient list aynı ama allergen tetiklemiyor.
 *   - mafis-tatlisi-balikesir-usulu: KUSUYEMIS, "Toz Antep fıstığı (servis için)"
 *     ingredient ekleme (DB+source). servingSuggestion zaten Antep fıstığı diyor.
 *   - nar-eksili-cokelek-salatasi-hatay-usulu: SUSAM allergen kaldır (DB+source).
 *     Klasik Hatay tarifinde zahter/tahin yok.
 *
 * Format-aware patching:
 *   - object: { name, amount, unit, sortOrder }
 *   - ing helper: ing(["X|A|U", ...])
 *   - raw string-pipe: ["X|A|U", ...]
 */
import path from "node:path";
import fs from "node:fs";
import { PrismaClient, type Allergen } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import dotenv from "dotenv";
import { assertDbTarget } from "./lib/db-env";
neonConfig.webSocketConstructor = ws;
dotenv.config({ path: path.resolve(".env.local") });

const SOURCE_PATH = path.resolve("scripts/seed-recipes.ts");

// 9 slug: source eksik ingredient'ları DB'den ekle
const INGREDIENT_SYNC_SLUGS = [
  "turos-barack-kup-macar-usulu",
  "tahinli-soganlama-kayseri-usulu",
  "sumakli-yumurta-kapama-kilis-usulu",
  "sakizli-kavun-kasesi-cesme-usulu",
  "sumakli-soganli-tavuk-tepsi-orta-dogu-usulu",
  "tavuklu-yesil-mercimek-pilavi-yozgat-usulu",
  "tavuklu-bulgurlu-nohut-pilavi-siirt-usulu",
  "zeytinli-labneli-kahvalti-ekmegi-fas-usulu",
  "tavuklu-mantarli-kesme-makarna-zonguldak-usulu",
];

// mafis: ingredient ekleme (source + DB)
const MAFIS_NEW_INGREDIENT = { name: "Toz Antep fıstığı (servis için)", amount: "2", unit: "yemek kaşığı" };

// nar-eksili-cokelek: SUSAM kaldır (source + DB)
const NAR_EKSILI_REMOVE_ALLERGEN: Allergen = "SUSAM";

interface DbIng { name: string; amount: string; unit: string | null; sortOrder: number; group: string | null }

function patchSourceForSlug(content: string, slug: string, dbIngs: DbIng[]): { content: string; added: number } {
  const lines = content.split("\n");
  const lineIdx = lines.findIndex((l) => l.includes(`slug: "${slug}"`));
  if (lineIdx < 0) return { content, added: 0 };
  const line = lines[lineIdx];

  // Detect format: object first, then ing helper, then raw string-pipe.
  // ingredients: [...] (object {} or string-pipe ".."), optionally wrapped ing(...)
  const objMatch = line.match(/ingredients:\s*\[\{[^}]*\}(?:\s*,\s*\{[^}]*\})*\s*\]/);
  // Match ingredients: ing(["..."]) — content is balanced inside [...]
  const ingHelperMatch = line.match(/ingredients:\s*ing\(\[[^\]]+\]\)/);
  // Match raw ingredients: ["..."]
  const stringMatch = line.match(/ingredients:\s*\["[^[\]]+\]/);

  const sourceIngNames: string[] = [];
  const sourceFmt: "object" | "ing" | "string" = objMatch ? "object" : ingHelperMatch ? "ing" : "string";
  const ingMatch = objMatch ?? ingHelperMatch ?? stringMatch;
  if (!ingMatch) return { content, added: 0 };

  // Extract source names
  if (sourceFmt === "object") {
    for (const m of ingMatch[0].matchAll(/name:\s*"([^"]+)"/g)) sourceIngNames.push(m[1]);
  } else {
    for (const m of ingMatch[0].matchAll(/"([^"|]+)\|/g)) sourceIngNames.push(m[1]);
  }

  const missing = dbIngs.filter((d) => !sourceIngNames.includes(d.name));
  if (missing.length === 0) return { content, added: 0 };

  // Build insert string
  let insertStr = "";
  if (sourceFmt === "object") {
    const startSort = sourceIngNames.length;
    insertStr = missing
      .map((m, i) => `, { name: ${JSON.stringify(m.name)}, amount: ${JSON.stringify(m.amount)}, unit: ${JSON.stringify(m.unit ?? "")}, sortOrder: ${startSort + i + 1} }`)
      .join("");
  } else {
    insertStr = missing
      .map((m) => `, "${m.name}|${m.amount}|${m.unit ?? ""}"`)
      .join("");
  }

  // Find the closing bracket of the ingredients array
  const fullMatch = ingMatch[0];
  const closeIdx = fullMatch.lastIndexOf("]");
  const newIngredients = fullMatch.slice(0, closeIdx) + insertStr + fullMatch.slice(closeIdx);

  const newLine = line.replace(fullMatch, newIngredients);
  lines[lineIdx] = newLine;
  return { content: lines.join("\n"), added: missing.length };
}

function patchAllergenRemoveInSource(content: string, slug: string, allergen: Allergen): string {
  const lines = content.split("\n");
  const lineIdx = lines.findIndex((l) => l.includes(`slug: "${slug}"`));
  if (lineIdx < 0) return content;
  const line = lines[lineIdx];
  const allergenMatch = line.match(/allergens:\s*\[([^\]]*)\]/);
  if (!allergenMatch) return content;
  const arr = allergenMatch[1].split(",").map((s) => s.trim().replace(/^"|"$/g, "")).filter(Boolean);
  if (!arr.includes(allergen)) return content;
  const newArr = arr.filter((a) => a !== allergen);
  const newAllergenStr = newArr.length > 0 ? `[${newArr.map((a) => `"${a}"`).join(", ")}]` : `[]`;
  const newLine = line.replace(allergenMatch[0], `allergens: ${newAllergenStr}`);
  lines[lineIdx] = newLine;
  return lines.join("\n");
}

async function main() {
  const target = assertDbTarget("sync-11-skip-source");
  console.log(`💾 DB: ${target.host}\n`);
  const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString: process.env.DATABASE_URL! }) });
  let content = fs.readFileSync(SOURCE_PATH, "utf-8");
  let totalAdded = 0;

  // 9 slug: ingredient sync
  for (const slug of INGREDIENT_SYNC_SLUGS) {
    const r = await prisma.recipe.findUnique({
      where: { slug },
      select: {
        ingredients: { select: { name: true, amount: true, unit: true, group: true, sortOrder: true }, orderBy: { sortOrder: "asc" } },
      },
    });
    if (!r) { console.log(`  ⚠ ${slug}: not in DB`); continue; }
    const result = patchSourceForSlug(content, slug, r.ingredients);
    content = result.content;
    totalAdded += result.added;
    console.log(`  ✅ ${slug}: +${result.added} ingredient`);
  }

  // mafis: ingredient ek (source + DB)
  console.log("\n📌 mafis-tatlisi-balikesir-usulu KUSUYEMIS legitimization:");
  const mafis = await prisma.recipe.findUnique({
    where: { slug: "mafis-tatlisi-balikesir-usulu" },
    select: { id: true, ingredients: { select: { name: true, sortOrder: true }, orderBy: { sortOrder: "asc" } } },
  });
  if (mafis && !mafis.ingredients.some((i) => i.name === MAFIS_NEW_INGREDIENT.name)) {
    const nextSort = (mafis.ingredients.at(-1)?.sortOrder ?? 0) + 1;
    await prisma.recipeIngredient.create({
      data: {
        recipeId: mafis.id,
        name: MAFIS_NEW_INGREDIENT.name,
        amount: MAFIS_NEW_INGREDIENT.amount,
        unit: MAFIS_NEW_INGREDIENT.unit,
        sortOrder: nextSort,
      },
    });
    console.log("  ✅ DB ingredient added");
    // Source patching: mafis is object format, sync via patchSourceForSlug pattern
    const result = patchSourceForSlug(content, "mafis-tatlisi-balikesir-usulu", [
      ...mafis.ingredients.map((i) => ({ name: i.name, amount: "", unit: "", sortOrder: i.sortOrder, group: null })),
      { name: MAFIS_NEW_INGREDIENT.name, amount: MAFIS_NEW_INGREDIENT.amount, unit: MAFIS_NEW_INGREDIENT.unit, sortOrder: nextSort, group: null },
    ]);
    content = result.content;
    totalAdded += result.added;
    console.log(`  ✅ source +${result.added}`);
  } else {
    console.log("  ⏭ DB already has it");
  }

  // nar-eksili: SUSAM kaldır (source + DB)
  console.log("\n📌 nar-eksili-cokelek-salatasi-hatay-usulu SUSAM removal:");
  const narEksili = await prisma.recipe.findUnique({
    where: { slug: "nar-eksili-cokelek-salatasi-hatay-usulu" },
    select: { id: true, allergens: true },
  });
  if (narEksili && narEksili.allergens.includes("SUSAM" as Allergen)) {
    const newAllergens = narEksili.allergens.filter((a) => a !== "SUSAM");
    await prisma.recipe.update({ where: { id: narEksili.id }, data: { allergens: newAllergens } });
    console.log(`  ✅ DB SUSAM removed (${narEksili.allergens.join(",")} → ${newAllergens.join(",")})`);
  } else {
    console.log("  ⏭ DB SUSAM not present");
  }
  content = patchAllergenRemoveInSource(content, "nar-eksili-cokelek-salatasi-hatay-usulu", NAR_EKSILI_REMOVE_ALLERGEN);
  console.log("  ✅ source SUSAM removed if present");

  fs.writeFileSync(SOURCE_PATH, content);
  console.log(`\n📂 source patched, total ${totalAdded} ingredient added across 10 slugs`);

  await prisma.$disconnect();
}
main().catch((e) => { console.error(e); process.exit(1); });
