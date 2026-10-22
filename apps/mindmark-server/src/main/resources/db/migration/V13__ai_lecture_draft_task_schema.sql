CREATE TABLE IF NOT EXISTS ai_lecture_draft_task (
    id VARCHAR(96) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    status VARCHAR(32) NOT NULL,
    provider VARCHAR(32),
    draft_id VARCHAR(96),
    error_message TEXT,
    requested_by VARCHAR(64) NOT NULL,
    requested_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_ai_lecture_draft_task_status CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_ai_lecture_task_exam ON ai_lecture_draft_task(exam_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_lecture_task_status ON ai_lecture_draft_task(status, updated_at DESC);
