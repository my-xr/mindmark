-- Pagination and sorting indexes for teacher-side enterprise lists.
-- Keep these indexes focused on real database-level page filters/sorts added after V19.

CREATE INDEX IF NOT EXISTS idx_question_course_status_source_updated
    ON question(course_id, status, source, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_status_source_updated
    ON question(status, source, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_difficulty_updated
    ON question(difficulty, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_question_knowledge_point_value_question
    ON question_knowledge_point(knowledge_point, question_id);

CREATE INDEX IF NOT EXISTS idx_paper_status_updated
    ON paper(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_updated_at
    ON exam(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_status_updated
    ON exam(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_exam_class_class_exam
    ON exam_class(class_id, exam_id);

CREATE INDEX IF NOT EXISTS idx_exam_participant_exam_student
    ON exam_participant(exam_id, student_id);

CREATE INDEX IF NOT EXISTS idx_answer_sheet_exam_status_updated
    ON answer_sheet(exam_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_question_generation_task_teacher_status_requested
    ON ai_question_generation_task(teacher_id, status, requested_at DESC);

CREATE INDEX IF NOT EXISTS idx_grading_task_status_updated
    ON grading_task(status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_grading_item_task_created
    ON grading_item(grading_task_id, created_at ASC);
