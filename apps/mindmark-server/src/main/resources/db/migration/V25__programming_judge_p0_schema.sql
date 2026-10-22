CREATE TABLE IF NOT EXISTS programming_test_case (
    id VARCHAR(64) PRIMARY KEY,
    question_id VARCHAR(64) NOT NULL REFERENCES question(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    input_payload TEXT NOT NULL,
    expected_output TEXT NOT NULL,
    visibility VARCHAR(32) NOT NULL,
    weight NUMERIC(8, 2) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_programming_test_case_visibility CHECK (visibility IN ('PUBLIC', 'HIDDEN')),
    CONSTRAINT ck_programming_test_case_weight CHECK (weight >= 0)
);

CREATE TABLE IF NOT EXISTS programming_judge_submission (
    id VARCHAR(96) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    answer_sheet_id VARCHAR(96) NOT NULL REFERENCES answer_sheet(id) ON DELETE CASCADE,
    answer_item_id VARCHAR(128) REFERENCES answer_item(id) ON DELETE SET NULL,
    question_id VARCHAR(64) NOT NULL REFERENCES question(id),
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(64) NOT NULL,
    language VARCHAR(32) NOT NULL,
    source_code_snapshot TEXT NOT NULL,
    status VARCHAR(32) NOT NULL,
    score NUMERIC(8, 2),
    max_score NUMERIC(8, 2) NOT NULL,
    queued_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    error_summary TEXT,
    judge_version VARCHAR(64) NOT NULL DEFAULT 'P0_CONTRACT_ONLY',
    CONSTRAINT ck_programming_judge_submission_status CHECK (status IN (
        'QUEUED', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'PARTIAL_ACCEPTED',
        'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED',
        'MEMORY_LIMIT_EXCEEDED', 'SYSTEM_ERROR', 'CANCELLED'
    )),
    CONSTRAINT ck_programming_judge_submission_scores CHECK (
        max_score >= 0 AND (score IS NULL OR score >= 0)
    )
);

CREATE TABLE IF NOT EXISTS programming_judge_result (
    id VARCHAR(128) PRIMARY KEY,
    submission_id VARCHAR(96) NOT NULL REFERENCES programming_judge_submission(id) ON DELETE CASCADE,
    test_case_id VARCHAR(64) REFERENCES programming_test_case(id) ON DELETE SET NULL,
    status VARCHAR(32) NOT NULL,
    actual_output_summary TEXT,
    stderr_summary TEXT,
    time_ms INTEGER,
    memory_kb INTEGER,
    passed BOOLEAN,
    score NUMERIC(8, 2),
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_programming_judge_result_status CHECK (status IN (
        'QUEUED', 'RUNNING', 'ACCEPTED', 'WRONG_ANSWER', 'PARTIAL_ACCEPTED',
        'COMPILE_ERROR', 'RUNTIME_ERROR', 'TIME_LIMIT_EXCEEDED',
        'MEMORY_LIMIT_EXCEEDED', 'SYSTEM_ERROR', 'CANCELLED'
    )),
    CONSTRAINT ck_programming_judge_result_metrics CHECK (
        (time_ms IS NULL OR time_ms >= 0)
        AND (memory_kb IS NULL OR memory_kb >= 0)
        AND (score IS NULL OR score >= 0)
    )
);

CREATE INDEX IF NOT EXISTS idx_programming_test_case_question ON programming_test_case(question_id, sort_order, created_at);
CREATE INDEX IF NOT EXISTS idx_programming_judge_submission_answer_sheet ON programming_judge_submission(answer_sheet_id, queued_at DESC);
CREATE INDEX IF NOT EXISTS idx_programming_judge_submission_exam_status ON programming_judge_submission(exam_id, status, queued_at DESC);
CREATE INDEX IF NOT EXISTS idx_programming_judge_submission_question ON programming_judge_submission(question_id, queued_at DESC);
CREATE INDEX IF NOT EXISTS idx_programming_judge_result_submission ON programming_judge_result(submission_id, created_at);
