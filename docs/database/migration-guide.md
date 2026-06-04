# MediPT 마이그레이션 가이드

> 작성일: 2026-05-19 | 최종 수정: 2026-05-27 | 작성자: Backend A 돈유정

---

## 1. 마이그레이션이란?

DB 테이블 구조 변경을 코드로 관리하는 것입니다.
팀원들이 `aerich upgrade` 한 번으로 DB를 동기화할 수 있어요.

**흐름**
```
모델 파일 수정 (app/models/*.py)
        ↓ aerich migrate
마이그레이션 파일 생성 (app/core/db/migrations/models/*.py)
        ↓ git push
팀원 git pull 후 aerich upgrade
        ↓
팀원 DB에 자동 반영
```

---

## 2. 현재 상황

- ✅ PostgreSQL로 전환 완료 (2026-05-24, `feature/backenda-migrate-postgresql`)
- ✅ aerich init-db 초기화 완료
- ✅ 로그인/회원가입 동작 확인 완료

---

## 3. 브랜치 전략

- **초기화**: `feature/backenda-migrate-postgresql` 브랜치에서 완료
- **이후 컬럼 추가**: 각 기능 브랜치에서 마이그레이션 파일 포함해서 커밋
  - 예: `feature/backenda-auth-2`에서 `password_changed_at` 추가 시 마이그레이션 파일도 같이 커밋

---

## 4. PR 머지 후 팀원 필수 작업 (최초 1회)

> ⚠️ `feature/backenda-migrate-postgresql` PR 머지 후 팀원 각자 아래 작업 필요!

### 변경된 파일 목록

```
# docker-compose.yml
mysql → postgresql (서비스명, 이미지, 환경변수, 볼륨, depends_on)

# pyproject.toml
asyncmy>=0.2.11 → asyncpg>=0.30.0

# app/core/db/databases.py
engine: tortoise.backends.mysql → tortoise.backends.asyncpg
dialect: asyncmy → asyncpg
connect_timeout → command_timeout

# app/core/config.py
DB_PORT: int = 3306 → DB_PORT: int = 5432
```

### 실행 순서

**A. `.env` 직접 수정 (git에 올라가지 않아요 / 필수)**
```
DB_HOST=postgresql
DB_PORT=5432
DB_EXPOSE_PORT=5433
```

**B. 패키지 업데이트**
```bash
uv sync --group app
```

**C. 기존 MySQL 컨테이너/볼륨 삭제 후 재빌드**
```bash
docker compose down -v
docker compose up -d --build
```

**D. 기존 마이그레이션 폴더 삭제 후 aerich 초기화**
```bash
rm -rf app/core/db/migrations/models
DB_HOST=localhost DB_PORT=5433 uv run --group app aerich init-db
```

**E. PostgreSQL 기본 DB 생성 (테스트 실행 위해 필요)**
```bash
docker exec -it postgresql psql -U ozcoding -d ai_health -c "CREATE DATABASE ozcoding;"
```

> ✅ 완료 확인: 회원가입/로그인 정상 동작 여부 확인

---

## 5. 이후 모델 변경할 때마다

> ✅ 기존 데이터는 유지됩니다. 새 컬럼은 NULL로 채워집니다.

```bash
# 1. 모델 파일 수정 (예: app/models/users.py에 nickname_updated_at 추가)

# 2. 마이그레이션 파일 생성
DB_HOST=localhost DB_PORT=5433 uv run --group app aerich migrate --name add_nickname_updated_at

# 3. 내 DB에 적용
DB_HOST=localhost DB_PORT=5433 uv run --group app aerich upgrade

# 4. 마이그레이션 파일 포함해서 커밋/푸시
git add app/core/db/migrations/
git commit -m "🗃️ db: nickname_updated_at 컬럼 추가"
git push
```

---

## 6. 팀원들이 할 것 (마이그레이션 파일 포함된 PR 머지 후)

> ✅ 로컬 환경: `docker compose up -d --build fastapi` 시 자동 적용됨 (별도 실행 불필요)

prod 환경은 배포 후 수동 실행 필요:
```bash
DB_HOST=postgresql DB_PORT=5432 uv run --group app aerich upgrade
```

---

## 7. 팀원별 컬럼 추가 예정 목록

