"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { pickTtsVoice, type TtsGender } from "@/lib/tts/voice-picker";

const TTS_AUTO_READ_KEY = "tarifle:cooking-mode:auto-read";

function readAutoReadPref(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(TTS_AUTO_READ_KEY) === "1";
  } catch {
    return false;
  }
}

function writeAutoReadPref(val: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(TTS_AUTO_READ_KEY, val ? "1" : "0");
  } catch {
    // storage unavailable, ignore
  }
}

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
  // Kullanicinin /ayarlar'daki TTS ses tercihi. Default female (misafir
  // veya eski kullanici). Cooking Mode speakText cagrilarinda utterance.
  // voice alani bu tercihe gore secilir.
  ttsVoicePreference?: TtsGender;
}

export function CookingMode({
  steps,
  recipeTitle,
  recipeEmoji,
  ttsVoicePreference = "female",
}: CookingModeProps) {
  const t = useTranslations("cookingMode");
  const tCard = useTranslations("recipes.card");
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [timer, setTimer] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [autoRead, setAutoRead] = useState(false);
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

  // TTS (text-to-speech) — Web Speech API, TR-TR.
  // Okuma: utterance queue'ya girer; step değişince veya kapanışta cancel.
  const stopSpeaking = useCallback(() => {
    if (typeof window === "undefined") return;
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = "tr-TR";
      utter.rate = 0.95;
      utter.pitch = 1;
      // Kullanıcı tercihine göre voice seç. Bazı platformlarda voices
      // asenkron yüklenir; getVoices ilk çağrıda boş olabilir, bu durumda
      // browser default ses kullanılır.
      const voices = window.speechSynthesis.getVoices();
      const voice = pickTtsVoice(voices, ttsVoicePreference);
      if (voice) utter.voice = voice;
      utter.onend = () => setIsSpeaking(false);
      utter.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utter);
      setIsSpeaking(true);
    },
    [ttsVoicePreference],
  );

  // Open/close
  const open = useCallback(() => {
    setIsOpen(true);
    setCurrentStep(0);
    setTimer(null);
    setTimerRunning(false);
    setAutoRead(readAutoReadPref());
    requestWakeLock();
    document.body.style.overflow = "hidden";
  }, [requestWakeLock]);

  const close = useCallback(() => {
    setIsOpen(false);
    setTimerRunning(false);
    setTimer(null);
    stopSpeaking();
    releaseWakeLock();
    document.body.style.overflow = "";
  }, [releaseWakeLock, stopSpeaking]);

  // Step navigation, declared before the effect below so the keyboard
  // handler can close over a stable identity via useCallback. Using plain
  // arrow functions would require the effect to re-run every render and
  // React 19's react-hooks/immutability rule flags the ordering mistake.
  const goNext = useCallback(() => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((s) => s + 1);
      setTimer(null);
      setTimerRunning(false);
      stopSpeaking();
    }
  }, [currentStep, totalSteps, stopSpeaking]);

  const goPrev = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
      setTimer(null);
      setTimerRunning(false);
      stopSpeaking();
    }
  }, [currentStep, stopSpeaking]);

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
  }, [isOpen, close, goNext, goPrev]);

  // Auto-read: adim degisince ve toggle aciksa TTS oku. İlk acılısta da
  // otomatik başlamaz — kullanıcı ya autoRead toggle'ı açmış olmalı ya
  // manuel 🔊 butonuna basmış. Tip varsa instruction'dan sonra okunur.
  useEffect(() => {
    if (!isOpen || !autoRead) return;
    const current = steps[currentStep];
    if (!current) return;
    const text = current.tip
      ? `${current.instruction} İpucu: ${current.tip}`
      : current.instruction;
    speakText(text);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep, isOpen, autoRead]);

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
      <div className="inline-flex flex-col items-start gap-1.5">
        <button
          onClick={open}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
        >
          <ChefHatIcon />
          {t("startButton")}
        </button>
        <p className="text-xs text-text-muted">{t("startButtonHint")}</p>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("modalAria", { title: recipeTitle })}
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
          aria-label={t("closeAria")}
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
          {/* Step indicator + TTS controls */}
          <div className="mb-6 flex items-center justify-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold text-white sm:h-12 sm:w-12 sm:text-xl">
              {step.stepNumber}
            </span>
            <span className="text-sm text-text-muted">/ {totalSteps}</span>
            <button
              type="button"
              onClick={() => {
                if (isSpeaking) {
                  stopSpeaking();
                } else {
                  const text = step.tip
                    ? `${step.instruction} İpucu: ${step.tip}`
                    : step.instruction;
                  speakText(text);
                }
              }}
              aria-pressed={isSpeaking}
              aria-label={
                isSpeaking ? t("ttsStop") : t("ttsRead")
              }
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                isSpeaking
                  ? "border-accent-blue bg-accent-blue/20 text-accent-blue"
                  : "border-border bg-bg-elevated text-text-muted hover:border-accent-blue hover:text-accent-blue"
              }`}
            >
              <span aria-hidden>{isSpeaking ? "⏹" : "🔊"}</span>
              {isSpeaking ? t("ttsStop") : t("ttsRead")}
            </button>
            <label
              className="ml-2 flex cursor-pointer items-center gap-1.5 text-xs text-text-muted"
              title={t("ttsAutoReadHint")}
            >
              <input
                type="checkbox"
                checked={autoRead}
                onChange={(e) => {
                  const next = e.target.checked;
                  setAutoRead(next);
                  writeAutoReadPref(next);
                  if (!next) stopSpeaking();
                }}
                className="h-3.5 w-3.5 rounded border-border text-primary focus:ring-primary"
              />
              {t("ttsAutoRead")}
            </label>
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
                  {t("timerStart", { duration: formatTimer(step.timerSeconds, tCard) })}
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
                    <span className="text-base font-medium text-accent-green">{t("timerDone")}</span>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={toggleTimer}
                        className="rounded-lg bg-bg-elevated px-4 py-2 text-sm font-medium text-text transition-colors hover:bg-border"
                      >
                        {timerRunning ? t("timerPause") : t("timerResume")}
                      </button>
                      <button
                        onClick={() => resetTimer(step.timerSeconds!)}
                        className="rounded-lg bg-bg-elevated px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-border hover:text-text"
                      >
                        {t("timerReset")}
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
            {t("prev")}
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
                aria-label={t("stepDotAria", { n: i + 1 })}
              />
            ))}
          </div>

          {currentStep === totalSteps - 1 ? (
            <button
              onClick={close}
              className="rounded-lg bg-accent-green px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-green/90"
            >
              {t("finish")}
            </button>
          ) : (
            <button
              onClick={goNext}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
            >
              {t("next")}
            </button>
          )}
        </div>
      </footer>
    </div>
  );
}

function formatTimer(
  seconds: number,
  tCard: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  // Sub-minute steps show as seconds (mirrors RecipeSteps.formatTimer).
  if (seconds > 0 && seconds < 60) return tCard("secondsShort", { n: seconds });
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return tCard("minutesShort", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return tCard("hoursShort", { n: hours });
  return tCard("hoursMinutes", { h: hours, m: remaining });
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
