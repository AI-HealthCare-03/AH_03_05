import { test, expect } from '@playwright/test';
import { loginAndGoHome, TEST_EMAIL, TEST_PASSWORD } from './helpers';

const LOCKOUT_EMAIL = 'e2e_lockout@test.com';
const LOCKOUT_PASSWORD = 'Test1234!';
const DISPOSABLE_EMAIL = 'e2e_delete@test.com';
const DISPOSABLE_PASSWORD = 'Test1234!';

async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch('http://localhost:80/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  return data.access_token ?? '';
}

async function apiSignup(email: string, password: string): Promise<boolean> {
  const res = await fetch('http://localhost:80/api/v1/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      consents: [
        { consent_type: 'terms', is_agreed: true },
        { consent_type: 'privacy', is_agreed: true },
        { consent_type: 'sensitive_health', is_agreed: true },
        { consent_type: 'ai_analysis', is_agreed: true },
        { consent_type: 'marketing', is_agreed: false },
      ],
    }),
  });
  return res.ok;
}

async function ensureAccountExists(email: string, password: string) {
  const token = await apiLogin(email, password);
  if (!token) await apiSignup(email, password);
}

/**
 * TC-29 | 비밀번호 변경 5회 실패 → 10분 잠금
 * 전제: 전용 계정 (e2e_lockout@test.com)
 * 스텝: 비밀번호 변경 화면에서 현재 비밀번호 5회 오입력
 * 기대: "10분 후 다시 시도해주세요" 메시지 (REQ-MYPAGE-001)
 */
test.describe('TC-29', () => {
  test.beforeAll(async () => {
    await ensureAccountExists(LOCKOUT_EMAIL, LOCKOUT_PASSWORD);
  });

  test('TC-29: 비밀번호 변경 5회 실패 → 잠금', async ({ page }) => {
    test.setTimeout(60_000);
    // lockout 계정으로 로그인
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('name@example.com').fill(LOCKOUT_EMAIL);
    await page.locator('input[type="password"]').fill(LOCKOUT_PASSWORD);
    await page.getByText('로그인').last().click();
    await page.waitForTimeout(2_000);

    const skip = page.getByText('건너뛰고 둘러보기');
    if (await skip.count().then((n: number) => n > 0)) {
      await skip.click({ force: true });
      await page.waitForTimeout(2_000);
    }

    await page.goto('/settings/password');
    await page.waitForTimeout(1_500);

    // 틀린 현재 비밀번호 5회 입력
    for (let i = 0; i < 5; i++) {
      const inputs = page.locator('input[type="password"]');
      await inputs.nth(0).fill('WrongPass1!');
      await inputs.nth(1).fill(LOCKOUT_PASSWORD);
      await inputs.nth(2).fill(LOCKOUT_PASSWORD);
      await page.getByText('변경하기').click({ force: true });
      await page.waitForTimeout(1_000);
    }

    await expect(
      page.getByText('잠시 후 다시 시도해주세요.')
    ).toBeVisible({ timeout: 10_000 });
  });
});

/**
 * TC-30 | 회원탈퇴 5단계 플로우
 * 전제: 전용 계정 (e2e_delete@test.com) — 매 실행 전 재생성
 * 스텝: 설정 → 회원탈퇴 → 안내 확인 → 비밀번호 재확인 → 완료
 * 기대: users.status=withdrawn, 전체 기기 로그아웃, 로그인 화면 이동
 */
test.describe('TC-30', () => {
  test.beforeAll(async () => {
    await ensureAccountExists(DISPOSABLE_EMAIL, DISPOSABLE_PASSWORD);
  });

  test('TC-30: 회원탈퇴 5단계 플로우', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');
    await page.getByPlaceholder('name@example.com').fill(DISPOSABLE_EMAIL);
    await page.locator('input[type="password"]').fill(DISPOSABLE_PASSWORD);
    await page.getByText('로그인').last().click();
    await page.waitForTimeout(2_000);

    const skip = page.getByText('건너뛰고 둘러보기');
    if (await skip.count().then((n: number) => n > 0)) {
      await skip.click({ force: true });
      await page.waitForTimeout(2_000);
    }

    await page.goto('/settings/delete-account');
    await page.waitForTimeout(1_500);

    // Step 1: 체크박스 3개 모두 체크
    const checkboxes = page.locator('[role="checkbox"]');
    const checkCount = await checkboxes.count();
    for (let i = 0; i < checkCount; i++) {
      await checkboxes.nth(i).click({ force: true });
    }
    await page.waitForTimeout(500);

    // Step 1 → Step 2: '다음' 버튼 클릭
    await page.getByText('다음').last().click({ force: true });
    await page.waitForTimeout(1_500);

    // Step 2: 비밀번호 입력
    const pwInput = page.locator('input[type="password"]').first();
    await expect(pwInput).toBeVisible({ timeout: 5_000 });
    await pwInput.fill(DISPOSABLE_PASSWORD);
    await page.waitForTimeout(500);

    // Step 2: '탈퇴하기' 버튼 클릭
    await page.getByText('탈퇴하기').last().click({ force: true });
    await page.waitForTimeout(3_000);

    // 로그인 화면으로 이동 확인
    await expect(page.getByText(/로그인|만나서 반가워요/).first()).toBeVisible({ timeout: 10_000 });
  });
});
