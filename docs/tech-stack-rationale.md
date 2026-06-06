# MediPT 기술 스택 선정 근거

> 작성일: 2026-06-05 | 작성자: Backend A 돈유정

---

## 1. PostgreSQL (RDBMS)

### 선정 배경
초기 MySQL로 시작했으나 Sprint 2에서 PostgreSQL로 전환했습니다. (PR #51)

### 대안 비교

| 항목 | MySQL | **PostgreSQL** |
|------|-------|---------------|
| 배열/JSON 컬럼 | 제한적 (JSON만) | JSONB + 배열 네이티브 지원 |
| async 드라이버 | `aiomysql` (불안정) | `asyncpg` (성숙, 고성능) |
| aerich 호환성 | 일부 이슈 | 안정적 지원 |
| AWS RDS | 지원 | 지원 (우리 배포 환경 선택) |

### 선정 이유

**기술적 이유**
- `alarm_times`, `chat_messages.category` 등 배열/Enum 컬럼을 별도 테이블 없이 네이티브로 관리 가능
- `asyncpg` 드라이버 — Python async 환경에서 MySQL의 `aiomysql` 대비 안정적이고 빠름
- Tortoise ORM + aerich 조합에서 MySQL 대비 마이그레이션 안정성이 높음 (Sprint 2 전환 후 마이그레이션 이슈 없음)

**운영 이유**
- AWS RDS PostgreSQL — 프로덕션 배포 환경(EC2 + RDS)에 맞춘 선택
- `JSONB` 인덱싱 지원으로 향후 검색 기능 확장 시 쿼리 성능 확보 가능

---

## 2. Redis (인메모리 데이터 스토어)

### 선정 배경
인증·보안 관련 단기 상태 관리 용도로 도입했습니다. (PR #62)

### 대안 비교

| 항목 | PostgreSQL 단독 | **Redis** |
|------|----------------|----------|
| TTL 자동 만료 | 별도 배치 필요 | 네이티브 TTL 지원 |
| 읽기/쓰기 속도 | 디스크 I/O | 인메모리 (ms 이하) |
| 단기 상태 저장 | 테이블 cleanup 필요 | TTL 만료 후 자동 삭제 |
| 카운터 연산 | 트랜잭션 필요 | `INCR` 원자적 연산 |

### 선정 이유

**기능적 이유**
- TTL(Time To Live) 기반 자동 만료 — 인증 코드·cooldown 등 시간 제한 데이터를 별도 cleanup 없이 관리
- 원자적 카운터(`INCR`) — 로그인 실패 횟수를 race condition 없이 카운트
- 빠른 읽기/쓰기 — 매 요청마다 접근하는 실패 카운터·cooldown 체크에 DB 부하 없음

**실제 활용 사례**

| 기능 | Redis 키 | TTL |
|------|----------|-----|
| 로그인 실패 잠금 | `login_fail:{email}` | 10분 |
| 비밀번호 재설정 코드 | `pw_reset:{email}` | 10분 |
| 비밀번호 재설정 cooldown | `pw_reset_cooldown:{email}` | 60초 |
| 비밀번호 변경 실패 잠금 | `pw_change_fail:{email}` | 10분 |
| 이메일 인증 코드 | `email_verify:{email}` | 10분 |
| 이메일 인증 cooldown | `email_verify_cooldown:{email}` | 60초 |

---

## 3. FastAPI (웹 프레임워크)

### 대안 비교

| 항목 | Django REST | Flask | **FastAPI** |
|------|------------|-------|------------|
| async 지원 | 제한적 | 제한적 | 네이티브 |
| 자동 API 문서 | 별도 설정 | 별도 설정 | Swagger 자동 생성 |
| 타입 검증 | 수동 | 수동 | Pydantic 자동 |
| 학습 곡선 | 높음 | 낮음 | 낮음 |

### 선정 이유
- Python async 네이티브 지원 — LLM 호출, DB I/O 등 I/O 바운드 작업이 많은 서비스 특성에 최적
- Swagger 자동 생성 — FE와 API 연동 시 별도 문서 작업 없이 즉시 확인 가능
- Pydantic 기반 DTO 자동 검증 — 요청/응답 스키마 정의와 검증을 한 곳에서 처리

---

## 4. Tortoise ORM + aerich

### 대안 비교

| 항목 | SQLAlchemy | **Tortoise ORM** |
|------|-----------|-----------------|
| async 지원 | 별도 설정 복잡 | 설계 단계부터 async |
| FastAPI 통합 | 추가 설정 필요 | 자연스러운 통합 |
| 마이그레이션 | alembic | aerich (Django 방식) |

### 선정 이유
- FastAPI async 환경에 설계 단계부터 맞춰진 ORM — SQLAlchemy async 설정 복잡도 없이 바로 사용
- aerich — `aerich migrate → upgrade` 두 단계로 팀 전체 DB 동기화 가능
- 팀 전체가 `aerich upgrade` 한 번으로 DB 동기화 (docs/database/migration-guide.md 참고)

---

## 5. Gmail SMTP (이메일 발송)

### 대안 비교

| 항목 | AWS SES | SendGrid | **Gmail SMTP** |
|------|---------|----------|---------------|
| 비용 | 유료 (소량 무료) | 유료 (소량 무료) | 무료 |
| 설정 복잡도 | 높음 | 중간 | 낮음 |
| 프로토타입 적합성 | 낮음 | 중간 | 높음 |

### 선정 이유
- 프로토타입·MVP 단계에서 비용 없이 빠르게 구축 가능
- 비밀번호 재설정·이메일 인증 코드 발송 등 소량 발송에 충분
- `smtplib` + 앱 비밀번호 방식으로 설정 단순

---

## 6. APScheduler (배치 작업)

### 대안 비교

| 항목 | Celery + Beat | **APScheduler** |
|------|--------------|----------------|
| 별도 워커 필요 | 필요 (Redis/RabbitMQ) | 불필요 |
| 설정 복잡도 | 높음 | 낮음 |
| 소규모 배치 적합성 | 과함 | 적합 |

### 선정 이유
- 별도 워커 프로세스 없이 FastAPI 앱 내에서 실행 — 인프라 복잡도 최소화
- 소프트딜리트 후 90일 경과 진료기록 영구 삭제처럼 단순한 배치 작업에 Celery는 과함
- `CronTrigger`로 매일 자정 실행, 이미 적용된 작업 자동 스킵

---

## 7. uv (패키지 관리)

### 대안 비교

| 항목 | pip + venv | poetry | **uv** |
|------|-----------|--------|-------|
| 설치 속도 | 느림 | 중간 | 매우 빠름 (Rust 기반) |
| 의존성 그룹 | 미지원 | 지원 | 지원 |
| lock 파일 | 미지원 | 지원 | 지원 |

### 선정 이유
- pip 대비 10~100배 빠른 패키지 설치 속도 (Rust 기반)
- `uv sync --group app` 으로 앱/개발 의존성 분리 관리
- `uv run` 으로 가상환경 활성화 없이 명령어 실행 가능
- Docker 빌드 시간 단축 효과

---

## 8. Docker / Docker Compose (컨테이너화)

### 선정 이유
- 로컬 개발 환경 통일 — 팀원 간 OS/환경 차이 없이 동일한 환경에서 개발
- `docker-compose.yml` (로컬, `--reload` 포함) / `docker-compose.prod.yml` (프로덕션, `--reload` 제거) 분리 운영
- PostgreSQL·Redis·FastAPI·Nginx 컨테이너 통합 관리
- 컨테이너 시작 시 `aerich upgrade` 자동 실행으로 마이그레이션 누락 방지 (PR #121)
---

## 9. OpenAI API (gpt-4o-mini) — LLM

> 작성: Backend B 신정호

### 선정 배경
복약 안내·생활습관 가이드 생성과 실시간 챗봇의 자연어 생성 엔진으로 OpenAI API를 도입했습니다. 자체 모델 학습 대신 상용 LLM API를 선택했습니다.

### 대안 비교

| 항목 | 자체 모델 파인튜닝 | 오픈소스 LLM 셀프호스팅 | **OpenAI API** |
|------|------------------|----------------------|---------------|
| 초기 구축 비용 | 매우 높음 (학습 데이터·GPU) | 높음 (GPU 인프라) | 없음 (종량제) |
| 의료 도메인 품질 | 데이터 확보 어려움 | 모델별 편차 | 안정적 |
| 인프라 부담 | GPU 서버 필수 | GPU 서버 필수 | 없음 (API 호출) |
| 프로토타입 적합성 | 낮음 | 중간 | 높음 |

### 선정 이유

**모델 선택 — `gpt-4o-mini`**
- 비용·속도·품질 균형 — 가이드 생성·챗봇 응답에 충분한 품질을 저비용·저지연으로 확보
- 부트캠프 프로젝트 규모에서 GPT-4 대비 비용 효율이 크게 우수

**파라미터 설정 (재현성·안정성)**
- `seed=42` 고정 — 동일 입력에 대한 결과 편차 최소화 (평가 3-3, PR #119)
- `temperature` — 챗봇 0.5(자연스러운 대화) / 가이드 0.3(일관된 정보 전달)로 용도별 차등
- `AsyncOpenAI` 비동기 클라이언트 — 이벤트 루프 블로킹 제거 (PR #125)
- `response_format=json_object` — 구조화된 응답으로 파싱 안정성 확보

---

## 10. RAG (가이드라인 컨텍스트 주입)

> 작성: Backend B 신정호

### 선정 배경
LLM이 일반 지식이 아닌 **임상 진료지침 기반**으로 답하도록, 질환·연령별 가이드라인을 프롬프트 컨텍스트로 주입하는 방식을 채택했습니다.

### 대안 비교

| 항목 | LLM 단독 (지식 의존) | 벡터DB 임베딩 검색 | **규칙 기반 컨텍스트 주입** |
|------|---------------------|-------------------|------------------------|
| 출처 신뢰성 | 환각 위험 | 중간 | 검증된 지침만 사용 |
| 인프라 복잡도 | 없음 | 높음 (벡터DB) | 낮음 |
| 프로젝트 규모 적합성 | 부적합 (의료 도메인) | 과함 | 적합 |

### 선정 이유
- 의료 도메인 특성상 **환각(hallucination) 통제가 필수** — 검증된 임상 가이드라인만 컨텍스트로 주입
- `guideline_loader`가 사용자 질환·연령에 맞는 가이드라인을 선별해 프롬프트에 주입
- 벡터DB 임베딩 검색은 현 데이터 규모에 과하고 인프라 부담 큼 → 규칙 기반 선별이 적합

---

## 11. safety_filter (규칙 + LLM 2단계 안전장치)

> 작성: Backend B 신정호

### 선정 배경
복약·건강 상담 특성상 위기 신호(자살/자해/약물 과량 등) 감지가 필수입니다. 단일 방식이 아닌 2단계 안전장치를 설계했습니다.

### 대안 비교

| 항목 | LLM 단독 판단 | 규칙(키워드) 단독 | **규칙 + LLM 2단계** |
|------|--------------|------------------|---------------------|
| 명확한 위기어 감지 | 누락 가능 | 확실 | 확실 (1차 규칙) |
| 맥락 의존 표현 | 강함 | 약함 (오탐) | 강함 (2차 LLM) |
| 응답 지연 | LLM 호출 필요 | 즉시 | 명확한 건 즉시 차단 |

### 선정 이유
- **1차 규칙 필터** — 명확한 위기 표현은 LLM 호출 전 즉시 차단 (지연 없음, 누락 없음)
- **2차 LLM 판단** — 규칙을 통과한 맥락 의존 표현은 LLM이 `safety_flag`로 재판단
- 규칙 단독은 오탐(일상 표현 차단), LLM 단독은 미탐 위험 → 2단계로 양쪽 보완
- 분류 성능 정량 검증: Recall 1.0 / Specificity 1.0 (평가 3-1, PR #129)

---

## 12. React Native + Expo (크로스플랫폼 프레임워크)

> 작성: Frontend 조이레

### 선정 배경
iOS·Android·Web 세 플랫폼을 단일 코드베이스로 제공해야 했습니다. 팀원 전원이 React 경험을 보유해 Dart(Flutter) 학습 비용 없이 바로 개발 진입이 가능했습니다.

### 대안 비교

| 항목 | Flutter | React Native CLI | **React Native + Expo** |
|------|---------|-----------------|------------------------|
| 언어 | Dart (팀 미경험) | JavaScript/TypeScript | JavaScript/TypeScript |
| 웹 지원 | 제한적 (별도 빌드) | 별도 설정 복잡 | `react-native-web` 내장 |
| 빌드 환경 | Flutter SDK 설치 필요 | Xcode/Android Studio 필수 | Expo Go로 QR 즉시 실행 |
| 네이티브 모듈 | 자체 생태계 | 직접 브릿지 작성 | Expo SDK로 추상화 |

### 선정 이유
- **단일 코드베이스** — iOS·Android·Web(평가 데모)을 `app.json`의 `platforms` 설정 하나로 관리
- **Expo SDK** — 카메라(`expo-image-picker`), 문서 선택(`expo-document-picker`) 등 네이티브 기능을 Swift/Kotlin 브릿지 없이 JS에서 직접 호출
- **Expo Go** — Xcode/Android Studio 빌드 없이 QR 코드로 실기기에서 즉시 확인, 코드 변경 후 수초 내 반영
- **`react-native-web`** — 동일 컴포넌트가 웹에서 DOM으로 렌더링되어 Playwright E2E 테스트 실행 기반이 됨

---

## 13. React Navigation (내비게이션)

> 작성: Frontend 조이레

### 선정 배경
하단 탭 4개, Auth·Settings·Home 등 스택 다수, 업로드·약품 후보 선택 모달, 알림 딥링크가 혼재하는 화면 구조를 선언적으로 관리해야 했습니다.

### 대안 비교

| 항목 | Expo Router | **React Navigation** |
|------|-------------|---------------------|
| 라우팅 방식 | 파일 기반 (Next.js 스타일) | 코드 기반 선언형 |
| 타입 안전성 | 자동 생성 | 수동 타입 정의 (`StackParams`) |
| 중첩 네비게이터 | 구조 제약 있음 | `RootStack > Tab > Stack` 자유 중첩 |
| 도입 시점 | 초기 디렉터리 설계 선행 필요 | 기존 구조에 점진적 적용 가능 |

### 선정 이유
- **중첩 구조 명시적 제어** — `RootStack > Main(Tab) > SettingsStack` 형태로 Auth/Onboarding/Main 흐름을 각 스택 단위로 분리, `navigation.reset()`으로 로그인·로그아웃 시 스택 초기화
- **타입 안전 파라미터** — `SettingsStackParams`, `RootStackParams` 등 화면 간 전달 파라미터를 TypeScript로 정의, 잘못된 파라미터 타입을 컴파일 시점에 차단
- **Expo Router 대비** — 파일 기반 라우팅은 스프린트 진행 중 중간 도입 시 전체 디렉터리 재구성이 필요해 선택하지 않음

---

## 14. Axios (HTTP 클라이언트)

> 작성: Frontend 조이레

### 선정 배경
API 호출 전반에 공통 설정(baseURL, 토큰 인증, 에러 처리)을 일관되게 적용해야 했습니다.

### 대안 비교

| 항목 | fetch API | **Axios** |
|------|-----------|----------|
| 인터셉터 | 별도 래퍼 구현 필요 | 요청·응답 인터셉터 내장 |
| 자동 JSON 변환 | 수동 `.json()` 호출 필요 | 자동 처리 |
| 에러 처리 | 4xx/5xx 수동 분기 필요 | `response.status` 자동 throw |
| 요청 취소 | AbortController 직접 관리 | CancelToken / AbortSignal 지원 |

### 선정 이유
- **인터셉터** — `client.ts`에서 요청 시 Access Token 자동 주입, 401 응답 시 토큰 갱신 후 재시도를 한 곳에서 처리
- **에러 표준화** — `extractApiError()` 헬퍼와 조합해 API 에러 메시지를 전 화면에서 일관되게 표시
- fetch 대비 보일러플레이트 감소 — JSON 직렬화·역직렬화, 상태 코드 분기를 반복 작성하지 않아도 됨

---

## 15. NetInfo (오프라인 감지)

> 작성: Frontend 조이레

### 선정 배경
모바일 환경 특성상 네트워크 단절 시 사용자에게 즉시 안내가 필요했습니다.

### 선정 이유
- `useNetworkStatus` 훅으로 네트워크 상태를 구독, 오프라인 전환 시 앱 상단에 배너 즉시 표시
- Expo 공식 권장 라이브러리로 iOS·Android·Web 모두 동일한 API로 동작
- `addEventListener` 기반 실시간 감지 — 폴링 없이 연결 상태 변화를 즉각 반영

---

## 16. TypeScript + ESLint/Prettier (타입·코드 품질)

> 작성: Frontend 조이레

### 선정 배경
여러 명이 동시에 작업하는 환경에서 API 응답 타입 불일치, `useEffect` 의존성 누락, 포맷 차이로 인한 불필요한 diff를 사전에 제거해야 했습니다.

### 선정 이유
- **TypeScript** — `types.ts`에 API 응답 구조를 정의해 서버 응답 필드 변경 시 컴파일 오류로 즉시 감지, PR마다 `npx tsc --noEmit` 통과를 체크리스트 필수 항목으로 운용
- **ESLint** — `react-hooks/exhaustive-deps`로 `useEffect` 클로저 내 의존성 누락을 커밋 전에 감지, ESLint v9 flat config 전환 (PR #134)
- **Prettier** — 들여쓰기·따옴표·세미콜론 등 포맷을 저장 시 자동 통일, PR 리뷰에서 스타일 지적 없이 로직 변경에만 집중

---

## 17. Playwright (E2E 테스트)

> 작성: Frontend 조이레

### 선정 배경
업로드→OCR→가이드 핵심 플로우와 인증 흐름의 회귀를 자동으로 감지하기 위해 E2E 테스트를 도입했습니다. React Native Web 타겟으로 브라우저에서 실행 가능한 환경을 활용했습니다.

### 대안 비교

| 항목 | Detox | Cypress | **Playwright** |
|------|-------|---------|---------------|
| 실행 환경 | 실기기/에뮬레이터 | 브라우저 | 브라우저 (Chromium 등) |
| React Native 지원 | 네이티브 전용 | 웹 전용 | 웹(RN Web) 타겟 |
| CI 통합 | 에뮬레이터 필요 | 헤드리스 지원 | 헤드리스 지원 |
| 설정 복잡도 | 높음 (iOS/Android SDK) | 낮음 | 낮음 |
| 다중 브라우저 | 불가 | Chrome 중심 | Chromium·Firefox·Safari |

### 선정 이유
- **RN Web 기반 실행** — 실기기/에뮬레이터 없이 `expo web` 타겟으로 CI에서 헤드리스 실행 가능
- **Detox 대비** 설정 비용이 낮음 — iOS/Android SDK 없이 TC 작성에 바로 집중 가능
- `page.route()` mock으로 LLM 응답 비결정성으로 인한 테스트 flakiness 제거 — 가이드 생성·챗봇 시나리오를 외부 API 호출 없이 고정 응답으로 재현 (PR #136)
- TC-02~30 중 23개 통과, 회귀 방지 기반 마련 (PR #136, #138)

---

## 비고 — 설치됐으나 미사용 패키지

| 패키지 | 상태 | 비고 |
|--------|------|------|
| `@tanstack/react-query` | 설치됨, 미사용 | 서버 상태 관리 라이브러리. 현재 `useState + useEffect` 직접 방식으로 운용 중. 도입 시 캐싱·중복 요청 제거 등 이점이 있으나 전면 리팩토링 필요 — 데모데이 이후 검토 권장 |
