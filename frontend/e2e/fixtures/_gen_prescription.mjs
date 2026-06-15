// 합성 처방전 이미지 생성기 (개인정보 없음·가짜 데이터).
// 데모 라이브 OCR용 — 또렷한 인쇄체라 Vision OCR이 잘 인식한다.
// 실행: node e2e/fixtures/_gen_prescription.mjs
import { chromium } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, 'prescription-demo.png');

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8">
<style>
  * { box-sizing: border-box; font-family: 'Apple SD Gothic Neo','Malgun Gothic',sans-serif; }
  body { margin:0; width:900px; background:#fff; color:#111; }
  .sheet { padding:48px 56px; }
  h1 { text-align:center; letter-spacing:18px; font-size:40px; margin:0 0 8px; }
  .sub { text-align:center; color:#555; font-size:18px; margin-bottom:28px; }
  .meta { display:flex; justify-content:space-between; font-size:20px; margin:6px 0; }
  .box { border:2px solid #222; border-radius:8px; padding:18px 22px; margin:18px 0; }
  table { width:100%; border-collapse:collapse; font-size:21px; }
  th,td { border:1px solid #444; padding:12px 14px; text-align:left; }
  th { background:#f0f3f8; font-weight:700; }
  .drug { font-size:23px; font-weight:700; }
  .foot { display:flex; justify-content:space-between; font-size:19px; margin-top:30px; }
  .sig { color:#444; }
</style></head><body><div class="sheet">
  <h1>처 방 전</h1>
  <div class="sub">[ 의료급여 ] 외래 처방전 (의약분업 예외 아님)</div>
  <div class="meta"><span>의료기관: <b>메디프트내과의원</b></span><span>교부일자: 2026-06-15</span></div>
  <div class="meta"><span>환자 성명: <b>김데모</b></span><span>주민등록번호: 900101-1******</span></div>
  <div class="meta"><span>처방 의사: 이정훈</span><span>면허번호: 제 12345 호</span></div>

  <div class="box">
  <table>
    <thead><tr><th>처방 의약품의 명칭</th><th>1회 투약량</th><th>1일 투여횟수</th><th>총 투약일수</th></tr></thead>
    <tbody>
      <tr><td class="drug">암로디핀베실산염정 5mg</td><td>1 정</td><td>1 회</td><td>28 일</td></tr>
      <tr><td class="drug">메트포르민염산염정 500mg</td><td>1 정</td><td>2 회</td><td>28 일</td></tr>
    </tbody>
  </table>
  </div>

  <div class="meta"><span>용법: 식후 30분 복용</span><span>조제 시 참고사항: -</span></div>
  <div class="foot"><span class="sig">의료기관 기호: 11122334</span><span class="sig">의사 서명: 이정훈 (인)</span></div>
</div></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 900, height: 760 }, deviceScaleFactor: 2 });
await page.setContent(html, { waitUntil: 'networkidle' });
const el = await page.$('.sheet');
await el.screenshot({ path: OUT });
await browser.close();
console.log('생성:', OUT);
