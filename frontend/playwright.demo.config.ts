import { defineConfig, devices } from '@playwright/test';

// 시연 영상 녹화 전용 config.
// 배포 후 실사이트 녹화: PLAYWRIGHT_BASE_URL=https://medipt05.store npx playwright test --config playwright.demo.config.ts
export default defineConfig({
  testDir: './e2e/demo',
  workers: 1,
  timeout: 180_000,
  retries: 0,
  outputDir: './demo-output',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:8081',
    headless: true,
    viewport: { width: 1280, height: 800 },
    video: { mode: 'on', size: { width: 1280, height: 800 } },
    launchOptions: { slowMo: 350 },
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
