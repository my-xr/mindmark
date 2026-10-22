-- MindMark 数据治理脚本：修复历史 auth_user.student_id 存为学号的问题。
--
-- 背景：早期导入链路中，auth_user.student_id 可能写入 student_profile.student_no（学号），
--      当前标准应写入 student_profile.id。该脚本把可唯一匹配的历史数据统一修正为档案 ID。
--
-- 使用方式：
--   1. 执行前备份 auth_user / student_profile。
--   2. 在 mindmark 数据库执行：psql -h localhost -p 5432 -U postgres -d mindmark -f apps/mindmark-server/scripts/maintenance/fix-auth-user-student-id.sql
--   3. 执行后查看脚本末尾的 remaining_mismatch_count，若不为 0，需要人工核对。
--
-- 幂等性：可重复执行；只有 auth_user.student_id = student_profile.student_no 的记录会被更新。

BEGIN;

-- 执行前差异快照：student_id 不是 profile.id，但可通过 user_id + student_no 匹配。
CREATE TEMP TABLE IF NOT EXISTS tmp_auth_user_student_id_fix AS
SELECT
  u.id AS user_id,
  u.username,
  u.student_id AS old_student_id,
  sp.id AS expected_student_profile_id,
  sp.student_no
FROM auth_user u
JOIN student_profile sp ON (sp.user_id = u.id OR sp.student_no = u.username)
WHERE u.student_id IS NOT NULL
  AND u.student_id <> sp.id
  AND u.student_id = sp.student_no;

UPDATE auth_user u
SET student_id = sp.id,
    updated_at = NOW()
FROM student_profile sp
WHERE (sp.user_id = u.id OR sp.student_no = u.username)
  AND u.student_id IS NOT NULL
  AND u.student_id <> sp.id
  AND u.student_id = sp.student_no;

COMMIT;

-- 本次修复明细。
SELECT * FROM tmp_auth_user_student_id_fix ORDER BY username;

-- 剩余不一致数据：可能是人工创建或历史脏数据，需要单独核对，不自动修复。
SELECT COUNT(*) AS remaining_mismatch_count
FROM auth_user u
JOIN student_profile sp ON (sp.user_id = u.id OR sp.student_no = u.username)
WHERE u.student_id IS NOT NULL
  AND u.student_id <> sp.id;