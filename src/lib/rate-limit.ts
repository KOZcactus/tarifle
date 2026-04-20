import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { headers } from "next/headers";

/**
 * Rate limiting facade backed by Upstash Redis.
 *
 * When `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present the
 * real Ratelimit instances are created lazily (one per scope) and shared across
 * invocations. If either env var is missing (e.g. local dev without a Redis
 * account, or during the interval between deploy and env-var addition) we fall
 * back to a no-op that always allows the request, fail-open. The console
 * warning fires once per process so we notice if prod is missing credentials.
 *
 * Usage:
 *   const result = await checkRateLimit("login", identifierForSession());
 *   if (!result.success) return { success: false, error: "..." };
 */

export type RateLimitScope =
  | "register"
  | "login"
  | "resend-verification"
  | "report"
  | "variation-create"
  | "variation-create-daily"
  | "password-change"
  | "password-reset-request"
  | "password-reset-consume"
  | "account-delete"
  | "ai-assistant"
  | "review-submit"
  | "recipePhotoUpload";

interface ScopeConfig {
  /** Human-readable window length for log messages */
  description: string;
  /** Max requests per window */
  limit: number;
  /** Window size in "<n> <unit>" form understood by Ratelimit.slidingWindow */
  window: `${number} ${"s" | "m" | "h"}`;
}

const SCOPE_CONFIG: Record<RateLimitScope, ScopeConfig> = {
  register: {
    description: "3 kayıt / 10 dk",
    limit: 3,
    window: "10 m",
  },
  login: {
    description: "5 giriş / 1 dk",
    limit: 5,
    window: "1 m",
  },
  "resend-verification": {
    description: "1 yeniden gönderme / 60 sn",
    limit: 1,
    window: "60 s",
  },
  report: {
    description: "10 rapor / 1 saat",
    limit: 10,
    window: "1 h",
  },
  "variation-create": {
    // Kisa-pencere burst kalkan, bot/spam arka arkaya gonderemesin.
    description: "3 uyarlama / 1 saat",
    limit: 3,
    window: "1 h",
  },
  "variation-create-daily": {
    // Uzun-pencere hacim kalkan, yavas ama inatci bir bot da durdurulsun.
    // Gercek kullanicinin gunde 10 uyarlama yazmasi zor; asilirsa incelensin.
    description: "10 uyarlama / 24 saat",
    limit: 10,
    window: "24 h",
  },
  "ai-assistant": {
    description: "30 istek / 1 dk",
    limit: 30,
    window: "1 m",
  },
  "password-change": {
    // Brute-force korumasi: saldirgan "mevcut sifre" alanini tahmin etmeye
    // calisabilir. 5 deneme/saat her kullanici icin yeterli rahatlik,
    // otomatize saldiriyi yavaslatir.
    description: "5 sifre degisikligi denemesi / 1 saat",
    limit: 5,
    window: "1 h",
  },
  "password-reset-request": {
    // Kullanici bir email adresi icin saatte 3 reset baslatabilir. Ayni
    // adresin inbox'ina spam yagmasini engeller, unutkan kullaniciya yer birakir.
    description: "3 sifre sifirlama istegi / 1 saat",
    limit: 3,
    window: "1 h",
  },
  "password-reset-consume": {
    // Token 32-byte random oldugundan brute-force zaten pratik degil ama
    // bir saldirganin ayni IP'den yuzlerce token denemesini yine de yavaslatir.
    description: "10 sifre sifirlama tuketim denemesi / 1 saat",
    limit: 10,
    window: "1 h",
  },
  "account-delete": {
    // Normal bir kullanici hesabi silerse bir kere siler. Ust ust denemek
    // sart degil, dusuk threshold bir saldirganin sifre tahmin etme yoluyla
    // hesabi silmeye calismasini yavaslatir.
    description: "3 hesap silme denemesi / 1 saat",
    limit: 3,
    window: "1 h",
  },
  "review-submit": {
    // Review upsert (yildız + yorum). Normal kullanici bir tarife bir
    // review birakir, ara sira duzeltir. 10/saat hem meşru hem spam
    // blokajli bir denge.
    description: "10 yorum / 1 saat",
    limit: 10,
    window: "1 h",
  },
  recipePhotoUpload: {
    // Kullanici bir tarife 1-2 foto yukler (deneme + sunum). Saatlik 6
    // hem meşru kullanima rahatlik verir hem spam bot'u sinirlar.
    // Cloudinary free tier (25 credit/ay) acisindan da guvenli.
    description: "6 fotoğraf / 1 saat",
    limit: 6,
    window: "1 h",
  },
};

