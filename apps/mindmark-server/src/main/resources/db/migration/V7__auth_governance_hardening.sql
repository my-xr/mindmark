CREATE TABLE IF NOT EXISTS teacher_class_assignment (
    id VARCHAR(64) PRIMARY KEY,
    user_id VARCHAR(64) NOT NULL REFERENCES auth_user(id) ON DELETE CASCADE,
    class_id VARCHAR(64) NOT NULL,
    assignment_role VARCHAR(32) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_teacher_class_assignment_role CHECK (assignment_role IN ('OWNER', 'ASSISTANT'))
);

CREATE UNIQUE INDEX IF NOT EXISTS ux_teacher_class_assignment_user_class ON teacher_class_assignment(user_id, class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_class_assignment_class ON teacher_class_assignment(class_id, user_id);

INSERT INTO teacher_class_assignment (id, user_id, class_id, assignment_role, created_at) VALUES
('tca-demo-teacher-class-demo-001', 'u-teacher-001', 'class-demo-001', 'OWNER', NOW())
ON CONFLICT (id) DO NOTHING;
