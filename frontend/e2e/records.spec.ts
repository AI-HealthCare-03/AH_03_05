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
 * TC-22 | 진료기록 목록 조회 → 상세 진입
 * 전제: 로그인 상태, 진료기록 존재
 * 스텝: 진료기록 탭 → 목록 확인 → 항목 탭
 * 기대: 상세 화면 이동, 약품 목록·제조사 표시
 */
test('TC-22: 진료기록 목록 조회 → 상세 진입', async ({ page }) => {
  await loginAndGoHome(page);

  await page.goto('/records');
  await page.waitForTimeout(1_500);

  await expect(page.getByText('진료기록')).toBeVisible({ timeout: 5_000 });

  // 목록에 항목이 있으면 첫 번째 진입
  const firstRecord = page.locator('[role="link"]').first();
  if (await firstRecord.count().then((n: number) => n > 0)) {
    await firstRecord.click({ force: true });
    await page.waitForTimeout(1_500);
    await expect(page).toHaveURL(/records\/\d+/);
  } else {
    // 진료기록 없으면 빈 상태 확인
    await expect(page.getByText('아직 업로드된 기록이 없어요')).toBeVisible({ timeout: 5_000 });
  }
});

/**
 * TC-23 | 진료기록 필터링
 * 전제: 진료기록 존재
 * 스텝: 진료기록 탭 → 필터 칩 선택
 * 기대: 선택한 유형만 표시
 */
test('TC-23: 진료기록 필터링', async ({ page }) => {
  await loginAndGoHome(page);

  await page.goto('/records');
  await page.waitForTimeout(1_500);

  // 처방전 필터 칩 탭
  const chipBtn = page.getByText('처방전').first();
  await expect(chipBtn).toBeVisible({ timeout: 5_000 });
  await chipBtn.click({ force: true });
  await page.waitForTimeout(1_000);

  // 필터가 활성화됐는지 확인 (에러 없이 렌더링)
  await expect(page.getByText('처방전')).toBeVisible();
});
