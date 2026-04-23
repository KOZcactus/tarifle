import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
    // Sentry Replay (oturum 13 aktivasyon): hata aninda kullanici session
    // replay'i kaydet. Onceki konfigurasyonda sample rate set edilmis ama
    // integration eklenmemis idi (Sentry v8+ artik manuel integration
    // gerektiriyor). Free tier 50 replay/ay; replaysOnErrorSampleRate 0.5
    // = hata olan session'larin yarisi replay, quota korunur.
    //
    // PII koruma (KVKK + email + sifre alanlari):
    //   - maskAllText: true   → tum text gizli (** ile)
    //   - maskAllInputs: true → input field'lari da gizli
    //   - blockAllMedia: true → resim/video kaydedilmez (storage tasarruf)
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        maskAllInputs: true,
        blockAllMedia: true,
      }),
    ],
    replaysOnErrorSampleRate: 0.5,
    replaysSessionSampleRate: 0,
    // Session 11 noise vs signal tune. Sentry Issues dashboard'da
    // Tarifle prod'unda %70+ event "noise" kategorisinde (tarayıcı
    // eklentisi hataları, user-cancelled fetch, Safari quirks). Bu
    // pattern'ler action-taken gerektirmiyor; deadline shipping için
    // filter eklenerek Sentry mail alarmlarının sinyali artırıldı.
    ignoreErrors: [
      // Next.js internals (navigation, not-found sayfa, redirect)
      "Non-Error promise rejection captured",
      /NEXT_REDIRECT/,
      /NEXT_NOT_FOUND/,
      // Benign layout/paint observer warnings (rare, user impact yok)
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      // Browser extension injection noise (ad-blocker, password manager,
      // AI sidebars vs), sayfa kodu ile ilgisi yok
      /top\.GLOBALS/,
      "window.webkit",
      "chrome-extension://",
      "moz-extension://",
      "safari-extension://",
      // User-initiated cancellation (route change, window close, back
      // button fetch abort). Tarayıcı expected behavior.
      "AbortError",
      "The operation was aborted",
      "cancelled",
      "Request aborted",
      // Network transient (user wifi drop, captive portal). Monitor
      // dashboardda trend izlenir; per-event alarma gerek yok.
      "Failed to fetch",
      "NetworkError when attempting to fetch resource",
      "Load failed",
      "TypeError: Load failed",
      // Safari autofill + navigation quirks
      "SecurityError: The operation is insecure",
      // Legacy / "Script error." CORS-blocked external JS (no source
      // map, no actionable stack)
      "Script error.",
      // Sentry's own load failures (already-failed event reporting,
      // nothing to do inside Sentry itself)
      "Cannot load Sentry",
    ],
    // Block events originating from browser extension scripts; these
    // execute in page context but their errors never come from our code.
    denyUrls: [
      /chrome-extension:\/\//i,
      /moz-extension:\/\//i,
      /safari-extension:\/\//i,
      /safari-web-extension:\/\//i,
    ],
    release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA,
    environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? "development",
    // Oturum 16: PWA install analytics Vercel Analytics'e tasindi,
    // Sentry captureMessage cagrilari kaldirildi. Bu beforeSend defansif
    // filter eski release'lerden gelen PWA info event'leri Sentry'ye
    // dusurmesin diye (kullanici uzun sure eski cache'i tasir, browser
    // service worker vs). Sadece pwa.* prefix'li info-level message'lar
    // iptal; error/warning hala kacar.
    beforeSend(event) {
      if (event.level === "info" && typeof event.message === "string") {
        if (event.message.startsWith("pwa.")) {
          return null;
        }
      }
      return event;
    },
  });
}

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
