ALTER TABLE answer_sheet
    ADD COLUMN IF NOT EXISTS option_order_json TEXT NOT NULL DEFAULT '{}';

COMMENT ON COLUMN answer_sheet.option_order_json IS
    'Per-answer-sheet choice mapping: questionId -> displayOptionKey -> originalOptionKey';
