/**
 * Apply pending Prisma migrations to a Neon branch using the direct
 * (non-pooled) connection URL. Avoids the PgBouncer advisory-lock
 * incompatibility that makes `prisma migrate deploy` hang with P1002 on
 * pooled URLs.
 *
 * Reads `.env.production.local` by default. If `DIRECT_DATABASE_URL` is
 * set, uses it; otherwise derives the direct URL from `DATABASE_URL` by
 * stripping the `-pooler` host suffix Neon adds for pooled endpoints.
 *
 * Dry-run (safe, read-only — runs `prisma migrate status`):
 *   npx tsx scripts/migrate-prod.ts
 *
 * Apply (writes migrations to prod DB):
 *   npx tsx scripts/migrate-prod.ts --apply --confirm-prod
 *
 * Dev-host testing (derives direct URL from `.env.local`'s DEV pooled URL):
 *   npx tsx scripts/migrate-prod.ts --env dev
 *   npx tsx scripts/migrate-prod.ts --env dev --apply
 *
 * See docs/AUTO_MIGRATE_POC.md for the full decision record.
 */
import { spawn } from "node:child_process";
import dotenv from "dotenv";
import path from "node:path";

const APPLY = process.argv.includes("--apply");
const CONFIRM_PROD = process.argv.includes("--confirm-prod");

function parseEnvArg(): "prod" | "dev" {
  const eq = process.argv.find((a) => a.startsWith("--env="));
  if (eq) return eq.split("=")[1] === "dev" ? "dev" : "prod";
  const idx = process.argv.indexOf("--env");
  if (idx >= 0 && process.argv[idx + 1] === "dev") return "dev";
  return "prod";
}

function loadEnvFile(envTarget: "prod" | "dev"): void {
  const file = envTarget === "prod" ? ".env.production.local" : ".env.local";
  const full = path.resolve(process.cwd(), file);
  const result = dotenv.config({ path: full });
  if (result.error) {
    console.error(`❌ could not read ${file}: ${result.error.message}`);
    process.exit(1);
  }
}

/**
 * Neon's pooled hosts carry a `-pooler` suffix before the first dot, e.g.
 * `ep-broad-pond-abc123-pooler.eu-central-1.aws.neon.tech`. The direct host
 * is the same URL without that suffix. If the env file provides an explicit
 * `DIRECT_DATABASE_URL` we prefer it (some setups use a separate region or
 * role for migrations).
 */
function resolveDirectUrl(): string {
  const direct = process.env.DIRECT_DATABASE_URL;
  if (direct) return direct;

  const pooled = process.env.DATABASE_URL;
  if (!pooled) {
    throw new Error("DATABASE_URL not set. Check your .env file.");
  }
  const stripped = pooled.replace(/-pooler(\.[a-z0-9.-]+)/, "$1");
  if (stripped === pooled) {
    throw new Error(
      "DATABASE_URL doesn't contain '-pooler'; set DIRECT_DATABASE_URL explicitly.",
    );
  }
  return stripped;
}

function redactUrl(url: string): string {
  try {
    const u = new URL(url);
    return `${u.protocol}//${u.username}:***@${u.host}${u.pathname}`;
  } catch {
    return "<unparsable>";
  }
}

async function main(): Promise<void> {
  const envTarget = parseEnvArg();
  loadEnvFile(envTarget);

  const directUrl = resolveDirectUrl();
  const host = new URL(directUrl).host;
  const isProdHost = host.startsWith("ep-broad-pond");
  const isDevHost = host.startsWith("ep-dry-bread");

  if (isProdHost && !CONFIRM_PROD) {
    console.error(`⛔ migrate-prod: production host detected (${host})`);
    console.error("Pass --confirm-prod to proceed (see docs/PROD_PROMOTE.md).");
    process.exit(1);
  }

  if (!isProdHost && !isDevHost) {
    console.error(`⚠️  unknown host ${host} — expected ep-broad-pond* or ep-dry-bread*.`);
    console.error(
      "Either the guard prefixes in scripts/lib/db-env.ts are stale, or the derived URL is wrong.",
    );
    process.exit(1);
  }

  const cmdArgs = APPLY
    ? ["prisma", "migrate", "deploy", "--config", "./prisma/prisma.config.ts"]
    : ["prisma", "migrate", "status", "--config", "./prisma/prisma.config.ts"];

  console.log(`🎯 env:    ${envTarget.toUpperCase()} (${isProdHost ? "PRODUCTION" : "dev"})`);
  console.log(`🔗 target: ${redactUrl(directUrl)}`);
  console.log(`⚡ cmd:    npx ${cmdArgs.join(" ")}\n`);

  if (isProdHost && APPLY) {
    console.log("⚠️  production migrate deploy starting in 3 seconds — Ctrl+C to abort.");
    await new Promise((r) => setTimeout(r, 3000));
  }

  const child = spawn("npx", cmdArgs, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: directUrl },
    shell: process.platform === "win32",
  });

  child.on("exit", (code) => process.exit(code ?? 1));
}

main().catch((e: unknown) => {
  const msg = e instanceof Error ? e.message : String(e);
  console.error(`❌ migrate-prod failed: ${msg}`);
  process.exit(1);
});
