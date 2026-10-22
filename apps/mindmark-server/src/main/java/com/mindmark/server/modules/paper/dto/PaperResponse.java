package com.mindmark.server.modules.paper.dto;

import com.mindmark.server.modules.paper.domain.PaperStatus;
import java.math.BigDecimal;
import java.util.List;

public record PaperResponse(
    String id,
    String title,
    String courseId,
    String courseName,
    String description,
    Integer durationMinutes,
    BigDecimal totalScore,
    PaperStatus status,
    List<PaperQuestionResponse> questions,
    String createdBy,
    String updatedAt
) {
}