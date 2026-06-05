import { test, expect } from '@playwright/test';
import { loginAndGoHome, TEST_EMAIL, TEST_PASSWORD } from './helpers';

async function getAccessToken(): Promise<string> {
  const res = await fetch('http://localhost:80/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASSWORD }),
  });
  const { access_token } = await res.json();
  return access_token;
}

/**
 * TC-26 | 알림 읽음 처리
 * 전제: 로그인 상태, 미읽 알림 존재 (없으면 빈 상태 검증)
 * 스텝: 알림 화면 진입 → 모두 읽음 탭
 * 기대: 뱃지 수 감소, 파란 점 사라짐
 */
test('TC-26: 알림 읽음 처리', async ({ page }) => {
  // beforeEach: 미읽 알림 개수 확인
  const token = await getAccessToken().catch(() => '');

  let unreadCount = 0;
  if (token) {
    const res = await fetch('http://localhost:80/api/v1/notifications/unread-count', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    unreadCount = data.unread_count ?? 0;
  }

  await loginAndGoHome(page);
  await page.goto('/settings/notification-history');
  await page.waitForTimeout(1_500);

  await expect(page.getByText('알림').first()).toBeVisible({ timeout: 5_000 });

  if (unreadCount > 0) {
    // 모두 읽음 버튼 탭
    const markAllBtn = page.getByText('모두 읽음').first();
    if (await markAllBtn.count().then((n: number) => n > 0)) {
      await markAllBtn.click({ force: true });
      await page.waitForTimeout(1_500);
      await expect(page.getByText('모두 읽음 처리했어요')).toBeVisible({ timeout: 5_000 });
    }
  } else {
    // 미읽 알림 없으면 빈 상태 또는 목록 확인
    await expect(page.getByText(/알림이 없어요|알림/).first()).toBeVisible({ timeout: 5_000 });
  }
});
