import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for Ghost Note
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI to avoid resource contention
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: process.env.CI
    ? [
        ['html', { outputFolder: 'playwright-report' }],
        ['github'],
        ['list'],
      ]
    : [
        ['html', { outputFolder: 'playwright-report' }],
        ['list'],
      ],

  // Shared settings for all projects
  use: {
    // Base URL for relative navigation
    baseURL: `http://localhost:${process.env.PORT || '5173'}`,

    // Capture screenshots on failure
    screenshot: 'only-on-failure',

    // Capture video on first retry only (saves resources)
    video: 'on-first-retry',

    // Capture trace on first retry for debugging
    trace: 'on-first-retry',

    // Timeout for actions like click, fill, etc.
    actionTimeout: 10000,

    // Timeout for navigation
    navigationTimeout: 30000,
  },

  // Test timeout
  timeout: 60000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },

  // Configure projects for different browsers
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // Uncomment to test on more browsers
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Web server configuration - starts Vite dev server before tests
  webServer: {
    command: `npm run dev -- --port ${process.env.PORT || '5173'}`,
    url: `http://localhost:${process.env.PORT || '5173'}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Output directory for test artifacts
  outputDir: 'e2e-results',
});
