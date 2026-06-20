# MediPT - AI 의료 도우미 백엔드

> AI 기반 의료 영상 분석 및 맞춤형 복약 가이드 서비스 백엔드 API

[![codecov](https://codecov.io/gh/AI-HealthCare-03/AH_03_05/branch/develop/graph/badge.svg)](https://codecov.io/gh/AI-HealthCare-03/AH_03_05)

---

## 📋 프로젝트 소개

MediPT는 사용자가 업로드한 처방전/검사지 이미지를 분석하여 맞춤형 복약·생활습관 가이드를 제공하는 AI 의료 도우미 서비스입니다.

### 주요 기능

- **의료 이미지 OCR 분석**: 처방전/검사지 이미지에서 약품 정보 자동 추출
- **식약처 API 연동**: 추출된 약품의 상세 정보 (성분/제조사/주의사항) 조회
- **LLM 맞춤형 가이드**: 사용자 건강 프로필(연령/만성질환/임신 여부 등) 기반 복약·생활습관 가이드 생성
- **안전 필터 적용 챗봇**: 위험 질문 감지 및 의료기관 권고를 포함한 실시간 상담

---

## 👥 팀 구성

| 역할 | 담당 영역 |
|---|---|
| Backend A | 회원/인증/의료 기록 |
| Backend B | 약품/가이드/챗봇 |
| AI/Infra | OCR 파이프라인, LLM 워커, CI 배포 |
| Frontend | React 기반 UI |

---

## 🏗 기술 스택

### Backend
- **Web Framework**: FastAPI (비동기 API 서버)
- **ORM**: Tortoise ORM (비동기 ORM) + aerich (마이그레이션)
- **Database**: PostgreSQL 16
- **Cache/Session**: Redis 7
- **Authentication**: JWT

### AI/Integration
- **LLM**: OpenAI GPT (복약 가이드 + 챗봇)
- **OCR**: AI Worker (모델 추론 분리)
- **External API**: 식약처(MFDS) 의약품안전나라 API

### DevOps
- **Package Manager**: uv (Python 패키지 관리)
- **Containerization**: Docker / Docker Compose
- **CI**: GitHub Actions (lint + test)
- **Coverage**: Codecov

### Testing
- **Framework**: pytest + pytest-asyncio
- **Mocking**: pytest-mock (외부 API 의존성 mocking)
- **Coverage**: 90%+ 유지

---

## 🚀 빠른 시작

### 사전 요구사항

- Python 3.13+
- Docker & Docker Compose
- uv (`brew install uv` 또는 [공식 설치 가이드](https://docs.astral.sh/uv/))

### 환경 구축

```bash
# 1. 저장소 클론
git clone https://github.com/AI-HealthCare-03/AH_03_05.git
cd AH_03_05

# 2. 환경 변수 설정
cp envs/example.local.env .env
# .env 파일을 열어 OPENAI_API_KEY, MFDS_API_KEY 등 실제 값으로 교체

# 3. 의존성 설치
uv sync --group app

# 4. PostgreSQL + Redis 컨테이너 기동
docker compose up -d --build

# 5. DB 마이그레이션 적용
DB_HOST=localhost DB_PORT=5433 uv run --group app aerich upgrade

# 6. 서버 실행
uv run uvicorn app.main:app --reload --port 8000
```

서버 기동 후 [http://localhost:8000/docs](http://localhost:8000/docs)에서 Swagger 문서 확인 가능.

### 테스트 실행

```bash
# 전체 테스트
DB_HOST=localhost DB_PORT=5433 uv run --group app pytest

# 통합 테스트만 (외부 API mocking 적용, DB 불필요)
uv run --group app pytest tests/integration/

# 커버리지 리포트
DB_HOST=localhost DB_PORT=5433 uv run --group app coverage run --source=app -m pytest app tests
uv run coverage report -m
```

---

## 🔬 주요 트러블슈팅

### 1. OCR 처방전 약품 오분류 (False Positive)
- **증상**: 처방전 이미지 OCR 시 "환자 정보", "조제 일자" 같은 헤더·환자명이 약품으로 등록됨.
- **원인**: 라인 분류 함수(`_classify_line_type`)의 약품 키워드에 단독 `"정"`이 포함되어, "정보"·"정미화"·"코팅 정"의 "정"까지 약품명으로 오인식.
- **해결**: ① 처방전 헤더/메타 키워드 블랙리스트를 최우선 제외 ② `"정"`은 약품명 접미사 패턴일 때만 정규식으로 인식.
- **검증**: 헤더 3종·실제 약품 2종 단위 테스트로 분류 정확도 확인. garbage 약품 생성을 근본 차단.

### 2. 외부 API 장애 격리 (Resilience)
- 식약처 OpenAPI 의존을 Redis 캐싱으로 격리. 외부 API가 503을 반환해도 **캐시된 검색어는 정상 응답**함을 검증 테스트(PR #184)로 증명.

### 3. 동기 → 비동기 전환 성능 개선
- 동기 블로킹 구간을 async로 전환. Locust 측정으로 동시 100건 처리량 **3.3 → 331 req/s (99×)**.

### 4. DB 전환 (MySQL → PostgreSQL)
- pgvector·JSONB·배열/Enum 네이티브 관리를 위해 PostgreSQL 16으로 전환 (PR #51).

---

## 📊 성능·품질 지표

| 항목 | 결과 |
|---|---|
| 동시성 (async 전환) | 3.3 → 331 req/s (99×) |
| 약품 검색 캐싱 | 중앙값 580→7ms, P95 2,000→12ms, 실패율 0% |
| LLM 복약 도메인 품질 (as-judge) | 4.62 / 5.0 |
| 챗봇 안전 필터 | 안전성 3.25 → 4.5 |
| RAG 최적화 | 품질 동등(4.98/5.0), 토큰 73.6% 절감 |
| OCR 신뢰도 (Google Vision) | 0.80+ |
| 누적 머지 PR | 235건 |

## 📂 프로젝트 구조

```text
.
├── ai_worker/                  # AI 모델 추론 워커 (OCR, 학습)
│   ├── core/                   # 워커 설정 및 로거
│   ├── models/                 # AI 모델 파일
│   ├── tasks/                  # 처리할 작업 정의
│   └── main.py                 # 워커 진입점
├── app/                        # FastAPI 서버 코드
│   ├── apis/v1/                # API 라우터
│   ├── core/                   # 서버 설정, DB, JWT, Validator
│   │   └── db/migrations/      # aerich 마이그레이션
│   ├── dtos/                   # Pydantic 요청/응답 DTO
│   ├── models/                 # Tortoise ORM 모델
│   ├── services/               # 비즈니스 로직
│   │   └── safety/             # 안전 필터
│   ├── tests/                  # API 통합 테스트
│   └── main.py                 # FastAPI 진입점
├── tests/integration/          # 외부 의존성 mocking 통합 테스트
│   ├── conftest.py             # OpenAI + MFDS mocking fixture
│   └── fixtures/               # mock 응답 데이터
├── envs/                       # 환경 변수 예시
│   ├── example.local.env
│   └── example.prod.env
├── infra/                      # Docker / Nginx 설정
├── scripts/                    # 배포 및 운영 스크립트
├── docs/                       # 프로젝트 문서
│   ├── api/                    # API 명세
│   ├── spec/                   # 영역별 명세
│   ├── meetings/               # 회의록
│   ├── requirements/           # 요구사항 정의서
│   └── dev-environment-strategy.md
├── CONTRIBUTING.md             # 기여 가이드
├── docker-compose.yml          # 로컬 개발 환경
└── pyproject.toml              # Python 프로젝트 설정
```

---

## 📚 문서

| 문서 | 설명 |
|---|---|
| [CONTRIBUTING.md](./CONTRIBUTING.md) | 브랜치 전략, 커밋/PR 컨벤션, 마이그레이션 워크플로우 |
| [docs/dev-environment-strategy.md](./docs/dev-environment-strategy.md) | dev/staging/prod 환경 분리 전략 |
| [docs/spec/](./docs/spec/) | 영역별 상세 명세 (가이드라인, LLM, 안전, 보안 등) |
| [docs/api/](./docs/api/) | API 명세서 (Excel) |
| [docs/requirements/](./docs/requirements/) | 요구사항 정의서 |

---

## 🔧 개발 참여

본 프로젝트에 기여하실 분은 [CONTRIBUTING.md](./CONTRIBUTING.md)를 먼저 읽어주세요. 브랜치 네이밍, 커밋 메시지 규칙, PR 작성 컨벤션, 마이그레이션 워크플로우 등이 정리되어 있습니다.
