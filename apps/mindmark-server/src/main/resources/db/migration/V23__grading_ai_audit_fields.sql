ALTER TABLE grading_ai_job
    ADD COLUMN IF NOT EXISTS duration_ms BIGINT,
    ADD COLUMN IF NOT EXISTS prompt_version VARCHAR(64),
    ADD COLUMN IF NOT EXISTS request_id VARCHAR(128),
    ADD COLUMN IF NOT EXISTS result_summary TEXT;

ALTER TABLE grading_item
    ADD COLUMN IF NOT EXISTS grading_source VARCHAR(32),
    ADD COLUMN IF NOT EXISTS ai_provider VARCHAR(32),
    ADD COLUMN IF NOT EXISTS ai_model VARCHAR(128),
    ADD COLUMN IF NOT EXISTS ai_rubric_version VARCHAR(64),
    ADD COLUMN IF NOT EXISTS ai_raw_score NUMERIC(8, 2),
    ADD COLUMN IF NOT EXISTS teacher_override_reason TEXT,
    ADD COLUMN IF NOT EXISTS score_diff NUMERIC(8, 2);

UPDATE grading_item
SET grading_source = CASE WHEN is_objective = TRUE THEN 'AUTO_RULE' ELSE 'BASELINE' END,
    ai_rubric_version = CASE WHEN is_objective = TRUE THEN 'objective-v20260721' ELSE 'baseline-v20260721' END,
    ai_raw_score = COALESCE(auto_score, final_score),
    score_diff = COALESCE(final_score, 0) - COALESCE(auto_score, 0)
WHERE grading_source IS NULL OR ai_rubric_version IS NULL OR ai_raw_score IS NULL OR score_diff IS NULL;

CREATE INDEX IF NOT EXISTS idx_grading_item_ai_audit
    ON grading_item(grading_task_id, grading_source, needs_review);