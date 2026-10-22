const fs=require('fs'); const p='apps/mindmark-server/openapi/mindmark-api.yaml'; let s=fs.readFileSync(p,'utf8');
s=s.replace(`    AiProviderSettingRequest:
      type: object
      required: [provider, apiKey]
      properties:
        provider:
          type: string
          enum: [OPENAI, ANTHROPIC]
          description: AI provider selected by the teacher.
        apiKey:
          type: string
          writeOnly: true
          description: Plaintext OpenAI or Anthropic API key submitted once and encrypted at rest.`, `    AiProviderSettingRequest:
      type: object
      required: [provider, baseUrl, model]
      properties:
        provider:
          type: string
          enum: [OPENAI, ANTHROPIC]
          description: AI provider selected by the teacher.
        baseUrl:
          type: string
          example: https://api.openai.com/v1
          description: Provider server base URL. OpenAI-compatible providers use /chat/completions under this base URL.
        model:
          type: string
          example: gpt-4.1-mini
          description: Model name used for AI question generation.
        apiKey:
          type: string
          writeOnly: true
          description: Plaintext OpenAI or Anthropic API key submitted once and encrypted at rest. Required on first personal save; optional when updating endpoint/model.`);
s=s.replace(`        keyPreview: { type: string, nullable: true, example: '****abcdef' }
        updatedAt: { type: string, format: date-time, nullable: true }`, `        keyPreview: { type: string, nullable: true, example: '****abcdef' }
        baseUrl: { type: string, example: https://api.openai.com/v1 }
        model: { type: string, example: gpt-4.1-mini }
        updatedAt: { type: string, format: date-time, nullable: true }`);
fs.writeFileSync(p,s,'utf8');
