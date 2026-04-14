"use server";

import { getAiProvider } from "@/lib/ai/provider";
import type { AiSuggestResponse } from "@/lib/ai/types";
import { aiSuggestSchema } from "@/lib/validators";

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function suggestRecipesAction(
  raw: unknown,
): Promise<ActionResult<AiSuggestResponse>> {
  const parsed = aiSuggestSchema.safeParse(raw);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Geçersiz veri." };
  }

  try {
    const provider = getAiProvider();
    const result = await provider.suggest(parsed.data);
    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Öneriler alınamadı.";
    return { success: false, error: message };
  }
}
