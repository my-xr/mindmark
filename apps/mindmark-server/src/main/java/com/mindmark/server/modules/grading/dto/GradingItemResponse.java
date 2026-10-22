package com.mindmark.server.modules.grading.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.mindmark.server.modules.question.domain.QuestionType;
import java.math.BigDecimal;

public record GradingItemResponse(
    String id,
    String questionId,
    String questionTitle,
    QuestionType questionType,
    BigDecimal maxScore,
    BigDecimal autoScore,
    BigDecimal finalScore,
    Boolean objective,
    Boolean correct,
    BigDecimal aiConfidence,
    Boolean needsReview,
    String comment,
    String gradingSource,
    String aiProvider,
    String aiModel,
    String aiRubricVersion,
    BigDecimal aiRawScore,
    String teacherOverrideReason,
    BigDecimal scoreDiff,
    JsonNode studentAnswer
) {
}