const fs = require('fs');
const file='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/SubjectiveGradingPolicy.java';
let s=fs.readFileSync(file,'utf8');
s=s.replace('import java.util.Locale;\r\nimport java.util.Set;', 'import java.util.Locale;\r\nimport java.util.Optional;\r\nimport java.util.Set;');
s=s.replace(`    public SubjectiveGradingResult grade(QuestionEntity question, String answerJson, BigDecimal maxScore, String teacherId) {
        BigDecimal safeMaxScore = safeMaxScore(question, maxScore);
        if (!supports(question.getType())) {
            return new SubjectiveGradingResult(null, null, null, null, false);
        }
        String answer = normalizeAnswer(answerJson);
        if (answer.isBlank()) {
            return new SubjectiveGradingResult(
                BigDecimal.ZERO,
                false,
                new BigDecimal("0.98"),
                "AI 自动判分：学生未作答，系统默认 0 分。",
                true
            );
        }

        if (providerGradingEnabled && teacherId != null && !teacherId.isBlank()) {
            SubjectiveGradingResult providerResult = tryGradeByProvider(question, answer, safeMaxScore, teacherId);
            if (providerResult != null) {
                return providerResult;
            }
        }

        return gradeByDeterministicPolicy(question, answer, safeMaxScore, "AI 自动判分：未调用到可用模型，已按参考答案与评分点匹配给出系统默认分 ");
    }

    private SubjectiveGradingResult tryGradeByProvider(
        QuestionEntity question,
        String answer,
        BigDecimal maxScore,
        String teacherId
    ) {
        try {
            AiProviderRuntimeConfig config = aiProviderSettingService.resolveRuntimeConfig(teacherId, null);
            String content = aiChatQuestionGenerationClient.completeText(
                config,
                buildProviderPrompt(question, answer, maxScore),
                1000,
                AI_GRADING_SYSTEM_PROMPT
            );
            return parseProviderResult(question, content, maxScore);
        } catch (BusinessException exception) {
            return null;
        } catch (RuntimeException exception) {
            return null;
        }
    }`, `    public SubjectiveGradingResult grade(QuestionEntity question, String answerJson, BigDecimal maxScore, String teacherId) {
        if (providerGradingEnabled && teacherId != null && !teacherId.isBlank()) {
            Optional<SubjectiveGradingResult> providerResult = gradeWithProviderOnly(question, answerJson, maxScore, teacherId);
            if (providerResult.isPresent()) {
                return providerResult.get();
            }
        }
        return gradeBaseline(question, answerJson, maxScore);
    }

    public SubjectiveGradingResult gradeBaseline(QuestionEntity question, String answerJson, BigDecimal maxScore) {
        BigDecimal safeMaxScore = safeMaxScore(question, maxScore);
        if (!supports(question.getType())) {
            return new SubjectiveGradingResult(null, null, null, null, false);
        }
        String answer = normalizeAnswer(answerJson);
        if (answer.isBlank()) {
            return emptyAnswerResult();
        }
        return gradeByDeterministicPolicy(question, answer, safeMaxScore, "系统自动判分：已按参考答案、测试要点与评分点匹配给出默认分。");
    }

    public Optional<SubjectiveGradingResult> gradeWithProviderOnly(
        QuestionEntity question,
        String answerJson,
        BigDecimal maxScore,
        String teacherId
    ) {
        if (!providerGradingEnabled || teacherId == null || teacherId.isBlank()) {
            return Optional.empty();
        }
        try {
            AiProviderRuntimeConfig config = aiProviderSettingService.resolveRuntimeConfig(teacherId, null);
            return gradeWithProviderConfig(question, answerJson, maxScore, config);
        } catch (BusinessException exception) {
            return Optional.empty();
        }
    }

    public Optional<SubjectiveGradingResult> gradeWithProviderConfig(
        QuestionEntity question,
        String answerJson,
        BigDecimal maxScore,
        AiProviderRuntimeConfig config
    ) {
        BigDecimal safeMaxScore = safeMaxScore(question, maxScore);
        if (!supports(question.getType())) {
            return Optional.empty();
        }
        String answer = normalizeAnswer(answerJson);
        if (answer.isBlank()) {
            return Optional.of(emptyAnswerResult());
        }
        try {
            String content = aiChatQuestionGenerationClient.completeText(
                config,
                buildProviderPrompt(question, answer, safeMaxScore),
                1000,
                AI_GRADING_SYSTEM_PROMPT
            );
            return Optional.ofNullable(parseProviderResult(question, content, safeMaxScore));
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    private SubjectiveGradingResult emptyAnswerResult() {
        return new SubjectiveGradingResult(
            BigDecimal.ZERO,
            false,
            new BigDecimal("0.98"),
            "系统自动判分：学生未作答，默认 0 分，建议教师核对。",
            true
        );
    }`);
fs.writeFileSync(file,s,'utf8');