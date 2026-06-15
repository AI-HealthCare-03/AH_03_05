import { test, expect, Page, Locator } from '@playwright/test';

// 시연 영상용 walkthrough — 로그인 → 홈 → 진료기록 목록.
// 실데이터 기준(모킹 없음). 배포 후 PLAYWRIGHT_BASE_URL을 실사이트로 지정해 녹화.
// 자격증명은 런타임 env로만 주입(코드/커밋에 값 미포함):
//   DEMO_EMAIL=... DEMO_PASSWORD=... PLAYWRIGHT_BASE_URL=https://medipt05.store \
//     npx playwright test --config playwright.demo.config.ts
//
// 화면 전환은 page.goto가 아니라 하단 탭바 클릭으로 수행하고, 전환 직후
// waitForURL + 화면 고유 요소 visible 가드로 끊김 없이 이어지게 한다.
// 영상 가독성: (1) 시각적 커서를 주입하고 (2) 클릭 전 마우스를 요소까지
// 애니메이션 이동시켜 사람이 조작하는 것처럼 보이게 한다.
// 로그인 외 각 섹션은 실패해도 투어가 끊기지 않도록 section()으로 감싼다.
//
// 범위 제외(의도적):
// - OCR 업로드: prod 실제 OCR 호출/기록 생성을 피하려 시연에서 제외.
// - 건강상담(채팅): BE 전송 500 미해결로 라이브 시연 불가 → 제외.
// - 진료기록 목록은 데모 계정에 기록이 존재한다고 가정. 현재 0건이므로
//   완전한 영상은 BE 측 데모 계정 seed 데이터 주입이 선행돼야 한다.

const DEMO_EMAIL = process.env.DEMO_EMAIL ?? '';
const DEMO_PASSWORD = process.env.DEMO_PASSWORD ?? '';

const pause = (page: Page, ms = 1_500) => page.waitForTimeout(ms);

// 페이지마다 mousemove/mousedown을 따라다니는 커서 요소 주입 (영상에 보이도록)
async function installCursor(page: Page) {
  await page.addInitScript(() => {
    const install = () => {
      if (document.getElementById('__demo_cursor')) return;
      const dot = document.createElement('div');
      dot.id = '__demo_cursor';
      const style = document.createElement('style');
      style.innerHTML = `
        #__demo_cursor { position: fixed; z-index: 2147483647; width: 22px; height: 22px;
          margin: -11px 0 0 -11px; border-radius: 50%; background: rgba(37,99,235,.35);
          border: 2px solid #2563eb; pointer-events: none; left: 0; top: 0;
          transition: transform .08s ease; }
        #__demo_cursor.down { transform: scale(.6); background: rgba(37,99,235,.7); }`;
      document.head.appendChild(style);
      document.body.appendChild(dot);
      document.addEventListener('mousemove', e => {
        dot.style.left = e.clientX + 'px';
        dot.style.top = e.clientY + 'px';
      }, true);
      document.addEventListener('mousedown', () => dot.classList.add('down'), true);
      document.addEventListener('mouseup', () => dot.classList.remove('down'), true);
    };
    if (document.body) install();
    else window.addEventListener('DOMContentLoaded', install);
  });
}

// 요소까지 마우스를 부드럽게 이동 후 클릭 (커서가 보이도록)
async function moveAndClick(page: Page, locator: Locator) {
  const el = locator.first();
  await el.scrollIntoViewIfNeeded().catch(() => {});
  const box = await el.boundingBox();
  if (!box) {
    await el.click({ force: true });
    return;
  }
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 20 });
  await pause(page, 250);
  await page.mouse.down();
  await pause(page, 120);
  await page.mouse.up();
}

async function section(name: string, fn: () => Promise<void>) {
  try {
    await fn();
  } catch (e) {
    console.warn(`[demo] "${name}" 섹션 건너뜀: ${(e as Error).message}`);
  }
}

// 있으면 이동·클릭, 없으면 조용히 통과 (데이터 유무에 영상이 깨지지 않도록)
async function tapIfPresent(page: Page, locator: Locator, ms = 1_200) {
  if ((await locator.count()) > 0) {
    await moveAndClick(page, locator);
    await pause(page, ms);
  }
}

// 네비게이션 항목 클릭으로 화면 이동 (page.goto 점프 대신 자연스러운 전환).
// 데스크톱은 좌측 사이드바, 비활성 탭 화면의 동일 텍스트(숨은 헤더)가 함께 잡히므로
// 보이는 항목을 직접 골라 클릭한다.
async function navTo(page: Page, label: string) {
  const matches = page.getByText(label, { exact: true });
  await matches.first().waitFor({ state: 'attached', timeout: 10_000 });
  const n = await matches.count();
  for (let i = 0; i < n; i++) {
    const item = matches.nth(i);
    if (await item.isVisible().catch(() => false)) {
      await moveAndClick(page, item);
      return;
    }
  }
  await moveAndClick(page, matches.first());
}

// 전환 직후 URL·화면 고유 요소가 안정될 때까지 대기 (영상 끊김/빈 화면 방지).
// SPA가 폴링으로 networkidle에 도달하지 못해 무한 대기하는 것을 피하려 load 상태만 본다.
async function waitForScreen(page: Page, urlGlob: string, guard: Locator) {
  await page.waitForURL(urlGlob, { timeout: 10_000 }).catch(() => {});
  await guard.first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
}

async function loginDemo(page: Page) {
  await page.goto('/login');
  await page.waitForLoadState('networkidle');
  await page.getByPlaceholder('name@example.com').fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
  await moveAndClick(page, page.getByText('로그인').last());
  await page.waitForTimeout(2_000);

  const skipAll = page.getByText('건너뛰고 둘러보기');
  if ((await skipAll.count()) > 0) {
    await moveAndClick(page, skipAll);
    await page.waitForTimeout(2_000);
  }
  await expect(page.getByText('안녕하세요')).toBeVisible({ timeout: 10_000 });
}

test('시연: 핵심 플로우 walkthrough', async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!DEMO_EMAIL || !DEMO_PASSWORD, 'DEMO_EMAIL/DEMO_PASSWORD env 필요');

  await installCursor(page);

  // 1. 로그인 → 홈 (실패 시 시연 불가하므로 유일하게 hard)
  await loginDemo(page);
  await pause(page, 2_000);

  // 2. 홈 대시보드 — 로그인 직후 위치. 복약 달성률·최근 상담 카드를 잠시 보여준다.
  await section('홈 대시보드', async () => {
    await page.getByText('안녕하세요').first().waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
    await pause(page, 3_000);
  });

  // 3. 진료기록 — 사이드바로 이동 → 목록 → 상세(약품)
  await section('진료기록', async () => {
    await navTo(page, '진료기록');
    await waitForScreen(page, '**/records', page.getByText('업로드한 의료 문서와 분석 결과를 확인할 수 있어요.'));
    await pause(page, 2_500);
    // 기록 카드(예: " 처방전 완료 … ")를 클릭해 상세로 진입. 카드 버튼만 정확히 겨냥한다.
    const card = page.getByRole('button', { name: /처방전.*완료/ }).first();
    if ((await card.count()) > 0) {
      await moveAndClick(page, card);
      await page.waitForURL('**/records/*', { timeout: 10_000 }).catch(() => {});
      await pause(page, 3_500); // 상세: 약품(암로디핀·메트포르민)·복용법 노출
    }
  });
});
