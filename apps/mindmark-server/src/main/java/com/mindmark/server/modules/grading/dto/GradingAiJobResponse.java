package com.mindmark.server.modules.grading.dto;

import com.mindmark.server.modules.grading.domain.GradingAiJobStatus;
import java.time.OffsetDateTime;

public record GradingAiJobResponse(
    String id,
    String gradingTaskId,
    GradingAiJobStatus status,
    String teacherId,
    String provider,
    String model,
    int subjectiveItemCount,
    int processedItemCount,
    int refreshedItemCount,
    String errorMessage,
    Long durationMs,
    String promptVersion,
    String requestId,
    String resultSummary,
    OffsetDateTime createdAt,
    OffsetDateTime startedAt,
    OffsetDateTime finishedAt,
    OffsetDateTime updatedAt
) {
}