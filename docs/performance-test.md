# API 성능 측정 결과 (REQ-NF-002 / 평가 5-1)

> 작성: Backend B (신정호) · 측정 도구: locust
> 측정 대상: (배포 후 기입 — 예: EC2 http://3.34.130.218:8000)
> 측정 일시: (배포 후 기입)

## 측정 개요

- **목적**: 주요 API의 응답 시간(P95) 측정으로 비기능 요구사항(REQ-NF-002) 및 평가 5-1(P95 Latency) 검증
- **기준**: 조회 API P95 < 3000ms, 챗봇 메시지 < 5000ms
- **도구**: locust (`tests/performance/locustfile.py`)
- **부하 조건**: (예: 동시 사용자 20명, spawn rate 2/s, 2분간) — 측정 시 기입
- **측정 환경**: 배포 환경(EC2) — 로컬이 아닌 실서버 기준

## 측정 결과

> 아래 표는 locust 실행 후 Statistics 탭 또는 perf_stats.csv 값으로 채운다.
> P95 = 95% 백분위 응답 시간(ms). 평가 기준 직결 지표.

| API | 요청 수 | 중앙값(ms) | 평균(ms) | **P95(ms)** | 최대(ms) | 실패율 | 기준 충족 |
|-----|--------|-----------|----------|------------|---------|--------|----------|
| GET /drugs/search | | | | | | | < 3000 |
| GET /records/{id} | | | | | | | < 3000 |
| GET /guides/{id} | | | | | | | < 3000 |
| GET /chat/sessions | | | | | | | < 3000 |
| GET /health-profile | | | | | | | < 3000 |
| GET /feedbacks/summary | | | | | | | < 3000 |
| GET /notifications | | | | | | | < 3000 |
| POST /auth/login | | | | | | | (참고) |

## 분석 (측정 후 작성)

- **병목 구간**: (예: GET /drugs/search가 외부 식약처 API 경유로 가장 느림)
- **기준 미달 항목 및 개선 방안**: (있을 경우 — 캐싱, 인덱스, 쿼리 최적화 등)
- **종합**: (예: 조회 API 전체 P95 3초 이내 충족)

## 측정 재현 방법

```bash
# 1. locust 설치
uv pip install locust

# 2. 테스트 계정·조회 ID 환경변수 설정
export MEDIPT_TEST_EMAIL="loadtest@example.com"
export MEDIPT_TEST_PASSWORD="Password123!"
export MEDIPT_RECORD_ID=1
export MEDIPT_GUIDE_ID=1

# 3. 헤드리스 실행 (CSV 저장)
locust -f tests/performance/locustfile.py \
       --host http://<배포_HOST>:8000 \
       --users 20 --spawn-rate 2 --run-time 2m --headless --csv perf

# 4. perf_stats.csv의 '95%' 컬럼이 P95(ms)
```

## 비고

- 챗봇 메시지(POST, LLM 호출)는 비용·지연이 커서 기본 측정에서 제외(locustfile 주석 처리).
  필요 시 세션 사전 생성 후 MEDIPT_SESSION_ID 주입하여 별도 측정.
- 성능 측정은 배포 완료(5-3) 이후 수행. EC2 배포 SSH 키 이슈 해결 후 진행 예정.
