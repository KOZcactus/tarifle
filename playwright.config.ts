import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E configuration for Tarifle.
 *
 * Tests run against a local Next.js dev server on port 3000 that Playwright
 * boots on demand (`webServer` block). The server shares the real Neon DB
 * via `DATABASE_URL` in `.env.local`, so tests that create users or write
 * records will persist, specs are expected to clean up after themselves.
 *
 * On CI we bump retries to 2 and run chromium-only. Locally, we can still
 * open the UI runner with `npx playwright test --ui` to debug specs.
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false, // Serial run; tests touching the DB can race otherwise.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "list" : "html",
  timeout: 30_000,
  expect: { timeout: 5_000 },

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: {
    command: "npm run dev",
    port: 3000,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
    stdout: "ignore",
    stderr: "pipe",
  },
});
