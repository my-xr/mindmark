CREATE TABLE IF NOT EXISTS auth_user (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    email VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    student_id VARCHAR(64),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_auth_user_status CHECK (status IN ('ACTIVE', 'DISABLED'))
);

CREATE TABLE IF NOT EXISTS auth_role (
    code VARCHAR(32) PRIMARY KEY,
    name VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS auth_user_role (
    user_id VARCHAR(64) NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    role_code VARCHAR(32) NOT NULL REFERENCES auth_role(code),
    PRIMARY KEY (user_id, role_code)
);

CREATE INDEX IF NOT EXISTS idx_auth_user_email ON auth_user(email);
CREATE INDEX IF NOT EXISTS idx_auth_user_student ON auth_user(student_id);

INSERT INTO auth_role (code, name) VALUES
('ADMIN', 'System Administrator'),
('TEACHER', 'Teacher'),
('TA', 'Teaching Assistant'),
('STUDENT', 'Student')
ON CONFLICT (code) DO NOTHING;

INSERT INTO auth_user (id, name, email, status, student_id, created_at, updated_at) VALUES
('u-teacher-001', 'MindMark Demo Teacher', 'teacher@mindmark.local', 'ACTIVE', 'student-001', '2026-07-18 00:00:00+08', '2026-07-18 00:00:00+08')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    status = EXCLUDED.status,
    student_id = EXCLUDED.student_id,
    updated_at = EXCLUDED.updated_at;

INSERT INTO auth_user_role (user_id, role_code) VALUES
('u-teacher-001', 'ADMIN'),
('u-teacher-001', 'TEACHER'),
('u-teacher-001', 'TA'),
('u-teacher-001', 'STUDENT')
ON CONFLICT (user_id, role_code) DO NOTHING;
