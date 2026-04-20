import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Signed cookie for "the currently-signed-in user explicitly asked to link a
 * Google account from /ayarlar". Read by the `signIn` callback in auth.ts,
 * when present and valid, linking an existing-email OAuth account is allowed
 * (provided the Google email matches the user's own). Without this cookie
 * the callback falls back to the default strict behaviour (reject linkable
 * accounts to prevent takeover).
 *
 * Payload: `<userId>:<timestamp>:<hmac>`, compact, no JWT lib dependency.
 * Short TTL (10 min) so a stale cookie can't be resurrected.
 */

export const LINK_INTENT_COOKIE = "tarifle_link_intent";
const TTL_MS = 10 * 60 * 1000;

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET is required for link-intent signing");
  }
  return secret;
}

export function signLinkIntent(userId: string): string {
  const timestamp = Date.now().toString();
  const payload = `${userId}:${timestamp}`;
  const hmac = createHmac("sha256", getSecret()).update(payload).digest("hex");
  return `${payload}:${hmac}`;
}

/**
 * Validates the cookie value. Returns the embedded userId on success, null on
 * any failure (wrong shape, bad HMAC, expired). Uses `timingSafeEqual` to
 * dodge timing side channels on the HMAC comparison.
 */
export function verifyLinkIntent(value: string | undefined | null): string | null {
  if (!value) return null;
  const parts = value.split(":");
  if (parts.length !== 3) return null;
  const [userId, timestamp, providedHmac] = parts;
  if (!userId || !timestamp || !providedHmac) return null;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return null;
  if (Date.now() - ts > TTL_MS) return null;

  const payload = `${userId}:${timestamp}`;
  const expected = createHmac("sha256", getSecret())
    .update(payload)
    .digest("hex");

  // Both sides must be same byte length or timingSafeEqual throws; we already
  // know hex output length is fixed (64 chars for sha256) but guard anyway.
  const providedBuf = Buffer.from(providedHmac, "hex");
  const expectedBuf = Buffer.from(expected, "hex");
  if (providedBuf.length !== expectedBuf.length) return null;
  if (!timingSafeEqual(providedBuf, expectedBuf)) return null;

  return userId;
}
