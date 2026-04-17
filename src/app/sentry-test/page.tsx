/**
 * Sentry smoke test — admin-only sayfa. SDK'nın prod'da doğru event
 * gönderdiğini doğrulamak için.
 *
 * Tıklayınca 3 tip error test edilir:
 *   1) Client-side throw — tarayıcıda yakalanır (sentry.client.config)
 *   2) Server action throw — sunucuda yakalanır (sentry.server.config)
 *   3) Server RSC throw — render path'te yakalanır
 *
 * Sentry Issues sekmesinde 3 ayrı event görünmeli (dakikalar içinde).
 * Doğrulama tamamlanınca bu sayfa silinebilir; şu an bilerek bırakılıyor
 * çünkü gelecekteki Sentry health check'i için hızlı kanal.
 */

import { SentryTestClient } from "./SentryTestClient";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { triggerServerActionError } from "./actions";

export const metadata = {
  title: "Sentry Test | Tarifle Admin",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function SentryTestPage({
  searchParams,
}: {
  searchParams: Promise<{ throw?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || (user.role !== "ADMIN" && user.role !== "MODERATOR")) {
    redirect("/");
  }

  // RSC-level throw test: ?throw=rsc ile tetikle
  const sp = await searchParams;
  if (sp.throw === "rsc") {
    throw new Error("Sentry RSC test error — bu render sırasında atıldı");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">🧪 Sentry Test</h1>
        <p className="mt-2 text-sm text-text-muted">
          3 farklı error tipi — her biri Sentry'de ayrı issue açmalı.
          Butona bas, sonra Sentry dashboard'unda (sol menü → Issues)
          yeni event'leri gör.
        </p>
      </div>

      <div className="space-y-3">
        <section className="rounded-xl border border-border bg-bg-card p-4">
          <h2 className="font-semibold">1. Client-side throw</h2>
          <p className="mt-1 text-xs text-text-muted">
            Tarayıcı JS'i, sentry.client.config.ts yakalar.
          </p>
          <SentryTestClient />
        </section>

        <section className="rounded-xl border border-border bg-bg-card p-4">
          <h2 className="font-semibold">2. Server action throw</h2>
          <p className="mt-1 text-xs text-text-muted">
            Tarayıcıdan submit edilen form → server action atar.
            sentry.server.config.ts yakalar.
          </p>
          <form action={triggerServerActionError}>
            <button
              type="submit"
              className="mt-2 rounded-lg bg-error/15 px-3 py-2 text-sm font-medium text-error hover:bg-error/25"
            >
              Server action hata fırlat
            </button>
          </form>
        </section>

        <section className="rounded-xl border border-border bg-bg-card p-4">
          <h2 className="font-semibold">3. RSC render throw</h2>
          <p className="mt-1 text-xs text-text-muted">
            URL'e `?throw=rsc` ekleyerek sayfa render'ı sırasında throw.
          </p>
          <a
            href="/sentry-test?throw=rsc"
            className="mt-2 inline-block rounded-lg bg-error/15 px-3 py-2 text-sm font-medium text-error hover:bg-error/25"
          >
            RSC throw → /sentry-test?throw=rsc
          </a>
        </section>
      </div>

      <div className="rounded-xl border border-dashed border-border bg-bg-card/50 p-4 text-xs text-text-muted">
        <p className="font-semibold text-text">Beklenen sonuç</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>Sentry → Issues → 3 yeni event (1-2 dakika içinde)</li>
          <li>Email: yeni issue bildirimi koz.devs@gmail.com&apos;a</li>
          <li>Her event'te stack trace + source map → exact line</li>
        </ul>
        <p className="mt-2">
          Bu sayfa yalnızca ADMIN/MODERATOR görebilir. Sentry kurulumu
          tam çalıştığını doğruladıktan sonra silinebilir.
        </p>
      </div>
    </div>
  );
}
