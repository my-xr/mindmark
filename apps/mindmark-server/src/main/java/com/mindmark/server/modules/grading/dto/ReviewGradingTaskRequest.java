package com.mindmark.server.modules.grading.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record ReviewGradingTaskRequest(
    @NotNull @DecimalMin("0.00") BigDecimal finalScore,
    String comment
) {
}