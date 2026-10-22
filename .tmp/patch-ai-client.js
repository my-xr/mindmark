const fs = require('fs');
const p = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiChatQuestionGenerationClient.java';
let s = fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, '');
const old = `    public List<QuestionCreateRequest> generate(
        AiProviderRuntimeConfig config,
        CourseEntity course,
        AiQuestionGenerateRequest request
    ) {
        String prompt = buildPrompt(course, request);
        String content = callQuestionProviderWithRetry(config, prompt);
        try {
            return parseQuestions(content, request);
        } catch (BusinessException exception) {
            if (isNonChineseContentFailure(exception)) {
                String retryPrompt = prompt + "\\n\\n上一次输出未满足中文要求。请重新生成，所有题干、选项、解析、评分点必须为简体中文，技术术语可保留英文缩写但需要中文解释。";
                return parseQuestions(callQuestionProviderWithRetry(config, retryPrompt), request);
            }
            if (isJsonParseFailure(exception)) {
                String retryPrompt = prompt + "\\n\\n上一次输出不是合法题目 JSON。请重新生成，只输出一个 JSON 对象，格式必须是 {\\"questions\\":[...]}，不要输出 Markdown、解释、思考过程或多余文本。";
                return parseQuestions(callQuestionProviderWithRetry(config, retryPrompt), request);
            }
            throw exception;
        }
    }
`;
const neu = `    public List<QuestionCreateRequest> generate(
        AiProviderRuntimeConfig config,
        CourseEntity course,
        AiQuestionGenerateRequest request
    ) {
        String basePrompt = buildPrompt(course, request);
        String prompt = basePrompt;
        BusinessException lastRetryableException = null;
        for (int attempt = 1; attempt <= 3; attempt++) {
            String content = callQuestionProviderWithRetry(config, prompt);
            try {
                return parseQuestions(content, request);
            } catch (BusinessException exception) {
                if (!isRetryableGenerationFailure(exception) || attempt == 3) {
                    throw exception;
                }
                lastRetryableException = exception;
                prompt = basePrompt + retryInstruction(exception, attempt + 1);
            }
        }
        throw lastRetryableException == null
            ? new BusinessException(ErrorCode.INTERNAL_ERROR, "AI question generation failed")
            : lastRetryableException;
    }
`;
if (!s.includes(old)) throw new Error('generate block not found');
s = s.replace(old, neu);
const anchor = `    private boolean isJsonParseFailure(BusinessException exception) {
        String message = exception.getMessage();
        return message != null && (
            message.contains("Failed to parse AI question JSON")
                || message.contains("AI response must contain questions array")
        );
    }
`;
const insert = anchor + `
    private boolean isRetryableGenerationFailure(BusinessException exception) {
        return isNonChineseContentFailure(exception) || isJsonParseFailure(exception) || isEmptyOrLengthFailure(exception);
    }

    private String retryInstruction(BusinessException exception, int nextAttempt) {
        if (isNonChineseContentFailure(exception)) {
            return "\\n\\n第 " + nextAttempt + " 次生成要求：上一次输出仍包含英文题干/选项/解析。请重新生成，所有题干、选项 content、解析 analysis、评分点 description 必须包含简体中文说明；技术名词如 props、emit、provide/inject 可以保留，但必须写成中文解释短语，例如：\\\"props 属性用于父组件向子组件传递数据\\\"。";
        }
        if (isJsonParseFailure(exception)) {
            return "\\n\\n第 " + nextAttempt + " 次生成要求：上一次输出不是合法题目 JSON。请只输出一个 JSON 对象，格式必须是 {\\\"questions\\\":[...]}，不要输出 Markdown、解释、思考过程或多余文本。";
        }
        return "\\n\\n第 " + nextAttempt + " 次生成要求：上一次输出为空或被截断。请压缩表达，直接输出最终 JSON，不要输出思考过程，最终答案必须放在 message.content 中。";
    }
`;
if (!s.includes(anchor)) throw new Error('anchor not found');
s = s.replace(anchor, insert);
s = s.replace('            1. 所有 title、content、analysis、description 必须是简体中文。\r\n', '            1. 所有 title、content、analysis、description 必须包含简体中文；技术名词可以保留英文，但必须搭配中文解释，不允许选项只有英文单词。\r\n');
fs.writeFileSync(p, s, 'utf8');