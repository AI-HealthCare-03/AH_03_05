# 프론트엔드 화면별 API 연결 현황

> 기준일: 2026-06-06 · 담당: 조이레

| # | 화면명 | 컴포넌트 | 연결 API | 상태 |
|---|--------|----------|----------|------|
| 01 | 로그인 | `LoginScreen` | `POST /auth/login` | ✅ 연결 |
| 02 | 회원가입 | `SignupScreen` | `POST /auth/signup`, `POST /auth/email-verify/send-code`, `POST /auth/email-verify/verify-code` | ✅ 연결 |
| 03 | 설정 (마이페이지) | `SettingsScreen` | `GET /users/me`, `PATCH /users/me` | ✅ 연결 |
| 03-1 | 비밀번호 변경 | `PasswordChangeScreen` | `PATCH /users/me/password` | ✅ 연결 |
| 03-2 | 약관 동의 내역 | `ConsentHistoryScreen` | `GET /users/me/consents`, `PATCH /users/me/consents/{type}` | ✅ 연결 |
| 03-3 | 회원탈퇴 | `DeleteAccountScreen` | `DELETE /users/me` | ✅ 연결 |
| 03-4 | 알림 설정 | `NotificationSettingsScreen` | `GET /notification-settings`, `PATCH /notification-settings` | ✅ 연결 |
| 03-5 | 기기 관리 | `DeviceManagementScreen` | `DELETE /users/me/devices` | ✅ 연결 |
| 03-6 | 건강 프로필 변경 이력 | `HealthProfileHistoryScreen` | `GET /health-profile/history` | ⏳ BE 미구현 (P2) |
| 04 | 건강정보 입력 (온보딩) | `OnboardingScreen` | `PUT /health-profile` | ✅ 연결 |
| 05 | 홈 대시보드 | `HomeScreen` | `GET /notifications/unread-count`, `GET /notifications`, `GET /records` | ✅ 연결 (복약 달력은 더미 — 복약 API 미구현) |
| 06 | 업로드 모달 | `UploadModalScreen` | `POST /records` | ✅ 연결 |
| 07 | OCR 처리 중 | `OCRProcessingScreen` | `GET /processing-jobs/{id}` | ✅ 연결 |
| 08 | OCR 결과 확인/수정 | `OCRResultScreen` | `GET /records/{id}/ocr`, `PATCH /records/{id}/ocr-text` | ✅ 연결 |
| 09 | 약품 후보 선택 | `DrugDosageScreen` | `PATCH /medications/{id}/verify` | ✅ 연결 (복용법 저장은 BE 필드 추가 대기) |
| 10 | 진료기록 목록 | `RecordListScreen` | `GET /records` | ✅ 연결 |
| 11 | 진료기록 상세 | `RecordDetailScreen` | `GET /records/{id}`, `GET /records/{id}/medications`, `GET /records/{id}/guide`, `DELETE /records/{id}` | ✅ 연결 |
| 12 | 약품 상세 | `DrugDetailScreen` | `GET /drugs/{id}` | ✅ 연결 |
| 13 | 가이드 생성 중 | `GuideLoadingScreen` | `POST /guides`, `GET /processing-jobs/{id}` | ✅ 연결 |
| 14 | 가이드 결과 | `GuideResultScreen` | `GET /guides/{id}` | ✅ 연결 |
| 15 | 챗봇 세션 목록 | `ChatListScreen` | `GET /chat/sessions`, `POST /chat/sessions`, `DELETE /chat/sessions/{id}` | ✅ 연결 |
| 16 | 챗봇 대화 | `ChatSessionScreen` → `ChatSessionPane` | `POST /chat/sessions/{id}/messages`, `POST /feedbacks` | ✅ 연결 |
| 17 | 알림 목록 | `NotificationsScreen` | `GET /notifications`, `PATCH /notifications/{id}/read` | ✅ 연결 |
| 18 | 건강정보 수정 | `HealthProfileEditScreen` | `GET /health-profile`, `PUT /health-profile` | ✅ 연결 |

## BE 미구현으로 대기 중인 항목

| 항목 | 사유 | 비고 |
|------|------|------|
| 건강 프로필 변경 이력 (`GET /health-profile/history`) | BE 미구현 (REQ-PROF-002, P2) | — |
| 복약 달력 (`HomeScreen`) | 복약 API 미구현 | 더미 데이터로 표시 중 |
| DrugDosageScreen 복용법 저장 | `PATCH /medications/{id}` 복용법 필드 BE 추가 대기 | TODO 주석으로 문서화됨 |
| standalone 채팅 세션 생성 | `POST /chat/sessions` record_id optional 미지원 (422) | BE 수정 대기 |
