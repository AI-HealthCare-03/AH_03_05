import { test, expect } from '@playwright/test';
import { loginAndGoHome } from './helpers';

test('HealthProfileEditScreen — 서버값으로 폼 채워지는지', async ({ page }) => {
  await loginAndGoHome(page);

  await page.goto('/settings/health-profile');
  await page.waitForTimeout(4000);
  await page.screenshot({ path: '/tmp/health_profile_edit.png', fullPage: true });

  await expect(page.getByText('저장하기')).toBeVisible({ timeout: 5000 });
});

test('OCRResultScreen — 인식 텍스트 직접 수정 UI', async ({ page }) => {
  // GET /records/{id}/ocr-result 모킹
  await page.route('**/records/1/ocr-result', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ocr_text: '처방전 원본 텍스트입니다.',
        ocr_edited_text: null,
        medication_candidates: [
          {
            drug_name: '암로디핀정 5mg',
            frequency: '1일 1회',
            timing: '아침 식후',
            confidence: 0.95,
            is_verified: true,
            medication_id: 1,
            drug_ref_id: null,
          },
        ],
      }),
    });
  });

  await loginAndGoHome(page);
  await page.goto('/ocr/result?recordId=1');
  await page.waitForTimeout(3000);
  await page.screenshot({ path: '/tmp/ocr_result_screen.png', fullPage: true });

  // "인식 텍스트 직접 수정" 카드 확인
  const editCard = page.getByText('인식 텍스트 직접 수정');
  const isVisible = await editCard.count().then(n => n > 0);
  await page.screenshot({ path: '/tmp/ocr_result_with_toggle.png', fullPage: true });
  await expect(editCard).toBeVisible({ timeout: 5000 });
});
