ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS username VARCHAR(64);
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255);
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS password_updated_at TIMESTAMPTZ;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
ALTER TABLE auth_user ADD COLUMN IF NOT EXISTS account_source VARCHAR(32) NOT NULL DEFAULT 'SYSTEM_SEED';

UPDATE auth_user
SET username = COALESCE(username, email, id),
    password_hash = COALESCE(password_hash, 'pbkdf2:120000:E5YGr6c97DQN0Nt39iPn+g==:1Xwe8ZbNlBBHZd1vd4fBkNMoV7Q5rOOjU7tl5jgK3H0='),
    must_change_password = COALESCE(must_change_password, FALSE),
    password_updated_at = COALESCE(password_updated_at, NOW()),
    account_source = COALESCE(account_source, 'SYSTEM_SEED'),
    updated_at = NOW();

ALTER TABLE auth_user ALTER COLUMN username SET NOT NULL;
ALTER TABLE auth_user ALTER COLUMN password_hash SET NOT NULL;
ALTER TABLE auth_user ALTER COLUMN account_source SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS ux_auth_user_username_lower ON auth_user (LOWER(username));
CREATE INDEX IF NOT EXISTS idx_auth_user_last_login ON auth_user(last_login_at DESC);

CREATE TABLE IF NOT EXISTS student_profile (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    student_no VARCHAR(64) NOT NULL,
    class_id VARCHAR(64) NOT NULL,
    class_name VARCHAR(128) NOT NULL,
    grade VARCHAR(32),
    major VARCHAR(128),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_student_profile_student_no ON student_profile(student_no);
CREATE UNIQUE INDEX IF NOT EXISTS ux_student_profile_user ON student_profile(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profile_class ON student_profile(class_id, student_no);

CREATE TABLE IF NOT EXISTS roster_import_task (
    id VARCHAR(64) PRIMARY KEY,
    operator_id VARCHAR(64) NOT NULL REFERENCES auth_user(id),
    class_id VARCHAR(64) NOT NULL,
    class_name VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL,
    total_count INTEGER NOT NULL DEFAULT 0,
    created_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    error_report_json TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    finished_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_roster_import_status CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCEEDED', 'PARTIAL_FAILED', 'FAILED'))
);

CREATE INDEX IF NOT EXISTS idx_roster_import_class ON roster_import_task(class_id, created_at DESC);

CREATE TABLE IF NOT EXISTS auth_audit_log (
    id VARCHAR(64) PRIMARY KEY,
    actor_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    target_user_id VARCHAR(64),
    result VARCHAR(32) NOT NULL,
    detail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_auth_audit_actor ON auth_audit_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_auth_audit_target ON auth_audit_log(target_user_id, created_at DESC);

UPDATE auth_user
SET username = 'teacher@mindmark.local',
    password_hash = 'pbkdf2:120000:E5YGr6c97DQN0Nt39iPn+g==:1Xwe8ZbNlBBHZd1vd4fBkNMoV7Q5rOOjU7tl5jgK3H0=',
    must_change_password = FALSE,
    password_updated_at = NOW(),
    account_source = 'SYSTEM_SEED',
    updated_at = NOW()
WHERE id = 'u-teacher-001';

INSERT INTO auth_user (id, name, email, username, password_hash, must_change_password, password_updated_at, account_source, status, student_id, created_at, updated_at) VALUES
('u-student-001', 'MindMark Demo Student', 'student001@mindmark.local', '202601345678', 'pbkdf2:120000:4BK7TAtM9FQKX+WsLiWPyg==:Efl7RUn/999Pu9APofXlm9ZCYGOI6c3jauIPYEaoQ3E=', TRUE, NOW(), 'SYSTEM_SEED', 'ACTIVE', 'student-001', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    email = EXCLUDED.email,
    username = EXCLUDED.username,
    password_hash = EXCLUDED.password_hash,
    must_change_password = EXCLUDED.must_change_password,
    password_updated_at = EXCLUDED.password_updated_at,
    account_source = EXCLUDED.account_source,
    status = EXCLUDED.status,
    student_id = EXCLUDED.student_id,
    updated_at = EXCLUDED.updated_at;

INSERT INTO auth_user_role (user_id, role_code) VALUES
('u-student-001', 'STUDENT')
ON CONFLICT (user_id, role_code) DO NOTHING;

INSERT INTO student_profile (id, user_id, student_no, class_id, class_name, grade, major, created_at, updated_at) VALUES
('student-001', 'u-student-001', '202601345678', 'class-demo-001', '软件工程 1 班', '2026', '软件工程', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    student_no = EXCLUDED.student_no,
    class_id = EXCLUDED.class_id,
    class_name = EXCLUDED.class_name,
    grade = EXCLUDED.grade,
    major = EXCLUDED.major,
    updated_at = EXCLUDED.updated_at;
