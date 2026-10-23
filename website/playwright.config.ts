import { defineConfig, devices } from '@playwright/test'

const analyticsTest = process.env.FATIGUE_TEST_ANALYTICS === '1'
const port = analyticsTest ? 4323 : 4321
const origin = `http://127.0.0.1:${port}`

export default defineConfig({
  testDir: './test/e2e',
  outputDir: analyticsTest ? './test-results/analytics' : './test-results/site',
  webServer: {
    // Astro can auto-background when launched by an agent; Playwright owns this process.
    command: `astro dev --ignore-lock --host 127.0.0.1 --port ${port}`,
    url: `${origin}/fatigue-kit/`,
    reuseExistingServer: !process.env.CI && !analyticsTest,
    env: analyticsTest ? {
      PUBLIC_UMAMI_SCRIPT_URL: 'https://analytics.example.test/script.js',
      PUBLIC_UMAMI_WEBSITE_ID: '94db1cb1-74f4-4a40-ad6c-962362670409',
      PUBLIC_UMAMI_DOMAINS: '127.0.0.1',
    } : {},
  },
  use: {
    baseURL: `${origin}/fatigue-kit/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
})
