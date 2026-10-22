ALTER TABLE paper
    ADD COLUMN IF NOT EXISTS course_id VARCHAR(64);

UPDATE paper
SET course_id = 'course-frontend-001',
    course_name = '前端工程实践'
WHERE course_id IS NULL
  AND (id = 'paper-001' OR course_name ILIKE '%front%' OR course_name ILIKE '%前端%' OR title ILIKE '%front%' OR title ILIKE '%前端%');

UPDATE paper
SET course_id = 'course-fullstack-001',
    course_name = '全栈开发实践'
WHERE course_id IS NULL
  AND (id = 'paper-002' OR course_name ILIKE '%full%' OR course_name ILIKE '%全栈%' OR title ILIKE '%full%' OR title ILIKE '%全栈%');

UPDATE paper
SET course_id = 'course-demo-001',
    course_name = '软件工程'
WHERE course_id IS NULL;

UPDATE question
SET course_id = 'course-demo-001',
    course_name = '软件工程'
WHERE course_id IS NULL
   OR course_name IS NULL;

ALTER TABLE paper
    ALTER COLUMN course_id SET NOT NULL;

ALTER TABLE question
    ALTER COLUMN course_id SET NOT NULL,
    ALTER COLUMN course_name SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_paper_course ON paper(course_id, updated_at DESC);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_paper_course') THEN
        ALTER TABLE paper
            ADD CONSTRAINT fk_paper_course
            FOREIGN KEY (course_id) REFERENCES course(id) NOT VALID;
    END IF;
END $$;
