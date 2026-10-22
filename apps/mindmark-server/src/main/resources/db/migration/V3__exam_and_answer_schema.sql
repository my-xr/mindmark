CREATE TABLE IF NOT EXISTS exam (
    id VARCHAR(64) PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    paper_id VARCHAR(64) NOT NULL REFERENCES paper(id),
    start_at TIMESTAMPTZ NOT NULL,
    end_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL,
    total_score NUMERIC(8, 2) NOT NULL,
    status VARCHAR(32) NOT NULL,
    created_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_exam_time_range CHECK (end_at > start_at),
    CONSTRAINT ck_exam_duration CHECK (duration_minutes > 0),
    CONSTRAINT ck_exam_total_score CHECK (total_score >= 0),
    CONSTRAINT ck_exam_status CHECK (status IN ('DRAFT', 'SCHEDULED', 'ONGOING', 'ENDED', 'SCORES_PUBLISHED'))
);

CREATE TABLE IF NOT EXISTS exam_class (
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL,
    class_id VARCHAR(64) NOT NULL,
    PRIMARY KEY (exam_id, order_index),
    CONSTRAINT uk_exam_class UNIQUE (exam_id, class_id)
);

CREATE TABLE IF NOT EXISTS exam_participant (
    id VARCHAR(96) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(64) NOT NULL,
    class_id VARCHAR(64) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_exam_participant_student UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS answer_sheet (
    id VARCHAR(96) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    version INTEGER NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL,
    client_saved_at TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_answer_sheet_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'GRADING', 'GRADED')),
    CONSTRAINT ck_answer_sheet_version CHECK (version >= 0),
    CONSTRAINT uk_answer_sheet_student UNIQUE (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS answer_item (
    id VARCHAR(128) PRIMARY KEY,
    answer_sheet_id VARCHAR(96) NOT NULL REFERENCES answer_sheet(id) ON DELETE CASCADE,
    question_id VARCHAR(64) NOT NULL REFERENCES question(id),
    answer_json TEXT NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT uk_answer_item_question UNIQUE (answer_sheet_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_status_time ON exam(status, start_at, end_at);
CREATE INDEX IF NOT EXISTS idx_exam_paper ON exam(paper_id);
CREATE INDEX IF NOT EXISTS idx_exam_participant_student ON exam_participant(student_id);
CREATE INDEX IF NOT EXISTS idx_answer_sheet_student ON answer_sheet(student_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_answer_item_sheet ON answer_item(answer_sheet_id);

INSERT INTO exam (id, title, paper_id, start_at, end_at, duration_minutes, total_score, status, created_by, created_at, updated_at) VALUES
('exam-001', 'Frontend Engineering Midterm Mock', 'paper-001', '2026-07-17 09:00:00+08', '2026-07-31 18:00:00+08', 90, 16, 'ONGOING', 'Teacher Wang', '2026-07-17 12:00:00+08', '2026-07-17 12:00:00+08')
ON CONFLICT (id) DO NOTHING;

INSERT INTO exam_class (exam_id, order_index, class_id) VALUES
('exam-001', 0, 'class-frontend-1')
ON CONFLICT (exam_id, order_index) DO NOTHING;

INSERT INTO exam_participant (id, exam_id, student_id, student_name, class_id, created_at) VALUES
('EP-exam-001-student-001', 'exam-001', 'student-001', 'Student Alice', 'class-frontend-1', '2026-07-17 12:00:00+08'),
('EP-exam-001-student-002', 'exam-001', 'student-002', 'Student Bob', 'class-frontend-1', '2026-07-17 12:00:00+08')
ON CONFLICT (id) DO NOTHING;

INSERT INTO answer_sheet (id, exam_id, student_id, student_name, status, version, started_at, client_saved_at, submitted_at, updated_at) VALUES
('AS-exam-001-student-001', 'exam-001', 'student-001', 'Student Alice', 'DRAFT', 0, '2026-07-17 12:00:00+08', NULL, NULL, '2026-07-17 12:00:00+08'),
('AS-exam-001-student-002', 'exam-001', 'student-002', 'Student Bob', 'DRAFT', 0, '2026-07-17 12:00:00+08', NULL, NULL, '2026-07-17 12:00:00+08')
ON CONFLICT (id) DO NOTHING;
