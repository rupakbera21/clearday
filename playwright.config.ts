import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "list",
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    channel: "chrome",
  },
  projects: [
    {
      name: "Mobile 360",
      use: {
        viewport: { width: 360, height: 740 },
        userAgent: "Mozilla/5.0 (Linux; Android 13; Mobile) AppleWebKit/537.36",
      },
    },
    {
      name: "Mobile 390",
      use: {
        viewport: { width: 390, height: 844 },
      },
    },
    {
      name: "Tablet 768",
      use: {
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "Desktop 1280",
      use: {
        viewport: { width: 1280, height: 800 },
      },
    },
  ],
  webServer: {
    command: "npm run start",
    url: "http://127.0.0.1:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
