import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.legal");
  return { title: t("privacyTitle"), description: t("privacyDescription") };
}

export default function GizlilikPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold">Gizlilik Politikası</h1>
      <p className="mt-2 text-sm text-text-muted">Son güncelleme: 13 Nisan 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">1. Çerez Kullanımı</h2>
          <p>
            {SITE_NAME}, oturum yönetimi ve tema tercihi gibi temel işlevler için çerezler
            kullanır. Analitik çerezleri yalnızca onayınızla kullanılır.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">2. Veri Güvenliği</h2>
          <p>
            Kişisel verileriniz şifreli bağlantı (HTTPS) üzerinden iletilir. Şifreler
            hash&apos;lenerek saklanır ve düz metin olarak hiçbir zaman tutulmaz.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">3. Üçüncü Taraf Hizmetler</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Google OAuth — kimlik doğrulama</li>
            <li>Cloudinary — görsel depolama</li>
            <li>Vercel — hosting</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">4. Veri Silme</h2>
          <p>
            Hesabınızı silmek istediğinizde tüm kişisel verileriniz 30 gün içinde kalıcı
            olarak silinir. Anonim istatistiksel veriler korunabilir.
          </p>
        </section>

        <p className="border-t border-border pt-4 text-xs">
          Sorularınız için iletişim sayfamızdan bize ulaşabilirsiniz.
        </p>
      </div>
    </div>
  );
}
