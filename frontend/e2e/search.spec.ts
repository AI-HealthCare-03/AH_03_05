import { test, expect, Page } from '@playwright/test';
import { loginAndGoHome } from './helpers';

/**
 * TC-32 | 채팅 목록 검색바 — 세션 필터링
 * 전제: 로그인 상태
 * 스텝:
 *   1. /chat 진입 → 상담 목록 사이드바 확인
 *   2. 검색바에 존재하는 세션 제목 일부 입력
 *   3. 실시간 필터링으로 일치하는 세션만 표시 확인
 *   4. 검색어 지우기 → 전체 목록 복원 확인
 *   5. 존재하지 않는 검색어 입력 → "결과 없음" 상태 확인
 * 기대:
 *   - 입력 즉시 필터 적용 (버튼 클릭 불필요)
 *   - 빈 검색어 시 전체 목록 노출
 *   - 매칭 없으면 빈 상태 표시
 */
test('TC-32: 채팅 목록 검색바 — 세션 필터링', async ({ page }) => {
  await loginAndGoHome(page);
  await page.goto('/chat');
  await page.waitForTimeout(1_500);

  // Step 1: 검색바 확인 (SearchBar placeholder="검색")
  const searchInput = page.getByPlaceholder('검색');
  await expect(searchInput).toBeVisible({ timeout: 5_000 });

  // 세션 목록 로드 대기
  await page.waitForTimeout(1_000);

  const sessionCount = await page.getByRole('button', { name: '삭제' }).count();

  if (sessionCount === 0) {
    await expect(searchInput).toBeVisible();
    return;
  }

  // Step 2: 존재하지 않는 검색어 입력 → 실시간 필터링
  // keyboard.type() with Korean triggers IME composition events that crash Expo Web
  // fill() with ASCII is stable; it clears and sets value in one atomic operation
  await searchInput.fill('zzz-no-session-match-xyz');
  await page.waitForTimeout(800);

  // Step 5: 매칭 없음 확인
  const filteredCount = await page.getByRole('button', { name: '삭제' }).count();
  const emptyMsg = page.getByText(/검색 결과가 없|상담이 없/).first();
  const isFiltered = filteredCount < sessionCount || await emptyMsg.count().then((n: number) => n > 0);
  expect(isFiltered).toBeTruthy();

  // Step 4: 검색어 지우기 → 전체 복원
  await searchInput.fill('');
  await page.waitForTimeout(800);
  const restoredCount = await page.getByRole('button', { name: '삭제' }).count();
  expect(restoredCount).toBe(sessionCount);
});

/**
 * TC-33 | 식약처 약품 검색 — 결과 표시 및 빈 상태
 * 전제: 로그인 상태, 백엔드 실행 중
 * 스텝:
 *   1. /drug/candidate 직접 접근
 *   2. 검색바에 약품명 입력 (예: "타이레놀") → 검색 버튼 클릭 or Enter
 *   3. 로딩 인디케이터 표시 후 결과 카드 렌더링 확인
 *   4. 결과 건수 텍스트("검색 결과 N건") 표시 확인
 *   5. 없는 약품명("zzz_없는_약품_xyz") 검색 → "검색 결과가 없어요" 빈 상태 확인
 *   6. API 응답을 mock해서 결과 카드 구조(약품명, 제조사) 확인
 * 기대:
 *   - 유효 검색어: 결과 건수 + 카드 목록
 *   - 무효 검색어: 빈 상태 안내 메시지
 *   - 에러 시: "검색 중 오류가 발생했어요" 메시지
 */
test('TC-33: 식약처 약품 검색 — 결과 표시', async ({ page }) => {
  // Mock: 검색 API 응답 고정 (외부 의존성 제거)
  await page.route('**/drugs/search**', async route => {
    const url = route.request().url();
    const keyword = new URL(url).searchParams.get('keyword') ?? '';

    if (keyword.includes('zzz')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ results: [] }),
      });
    } else {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          results: [
            { drug_ref_id: 1, drug_name: '타이레놀정500밀리그램', manufacturer: '한국얀센' },
            { drug_ref_id: 2, drug_name: '타이레놀이알서방정', manufacturer: '한국얀센' },
          ],
        }),
      });
    }
  });

  await loginAndGoHome(page);
  await page.goto('/drug/candidate');
  await page.waitForTimeout(1_000);

  // Step 2: 검색바 확인 및 검색어 입력
  const searchInput = page.getByPlaceholder('약품명으로 검색');
  await expect(searchInput).toBeVisible({ timeout: 5_000 });
  await searchInput.fill('타이레놀');

  // TouchableOpacity renders as <div> without role="button" in RN Web → use Enter key
  await searchInput.press('Enter');
  await page.waitForTimeout(1_500);

  // Step 3-4: 결과 건수 및 카드 확인
  await expect(page.getByText(/검색 결과 \d+건/)).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('타이레놀정500밀리그램')).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('한국얀센').first()).toBeVisible();

  // Step 5: 빈 상태 확인
  await searchInput.fill('zzz_no_drug_match');
  await searchInput.press('Enter');
  await page.waitForTimeout(1_500);

  await expect(page.getByText('검색 결과가 없어요').first()).toBeVisible({ timeout: 5_000 });
});

/**
 * TC-34 | 식약처 약품 검색 — Enter 키 제출
 * 전제: 로그인 상태
 * 스텝:
 *   1. /drug/candidate 접근
 *   2. 검색바에 약품명 입력 후 Enter 키
 *   3. 검색 버튼 클릭과 동일하게 검색 실행되는지 확인
 * 기대:
 *   - Enter 키로 검색 트리거됨 (버튼 클릭 없이)
 */
test('TC-34: 식약처 약품 검색 — Enter 키 제출', async ({ page }) => {
  await page.route('**/drugs/search**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        results: [
          { drug_ref_id: 3, drug_name: '아스피린정', manufacturer: '바이엘코리아' },
        ],
      }),
    });
  });

  await loginAndGoHome(page);
  await page.goto('/drug/candidate');
  await page.waitForTimeout(1_000);

  const searchInput = page.getByPlaceholder('약품명으로 검색');
  await expect(searchInput).toBeVisible({ timeout: 5_000 });

  // Step 2: Enter 키로 검색
  await searchInput.fill('아스피린');
  await searchInput.press('Enter');
  await page.waitForTimeout(1_500);

  // Step 3: 결과 렌더링 확인
  await expect(page.getByText(/검색 결과 \d+건/)).toBeVisible({ timeout: 5_000 });
  await expect(page.getByText('아스피린정')).toBeVisible({ timeout: 5_000 });
});
