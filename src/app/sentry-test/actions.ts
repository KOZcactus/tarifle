"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * Server action throw — sunucu tarafında kasıtlı hata.
 * sentry.server.config.ts yakalar. Sadece admin/moderator tetikleyebilir.
 */
export async function triggerServerActionError(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) throw new Error("unauthorized");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    throw new Error("forbidden");
  }

  // Kasıtlı fırlatılan hata — Sentry ingest bunu "Server Action Error"
  // kategorisinde gösterir.
  throw new Error(
    "Sentry server action test error — /sentry-test'ten tetiklendi",
  );
}
