from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS "aerich" (
    "id" SERIAL NOT NULL PRIMARY KEY,
    "version" VARCHAR(255) NOT NULL,
    "app" VARCHAR(100) NOT NULL,
    "content" JSONB NOT NULL
);
CREATE TABLE IF NOT EXISTS "users" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "email" VARCHAR(255) NOT NULL UNIQUE,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "nickname" VARCHAR(100),
    "status" VARCHAR(9) NOT NULL DEFAULT 'active',
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "withdrawn_at" TIMESTAMPTZ
);
COMMENT ON COLUMN "users"."status" IS 'ACTIVE: active\nWITHDRAWN: withdrawn';
CREATE TABLE IF NOT EXISTS "auth_tokens" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "refresh_token" VARCHAR(512) NOT NULL,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "user_consents" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "consent_type" VARCHAR(16) NOT NULL,
    "required_type" VARCHAR(8) NOT NULL,
    "is_agreed" BOOL NOT NULL,
    "agreed_at" TIMESTAMPTZ,
    "revoked_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "user_consents"."consent_type" IS 'TERMS: terms\nPRIVACY: privacy\nSENSITIVE_HEALTH: sensitive_health\nAI_ANALYSIS: ai_analysis\nMARKETING: marketing';
COMMENT ON COLUMN "user_consents"."required_type" IS 'REQUIRED: required\nOPTIONAL: optional';
CREATE TABLE IF NOT EXISTS "user_health_profiles" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "age_group" VARCHAR(20),
    "gender" VARCHAR(10),
    "chronic_diseases" JSONB,
    "allergies" JSONB,
    "current_medications" JSONB,
    "medical_history" TEXT,
    "doctor_opinion" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" BIGINT NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "medical_records" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "record_type" VARCHAR(14) NOT NULL,
    "file_url" VARCHAR(500),
    "original_filename" VARCHAR(255),
    "content_type" VARCHAR(50),
    "file_size_bytes" BIGINT,
    "ocr_text" TEXT,
    "ocr_edited_text" TEXT,
    "ocr_confidence" DECIMAL(5,4),
    "status" VARCHAR(13) NOT NULL DEFAULT 'uploaded',
    "input_method" VARCHAR(6) NOT NULL DEFAULT 'upload',
    "image_expires_at" TIMESTAMPTZ,
    "uploaded_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "medical_records"."record_type" IS 'PRESCRIPTION: prescription\nMEDICINE_BAG: medicine_bag\nMEDICAL_RECORD: medical_record';
COMMENT ON COLUMN "medical_records"."status" IS 'UPLOADED: uploaded\nOCR_PENDING: ocr_pending\nOCR_COMPLETED: ocr_completed\nOCR_FAILED: ocr_failed';
COMMENT ON COLUMN "medical_records"."input_method" IS 'UPLOAD: upload\nMANUAL: manual';
CREATE TABLE IF NOT EXISTS "ocr_lines" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "line_number" INT NOT NULL,
    "text" TEXT NOT NULL,
    "confidence" DECIMAL(5,4),
    "line_type" VARCHAR(9),
    "is_edited" BOOL NOT NULL DEFAULT False,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "medical_record_id" BIGINT NOT NULL REFERENCES "medical_records" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "ocr_lines"."line_type" IS 'DRUG_NAME: drug_name\nDOSAGE: dosage\nFREQUENCY: frequency\nTIMING: timing\nCAUTION: caution\nOTHER: other';
CREATE TABLE IF NOT EXISTS "processing_jobs" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "job_type" VARCHAR(16) NOT NULL,
    "status" VARCHAR(9) NOT NULL DEFAULT 'pending',
    "provider" VARCHAR(100),
    "request_payload" TEXT,
    "result_payload" TEXT,
    "error_message" TEXT,
    "timeout_seconds" INT,
    "started_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "record_id" BIGINT REFERENCES "medical_records" ("id") ON DELETE CASCADE,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "processing_jobs"."job_type" IS 'OCR: ocr\nGUIDE_GENERATION: guide_generation';
COMMENT ON COLUMN "processing_jobs"."status" IS 'PENDING: pending\nRUNNING: running\nCOMPLETED: completed\nFAILED: failed\nTIMEOUT: timeout';
CREATE TABLE IF NOT EXISTS "notifications" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "notification_type" VARCHAR(15) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "message" TEXT NOT NULL,
    "is_read" BOOL NOT NULL DEFAULT False,
    "related_url" VARCHAR(500),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "read_at" TIMESTAMPTZ,
    "related_job_id" BIGINT REFERENCES "processing_jobs" ("id") ON DELETE CASCADE,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "notifications"."notification_type" IS 'GUIDE_COMPLETED: guide_completed\nOCR_COMPLETED: ocr_completed\nOCR_FAILED: ocr_failed\nSYSTEM: system';
CREATE TABLE IF NOT EXISTS "notification_settings" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "guide_complete_alarm" BOOL NOT NULL DEFAULT True,
    "ocr_complete_alarm" BOOL NOT NULL DEFAULT True,
    "system_alarm" BOOL NOT NULL DEFAULT True,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" BIGINT NOT NULL UNIQUE REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "drug_references" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "drug_code" VARCHAR(100) UNIQUE,
    "drug_name" VARCHAR(255) NOT NULL,
    "ingredient_name" VARCHAR(255),
    "manufacturer" VARCHAR(255),
    "efficacy" TEXT,
    "usage_method" TEXT,
    "caution" TEXT,
    "side_effect" TEXT,
    "source" VARCHAR(100) NOT NULL DEFAULT 'mfds',
    "source_url" VARCHAR(500),
    "cache_expires_at" TIMESTAMPTZ,
    "raw_response" TEXT,
    "fetched_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_drug_refere_cache_e_524025" ON "drug_references" ("cache_expires_at");
