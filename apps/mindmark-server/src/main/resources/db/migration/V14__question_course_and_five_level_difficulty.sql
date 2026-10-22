ALTER TABLE question
    ADD COLUMN IF NOT EXISTS course_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS course_name VARCHAR(128);

UPDATE question
SET course_id = 'course-frontend-001',
    course_name = '前端工程实践'
WHERE course_id IS NULL
  AND (title ILIKE '%JavaScript%' OR title ILIKE '%Vue%' OR title ILIKE '%debounce%' OR title ILIKE '%CSS%');

UPDATE question
SET course_id = 'course-fullstack-001',
    course_name = '全栈开发实践'
WHERE course_id IS NULL
  AND (title ILIKE '%HTTP%' OR title ILIKE '%RESTful%');

UPDATE question
SET course_id = 'course-demo-001',
    course_name = '软件工程'
WHERE course_id IS NULL;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_question_difficulty') THEN
        ALTER TABLE question DROP CONSTRAINT ck_question_difficulty;
    END IF;
END $$;

ALTER TABLE question
    ADD CONSTRAINT ck_question_difficulty
    CHECK (difficulty IN ('VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD'));

CREATE INDEX IF NOT EXISTS idx_question_course ON question(course_id, updated_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_question_course') THEN
        ALTER TABLE question
            ADD CONSTRAINT fk_question_course
            FOREIGN KEY (course_id) REFERENCES course(id) NOT VALID;
    END IF;
END $$;
