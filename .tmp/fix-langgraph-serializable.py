from pathlib import Path

root = Path('apps/mindmark-server/src/main/java/com/mindmark/server')

p = root / 'modules/grading/service/LangGraphGradingWorkflow.java'
text = p.read_text(encoding='utf-8-sig')
text = text.replace('import com.mindmark.server.modules.question.domain.QuestionEntity;\n', '')
if 'import java.io.Serializable;\n' not in text:
    text = text.replace('import java.math.BigDecimal;\n', 'import java.io.Serializable;\nimport java.math.BigDecimal;\n')
text = text.replace('''        if (input.question() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "question is required");
        }
''', '''        if (input.questionType() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "questionType is required");
        }
''')
text = text.replace('''        QuestionEntity question = input.question();
        String rubric = """
''', '''        String rubric = """
''')
text = text.replace('return Map.of("rubric", rubric, "reference", reference, "questionTypeLabel", questionTypeLabel(question.getType()));',
                    'return Map.of("rubric", rubric, "reference", reference, "questionTypeLabel", questionTypeLabel(input.questionType()));')
text = text.replace('QuestionType type = input.question().getType();', 'QuestionType type = input.questionType();')
text = text.replace('''        QuestionEntity question = input.question();
        return """
''', '''        return """
''')
text = text.replace('blankToDefault(question.getTitle(), ', 'blankToDefault(input.questionTitle(), ')
text = text.replace('''    public record GradingWorkflowInput(
        QuestionEntity question,
        String studentAnswer,
        String referenceAnswer,
        String scoringPointsJson,
        BigDecimal maxScore,
        int responseMaxTokens,
        long timeoutMs,
        String providerModel
    ) {}

    public record GradingWorkflowResult(
        String providerContent,
        String workflowVersion,
        List<String> executedNodes,
        String providerModel
    ) {}
''', '''    public record GradingWorkflowInput(
        String questionTitle,
        QuestionType questionType,
        String studentAnswer,
        String referenceAnswer,
        String scoringPointsJson,
        BigDecimal maxScore,
        int responseMaxTokens,
        long timeoutMs,
        String providerModel
    ) implements Serializable {}

    public record GradingWorkflowResult(
        String providerContent,
        String workflowVersion,
        List<String> executedNodes,
        String providerModel
    ) implements Serializable {}
''')
text = text.replace('''        private static final GradingWorkflowInput EMPTY_INPUT = new GradingWorkflowInput(
            null,
            "",
            "",
            "",
            BigDecimal.ZERO,
            0,
            0,
            ""
        );
''', '''        private static final GradingWorkflowInput EMPTY_INPUT = new GradingWorkflowInput(
            "",
            null,
            "",
            "",
            "",
            BigDecimal.ZERO,
            0,
            0,
            ""
        );
''')
p.write_text(text, encoding='utf-8')

p = root / 'modules/grading/service/SubjectiveGradingPolicy.java'
text = p.read_text(encoding='utf-8-sig')
text = text.replace('''                new LangGraphGradingWorkflow.GradingWorkflowInput(
                    question,
                    answer,
                    normalizeAnswer(question.getAnswerJson()),
                    question.getScoringPointsJson(),
                    safeMaxScore,
                    Math.max(256, providerMaxTokens),
                    providerRequestTimeoutMs,
                    config.provider() + "/" + config.model()
                ),
''', '''                new LangGraphGradingWorkflow.GradingWorkflowInput(
                    question.getTitle(),
                    question.getType(),
                    answer,
                    normalizeAnswer(question.getAnswerJson()),
                    question.getScoringPointsJson(),
                    safeMaxScore,
                    Math.max(256, providerMaxTokens),
                    providerRequestTimeoutMs,
                    config.provider() + "/" + config.model()
                ),
''')
p.write_text(text, encoding='utf-8')

p = root / 'modules/paper/service/LangGraphPaperComposePlanService.java'
text = p.read_text(encoding='utf-8-sig')
if 'import java.io.Serializable;\n' not in text:
    text = text.replace('import java.math.BigDecimal;\n', 'import java.io.Serializable;\nimport java.math.BigDecimal;\n')
text = text.replace('''        PaperComposeQualityReportResponse qualityReport
    ) {}''', '''        PaperComposeQualityReportResponse qualityReport
    ) implements Serializable {}''')
p.write_text(text, encoding='utf-8')

for rel in [
    'modules/paper/dto/PaperComposeAgentPlanResponse.java',
    'modules/paper/dto/PaperComposeRuleRequest.java',
    'modules/paper/dto/PaperComposeQualityReportResponse.java',
    'modules/paper/dto/PaperComposeDistributionItemResponse.java',
]:
    p = root / rel
    text = p.read_text(encoding='utf-8-sig')
    if 'import java.io.Serializable;\n' not in text:
        text = text.replace('\n\n', '\n\nimport java.io.Serializable;\n', 1)
    text = text.replace(') {}', ') implements Serializable {}')
    text = text.replace(') {\n}', ') implements Serializable {\n}')
    p.write_text(text, encoding='utf-8')
