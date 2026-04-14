/**
 * Smoke test: verify Upstash Redis is reachable and rate limiting is actually
 * rejecting requests once the window fills.
 *
 * Hits `resend-verification` (1 req / 60 s) twice against a synthetic
 * identifier. Expected: first call `success: true`, second `success: false`.
 * Cleans up its Redis key afterwards so re-running the script always starts
 * from a fresh window.
 */
import { config } from "dotenv";

config({ path: ".env.local" });

import { Redis } from "@upstash/redis";
import { checkRateLimit } from "../src/lib/rate-limit";

const SCOPE = "resend-verification" as const;
const IDENTIFIER = "user:smoke-test-rate-limit";

async function main() {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error("UPSTASH_REDIS_REST_URL/TOKEN missing from .env.local — aborting");
    process.exit(1);
  }

  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  // Upstash Ratelimit key pattern: <prefix>:<identifier>
  const key = `tarifle:rl:${SCOPE}:${IDENTIFIER}`;
  await redis.del(key);
  console.log(`[cleanup] removed stale key ${key}`);

  console.log("\n1st call (expected: success=true)");
  const first = await checkRateLimit(SCOPE, IDENTIFIER);
  console.log("  ->", first);

  console.log("\n2nd call (expected: success=false, message filled)");
  const second = await checkRateLimit(SCOPE, IDENTIFIER);
  console.log("  ->", second);

  // Cleanup so re-runs don't need to wait 60 s
  await redis.del(key);
  console.log(`\n[cleanup] removed test key ${key}`);

  const pass = first.success === true && second.success === false;
  console.log(`\nRESULT: ${pass ? "PASS ✓ rate limiting works end-to-end" : "FAIL ✗ something's wrong"}`);
  process.exit(pass ? 0 : 1);
}

main().catch((err) => {
  console.error("FAIL:", err);
  process.exit(1);
});
