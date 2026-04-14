import { Resend } from "resend";
import type { EmailProvider, SendEmailInput, SendEmailResult } from "../types";

/**
 * Resend transactional email provider. Requires:
 *  - RESEND_API_KEY env var
 *  - RESEND_FROM env var (default: "Tarifle <noreply@tarifle.app>")
 *  - Verified domain in the Resend dashboard with SPF + DKIM DNS records
 */
export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend" as const;
  private readonly client: Resend;
  private readonly from: string;

  constructor(apiKey: string, from?: string) {
    this.client = new Resend(apiKey);
    this.from = from ?? "Tarifle <noreply@tarifle.app>";
  }

  async send(input: SendEmailInput): Promise<SendEmailResult> {
    try {
      const { data, error } = await this.client.emails.send({
        from: this.from,
        to: input.to,
        subject: input.subject,
        text: input.text,
        html: input.html,
      });

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, messageId: data?.id };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Bilinmeyen e-posta hatası";
      return { success: false, error: message };
    }
  }
}
