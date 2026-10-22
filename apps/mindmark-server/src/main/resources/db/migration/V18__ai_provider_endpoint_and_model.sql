ALTER TABLE ai_provider_setting
    ADD COLUMN IF NOT EXISTS base_url VARCHAR(512),
    ADD COLUMN IF NOT EXISTS model VARCHAR(128);

UPDATE ai_provider_setting
SET base_url = CASE
        WHEN provider = 'ANTHROPIC' THEN 'https://api.anthropic.com/v1'
        ELSE 'https://api.openai.com/v1'
    END
WHERE base_url IS NULL OR base_url = '';

UPDATE ai_provider_setting
SET model = CASE
        WHEN provider = 'ANTHROPIC' THEN 'claude-3-5-sonnet-latest'
        ELSE 'gpt-4.1-mini'
    END
WHERE model IS NULL OR model = '';

ALTER TABLE ai_provider_setting
    ALTER COLUMN base_url SET NOT NULL,
    ALTER COLUMN model SET NOT NULL;
