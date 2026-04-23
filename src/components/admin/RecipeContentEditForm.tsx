"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateRecipeContentAction } from "@/lib/actions/admin";
import { RecipePreviewPane } from "./RecipePreviewPane";

interface IngredientDraft {
  uid: string;
  name: string;
  amount: string;
  unit: string;
}

interface StepDraft {
  uid: string;
  instruction: string;
  timerSeconds: number | null;
}

interface Props {
  recipeId: string;
  slug: string;
  title: string;
  initialIngredients: Array<{ name: string; amount: string; unit: string | null }>;
  initialSteps: Array<{ instruction: string; timerSeconds: number | null }>;
  initialTipNote: string | null;
  initialServingSuggestion: string | null;
}

const MAX_INGREDIENTS = 40;
const MAX_STEPS = 15;
const MAX_NAME = 200;
const MAX_AMOUNT = 50;
const MAX_UNIT = 50;
const MAX_INSTRUCTION = 2000;
const MAX_NOTE = 500;

function makeUid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function toIngredientDrafts(
  list: Array<{ name: string; amount: string; unit: string | null }>,
): IngredientDraft[] {
  return list.map((i) => ({
    uid: makeUid(),
    name: i.name,
    amount: i.amount,
    unit: i.unit ?? "",
  }));
}

function toStepDrafts(
  list: Array<{ instruction: string; timerSeconds: number | null }>,
): StepDraft[] {
  return list.map((s) => ({
    uid: makeUid(),
    instruction: s.instruction,
    timerSeconds: s.timerSeconds,
  }));
}

type ConfirmTarget =
  | { kind: "ingredient"; uid: string; label: string }
  | { kind: "step"; uid: string; index: number }
  | null;

