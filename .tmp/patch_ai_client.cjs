const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiChatQuestionGenerationClient.java';
let s = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
s = s.replace(`    public String completeText(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens, String systemPrompt) {
        return callProvider(config, prompt, responseMaxTokens, systemPrompt);
    }

    private String callProvider(AiProviderRuntimeConfig config, String prompt) {
        return callProvider(config, prompt, maxTokens);
    }

    private String callProvider(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens) {
        return callProvider(config, prompt, responseMaxTokens, SYSTEM_PROMPT);
    }

    private String callProvider(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens, String systemPrompt) {
        try {
            return AiProviderSettingService.ANTHROPIC_PROVIDER.equals(config.provider())
                ? generateWithAnthropic(config, prompt, responseMaxTokens, systemPrompt)
                : generateWithOpenAiCompatible(config, prompt, responseMaxTokens, systemPrompt);
`, `    public String completeText(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens, String systemPrompt) {
        return completeText(config, prompt, responseMaxTokens, systemPrompt, timeoutMs);
    }

    public String completeText(
        AiProviderRuntimeConfig config,
        String prompt,
        int responseMaxTokens,
        String systemPrompt,
        long requestTimeoutMs
    ) {
        return callProvider(config, prompt, responseMaxTokens, systemPrompt, requestTimeoutMs);
    }

    private String callProvider(AiProviderRuntimeConfig config, String prompt) {
        return callProvider(config, prompt, maxTokens);
    }

    private String callProvider(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens) {
        return callProvider(config, prompt, responseMaxTokens, SYSTEM_PROMPT);
    }

    private String callProvider(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens, String systemPrompt) {
        return callProvider(config, prompt, responseMaxTokens, systemPrompt, timeoutMs);
    }

    private String callProvider(
        AiProviderRuntimeConfig config,
        String prompt,
        int responseMaxTokens,
        String systemPrompt,
        long requestTimeoutMs
    ) {
        try {
            return AiProviderSettingService.ANTHROPIC_PROVIDER.equals(config.provider())
                ? generateWithAnthropic(config, prompt, responseMaxTokens, systemPrompt, requestTimeoutMs)
                : generateWithOpenAiCompatible(config, prompt, responseMaxTokens, systemPrompt, requestTimeoutMs);
`);
s = s.replace(`    private String generateWithOpenAiCompatible(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens, String systemPrompt) {
        OpenAiChatResponse response = restClient(config.baseUrl()).post()
`, `    private String generateWithOpenAiCompatible(
        AiProviderRuntimeConfig config,
        String prompt,
        int responseMaxTokens,
        String systemPrompt,
        long requestTimeoutMs
    ) {
        OpenAiChatResponse response = restClient(config.baseUrl(), requestTimeoutMs).post()
`);
s = s.replace(`    private String generateWithAnthropic(AiProviderRuntimeConfig config, String prompt, int responseMaxTokens, String systemPrompt) {
        AnthropicMessageResponse response = restClient(config.baseUrl()).post()
`, `    private String generateWithAnthropic(
        AiProviderRuntimeConfig config,
        String prompt,
        int responseMaxTokens,
        String systemPrompt,
        long requestTimeoutMs
    ) {
        AnthropicMessageResponse response = restClient(config.baseUrl(), requestTimeoutMs).post()
`);
s = s.replace(`    private RestClient restClient(String baseUrl) {
        return restClientBuilder.clone()
            .baseUrl(baseUrl)
            .requestFactory(ClientHttpRequestFactories.get(ClientHttpRequestFactorySettings.DEFAULTS
                .withConnectTimeout(Duration.ofMillis(timeoutMs))
                .withReadTimeout(Duration.ofMillis(timeoutMs))))
            .build();
    }
`, `    private RestClient restClient(String baseUrl) {
        return restClient(baseUrl, timeoutMs);
    }

    private RestClient restClient(String baseUrl, long requestTimeoutMs) {
        long effectiveTimeoutMs = requestTimeoutMs > 0 ? requestTimeoutMs : timeoutMs;
        return restClientBuilder.clone()
            .baseUrl(baseUrl)
            .requestFactory(ClientHttpRequestFactories.get(ClientHttpRequestFactorySettings.DEFAULTS
                .withConnectTimeout(Duration.ofMillis(effectiveTimeoutMs))
                .withReadTimeout(Duration.ofMillis(effectiveTimeoutMs))))
            .build();
    }
`);
fs.writeFileSync(path, s, 'utf8');
