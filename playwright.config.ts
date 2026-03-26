import { defineConfig, devices } from '@playwright/test';

const baseURL = 'http://127.0.0.1:3000';
const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: isCI ? 'pnpm run build && pnpm run start' : 'pnpm run dev',
    url: baseURL,
    reuseExistingServer: !isCI,
    timeout: isCI ? 120 * 1000 : 60 * 1000,
  },
});
