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
 * TC-12 | 채팅 세션 생성 → 메시지 전송 → 응답 수신
 * 전제: 로그인 상태
 * 스텝: 건강상담 탭 → 새 상담 → 메시지 입력 → 전송
 * 기대: AI 응답 수신, 채팅 목록에 타이틀 표시
 */
test('TC-12: 채팅 세션 생성 → 메시지 전송 → 응답 수신', async ({ page }) => {
  await loginAndGoHome(page);

  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  // 새 상담 버튼 탭
  await page.getByText('새 상담').first().click({ force: true });
  await page.waitForTimeout(2_000);

  // 메시지 입력 및 전송
  const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
  await expect(input).toBeVisible({ timeout: 5_000 });
  await input.fill('혈압약 복용 중 주의사항이 있나요?');
  await page.getByText('전송').click({ force: true });

  // AI 응답 수신 대기 (LLM 응답 시간 고려)
  await expect(page.locator('text=AI').first()).toBeVisible({ timeout: 30_000 });
});

/**
 * TC-13 | 빈 메시지 전송 시도
 * 전제: 로그인 상태, 채팅 세션 존재
 * 스텝: 메시지 입력 없이 전송 버튼 탭
 * 기대: 전송 버튼 비활성화 or 전송 안 됨
 */
test('TC-13: 빈 메시지 전송 시도', async ({ page }) => {
  await loginAndGoHome(page);
  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  await page.getByText('새 상담').first().click({ force: true });
  await page.waitForTimeout(2_000);

  const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
  await expect(input).toBeVisible({ timeout: 5_000 });

  // 빈 상태로 전송 — 아이콘만 있는 전송 버튼 클릭
  await page.getByText('전송').click({ force: true });
  await page.waitForTimeout(1_000);

  // 메시지가 전송되지 않아 입력창이 그대로 남아있어야 함
  await expect(input).toBeVisible();
  await expect(page.getByText('메시지 전송에 실패했어요')).not.toBeVisible();
});

/**
 * TC-15 | 위험 키워드 메시지 → 경고 표시
 * 전제: 로그인 상태
 * 스텝: 응급 관련 메시지 전송
 * 기대: safety_flag=true → 경고 배너 표시 (REQ-CHAT-003)
 */
test('TC-15: 위험 키워드 메시지 → 경고 표시', async ({ page }) => {
  await loginAndGoHome(page);
  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  await page.getByText('새 상담').first().click({ force: true });
  await page.waitForTimeout(2_000);

  const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
  await expect(input).toBeVisible({ timeout: 5_000 });
  await input.fill('이 약 끊어도 되나요?');
  await page.getByText('전송').click({ force: true });

  // 경고 배너 표시 확인 (LLM 응답 대기)
  await expect(page.getByText('주의가 필요한 답변입니다')).toBeVisible({ timeout: 30_000 });
});
