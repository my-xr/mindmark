CREATE TABLE IF NOT EXISTS course_chapter (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) NOT NULL REFERENCES course(id),
    chapter_no INTEGER NOT NULL,
    title VARCHAR(128) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_course_chapter_no UNIQUE (course_id, chapter_no)
);

ALTER TABLE question ADD COLUMN IF NOT EXISTS chapter_id VARCHAR(64);
ALTER TABLE question ADD COLUMN IF NOT EXISTS chapter_no INTEGER;
ALTER TABLE question ADD COLUMN IF NOT EXISTS chapter_title VARCHAR(128);

INSERT INTO course_chapter (id, course_id, chapter_no, title, description, status, created_at, updated_at)
SELECT 'chapter-' || c.id || '-0', c.id, 0, '???', '????????????????????????', 'ACTIVE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM course c
WHERE NOT EXISTS (
    SELECT 1 FROM course_chapter cc WHERE cc.course_id = c.id AND cc.chapter_no = 0
);

UPDATE question q
SET chapter_id = 'chapter-' || q.course_id || '-0',
    chapter_no = 0,
    chapter_title = '???'
WHERE q.chapter_id IS NULL;

ALTER TABLE question
    ADD CONSTRAINT fk_question_chapter
    FOREIGN KEY (chapter_id) REFERENCES course_chapter(id);

CREATE INDEX IF NOT EXISTS idx_course_chapter_course_no ON course_chapter(course_id, chapter_no);
CREATE INDEX IF NOT EXISTS idx_question_course_chapter ON question(course_id, chapter_id);
CREATE INDEX IF NOT EXISTS idx_question_course_chapter_no ON question(course_id, chapter_no);
