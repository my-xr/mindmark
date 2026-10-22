package com.mindmark.server.modules.grading.dto;

public record BatchConfirmGradingTasksRequest(
    String examId,
    String courseName,
    String scoreBand,
    Boolean includeFailed,
    Boolean onlyAutoGraded
) {
}
