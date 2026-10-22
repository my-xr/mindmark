package com.mindmark.server.modules.question.dto;

import com.mindmark.server.modules.question.domain.QuestionStatus;

public record QuestionDeleteResponse(
    String id,
    boolean physicallyDeleted,
    QuestionStatus status,
    String message
) {
}
