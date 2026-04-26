"use client";

import { useTranslations } from "next-intl";
import type { Allergen } from "@prisma/client";
import type { AllergenConfidence } from "@/lib/recipe/allergen-confidence";

interface AllergenConfidenceNoteProps {
  confidence: AllergenConfidence;
}

/**
 * Tarif detay allergen detail expand'inin altinda gosterilen
 * transparency notu. Beyan ile ingredient-bazli cikarim arasinda
 * fark varsa kullaniciyi uyarir. Hicbir fark yoksa render olmaz.
 *
 * Iki ayri uyari:
 *   - extraInferred: tarifte ingredient olarak gecip, allergens
 *     beyaninda OLMAYAN allergen (potansiyel kacirilan etiket).
 *     Allerjili kullanici icin kritik, dikkat ikonu.
 *   - extraDeclared: tarif beyani var ama matcher tespit edemedi.
 *     Genelde info disclaimer (cesit malzeme adi, takas kelimesi).
 */
export function AllergenConfidenceNote({
  confidence,
}: AllergenConfidenceNoteProps) {
  const t = useTranslations("recipe.allergenConfidence");
  const tAllergen = useTranslations("allergens");

  if (confidence.inSync) return null;

  const formatList = (items: Allergen[]) =>
    items.map((a) => tAllergen(a)).join(", ");

  return (
    <div className="mt-3 space-y-2 print:hidden">
      {confidence.extraInferred.length > 0 && (
        <div
          role="note"
          className="flex items-start gap-2 rounded-lg border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning"
        >
          <span aria-hidden="true" className="text-sm">
            ⚠
          </span>
          <p>
            <span className="font-semibold">{t("possibleExtraTitle")}:</span>{" "}
            {t("possibleExtraBody", {
              list: formatList(confidence.extraInferred),
            })}
          </p>
        </div>
      )}
      {confidence.extraDeclared.length > 0 && (
        <div
          role="note"
          className="flex items-start gap-2 rounded-lg border border-border bg-bg-elevated/60 px-3 py-2 text-xs text-text-muted"
        >
          <span aria-hidden="true" className="text-sm">
            ℹ
          </span>
          <p>
            <span className="font-semibold">{t("declaredOnlyTitle")}:</span>{" "}
            {t("declaredOnlyBody", {
              list: formatList(confidence.extraDeclared),
            })}
          </p>
        </div>
      )}
    </div>
  );
}
