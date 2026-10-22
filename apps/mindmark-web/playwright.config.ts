import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.MINDMARK_WEB_BASE_URL ?? 'http://127.0.0.1:5173';
const channel = process.env.MINDMARK_PLAYWRIGHT_CHANNEL ?? 'chrome';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    viewport: { width: 1440, height: 960 },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
  },
  webServer: {
    command: 'pnpm dev --host 127.0.0.1 --port 5173',
    url: baseURL,
    cwd: '.',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'teacher-chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel,
      },
    },
  ],
});
