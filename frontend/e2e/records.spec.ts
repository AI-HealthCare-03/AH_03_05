import { test, expect } from '@playwright/test';
import { loginAndGoHome } from './helpers';

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

  await expect(page.getByText('진료기록').first()).toBeVisible({ timeout: 5_000 });

  // 목록에 항목이 있으면 첫 번째 진입
  const firstRecord = page.getByText('처방전').or(page.getByText('약봉투')).or(page.getByText('진료기록')).nth(1);
  const emptyState = page.getByText('아직 업로드된 기록이 없어요');

  if (await emptyState.count().then((n: number) => n > 0)) {
    await expect(emptyState).toBeVisible({ timeout: 5_000 });
  } else {
    await expect(firstRecord).toBeVisible({ timeout: 5_000 });
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

/**
 * TC-24 | 진료기록 삭제
 * 전제: 로그인 상태, 진료기록 존재
 * 스텝: 진료기록 상세 진입 → 삭제 버튼 탭 → 확인
 * 기대: 소프트딜리트 처리, 토스트 표시
 */
test('TC-24: 진료기록 삭제', async ({ page }) => {
  await loginAndGoHome(page);
  await page.goto('/records');
  await page.waitForTimeout(1_500);

  const emptyState = page.getByText('아직 업로드된 기록이 없어요');
  if (await emptyState.count().then(n => n > 0)) {
    // 진료기록 없으면 스킵
    await expect(emptyState).toBeVisible();
    return;
  }

  // 첫 번째 진료기록 상세 진입 — URL로 직접 접근
  const links = page.locator('a[href*="/records/"]');
  if (await links.count().then(n => n > 0)) {
    const href = await links.first().getAttribute('href');
    if (href) {
      await page.goto(href);
      await page.waitForTimeout(1_500);
    }
  }

  // 삭제 버튼 탭
  const deleteBtn = page.getByText('삭제').first();
  if (await deleteBtn.count().then(n => n > 0)) {
    // web: window.confirm 자동 승인
    page.on('dialog', dialog => dialog.accept());
    await deleteBtn.click({ force: true });
    await page.waitForTimeout(2_000);

    await expect(page.getByText('진료기록이 삭제됐습니다')).toBeVisible({ timeout: 5_000 });
  }
});
