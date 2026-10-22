package com.mindmark.server.modules.question.dto;

import com.mindmark.server.modules.question.domain.QuestionReviewAction;

public record QuestionReviewRequest(
    QuestionReviewAction action,
    String comment
) {
}
