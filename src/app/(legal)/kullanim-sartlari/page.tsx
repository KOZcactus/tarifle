import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SITE_NAME } from "@/lib/constants";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("metadata.legal");
  return { title: t("termsTitle"), description: t("termsDescription") };
}

export default function KullanimSartlariPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="font-heading text-3xl font-bold">Kullanım Şartları</h1>
      <p className="mt-2 text-sm text-text-muted">Son güncelleme: 18 Nisan 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-text-muted">
        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">1. Kabul</h2>
          <p>
            {SITE_NAME} platformuna (&ldquo;Platform&rdquo;) erişerek veya
            kullanarak bu kullanım şartlarını kabul etmiş sayılırsınız. Şartları
            kabul etmiyorsanız platformu kullanmamanız gerekir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">2. Hesap Sorumluluğu</h2>
          <ul className="ml-4 list-disc space-y-1">
            <li>Hesap bilgilerinizin gizliliğinden siz sorumlusunuz.</li>
            <li>Şifrenizi kimseyle paylaşmayın.</li>
            <li>
              Hesabınız üzerinden yapılan tüm işlemlerden, üçüncü bir kişi
              tarafından yapılsa dahi sorumluluk size aittir.
            </li>
            <li>
              Hesabınızın yetkisiz kullanıldığını fark ederseniz derhal{" "}
              <Link
                href="/iletisim"
                className="text-primary underline-offset-4 hover:underline"
              >
                bize bildirin
              </Link>
              .
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            3. Kullanıcı İçeriği (UGC)
          </h2>
          <p>
            Platforma yüklediğiniz tarif uyarlamaları, yorumlar, koleksiyonlar ve
            görseller &ldquo;Kullanıcı İçeriği&rdquo; olarak tanımlanır. Kullanıcı
            İçeriği ile ilgili aşağıdaki şartları kabul edersiniz.
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-text">3.1 Telif ve Lisans</h3>
          <p>
            Paylaştığınız içeriğin telifi size aittir. Ancak içeriği Platformda
            yayınlayarak {SITE_NAME}&rsquo;ye; içeriği Platform üzerinde
            görüntülemek, kopyalamak (yedekleme/CDN), göstermek, çevirmek (TR/EN/DE
            otomatik çevirisi dahil) ve tanıtım amaçlı kullanmak için dünya çapında,
            telifsiz, münhasır olmayan, alt-lisanslanabilir bir lisans verirsiniz.
            Lisans içeriği sildiğinizde sona erer; ancak yedekleme ve istatistiksel
            anonim veriler için makul bir süre saklanabilir.
          </p>

          <h3 className="mb-1 mt-4 font-semibold text-text">3.2 İçerik Kuralları</h3>
          <ul className="ml-4 list-disc space-y-1">
            <li>Argo, küfür, hakaret, nefret söylemi ve ayrımcı ifadeler yasaktır.</li>
            <li>Spam, reklam ve pazarlama amaçlı içerik yasaktır.</li>
            <li>Başkasının telif hakkını ihlal eden içerik yasaktır.</li>
            <li>
              Yanıltıcı tarif (kasıtlı yanlış ölçü, zararlı teknik) ve sağlık
              iddiası içeren &ldquo;şifa&rdquo; tarzı beyanlar yasaktır.
            </li>
            <li>Tekrar karakter, yalnız büyük harf veya URL içeren yorumlar moderasyona düşer.</li>
          </ul>

          <h3 className="mb-1 mt-4 font-semibold text-text">3.3 Moderasyon</h3>
          <p>
            Yorum ve uyarlama içerikleri iki katmanlı moderasyondan geçer:
            otomatik önfiltre (argo/tekrar/URL/spam) ve manuel yönetici
            kuyruğu. Yayınlanan içerik şikayet üzerine veya proaktif olarak her
            zaman incelenebilir; kurallara uymayan içerik kaldırılır. Ciddi veya
            tekrarlayan ihlaller hesap askıya alma veya silme ile sonuçlanabilir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            4. Sağlık, Beslenme ve Alerjen Bilgileri
          </h2>
          <p>
            Platform üzerindeki besin değerleri{" "}
            <strong className="text-text">yaklaşık değerlerdir</strong>; USDA ve
            TÜBİTAK besin tabloları ile malzeme miktarlarından türetilir.
            Gerçek değer pişirme yöntemi, malzeme markası ve porsiyon boyutuna
            göre ±%15 kadar sapabilir. Diyet, diyabet, kalp-damar takibi gibi
            sağlık koşulları için bir diyetisyen veya hekime danışın.
          </p>
          <p className="mt-3">
            Alerjen bilgileri tarifteki malzeme listesinden otomatik türetilir
            (gluten, süt, yumurta, yer fıstığı, kuruyemiş, soya, deniz ürünleri,
            susam, kereviz, hardal — AB-10 alerjen seti). Çapraz bulaşma (aynı
            mutfakta başka ürünle temas) takip edilemez. Ciddi alerjiniz varsa
            malzeme listesini her zaman doğrulayın.
          </p>
          <p className="mt-3">
            Platform tıbbi tavsiye niteliği taşımaz; tariflerden kaynaklanan
            sağlık sorunlarından kullanıcı sorumludur.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">5. Alkollü İçerik</h2>
          <p>
            Platform alkollü içecek (kokteyl) tarifleri içerir. Bu içeriklere
            erişim 18 yaş doğrulaması ile korunur. Alkollü içeceklerin sorumlu
            tüketimi ve yerel mevzuata uyum tamamen kullanıcının
            sorumluluğundadır. 18 yaşın altındaki kullanıcıların bu içeriklere
            erişmesi yasaktır.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            6. Platform Sorumluluğunun Sınırı
          </h2>
          <p>
            Platform &ldquo;olduğu gibi&rdquo; sunulur. Hizmetin kesintisizliği,
            hatasızlığı veya belirli bir amaca uygunluğu garanti edilmez.{" "}
            {SITE_NAME} aşağıdakilerden sorumlu tutulamaz:
          </p>
          <ul className="mt-3 ml-4 list-disc space-y-1">
            <li>
              Kullanıcı tarafından yüklenen uyarlama/yorum içeriğinden doğan
              zararlar
            </li>
            <li>Tariflerin yanlış uygulanmasından kaynaklanan maddi veya sağlık sorunları</li>
            <li>Üçüncü taraf hizmet sağlayıcıların geçici kesintileri</li>
            <li>
              Kullanıcı hesabının kendi ihmalinden dolayı yetkisiz erişime
              uğraması
            </li>
          </ul>
          <p className="mt-3">
            Sorumluluk, kanunen izin verilen azami ölçüde sınırlıdır. Tüketicinin
            Korunması Hakkında Kanun ve Türk Borçlar Kanunu&rsquo;nun emredici
            hükümleri saklıdır.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">7. Hesap Fesih</h2>
          <p>
            Hesabınızı istediğiniz zaman{" "}
            <Link
              href="/ayarlar"
              className="text-primary underline-offset-4 hover:underline"
            >
              Ayarlar
            </Link>
            &rsquo;dan silebilirsiniz. Silme akışı{" "}
            <Link
              href="/gizlilik"
              className="text-primary underline-offset-4 hover:underline"
            >
              Gizlilik Politikası
            </Link>
            nda açıklanmıştır. Platform, kullanım şartları ihlalinde hesabınızı
            askıya alma veya kalıcı olarak kapatma hakkını saklı tutar. Ciddi
            ihlallerde (sağlık zararı, hukuka aykırı içerik) içerik önceden
            uyarı yapılmaksızın kaldırılabilir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">
            8. Uygulanacak Hukuk ve Yetki
          </h2>
          <p>
            Bu şartlar Türkiye Cumhuriyeti mevzuatına tabidir. Uyuşmazlıklarda
            İstanbul Mahkemeleri ve İcra Daireleri yetkilidir. Tüketici sıfatı
            taşıyan kullanıcılar için Tüketici Hakem Heyeti ve Tüketici
            Mahkemelerinin yetkisi saklıdır.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-lg font-semibold text-text">9. Değişiklikler</h2>
          <p>
            Kullanım şartları güncellenebilir. Güncel sürüm bu sayfada yayınlanır
            ve &ldquo;Son güncelleme&rdquo; tarihi ile işaretlenir. Esaslı
            değişikliklerde kayıtlı e-posta adresinize bildirim gönderilir.
            Güncellemenin ardından Platform&rsquo;u kullanmaya devam etmeniz
            yeni şartları kabul anlamına gelir.
          </p>
        </section>

        <p className="border-t border-border pt-4 text-xs">
          Sorularınız için{" "}
          <Link
            href="/iletisim"
            className="text-primary underline-offset-4 hover:underline"
          >
            İletişim sayfamızdan
          </Link>{" "}
          bize ulaşabilirsiniz.
        </p>
      </div>
    </div>
  );
}
