import { expect, Page } from '@playwright/test';

export const TEST_EMAIL = 'ui_test@test.com';
export const TEST_PASSWORD = 'Test1234!';

export async function loginAndGoHome(page: Page) {
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
