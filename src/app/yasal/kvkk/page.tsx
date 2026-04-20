import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/constants";
import { LegalDocMeta } from "@/components/legal/LegalDocMeta";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.legal");
  return {
    title: t("kvkkTitle"),
    description: t("kvkkDescription"),
    alternates: { canonical: "/yasal/kvkk" },
  };
}

export default function KVKKPage() {
  return (
    <article className="max-w-3xl">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold">KVKK Aydınlatma Metni</h1>
        <LegalDocMeta version="1.0" lastUpdate="19 Nisan 2026" />
      </header>

      <div className="space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">1. Veri Sorumlusu</h2>
          <p>
            {SITE_NAME} platformu; 6698 sayılı Kişisel Verilerin Korunması Kanunu
            (&ldquo;KVKK&rdquo;) 3. maddesi uyarınca veri sorumlusu sıfatıyla hareket
            etmektedir.
          </p>
          <ul className="mt-3 ml-4 list-disc space-y-1">
            <li>
              Platform:{" "}
              <a
                href="https://tarifle.app"
                className="text-primary underline-offset-4 hover:underline"
              >
                tarifle.app
              </a>
            </li>
            <li>
              İletişim:{" "}
              <a
                href="mailto:koz.devs@gmail.com"
                className="text-primary underline-offset-4 hover:underline"
              >
                koz.devs@gmail.com
              </a>{" "}
              (KVKK talepleriniz için aynı adrese e-posta konusuyla
              &ldquo;KVKK Veri Talebi&rdquo; olarak başvurabilirsiniz)
            </li>
            <li>
              Detaylı iletişim:{" "}
              <Link
                href="/iletisim"
                className="text-primary underline-offset-4 hover:underline"
              >
                İletişim sayfası
              </Link>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            2. İşlenen Kişisel Veriler ve Toplama Yöntemi
          </h2>
          <p>Platformda hesap oluşturmanız veya hizmetleri kullanmanız halinde:</p>
          <ul className="mt-3 ml-4 list-disc space-y-1">
            <li>
              <strong className="text-text">Kimlik:</strong> isim (opsiyonel,
              Google OAuth üzerinden profilinizde yer alan tam ad) ve kullanıcı
              adı
            </li>
            <li>
              <strong className="text-text">İletişim:</strong> e-posta adresi (kayıt
              + doğrulama)
            </li>
            <li>
              <strong className="text-text">İsteğe bağlı:</strong> profil fotoğrafı,
              biyografi
            </li>
            <li>
              <strong className="text-text">Güvenlik:</strong> IP adresi, tarayıcı ve
              cihaz bilgileri, oturum logları
            </li>
            <li>
              <strong className="text-text">Kullanım:</strong> tarif kaydetme,
              koleksiyon, uyarlama, yorum ve görüntüleme davranışları
            </li>
            <li>
              <strong className="text-text">Teknik hata izleme:</strong> sunucu ve
              tarayıcı hataları (Sentry üzerinden PII dışlayan filtrelerle)
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            3. İşleme Amaçları ve Hukuki Sebepler
          </h2>
          <ul className="ml-4 list-disc space-y-2">
            <li>
              <strong className="text-text">Hizmet sunumu:</strong> üyelik
              işlemleri, kimlik doğrulama, tarif kaydetme ve uyarlama paylaşımı
              (KVKK 5/2-c, sözleşmenin kurulması ve ifası).
            </li>
            <li>
              <strong className="text-text">İçerik moderasyonu ve güvenlik:</strong>{" "}
              spam, argo ve zararlı içerik tespiti (KVKK 5/2-f, meşru menfaat).
            </li>
            <li>
              <strong className="text-text">Yasal yükümlülük:</strong> talep
              halinde yetkili mercilere bilgi sağlanması (KVKK 5/2-ç, hukuki
              yükümlülük).
            </li>
            <li>
              <strong className="text-text">İstatistiksel analiz:</strong> anonim
              kullanım metrikleri (KVKK 28, anonim veri).
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">4. Veri Aktarımı</h2>
          <p>
            Kişisel verileriniz hizmet altyapısı gereği aşağıdaki hizmet
            sağlayıcılarına aktarılabilir. Detaylı liste{" "}
            <Link
              href="/yasal/gizlilik"
              className="text-primary underline-offset-4 hover:underline"
            >
              Gizlilik Politikası
            </Link>
            nda yer alır.
          </p>
          <ul className="mt-3 ml-4 list-disc space-y-1">
            <li>Barındırma ve veri saklama altyapısı</li>
            <li>İsteğe bağlı Google ile giriş</li>
            <li>E-posta gönderimi (doğrulama ve şifre sıfırlama)</li>
            <li>Alan adı ve bot koruma hizmeti</li>
            <li>Hata izleme (kişisel veri filtreli)</li>
            <li>Otomatik kötüye kullanım kontrolü</li>
          </ul>
          <p className="mt-3">
            Bu hizmet sağlayıcılarının bir kısmı yurt dışında veri merkezi
            kullanmaktadır (AB/ABD). Veri transferi, KVKK 9. madde kapsamında
            uygun tedbirlerle gerçekleştirilir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">5. Saklama Süreleri</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <strong className="text-text">Hesap verileri:</strong> hesap aktif
              olduğu sürece.
            </li>
            <li>
              <strong className="text-text">Hesap silme sonrası:</strong>{" "}
              anında ve geri alınamaz şekilde silinir (hesap bilgisi, uyarlama,
              yorum, oturum kayıtları). Anonim istatistiksel veriler korunabilir.
              Yedekleme kopyaları rotasyon döneminde (en fazla 90 gün) temizlenir.
            </li>
            <li>
              <strong className="text-text">Oturum/güvenlik logları:</strong> 90
              gün.
            </li>
            <li>
              <strong className="text-text">Hata izleme verileri:</strong> 90 gün
              (Sentry varsayılan saklama).
            </li>
            <li>
              <strong className="text-text">Yasal yükümlülükler:</strong> mevzuatın
              öngördüğü süreler boyunca.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            6. KVKK 11. Madde Kapsamındaki Haklarınız
          </h2>
          <p>Kişisel verilerinizle ilgili aşağıdaki haklara sahipsiniz:</p>
          <ul className="mt-3 ml-4 list-disc space-y-1">
            <li>Kişisel verilerinizin işlenip işlenmediğini öğrenme</li>
            <li>İşlenmişse bilgi talep etme</li>
            <li>İşleme amacını ve bunlara uygun kullanılıp kullanılmadığını öğrenme</li>
            <li>Yurt içinde/dışında aktarılan üçüncü kişileri bilme</li>
            <li>Eksik/yanlış işlenmiş olması halinde düzeltilmesini isteme</li>
            <li>Silinmesini veya yok edilmesini isteme</li>
            <li>
              Otomatik sistemler aracılığıyla işlenen verilerin aleyhinize bir
              sonuç doğurması halinde itiraz etme
            </li>
            <li>Kanuna aykırı işleme nedeniyle uğradığınız zararın giderilmesini talep etme</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">7. Başvuru Yöntemi</h2>
          <p>
            Haklarınızı kullanmak için{" "}
            <a
              href="mailto:koz.devs@gmail.com?subject=KVKK%20Veri%20Talebi"
              className="text-primary underline-offset-4 hover:underline"
            >
              koz.devs@gmail.com
            </a>{" "}
            adresine e-posta atmanız yeterlidir. Başvurularınızı KVKK 13/2
            uyarınca talebin niteliğine göre en geç{" "}
            <strong className="text-text">30 gün</strong> içinde yanıtlıyoruz.
            Başvurunun Kurul tarafından belirlenen bir ücrete tabi tutulması
            durumunda, ilgili ücret başvuranca karşılanır.
          </p>
        </section>

        <p className="border-t border-border pt-4 text-xs">
          Bu aydınlatma metni 6698 sayılı Kanun ve ilgili ikincil mevzuat
          çerçevesinde hazırlanmıştır. Metinde yapılan değişiklikler bu sayfada
          yayınlanır; önemli değişikliklerde kayıtlı e-posta adresinize
          bildirim gönderilir.
        </p>
      </div>
    </article>
  );
}
