"use client";

import { useState, useEffect, useCallback, useRef } from "react";

interface Step {
  id: string;
  stepNumber: number;
  instruction: string;
  tip: string | null;
  timerSeconds: number | null;
}

interface CookingModeProps {
  steps: Step[];
  recipeTitle: string;
  recipeEmoji: string | null;
}

export function CookingMode({ steps, recipeTitle, recipeEmoji }: CookingModeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const step = steps[currentStep];
  const totalSteps = steps.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  // Wake Lock
  const requestWakeLock = useCallback(async () => {
    try {
      if ("wakeLock" in navigator) {
        wakeLockRef.current = await navigator.wakeLock.request("screen");
      }
    } catch {
      // Wake Lock API not supported or denied
    }
  }, []);

  const releaseWakeLock = useCallback(() => {
    wakeLockRef.current?.release();
    wakeLockRef.current = null;
  }, []);

  // Timer logic
  useEffect(() => {
    if (timerRunning && timer !== null && timer > 0) {
      intervalRef.current = setInterval(() => {
        setTimer((prev) => {
          if (prev === null || prev <= 1) {
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning, timer]);

  // Open/close
  const open = useCallback(() => {
    setIsOpen(true);
    setCurrentStep(0);
    setTimer(null);
    setTimerRunning(false);
    requestWakeLock();
    document.body.style.overflow = "hidden";
  }, [requestWakeLock]);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimerRunning(false);
    setTimer(null);
    releaseWakeLock();
    document.body.style.overflow = "";
  }, [releaseWakeLock]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight" || e.key === " ") {
        e.preventDefault();
        goNext();
      }
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

  const goNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
      setTimer(null);
      setTimerRunning(false);
    }
  };

  const goPrev = () => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setTimer(null);
      setTimerRunning(false);
    }
  };

  const startTimer = (seconds: number) => {
    setTimer(seconds);
    setTimerRunning(true);
  };

  const toggleTimer = () => {
    setTimerRunning((prev) => !prev);
  };

  const resetTimer = (seconds: number) => {
    setTimerRunning(false);
    setTimer(seconds);
  };

  if (!isOpen) {
    return (
      <button
        onClick={open}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        <ChefHatIcon />
        Pişirme Modunu Başlat
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Pişirme modu: ${recipeTitle}`}
      className="fixed inset-0 z-50 flex flex-col bg-bg"
    >
      {/* Header */}
      <header className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="text-xl">{recipeEmoji ?? "🍽️"}</span>
          <span className="font-heading text-sm font-semibold sm:text-base">{recipeTitle}</span>
        </div>
        <button
          onClick={close}
          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text"
          aria-label="Pişirme modundan çık"
        >
          <CloseIcon />
        </button>
      </header>

      {/* Progress bar */}
      <div className="h-1 w-full bg-bg-elevated">
        <div
          className="h-full bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Step Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-6 py-8 sm:px-12">
        <div className="w-full max-w-2xl text-center">
          {/* Step indicator */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white sm:h-12 sm:w-12 sm:text-xl">
              {step.stepNumber}
            </span>
            <span className="text-sm text-text-muted">/ {totalSteps}</span>
          </div>

          {/* Instruction */}
          <p className="font-heading text-xl font-medium leading-relaxed sm:text-2xl md:text-3xl">
            {step.instruction}
          </p>

          {/* Tip */}
          {step.tip && (
            <div className="mx-auto mt-6 max-w-lg rounded-xl border border-secondary/30 bg-secondary/10 px-4 py-3">
              <p className="text-sm text-secondary sm:text-base">
                <span className="font-semibold">💡</span> {step.tip}
              </p>
            </div>
          )}

          {/* Timer */}
          {step.timerSeconds && step.timerSeconds > 0 && (
            <div className="mt-8">
              {timer === null ? (
                <button
                  onClick={() => startTimer(step.timerSeconds!)}
                  className="inline-flex items-center gap-2 rounded-xl bg-accent-blue/15 px-6 py-3 text-base font-medium text-accent-blue transition-colors hover:bg-accent-blue/25"
                >
                  <TimerIcon size={18} />
                  Zamanlayıcıyı Başlat ({formatTimer(step.timerSeconds)})
                </button>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <span
                    className={`font-mono text-4xl font-bold sm:text-5xl ${
                      timer === 0 ? "animate-pulse text-accent-green" : "text-accent-blue"
                    }`}
                  >
                    {formatTimerDisplay(timer)}
                  </span>
                  {timer === 0 ? (
                    <span className="text-base font-medium text-accent-green">Süre doldu!</span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={toggleTimer}
                        className="rounded-lg bg-bg-elevated px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-border"
                      >
                        {timerRunning ? "Duraklat" : "Devam"}
                      </button>
                      <button
                        onClick={() => resetTimer(step.timerSeconds!)}
                        className="rounded-lg bg-bg-elevated px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-border hover:text-text"
                      >
                        Sıfırla
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Navigation */}
      <footer className="border-t border-border px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <button
            onClick={goPrev}
            disabled={currentStep === 0}
            className="rounded-lg px-5 py-2.5 text-sm font-medium text-text-muted transition-colors hover:bg-bg-elevated hover:text-text disabled:opacity-30 disabled:hover:bg-transparent"
          >
            ← Önceki
          </button>

          {/* Step dots */}
          <div className="hidden gap-1.5 sm:flex">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => {
                  setCurrentStep(i);
                  setTimer(null);
                  setTimerRunning(false);
                }}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep
                    ? "w-6 bg-primary"
                    : i < currentStep
                      ? "w-2 bg-primary/40"
                      : "w-2 bg-border"
                }`}
                aria-label={`Adım ${i + 1}`}
              />
            ))}
          </div>

          {currentStep === totalSteps - 1 ? (
            <button
              onClick={close}
              className="rounded-lg bg-accent-green px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-green/90"
            >
              Tamamlandı ✓
            </button>
          ) : (
            <button
              onClick={goNext}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              Sonraki →
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function formatTimer(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} dk`;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return `${hours} sa`;
  return `${hours} sa ${remaining} dk`;
}

function formatTimerDisplay(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function ChefHatIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21a1 1 0 0 0 1-1v-5.35c0-.457.316-.844.727-1.041a4 4 0 0 0-2.134-7.589 5 5 0 0 0-9.186 0 4 4 0 0 0-2.134 7.588c.411.198.727.585.727 1.041V20a1 1 0 0 0 1 1Z" />
      <path d="M6 17h12" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

function TimerIcon({ size = 12 }: { size?: number }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
