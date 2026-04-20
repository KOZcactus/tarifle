import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/constants";

/**
 * Double-opt-in confirmation endpoint. Token URL query'den gelir,
 * 24h TTL kontrolü, geçerliyse CONFIRMING → ACTIVE geçiş.
 *
 * UX: başarılı/başarısız durum için `/newsletter/confirmed` veya
 * `/newsletter/expired` sayfasına redirect. Query param yerine ayrı
 * sayfa URL'leri çünkü kullanıcıya mail linki üzerinden geliyor,
 * temiz URL isteriz.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  if (!token) {
    return NextResponse.redirect(`${SITE_URL}/newsletter/expired`, 302);
  }

  const sub = await prisma.newsletterSubscription.findUnique({
    where: { confirmToken: token },
    select: { id: true, status: true, confirmTokenAt: true },
  });

  if (!sub) {
    return NextResponse.redirect(`${SITE_URL}/newsletter/expired`, 302);
  }

  // 24h window
  const issued = sub.confirmTokenAt;
  const isExpired = issued
    ? Date.now() - issued.getTime() > 24 * 60 * 60 * 1000
    : true;

  if (isExpired) {
    return NextResponse.redirect(`${SITE_URL}/newsletter/expired`, 302);
  }

  if (sub.status === "ACTIVE") {
    // Zaten onaylı, anlamlı confirm mesajı göster.
    return NextResponse.redirect(`${SITE_URL}/newsletter/confirmed`, 302);
  }

  await prisma.newsletterSubscription.update({
    where: { id: sub.id },
    data: {
      status: "ACTIVE",
      confirmedAt: new Date(),
      confirmToken: null, // tek kullanımlık
      confirmTokenAt: null,
    },
  });

  return NextResponse.redirect(`${SITE_URL}/newsletter/confirmed`, 302);
}
