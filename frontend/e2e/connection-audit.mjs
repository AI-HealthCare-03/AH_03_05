/**
 * 연결 감사 (Connection / Wiring Audit)
 *
 * FE가 호출하는 모든 엔드포인트(src/api/*.ts에서 자동 추출)가 실제 백엔드에
 * 배선돼 있는지(도달성·메서드), 그리고 BE에만 있고 FE가 안 쓰는 라우트가
 * 무엇인지(OpenAPI 역대조)를 점검한다. 계약(응답 모양)은 contract-sweep.mjs 담당.
 *
 * 읽기 전용: 로그인 외 변경 호출 없음. 쓰기 라우트는 빈 바디 → 422(배선+검증)로만 확인.
 *
 * 실행:
 *   CONTRACT_EMAIL=... CONTRACT_PASSWORD=... \
 *   CONTRACT_BASE_URL=https://medipt05.store/api/v1 \
 *   CONTRACT_OPENAPI_URL=https://medipt05.store/api/openapi.json \
 *   node e2e/connection-audit.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const BASE = process.env.CONTRACT_BASE_URL ?? 'https://medipt05.store/api/v1';
const OPENAPI = process.env.CONTRACT_OPENAPI_URL ?? 'https://medipt05.store/api/openapi.json';
const EMAIL = process.env.CONTRACT_EMAIL ?? '';
const PASSWORD = process.env.CONTRACT_PASSWORD ?? '';
if (!EMAIL || !PASSWORD) {
  console.error('CONTRACT_EMAIL / CONTRACT_PASSWORD env 필요 (자격증명 하드코딩 금지).');
  process.exit(2);
}

const API_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'api');
const norm = (p) => p.replace(/\$\{[^}]+\}/g, '{id}').replace(/\{[^}]+\}/g, '{id}').replace(/\/$/, '') || '/';

// src/api/*.ts에서 apiClient.<method>('path') 추출 → FE가 쓰는 라우트 집합
function extractFeRoutes() {
  // method 뒤 제네릭(<...>, 중첩 가능)은 '(' 직전까지 통째로 건너뛴다.
  const re = /apiClient\.(get|post|put|patch|delete)\b[^(]*\(\s*([`"'])([^`"']+)\2/g;
  const set = new Set();
  for (const f of readdirSync(API_DIR)) {
    if (!f.endsWith('.ts')) continue;
    const s = readFileSync(join(API_DIR, f), 'utf8');
    let m;
    while ((m = re.exec(s))) set.add(`${m[1].toUpperCase()} ${norm(m[3])}`);
  }
  return set;
}

let TOKEN = '';
async function raw(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json, allow: res.headers.get('allow') };
}

(async () => {
  const feRoutes = [...extractFeRoutes()].sort();
  const login = await raw('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (login.status !== 200) { console.error('LOGIN FAIL', login.status); process.exit(1); }
  TOKEN = login.json.access_token;

  // 동적 ID 해결
  const recs = (await raw('GET', '/records?size=50')).json?.items || [];
  const ids = { recordId: recs[0]?.record_id ?? 1, guideId: 1, medicationId: 1, sessionId: 1, notificationId: 1, jobId: 1, type: 'terms', drugId: 1, sessionId2: 1 };
  for (const r of recs) {
    const g = await raw('GET', `/records/${r.record_id}/guide`);
    if (g.status === 200 && g.json?.guide_id) ids.guideId = g.json.guide_id;
    const meds = (await raw('GET', `/records/${r.record_id}/medications`)).json?.medications || [];
    if (meds[0]?.medication_id) ids.medicationId = meds[0].medication_id;
  }
  const sess = (await raw('GET', '/chat/sessions')).json?.items || [];
  if (sess[0]?.session_id) ids.sessionId = sess[0].session_id;
  const nots = (await raw('GET', '/notifications')).json?.items || [];
  if (nots[0]?.notification_id) ids.notificationId = nots[0].notification_id;
  const fill = (p) => p.replace(/\{id\}/g, () => '0').replace(/\{(\w+)\}/g, (_, k) => ids[k] ?? '0');
  // {id}는 종류별 실 ID로 채우기 위해 원본 패턴 기준 매핑
  const realPath = (m, p) => {
    let out = p;
    if (p.includes('/records/{id}/guide')) out = p.replace('{id}', ids.recordId);
    else if (p.includes('/records/{id}/medications')) out = p.replace('{id}', ids.recordId);
    else if (p.includes('/records/{id}/ocr')) out = p.replace('{id}', ids.recordId);
    else if (p.startsWith('/records/{id}')) out = p.replace('{id}', ids.recordId);
    else if (p.startsWith('/guides/{id}')) out = p.replace('{id}', ids.guideId);
    else if (p.startsWith('/medications/{id}')) out = p.replace('{id}', ids.medicationId);
    else if (p.startsWith('/chat/sessions/{id}')) out = p.replace('{id}', ids.sessionId);
    else if (p.startsWith('/notifications/{id}')) out = p.replace('{id}', ids.notificationId);
    else if (p.startsWith('/processing-jobs/{id}')) out = p.replace('{id}', ids.jobId);
    else if (p.startsWith('/drugs/{id}')) out = p.replace('{id}', ids.drugId);
    else if (p.includes('/consents/{id}')) out = p.replace('{id}', ids.type);
    else out = p.replace(/\{id\}/g, '1');
    return out;
  };

  const findings = [];
  for (const route of feRoutes) {
    const [m, p] = route.split(' ');
    const real = realPath(m, p);
    const opt = await raw('OPTIONS', real);
    const allow = (opt.allow || '').toUpperCase().split(',').map((s) => s.trim()).filter(Boolean);
    if (allow.length) {
      if (!allow.includes(m)) findings.push({ sev: 'HIGH', route, msg: `메서드 불일치 — 서버 Allow=[${allow.join(',')}]` });
    } else {
      const g = await raw('GET', real);
      if (g.status === 404) findings.push({ sev: 'HIGH', route, msg: `경로 404 — FE가 없는 라우트 호출?` });
      // 그 외(200/401/403/405/422)는 경로 존재로 간주
    }
  }

  // 쓰기 라우트 안전 probe
  const safePosts = ['/auth/signup', '/auth/login', '/auth/password-reset/request', '/auth/email-verify/send-code', '/feedbacks'];
  const writeProbe = [];
  for (const p of safePosts) {
    const r = await raw('POST', p, {});
    writeProbe.push({ p, status: r.status, ok: r.status === 422 || r.status === 400 });
  }

  // OpenAPI 역대조
  let beOnly = [], feMissing = [];
  try {
    const spec = await (await fetch(OPENAPI)).json();
    const beSet = new Set();
    for (const [p, ops] of Object.entries(spec.paths || {})) {
      for (const mm of Object.keys(ops)) {
        if (mm === 'parameters') continue;
        beSet.add(`${mm.toUpperCase()} ${norm(p.replace(/^\/api\/v1/, ''))}`);
      }
    }
    const feSet = new Set(feRoutes);
    beOnly = [...beSet].filter((x) => !feSet.has(x)).sort();
    feMissing = [...feSet].filter((x) => !beSet.has(x)).sort();
  } catch (e) {
    console.log('(OpenAPI 대조 skip:', e.message, ')');
  }

  console.log('================ CONNECTION AUDIT ================');
  console.log(`BASE=${BASE}  FE 라우트=${feRoutes.length}\n`);
  console.log('--- 쓰기 라우트 안전 probe (빈 바디 → 422/400 기대) ---');
  for (const w of writeProbe) console.log(`[${w.ok ? 'OK' : 'CHECK'}] POST ${w.p} → ${w.status}`);
  console.log('\n--- FE가 쓰는데 BE 스펙에 없음 (오배선 후보) ---');
  console.log(feMissing.length ? feMissing.map((x) => '  ' + x).join('\n') : '  (없음)');
  console.log('\n--- BE에만 있고 FE 미사용 (의도 여부 확인 대상) ---');
  console.log(beOnly.length ? beOnly.map((x) => '  ' + x).join('\n') : '  (없음)');
  console.log('\n--- 라우트 배선 이상 ---');
  console.log(findings.length ? findings.map((f) => `[${f.sev}] ${f.route} — ${f.msg}`).join('\n') : '  이상 없음 (모든 FE 라우트 도달 가능)');

  const bad = findings.some((f) => f.sev === 'HIGH') || writeProbe.some((w) => !w.ok) || feMissing.length;
  process.exit(bad ? 1 : 0);
})();
