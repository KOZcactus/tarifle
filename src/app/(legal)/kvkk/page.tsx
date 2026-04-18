import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.legal");
  return { title: t("kvkkTitle"), description: t("kvkkDescription") };
}

export default function KVKKPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold">KVKK Aydınlatma Metni</h1>
      <p className="mt-2 text-sm text-text-muted">Son güncelleme: 13 Nisan 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">1. Veri Sorumlusu</h2>
          <p>
            {SITE_NAME} platformu, 6698 sayılı Kişisel Verilerin Korunması Kanunu
            (&quot;KVKK&quot;) kapsamında veri sorumlusu sıfatıyla hareket etmektedir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">2. Toplanan Kişisel Veriler</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Ad, soyad, kullanıcı adı</li>
            <li>E-posta adresi</li>
            <li>Profil fotoğrafı (isteğe bağlı)</li>
            <li>IP adresi ve tarayıcı bilgileri</li>
            <li>Platform kullanım verileri</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">3. Verilerin İşlenme Amacı</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Üyelik işlemlerinin yürütülmesi</li>
            <li>Platform hizmetlerinin sunulması</li>
            <li>İçerik moderasyonu ve güvenlik</li>
            <li>İstatistiksel analizler</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">4. Haklarınız</h2>
          <p>
            KVKK&apos;nın 11. maddesi kapsamında kişisel verilerinizle ilgili bilgi talep etme,
            düzeltme, silme ve itiraz etme haklarına sahipsiniz.
          </p>
        </section>

        <p className="border-t border-border pt-4 text-xs">
          Bu metin bilgilendirme amaçlıdır. Detaylı hukuki danışmanlık için bir avukata
          başvurmanızı öneririz.
        </p>
      </div>
    </div>
  );
}
