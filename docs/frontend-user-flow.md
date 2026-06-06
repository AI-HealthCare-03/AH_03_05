# 프론트엔드 사용자 흐름 정리

> 기준일: 2026-06-06 · 담당: 조이레

## 핵심 플로우

### 1. 회원가입 → 온보딩
```
로그인 화면
  → 회원가입 버튼
    → SignupScreen (이메일 인증 → 약관 동의 → 가입)
      → OnboardingScreen (건강정보 입력 or 건너뛰기)
        → HomeScreen
```

### 2. 의료 문서 업로드 → OCR → 가이드 생성 (핵심 플로우)
```
HomeScreen or RecordListScreen
  → + 업로드 버튼
    → UploadModalScreen (문서 유형 선택 + 사진/PDF/직접입력)
      → OCRProcessingScreen (폴링: GET /processing-jobs/{id})
        → OCRResultScreen (약품 확인/수정, OCR 텍스트 수정)
          → DrugDosageScreen (약품 후보 선택, 복용법 입력)
            → GuideLoadingScreen (폴링: GET /processing-jobs/{id})
              → GuideResultScreen (가이드 확인, 피드백)
                → ChatSessionScreen (챗봇 질문하기)
```

### 3. 챗봇 상담
```
ChatListScreen
  → + 새 상담 버튼 → ChatSessionScreen (신규)
  → 세션 카드 탭   → ChatSessionScreen (기존 대화 이어보기)
GuideResultScreen
  → 챗봇 질문하기 버튼 → ChatSessionScreen (가이드 연결)
```

### 4. 진료기록 조회
```
RecordListScreen
  → 기록 카드 탭
    → RecordDetailScreen (OCR 원문, 약품 목록, 가이드 바로가기)
      → DrugDetailScreen (약품 상세)
      → GuideResultScreen (가이드 보기)
```

### 5. 마이페이지 설정
```
SettingsScreen
  → 건강 프로필 수정  → HealthProfileEditScreen
  → 비밀번호 변경     → PasswordChangeScreen
  → 알림 설정        → NotificationSettingsScreen
  → 기기 관리        → DeviceManagementScreen
  → 약관 동의 내역   → ConsentHistoryScreen
  → 회원탈퇴         → DeleteAccountScreen
```

### 6. 알림 딥링크
```
NotificationsScreen
  → 가이드 완료 알림 탭 → GuideResultScreen (guideId)
  → OCR 완료 알림 탭   → OCRResultScreen (recordId)
```

## 화면 접근 단계 수

| 기능 | 단계 수 |
|------|---------|
| 홈 진입 | 1단계 (탭) |
| 업로드 → OCR → 가이드 | 6단계 |
| 챗봇 신규 상담 | 2단계 |
| 진료기록 상세 | 2단계 |
| 건강정보 수정 | 2단계 |

## 예외/에러 처리 흐름

| 상황 | 처리 |
|------|------|
| 로그인 5회 실패 | 계정 잠금 안내 |
| OCR 처리 실패/타임아웃 | 실패 화면 + 재시도 |
| 가이드 생성 실패 | 실패 화면 + 재시도 |
| 파일 형식 오류 | 업로드 모달 인라인 에러 |
| 파일 10MB 초과 | 업로드 모달 인라인 에러 |
| 네트워크 오프라인 | 전역 오프라인 배너 |
| 인증 만료 | 자동 토큰 갱신 → 실패 시 로그인으로 이동 |
| 챗봇 안전 응답 | ⚠️ 강조 말풍선 표시 |
