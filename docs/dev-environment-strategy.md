# 개발 환경 분리 설계 (초안)

멘토 피드백(2026-05-23) 반영을 위한 협의용 초안.
정훈님(AI/Infra) 검토 후 팀 합의 거쳐 확정 예정.

---

## 배경

### 멘토 발언

- "dev 환경 분리를 하자 (table 별도 or db 별도)"
- "prod / dev / staging 환경 분리"
- "AWS RDS, ElastiCache, EC2 + Docker"

### 현재 상태

- Env enum 정의는 있음 (LOCAL, DEV, PROD)
- envs/example.local.env, envs/example.prod.env 두 개만 존재
- dev 환경 파일 없음
- docker-compose는 하나만 (환경별 분리 X)
- DB 분리 전략 미정

---

## 환경 정의 (제안)

| 환경 | 용도 | 인프라 |
|---|---|---|
| LOCAL | 개발자 PC | Docker Compose (mysql, redis 컨테이너) |
| DEV | 통합 테스트, PR 자동 배포용 | AWS EC2 + Docker / 또는 RDS 공유 |
| STAGING | 운영 직전 검증, 멘토 시연용 | AWS RDS + ElastiCache + EC2 |
| PROD | 실 사용자 | AWS RDS + ElastiCache + EC2 + 도메인 |

현재 코드의 Env enum에는 STAGING이 없음. 추가 여부 결정 필요.

---

## DB 분리 옵션

### 옵션 A: DB 인스턴스 자체를 분리

- LOCAL: 각자 PC의 docker postgres
- DEV: AWS RDS dev-instance
- STAGING: AWS RDS staging-instance
- PROD: AWS RDS prod-instance

장점: 환경 간 격리 강함, 운영 데이터 안전
단점: 비용 증가 (RDS 3개), 학원 비용 제한 영향
멘토 언급: "db 별도"에 해당

### 옵션 B: DB 인스턴스 1개, schema(database) 별도

- LOCAL: medipt_local
- DEV: medipt_dev (같은 RDS 인스턴스)
- STAGING: medipt_staging
- PROD: medipt_prod

장점: RDS 1개로 비용 절감
단점: 한 인스턴스 장애 시 모든 환경 영향, 권한 관리 복잡
멘토 언급: "table 별도 or db 별도" 중 db(스키마) 별도

### 옵션 C: 절충안 (추천)

- LOCAL: Docker 컨테이너 (각자)
- DEV + STAGING: RDS 1개 인스턴스, schema 별도 (medipt_dev, medipt_staging)
- PROD: 독립 RDS 인스턴스

비용 효율적이면서 운영 안전성 확보.

---

## Redis 분리

- LOCAL: Docker 컨테이너 (각자)
- DEV/STAGING: ElastiCache 1개 인스턴스, DB 번호(0~15)로 분리
- PROD: ElastiCache 독립 인스턴스

---

## 외부 API 키 관리

### 현재 문제

- .env에 평문 저장
- 정훈님 OpenAI 키가 jupyter 노트북에 노출됐던 이력
- prod 배포 시 키 어떻게 주입할지 결정 안 됨

### 제안

- LOCAL/DEV: .env 파일 (기존)
- STAGING/PROD: AWS Secrets Manager 또는 SSM Parameter Store
- 키는 환경별로 별도 발급 (LOCAL 키 vs PROD 키 분리)

---

## docker-compose 분리 (제안)

파일 구조:
- docker-compose.yml          베이스 (공통)
- docker-compose.local.yml    로컬 오버라이드
- docker-compose.prod.yml     prod 오버라이드 (EC2 배포용)

실행 예시:
- 로컬: docker compose -f docker-compose.yml -f docker-compose.local.yml up
- prod: docker compose -f docker-compose.yml -f docker-compose.prod.yml up

---

## 환경 파일 정리 (제안)

envs/
- example.local.env       기존 유지
- example.dev.env         신규 (AWS dev 인프라 변수)
- example.staging.env     신규
- example.prod.env        기존 유지 (보완 필요)

각 example 파일에 누락된 필수 키 추가:
- MFDS_API_KEY
- OPENAI_API_KEY

---

## 결정 사항

> 2026-05-26 정훈님 리뷰 반영하여 업데이트.

| # | 항목 | 결정 | 비고 |
|---|---|---|---|
| 1 | STAGING 환경 도입 여부 | 미도입 | 배포 단계에서 재논의 |
| 2 | DB 분리 옵션 | C안 채택 | LOCAL Docker / DEV+STAGING 공유 RDS+schema / PROD 독립 RDS |
| 3 | AWS 자원 신청 주체 | 확인 대기 | 조교님께 학원 지원 여부 확인 후 결정 |
| 4 | Secrets Manager 도입 시점 | 사전 구축 | Git Secrets로 충분하나 배포 전 안전망 확보 권장 |
| 5 | 마이그레이션 적용 자동화 | CI 자동화 | PR 머지 시 aerich upgrade 자동 실행 |

---

## 권장 진행 순서

1. ~~이 문서 검토 (정훈님 + 백엔드 팀)~~ ✅ 완료 (2026-05-25 ~ 26)
2. ~~결정 사항 5개 합의~~ ✅ 4/5 완료 (AWS 자원 신청만 보류)
3. example.dev.env, example.staging.env 작성 (별도 PR)
4. docker-compose 분리 (별도 PR)
5. AWS 인프라 신청 / 구축 (정훈님 주도)
6. CI 배포 자동화 (이후 PR)

---

## 참고

- 멘토링 5/23 자료: docs/5조_멘토링.pdf (해당 있을 경우)
- 12-Factor App 원칙: https://12factor.net/config
- Buzzvill 마이그레이션 방식: https://tech.buzzvil.com/
