package com.mindmark.server.modules.review.dto;

import java.math.BigDecimal;
import java.util.List;

public record ExamReviewReportResponse(
    String examId,
    String examTitle,
    String courseName,
    BigDecimal totalScore,
    BigDecimal averageScore,
    BigDecimal passRate,
    Integer submittedCount,
    Integer reviewedCount,
    List<ScoreBandResponse> scoreBands,
    List<QuestionPerformanceResponse> questionPerformances,
    List<KnowledgeWeaknessResponse> knowledgeWeaknesses,
    List<StudentLayerInsightResponse> studentLayerInsights,
    AiLectureDraftResponse lectureDraft,
    List<ReviewArtifactResponse> artifacts
) {
}
