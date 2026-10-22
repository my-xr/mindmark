CREATE TABLE IF NOT EXISTS ai_question_generation_task (
    id VARCHAR(96) PRIMARY KEY,
    teacher_id VARCHAR(64) NOT NULL,
    teacher_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    course_id VARCHAR(64) NOT NULL REFERENCES course(id),
    provider VARCHAR(32) NOT NULL,
    prompt TEXT NOT NULL,
    question_type VARCHAR(32) NOT NULL,
    difficulty VARCHAR(32) NOT NULL,
    count INTEGER NOT NULL,
    knowledge_point TEXT,
    requirement TEXT,
    generated_question_ids TEXT,
    generated_count INTEGER,
    error_message TEXT,
    requested_at TIMESTAMPTZ NOT NULL,
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_ai_question_generation_task_status CHECK (status IN ('PENDING', 'RUNNING', 'SUCCEEDED', 'FAILED')),
    CONSTRAINT ck_ai_question_generation_task_count CHECK (count BETWEEN 1 AND 5)
);

CREATE INDEX IF NOT EXISTS idx_ai_question_task_teacher ON ai_question_generation_task(teacher_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_question_task_status ON ai_question_generation_task(status, updated_at DESC);