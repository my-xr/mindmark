from pathlib import Path
p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/ai/service/AiChatQuestionGenerationClient.java')
text = p.read_text(encoding='utf-8-sig')
old = '''    private boolean isRetryableGenerationFailure(BusinessException exception) {
        return isNonChineseContentFailure(exception) || isJsonParseFailure(exception) || isEmptyOrLengthFailure(exception);
    }

    private String retryInstruction(BusinessException exception, int nextAttempt) {
'''
new = '''    private boolean isEmptyQuestionsFailure(BusinessException exception) {
        String message = exception.getMessage();
        return message != null && message.contains("empty questions array");
    }

    private boolean isRetryableGenerationFailure(BusinessException exception) {
        return isNonChineseContentFailure(exception)
            || isJsonParseFailure(exception)
            || isEmptyOrLengthFailure(exception)
            || isEmptyQuestionsFailure(exception);
    }

    private String retryInstruction(BusinessException exception, int nextAttempt) {
'''
if old not in text:
    raise SystemExit('pattern not found')
text = text.replace(old, new)
old2 = '''        if (isJsonParseFailure(exception)) {
            return "\\n\\n第 " + nextAttempt + " 次生成要求：上一次输出不是合法题目 JSON。请只输出一个 JSON 对象，格式必须是 {\\\"questions\\\":[...]}，不要输出 Markdown、解释、思考过程或多余文本。";
        }
        return "\\n\\n第 " + nextAttempt + " 次生成要求：上一次输出为空或被截断。请压缩表达，直接输出最终 JSON，不要输出思考过程，最终答案必须放在 message.content 中。";
'''
new2 = '''        if (isJsonParseFailure(exception)) {
            return "\\n\\n第 " + nextAttempt + " 次生成要求：上一次输出不是合法题目 JSON。请只输出一个 JSON 对象，格式必须是 {\\\"questions\\\":[...]}，不要输出 Markdown、解释、思考过程或多余文本。";
        }
        if (isEmptyQuestionsFailure(exception)) {
            return "\\n\\n第 " + nextAttempt + " 次生成要求：上一次返回了空 questions 数组，这是不可接受的。必须生成且只生成 1 道完整题目，questions 数组长度必须等于 1，字段 title、options、answer、analysis 不能为空，并且必须使用简体中文。";
        }
        return "\\n\\n第 " + nextAttempt + " 次生成要求：上一次输出为空或被截断。请压缩表达，直接输出最终 JSON，不要输出思考过程，最终答案必须放在 message.content 中。";
'''
if old2 not in text:
    raise SystemExit('pattern2 not found')
text = text.replace(old2, new2)
p.write_text(text, encoding='utf-8')