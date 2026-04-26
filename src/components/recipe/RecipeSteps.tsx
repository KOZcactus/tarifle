"use client";

import { useTranslations } from "next-intl";
import { StepTimer } from "@/components/recipe/StepTimer";

interface Step {
  id: string;
  stepNumber: number;
  instruction: string;
  tip: string | null;
  timerSeconds: number | null;
}

interface RecipeStepsProps {
  steps: Step[];
  recipeTitle: string;
}

export function RecipeSteps({ steps, recipeTitle }: RecipeStepsProps) {
  const t = useTranslations("recipe.steps");
  const tCard = useTranslations("recipes.card");
  return (
    <div>
      <h2 className="mb-4 font-heading text-lg font-semibold">{t("title")}</h2>
      <ol className="list-none space-y-6 pl-0">
        {steps.map((step) => (
          <li
            key={step.id}
            id={`step-${step.stepNumber}`}
            className="relative flex scroll-mt-20 gap-4"
          >
            {/* Step Number, custom badge replaces the default <ol> marker.
                `list-none` + `pl-0` suppress the default "1.", "2." markers
                that Tailwind 4 preflight leaves on ordered lists; without
                that, screen readers and text-extraction tools (GPT audit,
                print view) saw "1. 1" duplication. */}
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

              {step.timerSeconds && step.timerSeconds > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent-blue/10 px-2.5 py-1 text-xs font-medium text-accent-blue print:inline-flex">
                    <TimerIcon />
                    {formatTimer(step.timerSeconds, tCard)}
                  </span>
                  <StepTimer
                    totalSeconds={step.timerSeconds}
                    stepNumber={step.stepNumber}
                    recipeTitle={recipeTitle}
                  />
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
  // Sub-minute steps (e.g. 30-second shake) should show as seconds, not
  // "0 min", `Math.floor(30/60)` is 0 and reads like a data bug.
  if (seconds > 0 && seconds < 60) return tCard("secondsShort", { n: seconds });
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
