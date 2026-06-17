/**
 * 계약 스윕 (Contract Sweep)
 *
 * 실제 백엔드의 GET 응답 모양을 FE가 기대하는 타입(src/api/types.ts)과 대조해
 * FE↔BE 계약 어긋남(필드 누락·enum 대소문자·봉투 구조 등)을 잡아낸다.
 * 유닛 테스트는 API를 목하므로 못 잡는 종류의 버그를 표적한다.
 *
 * 읽기 전용: 로그인(POST /auth/login) 외 변경 요청은 하지 않는다.
 *
 * 실행:
 *   CONTRACT_EMAIL=... CONTRACT_PASSWORD=... \
 *   CONTRACT_BASE_URL=https://medipt05.store/api/v1 \
 *   node e2e/contract-sweep.mjs
 *
 * env 미지정 시 종료(자격증명 하드코딩 금지).
 */

const BASE = process.env.CONTRACT_BASE_URL ?? 'https://medipt05.store/api/v1';
const EMAIL = process.env.CONTRACT_EMAIL ?? '';
const PASSWORD = process.env.CONTRACT_PASSWORD ?? '';

if (!EMAIL || !PASSWORD) {
  console.error('CONTRACT_EMAIL / CONTRACT_PASSWORD env 필요 (자격증명 하드코딩 금지).');
  process.exit(2);
}

let TOKEN = '';
const findings = [];
const note = (ep, sev, msg) => findings.push({ ep, sev, msg });

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  let json = null;
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

const T = (v) => (v === null ? 'null' : Array.isArray(v) ? 'array' : typeof v);

// spec: { required:{key:type}, optional:[...], enums:{key:[allowed]} }
function check(ep, obj, { required = {}, optional = [], enums = {} } = {}) {
  if (obj == null || typeof obj !== 'object') { note(ep, 'ERR', `객체 아님: ${T(obj)}`); return; }
  for (const [k, type] of Object.entries(required)) {
    if (!(k in obj)) { note(ep, 'HIGH', `필수 키 누락: ${k}`); continue; }
    if (obj[k] === null) { note(ep, 'MED', `필수 키 null: ${k}`); continue; }
    if (type && type !== 'any' && T(obj[k]) !== type)
      note(ep, 'MED', `타입 불일치: ${k}=${T(obj[k])} (기대 ${type})`);
  }
  for (const [k, allowed] of Object.entries(enums)) {
    if (k in obj && obj[k] != null && !allowed.includes(obj[k]))
      note(ep, 'HIGH', `enum 불일치: ${k}="${obj[k]}" (기대 ${allowed.join('|')})`);
  }
  const known = new Set([...Object.keys(required), ...optional, ...Object.keys(enums)]);
  const extra = Object.keys(obj).filter((k) => !known.has(k));
  if (extra.length) note(ep, 'INFO', `FE 미사용 추가 키: ${extra.join(', ')}`);
}

const first = (a) => (Array.isArray(a) && a.length ? a[0] : null);

const REC_STATUS = ['uploaded', 'ocr_pending', 'ocr_completed', 'ocr_failed'];
const REC_TYPE = ['prescription', 'medicine_bag', 'medical_record', 'manual'];
const JOB_STATUS = ['pending', 'running', 'completed', 'failed', 'timeout'];
const GUIDE_ITEM_TYPES = ['MEDICATION', 'LIFESTYLE', 'WARNING', 'DISCLAIMER'];
const MSG_CATEGORY = ['general', 'side_effect', 'dosage_timing', 'lifestyle', 'emergency'];

