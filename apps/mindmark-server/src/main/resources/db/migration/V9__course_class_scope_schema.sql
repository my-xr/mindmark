CREATE TABLE IF NOT EXISTS course (
    id VARCHAR(64) PRIMARY KEY,
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    description TEXT,
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_course_status CHECK (status IN ('ACTIVE', 'DISABLED', 'ARCHIVED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_course_code_lower ON course (LOWER(code));
CREATE INDEX IF NOT EXISTS idx_course_status ON course(status, updated_at DESC);

CREATE TABLE IF NOT EXISTS teaching_class (
    id VARCHAR(64) PRIMARY KEY,
    course_id VARCHAR(64) REFERENCES course(id),
    code VARCHAR(64) NOT NULL,
    name VARCHAR(128) NOT NULL,
    grade VARCHAR(32),
    major VARCHAR(128),
    status VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_teaching_class_status CHECK (status IN ('ACTIVE', 'DISABLED', 'ARCHIVED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_teaching_class_code_lower ON teaching_class (LOWER(code));
CREATE INDEX IF NOT EXISTS idx_teaching_class_course ON teaching_class(course_id, status);
CREATE INDEX IF NOT EXISTS idx_teaching_class_status ON teaching_class(status, updated_at DESC);

INSERT INTO course (id, code, name, description, status, created_at, updated_at) VALUES
('course-demo-001', 'SE-2026', '软件工程', 'MindMark demo course for exam closed-loop smoke tests', 'ACTIVE', NOW(), NOW()),
('course-frontend-001', 'FE-2026', '前端工程实践', 'Frontend demo course', 'ACTIVE', NOW(), NOW()),
('course-fullstack-001', 'FS-2026', '全栈开发实践', 'Full-stack demo course', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

INSERT INTO teaching_class (id, course_id, code, name, grade, major, status, created_at, updated_at) VALUES
('class-demo-001', 'course-demo-001', 'SE-2026-01', '软件工程 1 班', '2026', '软件工程', 'ACTIVE', NOW(), NOW()),
('class-frontend-1', 'course-frontend-001', 'FE-2026-01', '前端工程 1 班', '2026', '软件工程', 'ACTIVE', NOW(), NOW()),
('class-fullstack-1', 'course-fullstack-001', 'FS-2026-01', '全栈工程 1 班', '2026', '软件工程', 'ACTIVE', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    course_id = EXCLUDED.course_id,
    code = EXCLUDED.code,
    name = EXCLUDED.name,
    grade = EXCLUDED.grade,
    major = EXCLUDED.major,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at;

UPDATE student_profile sp
SET class_name = tc.name,
    grade = COALESCE(sp.grade, tc.grade),
    major = COALESCE(sp.major, tc.major),
    updated_at = NOW()
FROM teaching_class tc
WHERE sp.class_id = tc.id;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_student_profile_teaching_class') THEN
        ALTER TABLE student_profile
            ADD CONSTRAINT fk_student_profile_teaching_class
            FOREIGN KEY (class_id) REFERENCES teaching_class(id) NOT VALID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_teacher_class_assignment_teaching_class') THEN
        ALTER TABLE teacher_class_assignment
            ADD CONSTRAINT fk_teacher_class_assignment_teaching_class
            FOREIGN KEY (class_id) REFERENCES teaching_class(id) NOT VALID;
    END IF;
END $$;
