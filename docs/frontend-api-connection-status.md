# 화면별 API 연결 현황

> 2026-06-06 · 조이레 (서버 및 코드 전수 대조 — 엔드포인트 오류 수정·누락 항목 추가)

## 연결 완료

| 화면 | API |
|------|-----|
| 로그인 | `POST /auth/login` |
| 회원가입 | `POST /auth/signup` · `POST /auth/email-verify/send-code` · `POST /auth/email-verify/verify-code` |
| 비밀번호 재설정 | `POST /auth/password-reset/request` · `POST /auth/password-reset/confirm` |
| 로그아웃 | `POST /auth/logout` |
| 설정 | `GET /users/me` · `PATCH /users/me` |
| 비밀번호 변경 | `PATCH /users/me/password` |
| 약관 동의 내역 | `GET /users/me/consents` · `PATCH /users/me/consents/{type}` |
| 회원탈퇴 | `DELETE /users/me` |
| 알림 설정 | `GET /notification-settings` · `PUT /notification-settings` |
| 약물 알람 설정 | `GET /medications/alarms` · `PATCH /medications/{id}/alarm` |
| 기기 관리 | `DELETE /users/me/devices` |
| 온보딩 | `PUT /health-profile` |
| 홈 | `GET /notifications/unread-count` · `GET /notifications` · `GET /records` |
| 업로드 모달 | `POST /records` · `POST /records/manual-input` |
| OCR 처리 중 | `POST /ocr/jobs` · `GET /processing-jobs/{id}` |
| OCR 결과 | `GET /records/{id}/ocr-result` · `PATCH /records/{id}/ocr-text` |
| 약품 후보 선택 | `PATCH /medications/{id}/verify` · `POST /records/{id}/medications/verify` |
| 약품 복용법 저장 | `PATCH /medications/{id}` |
| 약품 검색 | `GET /drugs/search` |
| 진료기록 목록 | `GET /records` |
| 진료기록 상세 | `GET /records/{id}` · `GET /records/{id}/medications` · `GET /records/{id}/guide` · `DELETE /records/{id}` |
| 약품 상세 | `GET /drugs/{id}` |
| 가이드 생성 중 | `POST /guides/generate` · `GET /processing-jobs/{id}` |
| 가이드 결과 | `GET /guides/{id}` |
| 챗봇 목록 | `GET /chat/sessions` · `POST /chat/sessions` · `DELETE /chat/sessions/{id}` |
| 챗봇 대화 | `GET /chat/sessions/{id}/messages` · `POST /chat/sessions/{id}/messages` · `POST /feedbacks` · `GET /rag/search` |
| 알림 목록 | `GET /notifications` · `PATCH /notifications/{id}/read` · `PATCH /notifications/read-all` · `DELETE /notifications/{id}` |
| 건강정보 수정 | `GET /health-profile` · `PUT /health-profile` |
| 피드백 통계 | `GET /feedbacks/summary` |

## P2 — EmptyState 처리

| 화면 | 사유 |
|------|------|
| 건강 프로필 변경 이력 | `GET /health-profile/history` BE 미구현 — EmptyState 표시 |
| 홈 복약 달력 | 복약 API 미구현 — EmptyState 표시 |
