ALTER TABLE grading_item
    ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(5, 2),
    ADD COLUMN IF NOT EXISTS needs_review BOOLEAN;

UPDATE grading_item
SET ai_confidence = CASE
        WHEN is_objective = TRUE THEN 1.00
        WHEN auto_score IS NULL OR max_score IS NULL OR max_score <= 0 THEN 0.70
        WHEN auto_score / NULLIF(max_score, 0) < 0.15 THEN 0.72
        WHEN auto_score / NULLIF(max_score, 0) > 0.95 THEN 0.72
        ELSE 0.86
    END,
    needs_review = CASE
        WHEN is_objective = TRUE THEN FALSE
        WHEN final_score IS NULL AND auto_score IS NULL THEN TRUE
        WHEN is_correct = FALSE THEN TRUE
        ELSE FALSE
    END
WHERE ai_confidence IS NULL OR needs_review IS NULL;

CREATE INDEX IF NOT EXISTS idx_grading_item_review_required
    ON grading_item(grading_task_id, needs_review)
    WHERE needs_review = TRUE;
