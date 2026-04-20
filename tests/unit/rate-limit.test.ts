import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Unit tests for `lib/rate-limit`.
 *
 * The module caches its Redis client and Ratelimit instances at module load
 * based on env vars, so every test that needs a different env state must
 * reset modules. The happy-path with a real Redis lives in
 * `scripts/smoke-rate-limit.ts`, this file covers the logic around it:
 * identifier building, anonymous fail-open, no-creds fail-open, and the
 * Redis-throws-error fail-open.
 */
describe("rateLimitIdentifier", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("prefers user id over ip when both are present", async () => {
    const { rateLimitIdentifier } = await import("@/lib/rate-limit");
    expect(rateLimitIdentifier("user-123", "1.2.3.4")).toBe("user:user-123");
  });

  it("falls back to ip when user id is missing", async () => {
    const { rateLimitIdentifier } = await import("@/lib/rate-limit");
    expect(rateLimitIdentifier(null, "1.2.3.4")).toBe("ip:1.2.3.4");
    expect(rateLimitIdentifier(undefined, "1.2.3.4")).toBe("ip:1.2.3.4");
  });

  it("returns 'anonymous' when neither user id nor ip is available", async () => {
    const { rateLimitIdentifier } = await import("@/lib/rate-limit");
    expect(rateLimitIdentifier(null, null)).toBe("anonymous");
    expect(rateLimitIdentifier(undefined, undefined)).toBe("anonymous");
  });
});

describe("checkRateLimit, fail-open paths", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns success when Upstash env vars are missing", async () => {
    // Silence the one-time warning from polluting test output
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("login", "ip:1.2.3.4");
    expect(result.success).toBe(true);
    expect(result.retryAfterSeconds).toBe(0);
    expect(result.message).toBeNull();
    warn.mockRestore();
  });

  it("returns success when identifier is 'anonymous'", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("login", "anonymous");
    expect(result.success).toBe(true);
  });

  it("returns success when identifier is empty string", async () => {
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("login", "");
    expect(result.success).toBe(true);
  });
});

describe("checkRateLimit, failure path with mocked Upstash", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.stubEnv("UPSTASH_REDIS_REST_URL", "https://fake.upstash.io");
    vi.stubEnv("UPSTASH_REDIS_REST_TOKEN", "fake-token");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it("surfaces a Turkish message with retry time when the window is full", async () => {
    // Mock Ratelimit so its `.limit()` returns a denied response with a reset
    // time 30 s in the future. This covers the TR message formatting path
    // without needing a live Upstash instance.
    vi.doMock("@upstash/ratelimit", () => {
      class FakeRatelimit {
        static slidingWindow() {
          return "fake-strategy";
        }
        async limit() {
          return {
            success: false,
            reset: Date.now() + 30_000,
          };
        }
      }
      return { Ratelimit: FakeRatelimit };
    });
    vi.doMock("@upstash/redis", () => ({
      Redis: class {
        constructor() {}
      },
    }));

    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("login", "ip:9.9.9.9");
    expect(result.success).toBe(false);
    expect(result.retryAfterSeconds).toBeGreaterThanOrEqual(29);
    expect(result.retryAfterSeconds).toBeLessThanOrEqual(31);
    expect(result.message).toMatch(/saniye/);
  });

  it("fails open when Redis throws so outages don't lock everyone out", async () => {
    vi.doMock("@upstash/ratelimit", () => {
      class FakeRatelimit {
        static slidingWindow() {
          return "fake-strategy";
        }
        async limit() {
          throw new Error("redis unreachable");
        }
      }
      return { Ratelimit: FakeRatelimit };
    });
    vi.doMock("@upstash/redis", () => ({
      Redis: class {
        constructor() {}
      },
    }));

    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const { checkRateLimit } = await import("@/lib/rate-limit");
    const result = await checkRateLimit("login", "ip:9.9.9.9");
    expect(result.success).toBe(true);
    // We expect a loud log so operators notice the Redis outage.
    expect(err).toHaveBeenCalled();
    err.mockRestore();
  });
});
