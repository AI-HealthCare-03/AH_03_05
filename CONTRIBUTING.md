# Contributing Guide

MediPT(AH_03_05) 협업 가이드. 멘토 피드백(2026-05-23) 반영.

---

## 브랜치 전략

### 브랜치 종류
- main: 운영 배포 기준 (보호 브랜치)
- develop: 개발 통합 (보호 브랜치, 모든 PR 베이스)
- feature/*: 기능 개발
- hotfix/*: 운영 긴급 패치
- release/*: 릴리즈 준비

### 네이밍
- 형식: feature/주제-간단설명
- 예시: feature/test-mocking-llm, feature/ci-codecov
- 영문 소문자 + 하이픈, 한글 금지

---

## 커밋 메시지

Conventional Commits 준수 (https://www.conventionalcommits.org/).

형식: type: subject + 빈 줄 + body

### 타입
- feat: 새 기능
- fix: 버그 수정
- refactor: 리팩토링 (동작 변경 없음)
- test: 테스트 추가/수정
- ci: CI/CD 설정
- docs: 문서
- chore: 잡일 (의존성 업데이트 등)
- build: 빌드 시스템, 마이그레이션

한국어로 작성 가능. type만 영문.

---

## PR 룰

### 기본 원칙
1. develop을 base로 PR을 올린다 (main 직접 PR 금지)
2. CI 통과 후 리뷰 요청 (lint, test 둘 다 녹색)
3. 최소 1명 이상 Approve 후 머지
4. Squash and merge 권장

### PR 본문 4단 구조
- 작업 배경: 왜 필요한가 (이슈 번호, 멘토 피드백 등)
- 변경 사항: 파일별로 무엇이 어떻게 바뀌었는지
- 검증: 어떻게 확인했는가 (테스트 결과, Before/After)
- 비고: 후속 작업, 알아둘 점

### 리뷰어 지정
- 백엔드 PR: 다른 백엔드 멤버 최소 1명
- AI/Infra PR: 정훈님 + 백엔드 1명
- 프론트엔드 PR: 이레님 + 관련 백엔드 1명

---

## 마이그레이션 PR 워크플로우

멘토 피드백(2026-05-23): "마이그레이션을 어떻게 잘 할 수 있을지" / 버즈빌 방식.

### 원칙
1. DB 스키마 변경이 포함된 기능은 마이그레이션 스크립트를 같은 PR에 포함
2. PR 제목에 build: 또는 feat(db): 등 DB 변경임을 명시
3. PR 본문에 다음 반드시 포함:
   - 어떤 테이블/컬럼이 변경되는지
   - 기존 dev 환경 동기화 방법 (aerich migrate, aerich upgrade)
   - 롤백 방법 (필요 시)

### 예시 (PR #51 PostgreSQL 전환)
- DB driver: asyncmy 제거, asyncpg 추가
- 새 마이그레이션 파일 추가
- 기존 dev 환경 절차: mysql 컨테이너 중단 -> postgresql 기동 -> aerich upgrade

---

## 테스트 정책

멘토 피드백(2026-05-23): "테스트코드에서는 외부 모듈에 의존해서는 X"

### 외부 의존 처리
외부 API/서비스(OpenAI, 식약처, 결제 등)를 호출하는 코드의 테스트는 반드시 mocking으로 처리한다.

### 기존 적용 사례 (PR #52)
tests/integration/conftest.py의 mocker fixture 참고. OpenAI client.chat.completions.create를 mocker.patch로 대체한 패턴.

### 새 외부 의존 추가 시
1. tests/integration/fixtures/에 응답 샘플 추가
2. tests/integration/conftest.py에 fixture 등록
3. 테스트에서 fixture 주입

### 테스트 실행
- 단위 테스트: uv run pytest app/tests/
- 통합 테스트: uv run pytest tests/integration/
- 커버리지: uv run coverage run --source=app -m pytest app tests

---

## Codecov

멘토 피드백(2026-05-23): "code cov 같은 툴 연동 + 뱃지 추가"

CI에서 자동으로 커버리지를 측정해 Codecov에 업로드. PR마다 커버리지 변동이 코멘트로 표시됨. 신규 코드는 가능하면 커버리지가 떨어지지 않도록 테스트 함께 작성.

---

## 개발 환경

- Python 3.13+
- uv (패키지 매니저)
- Docker + Docker Compose
- 자세한 설치는 README.md 참고

### 로컬 실행
- uv sync
- uv run uvicorn app.main:app --reload

### 코드 스타일
- 포맷터/린터: Ruff
- uv run ruff format .
- uv run ruff check .
- PR 전 반드시 둘 다 통과

---

## 질문 / 논의

- 코드 리뷰: GitHub PR
- 일반 논의: 디스코드
- 큰 결정(인프라, 외부 서비스 도입 등): 팀 회의
