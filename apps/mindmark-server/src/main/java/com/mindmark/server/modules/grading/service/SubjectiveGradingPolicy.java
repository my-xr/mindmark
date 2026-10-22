package com.mindmark.server.modules.grading.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.ai.dto.AiProviderRuntimeConfig;
import com.mindmark.server.modules.ai.service.AiProviderSettingService;
import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Pattern;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class SubjectiveGradingPolicy {

    private static final Pattern TOKEN_SPLITTER = Pattern.compile("[\\s\\p{Punct}，。！？；：、（）【】《》]+");
    private static final BigDecimal SIXTY_PERCENT = new BigDecimal("0.60");
    public static final String AI_GRADING_PROMPT_VERSION = LangGraphGradingWorkflow.WORKFLOW_VERSION;
    public static final String BASELINE_RUBRIC_VERSION = "baseline-v20260721";
    public static final String OBJECTIVE_RUBRIC_VERSION = "objective-v20260721";
    private static final BigDecimal REVIEW_CONFIDENCE_THRESHOLD = new BigDecimal("0.75");
    private final ObjectMapper objectMapper;
    private final AiProviderSettingService aiProviderSettingService;
    private final LangGraphGradingWorkflow gradingWorkflow;
    private final boolean providerGradingEnabled;
    private final long providerRequestTimeoutMs;
    private final int providerMaxTokens;

    public SubjectiveGradingPolicy(
        ObjectMapper objectMapper,
        AiProviderSettingService aiProviderSettingService,
        LangGraphGradingWorkflow gradingWorkflow,
        @Value("${mindmark.ai.grading.provider-enabled:true}") boolean providerGradingEnabled,
        @Value("${mindmark.ai.grading.timeout-ms:25000}") long providerRequestTimeoutMs,
        @Value("${mindmark.ai.grading.max-tokens:1000}") int providerMaxTokens
    ) {
        this.objectMapper = objectMapper;
        this.aiProviderSettingService = aiProviderSettingService;
        this.gradingWorkflow = gradingWorkflow;
        this.providerGradingEnabled = providerGradingEnabled;
        this.providerRequestTimeoutMs = providerRequestTimeoutMs;
        this.providerMaxTokens = providerMaxTokens;
    }

    public boolean supports(QuestionType type) {
        return type == QuestionType.SHORT_ANSWER
            || type == QuestionType.ESSAY
            || type == QuestionType.CASE_ANALYSIS
            || type == QuestionType.PROGRAMMING;
    }

    public SubjectiveGradingResult grade(QuestionEntity question, String answerJson, BigDecimal maxScore) {
        return grade(question, answerJson, maxScore, null);
    }

    public SubjectiveGradingResult grade(QuestionEntity question, String answerJson, BigDecimal maxScore, String teacherId) {
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
        return gradeByDeterministicPolicy(question, answer, safeMaxScore, "系统自动判分：已按参考答案、评分点和关键词匹配给出默认分。");
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
            LangGraphGradingWorkflow.GradingWorkflowResult workflowResult = gradingWorkflow.run(
                new LangGraphGradingWorkflow.GradingWorkflowInput(
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
                config
            );
            return Optional.ofNullable(parseProviderResult(question, workflowResult.providerContent(), safeMaxScore, config));
        } catch (RuntimeException exception) {
            return Optional.empty();
        }
    }

    private SubjectiveGradingResult emptyAnswerResult() {
        return new SubjectiveGradingResult(
            BigDecimal.ZERO,
            false,
            new BigDecimal("0.98"),
            "系统自动判分：学生未作答，默认 0 分，建议教师复核。",
            true
        );
    }

    private SubjectiveGradingResult parseProviderResult(QuestionEntity question, String content, BigDecimal maxScore, AiProviderRuntimeConfig config) {
        JsonNode root = readTree(extractJson(stripMarkdownFence(content)));
        if (root == null || !root.isObject()) {
            return null;
        }
        BigDecimal parsedScore = firstScore(root, "score", "finalScore", "autoScore", "suggestedScore", "得分");
        if (parsedScore == null) {
            return null;
        }
        BigDecimal score = clampScore(parsedScore, maxScore);
        BigDecimal confidence = clampConfidence(firstScore(root, "confidence", "aiConfidence", "置信度"));
        boolean correct = firstBoolean(root, "correct", "isCorrect", "答对");
        if (!root.hasNonNull("correct") && !root.hasNonNull("isCorrect") && !root.hasNonNull("答对")) {
            correct = score.compareTo(maxScore.multiply(SIXTY_PERCENT)) >= 0;
        }
        boolean needsReview = firstBoolean(root, "needsReview", "reviewRequired", "需复核");
        if (!root.hasNonNull("needsReview") && !root.hasNonNull("reviewRequired") && !root.hasNonNull("需复核")) {
            needsReview = confidence.compareTo(REVIEW_CONFIDENCE_THRESHOLD) < 0
                || score.compareTo(maxScore.multiply(new BigDecimal("0.30"))) < 0;
        }
        String comment = firstText(root, "comment", "reason", "feedback", "评语", "说明");
        if (comment == null || comment.isBlank()) {
            comment = buildComment(question, score, maxScore, confidence, needsReview, "AI Provider 自动判分：");
        } else if (!comment.startsWith("AI")) {
            comment = "AI Provider 自动判分：" + comment.trim();
        }
        if (question.getType() == QuestionType.PROGRAMMING && confidence.compareTo(new BigDecimal("0.85")) > 0) {
            confidence = new BigDecimal("0.85");
        }
        return SubjectiveGradingResult.provider(score, correct, confidence, comment, needsReview, config.provider(), config.model(), parsedScore);
    }

    private SubjectiveGradingResult gradeByDeterministicPolicy(
        QuestionEntity question,
        String answer,
        BigDecimal maxScore,
        String commentPrefix
    ) {
        List<ScoringPoint> points = parseScoringPoints(question.getScoringPointsJson(), maxScore);
        BigDecimal score = points.isEmpty()
            ? gradeByReferenceAnswer(question, answer, maxScore)
            : gradeByScoringPoints(points, answer, maxScore);
        score = clampScore(score, maxScore);
        boolean correct = score.compareTo(maxScore.multiply(SIXTY_PERCENT)) >= 0;
        BigDecimal confidence = estimateConfidence(points, question, answer, score, maxScore);
        boolean needsReview = confidence.compareTo(REVIEW_CONFIDENCE_THRESHOLD) < 0
            || score.compareTo(maxScore.multiply(new BigDecimal("0.30"))) < 0;
        String comment = buildComment(question, score, maxScore, confidence, needsReview, commentPrefix);
        if (question.getType() == QuestionType.PROGRAMMING && confidence.compareTo(new BigDecimal("0.85")) > 0) {
            confidence = new BigDecimal("0.85");
        }
        return new SubjectiveGradingResult(score, correct, confidence, comment, needsReview);
    }

    private BigDecimal gradeByScoringPoints(List<ScoringPoint> points, String answer, BigDecimal maxScore) {
        BigDecimal earned = BigDecimal.ZERO;
        BigDecimal configuredTotal = BigDecimal.ZERO;
        for (ScoringPoint point : points) {
            configuredTotal = configuredTotal.add(point.score());
            if (matchesPoint(point, answer)) {
                earned = earned.add(point.score());
            }
        }
        if (configuredTotal.compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }
        return earned.multiply(maxScore).divide(configuredTotal, 2, RoundingMode.HALF_UP);
    }

    private boolean matchesPoint(ScoringPoint point, String answer) {
        String normalizedAnswer = normalizeComparable(answer);
        for (String keyword : point.keywords()) {
            if (!keyword.isBlank() && normalizedAnswer.contains(normalizeComparable(keyword))) {
                return true;
            }
        }
        Set<String> descriptionTokens = tokens(point.description());
        if (descriptionTokens.isEmpty()) {
            return false;
        }
        long hitCount = descriptionTokens.stream().filter(normalizedAnswer::contains).count();
        return hitCount >= Math.max(1, Math.ceil(descriptionTokens.size() * 0.35));
    }

    private BigDecimal gradeByReferenceAnswer(QuestionEntity question, String answer, BigDecimal maxScore) {
        String reference = normalizeAnswer(question.getAnswerJson());
        if (reference.isBlank()) {
            return maxScore.multiply(new BigDecimal("0.60")).setScale(2, RoundingMode.HALF_UP);
        }
        Set<String> referenceTokens = tokens(reference);
        if (referenceTokens.isEmpty()) {
            return BigDecimal.ZERO;
        }
        String normalizedAnswer = normalizeComparable(answer);
        long hitCount = referenceTokens.stream().filter(normalizedAnswer::contains).count();
        BigDecimal ratio = BigDecimal.valueOf((double) hitCount / referenceTokens.size());
        if (question.getType() == QuestionType.PROGRAMMING && answer.length() > 80) {
            ratio = ratio.add(new BigDecimal("0.15"));
        }
        return maxScore.multiply(ratio.min(BigDecimal.ONE)).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal estimateConfidence(
        List<ScoringPoint> points,
        QuestionEntity question,
        String answer,
        BigDecimal score,
        BigDecimal maxScore
    ) {
        BigDecimal scoreRatio = maxScore.compareTo(BigDecimal.ZERO) <= 0
            ? BigDecimal.ZERO
            : score.divide(maxScore, 2, RoundingMode.HALF_UP);
        BigDecimal base = points.isEmpty() ? new BigDecimal("0.72") : new BigDecimal("0.86");
        if (question.getType() == QuestionType.PROGRAMMING) {
            base = base.subtract(new BigDecimal("0.06"));
        }
        if (answer.length() < 12) {
            base = base.subtract(new BigDecimal("0.12"));
        }
        if (scoreRatio.compareTo(new BigDecimal("0.15")) < 0 || scoreRatio.compareTo(new BigDecimal("0.95")) > 0) {
            base = base.subtract(new BigDecimal("0.05"));
        }
        return base.max(new BigDecimal("0.50")).min(new BigDecimal("0.98")).setScale(2, RoundingMode.HALF_UP);
    }

    private String buildComment(
        QuestionEntity question,
        BigDecimal score,
        BigDecimal maxScore,
        BigDecimal confidence,
        boolean needsReview,
        String prefix
    ) {
        String typeLabel = switch (question.getType()) {
            case PROGRAMMING -> "编程题";
            case ESSAY -> "论述题";
            case CASE_ANALYSIS -> "案例分析题";
            default -> "主观题";
        };
        String reviewHint = needsReview ? "系统建议教师重点复核评分点覆盖情况。" : "教师可直接按系统默认分核对。";
        return prefix + typeLabel + "得分 " + score + "/" + maxScore
            + "，置信度 " + confidence + "。" + reviewHint;
    }

    private String buildProviderPrompt(QuestionEntity question, String answer, BigDecimal maxScore) {
        return """
            请批改下面这道考试题，并只返回 JSON。
            题型：%s
            满分：%s
            题干：%s
            参考答案：%s
            评分点：%s
            学生答案：%s
            评分要求：score 必须在 0 到满分之间；correct 表示是否达到及格性正确；confidence 表示评分置信度；needsReview 表示是否建议教师重点复核；comment 必须为中文且不超过 80 字。
            编程题附加要求：不要只看语法相似度，要检查输入输出、边界条件、异常处理、时间复杂度和隐藏测试风险；如无法从答案中确认可运行性，needsReview=true。
            编程题附加要求：不要只看语法相似度，要检查输入输出、边界条件、异常处理、时间复杂度和隐藏测试风险；如无法从答案中确认可运行性，needsReview=true。
            """.formatted(
            question.getType(),
            maxScore,
            safe(question.getTitle()),
            normalizeAnswer(question.getAnswerJson()),
            safe(question.getScoringPointsJson()),
            answer
        );
    }

    private List<ScoringPoint> parseScoringPoints(String json, BigDecimal maxScore) {
        JsonNode root = readTree(json);
        JsonNode array = root != null && root.isArray() ? root : null;
        if (array == null || array.isEmpty()) {
            return List.of();
        }
        List<ScoringPoint> points = new ArrayList<>();
        int index = 1;
        for (JsonNode node : array) {
            String description = firstText(node, "description", "content", "text", "title", "desc");
            if (description == null || description.isBlank()) {
                description = "评分点" + index;
            }
            BigDecimal score = readScore(node.get("score"));
            if (score == null || score.compareTo(BigDecimal.ZERO) <= 0) {
                score = maxScore.divide(BigDecimal.valueOf(array.size()), 2, RoundingMode.HALF_UP);
            }
            List<String> keywords = new ArrayList<>();
            JsonNode keywordNode = node.get("keywords");
            if (keywordNode != null && keywordNode.isArray()) {
                keywordNode.forEach(item -> keywords.add(item.asText("")));
            }
            points.add(new ScoringPoint(description, score, keywords));
            index += 1;
        }
        return points;
    }

    private JsonNode readTree(String json) {
        try {
            return objectMapper.readTree(json == null || json.isBlank() ? "null" : json);
        } catch (Exception exception) {
            return null;
        }
    }

    private String normalizeAnswer(String json) {
        JsonNode node = readTree(json);
        if (node == null || node.isNull()) {
            return "";
        }
        if (node.isTextual()) {
            return node.asText().trim();
        }
        if (node.isArray()) {
            List<String> values = new ArrayList<>();
            node.forEach(item -> values.add(item.asText(item.toString())));
            return String.join(" ", values).trim();
        }
        if (node.isObject()) {
            String value = firstText(node, "answer", "content", "text", "value", "code");
            if (value != null) {
                return value.trim();
            }
        }
        return node.toString();
    }

    private String firstText(JsonNode node, String... fields) {
        if (node == null || node.isNull()) {
            return null;
        }
        if (node.isTextual()) {
            return node.asText();
        }
        for (String field : fields) {
            JsonNode value = node.get(field);
            if (value != null && !value.isNull() && !value.asText("").isBlank()) {
                return value.asText();
            }
        }
        return null;
    }

    private BigDecimal firstScore(JsonNode node, String... fields) {
        for (String field : fields) {
            BigDecimal value = readScore(node.get(field));
            if (value != null) {
                return value;
            }
        }
        return null;
    }

    private boolean firstBoolean(JsonNode node, String... fields) {
        for (String field : fields) {
            JsonNode value = node.get(field);
            if (value == null || value.isNull()) {
                continue;
            }
            if (value.isBoolean()) {
                return value.asBoolean();
            }
            String text = value.asText("").trim().toLowerCase(Locale.ROOT);
            if (Set.of("true", "yes", "y", "1", "正确", "答对", "是", "需要").contains(text)) {
                return true;
            }
            if (Set.of("false", "no", "n", "0", "错误", "答错", "否", "不需要").contains(text)) {
                return false;
            }
        }
        return false;
    }

    private BigDecimal readScore(JsonNode node) {
        if (node == null || node.isNull()) {
            return null;
        }
        try {
            return node.isNumber() ? node.decimalValue() : new BigDecimal(node.asText().trim());
        } catch (Exception exception) {
            return null;
        }
    }

    private BigDecimal safeMaxScore(QuestionEntity question, BigDecimal maxScore) {
        BigDecimal fallback = question == null ? BigDecimal.ZERO : question.getScore();
        BigDecimal score = maxScore == null ? fallback : maxScore;
        return score == null || score.compareTo(BigDecimal.ZERO) <= 0 ? BigDecimal.ONE : score;
    }

    private BigDecimal clampScore(BigDecimal score, BigDecimal maxScore) {
        if (score == null || score.compareTo(BigDecimal.ZERO) < 0) {
            return BigDecimal.ZERO;
        }
        if (score.compareTo(maxScore) > 0) {
            return maxScore;
        }
        return score.setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal clampConfidence(BigDecimal confidence) {
        BigDecimal value = confidence == null ? new BigDecimal("0.72") : confidence;
        if (value.compareTo(BigDecimal.ONE) > 0) {
            value = value.divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        }
        return value.max(new BigDecimal("0.50")).min(new BigDecimal("0.99")).setScale(2, RoundingMode.HALF_UP);
    }

    private Set<String> tokens(String value) {
        Set<String> result = new HashSet<>();
        String normalized = normalizeComparable(value);
        for (String token : TOKEN_SPLITTER.split(normalized)) {
            if (token.length() >= 2) {
                result.add(token);
            }
        }
        if (result.isEmpty() && normalized.length() >= 2) {
            int step = normalized.length() <= 8 ? 2 : 4;
            for (int index = 0; index + step <= normalized.length(); index += step) {
                result.add(normalized.substring(index, index + step));
            }
        }
        return result;
    }

    private String extractJson(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        int start = trimmed.indexOf('{');
        int end = trimmed.lastIndexOf('}');
        if (start >= 0 && end > start) {
            return trimmed.substring(start, end + 1);
        }
        return trimmed;
    }

    private String stripMarkdownFence(String value) {
        if (value == null) {
            return "";
        }
        String trimmed = value.trim();
        if (!trimmed.startsWith("```")) {
            return trimmed;
        }
        return trimmed.replaceFirst("^```[a-zA-Z]*\\s*", "").replaceFirst("\\s*```$", "").trim();
    }

    private String normalizeComparable(String value) {
        return value == null ? "" : value.toLowerCase(Locale.ROOT).replaceAll("\\s+", "");
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }

    private record ScoringPoint(String description, BigDecimal score, List<String> keywords) {
    }

    public record SubjectiveGradingResult(
        BigDecimal score,
        Boolean correct,
        BigDecimal confidence,
        String comment,
        boolean needsReview,
        String gradingSource,
        String aiProvider,
        String aiModel,
        String aiRubricVersion,
        BigDecimal aiRawScore
    ) {
        public SubjectiveGradingResult(
            BigDecimal score,
            Boolean correct,
            BigDecimal confidence,
            String comment,
            boolean needsReview
        ) {
            this(score, correct, confidence, comment, needsReview, "BASELINE", null, null, BASELINE_RUBRIC_VERSION, score);
        }

        public static SubjectiveGradingResult provider(
            BigDecimal score,
            Boolean correct,
            BigDecimal confidence,
            String comment,
            boolean needsReview,
            String provider,
            String model,
            BigDecimal rawScore
        ) {
            return new SubjectiveGradingResult(
                score,
                correct,
                confidence,
                comment,
                needsReview,
                "AI_PROVIDER",
                provider,
                model,
                AI_GRADING_PROMPT_VERSION,
                rawScore
            );
        }
    }
}
