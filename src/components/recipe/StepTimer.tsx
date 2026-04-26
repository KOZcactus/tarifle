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
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanup = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const finishTimer = useCallback(() => {
    cleanup();
    setRemaining(0);
    setState("done");
    playBeep();
    showNotification(t("doneTitle", { title: recipeTitle }), {
      body: t("doneBody", { step: stepNumber }),
      tag: `recipe-timer-${stepNumber}`,
      vibrate: [200, 80, 200],
    });
  }, [cleanup, recipeTitle, stepNumber, t]);

  const start = useCallback(async () => {
    if (state === "done") {
      setRemaining(totalSeconds);
    }
    if (getPermissionState() === "default") {
      await requestPermission();
    }
    setState("running");
    intervalRef.current = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          finishTimer();
          return 0;
        }
        return r - 1;
      });
    }, 1000);
  }, [state, totalSeconds, finishTimer]);

  const pause = useCallback(() => {
    cleanup();
    setState("paused");
  }, [cleanup]);

  const reset = useCallback(() => {
    cleanup();
    setRemaining(totalSeconds);
    setState("idle");
  }, [cleanup, totalSeconds]);

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
