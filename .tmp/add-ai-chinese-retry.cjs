const fs = require('fs');
const path = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiChatQuestionGenerationClient.java';
let s = fs.readFileSync(path, 'utf8');
const old = `    public List<QuestionCreateRequest> generate(
        String provider,
        String apiKey,
        CourseEntity course,
        AiQuestionGenerateRequest request
    ) {
        String prompt = buildPrompt(course, request);
        String content = AiProviderSettingService.ANTHROPIC_PROVIDER.equals(provider)
            ? generateWithAnthropic(apiKey, prompt)
            : generateWithOpenAiCompatible(apiKey, prompt);
        return parseQuestions(content, request);
    }
`;
const replacement = `    public List<QuestionCreateRequest> generate(
        String provider,
        String apiKey,
        CourseEntity course,
        AiQuestionGenerateRequest request
    ) {
        String prompt = buildPrompt(course, request);
        String content = callProvider(provider, apiKey, prompt);
        try {
            return parseQuestions(content, request);
        } catch (BusinessException exception) {
            if (!isNonChineseContentFailure(exception)) {
                throw exception;
            }
            String retryPrompt = prompt + "\\n\\n上一次输出未满足中文要求。请重新生成，所有题干、选项、解析、评分点必须为简体中文，技术术语可保留英文缩写但需要中文解释。";
            return parseQuestions(callProvider(provider, apiKey, retryPrompt), request);
        }
    }

    private String callProvider(String provider, String apiKey, String prompt) {
        return AiProviderSettingService.ANTHROPIC_PROVIDER.equals(provider)
            ? generateWithAnthropic(apiKey, prompt)
            : generateWithOpenAiCompatible(apiKey, prompt);
    }

    private boolean isNonChineseContentFailure(BusinessException exception) {
        return exception.getMessage() != null && exception.getMessage().contains("AI generated non-Chinese content");
    }
`;
if (!s.includes(old)) throw new Error('generate method pattern not found');
s = s.replace(old, replacement);
fs.writeFileSync(path, s, 'utf8');
