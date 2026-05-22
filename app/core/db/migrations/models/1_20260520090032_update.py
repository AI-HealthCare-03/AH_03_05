from tortoise import BaseDBAsyncClient

RUN_IN_TRANSACTION = True


async def upgrade(db: BaseDBAsyncClient) -> str:
    return """
        CREATE TABLE IF NOT EXISTS `auth_tokens` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `refresh_token` VARCHAR(512) NOT NULL,
    `expires_at` DATETIME(6) NOT NULL,
    `revoked_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_auth_tok_users_33d719ed` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `user_consents` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `consent_type` VARCHAR(16) NOT NULL COMMENT 'TERMS: terms\nPRIVACY: privacy\nSENSITIVE_HEALTH: sensitive_health\nAI_ANALYSIS: ai_analysis\nMARKETING: marketing',
    `required_type` VARCHAR(8) NOT NULL COMMENT 'REQUIRED: required\nOPTIONAL: optional',
    `is_agreed` BOOL NOT NULL,
    `agreed_at` DATETIME(6),
    `revoked_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_user_con_users_4a5cdd72` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `user_health_profiles` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `age_group` VARCHAR(20),
    `gender` VARCHAR(10),
    `chronic_diseases` JSON,
    `allergies` JSON,
    `current_medications` JSON,
    `medical_history` LONGTEXT,
    `doctor_opinion` LONGTEXT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `user_id` BIGINT NOT NULL UNIQUE,
    CONSTRAINT `fk_user_hea_users_1d1f8bd7` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `medical_records` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `record_type` VARCHAR(14) NOT NULL COMMENT 'PRESCRIPTION: prescription\nMEDICINE_BAG: medicine_bag\nMEDICAL_RECORD: medical_record',
    `file_url` VARCHAR(500),
    `original_filename` VARCHAR(255),
    `content_type` VARCHAR(50),
    `file_size_bytes` BIGINT,
    `ocr_text` LONGTEXT,
    `ocr_edited_text` LONGTEXT,
    `ocr_confidence` DECIMAL(5,4),
    `status` VARCHAR(13) NOT NULL COMMENT 'UPLOADED: uploaded\nOCR_PENDING: ocr_pending\nOCR_COMPLETED: ocr_completed\nOCR_FAILED: ocr_failed' DEFAULT 'uploaded',
    `input_method` VARCHAR(6) NOT NULL COMMENT 'UPLOAD: upload\nMANUAL: manual' DEFAULT 'upload',
    `image_expires_at` DATETIME(6),
    `uploaded_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `deleted_at` DATETIME(6),
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_medical__users_aa3196ba` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `ocr_lines` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `line_number` INT NOT NULL,
    `text` LONGTEXT NOT NULL,
    `confidence` DECIMAL(5,4),
    `line_type` VARCHAR(9) COMMENT 'DRUG_NAME: drug_name\nDOSAGE: dosage\nFREQUENCY: frequency\nTIMING: timing\nCAUTION: caution\nOTHER: other',
    `is_edited` BOOL NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `medical_record_id` BIGINT NOT NULL,
    CONSTRAINT `fk_ocr_line_medical__be855d1e` FOREIGN KEY (`medical_record_id`) REFERENCES `medical_records` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `processing_jobs` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `job_type` VARCHAR(16) NOT NULL COMMENT 'OCR: ocr\nGUIDE_GENERATION: guide_generation',
    `status` VARCHAR(9) NOT NULL COMMENT 'PENDING: pending\nRUNNING: running\nCOMPLETED: completed\nFAILED: failed\nTIMEOUT: timeout' DEFAULT 'pending',
    `provider` VARCHAR(100),
    `request_payload` LONGTEXT,
    `result_payload` LONGTEXT,
    `error_message` LONGTEXT,
    `timeout_seconds` INT,
    `started_at` DATETIME(6),
    `completed_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `record_id` BIGINT,
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_processi_medical__15b72ad3` FOREIGN KEY (`record_id`) REFERENCES `medical_records` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_processi_users_56672d54` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `drug_references` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `drug_code` VARCHAR(100) UNIQUE,
    `drug_name` VARCHAR(255) NOT NULL,
    `ingredient_name` VARCHAR(255),
    `manufacturer` VARCHAR(255),
    `efficacy` LONGTEXT,
    `usage_method` LONGTEXT,
    `caution` LONGTEXT,
    `side_effect` LONGTEXT,
    `source` VARCHAR(100) NOT NULL DEFAULT 'mfds',
    `source_url` VARCHAR(500),
    `cache_expires_at` DATETIME(6),
    `raw_response` LONGTEXT,
    `fetched_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY `idx_drug_refere_cache_e_524025` (`cache_expires_at`)
) CHARACTER SET utf8mb4 COMMENT='식약처 의약품 정보 캐시 마스터 테이블.';
        CREATE TABLE IF NOT EXISTS `medications` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `drug_name` VARCHAR(255) NOT NULL,
    `ingredient_name` VARCHAR(255),
    `manufacturer` VARCHAR(255),
    `dosage` VARCHAR(100),
    `frequency` VARCHAR(100),
    `timing` VARCHAR(100),
    `duration` VARCHAR(100),
    `caution` LONGTEXT,
    `side_effect` LONGTEXT,
    `input_method` VARCHAR(6) NOT NULL COMMENT 'OCR: ocr\nMANUAL: manual' DEFAULT 'ocr',
    `api_status` VARCHAR(12) NOT NULL COMMENT 'NOT_SEARCHED: not_searched\nSEARCHED: searched\nFAILED: failed\nSELECTED: selected' DEFAULT 'not_searched',
    `review_status` VARCHAR(15) NOT NULL COMMENT 'REVIEW_REQUIRED: review_required\nREVIEWED: reviewed' DEFAULT 'review_required',
    `is_verified` BOOL NOT NULL DEFAULT 0,
    `ocr_confidence` DECIMAL(5,4),
    `api_fetched_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `drug_ref_id` BIGINT,
    `record_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_medicati_drug_ref_1bbbc860` FOREIGN KEY (`drug_ref_id`) REFERENCES `drug_references` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_medicati_medical__e7bdee93` FOREIGN KEY (`record_id`) REFERENCES `medical_records` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_medicati_users_5f6773a0` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `notifications` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `notification_type` VARCHAR(15) NOT NULL COMMENT 'GUIDE_COMPLETED: guide_completed\nOCR_COMPLETED: ocr_completed\nOCR_FAILED: ocr_failed\nSYSTEM: system',
    `title` VARCHAR(255) NOT NULL,
    `message` LONGTEXT NOT NULL,
    `is_read` BOOL NOT NULL DEFAULT 0,
    `related_url` VARCHAR(500),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `read_at` DATETIME(6),
    `related_job_id` BIGINT,
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_notifica_processi_5bb3bd78` FOREIGN KEY (`related_job_id`) REFERENCES `processing_jobs` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_notifica_users_ca29871f` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `notification_settings` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `guide_complete_alarm` BOOL NOT NULL DEFAULT 1,
    `ocr_complete_alarm` BOOL NOT NULL DEFAULT 1,
    `system_alarm` BOOL NOT NULL DEFAULT 1,
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `user_id` BIGINT NOT NULL UNIQUE,
    CONSTRAINT `fk_notifica_users_ea1f99f3` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `guides` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `record_id` BIGINT,
    `status` VARCHAR(20) NOT NULL COMMENT 'GENERATING: GENERATING\nCOMPLETED: COMPLETED\nFAILED: FAILED' DEFAULT 'GENERATING',
    `medication_guide` LONGTEXT,
    `lifestyle_guide` LONGTEXT,
    `warning_message` LONGTEXT,
    `disclaimer` LONGTEXT,
    `model_name` VARCHAR(100),
    `prompt_version` VARCHAR(50),
    `generated_at` DATETIME(6),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_guides_users_73e91131` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COMMENT='진료기록 기반 복약·생활습관 LLM 가이드.';
        CREATE TABLE IF NOT EXISTS `guide_items` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `item_type` VARCHAR(50) NOT NULL COMMENT 'MEDICATION: MEDICATION\nLIFESTYLE: LIFESTYLE\nWARNING: WARNING',
    `title` VARCHAR(255) NOT NULL,
    `content` LONGTEXT NOT NULL,
    `sort_order` INT NOT NULL DEFAULT 0,
    `guideline_source_id` BIGINT,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `guide_id` BIGINT NOT NULL,
    CONSTRAINT `fk_guide_it_guides_484d2c9c` FOREIGN KEY (`guide_id`) REFERENCES `guides` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COMMENT='가이드 내 세부 항목 (약품별 / 생활습관별).';
        CREATE TABLE IF NOT EXISTS `chat_sessions` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `record_id` BIGINT,
    `title` VARCHAR(255),
    `status` VARCHAR(20) NOT NULL COMMENT 'ACTIVE: ACTIVE\nCLOSED: CLOSED' DEFAULT 'ACTIVE',
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `updated_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
    `guide_id` BIGINT,
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_chat_ses_guides_68cc1481` FOREIGN KEY (`guide_id`) REFERENCES `guides` (`id`) ON DELETE SET NULL,
    CONSTRAINT `fk_chat_ses_users_520002c0` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COMMENT='챗봇 상담 세션.';
        CREATE TABLE IF NOT EXISTS `chat_messages` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `sender_type` VARCHAR(20) NOT NULL COMMENT 'USER: USER\nASSISTANT: ASSISTANT',
    `content` LONGTEXT NOT NULL,
    `safety_flag` BOOL NOT NULL DEFAULT 0,
    `safety_notice` LONGTEXT,
    `model_name` VARCHAR(100),
    `prompt_version` VARCHAR(50),
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `session_id` BIGINT NOT NULL,
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_chat_mes_chat_ses_0d4a2737` FOREIGN KEY (`session_id`) REFERENCES `chat_sessions` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_chat_mes_users_91f55345` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4 COMMENT='챗봇 세션 내 개별 메시지 (사용자 입력 / 챗봇 응답).';
        CREATE TABLE IF NOT EXISTS `feedbacks` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `rating` INT,
    `comment` LONGTEXT,
    `report_type` VARCHAR(50),
    `is_safety_report` BOOL NOT NULL DEFAULT 0,
    `created_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    `chat_message_id` BIGINT,
    `guide_id` BIGINT,
    `user_id` BIGINT NOT NULL,
    CONSTRAINT `fk_feedback_chat_mes_99efd76a` FOREIGN KEY (`chat_message_id`) REFERENCES `chat_messages` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_feedback_guides_522ec30a` FOREIGN KEY (`guide_id`) REFERENCES `guides` (`id`) ON DELETE CASCADE,
    CONSTRAINT `fk_feedback_users_fcbb7783` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) CHARACTER SET utf8mb4;
        CREATE TABLE IF NOT EXISTS `api_failure_logs` (
    `id` BIGINT NOT NULL PRIMARY KEY AUTO_INCREMENT,
    `api_source` VARCHAR(100) NOT NULL,
    `endpoint` VARCHAR(500),
    `request_params` JSON,
    `status_code` INT,
    `error_type` VARCHAR(100),
    `error_message` LONGTEXT,
    `occurred_at` DATETIME(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
    KEY `idx_api_failure_api_sou_7a8790` (`api_source`),
    KEY `idx_api_failure_occurre_5d3b00` (`occurred_at`)
) CHARACTER SET utf8mb4 COMMENT='외부 API 호출 실패 로그.';
        ALTER TABLE `users` ADD `status` VARCHAR(9) NOT NULL COMMENT 'ACTIVE: active\nWITHDRAWN: withdrawn' DEFAULT 'active';
        ALTER TABLE `users` RENAME COLUMN `last_login` TO `withdrawn_at`;
        ALTER TABLE `users` ADD `last_login_at` DATETIME(6);
        ALTER TABLE `users` ADD `password_hash` VARCHAR(255) NOT NULL;
        ALTER TABLE `users` ADD `nickname` VARCHAR(100);
        ALTER TABLE `users` DROP COLUMN `phone_number`;
        ALTER TABLE `users` DROP COLUMN `is_admin`;
        ALTER TABLE `users` DROP COLUMN `birthday`;
        ALTER TABLE `users` DROP COLUMN `is_active`;
        ALTER TABLE `users` DROP COLUMN `hashed_password`;
        ALTER TABLE `users` DROP COLUMN `gender`;
        ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(255) NOT NULL;
        ALTER TABLE `users` MODIFY COLUMN `name` VARCHAR(50) NOT NULL;
        ALTER TABLE `users` ADD UNIQUE INDEX `email` (`email`);"""