export interface RateLimitResult {
  success: boolean;
  /** Seconds to wait before retrying. 0 when success is true. */
  retryAfterSeconds: number;
  /** Friendly Turkish message for the UI, null when success is true. */
  message: string | null;
}

const RESET_OK: RateLimitResult = {
  success: true,
  retryAfterSeconds: 0,
  message: null,
};

let warnedMissingCreds = false;

function getRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    if (!warnedMissingCreds) {
      console.warn(
        "[rate-limit] UPSTASH_REDIS_REST_URL/TOKEN missing, rate limiting disabled (fail-open). Add env vars in Vercel to enable."
      );
      warnedMissingCreds = true;
    }
    return null;
  }
  return new Redis({ url, token });
}

const limiters = new Map<RateLimitScope, Ratelimit>();

function getLimiter(scope: RateLimitScope): Ratelimit | null {
  const cached = limiters.get(scope);
  if (cached) return cached;

  const redis = getRedis();
  if (!redis) return null;

  const config = SCOPE_CONFIG[scope];
  const limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(config.limit, config.window),
    prefix: `tarifle:rl:${scope}`,
    analytics: false,
  });
  limiters.set(scope, limiter);
  return limiter;
}

function formatRetry(seconds: number): string {
  if (seconds <= 1) return "1 saniye";
  if (seconds < 60) return `${seconds} saniye`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes} dakika`;
  const hours = Math.ceil(minutes / 60);
  return `${hours} saat`;
}

/**
 * Check and consume one token for the given scope + identifier.
 *
 * `identifier` should be stable across a rate-limited actor: prefer the user
 * id for authenticated actions; fall back to client IP for anonymous ones.
 */
export async function checkRateLimit(
  scope: RateLimitScope,
  identifier: string
): Promise<RateLimitResult> {
  if (!identifier || identifier === "anonymous") {
    // Never block when we literally can't identify the caller, there is no
    // safe bucket to count against. Callers should pass a real IP or user id.
    return RESET_OK;
  }

  const limiter = getLimiter(scope);
  if (!limiter) return RESET_OK;

  try {
    const { success, reset } = await limiter.limit(identifier);
    if (success) return RESET_OK;

    const retryAfterSeconds = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
    return {
      success: false,
      retryAfterSeconds,
      message: `Çok fazla istek gönderdin. Lütfen ${formatRetry(retryAfterSeconds)} sonra tekrar dene.`,
    };
  } catch (err) {
    // Redis outage → fail-open so we don't accidentally lock everyone out.
    // Log loudly so the operator notices.
    console.error("[rate-limit] upstash error, failing open:", err);
    return RESET_OK;
  }
}

/**
 * Build the identifier string for rate limiting.
 * Prefer userId (stable across IP changes); fall back to `ip:<addr>`.
 */
export function rateLimitIdentifier(userId?: string | null, ip?: string | null): string {
  if (userId) return `user:${userId}`;
  if (ip) return `ip:${ip}`;
  return "anonymous";
}

/**
 * Read the client IP from Vercel-forwarded headers. Should only be called
 * inside a request scope (server action / route handler / server component).
 *
 * Trust chain: behind Vercel we can rely on `x-forwarded-for` being set to
 * the real client IP (with any Vercel edge IPs appended). Falls back to
 * `x-real-ip` if forwarded-for is missing (non-Vercel environments).
 */
export async function getClientIp(): Promise<string | null> {
  try {
    const h = await headers();
    const forwardedFor = h.get("x-forwarded-for");
    if (forwardedFor) {
      // Take only the first IP, subsequent entries are edge/proxy addresses.
      const first = forwardedFor.split(",")[0]?.trim();
      if (first) return first;
    }
    return h.get("x-real-ip") ?? null;
  } catch {
    return null;
  }
}