| 담당 | 테이블 | 컬럼 | 용도 | 확인 |
|------|--------|------|------|------|
| Backend A (돈유정) | `users` | `nickname_updated_at` | 닉네임 30일 변경 제한 | ✅ |
| Backend A (돈유정) | `users` | `password_changed_at` | access_token 즉시 무효화 | ✅ |
| Backend B (신정호) | `medications` | `alarm_times`, `is_alarm_enabled` | 맞춤형 복용 알림 관리 | ✅ |
| AI/Infra (이정훈) | - | - | 추가 예정 사항 확인 필요 | ⬜ |
| Frontend (조이레) | - | - | 해당 없음 | ✅ |

---

## 8. 멘토님/팀 결정 사항

| 항목 | 내용 | 현황 |
|------|------|------|
| 로컬 DB | PostgreSQL 전환 완료 | ✅ 완료 |
| 운영 DB | AWS RDS PostgreSQL 예정 | 추후 진행 |
| 마이그레이션 초기화 | aerich init-db 완료 | ✅ 완료 |
| 브랜치 전략 | 기능 브랜치에 마이그레이션 파일 포함 | ✅ 확정 |

---

## 9. 체크리스트

- [x] PostgreSQL 전환 완료
- [x] aerich init-db 초기화 완료
- [x] 로그인/회원가입 동작 확인
- [ ] 팀원 전체 PR 머지 후 환경 설정 업데이트
- [ ] 팀원별 추가 컬럼 마이그레이션 진행

---

## 10. 자주 쓰는 명령어 정리

| 명령어 | 설명 |
|--------|------|
| `aerich init-db` | 최초 초기화 (1회만) |
| `aerich migrate --name 이름` | 마이그레이션 파일 생성 |
| `aerich upgrade` | DB에 마이그레이션 적용 |
| `aerich history` | 마이그레이션 히스토리 확인 |
| `aerich downgrade -v 버전` | 이전 버전으로 롤백 |

```bash
# 테스트 실행
DB_HOST=localhost DB_PORT=5433 uv run --group app pytest
```

---

## 11. 주의사항

- 컬럼 추가 시 반드시 `null=True`로 추가 (기존 데이터 충돌 방지)
- 컬럼 삭제/타입 변경은 기존 데이터에 영향 있으니 팀 논의 후 진행
- 마이그레이션 파일은 반드시 git에 포함해서 커밋
- `aerich upgrade`는 이미 적용된 마이그레이션은 건너뛰므로 중복 실행해도 안전

---

## 12. 초기화 / 리셋 (트러블슈팅)

### 12.1 언제 사용?

로컬 DB를 깨끗하게 새로 시작하고 싶을 때:

- 테스트 데이터가 너무 많이 쌓여서 정리하고 싶을 때
- 마이그레이션 적용 중 이상한 상태가 되어 처음부터 다시 시작하고 싶을 때
- 시연/데모용으로 깨끗한 환경이 필요할 때

### 12.2 신규 개발자는 사용 금지

> ⚠️ 처음 프로젝트를 클론 받은 경우는 이 섹션을 사용하지 **마세요**. README의 빠른 시작 가이드대로 `aerich upgrade`만 실행하시면 레포에 커밋된 마이그레이션 히스토리가 순차적으로 적용됩니다.

### 12.3 실행 순서

```bash
# 1. 컨테이너 + 볼륨 완전 삭제 (로컬 DB 초기화)
docker compose down -v

# 2. 컨테이너 재시작 (POSTGRES_DB=ai_health 환경변수로 ai_health DB 자동 생성됨)
docker compose up -d --build

# 3. 레포 마이그레이션 히스토리를 DB에 적용
DB_HOST=localhost DB_PORT=5433 uv run --group app aerich upgrade
```

### 12.4 주의사항

- 위 명령어들은 **로컬 환경에서만** 사용. dev/prod 환경에서는 절대 실행 금지.
- `docker compose down -v`는 모든 volume을 삭제하니, 보존하고 싶은 데이터가 있다면 백업 후 실행.
- 마이그레이션 파일 자체가 손상되거나 DB 엔진을 전환하는 등 특수 상황은 팀 논의 후 별도 작업으로 진행하세요 (예: PR #51의 PostgreSQL 전환).