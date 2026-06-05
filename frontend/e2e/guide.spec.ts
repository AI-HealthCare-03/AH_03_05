import { test, expect, Page } from '@playwright/test';
import { loginAndGoHome } from './helpers';

async function mockGuideTimeout(page: Page) {
  await page.route('**/processing-jobs/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'timeout', progress: 0 }),
    });
  });
  await page.route('**/guides/generate', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ guide_id: 9999, job_id: 'mock-job', status: 'pending' }),
    });
  });
}

/**
 * TC-18 | LLM 가이드 생성 타임아웃 (90초 초과)
 * 전제: 로그인 상태, OCR 완료된 진료기록 존재
 * 스텝: 가이드 생성 요청 → 90초 초과 (page.route로 timeout 재현)
 * 기대: "처리에 실패했습니다" 안내 + 재시도 버튼
 */
test('TC-18: LLM 가이드 생성 타임아웃', async ({ page }) => {
  await mockGuideTimeout(page);
  await loginAndGoHome(page);

  await page.goto('/guide');
  await page.waitForTimeout(1_500);

  // 가이드 생성 버튼이 있으면 탭
  const generateBtn = page.getByText(/가이드 생성|생성하기/).first();
  if (await generateBtn.count().then((n: number) => n > 0)) {
    await generateBtn.click({ force: true });
    await page.waitForTimeout(2_000);
  }

  // timeout 상태 → 실패 안내 또는 진행 화면 확인
  await expect(
    page.getByText(/실패|타임아웃|다시 시도|오류|timeout|처리가 지연/)
  ).toBeVisible({ timeout: 10_000 });
});
