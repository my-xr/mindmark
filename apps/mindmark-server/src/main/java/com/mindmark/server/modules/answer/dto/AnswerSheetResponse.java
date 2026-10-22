package com.mindmark.server.modules.answer.dto;

import com.mindmark.server.modules.answer.domain.AnswerSheetStatus;
import java.util.List;

public record AnswerSheetResponse(
    String id,
    String examId,
    String studentId,
    String studentName,
    AnswerSheetStatus status,
    Integer version,
    List<AnswerItemResponse> answers,
    String startedAt,
    String clientSavedAt,
    String submittedAt,
    String updatedAt
) {
}
