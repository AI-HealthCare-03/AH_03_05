// ─── Common ───────────────────────────────────────────────────────────────────

export type AsyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
export type RecordType = 'prescription' | 'medicine_bag' | 'medical_record' | 'manual';
export type ConsentType = 'terms' | 'privacy' | 'sensitive_health' | 'ai_analysis' | 'marketing';

export interface ApiError {
  detail: string;
  error_code?: string;
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface SignUpRequest {
  email: string;
  password: string;
  name: string;
  nickname: string;
  consents: Array<{ consent_type: ConsentType; is_agreed: boolean }>;
}

export interface SignUpResponse {
  user_id: number;
  email: string;
  required_consents_saved: boolean;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: 'bearer';
  user: { id: number; name: string; nickname: string };
}

export interface LogoutResponse {
  detail: string;
}

export interface EmailVerifySendRequest {
  email: string;
}

export interface EmailVerifySendResponse {
  detail: string;
  retry_after?: number;
}

export interface EmailVerifyConfirmRequest {
  email: string;
  code: string;
}

export interface EmailVerifyConfirmResponse {
  detail: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UserInfo {
  user_id: number;
  email: string;
  name: string;
  nickname: string;
  status: 'active' | 'withdrawn';
  created_at?: string;
}

export interface UpdateUserRequest {
  nickname: string;
}

export interface UserUpdateResponse {
  user_id: number;
  name: string;
  nickname: string | null;
  last_login_at: string | null;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ConsentItem {
  consent_type: ConsentType;
  required_type: string;
  is_agreed: boolean;
  agreed_at?: string;
  revoked_at?: string;
}

export interface ConsentsResponse {
  consents: ConsentItem[];
}

// ─── Health Profile ───────────────────────────────────────────────────────────

export interface HealthProfile {
  profile_id: number;
  age_group?: string;
  gender?: string;
  chronic_diseases: string[];
  allergies: string[];
  current_medications: string[];
  medical_history?: string;
  doctor_opinion?: string;
}

export interface HealthProfileUpdateRequest {
  age_group?: string;
  gender?: string;
  chronic_diseases?: string[];
  allergies?: string[];
  current_medications?: string[];
  medical_history?: string;
  doctor_opinion?: string;
}

export interface HealthProfileUpdateResponse {
  profile_id: number;
  updated_at: string;
}

// ─── Records ──────────────────────────────────────────────────────────────────

export type RecordStatus = 'uploaded' | 'ocr_pending' | 'ocr_completed' | 'ocr_failed';

export interface RecordUploadResponse {
  record_id: number;
  record_type: RecordType;
  file_url: string;
  status: RecordStatus;
  image_expires_at: string;
}

export interface ManualInputResponse {
  record_id: number;
  input_method: string;
  status: string;
}

export interface RecordSummary {
  record_id: number;
  record_type: RecordType;
  status: RecordStatus;
  uploaded_at: string;
  hospital_name?: string;
  medication_count?: number;
}

export interface RecordListResponse {
  items: RecordSummary[];
  page: number;
  size: number;
  total?: number;
}

export interface RecordDetail {
  record_id: number;
  record_type: RecordType;
  status: RecordStatus;
  ocr_confidence?: number;
  uploaded_at?: string;
  hospital_name?: string;
  doctor_name?: string;
  total_days?: number;
  notes?: string;
  file_name?: string;
  file_size?: string;
  file_url?: string;
  content_type?: string;
}

export interface MedicationItem {
  medication_id: number;
  drug_ref_id?: number;
  drug_name: string;
  dosage?: string;
  frequency?: string;
  is_verified: boolean;
}

export interface RecordMedicationsResponse {
  record_id: number;
  medications: MedicationItem[];
}

export interface RecordGuideResponse {
  record_id: number;
  guide_id: number;
  status: AsyncJobStatus;
  summary?: string;
}

// ─── OCR ──────────────────────────────────────────────────────────────────────

export interface OcrJobResponse {
  job_id: number;
  record_id: number;
  job_type: 'ocr';
  status: AsyncJobStatus;
}

export interface MedicationCandidate {
  medication_id?: number;
  drug_name: string;
  confidence: number;
  is_verified: boolean;
  dosage?: string;
  frequency?: string;
  timing?: string;
  caution?: string;
  drug_ref_id?: number;
}

export interface OcrResultResponse {
  record_id: number;
  ocr_text?: string;
  ocr_edited_text?: string;
  ocr_confidence?: number;
  medication_candidates: MedicationCandidate[];
}

export interface OcrTextUpdateRequest {
  ocr_edited_text: string;
}

export interface OcrTextUpdateResponse {
  record_id: number;
  status: RecordStatus;
  updated_at: string;
}

// ─── Processing Jobs ──────────────────────────────────────────────────────────

export interface ProcessingJobResponse {
  job_id: number;
  job_type: 'ocr' | 'guide_generation';
  status: AsyncJobStatus;
  record_id?: number;
  // BE가 채우면 실제 진행률(0~100). 미연동 시 null → FE 자체 진행 표시로 폴백.
  progress?: number | null;
  // OCR 완료 시 결과 record_id(문자열). OCRProcessingScreen이 결과 화면 라우팅 정본으로 소비.
  // 가이드 job은 동기 처리라 채우지 않음(null).
  result_ref?: string | null;
}

export interface GetGuideJobResponse {
  job_id: number;
  guide_id: number;
  status: AsyncJobStatus;
  result?: { guide_id: number };
}

// ─── Drugs & Medications ──────────────────────────────────────────────────────

export interface DrugSearchResult {
  drug_ref_id: number;
  drug_name: string;
  ingredient_name?: string;
  manufacturer?: string;
  source?: string;
}

export interface DrugSearchResponse {
  results: DrugSearchResult[];
  keyword?: string;
  message?: string;
}

export interface DrugDetail {
  drug_ref_id: number;
  drug_name: string;
  ingredient_name?: string;
  manufacturer?: string;
  efficacy?: string;
  usage_method?: string;
  caution?: string;
  side_effect?: string;
}

export interface MedicationVerifyItem {
  medication_id: number;
  drug_ref_id: string | null;
}

export interface MedicationsBatchVerifyResponse {
  record_id: number;
  record_status: string;
  verified_count: number;
  total_count: number;
  medications: Record<string, unknown>[];
}

export interface MedicationAlarm {
  id: number;
  drug_name: string;
  alarm_times: string[] | null;
  is_alarm_enabled: boolean;
}

export interface MedicationAlarmUpdateRequest {
  alarm_times: string[];
  is_alarm_enabled: boolean;
}

export interface MedicationDosageUpdateRequest {
  dosage?: string;
  frequency?: string;
  timing?: string;
  duration?: string;
}

export interface MedicationDosageUpdateResponse {
  medication_id: number;
  dosage?: string;
  frequency?: string;
  timing?: string;
  duration?: string;
}

// ─── Guides ───────────────────────────────────────────────────────────────────

export interface CreateGuideRequest {
  record_id: number;
  include_lifestyle?: boolean;
}

export interface CreateGuideResponse {
  // BE /guides/generate는 동기 처리라 job_id가 없고 완료 status를 즉시 반환한다.
  guide_id: number;
  status: AsyncJobStatus;
}

export type GuideItemType = 'medication' | 'lifestyle' | 'disclaimer';

export interface GuideItemResponse {
  item_type: GuideItemType;
  title?: string;
  content: string;
  sort_order: number;
  guideline_source_id?: number;
}

export interface DataSourceInfo {
  type: string;
  timestamp: string;
  notice: string;
}

export interface GuideResponse {
  guide_id: number;
  status: string;
  data_source: DataSourceInfo;
  medication_guide: string;
  lifestyle_guide: string;
  warning_message?: string;
  disclaimer: string;
  guide_items: GuideItemResponse[];
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface CreateSessionRequest {
  record_id?: number;
  guide_id?: number;
  title?: string;
}

export interface ChatSession {
  session_id: number;
  title: string;
  status: 'ACTIVE' | 'CLOSED';
  updated_at?: string;
  last_message?: string;
  last_message_preview?: string | null;
}

export interface NotificationSettingsResponse {
  guide_complete_alarm: boolean;
  ocr_complete_alarm: boolean;
  system_alarm: boolean;
  updated_at: string;
}

export interface NotificationSettingsUpdate {
  guide_complete_alarm: boolean;
  ocr_complete_alarm: boolean;
  system_alarm: boolean;
}

export interface ChatSessionListResponse {
  items: ChatSession[];
  total: number;
  limit: number;
  offset: number;
}

export interface RagSource {
  source_id: number;
  organization_name: string;
  guideline_title: string;
  source_url: string;
  disease_or_topic: string;
  relevance_score: number;
  excerpt?: string;
}

export interface ChatMessageItem {
  message_id: number;
  sender_type: 'user' | 'assistant';
  content: string;
  safety_flag?: boolean;
  safety_notice?: string;
  created_at?: string;
  category?: 'general' | 'side_effect' | 'dosage_timing' | 'lifestyle' | 'emergency';
  // TODO: [BE 대기] GET /rag/search — BE 구현 완료 후 실데이터로 교체
  rag_sources?: RagSource[];
  // TODO: [BE 대기] message.summary — 요약 API 스펙 미확정
  summary?: string;
}

export interface ChatMessagesResponse {
  session_id: number;
  items: ChatMessageItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SendMessageRequest {
  message: string;
  record_id?: number;
  guide_id?: number;
}

export interface SendMessageResponse {
  session_id: number;
  message_id: number;
  user_message: string;
  assistant_message: string;
  safety_flag: boolean;
  safety_notice?: string;
  category?: 'general' | 'side_effect' | 'dosage_timing' | 'lifestyle' | 'emergency';
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationItem {
  notification_id: number;
  notification_type: string;
  title: string;
  message: string;
  is_read: boolean;
  related_url?: string;
  created_at?: string;
  read_at?: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
  unread_count: number;
  total: number;
  page: number;
  size: number;
}

export interface UnreadCountResponse {
  unread_count: number;
}

export interface ReadNotificationResponse {
  notification_id: number;
  is_read: boolean;
  read_at: string;
}

// ─── Feedbacks ────────────────────────────────────────────────────────────────

export interface CreateFeedbackRequest {
  guide_id?: number;
  chat_message_id?: number;
  rating: number;
  comment?: string;
  report_type?: string;
  is_safety_report?: boolean;
}

export interface CreateFeedbackResponse {
  feedback_id: number;
  review_status: 'pending';
}

export interface FeedbackLowRatedItem {
  feedback_id: number;
  guide_id: number | null;
  chat_message_id: number | null;
  rating: number | null;
  comment: string | null;
}

export interface FeedbackSummaryResponse {
  total_count: number;
  rating_distribution: Record<string, number>;
  average_rating: number | null;
  report_count: number;
  safety_report_count: number;
  low_rated_items: FeedbackLowRatedItem[];
}
