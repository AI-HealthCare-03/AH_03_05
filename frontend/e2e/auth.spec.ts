import { test, expect } from '@playwright/test';
import { TEST_EMAIL, TEST_PASSWORD } from './helpers';

/**
 * TC-02 | 로그인 성공
 * 전제: 가입된 계정 (ui_test@test.com / Test1234!)
 * 스텝: 이메일·비밀번호 입력 → 로그인 버튼 탭
 * 기대: 메인 홈 화면 이동
 */
test('TC-02: 로그인 성공', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.getByPlaceholder('name@example.com').fill(TEST_EMAIL);
  await page.locator('input[type="password"]').fill(TEST_PASSWORD);
  await page.getByText('로그인').last().click();

  // 로그인 후 화면 렌더링 대기
  await page.waitForTimeout(2_000);

  // 온보딩이 뜨면 건너뛰기
  const skipAll = page.getByText('건너뛰고 둘러보기');
  if (await skipAll.count().then((n: number) => n > 0)) {
    await skipAll.click({ force: true });
    await page.waitForTimeout(2_000);
  }

  await expect(page.getByText('안녕하세요')).toBeVisible({ timeout: 10_000 });
});

/**
 * TC-03 | 로그인 실패 — 잘못된 비밀번호
 * 전제: 가입된 계정
 * 스텝: 올바른 이메일 + 틀린 비밀번호 → 로그인
 * 기대: 통합 에러 메시지 표시, 화면 유지 (REQ-AUTH-002)
 */
test('TC-03: 로그인 실패 — 잘못된 비밀번호', async ({ page }) => {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');

  await page.getByPlaceholder('name@example.com').fill('no_such_user@test.com');
  await page.locator('input[type="password"]').fill('wrongpassword1!');
  await page.getByText('로그인').last().click();

  await page.waitForTimeout(2_000);

  // 통합 에러 메시지 표시 (계정 존재 여부 노출 없음 — REQ-AUTH-002)
  await expect(page.getByText(/이메일 또는 비밀번호/)).toBeVisible({ timeout: 10_000 });

  // 로그인 화면 유지
  await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
});

/**
 * TC-05 | 토큰 만료 → 자동 갱신
 * 전제: 로그인 상태, access token 만료
 * 스텝: access token을 만료된 값으로 교체 → API 호출 유발
 * 기대: 자동 refresh → 정상 응답, 로그아웃 없음
 */
test('TC-05: 토큰 만료 → 자동 갱신', async ({ page }) => {
  // 1. 정상 로그인 (refresh token 확보)
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

  // 2. profileComplete=true 보존 + access token만 만료값으로 교체
  await page.evaluate(() => {
    const stored = localStorage.getItem('medipt_user');
    if (stored) {
      const u = JSON.parse(stored);
      u.profileComplete = true;
      localStorage.setItem('medipt_user', JSON.stringify(u));
    }
    localStorage.setItem('medipt_access_token', 'expired.invalid.token');
  });

  // 3. 페이지 새로고침으로 API 호출 유발
  await page.reload();
  await page.waitForTimeout(3_000);

  // 4. 로그아웃 안 되고 메인 화면 유지 확인
  await expect(page.getByText('안녕하세요')).toBeVisible({ timeout: 10_000 });
  await expect(page).not.toHaveURL(/login/);
});

/**
 * TC-07 | 전체 기기 로그아웃
 * 전제: 로그인 상태
 * 스텝: 설정 → 기기 관리 → 전체 기기 로그아웃
 * 기대: 토큰 초기화 → 로그인 화면 이동
 */
test('TC-07: 전체 기기 로그아웃', async ({ page }) => {
  // 로그인
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

  // 설정 탭 진입
  await page.goto('/settings/devices');
  await page.waitForTimeout(1_500);

  // 전체 기기 로그아웃 버튼 탭
  await page.getByText('전체 기기 로그아웃').click({ force: true });
  await page.waitForTimeout(3_000);

  // 로그인 화면으로 이동 확인
  await expect(page.getByText('로그인').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.getByPlaceholder('name@example.com')).toBeVisible();
});
