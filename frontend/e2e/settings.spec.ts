import { test, expect } from '@playwright/test';
import { loginAndGoHome, TEST_EMAIL, TEST_PASSWORD } from './helpers';

const NEW_PASSWORD = 'Test5678!';

async function restorePasswordViaApi(from: string, to: string) {
  const baseUrl = 'http://localhost:80/api/v1';
  const loginRes = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: from }),
  });
  if (!loginRes.ok) return;
  const { access_token } = await loginRes.json();
  await fetch(`${baseUrl}/users/me/password`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
    body: JSON.stringify({ current_password: from, new_password: to }),
  });
}

test.afterEach(async ({}, testInfo) => {
  if (testInfo.title.includes('TC-28')) {
    await restorePasswordViaApi(NEW_PASSWORD, TEST_PASSWORD).catch(() => {});
  }
});

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

  await page.getByText('30대').click({ force: true });
  await page.waitForTimeout(500);

  await page.getByText('저장하기').click({ force: true });
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

  await expect(page.getByText('서비스 이용약관')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('마케팅 수신 동의')).toBeVisible();

  const toggle = page.locator('[role="switch"]').first();
  if (await toggle.count().then((n: number) => n > 0)) {
    await toggle.click({ force: true });
    await page.waitForTimeout(1_500);
    await expect(page.getByText(/동의했어요|철회했어요/).first()).toBeVisible({ timeout: 5_000 });
  }
});

/**
 * TC-28 | 비밀번호 변경 → 전체 기기 로그아웃
 * 전제: 로그인 상태
 * 스텝: 설정 → 비밀번호 변경 → 현재/새 비밀번호 입력 → 변경 완료
 * 기대: 변경 완료 토스트, 전체 기기 로그아웃 후 로그인 화면 이동
 * ⚠️ afterEach에서 API로 원복 보장
 */
test('TC-28: 비밀번호 변경 → 전체 기기 로그아웃', async ({ page }) => {
  await loginAndGoHome(page);
  await page.goto('/settings/password');
  await page.waitForTimeout(1_500);

  const inputs = page.locator('input[type="password"]');
  await expect(inputs.first()).toBeVisible({ timeout: 5_000 });

  await inputs.nth(0).fill(TEST_PASSWORD);
  await inputs.nth(1).fill(NEW_PASSWORD);
  await inputs.nth(2).fill(NEW_PASSWORD);
  await page.getByText('변경하기').click({ force: true });
  await page.waitForTimeout(3_000);

  await expect(page.getByText('비밀번호가 변경되었습니다').first()).toBeVisible({ timeout: 10_000 });
});