(async () => {
  const login = await call('POST', '/auth/login', { email: EMAIL, password: PASSWORD });
  if (login.status !== 200 || !login.json?.access_token) {
    console.error('LOGIN FAILED', login.status, JSON.stringify(login.json)); process.exit(1);
  }
  TOKEN = login.json.access_token;
  check('POST /auth/login', login.json, {
    required: { access_token: 'string', refresh_token: 'string', token_type: 'string', user: 'object' },
    enums: { token_type: ['bearer'] },
  });

  check('GET /users/me', (await call('GET', '/users/me')).json, {
    required: { user_id: 'number', email: 'string', name: 'string', nickname: 'string', status: 'string' },
    enums: { status: ['active', 'withdrawn'] }, optional: ['created_at'],
  });

  const consents = (await call('GET', '/users/me/consents')).json;
  check('GET /users/me/consents', consents, { required: { consents: 'array' } });
  const ci = first(consents?.consents);
  if (ci) check('consents[0]', ci, { required: { consent_type: 'string', required_type: 'string', is_agreed: 'boolean' }, optional: ['agreed_at', 'revoked_at'] });

  const hp = (await call('GET', '/health-profile')).json;
  check('GET /health-profile', hp, {
    required: { profile_id: 'number', chronic_diseases: 'array', allergies: 'array', current_medications: 'array' },
    optional: ['age_group', 'gender', 'medical_history', 'doctor_opinion'],
  });
  for (const f of ['age_group', 'gender', 'medical_history', 'doctor_opinion'])
    if (hp && !(f in hp)) note('GET /health-profile', 'HIGH', `#229 필드 누락(prod 미배포?): ${f}`);

  // records — 전수
  const recs = (await call('GET', '/records?size=50')).json;
  check('GET /records', recs, { required: { items: 'array', page: 'number', size: 'number' }, optional: ['total'] });
  (recs?.items || []).forEach((rs, i) =>
    check(`records.items[${i}]`, rs, {
      required: { record_id: 'number', record_type: 'string', status: 'string', uploaded_at: 'string' },
      enums: { status: REC_STATUS, record_type: REC_TYPE }, optional: ['hospital_name', 'medication_count'],
    }));

  const recIds = (recs?.items || []).map((r) => r.record_id);
  const guideIds = new Set();
  for (const id of recIds) {
    const rd = (await call('GET', `/records/${id}`)).json;
    check(`GET /records/${id}`, rd, {
      required: { record_id: 'number', record_type: 'string', status: 'string' },
      enums: { status: REC_STATUS },
      optional: ['ocr_confidence', 'uploaded_at', 'hospital_name', 'doctor_name', 'total_days', 'notes', 'file_name', 'file_size', 'file_url', 'content_type', 'ocr_text', 'ocr_edited_text', 'input_method', 'image_expires_at', 'updated_at'],
    });
    if (rd && rd.content_type && String(rd.content_type).startsWith('image/') && rd.file_url == null)
      note(`GET /records/${id}`, 'WATCH', `이미지인데 file_url=null (미리보기 불가) content_type=${rd.content_type}`);

    const meds = (await call('GET', `/records/${id}/medications`)).json;
    check(`GET /records/${id}/medications`, meds, { required: { record_id: 'number', medications: 'array' } });
    (meds?.medications || []).forEach((m, i) =>
      check(`records/${id}/medications[${i}]`, m, {
        required: { medication_id: 'number', drug_name: 'string', is_verified: 'boolean' },
        optional: ['drug_ref_id', 'dosage', 'frequency', 'timing', 'duration', 'caution', 'ingredient_name', 'manufacturer', 'side_effect', 'review_status', 'api_status'],
      }));

    const g = await call('GET', `/records/${id}/guide`);
    if (g.status === 200 && g.json?.guide_id != null) guideIds.add(g.json.guide_id);

    const ocr = await call('GET', `/records/${id}/ocr-result`);
    if (ocr.status === 200) check(`GET /records/${id}/ocr-result`, ocr.json, {
      required: { record_id: 'number', medication_candidates: 'array' },
      optional: ['ocr_text', 'ocr_edited_text', 'ocr_confidence'],
    });
  }

  for (const gid of guideIds) {
    const gr = (await call('GET', `/guides/${gid}`)).json;
    check(`GET /guides/${gid}`, gr, {
      required: { guide_id: 'number', status: 'string', medication_guide: 'string', lifestyle_guide: 'string', disclaimer: 'string', guide_items: 'array' },
      optional: ['data_source', 'warning_message'],
    });
    const items = gr?.guide_items || [];
    const types = [...new Set(items.map((x) => x.item_type))];
    note(`GET /guides/${gid}`, 'INFO', `guide_items=${items.length}, item_type=[${types.join(', ')}]`);
    const bad = types.filter((t) => !GUIDE_ITEM_TYPES.includes(t));
    if (bad.length) note(`GET /guides/${gid}`, 'HIGH', `item_type 기대(대문자) 밖: ${bad.join(', ')}`);
    items.forEach((it, i) =>
      check(`guides/${gid}.items[${i}]`, it, { required: { item_type: 'string', content: 'string', sort_order: 'number' }, optional: ['title', 'guideline_source_id'] }));
  }

  // chat — 전체 세션 + 각 세션 메시지
  const sess = (await call('GET', '/chat/sessions')).json;
  check('GET /chat/sessions', sess, { required: { items: 'array', total: 'number', limit: 'number', offset: 'number' } });
  (sess?.items || []).forEach((s, i) =>
    check(`chat/sessions.items[${i}]`, s, {
      required: { session_id: 'number', title: 'string', status: 'string' },
      enums: { status: ['ACTIVE', 'CLOSED'] }, optional: ['updated_at', 'last_message', 'last_message_preview', 'record_id', 'guide_id', 'created_at'],
    }));
  for (const s of (sess?.items || []).slice(0, 5)) {
    const msgs = (await call('GET', `/chat/sessions/${s.session_id}/messages`)).json;
    check(`GET /chat/sessions/${s.session_id}/messages`, msgs, { required: { session_id: 'number', items: 'array', total: 'number', limit: 'number', offset: 'number' } });
    (msgs?.items || []).forEach((mi, i) =>
      check(`sess ${s.session_id} msg[${i}]`, mi, {
        required: { message_id: 'number', sender_type: 'string', content: 'string' },
        enums: { sender_type: ['user', 'assistant'], category: MSG_CATEGORY },
        optional: ['safety_flag', 'safety_notice', 'created_at', 'rag_sources', 'summary'],
      }));
    const mi = first(msgs?.items);
    if (mi && !('rating' in mi) && !('my_rating' in mi))
      note(`GET /chat/sessions/${s.session_id}/messages`, 'KNOWN', 'rating/my_rating 없음 → 새로고침 별점 복원 불가(BE 한계)');
  }

  const al = await call('GET', '/medications/alarms');
  if (al.status === 200) {
    const arr = Array.isArray(al.json) ? al.json : al.json?.items;
    (arr || []).forEach((a, i) =>
      check(`medications/alarms[${i}]`, a, { required: { id: 'number', drug_name: 'string', is_alarm_enabled: 'boolean' }, optional: ['alarm_times'] }));
    if (!arr || !arr.length) note('GET /medications/alarms', 'INFO', `0건/형태=${JSON.stringify(al.json).slice(0, 80)}`);
  } else note('GET /medications/alarms', 'INFO', `status ${al.status}`);

  const nt = (await call('GET', '/notifications')).json;
  check('GET /notifications', nt, { required: { items: 'array', unread_count: 'number', total: 'number', page: 'number', size: 'number' } });
  (nt?.items || []).forEach((ni, i) =>
    check(`notifications.items[${i}]`, ni, { required: { notification_id: 'number', notification_type: 'string', title: 'string', message: 'string', is_read: 'boolean' }, optional: ['related_url', 'created_at', 'read_at'] }));

  check('GET /notifications/unread-count', (await call('GET', '/notifications/unread-count')).json, { required: { unread_count: 'number' } });
  check('GET /notification-settings/', (await call('GET', '/notification-settings/')).json, { required: { guide_complete_alarm: 'boolean', ocr_complete_alarm: 'boolean', system_alarm: 'boolean', updated_at: 'string' } });

  check('GET /feedbacks/summary', (await call('GET', '/feedbacks/summary')).json, {
    required: { total_count: 'number', rating_distribution: 'object', report_count: 'number', safety_report_count: 'number', low_rated_items: 'array' },
    optional: ['average_rating'],
  });

  const ds = await call('GET', '/drugs/search?keyword=' + encodeURIComponent('타이레놀'));
  if (ds.status === 200) {
    check('GET /drugs/search', ds.json, { required: { results: 'array' }, optional: ['keyword', 'message', 'source', 'cache_used'] });
    const d = first(ds.json?.results);
    if (d) {
      const dd = await call('GET', `/drugs/${d.drug_ref_id ?? d.drug_code}`);
      // FE drugs.ts는 {data:{...}} 봉투를 해제하므로 봉투 자체는 정상. data 내부를 본다.
      if (dd.status === 200) {
        const body = dd.json?.data ?? dd.json;
        check('GET /drugs/{id}.data', body, { required: { drug_name: 'string' }, optional: ['drug_ref_id', 'drug_code', 'ingredient_name', 'manufacturer', 'efficacy', 'usage_method', 'dosage', 'caution', 'side_effect', 'source_url'] });
      }
    }
  } else note('GET /drugs/search', 'INFO', `status ${ds.status}`);

  const order = { ERR: 0, HIGH: 1, WATCH: 2, MED: 3, KNOWN: 4, INFO: 5 };
  findings.sort((a, b) => order[a.sev] - order[b.sev]);
  console.log('\n================ CONTRACT SWEEP ================');
  console.log(`BASE=${BASE}  account=${EMAIL}\n`);
  for (const f of findings) console.log(`[${f.sev}] ${f.ep} — ${f.msg}`);
  const counts = findings.reduce((m, f) => ((m[f.sev] = (m[f.sev] || 0) + 1), m), {});
  console.log('\n요약:', JSON.stringify(counts));
  // INFO/KNOWN만 있으면 통과(0), 그 외 심각도 있으면 1
  const bad = findings.some((f) => ['ERR', 'HIGH', 'WATCH', 'MED'].includes(f.sev));
  process.exit(bad ? 1 : 0);
})();
