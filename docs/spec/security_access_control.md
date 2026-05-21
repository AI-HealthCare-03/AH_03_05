# 보안 정책 문서 — 사용자별 데이터 접근 제어 (REQ-SEC-001)

## 1. 개요
모든 인증 필요 API는 JWT 토큰에서 추출한 `user_id`와 요청한 리소스의 `user_id`를 비교하여 소유권을 검증한다.
타 사용자 리소스 접근 시 정보 노출 방지를 위해 `404 Not Found`를 반환한다.

---

## 2. 인증 필요 API 목록

| No | Method | Endpoint | 도메인 | 담당 |
|----|--------|----------|--------|------|
| 4 | GET | /api/v1/users/me | 사용자 | Backend A |
| 5 | PUT | /api/v1/health-profile | 건강정보 | Backend B |
| 6 | GET | /api/v1/health-profile | 건강정보 | Backend B |
| 7 | POST | /api/v1/records | 진료기록 | Backend A |
| 8 | GET | /api/v1/records | 진료기록 | Backend A |
| 9 | GET | /api/v1/records/{record_id} | 진료기록 | Backend A |
| 10 | POST | /api/v1/ocr/jobs | OCR | Backend A |
| 11 | GET | /api/v1/records/{record_id}/ocr-result | OCR | Backend A |
| 12 | PATCH | /api/v1/records/{record_id}/ocr-text | OCR | Backend A |
| 13 | PATCH | /api/v1/medications/{medication_id}/verify | 약품 | Backend B |
| 14 | GET | /api/v1/drugs/search | 약품 | Backend B |
| 15 | GET | /api/v1/drugs/{drug_id} | 약품 | Backend B |
| 16 | GET | /api/v1/records/{record_id}/medications | 약품 | Backend B |
| 17 | POST | /api/v1/guides | LLM 가이드 | Backend B |
| 18 | GET | /api/v1/guides/{guide_id} | LLM 가이드 | Backend B |
| 19 | GET | /api/v1/records/{record_id}/guide | LLM 가이드 | Backend B |
| 20 | POST | /api/v1/chat/sessions | 챗봇 | Backend B |
| 21 | GET | /api/v1/chat/sessions | 챗봇 | Backend B |
| 22 | GET | /api/v1/chat/sessions/{session_id}/messages | 챗봇 | Backend B |
| 23 | POST | /api/v1/chat/sessions/{session_id}/messages | 챗봇 | Backend B |
| 24 | GET | /api/v1/processing-jobs/{job_id} | 작업 상태 | Backend A/B |
| 25 | POST | /api/v1/feedbacks | 피드백 | Backend B |
| 26 | GET | /api/v1/notifications | 알림 | Backend A |
| 27 | GET | /api/v1/notifications/unread-count | 알림 | Backend A |
| 28 | PATCH | /api/v1/notifications/{notification_id}/read | 알림 | Backend A |
| 29 | DELETE | /api/v1/notifications/{notification_id} | 알림 | Backend A |
| 33 | PATCH | /api/v1/users/me | 사용자 | Backend A |
| 34 | DELETE | /api/v1/users/me | 사용자 | Backend A |
| 35 | POST | /api/v1/records/manual-input | 진료기록 | Backend A |
| 36 | POST | /api/v1/records/{record_id}/medications | 약품 | Backend B |
| 48 | PATCH | /api/v1/users/me/password | 사용자 | Backend A |
| 49 | GET | /api/v1/users/me/consents | 사용자 | Backend A |
| 50 | PATCH | /api/v1/users/me/consents/{consent_type} | 사용자 | Backend A |
| - | PATCH | /api/v1/notifications/read-all | 알림 | Backend A |

---

## 3. 소유권 검증 방식

### 3.1 검증 흐름
1. `Authorization: Bearer {access_token}` 헤더에서 JWT 추출
2. JWT payload의 `user_id` 추출
3. 요청한 리소스의 `user_id`와 비교
4. 불일치 시 `404 Not Found` 반환 (정보 노출 방지)

### 3.2 구현 위치
- `app/dependencies/security.py` — JWT 검증 및 `user` 객체 반환
- 각 서비스에서 `MedicalRecord.get_or_none(id=record_id, user=user)` 형태로 소유권 검증

### 3.3 탈퇴 사용자 처리
- `users.status = 'withdrawn'` 인 경우 `401 Unauthorized` 반환
- `app/dependencies/security.py`의 `get_request_user`에서 처리

---

## 4. 보안 테스트 케이스

| 테스트 | 시나리오 | 기대 결과 |
|--------|----------|-----------|
| 미인증 접근 | 토큰 없이 인증 필요 API 호출 | 401 |
| 타 사용자 진료기록 조회 | user B가 user A의 record_id로 조회 | 404 |
| 타 사용자 가이드 조회 | user B가 user A의 guide_id로 조회 | 404 |
| 타 사용자 챗봇 세션 접근 | user B가 user A의 session_id로 메시지 전송 | 404 |
| 타 사용자 알림 읽음 처리 | user B가 user A의 notification_id로 읽음 처리 | 404 |
| 탈퇴 사용자 접근 | withdrawn 상태 사용자로 API 호출 | 401 |
