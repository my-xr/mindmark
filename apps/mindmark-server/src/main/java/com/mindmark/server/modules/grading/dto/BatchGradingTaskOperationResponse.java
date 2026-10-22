package com.mindmark.server.modules.grading.dto;

public record BatchGradingTaskOperationResponse(
    int matchedCount,
    int processedCount,
    int skippedFailedCount,
    int skippedPendingCount,
    int skippedReviewedCount,
    String message
) {
}
