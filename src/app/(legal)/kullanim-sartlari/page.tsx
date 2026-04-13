import type { Metadata } from "next";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Kullanım Şartları",
  description: "Tarifle platformunun kullanım şartları.",
};

export default function KullanimSartlariPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold">Kullanım Şartları</h1>
      <p className="mt-2 text-sm text-text-muted">Son güncelleme: 13 Nisan 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">1. Genel</h2>
          <p>
            {SITE_NAME} platformunu kullanarak bu şartları kabul etmiş sayılırsınız.
            Platform üzerinden paylaşılan içeriklerden kullanıcılar sorumludur.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">2. İçerik Kuralları</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Argo, küfür ve hakaret içeren içerikler yasaktır.</li>
            <li>Yanıltıcı veya zararlı tarif paylaşımı yasaktır.</li>
            <li>Telif hakkı ihlali yapan içerikler kaldırılır.</li>
            <li>Spam ve reklam amaçlı içerikler yasaktır.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">3. Hesap Sorumluluğu</h2>
          <p>
            Hesabınızın güvenliğinden siz sorumlusunuz. Şifrenizi kimseyle paylaşmayın.
            Hesabınız üzerinden yapılan tüm işlemlerden siz sorumlusunuz.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">4. Alkollü İçerik</h2>
          <p>
            Platform alkollü içecek tarifleri içerebilir. Bu tariflere erişim yaş doğrulaması
            ile korunur. Alkollü içeceklerin sorumlu tüketilmesi kullanıcının sorumluluğundadır.
          </p>
        </section>

        <p className="border-t border-border pt-4 text-xs">
          Bu şartlar değiştirilebilir. Güncellemeler bu sayfada yayınlanır.
        </p>
      </div>
    </div>
  );
}
