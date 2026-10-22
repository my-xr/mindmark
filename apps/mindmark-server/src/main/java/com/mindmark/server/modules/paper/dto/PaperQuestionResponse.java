package com.mindmark.server.modules.paper.dto;

import com.mindmark.server.modules.question.dto.QuestionResponse;
import java.math.BigDecimal;

public record PaperQuestionResponse(
    String id,
    String questionId,
    int order,
    BigDecimal score,
    QuestionResponse question
) {
}