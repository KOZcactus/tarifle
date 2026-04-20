"use server";

import crypto from "node:crypto";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getEmailProvider } from "@/lib/email/client";
import { SITE_URL, SITE_NAME } from "@/lib/constants";

interface ActionResult {
  success: boolean;
  error?: string;
  message?: string;
}

const emailSchema = z
  .string()
  .email({ message: "Geçerli bir e-posta adresi gir." })
  .max(255);

function generateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Kullanıcı sayfada e-posta yazıp "Abone ol" dedi. Double-opt-in:
 * CONFIRMING state + confirm token ile mail gönder.
 *
 * Idempotent: aynı email ikinci kez gönderilirse yeni confirm token
 * üretir, eski token invalid olur (confirmToken unique).
 * ACTIVE durumda tekrar istek gelirse "zaten aboneydin" mesajı.
 * UNSUBSCRIBED ise yeniden CONFIRMING'e çek (kullanıcı geri gelmişse).
 */
export async function subscribeNewsletterAction(
  rawEmail: unknown,
): Promise<ActionResult> {
  try {
    const parsed = emailSchema.safeParse(rawEmail);
    if (!parsed.success) {
      return {
        success: false,
        error: parsed.error.issues[0]?.message ?? "Geçersiz e-posta.",
      };
    }
    const email = parsed.data.toLowerCase().trim();

    const session = await auth();
    const userId = session?.user?.id ?? null;

    const existing = await prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (existing?.status === "ACTIVE") {
      return {
        success: true,
        message: "Bu e-posta zaten aboneliğe kayıtlı. Teşekkürler!",
      };
    }

    // SUSPENDED → reactivation: CONFIRMING'e çek, yeni confirm token.
    // Hard-bounce sebebiyle suspend olmuşsa email tekrar tıklanarak
    // account "canlı" ise zaten yeni confirm döngüsü çalışır.
    const confirmToken = generateToken();
    const unsubscribeToken = existing?.unsubscribeToken ?? generateToken();

    const saved = await prisma.newsletterSubscription.upsert({
      where: { email },
      create: {
        email,
        status: "CONFIRMING",
        confirmToken,
        confirmTokenAt: new Date(),
        unsubscribeToken,
        userId,
      },
      update: {
        status: "CONFIRMING",
        confirmToken,
        confirmTokenAt: new Date(),
        unsubscribedAt: null,
        userId: userId ?? existing?.userId ?? null,
      },
      select: { id: true, email: true, confirmToken: true },
    });

    // Onay maili gönder.
    const confirmUrl = `${SITE_URL}/api/newsletter/confirm?token=${saved.confirmToken}`;
    const unsubUrl = `${SITE_URL}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;

    const provider = getEmailProvider();
    await provider.send({
      to: email,
      subject: `${SITE_NAME}, abonelik onayı`,
      text: [
        `Merhaba,`,
        ``,
        `${SITE_NAME}'den haftalık editör seçkisi almak için aboneliğini doğrula:`,
        confirmUrl,
        ``,
        `Bağlantı 24 saat geçerli. Bu isteği sen yapmadıysan bu e-postayı görmezden gel.`,
        ``,
        `Aboneliği iptal: ${unsubUrl}`,
      ].join("\n"),
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
          <h1 style="font-size: 24px; margin-bottom: 8px;">${SITE_NAME}'e hoş geldin</h1>
          <p style="color: #525252; line-height: 1.6;">
            Haftalık editör seçkisi almak için aboneliğini doğrula, tek tık yeter.
          </p>
          <p style="margin: 24px 0;">
            <a href="${confirmUrl}" style="background: #a03b0f; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
              Aboneliği onayla
            </a>
          </p>
          <p style="font-size: 13px; color: #737373;">
            Bağlantı 24 saat geçerli. Bu isteği sen yapmadıysan bu e-postayı görmezden gel.
          </p>
          <hr style="border: none; border-top: 1px solid #e5e5e5; margin: 32px 0;" />
          <p style="font-size: 11px; color: #a3a3a3;">
            Aboneliği iptal: <a href="${unsubUrl}" style="color: #a03b0f;">tek tık ile listeden çık</a>
          </p>
        </div>`,
    });

    return {
      success: true,
      message: "Onay e-postası gönderildi. Gelen kutunu kontrol et.",
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Beklenmeyen hata.",
    };
  }
}
