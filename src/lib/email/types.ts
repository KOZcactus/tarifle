export interface SendEmailInput {
  to: string;
  subject: string;
  /** Plain-text body — used as fallback. */
  text: string;
  /** HTML body — preferred by most clients. */
  html: string;
}

export interface SendEmailResult {
  success: boolean;
  /** Provider-specific message ID, useful for support tickets. */
  messageId?: string;
  error?: string;
}

export interface EmailProvider {
  readonly name: "resend" | "console";
  send(input: SendEmailInput): Promise<SendEmailResult>;
}
