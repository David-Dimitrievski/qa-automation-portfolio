import { existsSync } from 'node:fs';
import { defineConfig, devices } from '@playwright/test';

// Locally BASE_URL comes from .env (git-ignored); in CI it comes from the BASE_URL GitHub secret.
if (existsSync('.env')) {
  process.loadEnvFile('.env');
}

const baseURL = process.env.BASE_URL;
if (!baseURL) {
  throw new Error('BASE_URL is not set. Copy .env.example to .env and set it.');
}

const isCI = !!process.env.CI;

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: isCI,
  retries: isCI ? 2 : 0,
  workers: isCI ? 2 : undefined,
  reporter: isCI ? [['list'], ['html', { open: 'never' }]] : [['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
