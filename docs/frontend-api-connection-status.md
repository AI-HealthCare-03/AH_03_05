# 화면별 API 연결 현황

> 2026-06-06 · 조이레

## 연결 완료

| 화면 | API |
|------|-----|
| 로그인 | `POST /auth/login` |
| 회원가입 | `POST /auth/signup` · `POST /auth/email-verify/send-code` · `POST /auth/email-verify/verify-code` |
| 설정 | `GET /users/me` · `PATCH /users/me` |
| 비밀번호 변경 | `PATCH /users/me/password` |
| 약관 동의 내역 | `GET /users/me/consents` · `PATCH /users/me/consents/{type}` |
| 회원탈퇴 | `DELETE /users/me` |
| 알림 설정 | `GET /notification-settings` · `PATCH /notification-settings` |
| 기기 관리 | `DELETE /users/me/devices` |
| 온보딩 | `PUT /health-profile` |
| 홈 | `GET /notifications/unread-count` · `GET /notifications` · `GET /records` |
| 업로드 모달 | `POST /records` |
| OCR 처리 중 | `GET /processing-jobs/{id}` |
| OCR 결과 | `GET /records/{id}/ocr` · `PATCH /records/{id}/ocr-text` |
| 약품 후보 선택 | `PATCH /medications/{id}/verify` |
| 진료기록 목록 | `GET /records` |
| 진료기록 상세 | `GET /records/{id}` · `GET /records/{id}/medications` · `GET /records/{id}/guide` · `DELETE /records/{id}` |
| 약품 상세 | `GET /drugs/{id}` |
| 가이드 생성 중 | `POST /guides` · `GET /processing-jobs/{id}` |
| 가이드 결과 | `GET /guides/{id}` |
| 챗봇 목록 | `GET /chat/sessions` · `POST /chat/sessions` · `DELETE /chat/sessions/{id}` |
| 챗봇 대화 | `POST /chat/sessions/{id}/messages` · `POST /feedbacks` |
| 알림 목록 | `GET /notifications` · `PATCH /notifications/{id}/read` |
| 건강정보 수정 | `GET /health-profile` · `PUT /health-profile` |

## BE 대기 중

| 화면 | 사유 |
|------|------|
| 건강 프로필 변경 이력 | `GET /health-profile/history` BE 미구현 (P2) |
| 홈 복약 달력 | 복약 API 미구현 — 더미 표시 중 |
| 약품 후보 선택 복용법 저장 | `PATCH /medications/{id}` 복용법 필드 추가 대기 |
| 챗봇 standalone 세션 생성 | `POST /chat/sessions` record_id optional 미지원 (422) |
