const fs=require('fs'); const p='apps/mindmark-web/src/services/aiQuestionService.ts'; let s=fs.readFileSync(p,'utf8');
s=s.replace(`export interface AiProviderSetting {
  provider: AiProvider;
  providerLabel: string;
  configured: boolean;
  keyPreview?: string | null;
  updatedAt?: string | null;
}

export interface AiProviderSettingRequest {
  provider: AiProvider;
  apiKey: string;
}`, `export interface AiProviderSetting {
  provider: AiProvider;
  providerLabel: string;
  configured: boolean;
  keyPreview?: string | null;
  baseUrl: string;
  model: string;
  updatedAt?: string | null;
}

export interface AiProviderSettingRequest {
  provider: AiProvider;
  baseUrl: string;
  model: string;
  apiKey?: string;
}`);
s=s.replace(`const providerLabels: Record<AiProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
};

const createEmptyProviderSetting = (provider: AiProvider): AiProviderSetting => ({
  provider,
  providerLabel: providerLabels[provider],
  configured: false,
  keyPreview: null,
  updatedAt: null,
});`, `export const providerLabels: Record<AiProvider, string> = {
  OPENAI: 'OpenAI',
  ANTHROPIC: 'Anthropic',
};

export const providerDefaults: Record<AiProvider, { baseUrl: string; model: string }> = {
  OPENAI: { baseUrl: 'https://api.openai.com/v1', model: 'gpt-4.1-mini' },
  ANTHROPIC: { baseUrl: 'https://api.anthropic.com/v1', model: 'claude-3-5-sonnet-latest' },
};

const createEmptyProviderSetting = (provider: AiProvider): AiProviderSetting => ({
  provider,
  providerLabel: providerLabels[provider],
  configured: false,
  keyPreview: null,
  baseUrl: providerDefaults[provider].baseUrl,
  model: providerDefaults[provider].model,
  updatedAt: null,
});`);
s=s.replace(`export async function saveAiProviderSetting(
  provider: AiProvider,
  apiKey: string,
): Promise<AiProviderSetting> {
  if (!useMockApi) {
    return apiPut<AiProviderSetting, AiProviderSettingRequest>('/v1/ai/provider-settings', {
      provider,
      apiKey,
    });
  }

  mockProviderSettings[provider] = {
    provider,
    providerLabel: providerLabels[provider],
    configured: Boolean(apiKey.trim()),
    keyPreview: apiKey ? \`****\${apiKey.slice(-6)}\` : null,
    updatedAt: nowText(),
  };
  return mockDelay({ ...mockProviderSettings[provider] });
}`, `export async function saveAiProviderSetting(
  request: AiProviderSettingRequest,
): Promise<AiProviderSetting> {
  if (!useMockApi) {
    return apiPut<AiProviderSetting, AiProviderSettingRequest>('/v1/ai/provider-settings', request);
  }

  const apiKey = request.apiKey?.trim() ?? '';
  const previous = mockProviderSettings[request.provider];
  mockProviderSettings[request.provider] = {
    provider: request.provider,
    providerLabel: providerLabels[request.provider],
    configured: Boolean(apiKey) || previous.configured,
    keyPreview: apiKey ? \`****\${apiKey.slice(-6)}\` : previous.keyPreview,
    baseUrl: request.baseUrl.trim() || providerDefaults[request.provider].baseUrl,
    model: request.model.trim() || providerDefaults[request.provider].model,
    updatedAt: nowText(),
  };
  return mockDelay({ ...mockProviderSettings[request.provider] });
}`);
fs.writeFileSync(p,s,'utf8');
