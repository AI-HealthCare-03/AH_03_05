import { test, expect, Page, Locator } from '@playwright/test';

// 시연 영상용 walkthrough — 온보딩 → 홈 → OCR 업로드 → 진료기록 → 복약 가이드 → 건강상담.
// 실데이터 기준(모킹 없음). 로컬 dev(최신 코드) 또는 prod에 PLAYWRIGHT_BASE_URL 지정해 녹화.
// 자격증명은 런타임 env로만 주입(코드/커밋에 값 미포함):
//   DEMO_EMAIL=... DEMO_PASSWORD=... npx playwright test --config playwright.demo.config.ts
//
// 영상 가독성: 시각 커서 주입 + 클릭 전 마우스 애니메이션 이동. 각 섹션은 실패해도
// 투어가 끊기지 않도록 section()으로 감싼다.
//
// 데이터 전제: 데모 계정에 가이드 보유 기록(record 1: 암로디핀·메트포르민 + 생성된 가이드).
// 주의:
// - 온보딩: 데모 계정은 프로필이 있어 /onboarding 직접 진입으로 화면만 노출, 저장 없이 건너뜀.
// - OCR 업로드: 결과 매핑 BE 버그로 업로드 모달까지만 노출(결과 화면은 진료기록으로 대체).
// - 가이드: guideId 없이 탭 진입 시 빈 화면이라 진료기록 상세의 "가이드" 버튼으로 진입.

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
  await page.waitForTimeout(2_000);

  // 2. 온보딩(건강 프로필) — 로그인 직후, 홈에 안착하기 전에 보여준다.
  //    데모 계정은 프로필이 있어 자동으로는 홈으로 가므로 /onboarding으로 직접 열어 화면만 노출하고,
  //    실제 저장은 하지 않고 '건너뛰고 둘러보기'로 홈에 진입한다(프로필 데이터 변경 방지).
  await section('온보딩(건강 프로필)', async () => {
    await page.goto('/onboarding', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page
      .getByText('연령대')
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })
      .catch(() => {});
    await pause(page, 3_000); // STEP 1: 연령대·성별 입력 화면 노출
    await tapIfPresent(page, page.getByText('건너뛰고 둘러보기'), 2_000);
  });

  // 3. 홈 대시보드 — 온보딩 후 진입. 복약 달성률·최근 상담 카드를 잠시 보여준다.
  await section('홈 대시보드', async () => {
    await expect(page.getByText('안녕하세요')).toBeVisible({ timeout: 15_000 });
    await pause(page, 3_000);
  });

  // 4. OCR 처방전 업로드 (장면만) — 업로드 진입 UI를 보여준다.
  //    prod OCR은 동작하나 약품 결과 매핑 버그(비-약품 라인 혼입)가 있어, 결과 화면은 시연에서
  //    제외하고 업로드 모달까지만 노출한다(실제 업로드는 prod 데이터 오염 방지로 생략).
  await section('OCR 처방전 업로드', async () => {
    await tapIfPresent(page, page.getByText('의료 문서 업로드', { exact: true }), 1_500);
    // 업로드 모달: 처방전/약봉투/진료기록 탭 + 사진촬영·갤러리 진입 노출
    await page
      .getByText('사진촬영', { exact: true })
      .first()
      .waitFor({ state: 'visible', timeout: 8_000 })
      .catch(() => {});
    await pause(page, 3_000);
    // 모달 닫고 다음 단계로 (결과는 기존 기록으로 대체)
    await tapIfPresent(page, page.getByLabel('닫기').last(), 1_000);
  });

  // 5. 진료기록 — 사이드바로 이동 → 깔끔한 기록 상세(암로디핀·메트포르민) 진입.
  //    가이드가 연결된 기록(record 1)으로 진입해 다음 단계(복약 가이드)가 이어지게 한다.
  await section('진료기록', async () => {
    await navTo(page, '진료기록');
    await waitForScreen(page, '**/records', page.getByText('전체', { exact: true }));
    await pause(page, 2_000);
    // 데모용 가이드 보유 기록 상세로 진입 (목록의 옛 기록이라 URL로 안정 진입)
    await page.goto('/records/1', { waitUntil: 'domcontentloaded' }).catch(() => {});
    await page.waitForURL('**/records/1', { timeout: 10_000 }).catch(() => {});
    await pause(page, 2_500); // 상세: 약품(암로디핀·메트포르민)·복용법 노출
  });

  // 6. 복약 가이드 — 진료기록 상세의 "가이드" 버튼으로 진입(해당 기록의 guideId 동반).
  //    탭으로 들어가면 빈 화면이라 반드시 본문 버튼을 쓴다. 복약/생활습관 탭을 보여준다.
  await section('복약 가이드', async () => {
    if (!(await clickNonTab(page, '가이드'))) return; // 상세에 가이드 버튼 없으면 건너뜀
    await waitForScreen(page, '**/guide**', page.getByText('💊 복약 안내'));
    await pause(page, 2_500); // 복약 안내 본문 노출
    await tapIfPresent(page, page.getByText('🚶 생활습관', { exact: true }), 2_500); // 생활습관 탭 전환
  });

  // 7. 건강상담 — 탭으로 이동 → 새 상담 → 메시지 전송 → AI 응답(라이브).
  //    질문은 가이드 약품(암로디핀=혈압약)과 맞춰 흐름을 잇는다.
  //    (가이드의 "건강상담에 물어보기" 버튼은 컨텍스트 전달 미구현이라 탭 진입 사용)
  await section('건강상담', async () => {
    await navTo(page, '건강상담');
    await waitForScreen(page, '**/chat', page.getByText('새 상담').first());
    await pause(page, 2_000);
    await tapIfPresent(page, page.getByText('새 상담').first(), 2_000);

    const input = page.getByPlaceholder('궁금한 점을 입력해주세요');
    if ((await input.count()) === 0) return;
    const question = '혈압약 복용 시 주의할 점이 있나요?';
    await input.click();
    await input.fill(question);
    await pause(page, 1_000);
    await input.press('Enter'); // 웹은 Enter로 전송

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
