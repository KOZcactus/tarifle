/**
 * AI v4 haftalık menü → iCalendar (.ics) export (oturum 17 #12).
 * Rule-based, sıfır lib. RFC 5545 uyumlu minimal ICS string kurar.
 *
 * Her dolu slot için bir VEVENT üretilir (boş slotlar yok sayılır).
 * Öğün zamanı kullanıcının yerel saatine göre (DTSTART tz-less =
 * floating local time, iCal spec uyumlu, mobil takvimler device TZ
 * üzerinden render eder).
 *
 * Şu an haftanın Pazartesi'sini baz alır (MealPlan.weekStart pattern).
 * Gelecek değişiklik (farklı hafta) için `weekStart` parametre optional.
 */
import type { MenuSlot } from "./types";

const BREAKFAST_HOUR = 8; // 08:00 başlar, 30 dk
const LUNCH_HOUR = 13; // 13:00 başlar, 60 dk
const DINNER_HOUR = 19; // 19:00 başlar, 90 dk

const BREAKFAST_DURATION_MIN = 30;
const LUNCH_DURATION_MIN = 60;
const DINNER_DURATION_MIN = 90;

interface IcalInput {
  slots: MenuSlot[];
  /** ISO date string (YYYY-MM-DD), Pazartesi. Yoksa bu haftanın Pazartesi'si. */
  weekStartIso?: string;
  /** Kullanıcıya gösterilen site URL'i, tarif linkleri için. Default tarifle.app */
  siteUrl?: string;
}

function getMondayOfThisWeek(): Date {
  const d = new Date();
  const day = d.getDay(); // 0=Pz, 1=Pzt
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** iCal DATE-TIME (floating, tz-less local): YYYYMMDDTHHmmss */
function formatDateTime(date: Date): string {
  return (
    `${date.getFullYear()}${pad2(date.getMonth() + 1)}${pad2(date.getDate())}T` +
    `${pad2(date.getHours())}${pad2(date.getMinutes())}00`
  );
}

/** RFC 5545 TEXT escape: \ → \\, ; → \;, , → \,, newline → \n */
function escapeText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

function mealStart(base: Date, dayOfWeek: number, mealType: MenuSlot["mealType"]): Date {
  const d = new Date(base);
  d.setDate(d.getDate() + dayOfWeek);
  const hour =
    mealType === "BREAKFAST"
      ? BREAKFAST_HOUR
      : mealType === "LUNCH"
        ? LUNCH_HOUR
        : DINNER_HOUR;
  d.setHours(hour, 0, 0, 0);
  return d;
}

function mealDurationMin(mealType: MenuSlot["mealType"]): number {
  return mealType === "BREAKFAST"
    ? BREAKFAST_DURATION_MIN
    : mealType === "LUNCH"
      ? LUNCH_DURATION_MIN
      : DINNER_DURATION_MIN;
}

function mealLabel(mealType: MenuSlot["mealType"]): string {
  return mealType === "BREAKFAST"
    ? "Kahvaltı"
    : mealType === "LUNCH"
      ? "Öğle"
      : "Akşam";
}

export function buildIcalString({
  slots,
  weekStartIso,
  siteUrl = "https://tarifle.app",
}: IcalInput): string {
  const base = weekStartIso
    ? new Date(`${weekStartIso}T00:00:00`)
    : getMondayOfThisWeek();

  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Tarifle//AI Menu Planner//TR",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  const now = new Date();
  const dtstamp = formatDateTime(now);

  for (const slot of slots) {
    if (!slot.recipe) continue;
    const start = mealStart(base, slot.dayOfWeek, slot.mealType);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + mealDurationMin(slot.mealType));

    const summary = `${mealLabel(slot.mealType)}: ${slot.recipe.title}`;
    const description = `${slot.recipe.title}\n${siteUrl}/tarif/${slot.recipe.slug}`;
    const url = `${siteUrl}/tarif/${slot.recipe.slug}`;
    const uid = `tarifle-${slot.dayOfWeek}-${slot.mealType}-${slot.recipe.slug}@tarifle.app`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${uid}`,
      `DTSTAMP:${dtstamp}`,
      `DTSTART:${formatDateTime(start)}`,
      `DTEND:${formatDateTime(end)}`,
      `SUMMARY:${escapeText(summary)}`,
      `DESCRIPTION:${escapeText(description)}`,
      `URL:${url}`,
      "END:VEVENT",
    );
  }

  lines.push("END:VCALENDAR");
  // RFC 5545 line endings CRLF, 75 char folding desteklenir ama modern
  // client'lar uzun satır da kabul eder. Minimal tutuyoruz.
  return lines.join("\r\n");
}
