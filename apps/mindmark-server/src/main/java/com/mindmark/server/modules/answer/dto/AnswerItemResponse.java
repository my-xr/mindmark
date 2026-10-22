package com.mindmark.server.modules.answer.dto;

import com.fasterxml.jackson.databind.JsonNode;

public record AnswerItemResponse(
    String questionId,
    JsonNode answer,
    String updatedAt
) {
}
