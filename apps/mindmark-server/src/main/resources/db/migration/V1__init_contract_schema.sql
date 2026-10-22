-- Iteration 7 backend skeleton baseline schema.
-- Only infrastructure-level tables are created in this iteration; business tables will be added with module implementation.

CREATE TABLE IF NOT EXISTS audit_operation_log (
    id BIGSERIAL PRIMARY KEY,
    actor_id VARCHAR(64),
    actor_role VARCHAR(32),
    action VARCHAR(128) NOT NULL,
    target_type VARCHAR(64),
    target_id VARCHAR(64),
    detail JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS api_contract_snapshot (
    id BIGSERIAL PRIMARY KEY,
    contract_version VARCHAR(32) NOT NULL,
    source_path VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_operation_log_actor ON audit_operation_log(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_operation_log_target ON audit_operation_log(target_type, target_id);
