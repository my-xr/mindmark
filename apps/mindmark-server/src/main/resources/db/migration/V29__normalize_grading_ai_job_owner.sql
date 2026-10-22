-- Existing AI grading jobs created before exam.created_by_user_id was added
-- may contain a display name or username in teacher_id. Normalize them to the
-- stable account ID so queued/recovered jobs cannot use another teacher's
-- provider configuration.
UPDATE grading_ai_job j
SET teacher_id = e.created_by_user_id
FROM grading_task task
JOIN exam e ON e.id = task.exam_id
JOIN auth_user owner_user ON owner_user.id = e.created_by_user_id
WHERE j.grading_task_id = task.id
  AND e.created_by_user_id IS NOT NULL
  AND (
      j.teacher_id = e.created_by
      OR j.teacher_id = owner_user.username
      OR j.teacher_id = owner_user.email
      OR j.teacher_id = owner_user.name
  );

CREATE INDEX IF NOT EXISTS idx_grading_ai_job_teacher_updated
    ON grading_ai_job(teacher_id, updated_at DESC);
