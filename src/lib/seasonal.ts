/**
 * Sezon + bayram otomatik seçki (#2, oturum 17). Home sayfasının üst
 * kısmına yaklaşan bayram veya mevsime özel 4-6 tariflik banner kurar.
 *
 * Tarih → collection mapping:
 *   - Kurban Bayramı (±30 gün): "Kurban sofrası" Et Yemekleri
 *   - Ramazan ayı: "Ramazan iftar" Çorbalar + Tatlılar
 *   - Yaz (Haz-Ağu): "Yaz serinliği" tag="yaz-tarifi"
 *   - Sonbahar (Eyl-Kas): "Sonbahar hasadı" Çorbalar + fırın
 *   - Kış (Ara-Şub): "Kış sıcağı" tag="kis-tarifi"
 *   - İlkbahar (Mar-May): "Bahar sofrası" Salatalar + Sebze Yemekleri
 *
 * Bayram tarihleri 2026-2028 hardcoded, sonra güncellenir. Hicri takvim
 * otomatik hesap yerine kural basit ve gözle doğrulanabilir.
 *
 * Filtre çakıştığında bayram > sezon (pre-Kurban Mayıs'ta bahar yerine
 * et seçkisi gösterilir). Rule-based, sıfır LLM, cached.
 */

export interface SeasonalCollection {
  id: string;
  title: string;
  description: string;
  /** Eğer yaklaşan bayram ise "Kurban Bayramı 4 gün sonra" gibi label. */
  countdownLabel?: string;
  filter: {
    tagSlug?: string;
    categorySlugs?: string[];
    cuisineCodes?: string[];
  };
  /** Gösterim kapsamı bitiş tarihi (banner kaldırılma zamanı). */
  endsAt: Date;
}

/** TR religious holidays, approximate, update per year. */
interface HolidayRange {
  id: string;
  name: string;
  start: Date; // ilk gün
  end: Date; // son gün (dahil)
}

