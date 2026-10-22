package com.mindmark.server.modules.grading.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.NullNode;
import com.mindmark.server.modules.answer.domain.AnswerItemEntity;
import com.mindmark.server.modules.grading.domain.GradingItemEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import com.mindmark.server.modules.grading.dto.GradingItemResponse;
import com.mindmark.server.modules.grading.dto.GradingTaskResponse;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

@Component
public class GradingTaskMapper {

    private static final BigDecimal PASS_RATE = new BigDecimal("0.60");
    private static final BigDecimal LOW_CONFIDENCE_THRESHOLD = new BigDecimal("0.75");

    private final ObjectMapper objectMapper;

    public GradingTaskMapper(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public GradingTaskResponse toResponse(GradingTaskEntity task, boolean includeItems) {
        Map<String, AnswerItemEntity> answers = includeItems
            ? task.getAnswerSheet().getItems().stream()
                .collect(Collectors.toMap(AnswerItemEntity::getQuestionId, item -> item, (left, right) -> right, LinkedHashMap::new))
            : Map.of();
        List<GradingItemResponse> items = includeItems
            ? task.getItems().stream().map(item -> toItemResponse(item, answers.get(item.getQuestion().getId()))).toList()
            : List.of();

        BigDecimal passScore = passScore(task);
        BigDecimal effectiveScore = effectiveScore(task);
        boolean failed = effectiveScore != null && effectiveScore.compareTo(passScore) < 0;
        boolean passed = effectiveScore != null && !failed;
        boolean needsReview = task.getStatus() != GradingTaskStatus.REVIEWED && (failed || hasReviewRequiredItem(task));

        return new GradingTaskResponse(
            task.getId(),
            task.getExam().getId(),
            task.getExam().getTitle(),
            task.getAnswerSheet().getId(),
            task.getStudentId(),
            task.getStudentName(),
            task.getStatus(),
            task.getObjectiveScore(),
            task.getSubjectiveScore(),
            task.getAiScore(),
            task.getFinalScore(),
            passScore,
            passed,
            failed,
            needsReview,
            buildReviewReason(failed, needsReview),
            task.getComment(),
            task.getCreatedAt(),
            task.getUpdatedAt(),
            task.getReviewedAt(),
            items
        );
    }

    public GradingItemResponse toItemResponse(GradingItemEntity item, AnswerItemEntity answerItem) {
        BigDecimal confidence = item.getAiConfidence() == null ? estimateItemConfidence(item) : item.getAiConfidence();
        boolean needsReview = item.getNeedsReview() == null ? needsItemReview(item, confidence) : item.getNeedsReview();
        return new GradingItemResponse(
            item.getId(),
            item.getQuestion().getId(),
            item.getQuestion().getTitle(),
            item.getQuestionType(),
            item.getMaxScore(),
            item.getAutoScore(),
            item.getFinalScore(),
            item.getObjective(),
            item.getCorrect(),
            confidence,
            needsReview,
            item.getComment(),
            item.getGradingSource(),
            item.getAiProvider(),
            item.getAiModel(),
            item.getAiRubricVersion(),
            item.getAiRawScore(),
            item.getTeacherOverrideReason(),
            item.getScoreDiff(),
            parseAnswer(answerItem)
        );
    }

    private BigDecimal passScore(GradingTaskEntity task) {
        BigDecimal totalScore = task.getExam().getTotalScore() == null ? BigDecimal.ZERO : task.getExam().getTotalScore();
        return totalScore.multiply(PASS_RATE).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal effectiveScore(GradingTaskEntity task) {
        return task.getFinalScore() == null ? task.getAiScore() : task.getFinalScore();
    }

    private boolean hasReviewRequiredItem(GradingTaskEntity task) {
        return task.getItems().stream().anyMatch(item -> needsItemReview(item, estimateItemConfidence(item)));
    }

    private boolean needsItemReview(GradingItemEntity item, BigDecimal confidence) {
        if (item.getNeedsReview() != null) {
            return item.getNeedsReview();
        }
        if (item.getFinalScore() == null && item.getAutoScore() == null) {
            return true;
        }
        if (Boolean.TRUE.equals(item.getObjective())) {
            return false;
        }
        return confidence.compareTo(LOW_CONFIDENCE_THRESHOLD) < 0 || Boolean.FALSE.equals(item.getCorrect());
    }

    private String buildReviewReason(boolean failed, boolean needsReview) {
        if (failed) {
            return "不及格答卷，需要教师重点复核后再确认。";
        }
        if (needsReview) {
            return "存在低置信度或未完全匹配评分点的题目，建议教师抽查。";
        }
        return null;
    }

    private BigDecimal estimateItemConfidence(GradingItemEntity item) {
        if (Boolean.TRUE.equals(item.getObjective())) {
            return new BigDecimal("1.00");
        }
        if (item.getAutoScore() == null || item.getMaxScore() == null || item.getMaxScore().compareTo(BigDecimal.ZERO) <= 0) {
            return new BigDecimal("0.70");
        }
        BigDecimal ratio = item.getAutoScore().divide(item.getMaxScore(), 2, RoundingMode.HALF_UP);
        if (ratio.compareTo(new BigDecimal("0.15")) < 0 || ratio.compareTo(new BigDecimal("0.95")) > 0) {
            return new BigDecimal("0.72");
        }
        return new BigDecimal("0.86");
    }

    private JsonNode parseAnswer(AnswerItemEntity answerItem) {
        if (answerItem == null || answerItem.getAnswerJson() == null) {
            return NullNode.getInstance();
        }
        try {
            return objectMapper.readTree(answerItem.getAnswerJson());
        } catch (Exception exception) {
            return NullNode.getInstance();
        }
    }
}