import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  use: { baseURL: 'http://127.0.0.1:8765/so-tay/', serviceWorkers: 'allow' },
  webServer: {
    command: 'python tools/serve.py 8765',
    url: 'http://127.0.0.1:8765/so-tay/',
    reuseExistingServer: true,
  },
  projects: [{ name: 'android', use: { ...devices['Pixel 7'] } }],
});
