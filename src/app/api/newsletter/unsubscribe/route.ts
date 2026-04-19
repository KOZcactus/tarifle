import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";

/**
 * Unsubscribe endpoint — token bazlı, tek tık çıkış. Token mail'in
 * altına gömülü; GDPR gereği kolay ve hızlı olmalı (doğrulama
 * sormadan direkt çıkış).
 *
 * Already-UNSUBSCRIBED no-op — aynı sayfayı gösterir.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(
      `${SITE_URL}/newsletter/unsubscribed`,
      302,
    );
  }

  const sub = await prisma.newsletterSubscription.findUnique({
    where: { unsubscribeToken: token },
    select: { id: true, status: true },
  });

  if (!sub) {
    return NextResponse.redirect(
      `${SITE_URL}/newsletter/unsubscribed`,
      302,
    );
  }

  if (sub.status !== "UNSUBSCRIBED") {
    await prisma.newsletterSubscription.update({
      where: { id: sub.id },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
        // confirmToken boşaltılmış olabilir, zaten geçersiz.
      },
    });
  }

  return NextResponse.redirect(
    `${SITE_URL}/newsletter/unsubscribed`,
    302,
  );
}
