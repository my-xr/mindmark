DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_question_status') THEN
        ALTER TABLE question DROP CONSTRAINT ck_question_status;
    END IF;
END $$;

ALTER TABLE question
    ADD CONSTRAINT ck_question_status
    CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'DISABLED', 'REJECTED'));

ALTER TABLE question
    ADD COLUMN IF NOT EXISTS reviewed_by VARCHAR(64),
    ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS review_comment TEXT,
    ADD COLUMN IF NOT EXISTS review_action VARCHAR(32);

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_question_review_action') THEN
        ALTER TABLE question DROP CONSTRAINT ck_question_review_action;
    END IF;
END $$;

ALTER TABLE question
    ADD CONSTRAINT ck_question_review_action
    CHECK (review_action IS NULL OR review_action IN ('ACCEPTED', 'EDITED_ACCEPTED', 'REJECTED'));

CREATE TABLE IF NOT EXISTS exam_security_event (
    id VARCHAR(96) PRIMARY KEY,
    exam_id VARCHAR(64) NOT NULL REFERENCES exam(id) ON DELETE CASCADE,
    answer_sheet_id VARCHAR(96) REFERENCES answer_sheet(id) ON DELETE CASCADE,
    student_id VARCHAR(64) NOT NULL,
    student_name VARCHAR(64) NOT NULL,
    event_type VARCHAR(32) NOT NULL,
    severity VARCHAR(16) NOT NULL,
    message TEXT,
    client_event_count INTEGER NOT NULL DEFAULT 1,
    client_occurred_at TIMESTAMPTZ,
    server_received_at TIMESTAMPTZ NOT NULL,
    user_agent VARCHAR(500),
    CONSTRAINT ck_exam_security_event_type CHECK (event_type IN ('VISIBILITY_HIDDEN', 'WINDOW_BLUR', 'FULLSCREEN_EXIT', 'AUTO_SUBMIT', 'MANUAL_REPORT')),
    CONSTRAINT ck_exam_security_event_severity CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH')),
    CONSTRAINT ck_exam_security_event_count CHECK (client_event_count >= 1)
);

CREATE INDEX IF NOT EXISTS idx_exam_security_event_exam_received_at
    ON exam_security_event(exam_id, server_received_at DESC);
CREATE INDEX IF NOT EXISTS idx_exam_security_event_student_received_at
    ON exam_security_event(student_id, server_received_at DESC);
