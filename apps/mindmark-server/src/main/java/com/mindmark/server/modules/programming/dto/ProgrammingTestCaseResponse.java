package com.mindmark.server.modules.programming.dto;

import com.mindmark.server.modules.programming.domain.ProgrammingTestCaseVisibility;
import java.math.BigDecimal;

public record ProgrammingTestCaseResponse(
    String id,
    String questionId,
    String title,
    String inputPayload,
    String expectedOutput,
    ProgrammingTestCaseVisibility visibility,
    BigDecimal weight,
    Integer sortOrder,
    String createdBy,
    String createdAt,
    String updatedAt
) {
}
