import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { getShoppingListWithItems } from "@/lib/queries/shopping-list";
import { ShoppingListClient } from "@/components/shopping-list/ShoppingListClient";

export const metadata: Metadata = {
  title: "Alışveriş Listem",
  description: "Tariflerden ekleyip tek yerden takip et.",
};

export default async function AlisverisListesiPage() {
  const [session, t] = await Promise.all([
    auth(),
    getTranslations("shoppingList"),
  ]);
  if (!session?.user?.id) {
    redirect("/giris?callbackUrl=/alisveris-listesi");
  }

  const list = await getShoppingListWithItems(session.user.id);

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8">
        <p className="text-xs font-medium uppercase tracking-wide text-accent-blue">
          {t("headerLabel")}
        </p>
        <h1 className="mt-1 font-heading text-3xl font-bold text-text sm:text-4xl">
          {list?.name ?? t("defaultName")}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          {t.rich("headerSubtitle", {
            strong: (chunks) => <span className="font-medium">{chunks}</span>,
          })}
          {list?.items.length === 0 && (
            <>
              {" "}
              <Link
                href="/tarifler"
                className="text-primary hover:text-primary-hover"
              >
                {t("browseRecipesLink")}
              </Link>
            </>
          )}
        </p>
      </header>

      <ShoppingListClient
        initialItems={(list?.items ?? []).map((i) => ({
          id: i.id,
          name: i.name,
          amount: i.amount,
          unit: i.unit,
          isChecked: i.isChecked,
        }))}
      />
    </main>
  );
}
