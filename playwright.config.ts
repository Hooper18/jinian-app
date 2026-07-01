import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://localhost:5176',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: devices['Desktop Chrome'] }],
  webServer: {
    command: process.env.CI
      ? 'npm run preview -- --port 5176 --strictPort'
      : 'npm run build && npm run preview -- --port 5176 --strictPort',
    url: 'http://localhost:5176',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
