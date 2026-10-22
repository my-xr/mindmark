-- Keep database constraints aligned with QuestionType / QuestionStatus enums after enterprise subjective question expansion.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_question_type') THEN
        ALTER TABLE question DROP CONSTRAINT ck_question_type;
    END IF;
END $$;

ALTER TABLE question
    ADD CONSTRAINT ck_question_type
    CHECK (type IN (
        'SINGLE_CHOICE',
        'MULTIPLE_CHOICE',
        'TRUE_FALSE',
        'FILL_BLANK',
        'SHORT_ANSWER',
        'ESSAY',
        'CASE_ANALYSIS',
        'PROGRAMMING'
    ));

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ck_question_status') THEN
        ALTER TABLE question DROP CONSTRAINT ck_question_status;
    END IF;
END $$;

ALTER TABLE question
    ADD CONSTRAINT ck_question_status
    CHECK (status IN ('DRAFT', 'PENDING_REVIEW', 'ACTIVE', 'DISABLED', 'REJECTED'));
