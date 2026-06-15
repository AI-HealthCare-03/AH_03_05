import { test, Page, Locator } from '@playwright/test';
import { loginAndGoHome } from '../helpers';

// 시연 영상용 walkthrough — 로그인 → 홈 → 진료기록 → OCR 업로드 → 건강상담.
// 실데이터 기준(모킹 없음). 배포 후 PLAYWRIGHT_BASE_URL을 실사이트로 지정해 녹화.
//
// 시연 영상은 "끝까지 도는 것"이 중요하므로, 로그인을 제외한 각 섹션은
// 실패해도 투어가 끊기지 않도록 section()으로 감싼다(throw 대신 경고 로그).
// 동작 사이 텀(pause)은 영상 가독성을 위한 의도적 대기.

const pause = (page: Page, ms = 1_500) => page.waitForTimeout(ms);

async function section(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.warn(`[demo] "${name}" 섹션 건너뜀: ${(e as Error).message}`);
  }
}

// 있으면 클릭, 없으면 조용히 통과 (데이터 유무에 영상이 깨지지 않도록)
async function tapIfPresent(page: Page, locator: Locator, ms = 1_200) {
  if ((await locator.count()) > 0) {
    await locator.first().click({ force: true });
    await pause(page, ms);
  }
}

test('시연: 핵심 플로우 walkthrough', async ({ page }) => {
  test.setTimeout(120_000);

  // 1. 로그인 → 홈 (실패 시 시연 불가하므로 유일하게 hard)
  await loginAndGoHome(page);
  await pause(page, 2_000);

  // 2. 홈 — 복약 체크
  await section('홈/복약체크', async () => {
    await page.goto('/');
    await pause(page);
    await tapIfPresent(page, page.getByText('복약 체크'));
  });

  // 3. 진료기록 — 목록 → 필터 칩
  await section('진료기록', async () => {
    await page.goto('/records');
    await pause(page, 2_000);
    await tapIfPresent(page, page.getByText('처방전')); // 필터 칩 (TC-23)
  });

  // 4. OCR 업로드 화면
  await section('OCR 업로드', async () => {
    await page.goto('/upload');
    await pause(page, 2_500);
    await tapIfPresent(page, page.getByText('처방전')); // 문서 유형 선택
  });

  // 5. 건강상담 — 새 상담 → 질문 전송
  await section('건강상담', async () => {
    await page.goto('/chat');
    await pause(page);
    await tapIfPresent(page, page.getByText('새 상담'), 2_000);
    const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
    if ((await input.count()) > 0) {
      await input.fill('혈압약 복용 중 주의사항이 있나요?');
      await pause(page);
      await page.getByText('전송').click({ force: true });
      await pause(page, 4_000);
    }
  });
});
