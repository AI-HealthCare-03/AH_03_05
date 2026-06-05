# MediPT 기술 스택 선정 근거

> 작성일: 2026-06-05 | 작성자: Backend A 돈유정

---

## 1. PostgreSQL (RDBMS)

### 선정 배경
초기 MySQL로 시작했으나 Sprint 2에서 PostgreSQL로 전환했습니다. (PR #51)

### 선정 이유

**기술적 이유**
- JSON/배열 필드 네이티브 지원 — `alarm_times`, `medications` 등 배열 데이터를 별도 테이블 없이 컬럼으로 관리 가능
- `asyncpg` 드라이버 — Python async 환경에서 MySQL 대비 높은 성능
- Tortoise ORM + aerich 마이그레이션 도구와의 호환성 — MySQL 대비 안정적인 마이그레이션 지원

**운영 이유**
- AWS RDS PostgreSQL — 프로덕션 환경 배포 계획에 맞춘 선택
- `JSONB` 인덱싱 지원으로 향후 확장 시 쿼리 성능 확보 가능

---

## 2. Redis (인메모리 데이터 스토어)

### 선정 배경
인증·보안 관련 단기 상태 관리 용도로 도입했습니다. (PR #62)

### 선정 이유

**기능적 이유**
- TTL(Time To Live) 기반 자동 만료 — 인증 코드, cooldown 등 시간 제한이 있는 데이터 관리에 적합
- 빠른 읽기/쓰기 — 로그인 시도 횟수 카운터처럼 매 요청마다 접근하는 데이터에 DB 부하를 주지 않음

**실제 활용 사례**

| 기능 | Redis 키 | TTL |
|------|----------|-----|
| 로그인 실패 잠금 | `login_fail:{email}` | 10분 |
| 비밀번호 재설정 코드 | `pw_reset:{email}` | 10분 |
| 비밀번호 재설정 cooldown | `pw_reset_cooldown:{email}` | 60초 |
| 비밀번호 변경 실패 잠금 | `pw_change_fail:{email}` | 10분 |
| 이메일 인증 코드 | `email_verify:{email}` | 10분 |
| 이메일 인증 cooldown | `email_verify_cooldown:{email}` | 60초 |

**DB 대비 장점**
- 위 데이터들은 영구 보존이 불필요하고, 만료 후 자동 삭제되어야 함
- PostgreSQL에 저장 시 주기적 cleanup 배치가 필요하지만 Redis TTL로 자동 처리

---

## 3. FastAPI (웹 프레임워크)

### 선정 이유
- Python async 네이티브 지원 — LLM 호출, DB I/O 등 I/O 바운드 작업에 적합
- 자동 Swagger 문서 생성 — API 명세 관리 및 FE 연동 시 즉시 확인 가능
- Pydantic 기반 DTO 검증 — 입력값 자동 검증으로 안전한 API 구현

---

## 4. Tortoise ORM + aerich

### 선정 이유
- FastAPI async 환경에 최적화된 비동기 ORM
- aerich — Django의 migration 시스템과 유사한 체계적 마이그레이션 관리
- 팀 전체가 `aerich upgrade` 한 번으로 DB 동기화 가능 (docs/database/migration-guide.md 참고)
