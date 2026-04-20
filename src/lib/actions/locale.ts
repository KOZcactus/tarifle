"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isValidLocale, type Locale } from "@/i18n/config";

/**
 * Update user locale. Writes cookie (NEXT_LOCALE) always; writes User.locale
 * too if logged-in. Anonymous users get just the cookie, enough for
 * next-intl request config to pick up the change on next RSC render.
 *
 * revalidatePath("/", "layout") forces full tree re-render so freshly
 * selected messages propagate to every Navbar / page without manual
 * router.refresh() on the client.
 */
export async function updateLocaleAction(formData: FormData): Promise<void> {
  const rawLocale = formData.get("locale");
  const locale = typeof rawLocale === "string" ? rawLocale : null;
  if (!isValidLocale(locale)) {
    throw new Error("invalid locale");
  }
  await writeLocaleCookie(locale);

  const session = await auth();
  if (session?.user?.id) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale },
    });
  }

  revalidatePath("/", "layout");
}

async function writeLocaleCookie(locale: Locale): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("NEXT_LOCALE", locale, {
    path: "/",
    // 1 yıl. Anonymous user tercihini uzun süre hatırlasın diye; kullanıcı
    // ayarlardan veya başka cihazdan override eder.
    maxAge: 60 * 60 * 24 * 365,
    httpOnly: false,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
