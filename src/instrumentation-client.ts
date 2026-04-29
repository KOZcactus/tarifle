import * as Sentry from "@sentry/nextjs";

const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Dev environment'ta tracesSampleRate 0 (oturum 25 GPT audit):
    // localhost'ta performance issue spam aliniyor; prod'da 0.1 sample
    // gercek N+1 sinyali korunur, dev'de sifir alarm.
    tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 0,
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
      // Sentry User Feedback widget (oturum 33+, web launch playbook §4).
      // Sayfa sağ alt köşede sabit "Geri bildirim" butonu, kullanıcı
      // tıklayınca modal açılır (isim + email + mesaj alanı). Form submit
      // Sentry'ye user feedback event'i olarak push edilir, prod hatalarını
      // raporlama dışındaki "kullanım sorusu / öneri / şikayet" akışı için.
      // Brand renk #a03b0f, Türkçe metinler. screenshot=true Replay ile
      // birlikte arıza nedeniyle başvuran kullanıcının ekran görüntüsü
      // otomatik eklenir, debug süresi kısalır. PII koruma için Replay
      // mask kuralları zaten aktif (yukarıdaki replayIntegration).
      Sentry.feedbackIntegration({
        colorScheme: "system",
        showBranding: false,
        autoInject: true,
        triggerLabel: "Geri bildirim",
        triggerAriaLabel: "Geri bildirim formu aç",
        formTitle: "Geri bildirim",
        submitButtonLabel: "Gönder",
        cancelButtonLabel: "İptal",
        confirmButtonLabel: "Onayla",
        addScreenshotButtonLabel: "Ekran görüntüsü ekle",
        removeScreenshotButtonLabel: "Ekran görüntüsünü kaldır",
        nameLabel: "İsim",
        namePlaceholder: "Adınız (opsiyonel)",
        emailLabel: "E-posta",
        emailPlaceholder: "ornek@email.com (opsiyonel, yanıt için)",
        messageLabel: "Mesaj",
        messagePlaceholder: "Sorun, öneri veya görüşünüzü yazın",
        successMessageText: "Teşekkürler, geri bildiriminiz alındı.",
        isRequiredLabel: "(zorunlu)",
        themeLight: {
          accentBackground: "#a03b0f",
          accentForeground: "#ffffff",
        },
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
      // Next.js 16 + Turbopack RSC streaming kopukluklari (kullanici
      // navigation, sekme kapatma, yavas wifi). react-server-dom-
      // turbopack-client.browser.production.js'den gelen "Connection
      // closed" handled=yes mechanism=generic. Sayfa kodu hatasi degil,
      // beklenen network davranisi. Oturum 24'te tariflere arama
      // sayfasinda gozlemlendi (q=tavukl gibi orta-yazma navigation).
      "Connection closed.",
      "Connection closed",
      // Safari autofill + navigation quirks
      "SecurityError: The operation is insecure",
      // Legacy / "Script error." CORS-blocked external JS (no source
      // map, no actionable stack)
      "Script error.",
      // Sentry's own load failures (already-failed event reporting,
      // nothing to do inside Sentry itself)
      "Cannot load Sentry",
      // K3 React 19 dev console warning (oturum 26 test campaign):
      // <script type="application/ld+json"> + dangerouslySetInnerHTML
      // pattern Next.js docs supported (JSON-LD SEO için), React 19'un
      // "Encountered a script tag while rendering" warning'i bu use
      // case için false-positive. Crawler okur, client execute etmez.
      // Pattern stabil kalir, Sentry'ye dropping prevent.
      /Encountered a script tag while rendering React component/,
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
