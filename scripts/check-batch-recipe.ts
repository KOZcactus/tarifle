/**
 * Single-recipe inspector for Mod A v2 quality review.
 * Reads scripts/seed-recipes.ts, finds the recipe by slug, prints all fields.
 * Usage: npx tsx scripts/check-batch-recipe.ts <slug>
 */
import fs from "node:fs";
import path from "node:path";

const seed = fs.readFileSync(path.resolve("scripts/seed-recipes.ts"), "utf-8");
const lines = seed.split("\n");

const targetSlug = process.argv[2];
if (!targetSlug) {
  console.error("Usage: npx tsx scripts/check-batch-recipe.ts <slug>");
  process.exit(1);
}

const line = lines.find((l) => l.includes(`slug: "${targetSlug}"`));
if (!line) {
  console.error("Not found:", targetSlug);
  process.exit(1);
}

function getStr(key: string): string {
  const m = line!.match(new RegExp(key + ':\\s*"([^"]+)"'));
  return m ? m[1] : "";
}
function getNum(key: string): string {
  const m = line!.match(new RegExp(key + ":\\s*(\\d+(?:\\.\\d+)?)"));
  return m ? m[1] : "";
}

console.log(`Title:    ${getStr("title")}`);
console.log(`Cuisine:  ${getStr("cuisine")}  Type: ${getStr("type")}  Diff: ${getStr("difficulty")}`);
console.log(`Macro:    prep ${getNum("prepMinutes")}m + cook ${getNum("cookMinutes")}m = total ${getNum("totalMinutes")}m | ${getNum("averageCalories")} kcal | P${getNum("protein")} C${getNum("carbs")} F${getNum("fat")}`);
console.log(`Featured: ${line.includes("isFeatured: true") ? "YES" : "no"}`);
console.log(`Desc:     ${getStr("description")}`);
console.log(`Tip:      ${getStr("tipNote")}`);
console.log(`Suggest:  ${getStr("servingSuggestion")}`);

const allerMatch = line.match(/allergens:\s*\[([^\]]*)\]/);
console.log(`Allergens:${allerMatch ? " " + allerMatch[1] : " (none)"}`);

const tagsMatch = line.match(/tags:\s*\[([^\]]*)\]/);
console.log(`Tags:    ${tagsMatch ? " " + tagsMatch[1] : ""}`);

const ingMatch = line.match(/ingredients:\s*\[([^\]]+)\]/);
if (ingMatch) {
  const items = ingMatch[1].split(/",\s*"/).map((s) => s.replace(/^"|"$/g, ""));
  console.log(`\nIngredients (${items.length}):`);
  for (const it of items) {
    const [n, a, u] = it.split("|");
    console.log(`  - ${n} ${a}${u ? " " + u : ""}`);
  }
}

const stepMatch = line.match(/steps:\s*\[([^\]]+)\]/);
if (stepMatch) {
  const items = stepMatch[1].split(/",\s*"/).map((s) => s.replace(/^"|"$/g, ""));
  console.log(`\nSteps (${items.length}):`);
  items.forEach((s, i) => {
    const parts = s.split("||");
    const txt = parts[0];
    const sec = parts[1] ? ` [${parts[1]}s]` : "";
    console.log(`  ${i + 1}. ${txt}${sec}`);
  });
}
