import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";
import { getEmailProvider } from "./client";

const TOKEN_TTL_HOURS = 1;
const TOKEN_BYTES = 32;

function generateToken(): string {
  return randomBytes(TOKEN_BYTES).toString("base64url");
}

/**
 * Issues a fresh password-reset token for the given email and sends the reset
 * mail. Old unexpired tokens for this address are wiped first so only the
 * latest link works — protects users who click "send again" multiple times
 * from accidentally reactivating an older link if the new one gets leaked.
 *
 * NOTE: Callers should only invoke this for users who actually have a
 * passwordHash. OAuth-only accounts get a different informational mail via
 * `sendOAuthOnlyPasswordResetEmail`.
 */
export async function sendPasswordResetEmail(
  email: string,
  recipientName?: string | null,
): Promise<{ success: boolean; error?: string }> {
  const token = generateToken();
  const expires = new Date(Date.now() + TOKEN_TTL_HOURS * 60 * 60 * 1000);

  await prisma.passwordResetToken.deleteMany({ where: { identifier: email } });
  await prisma.passwordResetToken.create({
    data: { identifier: email, token, expires },
  });

  const resetUrl = `${SITE_URL}/sifre-sifirla/${encodeURIComponent(token)}`;
  const greeting = recipientName ? `Merhaba ${recipientName},` : "Merhaba,";

  const text = [
    greeting,
    "",
    "Tarifle hesabının şifresini sıfırlamak için aşağıdaki bağlantıya tıkla:",
    "",
    resetUrl,
    "",
    `Bağlantı ${TOKEN_TTL_HOURS} saat geçerli.`,
    "Bu maili sen istemediysen görmezden gel — şifren değişmez.",
    "",
    "— Tarifle",
  ].join("\n");

  const html = `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Tarifle şifre sıfırlama</title>
</head>
<body style="margin:0;padding:0;background:#f8f6f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f2;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ddd8cf;">
        <tr><td style="padding:32px 32px 24px;">
          <p style="margin:0 0 4px;font-size:14px;color:#6b6b6b;letter-spacing:1px;text-transform:uppercase;">Tarifle</p>
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.2;color:#1a1a1a;">Şifreni sıfırla</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#1a1a1a;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#1a1a1a;">Tarifle hesabının şifresini sıfırlamak için aşağıdaki butona tıkla. Bu bağlantı <strong>${TOKEN_TTL_HOURS} saat</strong> geçerli.</p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${resetUrl}" style="display:inline-block;background:#e85d2c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">Şifremi sıfırla</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b6b6b;line-height:1.55;">Buton çalışmazsa şu bağlantıyı tarayıcına yapıştır:</p>
          <p style="margin:0 0 24px;font-size:12px;color:#6b6b6b;word-break:break-all;line-height:1.4;"><a href="${resetUrl}" style="color:#e85d2c;text-decoration:underline;">${resetUrl}</a></p>
          <hr style="border:none;border-top:1px solid #ddd8cf;margin:24px 0;">
          <p style="margin:0;font-size:12px;color:#6b6b6b;line-height:1.55;">Bu maili sen istemediysen görmezden gel — şifren değişmez. Şüpheli bir durum varsa tarifle.app/ayarlar adresinden hesabını kontrol edebilirsin.</p>
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
    subject: "Tarifle şifre sıfırlama",
    text,
    html,
  });
}

/**
 * Informational mail for OAuth-only accounts. The user asked for a password
 * reset but their account has no passwordHash — tell them to log in with
 * Google. Sending this (instead of silently dropping) stops email enumeration
 * via "did I get a reset mail or not?" side-channel. The UI shows the same
 * success message either way.
 */
export async function sendOAuthOnlyPasswordResetEmail(
  email: string,
  recipientName?: string | null,
): Promise<{ success: boolean; error?: string }> {
  const greeting = recipientName ? `Merhaba ${recipientName},` : "Merhaba,";
  const loginUrl = `${SITE_URL}/giris`;

  const text = [
    greeting,
    "",
    `Tarifle'da ${email} adresi için şifre sıfırlama isteği aldık.`,
    "Bu hesap Google ile bağlı ve şifre ile giriş tanımlı değil. ",
    "Giriş yapmak için Google ile giriş butonunu kullan:",
    "",
    loginUrl,
    "",
    "Şifre ile giriş eklemek istersen, Google ile giriş yaptıktan sonra",
    "ayarlar sayfasından 'Şifre ekle' akışını kullanabilirsin.",
    "",
    "Bu maili sen istemediysen görmezden gel — hesabın değişmez.",
    "",
    "— Tarifle",
  ].join("\n");

  const html = `
<!doctype html>
<html lang="tr">
<head>
  <meta charset="utf-8">
  <title>Tarifle — Google hesabı</title>
</head>
<body style="margin:0;padding:0;background:#f8f6f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#1a1a1a;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f8f6f2;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #ddd8cf;">
        <tr><td style="padding:32px 32px 24px;">
          <p style="margin:0 0 4px;font-size:14px;color:#6b6b6b;letter-spacing:1px;text-transform:uppercase;">Tarifle</p>
          <h1 style="margin:0 0 16px;font-size:24px;font-weight:700;line-height:1.2;color:#1a1a1a;">Bu hesap Google ile bağlı</h1>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#1a1a1a;">${greeting}</p>
          <p style="margin:0 0 16px;font-size:15px;line-height:1.55;color:#1a1a1a;">Tarifle'da <strong>${email}</strong> adresi için şifre sıfırlama isteği aldık. Bu hesap Google ile bağlı ve şifre ile giriş tanımlı değil.</p>
          <p style="margin:0 0 24px;text-align:center;">
            <a href="${loginUrl}" style="display:inline-block;background:#e85d2c;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">Google ile giriş yap</a>
          </p>
          <p style="margin:0 0 16px;font-size:13px;color:#6b6b6b;line-height:1.55;">Şifre ile giriş de eklemek istersen, giriş yaptıktan sonra ayarlar sayfasından &ldquo;Şifre ekle&rdquo; seçeneğini kullanabilirsin.</p>
          <hr style="border:none;border-top:1px solid #ddd8cf;margin:24px 0;">
          <p style="margin:0;font-size:12px;color:#6b6b6b;line-height:1.55;">Bu maili sen istemediysen görmezden gel — hesabın değişmez.</p>
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
    subject: "Tarifle — bu hesap Google ile bağlı",
    text,
    html,
  });
}

/**
 * Consumes a password reset token and sets a new password hash in one
 * transaction. Deletes ALL reset tokens for this email on success so that
 * any other leaked links for the same account are invalidated too.
 *
 * `newPasswordHash` must already be bcrypt-hashed by the caller — this
 * function never touches raw passwords.
 */
export async function consumePasswordResetToken(
  token: string,
  newPasswordHash: string,
): Promise<
  | { success: true; email: string }
  | { success: false; reason: "not-found" | "expired" | "user-missing" }
> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return { success: false, reason: "not-found" };

  if (record.expires.getTime() < Date.now()) {
    await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
    return { success: false, reason: "expired" };
  }

  // Confirm the user still exists and has an email-based login path. If the
  // user was deleted between request and consume, fail cleanly instead of
  // silently re-creating a passwordHash on a stale row.
  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
    select: { id: true },
  });
  if (!user) {
    await prisma.passwordResetToken.delete({ where: { token } }).catch(() => {});
    return { success: false, reason: "user-missing" };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    }),
    // Wipe every outstanding reset token for this identifier — if a second
    // link was issued in parallel (or leaked), it's dead now.
    prisma.passwordResetToken.deleteMany({ where: { identifier: record.identifier } }),
  ]);

  return { success: true, email: record.identifier };
}