export function RecipeContentEditForm({
  recipeId,
  slug,
  title,
  initialIngredients,
  initialSteps,
  initialTipNote,
  initialServingSuggestion,
}: Props) {
  const t = useTranslations("admin.contentEdit");
  const router = useRouter();
  const [ingredients, setIngredients] = useState<IngredientDraft[]>(
    toIngredientDrafts(initialIngredients),
  );
  const [steps, setSteps] = useState<StepDraft[]>(toStepDrafts(initialSteps));
  const [tipNote, setTipNote] = useState<string>(initialTipNote ?? "");
  const [servingSuggestion, setServingSuggestion] = useState<string>(
    initialServingSuggestion ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [confirmTarget, setConfirmTarget] = useState<ConfirmTarget>(null);
  const confirmDialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const dlg = confirmDialogRef.current;
    if (!dlg) return;
    if (confirmTarget && !dlg.open) dlg.showModal();
    if (!confirmTarget && dlg.open) dlg.close();
  }, [confirmTarget]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ingredientIds = useMemo(() => ingredients.map((i) => i.uid), [ingredients]);
  const stepIds = useMemo(() => steps.map((s) => s.uid), [steps]);

  function updateIngredient(uid: string, field: keyof Omit<IngredientDraft, "uid">, value: string) {
    setIngredients((prev) =>
      prev.map((i) => (i.uid === uid ? { ...i, [field]: value } : i)),
    );
    setSaved(false);
  }

  function addIngredient() {
    if (ingredients.length >= MAX_INGREDIENTS) return;
    setIngredients((prev) => [
      ...prev,
      { uid: makeUid(), name: "", amount: "", unit: "" },
    ]);
    setSaved(false);
  }

  function confirmRemoveIngredient(uid: string, label: string) {
    setConfirmTarget({ kind: "ingredient", uid, label });
  }

  function confirmRemoveStep(uid: string, index: number) {
    setConfirmTarget({ kind: "step", uid, index });
  }

  function performRemove() {
    if (!confirmTarget) return;
    if (confirmTarget.kind === "ingredient") {
      const uid = confirmTarget.uid;
      setIngredients((prev) => prev.filter((i) => i.uid !== uid));
    } else {
      const uid = confirmTarget.uid;
      setSteps((prev) => prev.filter((s) => s.uid !== uid));
    }
    setConfirmTarget(null);
    setSaved(false);
  }

  function onIngredientDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setIngredients((prev) => {
      const oldIndex = prev.findIndex((i) => i.uid === active.id);
      const newIndex = prev.findIndex((i) => i.uid === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
    setSaved(false);
  }

  function onStepDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s.uid === active.id);
      const newIndex = prev.findIndex((s) => s.uid === over.id);
      if (oldIndex < 0 || newIndex < 0) return prev;
      return arrayMove(prev, oldIndex, newIndex);
    });
    setSaved(false);
  }

  function updateStep(uid: string, field: keyof Omit<StepDraft, "uid">, value: string) {
    setSteps((prev) =>
      prev.map((s) => {
        if (s.uid !== uid) return s;
        if (field === "timerSeconds") {
          const trimmed = value.trim();
          return {
            ...s,
            timerSeconds: trimmed === "" ? null : Math.max(0, Number(trimmed) || 0),
          };
        }
        return { ...s, instruction: value };
      }),
    );
    setSaved(false);
  }

  function addStep() {
    if (steps.length >= MAX_STEPS) return;
    setSteps((prev) => [
      ...prev,
      { uid: makeUid(), instruction: "", timerSeconds: null },
    ]);
    setSaved(false);
  }

  function validateLocal(): string | null {
    if (ingredients.length === 0) return t("errorNoIngredient");
    if (steps.length === 0) return t("errorNoStep");
    for (let i = 0; i < ingredients.length; i++) {
      const ing = ingredients[i]!;
      if (!ing.name.trim()) return t("errorIngredientName", { n: i + 1 });
      if (!ing.amount.trim()) return t("errorIngredientAmount", { n: i + 1 });
    }
    for (let i = 0; i < steps.length; i++) {
      if (!steps[i]!.instruction.trim()) return t("errorStepEmpty", { n: i + 1 });
    }
    const hasEmDash = (s: string) => s.includes("\u2014") || s.includes("\u2013");
    for (const ing of ingredients) {
      if (hasEmDash(ing.name) || hasEmDash(ing.amount) || hasEmDash(ing.unit)) {
        return t("errorEmDash");
      }
    }
    for (const s of steps) {
      if (hasEmDash(s.instruction)) return t("errorEmDash");
    }
    if (hasEmDash(tipNote) || hasEmDash(servingSuggestion)) return t("errorEmDash");
    return null;
  }

  function onSubmit() {
    setError(null);
    setSaved(false);
    const localErr = validateLocal();
    if (localErr) {
      setError(localErr);
      return;
    }
    startTransition(async () => {
      const res = await updateRecipeContentAction({
        recipeId,
        ingredients: ingredients.map((i, idx) => ({
          sortOrder: idx + 1,
          name: i.name.trim(),
          amount: i.amount.trim(),
          unit: i.unit.trim() || undefined,
        })),
        steps: steps.map((s, idx) => ({
          stepNumber: idx + 1,
          instruction: s.instruction.trim(),
          timerSeconds: s.timerSeconds ?? undefined,
        })),
        tipNote: tipNote.trim() || undefined,
        servingSuggestion: servingSuggestion.trim() || undefined,
      });
      if (res.success) {
        setSaved(true);
        router.refresh();
      } else {
        setError(res.error ?? t("errorSaveFailed"));
      }
    });
  }

  const confirmBody =
    confirmTarget?.kind === "ingredient"
      ? t("confirmRemoveIngredientBody", { label: confirmTarget.label || t("unnamedIngredient") })
      : confirmTarget?.kind === "step"
        ? t("confirmRemoveStepBody", { n: confirmTarget.index + 1 })
        : "";

  const previewIngredients = ingredients.map(({ name, amount, unit }) => ({
    name,
    amount,
    unit,
  }));
  const previewSteps = steps.map(({ instruction, timerSeconds }) => ({
    instruction,
    timerSeconds,
  }));

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
      <div className="space-y-8">
      <header className="border-b border-border pb-4">
        <p className="text-sm text-text-muted">{t("editingLabel")}</p>
        <h1 className="text-2xl font-semibold text-text">
          {title} <span className="text-base font-normal text-text-muted">({slug})</span>
        </h1>
        <p className="mt-1 text-sm text-text-muted">{t("helpText")}</p>
      </header>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-text">
            {t("ingredientsHeading")}{" "}
            <span className="text-sm font-normal text-text-muted">
              ({ingredients.length}/{MAX_INGREDIENTS})
            </span>
          </h2>
          <button
            type="button"
            onClick={addIngredient}
            disabled={ingredients.length >= MAX_INGREDIENTS || pending}
            className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {t("addIngredient")}
          </button>
        </div>
        <p className="text-xs text-text-muted">{t("dragHint")}</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onIngredientDragEnd}
        >
          <SortableContext items={ingredientIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {ingredients.map((ing, idx) => (
                <SortableIngredientRow
                  key={ing.uid}
                  uid={ing.uid}
                  index={idx}
                  ingredient={ing}
                  onChange={updateIngredient}
                  onRemoveRequest={() => confirmRemoveIngredient(ing.uid, ing.name)}
                  disabled={pending}
                  t={t}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold text-text">
            {t("stepsHeading")}{" "}
            <span className="text-sm font-normal text-text-muted">
              ({steps.length}/{MAX_STEPS})
            </span>
          </h2>
          <button
            type="button"
            onClick={addStep}
            disabled={steps.length >= MAX_STEPS || pending}
            className="rounded bg-primary px-3 py-1 text-sm text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {t("addStep")}
          </button>
        </div>
        <p className="text-xs text-text-muted">{t("dragHint")}</p>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={onStepDragEnd}
        >
          <SortableContext items={stepIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {steps.map((s, idx) => (
                <SortableStepRow
                  key={s.uid}
                  uid={s.uid}
                  index={idx}
                  step={s}
                  onChange={updateStep}
                  onRemoveRequest={() => confirmRemoveStep(s.uid, idx)}
                  disabled={pending}
                  t={t}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </section>

      <section className="space-y-3">
        <label className="block" htmlFor="tipNote-field">
          <span className="text-lg font-semibold text-text">{t("tipNoteHeading")}</span>
          <span className="ml-2 text-sm text-text-muted">{t("tipNoteHint")}</span>
        </label>
        <textarea
          id="tipNote-field"
          value={tipNote}
          onChange={(e) => {
            setTipNote(e.target.value);
            setSaved(false);
          }}
          placeholder={t("tipNotePlaceholder")}
          maxLength={MAX_NOTE}
          rows={3}
          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="text-xs text-text-muted">
          {tipNote.length}/{MAX_NOTE}
        </p>
      </section>

      <section className="space-y-3">
        <label className="block" htmlFor="serv-field">
          <span className="text-lg font-semibold text-text">
            {t("servingSuggestionHeading")}
          </span>
          <span className="ml-2 text-sm text-text-muted">{t("servingSuggestionHint")}</span>
        </label>
        <textarea
          id="serv-field"
          value={servingSuggestion}
          onChange={(e) => {
            setServingSuggestion(e.target.value);
            setSaved(false);
          }}
          placeholder={t("servingSuggestionPlaceholder")}
          maxLength={MAX_NOTE}
          rows={3}
          className="w-full rounded-lg border border-border bg-bg-card px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="text-xs text-text-muted">
          {servingSuggestion.length}/{MAX_NOTE}
        </p>
      </section>

      <footer className="sticky bottom-0 -mx-4 border-t border-border bg-bg/95 px-4 py-3 backdrop-blur">
        <div className="flex items-center justify-between gap-3">
          <div className="text-xs">
            {error && <span className="text-error">{error}</span>}
            {saved && !error && (
              <span className="text-accent-green">{t("saveSuccess")}</span>
            )}
          </div>
          <button
            type="button"
            onClick={onSubmit}
            disabled={pending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-50"
          >
            {pending ? t("saving") : t("saveAll")}
          </button>
        </div>
      </footer>

      <dialog
        ref={confirmDialogRef}
        onClose={() => setConfirmTarget(null)}
        className="max-w-md rounded-xl border border-border bg-bg p-0 shadow-xl backdrop:bg-black/40"
      >
        <div className="px-5 py-4">
          <h3 className="text-base font-semibold text-text">{t("confirmRemoveTitle")}</h3>
          <p className="mt-2 text-sm text-text-muted">{confirmBody}</p>
        </div>
        <div className="flex justify-end gap-2 border-t border-border px-5 py-3">
          <button
            type="button"
            onClick={() => setConfirmTarget(null)}
            className="rounded px-3 py-1.5 text-sm text-text-muted hover:bg-bg-elevated"
          >
            {t("confirmRemoveCancel")}
          </button>
          <button
            type="button"
            onClick={performRemove}
            className="rounded bg-error px-3 py-1.5 text-sm font-medium text-white hover:bg-error/90"
          >
            {t("confirmRemoveConfirm")}
          </button>
        </div>
      </dialog>
      </div>

      <div className="hidden lg:block">
        <RecipePreviewPane
          title={title}
          ingredients={previewIngredients}
          steps={previewSteps}
          tipNote={tipNote}
          servingSuggestion={servingSuggestion}
        />
      </div>
    </div>
  );
}

// ── Sortable row components ────────────────────────────────────

interface SortableIngredientRowProps {
  uid: string;
  index: number;
  ingredient: IngredientDraft;
  onChange: (uid: string, field: keyof Omit<IngredientDraft, "uid">, value: string) => void;
  onRemoveRequest: () => void;
  disabled: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}

function SortableIngredientRow({
  uid,
  index,
  ingredient,
  onChange,
  onRemoveRequest,
  disabled,
  t,
}: SortableIngredientRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: uid });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="grid grid-cols-[auto_auto_minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-2 rounded-lg border border-border bg-bg-card p-2"
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-label={t("dragHandleIngredient", { n: index + 1 })}
        disabled={disabled}
        className="cursor-grab touch-none rounded px-1.5 py-1 text-text-muted hover:bg-bg-elevated active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
      >
        ⋮⋮
      </button>
      <span className="w-6 text-center text-xs text-text-muted">{index + 1}</span>
      <input
        type="text"
        value={ingredient.name}
        onChange={(e) => onChange(uid, "name", e.target.value)}
        placeholder={t("ingredientNamePlaceholder")}
        maxLength={MAX_NAME}
        className="rounded border border-border bg-bg px-2 py-1 text-sm focus:border-primary focus:outline-none"
        aria-label={t("ingredientNameLabel", { n: index + 1 })}
      />
      <input
        type="text"
        value={ingredient.amount}
        onChange={(e) => onChange(uid, "amount", e.target.value)}
        placeholder={t("ingredientAmountPlaceholder")}
        maxLength={MAX_AMOUNT}
        className="rounded border border-border bg-bg px-2 py-1 text-sm focus:border-primary focus:outline-none"
        aria-label={t("ingredientAmountLabel", { n: index + 1 })}
      />
      <input
        type="text"
        value={ingredient.unit}
        onChange={(e) => onChange(uid, "unit", e.target.value)}
        placeholder={t("ingredientUnitPlaceholder")}
        maxLength={MAX_UNIT}
        className="rounded border border-border bg-bg px-2 py-1 text-sm focus:border-primary focus:outline-none"
        aria-label={t("ingredientUnitLabel", { n: index + 1 })}
      />
      <button
        type="button"
        onClick={onRemoveRequest}
        disabled={disabled}
        className="rounded border border-error/30 px-2 py-1 text-xs text-error hover:bg-error/10 disabled:opacity-30"
        aria-label={t("remove")}
      >
        ✕
      </button>
    </div>
  );
}

interface SortableStepRowProps {
  uid: string;
  index: number;
  step: StepDraft;
  onChange: (uid: string, field: keyof Omit<StepDraft, "uid">, value: string) => void;
  onRemoveRequest: () => void;
  disabled: boolean;
  t: (key: string, values?: Record<string, string | number>) => string;
}

function SortableStepRow({
  uid,
  index,
  step,
  onChange,
  onRemoveRequest,
  disabled,
  t,
}: SortableStepRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: uid });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg border border-border bg-bg-card p-3"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label={t("dragHandleStep", { n: index + 1 })}
            disabled={disabled}
            className="cursor-grab touch-none rounded px-1.5 py-1 text-text-muted hover:bg-bg-elevated active:cursor-grabbing disabled:cursor-not-allowed disabled:opacity-40"
          >
            ⋮⋮
          </button>
          <span className="text-sm font-medium text-text-muted">
            {t("stepLabel", { n: index + 1 })}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemoveRequest}
          disabled={disabled}
          className="rounded border border-error/30 px-2 py-1 text-xs text-error hover:bg-error/10 disabled:opacity-30"
          aria-label={t("remove")}
        >
          ✕
        </button>
      </div>
      <textarea
        value={step.instruction}
        onChange={(e) => onChange(uid, "instruction", e.target.value)}
        placeholder={t("stepInstructionPlaceholder")}
        maxLength={MAX_INSTRUCTION}
        rows={3}
        className="w-full rounded border border-border bg-bg px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
        aria-label={t("stepInstructionLabel", { n: index + 1 })}
      />
      <div className="mt-1.5 flex items-center gap-2 text-xs">
        <label className="text-text-muted" htmlFor={`timer-${uid}`}>
          {t("stepTimerLabel")}
        </label>
        <input
          id={`timer-${uid}`}
          type="number"
          min={0}
          step={1}
          value={step.timerSeconds ?? ""}
          onChange={(e) => onChange(uid, "timerSeconds", e.target.value)}
          placeholder="0"
          className="w-24 rounded border border-border bg-bg px-2 py-1 text-sm focus:border-primary focus:outline-none"
        />
        <span className="text-text-muted">{t("stepTimerHint")}</span>
      </div>
    </div>
  );
}
