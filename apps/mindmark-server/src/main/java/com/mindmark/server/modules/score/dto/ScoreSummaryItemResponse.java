package com.mindmark.server.modules.score.dto;

import java.math.BigDecimal;

public record ScoreSummaryItemResponse(
    String gradingTaskId,
    String answerSheetId,
    String studentId,
    String studentName,
    BigDecimal objectiveScore,
    BigDecimal subjectiveScore,
    BigDecimal finalScore,
    Integer rank
) {
}