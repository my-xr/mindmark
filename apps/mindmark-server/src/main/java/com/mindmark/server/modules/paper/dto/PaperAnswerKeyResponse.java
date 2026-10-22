package com.mindmark.server.modules.paper.dto;

import java.math.BigDecimal;
import java.util.List;

public record PaperAnswerKeyResponse(
    String paperId,
    String title,
    String courseId,
    String courseName,
    BigDecimal totalScore,
    String generatedAt,
    List<PaperAnswerKeyItemResponse> items
) {
}
