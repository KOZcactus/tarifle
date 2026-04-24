/**
 * AI v3 saate göre öneri ipucu (oturum 17 #11).
 * Rule-based, sıfır lib, kullanıcının şu anki saati + haftanın gününe
 * göre tarif önerilerini bağlam bilgisiyle zenginleştirir.
 *
 * Senaryolar:
 *   - Sabah 06-10: kahvaltı ağırlıklı, hızlı tarifler
 *   - Öğle 11-14: öğle, orta süre
 *   - İkindi 14-17: atıştırmalık, aperatif, içecek
 *   - Akşam 17-22: hızlı akşam yemeği (30 dk altı), hafta içiyse pratik
 *   - Gece 22+: gece atıştırması, tatlı
 *   - Hafta sonu (Cts+Paz): uzun tarifler (60+ dk) OK, misafir odaklı
 *
 * UI'da banner olarak "Şu an 19:00, akşam yemeği için 30 dk altında
 * tarif ister misin?" gibi soft önerinin tetikleyicisidir. Tek tıkla
 * maxMinutes filter'ı uygulanır.
 */

export type TimeHintKind =
  | "breakfast-quick"
  | "lunch-medium"
  | "afternoon-snack"
  | "dinner-quick"
  | "dinner-weekend-long"
  | "late-night-sweet"
  | "none";

export interface TimeHint {
  kind: TimeHintKind;
  /** Önerilen maxMinutes filter değeri (varsa). */
  suggestedMaxMinutes?: number;
  /** i18n key (aiAssistant.form.timeHint.<key>). */
  labelKey: string;
}

/**
 * getTimeHint TR timezone UTC+3 kullanir, server'da UTC saati TR'ye
 * cevrilir. Vercel edge UTC calisir, getHours() local TZ'e gore yanlis
 * hour verebilir; bu yuzden explicit TR offset.
 */
export function getTimeHintTr(nowUtc: Date = new Date()): TimeHint {
  const trMs = nowUtc.getTime() + 3 * 60 * 60 * 1000;
  const tr = new Date(trMs);
  return getTimeHintAt(tr.getUTCHours(), tr.getUTCDay());
}

export function getTimeHintAt(hour: number, day: number): TimeHint {
  const isWeekend = day === 0 || day === 6;
  return _computeHint(hour, isWeekend);
}

export function getTimeHint(now: Date = new Date()): TimeHint {
  const hour = now.getHours();
  const day = now.getDay(); // 0=Sun, 6=Sat
  const isWeekend = day === 0 || day === 6;
  return _computeHint(hour, isWeekend);
}

function _computeHint(hour: number, isWeekend: boolean): TimeHint {

  // Geceyarısı sonrası / erken sabah: hızlı kahvaltı
  if (hour >= 6 && hour < 10) {
    return {
      kind: "breakfast-quick",
      suggestedMaxMinutes: 20,
      labelKey: "breakfastQuick",
    };
  }
  // Öğle arası
  if (hour >= 11 && hour < 14) {
    return {
      kind: "lunch-medium",
      suggestedMaxMinutes: 45,
      labelKey: "lunchMedium",
    };
  }
  // İkindi atıştırmalığı
  if (hour >= 14 && hour < 17) {
    return { kind: "afternoon-snack", labelKey: "afternoonSnack" };
  }
  // Akşam yemeği: hafta sonu uzun, hafta içi hızlı
  if (hour >= 17 && hour < 22) {
    if (isWeekend) {
      return {
        kind: "dinner-weekend-long",
        labelKey: "dinnerWeekendLong",
      };
    }
    return {
      kind: "dinner-quick",
      suggestedMaxMinutes: 30,
      labelKey: "dinnerQuick",
    };
  }
  // Gece atıştırma / tatlı
  if (hour >= 22 || hour < 6) {
    return {
      kind: "late-night-sweet",
      suggestedMaxMinutes: 15,
      labelKey: "lateNightSweet",
    };
  }
  return { kind: "none", labelKey: "none" };
}
