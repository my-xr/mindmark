const fs=require('fs');
const p='apps/mindmark-server/src/main/java/com/mindmark/server/modules/auth/domain/AuthAuditLogEntity.java';
let s=fs.readFileSync(p,'utf8').replace(/^\uFEFF/,'');
s=s.replace('@Column(name = "target_user_id", length = 64)', '@Column(name = "target_user_id", length = 160)');
fs.writeFileSync(p,s,'utf8');
const sql='ALTER TABLE auth_audit_log ALTER COLUMN target_user_id TYPE varchar(160);\n';
fs.writeFileSync('apps/mindmark-server/src/main/resources/db/migration/V24__auth_audit_target_length.sql', sql, 'utf8');
