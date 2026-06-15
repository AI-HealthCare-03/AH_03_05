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
// 포함: 로그인 → 홈 → 진료기록(목록·상세) → 복약 가이드(GuideResult) → 건강상담(채팅 라이브).
// 진료기록·가이드는 데모 계정에 seed된 기록(처방전+약품2종+생성된 가이드) 존재를 가정한다.
//
// 범위 제외:
// - OCR 업로드: prod에서 OCR 처리가 완료되지 않아(파이프라인 미연동/처리 실패) 라이브
//   시연 불가 → 제외. FE 수정(PR #211)+BE Vision 수정 후 합성 처방전 픽스처
//   (e2e/fixtures/prescription-demo.png)로 섹션 추가 예정. OCR 결과(약품)는 진료기록
//   상세에서 이미 노출되므로 영상에 핵심 산출물은 담긴다.
// 주의:
// - 가이드 화면(GuideResult)은 guideId 없이 탭으로 진입하면 빈 화면이므로, 진료기록
//   상세의 "가이드" 버튼으로 진입한다(해당 기록의 guideId를 들고 이동).
// - 채팅은 일반 세션이라 약 특정 답변은 아니지만 라이브 전송/응답이 정상 동작한다.

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

async function loginDemo(page: Page) {
  await page.goto('/login');
  // networkidle은 SPA 폴링에 도달하지 못해 길게 멈추므로, 입력 필드 노출만 기다린다.
  await page.getByPlaceholder('name@example.com').waitFor({ state: 'visible', timeout: 15_000 });
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
    await page
      .getByText('안녕하세요')
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 })
      .catch(() => {});
    await pause(page, 3_000);
  });

  // 3. 진료기록 — 사이드바로 이동 → 목록 → 상세(약품)
  await section('진료기록', async () => {
    await navTo(page, '진료기록');
    // 가드는 기록 유무와 무관하게 항상 있는 필터 탭으로(부제는 기록 있으면 "총 N건"으로 바뀜).
    await waitForScreen(page, '**/records', page.getByText('전체', { exact: true }));
    await pause(page, 2_000);
    // 기록 카드(예: " 처방전 완료 … ")를 클릭해 상세로 진입. 카드 버튼만 정확히 겨냥한다.
    const card = page.getByRole('button', { name: /처방전.*완료/ }).first();
    if ((await card.count()) > 0) {
      await moveAndClick(page, card);
      await page.waitForURL('**/records/*', { timeout: 10_000 }).catch(() => {});
      await pause(page, 2_500); // 상세: 약품(암로디핀·메트포르민)·복용법 노출
    }
  });

  // 4. 복약 가이드 — 진료기록 상세의 "가이드" 버튼으로 진입(해당 기록의 guideId 동반).
  //    탭으로 들어가면 빈 화면이라 반드시 본문 버튼을 쓴다. 복약/생활습관 탭을 보여준다.
  await section('복약 가이드', async () => {
    if (!(await clickNonTab(page, '가이드'))) return; // 상세에 가이드 버튼 없으면 건너뜀
    await waitForScreen(page, '**/guide**', page.getByText('💊 복약 안내'));
    await pause(page, 2_500); // 복약 안내 본문 노출
    await tapIfPresent(page, page.getByText('🚶 생활습관', { exact: true }), 2_500); // 생활습관 탭 전환
  });

  // 5. 건강상담 — 가이드 화면의 "건강상담에 물어보기"로 자연스럽게 진입(없으면 탭으로 폴백)
  //    → 새 상담 → 메시지 전송 → AI 응답(라이브).
  await section('건강상담', async () => {
    const askFromGuide = page.getByText('건강상담에 물어보기');
    if ((await askFromGuide.count()) > 0) {
      await moveAndClick(page, askFromGuide);
      await pause(page, 1_500);
    } else {
      await navTo(page, '건강상담');
    }
    await waitForScreen(page, '**/chat', page.getByText('새 상담').first());
    await pause(page, 2_000);
    await tapIfPresent(page, page.getByText('새 상담').first(), 2_000);

    const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
    if ((await input.count()) === 0) return;
    const question = '혈압약 복용 시 주의할 점이 있나요?';
    await input.fill(question);
    await pause(page, 1_000);
    await moveAndClick(page, page.getByText('전송').first());

    // 내 질문 버블이 뜨는지 먼저 확인(전송됨)
    await page
      .getByText(question)
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
    // 라이브 AI 답변 대기 — 답변 후 노출되는 별점(피드백)을 "답변 도착" 신호로 사용.
    await page
      .getByRole('button', { name: /별점/ })
      .first()
      .waitFor({ state: 'visible', timeout: 40_000 })
      .catch(() => {});
    await pause(page, 4_500); // 답변 본문을 충분히 읽도록 노출
  });
});
