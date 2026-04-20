"use server";

import { auth } from "@/lib/auth";
import { getAiProvider } from "@/lib/ai/provider";
import type { AiSuggestResponse } from "@/lib/ai/types";
import { aiSuggestSchema } from "@/lib/validators";
import {
  checkRateLimit,
  getClientIp,
  rateLimitIdentifier,
} from "@/lib/rate-limit";

interface ActionResult<T = undefined> {
  success: boolean;
  error?: string;
  data?: T;
}

export async function suggestRecipesAction(
  raw: unknown,
): Promise<ActionResult<AiSuggestResponse>> {
  // 30 requests / minute per identifier, the rule-based provider is cheap
  // today, but when we wire a real LLM later the same limit protects cost.
  // Logged-in users get a stable bucket; anonymous callers are keyed by IP.
  const session = await auth();
  const ip = session?.user?.id ? null : await getClientIp();
  const rate = await checkRateLimit(
    "ai-assistant",
    rateLimitIdentifier(session?.user?.id, ip),
  );
  if (!rate.success) {
    return { success: false, error: rate.message ?? "Çok fazla istek." };
  }

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
