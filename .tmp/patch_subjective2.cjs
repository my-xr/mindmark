const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/SubjectiveGradingPolicy.java';
let s = fs.readFileSync(path, 'utf8').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
const oldBlock = /    private final AiChatQuestionGenerationClient aiChatQuestionGenerationClient;\n    private final boolean providerGradingEnabled;\n\n    public SubjectiveGradingPolicy\(\n        ObjectMapper objectMapper,\n        AiProviderSettingService aiProviderSettingService,\n        AiChatQuestionGenerationClient aiChatQuestionGenerationClient,\n        @Value\("\$\{mindmark\.ai\.grading\.provider-enabled:true\}"\) boolean providerGradingEnabled\n    \) \{\n        this\.objectMapper = objectMapper;\n        this\.aiProviderSettingService = aiProviderSettingService;\n        this\.aiChatQuestionGenerationClient = aiChatQuestionGenerationClient;\n        this\.providerGradingEnabled = providerGradingEnabled;\n    \}/;
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
if (!oldBlock.test(s)) throw new Error('old constructor regex not found');
s = s.replace(oldBlock, newBlock);
const oldCall = /            String content = aiChatQuestionGenerationClient\.completeText\(\n                config,\n                buildProviderPrompt\(question, answer, safeMaxScore\),\n                1000,\n                AI_GRADING_SYSTEM_PROMPT\n            \);/;
const newCall = [
'            String content = aiChatQuestionGenerationClient.completeText(',
'                config,',
'                buildProviderPrompt(question, answer, safeMaxScore),',
'                Math.max(256, providerMaxTokens),',
'                AI_GRADING_SYSTEM_PROMPT,',
'                providerRequestTimeoutMs',
'            );'
].join('\n');
if (!oldCall.test(s)) throw new Error('old completeText call regex not found');
s = s.replace(oldCall, newCall);
fs.writeFileSync(path, s, 'utf8');
