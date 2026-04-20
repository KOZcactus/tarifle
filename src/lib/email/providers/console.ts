import type { EmailProvider, SendEmailInput, SendEmailResult } from "../types";

/**
 * Dev fallback, when RESEND_API_KEY isn't configured, emails are logged to
 * the server console instead of being sent. Useful for local development and
 * for previewing flows without consuming the production email quota.
 */
export class ConsoleEmailProvider implements EmailProvider {
  readonly name = "console" as const;

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    const sep = "─".repeat(60);
    console.info(
      `\n${sep}\n[email] (console provider, no real email sent)\nTo:      ${input.to}\nSubject: ${input.subject}\n${sep}\n${input.text}\n${sep}\n`,
    );
    return { success: true, messageId: `console-${Date.now()}` };
  }
}
