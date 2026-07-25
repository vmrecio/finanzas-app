import { defineConfig, devices } from '@playwright/test';

/**
 * Full-stack E2E suite: requires apps/web AND apps/api (with Postgres) both
 * already running (see README "End-to-end tests"). Intentionally separate
 * from `vitest.config.ts` — this drives a real browser against real HTTP,
 * not component/unit tests, so it is never wired into the `vitest`/Turbo
 * `test` task.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
