/**
 * Smoke test for the rule-based AI provider.
 * Run: npx tsx scripts/test-ai.ts
 */
import { RuleBasedProvider } from "../src/lib/ai/rule-based-provider";

async function main(): Promise<void> {
  const provider = new RuleBasedProvider();

  console.log("--- Test 1: basit malzemeler (pantry = true) ---");
  const r1 = await provider.suggest({
    ingredients: ["domates", "soğan", "biber", "yumurta", "peynir"],
    assumePantryStaples: true,
  });
  console.log("Commentary:", r1.commentary);
  console.log("Count:", r1.suggestions.length);
  for (const s of r1.suggestions.slice(0, 5)) {
    console.log(
      ` - ${s.title} (${s.categoryName}): %${Math.round(s.matchScore * 100)} | eksik: ${s.missingIngredients.length}`,
    );
  }

  console.log("\n--- Test 2: uydurma malzemeler ---");
  const r2 = await provider.suggest({
    ingredients: ["marsmelov", "havyar"],
  });
  console.log("Commentary:", r2.commentary);
  console.log("Count:", r2.suggestions.length);

  console.log("\n--- Test 3: kahvalti, 30 dk alti ---");
  const r3 = await provider.suggest({
    ingredients: ["yumurta", "süt", "un"],
    type: "KAHVALTI",
    maxMinutes: 30,
    assumePantryStaples: true,
  });
  console.log("Commentary:", r3.commentary);
  for (const s of r3.suggestions) {
    console.log(
      ` - ${s.title} | ${s.totalMinutes} dk | %${Math.round(s.matchScore * 100)}`,
    );
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
