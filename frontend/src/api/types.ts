// ─── Common ───────────────────────────────────────────────────────────────────

export type AsyncJobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'timeout';
export type RecordType = 'prescription' | 'medicine_bag' | 'medical_record';
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
  user: { id: number; name: string };
}

export interface LogoutResponse {
  detail: string;
}

// ─── Users ────────────────────────────────────────────────────────────────────

export interface UserInfo {
  user_id: number;
  email: string;
  name: string;
  nickname: string;
  status: 'active' | 'withdrawn';
}

export interface UpdateUserRequest {
  nickname: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ConsentItem {
  type: ConsentType;
  label: string;
  required: boolean;
  agreed: boolean;
  agreedAt: string;
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

export type RecordStatus =
  | 'uploaded'
  | 'ocr_pending'
  | 'ocr_completed'
  | 'ocr_failed';

export interface RecordUploadResponse {
  record_id: number;
  record_type: RecordType;
  file_url: string;
  status: RecordStatus;
  image_expires_at: string;
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

export interface OcrJobRequest {
  record_id: number;
  provider?: 'upstage';
}

export interface OcrJobResponse {
  job_id: number;
  record_id: number;
  job_type: 'ocr';
  status: AsyncJobStatus;
}

export interface MedicationCandidate {
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
  drug_ref_id: string;
}

export interface VerifyMedicationResponse {
  medication_id: number;
  drug_name: string;
  is_verified: boolean;
}

// ─── Guides ───────────────────────────────────────────────────────────────────

export interface CreateGuideRequest {
  record_id: number;
  include_lifestyle?: boolean;
}

export interface CreateGuideResponse {
  job_id: number;
  guide_id: number;
  status: AsyncJobStatus;
}

export type GuideItemType = 'medication' | 'lifestyle' | 'disclaimer';

export interface GuideItem {
  item_type: GuideItemType;
  title?: string;
  content: string;
}

export interface GuideResponse {
  guide_id: number;
  record_id: number;
  status: AsyncJobStatus;
  items: GuideItem[];
}

// ─── Chat ─────────────────────────────────────────────────────────────────────

export interface CreateSessionRequest {
  record_id: number;
  guide_id?: number;
  title?: string;
}

export interface ChatSession {
  session_id: number;
  title: string;
  status: 'active' | 'closed';
  updated_at?: string;
  last_message?: string;
}

export interface ChatSessionListResponse {
  items: ChatSession[];
  page: number;
  size: number;
}

export interface ChatMessageItem {
  message_id: number;
  sender_type: 'user' | 'assistant';
  content: string;
  safety_flag?: boolean;
  created_at?: string;
}

export interface ChatMessagesResponse {
  session_id: number;
  messages: ChatMessageItem[];
}

export interface SendMessageRequest {
  message: string;
  record_id?: number;
  guide_id?: number;
}

export interface SendMessageResponse {
  message_id: number;
  session_id: number;
  answer: string;
  safety_flag: boolean;
  model_name?: string;
  created_at: string;
}

// ─── Notifications ────────────────────────────────────────────────────────────

export interface NotificationItem {
  notification_id: number;
  title: string;
  body?: string;
  is_read: boolean;
  created_at?: string;
}

export interface NotificationListResponse {
  items: NotificationItem[];
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
}

export interface CreateFeedbackResponse {
  feedback_id: number;
  review_status: 'pending';
}
