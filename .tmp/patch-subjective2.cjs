const fs = require('fs');
const file='apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/SubjectiveGradingPolicy.java';
let s=fs.readFileSync(file,'utf8');
const start=s.indexOf('    public SubjectiveGradingResult grade(QuestionEntity question, String answerJson, BigDecimal maxScore, String teacherId) {');
const end=s.indexOf('    private SubjectiveGradingResult parseProviderResult', start);
if(start<0||end<0) throw new Error('markers not found');
const replacement=`    public SubjectiveGradingResult grade(QuestionEntity question, String answerJson, BigDecimal maxScore, String teacherId) {
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
    }

`;
s=s.slice(0,start)+replacement+s.slice(end);
fs.writeFileSync(file,s,'utf8');