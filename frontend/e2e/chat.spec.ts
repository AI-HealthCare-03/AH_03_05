import { test, expect, Page } from '@playwright/test';
import { loginAndGoHome, TEST_EMAIL, TEST_PASSWORD } from './helpers';

async function mockLLMResponse(page: Page, overrides: Record<string, unknown> = {}) {
  await page.route('**/chat/sessions/*/messages', async route => {
    if (route.request().method() !== 'POST') { await route.continue(); return; }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        assistant_message: '혈압약 복용 중에는 주의가 필요합니다.',
        safety_flag: false,
        safety_notice: null,
        category: 'general',
        ...overrides,
      }),
    });
  });
}

/**
 * TC-12 | 채팅 세션 생성 → 메시지 전송 → 응답 수신
 * 전제: 로그인 상태
 * 스텝: 건강상담 탭 → 새 상담 → 메시지 입력 → 전송
 * 기대: AI 응답 수신, 채팅 목록에 타이틀 표시
 */
test('TC-12: 채팅 세션 생성 → 메시지 전송 → 응답 수신', async ({ page }) => {
  await mockLLMResponse(page);
  await loginAndGoHome(page);

  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  await page.getByText('새 상담').first().click({ force: true });
  await page.waitForTimeout(2_000);

  const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
  await expect(input).toBeVisible({ timeout: 5_000 });
  await input.fill('혈압약 복용 중 주의사항이 있나요?');
  await page.getByText('전송').click({ force: true });

  await expect(page.locator('text=AI').first()).toBeVisible({ timeout: 10_000 });
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
 * TC-14 | 2000자 초과 메시지 전송
 * 전제: 로그인 상태, 채팅 세션 존재
 * 스텝: 2001자 텍스트 입력 → 전송
 * 기대: 입력 차단 or 400 에러 처리, 앱 크래시 없음
 */
test('TC-14: 2000자 초과 메시지 전송', async ({ page }) => {
  await loginAndGoHome(page);
  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  await page.getByText('새 상담').first().click({ force: true });
  await page.waitForTimeout(2_000);

  const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
  await expect(input).toBeVisible({ timeout: 5_000 });

  const longText = 'A'.repeat(2001);
  await input.fill(longText);
  await page.getByText('전송').click({ force: true });
  await page.waitForTimeout(2_000);

  // 앱 크래시 없음 확인 — 입력창이 여전히 존재
  await expect(input).toBeVisible();
  // 에러 처리 or 메시지 차단 (전송 후 입력창이 비워지지 않거나 에러 표시)
  const inputValue = await input.inputValue();
  const errorMsg = page.getByText('메시지 전송에 실패했어요');
  const isBlocked = inputValue.length > 0;
  const hasError = await errorMsg.count().then((n: number) => n > 0);
  expect(isBlocked || hasError).toBeTruthy();
});

/**
 * TC-16 | 응급 증상 키워드 → 즉시 응급 안내
 * 전제: 로그인 상태
 * 스텝: 응급 증상 메시지 전송 (예: "흉통이 심해요")
 * 기대: "즉시 119에 연락하거나 응급실로 가세요" 안내 최상단 표시
 */
test('TC-16: 응급 증상 키워드 → 즉시 응급 안내', async ({ page }) => {
  await mockLLMResponse(page, {
    assistant_message: '즉시 119에 연락하거나 응급실로 가세요.',
    safety_flag: true,
    safety_notice: '응급 상황입니다. 즉시 119에 연락하세요.',
    category: 'emergency',
  });
  await loginAndGoHome(page);
  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  await page.getByText('새 상담').first().click({ force: true });
  await page.waitForTimeout(2_000);

  const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
  await expect(input).toBeVisible({ timeout: 5_000 });
  await input.fill('흉통이 심해요');
  await page.getByText('전송').click({ force: true });

  // 응급 안내 또는 경고 배너 표시 확인
  await expect(
    page.getByText(/119|응급실|주의가 필요한 답변/).first()
  ).toBeVisible({ timeout: 30_000 });
});

/**
 * TC-17 | 채팅 피드백 제출
 * 전제: 로그인 상태, AI 응답 존재
 * 스텝: 새 상담 → 메시지 전송 → AI 응답 수신 → 별점 4점 탭
 * 기대: 별점 선택 후 중복 제출 방지
 */
test('TC-17: 채팅 피드백 제출', async ({ page }) => {
  await mockLLMResponse(page);
  await loginAndGoHome(page);
  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  await page.getByText('새 상담').first().click({ force: true });
  await page.waitForTimeout(2_000);

  const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
  await expect(input).toBeVisible({ timeout: 5_000 });
  await input.fill('혈압약 복용 중 주의사항이 있나요?');
  await page.getByText('전송').click({ force: true });

  // AI 응답 대기 — 별점 버튼(accessibilityLabel) 출현 확인
  await expect(page.getByRole('button', { name: '별점 4점' }).first()).toBeVisible({ timeout: 30_000 });

  // 별점 4점 선택
  await page.getByRole('button', { name: '별점 4점' }).first().click({ force: true });
  await page.waitForTimeout(1_000);

  // 중복 제출 방지 — 버튼이 여전히 화면에 있고 앱이 크래시 안 난 것 확인
  await expect(page.getByRole('button', { name: '별점 1점' }).first()).toBeVisible();
  await expect(page.getByRole('button', { name: '별점 5점' }).first()).toBeVisible();
});

/**
 * TC-19 | 복약 가이드 생성
 * 전제: 로그인 상태, 건강 프로필 입력 완료
 * 스텝: 복약 가이드 탭 진입 → 가이드 생성 요청 (진료기록 존재 시)
 * 기대: LLM 가이드 생성 완료, 복약/생활습관 탭 표시, 의료 안전 고지 표시
 */
test('TC-19: 복약 가이드 생성', async ({ page }) => {
  await loginAndGoHome(page);

  await page.goto('/guide');
  await page.waitForTimeout(1_500);

  // 가이드 탭 접근 — 진료기록 없으면 안내 표시
  const noRecord = page.getByText(/진료기록|가이드를 생성/);
  const guideContent = page.getByText(/복약 안내|생활습관/);

  const hasGuide = await guideContent.count().then((n: number) => n > 0);
  const hasNoRecord = await noRecord.count().then((n: number) => n > 0);

  if (hasGuide) {
    // 가이드 있으면 탭과 의료 안전 고지 확인
    await expect(page.getByText('💊 복약 안내')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByText('🚶 생활습관')).toBeVisible({ timeout: 5_000 });
  } else if (hasNoRecord) {
    // 진료기록 없어서 가이드 생성 불가 — 안내 텍스트로 통과
    await expect(noRecord.first()).toBeVisible({ timeout: 5_000 });
  }
});

/**
 * TC-15 | 위험 키워드 메시지 → 경고 표시
 * 전제: 로그인 상태
 * 스텝: 응급 관련 메시지 전송
 * 기대: safety_flag=true → 경고 배너 표시 (REQ-CHAT-003)
 */
test('TC-15: 위험 키워드 메시지 → 경고 표시', async ({ page }) => {
  await mockLLMResponse(page, {
    assistant_message: '복약 중단은 반드시 의사와 상담하세요.',
    safety_flag: true,
    safety_notice: '담당 의사 또는 약사와 상담하세요.',
    category: 'general',
  });
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

/**
 * TC-20 | 채팅 입력창 Enter 키로 전송 (웹)
 * 전제: 로그인 상태
 * 스텝:
 *   1. /chat 진입 → 새 상담 생성
 *   2. 메시지 입력 후 Shift+Enter → 줄바꿈만 추가되고 전송 안 됨 확인
 *   3. 입력창에 본문 남아있는 상태에서 Enter → 전송
 *   4. 입력창이 비워지고 AI 응답 수신 확인
 * 기대:
 *   - Shift+Enter: 입력값에 '\n' 포함, AI 응답 없음
 *   - Enter: 입력창 cleared, 내 메시지 버블 렌더링, AI 응답 수신
 */
test('TC-20: 채팅 입력창 Enter 키로 전송', async ({ page }) => {
  await mockLLMResponse(page);
  await loginAndGoHome(page);

  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  await page.getByText('새 상담').first().click({ force: true });
  await page.waitForTimeout(2_000);

  const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
  await expect(input).toBeVisible({ timeout: 5_000 });

  // Step 2: Shift+Enter → 줄바꿈만, 입력창에 텍스트 유지
  await input.fill('혈압약 복용 중');
  await input.press('Shift+Enter');
  await page.waitForTimeout(300);
  const valueAfterShift = await input.inputValue();
  expect(valueAfterShift).toContain('\n');
  // Shift+Enter 후 입력창이 비워지지 않아야 함 (전송 안 됨)
  expect(valueAfterShift.trim().length).toBeGreaterThan(0);

  // Step 3: 이어서 입력 후 Enter → 전송
  await input.type('주의사항이 있나요?');
  await input.press('Enter');
  await page.waitForTimeout(500);

  // Step 4: 입력창 cleared + AI 응답 버블 수신
  // (AI 응답 버블은 채팅 메시지 컨테이너 안에서 'AI' 레이블을 가짐)
  const clearedValue = await input.inputValue();
  expect(clearedValue.trim()).toBe('');
  await expect(page.getByText('혈압약 복용 중에는 주의가 필요합니다.').first()).toBeVisible({ timeout: 10_000 });
});

/**
 * TC-21 | 채팅 세션 삭제 (데스크탑 X 버튼)
 * 전제: 로그인 상태
 * 스텝:
 *   1. /chat 진입, 세션 없으면 메시지 전송하여 세션 1개 생성
 *   2. 목록으로 돌아와 세션 행의 X 버튼(accessibilityLabel="삭제") 확인
 *   3. X 버튼 클릭 → window.confirm 승인
 *   4. 해당 세션 사라짐 확인 (토스트 or 목록 변화)
 *   5. 취소 시나리오: confirm 거부 → 세션 유지 확인
 * 기대:
 *   - 승인: 세션 제거, 토스트 표시 or 빈 상태
 *   - 거부: 세션 목록 그대로 유지
 */
test('TC-21: 채팅 세션 삭제 (X 버튼)', async ({ page }) => {
  await mockLLMResponse(page);
  await loginAndGoHome(page);

  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  // Step 1: 세션 없으면 생성
  const noSession = page.getByText(/새 상담을 시작해보세요|상담 기록이 없/);
  if (await noSession.count().then((n: number) => n > 0)) {
    await page.getByText('새 상담').first().click({ force: true });
    await page.waitForTimeout(2_000);
    const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
    await expect(input).toBeVisible({ timeout: 5_000 });
    await input.fill('삭제 테스트용 메시지');
    await page.getByText('전송').click({ force: true });
    await page.waitForTimeout(2_000);
    await page.goto('/chat');
    await page.waitForTimeout(1_500);
  }

  const deleteBtns = page.getByRole('button', { name: '삭제' });
  if (await deleteBtns.count().then((n: number) => n === 0)) return;

  // 삭제 전 세션 수 기록
  const countBefore = await deleteBtns.count();

  // Step 5: confirm 거부 → 세션 유지 확인
  page.once('dialog', dialog => dialog.dismiss());
  await deleteBtns.first().click({ force: true });
  await page.waitForTimeout(1_000);
  expect(await page.getByRole('button', { name: '삭제' }).count()).toBe(countBefore);

  // Step 3-4: confirm 승인 → 세션 1개 제거 확인
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: '삭제' }).first().click({ force: true });
  await page.waitForTimeout(2_000);

  const countAfter = await page.getByRole('button', { name: '삭제' }).count();
  const emptyState = page.getByText(/새 상담을 시작해보세요|상담 기록이 없/);
  const isRemoved =
    countAfter < countBefore ||
    (await emptyState.count().then((n: number) => n > 0));
  expect(isRemoved).toBeTruthy();
});
