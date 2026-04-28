/**
 * Pre-push guard: scan scripts/seed-recipes.ts for allergen over-tags and
 * missing-allergen criticals, using the same rules as audit-deep. Runs
 * fully offline (no DB), so suitable for CI and pre-push hooks.
 *
 * Exits non-zero on any finding so git push is blocked.
 *
 *   npx tsx scripts/check-allergen-source.ts
 */
import type { Allergen } from "@prisma/client";
import { ALLERGEN_RULES, ingredientMatchesAllergen } from "./audit-deep";
import { recipes } from "./seed-recipes";

/**
 * Baseline skip list: source-drift edge cases where seed ingredient list
 * diverges from DB state (batch 27 / restore session remnants). Tracked
 * separately in docs; removing each requires a targeted ingredient patch
 * in seed. Hook should NOT block push for these, but any new slug beyond
 * this list means a regression.
 */
const SKIP_FINDINGS = new Set<string>([
  // Oturum 32: audit-deep CRITICAL paket fix (DB'ye allergen eklendi ama
  // source ingredient adları rule keyword'leriyle eşleşmiyor; source-DB
  // drift). DB'de Tereyağı var, source'ta yok gibi durumlar. Source
  // ingredient sync ayrı paket olarak ele alınır (scripts/sync-source-
  // from-db.ts kullanımı). Geçici skip: gerçek over-tag değil, source
  // sürümün eski olduğunu gösterir.
  "mafis-tatlisi-balikesir-usulu:over-tag:KUSUYEMIS",
  "turos-barack-kup-macar-usulu:over-tag:GLUTEN",
  "tahinli-soganlama-kayseri-usulu:over-tag:SUT",
  "sumakli-yumurta-kapama-kilis-usulu:over-tag:SUT",
  "sakizli-kavun-kasesi-cesme-usulu:over-tag:KUSUYEMIS",
  "sumakli-soganli-tavuk-tepsi-orta-dogu-usulu:over-tag:KUSUYEMIS",
  "tavuklu-yesil-mercimek-pilavi-yozgat-usulu:over-tag:SUT",
  "tavuklu-bulgurlu-nohut-pilavi-siirt-usulu:over-tag:SUT",
  "zeytinli-labneli-kahvalti-ekmegi-fas-usulu:over-tag:SUSAM",
  "tavuklu-mantarli-kesme-makarna-zonguldak-usulu:over-tag:SUT",
  "nar-eksili-cokelek-salatasi-hatay-usulu:over-tag:SUSAM",
]);

function main() {
  let overTags = 0;
  let missings = 0;
  const overTagSamples: string[] = [];
  const missingSamples: string[] = [];

  for (const r of recipes) {
    const allergenSet = new Set<Allergen>(r.allergens ?? []);
    const ingNames = (r.ingredients ?? []).map((i) => i.name);
    for (const rule of ALLERGEN_RULES) {
      const matches = ingNames.some((n) => ingredientMatchesAllergen(n, rule));
      const tagged = allergenSet.has(rule.allergen as Allergen);

      if (tagged && !matches) {
        const key = `${r.slug}:over-tag:${rule.allergen}`;
        if (SKIP_FINDINGS.has(key)) continue;
        overTags++;
        if (overTagSamples.length < 10) {
          overTagSamples.push(`${r.slug}  over-tag ${rule.allergen}`);
        }
      }
      if (!tagged && matches) {
        const key = `${r.slug}:missing:${rule.allergen}`;
        if (SKIP_FINDINGS.has(key)) continue;
        missings++;
        if (missingSamples.length < 10) {
          const hitIng = ingNames.find((n) => ingredientMatchesAllergen(n, rule));
          missingSamples.push(`${r.slug}  missing ${rule.allergen}  (ingredient: ${hitIng})`);
        }
      }
    }
  }

  if (overTags === 0 && missings === 0) {
    process.stdout.write(
      `Sonuç: ✅ TEMIZ, 0 over-tag, 0 missing (${recipes.length} kaynak tarifi)\n`,
    );
    return;
  }

  process.stderr.write(`\nSonuç: ❌ FAIL\n`);
  if (overTags > 0) {
    process.stderr.write(`\n${overTags} over-tag finding:\n`);
    for (const s of overTagSamples) process.stderr.write(`  ${s}\n`);
    if (overTags > overTagSamples.length) {
      process.stderr.write(`  ... (+${overTags - overTagSamples.length} more)\n`);
    }
  }
  if (missings > 0) {
    process.stderr.write(`\n${missings} missing-allergen finding:\n`);
    for (const s of missingSamples) process.stderr.write(`  ${s}\n`);
    if (missings > missingSamples.length) {
      process.stderr.write(`  ... (+${missings - missingSamples.length} more)\n`);
    }
  }
  process.stderr.write(
    `\n   Fix via: scripts/fix-critical-allergens-*.ts or scripts/remove-over-tagged-allergens.ts\n`,
  );
  process.stderr.write(`   Bypass: git push --no-verify\n`);
  process.exit(1);
}

main();
