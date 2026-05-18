# MediPT LLM 출력 형식 정의서
> 작성일: 2026-05-13 | 버전: v1.0

---

## 1. 가이드 생성 응답

### 요청 경로
POST /api/v1/guides/generate

### 응답 형식

{
  "guide_id": 5,
  "status": "COMPLETED",
  "data_source": {
    "type": "REALTIME",
    "timestamp": "2026-05-13T09:41:00Z",
    "notice": "식약처 API에 접속 성공하여 현재 시각 기준으로 생성된 정보예요."
  },
  "medication_guide": "복약 안내 본문 (평문)",
  "lifestyle_guide": "생활습관 가이드 본문 (평문)",
  "warning_message": null,
  "disclaimer": "본 안내는 의료 진단을 대체하지 않아요. 증상 변화나 이상 반응이 있으면 반드시 의료기관을 방문해주세요.",
  "guide_items": [
    {
      "item_type": "MEDICATION",
      "title": "복용 방법",
      "content": "...",
      "sort_order": 1,
      "guideline_source_id": null
    },
    {
      "item_type": "LIFESTYLE",
      "title": "식이 관리",
      "content": "...",
      "sort_order": 2,
      "guideline_source_id": 1
    },
    {
      "item_type": "WARNING",
      "title": "주의사항",
      "content": "...",
      "sort_order": 3,
      "guideline_source_id": null
    }
  ]
}

### 캐시 사용 시 (식약처 API 실패)

{
  "guide_id": 5,
  "status": "COMPLETED",
  "data_source": {
    "type": "CACHE",
    "timestamp": "2026-05-10T14:22:00Z",
    "notice": "실시간 정보를 불러올 수 없어요. 캐시 기준 시각(2026-05-10 14:22)의 정보예요."
  },
  ...동일 구조
}

### item_type 정의

| 값          | 의미           |
|-------------|----------------|
| MEDICATION  | 복약 안내 항목  |
| LIFESTYLE   | 생활습관 항목   |
| WARNING     | 주의·금기 항목  |

---

## 2. 챗봇 응답

### 요청 경로
POST /api/v1/chat/sessions/{session_id}/messages

### 일반 응답

{
  "message_id": 25,
  "sender_type": "assistant",
  "content": "답변 본문 (평문)",
  "safety_flag": false,
  "safety_notice": null,
  "ai_disclaimer": "해당 답변은 AI에 의해 생성되었습니다. 복약 혹은 전문적인 상담이 필요한 경우엔 반드시 의사와 상담하세요.",
  "prompt_version": "v1.0",
  "created_at": "2026-05-13T09:41:05Z"
}

### 안전 응답 (위험 질문 감지)

{
  "message_id": 26,
  "sender_type": "assistant",
  "content": "복약 변경·중단 여부는 반드시 담당 의사와 상담해주세요.",
  "safety_flag": true,
  "safety_notice": "담당 의사 또는 약사에게 직접 문의해주세요.",
  "ai_disclaimer": "해당 답변은 AI에 의해 생성되었습니다. 복약 혹은 전문적인 상담이 필요한 경우엔 반드시 의사와 상담하세요.",
  "prompt_version": "v1.0",
  "created_at": "2026-05-13T09:41:05Z"
}

---

## 3. 공통 규칙

### ai_disclaimer 표시 기준
- 챗봇 모든 응답에 항상 포함
- 프론트에서 별도 UI 영역에 상시 표시 권장

### data_source.notice 표시 기준
- REALTIME: "식약처 API에 접속 성공하여 현재 시각 기준으로 생성된 정보예요."
- CACHE:    "실시간 정보를 불러올 수 없어요. 캐시 기준 시각(YYYY-MM-DD HH:mm)의 정보예요."

### disclaimer 포함 기준
- 가이드 생성 응답에 항상 포함
- LLM 프롬프트에서 강제 출력
- 없을 경우 서버에서 기본값 삽입

---

## 4. 비동기 응답 (타임아웃 시)

{
  "job_id": 23,
  "status": "PENDING",
  "message": "가이드 생성이 지연되고 있어요. 완료되면 알림을 드릴게요."
}

---

## 변경 이력

| 버전  | 날짜       | 내용        |
|-------|------------|-------------|
| v1.0  | 2026-05-13 | 최초 작성    |
