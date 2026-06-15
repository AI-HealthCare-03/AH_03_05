import { test, expect, Page, Locator } from '@playwright/test';

// 시연 영상용 walkthrough — 로그인 → 홈 → 진료기록 → OCR 업로드 → 건강상담.
// 실데이터 기준(모킹 없음). 배포 후 PLAYWRIGHT_BASE_URL을 실사이트로 지정해 녹화.
// 자격증명은 런타임 env로만 주입(코드/커밋에 값 미포함):
//   DEMO_EMAIL=... DEMO_PASSWORD=... PLAYWRIGHT_BASE_URL=https://medipt05.store \
//     npx playwright test --config playwright.demo.config.ts
//
// 영상 가독성: (1) 시각적 커서를 주입하고 (2) 클릭 전 마우스를 요소까지
// 애니메이션 이동시켜 사람이 조작하는 것처럼 보이게 한다.
// 로그인 외 각 섹션은 실패해도 투어가 끊기지 않도록 section()으로 감싼다.

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
      await moveAndClick(page, page.getByText('전송'));
      await pause(page, 4_000);
    }
  });
});
