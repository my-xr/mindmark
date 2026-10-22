package com.mindmark.server.modules.answer.dto;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record AnswerItemRequest(
    @NotBlank String questionId,
    @NotNull JsonNode answer
) {
}
