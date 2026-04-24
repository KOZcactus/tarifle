/**
 * Welcome email. Kullanici kayit oldugu anda fire-and-forget gonderilir
 * (sendVerificationEmail'e paralel). Amac: hos geldin + 3 kilit ozellik
 * tanitim (Dolap, AI Asistan, Favoriler/Koleksiyon) + blog referansi.
 *
 * Onboarding paketi: oturum 19 E paketi. Welcome email bu paketin core
 * parcasi. Launch sonrasi in-app guided tour + profil prompt banner
 * opsiyonel polish'ler FUTURE_PLANS'te.
 *
 * Dikkat: verification email kullaniciyi DOGRULAMAYA cagiriyor, welcome
 * email KESFE cagiriyor. Ikisi birbirini tamamlar, tek email'de
 * birlestirmek mesaji karistirirdi.
 *
 * Locale: register sirasinda user.locale set edilir, ama kayittan
 * hemen sonra DB lookup pahali. Caller (registerAction) uygun locale'i
 * prop olarak gecer.
 */
import { getTranslations } from "next-intl/server";
import { SITE_URL } from "@/lib/constants";
import { DEFAULT_LOCALE, type Locale } from "@/i18n/config";
import { getEmailProvider } from "./client";

export async function sendWelcomeEmail(
  email: string,
  recipientName?: string | null,
  locale: Locale = DEFAULT_LOCALE,
): Promise<{ success: boolean; error?: string }> {
  const t = await getTranslations({ locale, namespace: "email.welcome" });

  const greeting = recipientName
    ? t("greetingNamed", { name: recipientName })
    : t("greeting");

  const text = [
    greeting,
    "",
    t("textIntro"),
    "",
    t("textFeature1"),
    t("textFeature2"),
    t("textFeature3"),
    "",
    t("textBlog"),
    "",
    t("textFooter"),
    "",
    t("signature"),
  ].join("\n");

  const ctaUrl = SITE_URL;
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
          <h1 style="margin:0 0 16px;font-size:26px;font-weight:700;line-height:1.2;color:#1a1a1a;">${t("title")}</h1>
          <p style="margin:0 0 12px;font-size:15px;line-height:1.55;color:#1a1a1a;">${greeting}</p>
          <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#1a1a1a;">${t("intro")}</p>

          <div style="background:#f8f6f2;border-radius:12px;padding:20px 20px 12px;margin:0 0 24px;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1a1a1a;">${t("feature1Title")}</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#5a5a5a;">${t("feature1Body")}</p>
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1a1a1a;">${t("feature2Title")}</p>
            <p style="margin:0 0 16px;font-size:14px;line-height:1.55;color:#5a5a5a;">${t("feature2Body")}</p>
            <p style="margin:0 0 4px;font-size:15px;font-weight:600;color:#1a1a1a;">${t("feature3Title")}</p>
            <p style="margin:0 0 8px;font-size:14px;line-height:1.55;color:#5a5a5a;">${t("feature3Body")}</p>
          </div>

          <p style="margin:0 0 24px;font-size:14px;line-height:1.55;color:#5a5a5a;">${t("blogHint")}</p>

          <p style="margin:0 0 28px;text-align:center;">
            <a href="${ctaUrl}" style="display:inline-block;background:#a03b0f;color:#ffffff;text-decoration:none;font-weight:600;padding:12px 28px;border-radius:8px;font-size:15px;">${t("cta")}</a>
          </p>

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
