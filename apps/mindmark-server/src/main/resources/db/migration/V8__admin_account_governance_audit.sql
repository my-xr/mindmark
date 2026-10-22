ALTER TABLE auth_user
    ADD COLUMN IF NOT EXISTS failed_login_count INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_auth_user_status_locked ON auth_user(status, locked_until);
CREATE INDEX IF NOT EXISTS idx_auth_audit_action_result ON auth_audit_log(action, result, created_at DESC);