const HOLIDAYS_2026_2028: HolidayRange[] = [
  // Ramazan ayı 2026 (Feb 17 - Mar 19) + Ramazan Bayramı Mar 20-22
  { id: "ramazan-2026", name: "Ramazan", start: new Date(2026, 1, 17), end: new Date(2026, 2, 19) },
  { id: "ramazan-bayrami-2026", name: "Ramazan Bayramı", start: new Date(2026, 2, 20), end: new Date(2026, 2, 22) },
  // Kurban Bayramı 2026 (May 27-30)
  { id: "kurban-2026", name: "Kurban Bayramı", start: new Date(2026, 4, 27), end: new Date(2026, 4, 30) },
  // 2027
  { id: "ramazan-2027", name: "Ramazan", start: new Date(2027, 1, 7), end: new Date(2027, 2, 8) },
  { id: "ramazan-bayrami-2027", name: "Ramazan Bayramı", start: new Date(2027, 2, 9), end: new Date(2027, 2, 11) },
  { id: "kurban-2027", name: "Kurban Bayramı", start: new Date(2027, 4, 16), end: new Date(2027, 4, 19) },
  // 2028
  { id: "ramazan-2028", name: "Ramazan", start: new Date(2028, 0, 27), end: new Date(2028, 1, 25) },
  { id: "kurban-2028", name: "Kurban Bayramı", start: new Date(2028, 4, 5), end: new Date(2028, 4, 8) },
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const KURBAN_LEAD_DAYS = 30;
const RAMAZAN_LEAD_DAYS = 7;

function daysBetween(from: Date, to: Date): number {
  return Math.floor((to.getTime() - from.getTime()) / MS_PER_DAY);
}

function findActiveHoliday(now: Date): HolidayRange | null {
  for (const h of HOLIDAYS_2026_2028) {
    if (now >= h.start && now <= h.end) return h;
  }
  return null;
}

function findUpcomingHoliday(
  now: Date,
  kind: "kurban" | "ramazan",
  leadDays: number,
): HolidayRange | null {
  for (const h of HOLIDAYS_2026_2028) {
    if (!h.id.startsWith(kind)) continue;
    if (h.start < now) continue;
    const days = daysBetween(now, h.start);
    if (days >= 0 && days <= leadDays) return h;
  }
  return null;
}

/**
 * Returns the active seasonal/holiday collection for the given date.
 * Rule order: holiday active > holiday upcoming (Kurban 30d, Ramazan
 * 7d) > seasonal default.
 */
export function getSeasonalCollection(now: Date = new Date()): SeasonalCollection {
  // 1. Aktif bayram
  const active = findActiveHoliday(now);
  if (active) {
    return buildHolidayCollection(active, now, true);
  }
  // 2. Yaklaşan Kurban (30 gün)
  const upcomingKurban = findUpcomingHoliday(now, "kurban", KURBAN_LEAD_DAYS);
  if (upcomingKurban) {
    return buildHolidayCollection(upcomingKurban, now, false);
  }
  // 3. Yaklaşan Ramazan (7 gün)
  const upcomingRamazan = findUpcomingHoliday(now, "ramazan", RAMAZAN_LEAD_DAYS);
  if (upcomingRamazan) {
    return buildHolidayCollection(upcomingRamazan, now, false);
  }
  // 4. Sezon (ay bazlı)
  return buildSeasonalCollection(now);
}

function buildHolidayCollection(
  h: HolidayRange,
  now: Date,
  isActive: boolean,
): SeasonalCollection {
  const daysLeft = isActive ? 0 : daysBetween(now, h.start);
  const isKurban = h.id.startsWith("kurban");
  const isRamazan = h.id === `ramazan-${h.start.getFullYear()}`;
  const isRamazanBayrami = h.id.startsWith("ramazan-bayrami");

  if (isKurban) {
    return {
      id: h.id,
      title: isActive ? "Kurban Bayramı sofrası" : "Kurban Bayramı yaklaşıyor",
      description: isActive
        ? "Kurban etini bayram sofrasında değerlendirmek için geleneksel et yemekleri."
        : `Kurban Bayramı ${daysLeft} gün sonra. Şimdiden bayram için et yemeği fikirleri.`,
      countdownLabel: isActive
        ? undefined
        : `${daysLeft} gün sonra`,
      filter: { categorySlugs: ["et-yemekleri"] },
      endsAt: new Date(h.end.getTime() + 2 * MS_PER_DAY),
    };
  }
  if (isRamazan) {
    return {
      id: h.id,
      title: "Ramazan iftar sofrası",
      description:
        "İftar için sıcak çorbalar, geleneksel et yemekleri ve bayram tatlıları.",
      filter: { categorySlugs: ["corbalar", "et-yemekleri", "tatlilar"] },
      endsAt: new Date(h.end.getTime() + 2 * MS_PER_DAY),
    };
  }
  if (isRamazanBayrami) {
    return {
      id: h.id,
      title: "Ramazan Bayramı tatlı sofrası",
      description:
        "Bayram misafirleri için şerbetli ve sütlü tatlılar.",
      filter: { categorySlugs: ["tatlilar"] },
      endsAt: new Date(h.end.getTime() + 2 * MS_PER_DAY),
    };
  }
  // fallback (shouldn't hit)
  return buildSeasonalCollection(now);
}

function buildSeasonalCollection(now: Date): SeasonalCollection {
  const month = now.getMonth(); // 0=Jan
  // End of current season (approximate)
  const seasonEnd = new Date(now.getFullYear(), month + 1, 0);

  if (month === 11 || month <= 1) {
    // Aralık, Ocak, Şubat
    return {
      id: `season-kis-${now.getFullYear()}`,
      title: "Kış sıcağı tarifleri",
      description:
        "Soğuk günlere iyi gelen tencere yemekleri, içten ısıtan çorbalar ve fırın tatlıları.",
      filter: { tagSlug: "kis-tarifi" },
      endsAt: seasonEnd,
    };
  }
  if (month >= 2 && month <= 4) {
    // Mart, Nisan, Mayıs
    return {
      id: `season-bahar-${now.getFullYear()}`,
      title: "Bahar sofrası",
      description:
        "Yeşillenen mevsimde taze otlar, zeytinyağlı sebzeler ve hafif salatalar.",
      filter: { categorySlugs: ["salatalar", "sebze-yemekleri"] },
      endsAt: seasonEnd,
    };
  }
  if (month >= 5 && month <= 7) {
    // Haziran, Temmuz, Ağustos
    return {
      id: `season-yaz-${now.getFullYear()}`,
      title: "Yaz serinliği tarifleri",
      description:
        "Sıcak günlere özel soğuk çorbalar, ferah salatalar ve hafif ana yemekler.",
      filter: { tagSlug: "yaz-tarifi" },
      endsAt: seasonEnd,
    };
  }
  // Eylül, Ekim, Kasım
  return {
    id: `season-sonbahar-${now.getFullYear()}`,
    title: "Sonbahar hasadı",
    description:
      "Balkabağı, mantar ve kış hazırlığı: fırın yemekleri, yoğun çorbalar.",
    filter: { categorySlugs: ["corbalar", "sebze-yemekleri"] },
    endsAt: seasonEnd,
  };
}
