import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.legal");
  return {
    title: t("privacyTitle"),
    description: t("privacyDescription"),
    alternates: { canonical: "/yasal/gizlilik" },
  };
}

export default function GizlilikPage() {
  return (
    <article className="max-w-3xl">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Gizlilik Politikası</h1>
        <p className="mt-2 text-sm text-text-muted">Son güncelleme: 19 Nisan 2026</p>
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            1. Bu Politika Ne Kapsar?
          </h2>
          <p>
            {SITE_NAME} platformu, hangi verileri hangi amaçla topladığını,
            nasıl koruduğunu ve hangi üçüncü taraf hizmetlerini kullandığını bu
            sayfada açıklar. Bu politika, KVKK kapsamındaki tüm işleme
            faaliyetleri için geçerli olup{" "}
            <Link
              href="/yasal/kvkk"
              className="text-primary underline-offset-4 hover:underline"
            >
              KVKK Aydınlatma Metni
            </Link>{" "}
            ile birlikte değerlendirilmelidir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">2. Çerez Kullanımı</h2>
          <p>
            Platform yalnızca işlevsel çerezler kullanır; reklam veya üçüncü
            taraf takip çerezi çalıştırılmaz. Detaylı bilgi için{" "}
            <Link
              href="/yasal/cerez-politikasi"
              className="text-primary underline-offset-4 hover:underline"
            >
              Çerez Politikası
            </Link>{" "}
            sayfasına göz atabilirsiniz.
          </p>
          <ul className="mt-3 ml-4 list-disc space-y-1">
            <li>
              <strong className="text-text">Oturum çerezleri:</strong> Auth.js
              session token&rsquo;ı (giriş yapmış kullanıcıyı tanımak için —
              oturum sona erdiğinde silinir)
            </li>
            <li>
              <strong className="text-text">Tercih çerezleri:</strong> tema
              (açık/koyu mod) ve dil (NEXT_LOCALE) seçiminizi hatırlamak için
            </li>
            <li>
              <strong className="text-text">Güvenlik/CSRF çerezleri:</strong>{" "}
              form gönderimlerinde cross-site istek koruması
            </li>
          </ul>
          <p className="mt-3">
            Çerezleri tarayıcı ayarlarınızdan reddedebilirsiniz; ancak bu
            durumda giriş yapma ve tercih kaydetme gibi işlevler
            kullanılamayabilir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">3. Veri Güvenliği</h2>
          <p className="mb-3">
            Detaylı teknik önlemler için{" "}
            <Link
              href="/yasal/guvenlik"
              className="text-primary underline-offset-4 hover:underline"
            >
              Güvenlik
            </Link>{" "}
            sayfasına bakabilirsiniz.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>Tüm trafik HTTPS (TLS 1.3) üzerinden iletilir.</li>
            <li>
              Şifreler bcrypt algoritmasıyla hash&rsquo;lenir, düz metin olarak
              hiçbir zaman saklanmaz veya kayıt altına alınmaz.
            </li>
            <li>
              OAuth entegrasyonlarında (Google) şifreniz bize iletilmez; yalnızca
              hesap-bağlama kimliği tutulur.
            </li>
            <li>
              Veritabanı erişimi sadece platform sunucularından ve gerekli
              ölçüde yapılır; manuel erişimler kayıt altına alınır.
            </li>
            <li>
              Güvenlik olayları için Sentry üzerinde 24/7 hata/anomali izleme
              aktiftir.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            4. Üçüncü Taraf İşleyiciler
          </h2>
          <p>
            Platform hizmetlerini sağlamak için aşağıdaki altyapı sağlayıcıları
            ile çalışılır. Her biri kendi veri işleme politikasına tabidir.
          </p>
          <div className="mt-3 overflow-hidden rounded-lg border border-border">
            <table className="w-full text-xs">
              <thead className="bg-bg-card text-text">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Sağlayıcı</th>
                  <th className="px-3 py-2 text-left font-semibold">Amaç</th>
                  <th className="px-3 py-2 text-left font-semibold">Konum</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-3 py-2">Vercel</td>
                  <td className="px-3 py-2">Barındırma, CDN</td>
                  <td className="px-3 py-2">ABD/AB</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Neon</td>
                  <td className="px-3 py-2">PostgreSQL veri saklama</td>
                  <td className="px-3 py-2">AB (Londra)</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Cloudflare</td>
                  <td className="px-3 py-2">DNS, DDoS koruma</td>
                  <td className="px-3 py-2">Küresel</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Google OAuth</td>
                  <td className="px-3 py-2">İsteğe bağlı kimlik doğrulama</td>
                  <td className="px-3 py-2">Küresel</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Resend</td>
                  <td className="px-3 py-2">E-posta gönderimi (doğrulama, sıfırlama)</td>
                  <td className="px-3 py-2">AB</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Sentry</td>
                  <td className="px-3 py-2">Hata izleme (PII filtreli)</td>
                  <td className="px-3 py-2">AB</td>
                </tr>
                <tr>
                  <td className="px-3 py-2">Upstash Redis</td>
                  <td className="px-3 py-2">Oran sınırlama (rate limit)</td>
                  <td className="px-3 py-2">Küresel</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            5. Kullanıcı Tarafından Paylaşılan İçerik (UGC)
          </h2>
          <p>
            Paylaştığınız uyarlamalar, yorumlar ve koleksiyonlar diğer
            kullanıcılara açık olabilir. İçerik moderasyonumuz otomatik
            (argo/spam/tekrar karakter filtresi) ve manuel (yönetici kuyruğu)
            olmak üzere iki katmanlıdır. Yönetici onayından geçen herkese açık
            içerikler anonimleştirilmiş olarak istatistiklerde kullanılabilir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            6. Çocukların Gizliliği
          </h2>
          <p>
            Platform 13 yaş altındaki kullanıcılar için tasarlanmamıştır.
            Alkollü tarifler yaş doğrulaması ile ayrıca korunur. 13 yaş altı bir
            çocuğun kişisel verisinin izinsiz toplandığını düşünüyorsanız lütfen
            bize ulaşın.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">7. Veri Silme</h2>
          <p>
            Hesabınızı{" "}
            <Link
              href="/ayarlar"
              className="text-primary underline-offset-4 hover:underline"
            >
              Ayarlar
            </Link>{" "}
            sayfasından silebilirsiniz. Silme işlemi{" "}
            <strong className="text-text">anında ve geri alınamaz şekilde</strong>{" "}
            tamamlanır: hesap bilgileriniz, oturum/log kayıtlarınız, uyarlama
            ve yorumlarınız DB&rsquo;den kalıcı olarak silinir. Yayınladığınız
            herkese açık tarif katkılarınız (nadir durum — topluluk
            uyarlamaları ayrıdır) kimlik bilgisi anonimleştirilerek kalabilir.
            Anonim istatistiksel veriler KVKK 28. madde kapsamında korunabilir.
            Yedekleme sistemlerinde kopya bulunması halinde rotasyon dönemi
            içinde (en fazla 90 gün) yedeklerden de temizlenir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">8. Güncellemeler</h2>
          <p>
            Bu politika zaman içinde güncellenebilir. Esaslı değişikliklerde
            kayıtlı e-posta adresinize bildirim gönderilir. Güncel sürüm her
            zaman bu sayfada yayınlanır.
          </p>
        </section>

        <p className="border-t border-border pt-4 text-xs">
          Gizlilikle ilgili sorularınız için{" "}
          <Link
            href="/iletisim"
            className="text-primary underline-offset-4 hover:underline"
          >
            İletişim sayfamızdan
          </Link>{" "}
          bize ulaşabilir veya{" "}
          <a
            href="mailto:koz.devs@gmail.com"
            className="text-primary underline-offset-4 hover:underline"
          >
            koz.devs@gmail.com
          </a>{" "}
          adresine yazabilirsiniz.
        </p>
      </div>
    </article>
  );
}
