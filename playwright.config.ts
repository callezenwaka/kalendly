import { defineConfig, devices } from '@playwright/test';

// Serves docs/ the way Netlify does, so the specs hit the same URLs as
// production and exercise the real demo pages rather than a fixture.
export default defineConfig({
  testDir: './tests/browser',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://127.0.0.1:4173',
    trace: 'on-first-retry',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],

  webServer: {
    // `serve` is a devDependency rather than an npx fetch: resolving it at
    // run time made the server miss its startup window in CI.
    command: 'npx serve docs -p 4173 --no-clipboard',
    url: 'http://127.0.0.1:4173/examples/vanilla/',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
