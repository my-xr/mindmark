package com.mindmark.server.modules.score.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;

public record ScoreReportResponse(
    String id,
    String examId,
    String examTitle,
    String courseName,
    String studentId,
    String studentName,
    String className,
    BigDecimal totalScore,
    BigDecimal score,
    Integer rank,
    List<String> weakKnowledgePoints,
    String feedback,
    OffsetDateTime publishedAt
) {
}