import { test, expect } from '@playwright/test';

const TEST_EMAIL = 'ui_test@test.com';

/**
 * TC-06 | 로그인 5회 연속 실패 → 잠금
 * ⚠️ 이 테스트 실행 후 10분간 계정 잠금 — 단독 실행 권장
 * 전제: 가입된 계정
 * 스텝: 틀린 비밀번호 5회 → 6번째 시도
 * 기대: 잠금 메시지, 10분간 로그인 제한 (REQ-AUTH-002)
 */
test('TC-06: 로그인 5회 실패 → 잠금', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  for (let i = 0; i < 5; i++) {
    await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
    await page.locator('input[type="password"]').fill('wrongpass1!');
    await page.getByText('로그인').last().click();
    await page.waitForTimeout(1_000);
  }

  await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill('wrongpass1!');
  await page.getByText('로그인').last().click();

  await expect(page.getByText(/잠시 후 다시 시도해주세요/)).toBeVisible({ timeout: 10_000 });
});
