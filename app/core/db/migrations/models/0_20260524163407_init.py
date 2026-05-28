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
    "lUoqegt6iYzcq8yH/sazSce3l3/+P6+Nqhg="
)
