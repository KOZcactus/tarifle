"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import {
  getPermissionState,
  playBeep,
  requestPermission,
  showNotification,
} from "@/lib/recipe/notifications";

interface StepTimerProps {
  /** Step icin toplam saniye, RecipeStep.timerSeconds. */
  totalSeconds: number;
  /** Step numarasi, notification body'sine konacak. */
  stepNumber: number;
  /** Tarif basligi, notification title'inda gosterilecek. */
  recipeTitle: string;
}

type TimerState = "idle" | "running" | "paused" | "done";

function formatMMSS(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

/**
 * Step bazli geri sayim timer. Tarif sayfasinda her timer'li step icin
 * mevcut "etiket" chip'inin yerine interaktif buton koyar.
 *
 * State akisi: idle -> running -> done (veya paused -> running). Reset
 * istendiginde idle'a doner.
 *
 * Bitince:
 *   - Web Audio API beep (sayfa actikken)
 *   - Notification (izin verilmisse, sayfa arka plandayken kullanici farkina varsin)
 *   - Visual flash (✅ rozeti, accent renk degisimi)
 *
 * Notification izni LAZY: ilk "Baslat" tiklamasinda istenir, izin
 * vermezse sessiz fallback (sadece in-page UX).
 */
export function StepTimer({
  totalSeconds,
  stepNumber,
  recipeTitle,
}: StepTimerProps) {
  const t = useTranslations("recipe.timer");
  const [state, setState] = useState<TimerState>("idle");
  const [remaining, setRemaining] = useState(totalSeconds);
  // Notification + beep effect side-effect'ini sadece bir kez tetiklemek
  // icin guard. State done'a once geldiginde fired = true.
  const finishedFiredRef = useRef(false);

  // Tick interval: state="running" iken ve remaining > 0 oldugunda aktif.
  // Pause edilince state="paused" -> useEffect re-run, cleanup clear
  // Interval. Bu pattern useCallback + setInterval handler'a kıyasla
  // StrictMode + closure race'lere karsi guvenilir. Eski sürüm pause'da
  // bazi durumlarda orphan interval'in tick atmaya devam ettigi
  // raporlanmisti (oturum 23 user feedback).
  useEffect(() => {
    if (state !== "running") return;
    const id = setInterval(() => {
      setRemaining((r) => (r > 0 ? r - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [state]);

  // remaining 0'a dustugunde tek seferlik finish: beep + notification +
  // state done. Effect tetiklenmek icin ref guard ile cift firing engellenir.
  const finishTimer = useCallback(() => {
    if (finishedFiredRef.current) return;
    finishedFiredRef.current = true;
    setState("done");
    playBeep();
    showNotification(t("doneTitle", { title: recipeTitle }), {
      body: t("doneBody", { step: stepNumber }),
      tag: `recipe-timer-${stepNumber}`,
      vibrate: [200, 80, 200],
    });
  }, [recipeTitle, stepNumber, t]);

  useEffect(() => {
    if (state !== "running" || remaining !== 0) return;
    // setState'i microtask ile defer et: effect rendering pipeline'inda
    // sync state set cascading render uyarisi tetikler. queueMicrotask
    // ile guvenli sirada calistir.
    const id = setTimeout(finishTimer, 0);
    return () => clearTimeout(id);
  }, [state, remaining, finishTimer]);

  const start = useCallback(async () => {
    finishedFiredRef.current = false;
    if (state === "done") {
      setRemaining(totalSeconds);
    }
    if (getPermissionState() === "default") {
      await requestPermission();
    }
    setState("running");
  }, [state, totalSeconds]);

  const pause = useCallback(() => {
    setState("paused");
  }, []);

  const reset = useCallback(() => {
    finishedFiredRef.current = false;
    setRemaining(totalSeconds);
    setState("idle");
  }, [totalSeconds]);

  const display = formatMMSS(remaining);
  const isRunning = state === "running";
  const isDone = state === "done";

  return (
    <div
      className={`mt-2 inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors print:hidden ${
        isDone
          ? "border-success/40 bg-success/15 text-success"
          : isRunning
            ? "border-accent-blue/40 bg-accent-blue/20 text-accent-blue"
            : "border-accent-blue/30 bg-accent-blue/10 text-accent-blue"
      }`}
      role="timer"
      aria-live={isRunning ? "off" : "polite"}
      aria-atomic="true"
    >
      <span aria-hidden="true">{isDone ? "✅" : "⏱"}</span>
      <span className="tabular-nums">{display}</span>

      {state === "idle" && (
        <button
          type="button"
          onClick={start}
          className="rounded-full bg-accent-blue px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-accent-blue/90"
          aria-label={t("start")}
        >
          {t("start")}
        </button>
      )}

      {state === "running" && (
        <>
          <button
            type="button"
            onClick={pause}
            className="rounded-full bg-accent-blue px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-accent-blue/90"
            aria-label={t("pause")}
          >
            {t("pause")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full px-1.5 py-0.5 text-[11px] text-text hover:text-primary"
            aria-label={t("reset")}
          >
            ↺
          </button>
        </>
      )}

      {state === "paused" && (
        <>
          <button
            type="button"
            onClick={start}
            className="rounded-full bg-accent-blue px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-accent-blue/90"
            aria-label={t("resume")}
          >
            {t("resume")}
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded-full px-1.5 py-0.5 text-[11px] text-text hover:text-primary"
            aria-label={t("reset")}
          >
            ↺
          </button>
        </>
      )}

      {state === "done" && (
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-success px-2 py-0.5 text-[11px] font-semibold text-white hover:bg-success/90"
          aria-label={t("restart")}
        >
          {t("restart")}
        </button>
      )}
    </div>
  );
}
