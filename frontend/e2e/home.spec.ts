import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'ui_test@test.com';
const TEST_PASSWORD = 'Test1234!';

async function loginAndGoHome(page: any) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByText('로그인').last().click();
  await page.waitForTimeout(2_000);

  const skipAll = page.getByText('건너뛰고 둘러보기');
  if (await skipAll.count().then((n: number) => n > 0)) {
    await skipAll.click({ force: true });
    await page.waitForTimeout(2_000);
  }

  await expect(page.getByText('안녕하세요')).toBeVisible({ timeout: 10_000 });
}

/**
 * TC-11 | 약품 복약 체크
 * 전제: 로그인 상태, 등록된 약품 존재 (seed 데이터)
 * 스텝: 홈 화면 → 복약 체크 버튼 탭
 * 기대: 상태 '완료'로 변경, 달성률 업데이트, 토스트 표시
 */
test('TC-11: 약품 복약 체크', async ({ page }) => {
  await loginAndGoHome(page);

  await page.goto('/');
  await page.waitForTimeout(1_500);

  // 복약 체크 버튼 탭
  const checkBtn = page.getByText('복약 체크').first();
  await expect(checkBtn).toBeVisible({ timeout: 5_000 });
  await checkBtn.click({ force: true });
  await page.waitForTimeout(1_000);

  // '완료' 배지 표시 확인
  await expect(page.getByText('완료').first()).toBeVisible({ timeout: 5_000 });

  // 토스트 메시지 확인
  await expect(page.getByText('복약 체크 완료 🎉').first()).toBeVisible({ timeout: 5_000 });
});
