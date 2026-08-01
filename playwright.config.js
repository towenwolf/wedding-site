// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  webServer: {
    command: 'python3 -m http.server 4173',
    url: 'http://localhost:4173/index.html',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:4173',
  },
  projects: [
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
});
