package com.mindmark.server.modules.score.dto;

import java.math.BigDecimal;
import java.util.List;

public record ExamScoreSummaryResponse(
    String examId,
    String examTitle,
    BigDecimal totalScore,
    Integer reviewedCount,
    Integer submittedCount,
    BigDecimal averageScore,
    BigDecimal highestScore,
    BigDecimal lowestScore,
    List<ScoreBandSummaryResponse> scoreBands,
    List<ScoreSummaryItemResponse> items
) {
}