/**
 * IngredientGuide lookup (Mod H Batch 1+2 backend, 100 ingredient).
 *
 * Tarif detay sayfasinda ingredient'a hover/click ile popover gostermek
 * icin bu helper kullanilir. DB'ye her render'da query atmamak icin
 * Next.js `unstable_cache` ile 30 dk cache.
 *
 * Match stratejisi: ingredient.name'i normalize et (lower + trim, TR
 * Turkce harfler korunur), mod-h ingredient.name ile karsilastir.
 *
 * Ingredient adi degisken yazilabilir ("Soğan" / "kuru soğan" /
 * "yeşil soğan"). Normalize ve substring match ile en yakin guide'i
 * bul. Bulamazsan null don, UI popover gostermez.
 */
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

export interface IngredientGuide {
  name: string;
  whyUsed: string;
  substitutes: string[];
  notes: string | null;
}

const guideCache = unstable_cache(
  async (): Promise<Record<string, IngredientGuide>> => {
    const rows = await prisma.ingredientGuide.findMany({
      select: {
        name: true,
        whyUsed: true,
        substitutes: true,
        notes: true,
      },
    });
    const map: Record<string, IngredientGuide> = {};
    for (const row of rows) {
      const key = row.name.toLocaleLowerCase("tr").trim();
      map[key] = {
        name: row.name,
        whyUsed: row.whyUsed,
        substitutes: Array.isArray(row.substitutes)
          ? (row.substitutes as string[])
          : [],
        notes: row.notes,
      };
    }
    return map;
  },
  ["ingredient-guides"],
  { revalidate: 1800, tags: ["ingredient-guides"] },
);

export async function getAllIngredientGuides(): Promise<
  Record<string, IngredientGuide>
> {
  return guideCache();
}

/**
 * Bir tarif ingredient adi icin en uygun guide'i bul. Once tam match,
 * sonra adin son kelime / kok kelime ile substring match.
 *
 *   "Tereyağı"    -> guide["tereyağı"]   (exact)
 *   "Sade tereyağı" -> guide["tereyağı"] (substring)
 *   "Kuru soğan"   -> guide["soğan"]     (kok kelime)
 *   "Buz"          -> null (Mod H top 100'de yok)
 */
export function findGuide(
  name: string,
  guides: Record<string, IngredientGuide>,
): IngredientGuide | null {
  const norm = name.toLocaleLowerCase("tr").trim();
  if (guides[norm]) return guides[norm];

  // Try last word (e.g. "Sade tereyağı" -> "tereyağı")
  const words = norm.split(/\s+/);
  const last = words[words.length - 1];
  if (last && guides[last]) return guides[last];

  // Try each word (e.g. "Kuru soğan suyu" -> first hit "soğan")
  for (const w of words) {
    if (w.length >= 3 && guides[w]) return guides[w];
  }

  // Substring fallback: any guide whose key is a substring of norm
  for (const key of Object.keys(guides)) {
    if (key.length >= 4 && norm.includes(key)) return guides[key];
  }

  return null;
}
