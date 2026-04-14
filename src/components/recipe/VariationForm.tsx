"use client";

import { useState, useTransition } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { createVariation } from "@/lib/actions/variation";

interface VariationFormProps {
  recipeId: string;
  recipeSlug: string;
}

export function VariationForm({ recipeId, recipeSlug }: VariationFormProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!session?.user) {
    return (
      <button
        onClick={() => router.push("/giris")}
        className="rounded-lg border border-dashed border-border px-4 py-2 text-sm text-text-muted transition-colors hover:border-primary hover:text-primary"
      >
        Uyarlama eklemek için giriş yap
      </button>
    );
  }

  if (success) {
    return (
      <div className="rounded-lg bg-accent-green/10 px-4 py-3 text-sm text-accent-green">
        Uyarlamanız eklendi!
      </div>
    );
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-hover"
      >
        + Uyarlama Ekle
      </button>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    formData.set("recipeId", recipeId);
    formData.set("recipeSlug", recipeSlug);

    startTransition(async () => {
      const result = await createVariation(formData);
      if (result.success) {
        setSuccess(true);
        setIsOpen(false);
      } else {
        setError(result.error || "Bir hata oluştu.");
      }
    });
  }

  return (
    <div className="rounded-xl border border-border bg-bg-card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-lg font-semibold text-text">Uyarlama Ekle</h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-sm text-text-muted hover:text-text"
        >
          İptal
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="rounded-lg bg-error/10 px-4 py-3 text-sm text-error">{error}</div>
        )}

        <div>
          <label htmlFor="miniTitle" className="mb-1.5 block text-sm font-medium text-text">
            Başlık *
          </label>
          <input
            id="miniTitle"
            name="miniTitle"
            type="text"
            required
            maxLength={200}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="ör: Fırında versiyonu, Vegan alternatif..."
          />
        </div>

        <div>
          <label htmlFor="description" className="mb-1.5 block text-sm font-medium text-text">
            Açıklama
          </label>
          <input
            id="description"
            name="description"
            type="text"
            maxLength={300}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Kısa bir açıklama (isteğe bağlı)"
          />
          <p className="mt-1 text-xs text-text-muted">Maks. 300 karakter.</p>
        </div>

        <div>
          <label htmlFor="ingredients" className="mb-1.5 block text-sm font-medium text-text">
            Malzemeler * <span className="font-normal text-text-muted">(her satıra bir malzeme)</span>
          </label>
          <textarea
            id="ingredients"
            name="ingredients"
            required
            rows={4}
            maxLength={8000}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={"2 adet patlıcan\n1 su bardağı zeytinyağı\n3 diş sarımsak"}
          />
        </div>

        <div>
          <label htmlFor="steps" className="mb-1.5 block text-sm font-medium text-text">
            Yapılış Adımları * <span className="font-normal text-text-muted">(her satıra bir adım)</span>
          </label>
          <textarea
            id="steps"
            name="steps"
            required
            rows={4}
            maxLength={15000}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder={"Patlıcanları boyuna ikiye kesin\nİç kısmını kaşıkla oyun\nFırında 180°C'de 20 dk pişirin"}
          />
        </div>

        <div>
          <label htmlFor="notes" className="mb-1.5 block text-sm font-medium text-text">
            Notlar
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={2}
            maxLength={500}
            className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="Püf noktası veya ekstra bilgi (isteğe bağlı)"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
        >
          {isPending ? "Ekleniyor..." : "Uyarlamayı Ekle"}
        </button>
      </form>
    </div>
  );
}
