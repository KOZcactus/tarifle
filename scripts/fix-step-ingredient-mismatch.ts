/**
 * Fix step ↔ ingredient mismatch, eksik baseline ingredient'ları ekle.
 *
 * Codex2 + Claude bağımsız analizinden karma liste. Her fix için:
 *   confidence: "high"   → --apply ile otomatik yazılır
 *   confidence: "review" → sadece dry-run'da gösterilir, manuel karar
 *
 * Kullanım:
 *   npx tsx scripts/fix-step-ingredient-mismatch.ts             # dry run, hepsini göster
 *   npx tsx scripts/fix-step-ingredient-mismatch.ts --apply     # high-confidence'ı yaz
 *   npx tsx scripts/fix-step-ingredient-mismatch.ts --include-review --apply  # review'ları da yaz
 */
import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import * as dotenv from "dotenv";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { assertDbTarget } from "./lib/db-env";

neonConfig.webSocketConstructor = ws;
const __d = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__d, "..", ".env.local") });
const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const APPLY = process.argv.includes("--apply");
const INCLUDE_REVIEW = process.argv.includes("--include-review");

interface Fix {
  slug: string;
  stepNumber: number;
  stepSnippet: string; // context for humans; fonksiyonel değil
  ingredient: { name: string; amount: string; unit: string };
  confidence: "high" | "review";
}

