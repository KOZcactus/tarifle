import type { EmailProvider } from "./types";
import { ConsoleEmailProvider } from "./providers/console";
import { ResendEmailProvider } from "./providers/resend";

let cached: EmailProvider | null = null;

/**
 * Returns the active email provider. Real provider when API key is set,
 * console fallback otherwise. Cached at module scope so we don't reconstruct
 * the Resend client per request.
 */
export function getEmailProvider(): EmailProvider {
  if (cached) return cached;

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    cached = new ResendEmailProvider(apiKey, process.env.RESEND_FROM);
  } else {
    cached = new ConsoleEmailProvider();
  }
  return cached;
}
