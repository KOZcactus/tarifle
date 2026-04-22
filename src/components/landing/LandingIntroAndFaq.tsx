import type { LandingCopyItem } from "@/lib/seo/landing-copy";

interface LandingIntroAndFaqProps {
  copy: LandingCopyItem;
  faqHeading: string;
}

/**
 * Mod C landing SEO kopyasını render eder: intro paragrafı + FAQ accordion.
 *
 * Intro 180-220 kelime, kategori/mutfak/diyet sayfasının "neden bu sayfayı
 * okuyorum?" sorusuna cevap. FAQ 4 adet, her biri q+a 60-90 kelime
 * (FAQPage JSON-LD ile birlikte rich-results eligibility).
 *
 * Native HTML <details>/<summary> kullanır; JS gerek yok, accessibility
 * built-in (Tab/Enter/Space toggle), reduced-motion uyumlu.
 *
 * FAQPage JSON-LD parent route'ta head'e basılır (helper:
 * `buildFaqPageSchema`), bu component sadece visual.
 */
export function LandingIntroAndFaq({ copy, faqHeading }: LandingIntroAndFaqProps) {
  return (
    <>
      <section className="mb-10 max-w-3xl">
        <p className="text-sm leading-relaxed text-text">{copy.intro}</p>
      </section>

      {copy.faqs.length > 0 && (
        <section className="mb-12 border-t border-border pt-8">
          <h2 className="mb-4 font-heading text-xl font-bold text-text">
            {faqHeading}
          </h2>
          <div className="space-y-2">
            {copy.faqs.map((faq, idx) => (
              <details
                key={idx}
                className="group rounded-lg border border-border bg-bg-card transition-colors hover:border-primary/50"
              >
                <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-text marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
                  <span className="flex items-center justify-between gap-3">
                    <span>{faq.q}</span>
                    <span
                      aria-hidden="true"
                      className="text-text-muted transition-transform group-open:rotate-180"
                    >
                      ▾
                    </span>
                  </span>
                </summary>
                <div className="border-t border-border px-4 py-3 text-sm leading-relaxed text-text-muted">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