async def downgrade(db: BaseDBAsyncClient) -> str:
    return """
        ALTER TABLE `users` DROP INDEX `email`;
        ALTER TABLE `users` ADD `phone_number` VARCHAR(11) NOT NULL;
        ALTER TABLE `users` ADD `is_admin` BOOL NOT NULL DEFAULT 0;
        ALTER TABLE `users` ADD `birthday` DATE NOT NULL;
        ALTER TABLE `users` ADD `is_active` BOOL NOT NULL DEFAULT 1;
        ALTER TABLE `users` ADD `hashed_password` VARCHAR(128) NOT NULL;
        ALTER TABLE `users` RENAME COLUMN `withdrawn_at` TO `last_login`;
        ALTER TABLE `users` ADD `gender` VARCHAR(6) NOT NULL COMMENT 'MALE: MALE\nFEMALE: FEMALE';
        ALTER TABLE `users` DROP COLUMN `status`;
        ALTER TABLE `users` DROP COLUMN `last_login_at`;
        ALTER TABLE `users` DROP COLUMN `password_hash`;
        ALTER TABLE `users` DROP COLUMN `nickname`;
        ALTER TABLE `users` MODIFY COLUMN `email` VARCHAR(40) NOT NULL;
        ALTER TABLE `users` MODIFY COLUMN `name` VARCHAR(20) NOT NULL;
        DROP TABLE IF EXISTS `chat_sessions`;
        DROP TABLE IF EXISTS `processing_jobs`;
        DROP TABLE IF EXISTS `guides`;
        DROP TABLE IF EXISTS `guide_items`;
        DROP TABLE IF EXISTS `feedbacks`;
        DROP TABLE IF EXISTS `user_consents`;
        DROP TABLE IF EXISTS `auth_tokens`;
        DROP TABLE IF EXISTS `drug_references`;
        DROP TABLE IF EXISTS `medications`;
        DROP TABLE IF EXISTS `ocr_lines`;
        DROP TABLE IF EXISTS `medical_records`;
        DROP TABLE IF EXISTS `notifications`;
        DROP TABLE IF EXISTS `notification_settings`;
        DROP TABLE IF EXISTS `chat_messages`;
        DROP TABLE IF EXISTS `api_failure_logs`;
        DROP TABLE IF EXISTS `user_health_profiles`;"""


MODELS_STATE = (
    "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"
)