COMMENT ON TABLE "drug_references" IS '식약처 의약품 정보 캐시 마스터 테이블.';
CREATE TABLE IF NOT EXISTS "medications" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "drug_name" VARCHAR(255) NOT NULL,
    "ingredient_name" VARCHAR(255),
    "manufacturer" VARCHAR(255),
    "dosage" VARCHAR(100),
    "frequency" VARCHAR(100),
    "timing" VARCHAR(100),
    "duration" VARCHAR(100),
    "caution" TEXT,
    "side_effect" TEXT,
    "input_method" VARCHAR(6) NOT NULL DEFAULT 'ocr',
    "api_status" VARCHAR(12) NOT NULL DEFAULT 'not_searched',
    "review_status" VARCHAR(15) NOT NULL DEFAULT 'review_required',
    "is_verified" BOOL NOT NULL DEFAULT False,
    "ocr_confidence" DECIMAL(5,4),
    "api_fetched_at" TIMESTAMPTZ,
    "alarm_times" JSONB,
    "is_alarm_enabled" BOOL NOT NULL DEFAULT True,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "drug_ref_id" BIGINT REFERENCES "drug_references" ("id") ON DELETE CASCADE,
    "record_id" BIGINT NOT NULL REFERENCES "medical_records" ("id") ON DELETE CASCADE,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "medications"."input_method" IS 'OCR: ocr\nMANUAL: manual';
COMMENT ON COLUMN "medications"."api_status" IS 'NOT_SEARCHED: not_searched\nSEARCHED: searched\nFAILED: failed\nSELECTED: selected';
COMMENT ON COLUMN "medications"."review_status" IS 'REVIEW_REQUIRED: review_required\nREVIEWED: reviewed';
CREATE TABLE IF NOT EXISTS "api_failure_logs" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "api_source" VARCHAR(100) NOT NULL,
    "endpoint" VARCHAR(500),
    "request_params" JSONB,
    "status_code" INT,
    "error_type" VARCHAR(100),
    "error_message" TEXT,
    "occurred_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS "idx_api_failure_api_sou_7a8790" ON "api_failure_logs" ("api_source");
CREATE INDEX IF NOT EXISTS "idx_api_failure_occurre_5d3b00" ON "api_failure_logs" ("occurred_at");
COMMENT ON TABLE "api_failure_logs" IS '외부 API 호출 실패 로그.';
CREATE TABLE IF NOT EXISTS "guides" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "record_id" BIGINT,
    "status" VARCHAR(20) NOT NULL DEFAULT 'GENERATING',
    "medication_guide" TEXT,
    "lifestyle_guide" TEXT,
    "warning_message" TEXT,
    "disclaimer" TEXT,
    "model_name" VARCHAR(100),
    "prompt_version" VARCHAR(50),
    "generated_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "guides"."status" IS 'GENERATING: GENERATING\nCOMPLETED: COMPLETED\nFAILED: FAILED';
COMMENT ON TABLE "guides" IS '진료기록 기반 복약·생활습관 LLM 가이드.';
CREATE TABLE IF NOT EXISTS "chat_sessions" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "record_id" BIGINT,
    "title" VARCHAR(255),
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guide_id" BIGINT REFERENCES "guides" ("id") ON DELETE SET NULL,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "chat_sessions"."status" IS 'ACTIVE: ACTIVE\nCLOSED: CLOSED';
COMMENT ON TABLE "chat_sessions" IS '챗봇 상담 세션.';
CREATE TABLE IF NOT EXISTS "chat_messages" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "sender_type" VARCHAR(20) NOT NULL,
    "content" TEXT NOT NULL,
    "safety_flag" BOOL NOT NULL DEFAULT False,
    "safety_notice" TEXT,
    "model_name" VARCHAR(100),
    "prompt_version" VARCHAR(50),
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "session_id" BIGINT NOT NULL REFERENCES "chat_sessions" ("id") ON DELETE CASCADE,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "chat_messages"."sender_type" IS 'USER: USER\nASSISTANT: ASSISTANT';
COMMENT ON TABLE "chat_messages" IS '챗봇 세션 내 개별 메시지 (사용자 입력 / 챗봇 응답).';
CREATE TABLE IF NOT EXISTS "feedbacks" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "rating" INT,
    "comment" TEXT,
    "report_type" VARCHAR(50),
    "is_safety_report" BOOL NOT NULL DEFAULT False,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "chat_message_id" BIGINT REFERENCES "chat_messages" ("id") ON DELETE CASCADE,
    "guide_id" BIGINT REFERENCES "guides" ("id") ON DELETE CASCADE,
    "user_id" BIGINT NOT NULL REFERENCES "users" ("id") ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS "guide_items" (
    "id" BIGSERIAL NOT NULL PRIMARY KEY,
    "item_type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "sort_order" INT NOT NULL DEFAULT 0,
    "guideline_source_id" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "guide_id" BIGINT NOT NULL REFERENCES "guides" ("id") ON DELETE CASCADE
);
COMMENT ON COLUMN "guide_items"."item_type" IS 'MEDICATION: MEDICATION\nLIFESTYLE: LIFESTYLE\nWARNING: WARNING';
COMMENT ON TABLE "guide_items" IS '가이드 내 세부 항목 (약품별 / 생활습관별).';"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        """


MODELS_STATE = (
    "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"
)
