const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'https://kavana.my.id';
const isCI = Boolean(process.env.CI);
const isLocal = FRONTEND_URL.includes('localhost') || FRONTEND_URL.includes('127.0.0.1');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',

  timeout: 30 * 1000,
  expect: { timeout: 10 * 1000 },

  // Lokal 0 retry supaya flaky langsung kelihatan; CI tetap 2.
  retries: isCI ? 2 : 0,
  fullyParallel: true,

  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
  ],

  use: {
    baseURL: FRONTEND_URL,
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'on-first-retry',
  },

  webServer: isLocal
    ? {
        command: 'npm run dev',
        url: FRONTEND_URL,
        reuseExistingServer: true,
        timeout: 120 * 1000,
      }
    : undefined,

  projects: [
    // Unit tests
    {
      name: 'unit',
      testMatch: ['unit/**/*.spec.js'],
    },

    // Test API tidak butuh browser: cukup jalan sekali, bukan 3x.
    {
      name: 'api',
      testMatch: ['api/**/*.spec.js'],
    },

    // Alur UI penuh: desktop saja.
    {
      name: 'e2e-desktop',
      testMatch: [
        'ui/**/*.spec.js',
        'e2e/**/*.spec.js',
        'academic-flow/**/*.spec.js',
        'qa-comprehensive/**/*.spec.js',
        'security-basic/**/*.spec.js',
      ],
      use: { ...devices['Desktop Chrome'] },
    },

    // Mobile: hanya smoke UI, tidak perlu seluruh alur akademik.
    {
      name: 'e2e-mobile',
      testMatch: ['ui/**/*.spec.js'],
      use: { ...devices['Pixel 5'] },
    },
  ],
});
