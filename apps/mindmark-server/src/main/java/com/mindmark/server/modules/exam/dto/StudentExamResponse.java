package com.mindmark.server.modules.exam.dto;

import com.mindmark.server.modules.exam.domain.ExamStatus;
import java.math.BigDecimal;
import java.util.List;

public record StudentExamResponse(
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
    String answerSheetId,
    StudentAnswerStatus answerStatus,
    Integer answerVersion,
    String updatedAt
) {
}
