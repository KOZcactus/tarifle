/**
 * Browser Notification API ince sarmalayici.
 *
 * Tarif sayfasinda step timer bitince kullanici sayfada degilse browser
 * push gondermek icin. Notification API izin gerektirir; izin yoksa veya
 * tarayici desteklemiyorsa sessizce fallback (caller in-page UX gosterir).
 *
 * Karar: tek bir izin akisi (lazy, ilk timer baslarken). Once izinsiz,
 * kullanici "Baslat"a basinca request, sonuca gore davranis.
 */

export type NotificationPermissionState = "default" | "granted" | "denied" | "unsupported";

export function getPermissionState(): NotificationPermissionState {
  if (typeof window === "undefined") return "unsupported";
  if (typeof Notification === "undefined") return "unsupported";
  return Notification.permission;
}

export async function requestPermission(): Promise<NotificationPermissionState> {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return "unsupported";
  }
  if (Notification.permission === "granted") return "granted";
  if (Notification.permission === "denied") return "denied";
  try {
    const result = await Notification.requestPermission();
    return result;
  } catch {
    return "denied";
  }
}

interface ShowNotificationOptions {
  body?: string;
  /** Ikon path (public/ klasorunden, default favicon). */
  icon?: string;
  /** Tag, ayni tag ile gonderilen yeni notification eskisini replace eder. */
  tag?: string;
  /** Vibrate pattern (mobil PWA icin). */
  vibrate?: number[];
}

export function showNotification(
  title: string,
  options: ShowNotificationOptions = {},
): void {
  if (typeof window === "undefined" || typeof Notification === "undefined") {
    return;
  }
  if (Notification.permission !== "granted") return;

  const { body, icon = "/icons/icon-192.png", tag, vibrate } = options;

  try {
    const notif = new Notification(title, {
      body,
      icon,
      tag,
    });
    if (vibrate && "vibrate" in navigator) {
      navigator.vibrate(vibrate);
    }
    setTimeout(() => notif.close(), 8000);
  } catch {
    // Silent fail, caller in-page UX'e guvenir.
  }
}

/**
 * Tarayici sekmesi acik degilse ses calmak icin (notification + sound).
 * Web Audio API kisa beep, ek dosya gerektirmez.
 */
export function playBeep(): void {
  if (typeof window === "undefined") return;
  try {
    const Ctx = window.AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start();
    osc.stop(ctx.currentTime + 0.7);
    setTimeout(() => ctx.close(), 1000);
  } catch {
    // Silent fail.
  }
}
