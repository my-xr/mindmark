package com.mindmark.server.modules.review.dto;

import java.math.BigDecimal;
import java.util.List;

public record QuestionPerformanceResponse(
    String questionId,
    Integer order,
    String title,
    BigDecimal maxScore,
    BigDecimal averageScore,
    BigDecimal scoreRate,
    List<String> weaknessTags
) {
}
