CREATE TABLE IF NOT EXISTS ai_provider_setting (
    id VARCHAR(128) PRIMARY KEY,
    teacher_id VARCHAR(64) NOT NULL REFERENCES auth_user(id),
    provider VARCHAR(32) NOT NULL,
    encrypted_api_key TEXT NOT NULL,
    key_suffix VARCHAR(12) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_ai_provider_teacher_provider UNIQUE (teacher_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_ai_provider_setting_teacher ON ai_provider_setting(teacher_id, provider);
