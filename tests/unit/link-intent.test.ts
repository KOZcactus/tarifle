import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  LINK_INTENT_COOKIE,
  signLinkIntent,
  verifyLinkIntent,
} from "@/lib/link-intent";

/**
 * These tests pin down the shape + safety of the link-intent cookie.
 * AUTH_SECRET is stubbed so we don't depend on .env.local loading in CI.
 */
describe("link-intent cookie", () => {
  beforeEach(() => {
    vi.stubEnv("AUTH_SECRET", "test-secret-for-link-intent");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.useRealTimers();
  });

  it("round-trips a user id", () => {
    const signed = signLinkIntent("user-123");
    expect(verifyLinkIntent(signed)).toBe("user-123");
  });

  it("returns null for an empty/undefined input", () => {
    expect(verifyLinkIntent(undefined)).toBeNull();
    expect(verifyLinkIntent(null)).toBeNull();
    expect(verifyLinkIntent("")).toBeNull();
  });

  it("returns null for malformed strings", () => {
    expect(verifyLinkIntent("no-colons")).toBeNull();
    expect(verifyLinkIntent("only:two")).toBeNull();
    expect(verifyLinkIntent("four:parts:here:extra")).toBeNull();
  });

  it("rejects a tampered user id", () => {
    const signed = signLinkIntent("user-abc");
    const [, ts, hmac] = signed.split(":");
    const tampered = `user-evil:${ts}:${hmac}`;
    expect(verifyLinkIntent(tampered)).toBeNull();
  });

  it("rejects a tampered HMAC", () => {
    const signed = signLinkIntent("user-abc");
    const [userId, ts] = signed.split(":");
    const tampered = `${userId}:${ts}:deadbeef${"0".repeat(56)}`;
    expect(verifyLinkIntent(tampered)).toBeNull();
  });

  it("rejects tokens older than 10 minutes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    const signed = signLinkIntent("u1");
    // Jump 11 minutes forward
    vi.setSystemTime(new Date("2026-01-01T10:11:00Z"));
    expect(verifyLinkIntent(signed)).toBeNull();
  });

  it("accepts tokens within the TTL", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T10:00:00Z"));
    const signed = signLinkIntent("u1");
    vi.setSystemTime(new Date("2026-01-01T10:05:00Z"));
    expect(verifyLinkIntent(signed)).toBe("u1");
  });

  it("returns different signatures for different users", () => {
    const a = signLinkIntent("user-a");
    const b = signLinkIntent("user-b");
    const [, , hmacA] = a.split(":");
    const [, , hmacB] = b.split(":");
    expect(hmacA).not.toBe(hmacB);
  });

  it("exposes the cookie name as a stable constant", () => {
    // Tripwire, this string is referenced in auth.ts and the start route;
    // changing it in one place without the others would break silently.
    expect(LINK_INTENT_COOKIE).toBe("tarifle_link_intent");
  });
});
