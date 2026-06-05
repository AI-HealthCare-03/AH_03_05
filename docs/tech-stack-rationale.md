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