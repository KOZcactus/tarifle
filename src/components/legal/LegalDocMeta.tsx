import { getTranslations } from "next-intl/server";

interface LegalDocMetaProps {
  /** Belge sürümü (örn. "1.0", "1.1"). Minor artış = içerik düzeltmesi,
   *  major artış = anlamsal kapsam değişikliği. */
  version: string;
  /** Son güncelleme tarihi, locale-aware render için doğrudan string.
   *  Her sayfa kendi tarihini yazar; merkezi kaynak yerine açıkça
   *  maintain etmek yasal-metin tradition'ına daha uygun. */
  lastUpdate: string;
}

/**
 * Legal sayfa header'ı için ortak meta satırı, sürüm etiketi + son
 * güncelleme tarihi + "belge sürümü" aria-label. Her yasal sayfanın
 * `<header>` bloğunda başlığın altında render edilir. Versiyonlar
 * değişiklik history'si için önemli: kullanıcı metni imzalıyor gibi
 * referans verince sürüm bilinir.
 */
export async function LegalDocMeta({ version, lastUpdate }: LegalDocMetaProps) {
  const t = await getTranslations("legalHub");
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-text-muted">
      <span
        className="inline-flex items-center gap-1 rounded-md border border-border bg-bg-card px-2 py-0.5 font-mono tabular-nums text-text"
        aria-label={t("versionAria")}
      >
        {t("versionPrefix")} {version}
      </span>
      <span aria-hidden="true" className="text-text-muted/50">·</span>
      <span>
        {t("lastUpdatePrefix")} {lastUpdate}
      </span>
    </div>
  );
}
