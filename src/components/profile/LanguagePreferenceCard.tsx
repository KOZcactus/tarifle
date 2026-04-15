/**
 * Language preference card — placeholder UI until Faz 3 wires the full
 * i18n stack (next-intl + recipe.translations JSONB + messages/*.json).
 *
 * Why a card (not a form action): we can't actually switch languages yet
 * because (a) tarif içeriği henüz EN/DE'de yok (Codex batch'i opsiyonel
 * translations alanıyla geldikten sonra dolacak), (b) UI string catalog
 * yok. Göstererek "coming soon" sinyali veriyoruz; Faz 3'te select real
 * bir Server Action'a bağlanır ve User.locale persist edilir.
 *
 * Design parity: aynı surface/radius/padding diğer settings kartlarıyla.
 * Select disabled + "Yakında" rozeti + kısa açıklama.
 */
export function LanguagePreferenceCard() {
  return (
    <section className="rounded-xl border border-border bg-bg-card p-5">
      <header className="mb-3 flex items-center gap-2">
        <h2 className="font-heading text-base font-semibold text-text">
          Dil tercihi
        </h2>
        <span className="rounded-full border border-secondary/30 bg-secondary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-secondary">
          Yakında
        </span>
      </header>

      <p className="mb-3 text-sm text-text-muted">
        Arayüzün ve tariflerin görüneceği dil. Şu an sadece Türkçe aktif;
        İngilizce ve Almanca yakında devreye giriyor.
      </p>

      <label className="block">
        <span className="sr-only">Dil seçimi</span>
        <select
          disabled
          defaultValue="tr"
          aria-disabled="true"
          className="w-full cursor-not-allowed rounded-lg border border-border bg-bg px-3 py-2 text-sm text-text-muted disabled:opacity-70"
        >
          <option value="tr">🇹🇷 Türkçe</option>
          <option value="en">🇬🇧 English (yakında)</option>
          <option value="de">🇩🇪 Deutsch (yakında)</option>
        </select>
      </label>
    </section>
  );
}
