import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { BroadcastForm } from "@/components/admin/BroadcastForm";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("admin.pageTitles");
  return { title: t("notification"), robots: { index: false, follow: false } };
}

export const dynamic = "force-dynamic";

export default async function BroadcastPage() {
  const t = await getTranslations("admin.broadcast");
  return (
    <div>
      <h2 className="mb-4 font-heading text-xl font-bold">{t("pageHeading")}</h2>
      <p className="mb-4 text-sm text-text-muted">{t("pageDescription")}</p>
      <BroadcastForm />

      <div className="mt-6 rounded-xl border border-dashed border-border bg-bg-card/50 p-4 text-xs text-text-muted">
        <p className="font-semibold text-text">{t("tipsHeading")}</p>
        <ul className="mt-2 list-inside list-disc space-y-1">
          <li>{t("tip1")}</li>
          <li>{t("tip2")}</li>
          <li>{t("tip3")}</li>
        </ul>
      </div>
    </div>
  );
}
