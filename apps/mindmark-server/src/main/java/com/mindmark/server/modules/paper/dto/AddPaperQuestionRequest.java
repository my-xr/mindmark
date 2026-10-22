package com.mindmark.server.modules.paper.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AddPaperQuestionRequest(
    @NotBlank String questionId,
    @NotNull @DecimalMin("0.0") BigDecimal score
) {
}