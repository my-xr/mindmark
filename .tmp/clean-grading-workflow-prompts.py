from pathlib import Path
import re

p = Path('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/LangGraphGradingWorkflow.java')
text = p.read_text(encoding='utf-8')
text = re.sub(
    r'private static final String SYSTEM_PROMPT = """.*?\n\s*""";',
    '''private static final String SYSTEM_PROMPT = """
        你是高校考试 AI 批改智能体。必须使用简体中文，依据题干、参考答案、评分点和学生作答给出稳定、保守、可审计的系统默认分。
        只返回严格 JSON，不要包含 Markdown、解释性前后缀或英文说明。
        JSON 字段必须包含：score（数字）、correct（布尔）、confidence（0 到 1 数字）、needsReview（布尔）、comment（中文简短评语）。
        不确定、低置信度、不及格、疑似偏题、论证不足或编程题无法确认可运行性时，needsReview 必须为 true。
        """;''',
    text,
    count=1,
    flags=re.S,
)
text = re.sub(
    r'String rubric = """.*?\n\s*"""\.formatted\(blankToDefault\(input\.scoringPointsJson\(\), .*?\)\);',
    '''String rubric = """
            【通用评分约束】
            1. score 必须在 0 到满分之间，禁止超过满分。
            2. correct 表示是否达到及格性正确，不等同于满分。
            3. confidence 必须反映评分确定性；评分点缺失、答案含糊、编程题无法运行验证时应降低置信度。
            4. comment 必须中文、简洁，指出主要得分依据或复核原因，控制在 80 字以内。
            【教师评分点】
            %s
            """.formatted(blankToDefault(input.scoringPointsJson(), "未配置结构化评分点，请依据参考答案和题干保守评分。"));''',
    text,
    count=1,
    flags=re.S,
)
text = re.sub(
    r'String reference = blankToDefault\(input\.referenceAnswer\(\), .*?\);',
    'String reference = blankToDefault(input.referenceAnswer(), "未配置参考答案，请更保守评分并建议教师复核。");',
    text,
    count=1,
    flags=re.S,
)
text = re.sub(
    r'String instruction = switch \(type\) \{.*?\n\s*\};',
    '''String instruction = switch (type) {
            case SHORT_ANSWER -> "按知识点覆盖、关键概念准确性、表达完整性评分；允许同义表达。";
            case ESSAY -> "按观点完整性、论证逻辑、概念准确性、材料结合、表达规范性评分；避免只按关键词给分。";
            case CASE_ANALYSIS -> "按问题识别、案例证据使用、分析链路、解决方案可行性和结论完整性评分。";
            case PROGRAMMING -> "按算法思路、边界条件、复杂度、代码健壮性和输出正确性评分；当前不执行代码，无法确认可运行性时 needsReview=true。";
            default -> "当前题型通常不应进入 AI 主观批改，请保守输出低置信度并建议复核。";
        };''',
    text,
    count=1,
    flags=re.S,
)
text = re.sub(
    r'return """\n\s*璇锋墽琛屼竴娆\?.*?\n\s*"""\.formatted\(',
    '''return """
            请执行一次 AI 批改工作流，并只返回 JSON。

            【工作流版本】%s
            【题型】%s
            【满分】%s
            【题干】%s
            【参考答案】%s
            %s
            【题型专项评分策略】%s
            【学生作答】%s

            【输出格式】
            {"score": 数字, "correct": true/false, "confidence": 0到1数字, "needsReview": true/false, "comment": "中文评语"}
            """.formatted(''',
    text,
    count=1,
    flags=re.S,
)
# If the previous regex did not match because text already partially changed, replace the buildPrompt method body directly.
text = re.sub(
    r'private String buildPrompt\(GradingWorkflowState state, GradingWorkflowInput input\) \{.*?\n\s*\}\n\s*private JsonNode readJson',
    '''private String buildPrompt(GradingWorkflowState state, GradingWorkflowInput input) {
        String rubric = require(state, "rubric", String.class);
        String reference = require(state, "reference", String.class);
        String questionTypeLabel = require(state, "questionTypeLabel", String.class);
        String typeInstruction = require(state, "typeInstruction", String.class);
        return """
            请执行一次 AI 批改工作流，并只返回 JSON。

            【工作流版本】%s
            【题型】%s
            【满分】%s
            【题干】%s
            【参考答案】%s
            %s
            【题型专项评分策略】%s
            【学生作答】%s

            【输出格式】
            {"score": 数字, "correct": true/false, "confidence": 0到1数字, "needsReview": true/false, "comment": "中文评语"}
            """.formatted(
            WORKFLOW_VERSION,
            questionTypeLabel,
            input.maxScore().stripTrailingZeros().toPlainString(),
            blankToDefault(input.questionTitle(), "无题干"),
            reference,
            rubric,
            typeInstruction,
            input.studentAnswer()
        );
    }

    private JsonNode readJson''',
    text,
    count=1,
    flags=re.S,
)
text = re.sub(
    r'private String questionTypeLabel\(QuestionType type\) \{.*?\n\s*\}\n\s*private String extractJson',
    '''private String questionTypeLabel(QuestionType type) {
        if (type == null) {
            return "未知题型";
        }
        return switch (type) {
            case SINGLE_CHOICE -> "单选题";
            case MULTIPLE_CHOICE -> "多选题";
            case TRUE_FALSE -> "判断题";
            case FILL_BLANK -> "填空题";
            case SHORT_ANSWER -> "简答题";
            case ESSAY -> "论述题";
            case CASE_ANALYSIS -> "案例分析题";
            case PROGRAMMING -> "编程题";
        };
    }

    private String extractJson''',
    text,
    count=1,
    flags=re.S,
)
p.write_text(text, encoding='utf-8')
