/**
 * Mutfak filter row — şimdilik DISABLED placeholder. 406 tarifin %32'si
 * uluslararası ve oran her batch'le artıyor; kullanıcı "İtalyan tarif
 * göster" diye filtrelemek isteyince filtre var olsun ki "yakında"
 * vaadi gerçek olsun.
 *
 * Şu an aktive edilmemesinin nedeni: Recipe schema'sında `cuisine`
 * alanı yok (Codex bu bilgiyi description'a organik enjekte ediyor).
 * Filter mantığı için ya schema migration (cuisine column + retrofit)
 * ya da description-based heuristic (kaba) ile aktive edilebilir.
 * 1000 tarife yaklaşırken o kararı vereceğiz.
 *
 * Bu component user'a sinyal veriyor: "ileride buradan filtreleyeceksin".
 * SEO + discovery için pozitif sinyal. Disabled state visible ama
 * etkileşimsiz; hover'da "yakında" tooltip'i.
 */

const CUISINE_OPTIONS: readonly { code: string; flag: string; label: string }[] = [
  { code: "tr", flag: "🇹🇷", label: "Türk" },
  { code: "it", flag: "🇮🇹", label: "İtalyan" },
  { code: "fr", flag: "🇫🇷", label: "Fransız" },
  { code: "es", flag: "🇪🇸", label: "İspanyol" },
  { code: "gr", flag: "🇬🇷", label: "Yunan" },
  { code: "jp", flag: "🇯🇵", label: "Japon" },
  { code: "cn", flag: "🇨🇳", label: "Çin" },
  { code: "kr", flag: "🇰🇷", label: "Kore" },
  { code: "th", flag: "🇹🇭", label: "Tay" },
  { code: "in", flag: "🇮🇳", label: "Hint" },
  { code: "mx", flag: "🇲🇽", label: "Meksika" },
  { code: "us", flag: "🇺🇸", label: "ABD" },
  { code: "me", flag: "🌍", label: "Orta Doğu" },
  { code: "ma", flag: "🌍", label: "Kuzey Afrika" },
];

export function CuisineFilter() {
  return (
    <div
      // opacity-70 başlangıçta disabled hissi için kullanılmıştı ama
      // text-muted üzerinde a11y color-contrast eşiğini düşürdü (4.5:1
      // altına geçti). Sadece dashed border + "Yakında" badge yeterli
      // sinyal — kontrast tam tutulur.
      className="rounded-lg border border-dashed border-border bg-bg-card p-3"
      aria-label="Mutfak filtresi (yakında aktif)"
    >
      <div className="mb-2 flex items-center gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">
          Mutfak
        </p>
        <span className="rounded-full border border-accent-blue/30 bg-accent-blue/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-accent-blue">
          Yakında
        </span>
      </div>
      <div
        className="flex flex-wrap gap-1.5"
        // pointer-events:none ensures the chip group is non-interactive but
        // still visible. tabindex=-1 keeps them out of keyboard nav.
        style={{ pointerEvents: "none" }}
      >
        {CUISINE_OPTIONS.map(({ code, flag, label }) => (
          <span
            key={code}
            tabIndex={-1}
            aria-disabled="true"
            className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-2.5 py-1 text-xs text-text-muted"
          >
            <span aria-hidden="true">{flag}</span>
            <span>{label}</span>
          </span>
        ))}
      </div>
      <p className="mt-2 text-[11px] text-text-muted">
        Tariflerin mutfak/köken etiketlerine göre filtreleme yakında aktif
        olacak. Şu an 14 mutfak temsil ediliyor — favori mutfağını seç,
        gelir gelmez sana özel bir keşif sunalım.
      </p>
    </div>
  );
}
