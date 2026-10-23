const { defineConfig } = require('@playwright/test');
const { existsSync } = require('node:fs');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 45000,
  expect: { timeout: 8000 },
  workers: 2,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:4101',
    launchOptions: {
      executablePath:
        process.env.CHROME_PATH ||
        (existsSync('/usr/bin/google-chrome') ? '/usr/bin/google-chrome' : undefined),
      args: ['--no-sandbox']
    },
    trace: 'retain-on-failure'
  },
  projects: [
    {
      name: 'desktop-light',
      use: { viewport: { width: 1440, height: 1000 }, colorScheme: 'light' }
    },
    { name: 'desktop-dark', use: { viewport: { width: 1440, height: 1000 }, colorScheme: 'dark' } },
    {
      name: 'mobile-light',
      use: {
        viewport: { width: 390, height: 844 },
        colorScheme: 'light',
        isMobile: true,
        hasTouch: true
      }
    },
    {
      name: 'mobile-dark',
      use: {
        viewport: { width: 390, height: 844 },
        colorScheme: 'dark',
        isMobile: true,
        hasTouch: true
      }
    }
  ],
  webServer: {
    command: 'python3 -m http.server 4101 --bind 127.0.0.1 --directory public',
    url: 'http://127.0.0.1:4101',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'ignore'
  }
});
