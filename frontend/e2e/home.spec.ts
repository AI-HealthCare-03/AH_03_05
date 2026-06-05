import { test, expect } from '@playwright/test';
import { loginAndGoHome } from './helpers';

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
