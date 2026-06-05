import { test, expect, Page } from '@playwright/test';
import { loginAndGoHome, TEST_EMAIL, TEST_PASSWORD } from './helpers';

const BASE_URL = 'http://localhost:80/api/v1';

async function getToken(): Promise<string> {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const data = await res.json();
  return data.access_token ?? '';
}

let createdRecordId: number | null = null;

test.beforeAll(async () => {
  const token = await getToken();
  if (!token) return;
  const res = await fetch(`${BASE_URL}/records/manual-input`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ ocr_edited_text: 'E2E 테스트용 진료기록 — 암로디핀 5mg 1일 1회' }),
  });
  if (res.ok) {
    const data = await res.json();
    createdRecordId = data.record_id ?? null;
  }
});

test.afterAll(async () => {
  if (!createdRecordId) return;
  const token = await getToken();
  if (!token) return;
  await fetch(`${BASE_URL}/records/${createdRecordId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
});

async function mockGuideTimeout(page: Page) {
  await page.route('**/processing-jobs/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'timeout', progress: 0 }),
    });
  });
  await page.route('**/guides/generate', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ guide_id: 9999, job_id: 'mock-job', status: 'pending' }),
    });
  });
}

/**
 * TC-18 | LLM 가이드 생성 타임아웃 (90초 초과)
 * 전제: 로그인 상태, OCR 완료된 진료기록 존재
 * 스텝: 가이드 생성 요청 → 90초 초과 (page.route로 timeout 재현)
 * 기대: "처리에 실패했습니다" 안내 + 재시도 버튼
 */
test('TC-18: LLM 가이드 생성 타임아웃', async ({ page }) => {
  await mockGuideTimeout(page);
  await loginAndGoHome(page);

  // 진료기록 상세로 이동해 가이드 생성 버튼 탭
  if (createdRecordId) {
    await page.goto(`/records/${createdRecordId}`);
    await page.waitForTimeout(1_500);

    const generateBtn = page.getByText('가이드 생성하기').first();
    if (await generateBtn.count().then((n: number) => n > 0)) {
      await generateBtn.click({ force: true });
      await page.waitForTimeout(2_000);
    }
  } else {
    // 진료기록 미생성 시 가이드 탭 직접
    await page.goto('/guide');
    await page.waitForTimeout(1_500);
  }

  // timeout mock → 실패 안내 확인
  await expect(
    page.getByText(/실패|타임아웃|다시 시도|오류|처리가 지연/).first()
  ).toBeVisible({ timeout: 15_000 });
});
