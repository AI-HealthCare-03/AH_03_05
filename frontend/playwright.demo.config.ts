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
    // 액션별 상한을 둬 특정 요소에서 무한 대기(테스트 타임아웃까지 멈춤)하는 것을 방지
    actionTimeout: 15_000,
    navigationTimeout: 15_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
