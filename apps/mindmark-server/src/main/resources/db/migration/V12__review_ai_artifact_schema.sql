CREATE TABLE IF NOT EXISTS review_lecture_draft (
    id VARCHAR(96) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    provider VARCHAR(32) NOT NULL,
    confidence NUMERIC(5, 4) NOT NULL,
    risk_labels_json TEXT NOT NULL,
    outline_json TEXT NOT NULL,
    content TEXT NOT NULL,
    teacher_edited_content TEXT,
    prompt_snapshot TEXT NOT NULL,
    artifact_id VARCHAR(96),
    generated_at TIMESTAMPTZ NOT NULL,
    approved_at TIMESTAMPTZ,
    created_by VARCHAR(64) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_review_lecture_draft_status CHECK (status IN ('DRAFT', 'REVIEWING', 'APPROVED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_review_lecture_exam ON review_lecture_draft(exam_id, updated_at DESC);

CREATE TABLE IF NOT EXISTS review_artifact (
    id VARCHAR(96) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    artifact_type VARCHAR(32) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    object_key VARCHAR(512) NOT NULL,
    content_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    checksum_sha256 VARCHAR(64) NOT NULL,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_review_artifact_type CHECK (artifact_type IN ('REVIEW_REPORT_MARKDOWN', 'LECTURE_DRAFT_MARKDOWN', 'SCORE_SUMMARY_CSV'))
);

CREATE INDEX IF NOT EXISTS idx_review_artifact_exam ON review_artifact(exam_id, created_at DESC);
