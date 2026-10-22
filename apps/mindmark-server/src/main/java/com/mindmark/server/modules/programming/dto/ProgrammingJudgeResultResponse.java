package com.mindmark.server.modules.programming.dto;

import com.mindmark.server.modules.programming.domain.ProgrammingJudgeStatus;
import com.mindmark.server.modules.programming.domain.ProgrammingTestCaseVisibility;
import java.math.BigDecimal;

public record ProgrammingJudgeResultResponse(
    String id,
    String testCaseId,
    String testCaseTitle,
    ProgrammingTestCaseVisibility visibility,
    ProgrammingJudgeStatus status,
    String actualOutputSummary,
    String stderrSummary,
    Integer timeMs,
    Integer memoryKb,
    Boolean passed,
    BigDecimal score,
    String createdAt
) {
}
