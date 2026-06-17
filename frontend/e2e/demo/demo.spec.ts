import { test, expect, Page, Locator } from '@playwright/test';

// 시연 영상용 walkthrough — 로그인 → 온보딩 → 홈 → 진료기록 → 복약 가이드 → 건강상담.
// 실데이터 기준(모킹 없음). 로컬 dev(최신 코드) 또는 prod에 PLAYWRIGHT_BASE_URL 지정해 녹화.
// 자격증명은 런타임 env로만 주입(코드/커밋에 값 미포함):
//   DEMO_EMAIL=... DEMO_PASSWORD=... npx playwright test --config playwright.demo.config.ts
//
// 영상 가독성: 시각 커서 주입 + 클릭 전 마우스 애니메이션 이동. 각 섹션은 실패해도
// 투어가 끊기지 않도록 section()으로 감싼다.
//
// 데이터 전제: 프로필 미입력 + 가이드 보유 기록(암로디핀·메트포르민 + 생성된 가이드)을 가진 계정.
//   프로필이 비어 있어 로그인 직후 온보딩이 자연스럽게 노출되고, 가이드는 시드돼 있어 흐름이 이어진다.
// 핵심: 가이드 화면의 "건강상담에 물어보기"로 진입해 본인 약(암로디핀)을 언급한 질문을 던지면,
//   챗봇이 guide_id 컨텍스트(#232)를 참조해 개인 가이드 기반으로 답하는 것이 화면으로 증명된다.

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
      document.addEventListener(
        'mousemove',
        e => {
          dot.style.left = e.clientX + 'px';
          dot.style.top = e.clientY + 'px';
        },
        true
      );
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

// 하단 탭바와 같은 라벨(예: "가이드")이 본문에도 있을 때, 탭바(화면 하단)가 아닌
// 본문 버튼을 골라 클릭한다. 보이면서 탭바 영역 위에 있는 첫 항목을 선택.
async function clickNonTab(page: Page, label: string): Promise<boolean> {
  const matches = page.getByText(label, { exact: true });
  const vh = page.viewportSize()?.height ?? 800;
  const n = await matches.count();
  for (let i = 0; i < n; i++) {
    const m = matches.nth(i);
    if (!(await m.isVisible().catch(() => false))) continue;
    const box = await m.boundingBox();
    if (box && box.y < vh - 110) {
      await moveAndClick(page, m);
      return true;
    }
  }
  return false;
}

// 전환 직후 URL·화면 고유 요소가 안정될 때까지 대기 (영상 끊김/빈 화면 방지).
// SPA가 폴링으로 networkidle에 도달하지 못해 무한 대기하는 것을 피하려 load 상태만 본다.
async function waitForScreen(page: Page, urlGlob: string, guard: Locator) {
  await page.waitForURL(urlGlob, { timeout: 10_000 }).catch(() => {});
  await guard
    .first()
    .waitFor({ state: 'visible', timeout: 15_000 })
    .catch(() => {});
}

test('시연: 핵심 플로우 walkthrough', async ({ page }) => {
  test.setTimeout(120_000);
  test.skip(!DEMO_EMAIL || !DEMO_PASSWORD, 'DEMO_EMAIL/DEMO_PASSWORD env 필요');

  await installCursor(page);

  // 1. 로그인 (실패 시 시연 불가하므로 유일하게 hard)
  await page.goto('/login');
  await page.getByPlaceholder('name@example.com').waitFor({ state: 'visible', timeout: 15_000 });
  await page.getByPlaceholder('name@example.com').fill(DEMO_EMAIL);
  await page.locator('input[type="password"]').fill(DEMO_PASSWORD);
  await moveAndClick(page, page.getByText('로그인').last());
  await page.waitForTimeout(2_500);

  // 2. 온보딩(건강 프로필) — 프로필 미입력 계정이라 로그인 직후 자동으로 온보딩에 안착한다.
  //    STEP 1(연령대·성별)을 보여주고, 저장 없이 '건너뛰고 둘러보기'로 홈에 진입한다.
  await section('온보딩(건강 프로필)', async () => {
    await page
      .getByText('연령대')
      .first()
      .waitFor({ state: 'visible', timeout: 12_000 })
      .catch(() => {});
    await pause(page, 2_500);
    await tapIfPresent(page, page.getByText('건너뛰고 둘러보기'), 1_500);
  });

  // 3. 홈 대시보드 — 짧게 노출(스크롤 없이 길게 멈추지 않도록).
  await section('홈 대시보드', async () => {
    await expect(page.getByText('안녕하세요')).toBeVisible({ timeout: 15_000 });
    await pause(page, 1_800);
  });

  // 4. 진료기록 — 목록으로 이동 → 기록 카드를 실제로 클릭(모션)해 상세로 진입.
  await section('진료기록', async () => {
    await navTo(page, '진료기록');
    await waitForScreen(page, '**/records', page.getByText('전체', { exact: true }));
    await pause(page, 1_500);
    // 기록 카드(처방전·완료)를 클릭해 상세로. 카드 클릭 모션이 보이도록 moveAndClick 사용.
    const card = page.getByRole('button', { name: /처방전.*완료/ }).first();
    if ((await card.count()) > 0) {
      await moveAndClick(page, card);
      await page.waitForURL('**/records/*', { timeout: 10_000 }).catch(() => {});
      await pause(page, 2_500); // 상세: 약품(암로디핀·메트포르민)·복용법 노출
    }
  });

  // 5. 복약 가이드 — 진료기록 상세의 "가이드" 버튼으로 진입. 복약/생활습관 탭을 보여준다.
  await section('복약 가이드', async () => {
    if (!(await clickNonTab(page, '가이드'))) return;
    await waitForScreen(page, '**/guide**', page.getByText('💊 복약 안내'));
    await pause(page, 2_500); // 복약 안내(섹션별 단일 카드) 노출
    await tapIfPresent(page, page.getByText('🚶 생활습관', { exact: true }), 2_500); // 생활습관 탭
  });

  // 6. 건강상담 — 가이드의 "건강상담에 물어보기" 버튼으로 진입(guide_id 컨텍스트 주입 #232).
  //    본인 가이드를 알아야 답할 수 있는 질문을 던져, 챗봇이 개인 가이드를 참조함을 시각적으로 증명한다.
  await section('건강상담', async () => {
    await tapIfPresent(page, page.getByText('건강상담에 물어보기', { exact: true }).first(), 2_500);
    await waitForScreen(page, '**/chat**', page.getByPlaceholder('궁금한 점을 입력해주세요'));
    await pause(page, 1_500);

    const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
    if ((await input.count()) === 0) return;
    const question = '암로디핀이랑 같이 먹으면 안 되는 거 있어요?';
    await input.click();
    await input.fill(question);
    await pause(page, 1_000);
    await input.press('Enter'); // 웹은 Enter로 전송

    await page
      .getByText(question)
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
    // 라이브 AI 답변 대기 — 답변 후 노출되는 별점(피드백)을 "답변 도착" 신호로 사용.
    await page
      .getByRole('button', { name: /별점/ })
      .first()
      .waitFor({ state: 'visible', timeout: 60_000 })
      .catch(() => {});
    await pause(page, 5_000); // 개인 가이드 참조 답변을 충분히 읽도록 노출
  });
});
