-- Normalize legacy role rows before the application starts enforcing the
-- invariant that ADMIN is standalone and STUDENT cannot be mixed with staff.
DELETE FROM auth_user_role role_row
WHERE role_row.role_code <> 'ADMIN'
  AND EXISTS (
      SELECT 1
      FROM auth_user_role admin_row
      WHERE admin_row.user_id = role_row.user_id
        AND admin_row.role_code = 'ADMIN'
  );

DELETE FROM auth_user_role role_row
WHERE role_row.role_code = 'STUDENT'
  AND EXISTS (
      SELECT 1
      FROM auth_user_role staff_row
      WHERE staff_row.user_id = role_row.user_id
        AND staff_row.role_code IN ('TEACHER', 'TA')
  );

ALTER TABLE exam
    ADD COLUMN IF NOT EXISTS created_by_user_id VARCHAR(64);

-- Backfill the stable owner ID for legacy rows. New rows are populated by
-- ExamService and no longer rely on a mutable display name.
UPDATE exam e
SET created_by_user_id = u.id
FROM auth_user u
WHERE e.created_by_user_id IS NULL
  AND (
      e.created_by = u.id
      OR LOWER(e.created_by) = LOWER(u.username)
      OR LOWER(e.created_by) = LOWER(u.name)
  );

CREATE INDEX IF NOT EXISTS idx_exam_created_by_user
    ON exam(created_by_user_id, updated_at DESC);
