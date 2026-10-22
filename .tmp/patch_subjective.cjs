const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/SubjectiveGradingPolicy.java';
let s = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '');
const oldBlock = [
'    private final AiChatQuestionGenerationClient aiChatQuestionGenerationClient;',
'    private final boolean providerGradingEnabled;',
'',
'    public SubjectiveGradingPolicy(',
'        ObjectMapper objectMapper,',
'        AiProviderSettingService aiProviderSettingService,',
'        AiChatQuestionGenerationClient aiChatQuestionGenerationClient,',
'        @Value("${mindmark.ai.grading.provider-enabled:true}") boolean providerGradingEnabled',
'    ) {',
'        this.objectMapper = objectMapper;',
'        this.aiProviderSettingService = aiProviderSettingService;',
'        this.aiChatQuestionGenerationClient = aiChatQuestionGenerationClient;',
'        this.providerGradingEnabled = providerGradingEnabled;',
'    }'
].join('\n');
const newBlock = [
'    private final AiChatQuestionGenerationClient aiChatQuestionGenerationClient;',
'    private final boolean providerGradingEnabled;',
'    private final long providerRequestTimeoutMs;',
'    private final int providerMaxTokens;',
'',
'    public SubjectiveGradingPolicy(',
'        ObjectMapper objectMapper,',
'        AiProviderSettingService aiProviderSettingService,',
'        AiChatQuestionGenerationClient aiChatQuestionGenerationClient,',
'        @Value("${mindmark.ai.grading.provider-enabled:true}") boolean providerGradingEnabled,',
'        @Value("${mindmark.ai.grading.timeout-ms:25000}") long providerRequestTimeoutMs,',
'        @Value("${mindmark.ai.grading.max-tokens:1000}") int providerMaxTokens',
'    ) {',
'        this.objectMapper = objectMapper;',
'        this.aiProviderSettingService = aiProviderSettingService;',
'        this.aiChatQuestionGenerationClient = aiChatQuestionGenerationClient;',
'        this.providerGradingEnabled = providerGradingEnabled;',
'        this.providerRequestTimeoutMs = providerRequestTimeoutMs;',
'        this.providerMaxTokens = providerMaxTokens;',
'    }'
].join('\n');
if (!s.includes(oldBlock)) throw new Error('old constructor block not found');
s = s.replace(oldBlock, newBlock);
const oldCall = [
'            String content = aiChatQuestionGenerationClient.completeText(',
'                config,',
'                buildProviderPrompt(question, answer, safeMaxScore),',
'                1000,',
'                AI_GRADING_SYSTEM_PROMPT',
'            );'
].join('\n');
const newCall = [
'            String content = aiChatQuestionGenerationClient.completeText(',
'                config,',
'                buildProviderPrompt(question, answer, safeMaxScore),',
'                Math.max(256, providerMaxTokens),',
'                AI_GRADING_SYSTEM_PROMPT,',
'                providerRequestTimeoutMs',
'            );'
].join('\n');
if (!s.includes(oldCall)) throw new Error('old completeText call not found');
s = s.replace(oldCall, newCall);
fs.writeFileSync(path, s, 'utf8');

