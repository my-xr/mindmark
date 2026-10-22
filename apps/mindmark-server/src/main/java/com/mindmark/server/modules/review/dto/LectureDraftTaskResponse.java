package com.mindmark.server.modules.review.dto;

import com.mindmark.server.modules.review.domain.LectureDraftTaskStatus;
import java.time.OffsetDateTime;

public record LectureDraftTaskResponse(
    String id,
    String examId,
    LectureDraftTaskStatus status,
    String provider,
    String draftId,
    AiLectureDraftResponse draft,
    String errorMessage,
    OffsetDateTime requestedAt,
    OffsetDateTime startedAt,
    OffsetDateTime finishedAt,
    OffsetDateTime updatedAt
) {
}
