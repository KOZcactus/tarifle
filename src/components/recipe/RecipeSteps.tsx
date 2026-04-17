"use client";

import { useTranslations } from "next-intl";

interface Step {
  id: string;
  stepNumber: number;
  instruction: string;
  tip: string | null;
  timerSeconds: number | null;
}

interface RecipeStepsProps {
  steps: Step[];
}

export function RecipeSteps({ steps }: RecipeStepsProps) {
  const t = useTranslations("recipe.steps");
  const tCard = useTranslations("recipes.card");
  return (
    <div>
      <h2 className="mb-4 font-heading text-lg font-semibold">{t("title")}</h2>
      <ol className="space-y-6">
        {steps.map((step) => (
          <li key={step.id} className="relative flex gap-4">
            {/* Step Number */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
              {step.stepNumber}
            </div>

            <div className="flex-1 pt-0.5">
              <p className="text-sm leading-relaxed">{step.instruction}</p>

              {step.tip && (
                <div className="mt-2 rounded-lg border border-secondary/30 bg-secondary/10 px-3 py-2">
                  <p className="text-xs text-secondary">
                    <span className="font-semibold">{t("tipLabel")}</span> {step.tip}
                  </p>
                </div>
              )}

              {step.timerSeconds && (
                <div className="mt-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/15 px-2.5 py-1 text-xs font-medium text-accent-blue">
                    <TimerIcon />
                    {formatTimer(step.timerSeconds, tCard)}
                  </span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function formatTimer(
  seconds: number,
  tCard: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return tCard("minutesShort", { n: minutes });
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (remaining === 0) return tCard("hoursShort", { n: hours });
  return tCard("hoursMinutes", { h: hours, m: remaining });
}

function TimerIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
