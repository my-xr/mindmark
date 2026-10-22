package com.mindmark.server.modules.grading.dto;

import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record GradingTaskResponse(
    String id,
    String examId,
    String examTitle,
    String answerSheetId,
    String studentId,
    String studentName,
    GradingTaskStatus status,
    BigDecimal objectiveScore,
    BigDecimal subjectiveScore,
    BigDecimal aiScore,
    BigDecimal finalScore,
    BigDecimal passScore,
    Boolean passed,
    Boolean failed,
    Boolean needsReview,
    String reviewReason,
    String comment,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt,
    OffsetDateTime reviewedAt,
    List<GradingItemResponse> items
) {
}