// ═══════ FIXES, Codex2 listesi geldiğinde buraya doldurulacak ═══════
//
// Şu anda Claude'un audit-step-ingredient-mismatch.ts'ten çıkan HIGH 19 +
// REVIEW 54 sonuçları placeholder olarak. Codex2 listesi geldiğinde
// BURAYI GÜNCELLE: Codex2'nin ingredient + amount önerisi daha context-aware.
//
const FIXES: Fix[] = [
  // ═══════ Codex2 list (2026-04-17, 28 entries, 27 recipes, manti x2) ═══════
  { slug: "manti", stepNumber: 1, stepSnippet: "Un, yumurta, su ve tuzla sert bir hamur yoğurun.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "review" },
  { slug: "manti", stepNumber: 2, stepSnippet: "Kıyma, rendelenmiş soğan, tuz ve karabiberi karıştırarak iç harç yapın.", ingredient: { name: "Karabiber", amount: "0.5", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "jokai-bableves", stepNumber: 3, stepSnippet: "Tuzunu ayarlayıp servis edin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "review" },
  { slug: "firinda-makarna", stepNumber: 1, stepSnippet: "Makarnayı tuzlu suda 8 dakika haşlayıp süzün.", ingredient: { name: "Tuz", amount: "1", unit: "yemek kaşığı" }, confidence: "review" },
  { slug: "pizza-margherita", stepNumber: 1, stepSnippet: "Un, su, maya ve tuzu yoğurup 45 dakika mayalandırın.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "review" },
  { slug: "beyti-sarma", stepNumber: 1, stepSnippet: "Kıyma, rendelenmiş soğan, sarımsak, kimyon ve tuzu 10 dakika yoğurun.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "spaghetti-carbonara", stepNumber: 1, stepSnippet: "Makarnayı tuzlu suda 9-10 dakika haşlayın.", ingredient: { name: "Tuz", amount: "1", unit: "yemek kaşığı" }, confidence: "review" },
  { slug: "sebzeli-guvec", stepNumber: 2, stepSnippet: "Domates, zeytinyağı ve tuzu ekleyip karıştırın.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "gyros", stepNumber: 1, stepSnippet: "Eti yoğurt, kekik ve tuzla 20 dakika marine edin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "gazpacho", stepNumber: 2, stepSnippet: "Sebzeleri zeytinyağı ve tuzla blenderdan geçirin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "domatesli-makarna", stepNumber: 1, stepSnippet: "Makarnayı tuzlu suda 9-10 dakika haşlayın.", ingredient: { name: "Tuz", amount: "1", unit: "yemek kaşığı" }, confidence: "review" },
  { slug: "kongnamul-muchim", stepNumber: 2, stepSnippet: "Süzüp susam yağı, ezilmiş sarımsak ve tuzla harmanlayın.", ingredient: { name: "Tuz", amount: "0.5", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "tom-kha-gai", stepNumber: 3, stepSnippet: "Lime suyu ve tuzla dengeleyip sıcak servis edin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "mansaf", stepNumber: 1, stepSnippet: "Kuzu etini kakule ve tuzla 90 dakika haşlayın.", ingredient: { name: "Tuz", amount: "1.5", unit: "çay kaşığı" }, confidence: "review" },
  { slug: "ezogelin-corbasi", stepNumber: 5, stepSnippet: "Tuz, nane ve pul biber ile tatlandırın.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "mumbar-dolmasi", stepNumber: 1, stepSnippet: "Mumbarı temizleyip tuzlu suda bekletin.", ingredient: { name: "Tuz", amount: "1", unit: "yemek kaşığı" }, confidence: "review" },
  { slug: "kibe-mumbar", stepNumber: 1, stepSnippet: "Sakatatı temizleyip tuzlu suda bekletin.", ingredient: { name: "Tuz", amount: "1", unit: "yemek kaşığı" }, confidence: "review" },
  { slug: "koz-biberli-barbunya-ezmesi", stepNumber: 3, stepSnippet: "Tuzunu ayarlayıp servis tabağına alın.", ingredient: { name: "Tuz", amount: "0.5", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "urfa-bostana", stepNumber: 2, stepSnippet: "Maydanoz, nar ekşisi ve tuzu ekleyin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "antalya-hibes", stepNumber: 2, stepSnippet: "Kimyon ve tuzu ekleyin.", ingredient: { name: "Tuz", amount: "0.5", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "ciborek", stepNumber: 2, stepSnippet: "Kıyma, soğan, tuz ve karabiberle sulu bir iç hazırlayın.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "review" },
  { slug: "moqueca", stepNumber: 1, stepSnippet: "Balığı limon ve tuzla 15 dakika marine edin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "csalamade", stepNumber: 2, stepSnippet: "Sirke, tuz ve şekerle harmanlayın.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "review" },
  { slug: "borulce-eksilemesi", stepNumber: 3, stepSnippet: "Tuzunu ayarlayıp limon suyunu ekleyin ve 5 dakika dinlendirerek servis edin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "fasolakia", stepNumber: 3, stepSnippet: "Tuzunu ayarlayıp ılık servis edin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "vinegret-salatasi", stepNumber: 3, stepSnippet: "Yağ ve tuz ekleyip soğuk servis edin.", ingredient: { name: "Tuz", amount: "0.5", unit: "çay kaşığı" }, confidence: "high" },
  { slug: "banh-mi", stepNumber: 1, stepSnippet: "Havuç ve turpu sirke, tuz ve şekerle 30 dakika dinlendirin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "review" },
  { slug: "pastel-brezilya", stepNumber: 1, stepSnippet: "Un, su ve tuzla sert hamur hazırlayıp 20 dakika dinlendirin.", ingredient: { name: "Tuz", amount: "1", unit: "çay kaşığı" }, confidence: "review" },
];

// ═════════════════════════════════════════════════════════════════════

async function main(): Promise<void> {
  assertDbTarget("fix-step-ingredient-mismatch");
  console.log(
    `🔧 fix-step-ingredient-mismatch (${APPLY ? "APPLY" : "DRY RUN"}, review ${INCLUDE_REVIEW ? "IN" : "EX"}cluded) → ${
      process.env.DATABASE_URL?.split("@")[1]?.split("/")[0] ?? "?"
    }\n`,
  );

  if (FIXES.length === 0) {
    console.log(
      "ℹ️  FIXES array boş, Codex2 listesi geldiğinde yukarıdaki bloğa ekle.\n" +
      "    scripts/audit-step-ingredient-mismatch.ts çıktısı önkontrol için.",
    );
    return;
  }

  // Determine next sortOrder per recipe to avoid collisions
  const slugs = [...new Set(FIXES.map((f) => f.slug))];
  const existingBySlug = new Map<string, { id: string; maxSort: number; ingNames: Set<string> }>();
  for (const slug of slugs) {
    const r = await prisma.recipe.findUnique({
      where: { slug },
      select: { id: true, ingredients: { select: { name: true, sortOrder: true } } },
    });
    if (!r) {
      console.error(`  ❌ ${slug} not in DB`);
      continue;
    }
    const maxSort = r.ingredients.reduce((m, i) => Math.max(m, i.sortOrder), 0);
    existingBySlug.set(slug, {
      id: r.id,
      maxSort,
      ingNames: new Set(r.ingredients.map((i) => i.name.toLocaleLowerCase("tr-TR"))),
    });
  }

  let willWrite = 0;
  let skipReview = 0;
  let alreadyPresent = 0;

  console.log("--- HIGH confidence ---");
  for (const fix of FIXES.filter((f) => f.confidence === "high")) {
    const state = existingBySlug.get(fix.slug);
    if (!state) continue;
    if (state.ingNames.has(fix.ingredient.name.toLocaleLowerCase("tr-TR"))) {
      alreadyPresent++;
      continue;
    }
    willWrite++;
    console.log(
      `  ${fix.slug.padEnd(28)} + ${fix.ingredient.amount} ${fix.ingredient.unit}  ${fix.ingredient.name}`,
    );
    if (APPLY) {
      state.maxSort++;
      await prisma.recipeIngredient.create({
        data: {
          recipeId: state.id,
          name: fix.ingredient.name,
          amount: fix.ingredient.amount,
          unit: fix.ingredient.unit,
          sortOrder: state.maxSort,
        },
      });
      state.ingNames.add(fix.ingredient.name.toLocaleLowerCase("tr-TR"));
    }
  }

  console.log("\n--- REVIEW (context-dependent) ---");
  for (const fix of FIXES.filter((f) => f.confidence === "review")) {
    const state = existingBySlug.get(fix.slug);
    if (!state) continue;
    if (state.ingNames.has(fix.ingredient.name.toLocaleLowerCase("tr-TR"))) {
      alreadyPresent++;
      continue;
    }
    if (!INCLUDE_REVIEW) {
      skipReview++;
      console.log(
        `  ${fix.slug.padEnd(28)} SKIP (review): + ${fix.ingredient.amount} ${fix.ingredient.unit}  ${fix.ingredient.name}`,
      );
      continue;
    }
    willWrite++;
    console.log(
      `  ${fix.slug.padEnd(28)} + ${fix.ingredient.amount} ${fix.ingredient.unit}  ${fix.ingredient.name}  (review, forced)`,
    );
    if (APPLY) {
      state.maxSort++;
      await prisma.recipeIngredient.create({
        data: {
          recipeId: state.id,
          name: fix.ingredient.name,
          amount: fix.ingredient.amount,
          unit: fix.ingredient.unit,
          sortOrder: state.maxSort,
        },
      });
      state.ingNames.add(fix.ingredient.name.toLocaleLowerCase("tr-TR"));
    }
  }

  const verb = APPLY ? "Inserted" : "Would insert";
  console.log(
    `\n${verb}: ${willWrite} ingredient(s) | Skipped (already present): ${alreadyPresent} | Skipped (review): ${skipReview}`,
  );
  if (!APPLY) console.log("(dry run, re-run with --apply)");
}

main()
  .catch((err) => {
    console.error("fix failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
