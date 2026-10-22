package com.mindmark.server.modules.programming.dto;

import com.mindmark.server.modules.programming.domain.ProgrammingTestCaseVisibility;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public record ProgrammingTestCaseRequest(
    @NotBlank @Size(max = 200) String title,
    @NotBlank String inputPayload,
    @NotBlank String expectedOutput,
    @NotNull ProgrammingTestCaseVisibility visibility,
    @NotNull @DecimalMin("0.00") BigDecimal weight,
    Integer sortOrder
) {
}
