ALTER TABLE answer_sheet DROP CONSTRAINT IF EXISTS ck_answer_sheet_status;
ALTER TABLE answer_sheet ADD CONSTRAINT ck_answer_sheet_status CHECK (status IN ('DRAFT', 'SUBMITTED', 'GRADING', 'GRADED', 'ABSENT'));

CREATE INDEX IF NOT EXISTS idx_answer_sheet_exam_status ON answer_sheet(exam_id, status);