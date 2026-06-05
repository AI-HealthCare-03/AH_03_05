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
 * TC-25 | 건강 프로필 수정
 * 전제: 로그인 상태
 * 스텝: 설정 → 건강 정보 편집 → 수정 → 저장
 * 기대: 변경사항 반영, 성공 토스트 표시
 */
test('TC-25: 건강 프로필 수정', async ({ page }) => {
  await loginAndGoHome(page);

  await page.goto('/settings/health-profile');
  await page.waitForTimeout(1_500);

  // 연령대 칩 선택
  await page.getByText('30대').click({ force: true });
  await page.waitForTimeout(500);

  // 저장
  await page.getByText('저장').click({ force: true });
  await page.waitForTimeout(1_500);

  await expect(page.getByText('건강 정보가 저장되었습니다').first()).toBeVisible({ timeout: 5_000 });
});

/**
 * TC-27 | 약관 동의 내역 확인 및 마케팅 토글
 * 전제: 로그인 상태
 * 스텝: 설정 → 약관 동의 내역 → 마케팅 토글 변경
 * 기대: 필수 약관 동의일 표시, 마케팅 토글 즉시 반영
 */
test('TC-27: 약관 동의 내역 및 마케팅 토글', async ({ page }) => {
  await loginAndGoHome(page);

  await page.goto('/settings/consent');
  await page.waitForTimeout(1_500);

  // 약관 동의 내역 화면 로드 확인
  await expect(page.getByText('서비스 이용약관')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('마케팅 수신 동의')).toBeVisible();

  // 마케팅 토글 상태 변경
  const toggle = page.locator('[role="switch"]').first();
  if (await toggle.count().then((n: number) => n > 0)) {
    await toggle.click({ force: true });
    await page.waitForTimeout(1_500);
    await expect(page.getByText(/동의했어요|철회했어요/).first()).toBeVisible({ timeout: 5_000 });
  }
});
