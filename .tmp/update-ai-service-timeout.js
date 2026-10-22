const fs = require('fs');
const p = 'apps/mindmark-web/src/services/aiQuestionService.ts';
let s = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const marker = "export const providerDefaults: Record<AiProvider, { baseUrl: string; model: string }> = {\n  OPENAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },\n  ANTHROPIC: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },\n};";
const replacement = marker + "\n\nconst AI_CONNECTION_TEST_TIMEOUT_MS = Number(import.meta.env.VITE_AI_CONNECTION_TEST_TIMEOUT_MS || 45000);\nconst AI_QUESTION_GENERATION_TIMEOUT_MS = Number(import.meta.env.VITE_AI_GENERATION_TIMEOUT_MS || 120000);";
if (!s.includes('AI_QUESTION_GENERATION_TIMEOUT_MS')) s = s.replace(marker, replacement);
s = s.replace(
  "return apiPost<AiProviderConnectionTestResponse, AiProviderConnectionTestRequest>(\n      '/v1/ai/provider-settings/test',\n      request,\n    );",
  "return apiPost<AiProviderConnectionTestResponse, AiProviderConnectionTestRequest>(\n      '/v1/ai/provider-settings/test',\n      request,\n      { timeout: AI_CONNECTION_TEST_TIMEOUT_MS },\n    );",
);
s = s.replace(
  "await apiPost<ServerQuestionResponse[], ServerAiQuestionGenerateRequest>(\n      '/v1/ai/questions/generate',\n      toServerGenerateRequest(request),\n    );",
  "await apiPost<ServerQuestionResponse[], ServerAiQuestionGenerateRequest>(\n      '/v1/ai/questions/generate',\n      toServerGenerateRequest(request),\n      { timeout: AI_QUESTION_GENERATION_TIMEOUT_MS },\n    );",
);
fs.writeFileSync(p, s, 'utf8');