CREATE TABLE IF NOT EXISTS grading_task (
    id VARCHAR(96) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    answer_sheet_id VARCHAR(96) NOT NULL REFERENCES answer_sheet(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    objective_score NUMERIC(8, 2),
    subjective_score NUMERIC(8, 2),
    ai_score NUMERIC(8, 2),
    final_score NUMERIC(8, 2),
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    reviewed_at TIMESTAMPTZ,
    CONSTRAINT ck_grading_task_status CHECK (status IN ('PENDING', 'AI_CHECKED', 'REVIEWED')),
    CONSTRAINT ck_grading_task_scores CHECK (
        (objective_score IS NULL OR objective_score >= 0)
        AND (subjective_score IS NULL OR subjective_score >= 0)
        AND (ai_score IS NULL OR ai_score >= 0)
        AND (final_score IS NULL OR final_score >= 0)
    ),
    CONSTRAINT uk_grading_task_answer_sheet UNIQUE (answer_sheet_id)
);

CREATE TABLE IF NOT EXISTS grading_item (
    id VARCHAR(128) PRIMARY KEY,
    grading_task_id VARCHAR(96) NOT NULL REFERENCES grading_task(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES question(id),
    question_type VARCHAR(32) NOT NULL,
    max_score NUMERIC(8, 2) NOT NULL,
    auto_score NUMERIC(8, 2),
    final_score NUMERIC(8, 2),
    is_objective BOOLEAN NOT NULL,
    is_correct BOOLEAN,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_grading_item_scores CHECK (
        max_score >= 0
        AND (auto_score IS NULL OR auto_score >= 0)
        AND (final_score IS NULL OR final_score >= 0)
    ),
    CONSTRAINT uk_grading_item_question UNIQUE (grading_task_id, question_id)
);

CREATE TABLE IF NOT EXISTS score_report (
    id VARCHAR(96) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    answer_sheet_id VARCHAR(96) NOT NULL REFERENCES answer_sheet(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(64) NOT NULL,
    exam_title VARCHAR(200) NOT NULL,
    score NUMERIC(8, 2) NOT NULL,
    rank_no INTEGER,
    weak_knowledge_points_json TEXT NOT NULL,
    feedback TEXT NOT NULL,
    published_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_score_report_score CHECK (score >= 0),
    CONSTRAINT uk_score_report_student UNIQUE (exam_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_grading_task_exam ON grading_task(exam_id, status, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_grading_task_student ON grading_task(student_id);
CREATE INDEX IF NOT EXISTS idx_grading_item_task ON grading_item(grading_task_id);
CREATE INDEX IF NOT EXISTS idx_score_report_student ON score_report(student_id, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_score_report_exam ON score_report(exam_id, rank_no);