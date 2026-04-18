import { randomBytes } from "node:crypto";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";
import { awardEmailVerifiedBadge } from "@/lib/badges/service";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getEmailProvider } from "./client";

const TOKEN_TTL_HOURS = 24;
const TOKEN_BYTES = 32;

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Issues a fresh verification token for the given email and sends the
 * verification mail. Old unexpired tokens for this address are invalidated so
 * a user can't accumulate dozens of valid links.
 *
 * Locale defaults to TR; caller should pass `User.locale` when known so the
 * email body matches the recipient's interface language.
 */
export async function sendVerificationEmail(
  email: string,
  recipientName?: string | null,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ success: boolean; error?: string }> {
  const token = generateToken();
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  // Wipe any older unexpired tokens for this email so only the latest works.
  await prisma.verificationToken.deleteMany({ where: { identifier: email } });

  await prisma.verificationToken.create({
    data: { identifier: email, token, expires },
  });

  const verifyUrl = `${SITE_URL}/dogrula/${encodeURIComponent(token)}`;
  const t = await getTranslations({ locale, namespace: "email.verification" });

  const greeting = recipientName
    ? t("greetingNamed", { name: recipientName })
    : t("greeting");
  const bodyHtml = t.rich("body", {
    hours: TOKEN_TTL_HOURS,
    strong: (chunks) => `<strong>${chunks}</strong>`,
  });

  const text = [
    greeting,
    "",
    t("textBody"),
    "",
    verifyUrl,
    "",
    t("textExpiry", { hours: TOKEN_TTL_HOURS }),
    t("textFooter"),
    "",
    t("signature"),
  ].join("\n");

  const html = `
<!doctype html>
<html lang="${locale}">
<head>
  <meta charset="utf-8">
  <title>${t("subject")}</title>
</head>
<body style="margin:0;padding:0;background:#f8f6f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f2;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ddd8cf;">
        <tr><td style="padding:32px 32px 24px;">
          <p style="margin:0 0 4px;font-size:14px;color:#6b6b6b;letter-spacing:1px;text-transform:uppercase;">${t("eyebrow")}</p>
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.2;color:#1a1a1a;">${t("title")}</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#1a1a1a;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#1a1a1a;">${bodyHtml}</p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${verifyUrl}" style="display:inline-block;background:#e85d2c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">${t("cta")}</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b;line-height:1.55;">${t("fallbackHint")}</p>
          <p style="margin:0 0 24px;font-size:12px;color:#6b6b6b;word-break:break-all;line-height:1.4;"><a href="${verifyUrl}" style="color:#e85d2c;text-decoration:underline;">${verifyUrl}</a></p>
          <hr style="border:none;border-top:1px solid #ddd8cf;margin:24px 0;">
          <p style="margin:0;font-size:12px;color:#6b6b6b;line-height:1.55;">${t("footer")}</p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#6b6b6b;">© Tarifle · tarifle.app</p>
    </td></tr>
  </table>
</body>
</html>`.trim();

  const provider = getEmailProvider();
  return provider.send({
    to: email,
    subject: t("subject"),
    text,
    html,
  });
}

/**
 * Consumes a verification token: marks the matching user as verified, removes
 * the token. Returns the user (or null on failure).
 */
export async function consumeVerificationToken(token: string): Promise<
  | { success: true; email: string }
  | { success: false; reason: "not-found" | "expired" }
> {
  const record = await prisma.verificationToken.findUnique({ where: { token } });
  if (!record) return { success: false, reason: "not-found" };

  if (record.expires.getTime() < Date.now()) {
    await prisma.verificationToken.delete({ where: { token } }).catch(() => {});
    return { success: false, reason: "expired" };
  }

  await prisma.$transaction([
    prisma.user.updateMany({
      where: { email: record.identifier, emailVerified: null },
      data: { emailVerified: new Date() },
    }),
    prisma.verificationToken.delete({ where: { token } }),
  ]);

  // Award the verified badge — best-effort, never blocks the user from logging in.
  awardEmailVerifiedBadge(record.identifier).catch((err) => {
    console.error("[verification] badge grant failed:", err);
  });

  return { success: true, email: record.identifier };
}
