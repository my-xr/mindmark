package com.mindmark.server.modules.exam.dto;

import com.mindmark.server.modules.exam.domain.ExamStatus;
import java.math.BigDecimal;
import java.util.List;

public record ExamResponse(
    String id,
    String title,
    String paperId,
    String paperTitle,
    List<String> classIds,
    String startAt,
    String endAt,
    Integer durationMinutes,
    BigDecimal totalScore,
    ExamStatus status,
    long participantCount,
    long submittedCount,
    String createdBy,
    String updatedAt
) {
}
