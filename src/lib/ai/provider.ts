import type { AiProvider } from "./types";
import { RuleBasedProvider } from "./rule-based-provider";

/**
 * Returns the active AI provider.
 *
 * Today: always rule-based. When Claude Haiku is wired up, this factory will
 * choose based on `process.env.ANTHROPIC_API_KEY` being set — falling back to
 * rule-based if the call fails or the key is missing. Callers should not need
 * to change.
 */
export function getAiProvider(): AiProvider {
  // Future: if (process.env.ANTHROPIC_API_KEY) return new ClaudeHaikuProvider();
  return new RuleBasedProvider();
}
