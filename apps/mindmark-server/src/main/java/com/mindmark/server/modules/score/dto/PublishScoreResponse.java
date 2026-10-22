package com.mindmark.server.modules.score.dto;

import java.time.OffsetDateTime;

public record PublishScoreResponse(
    String examId,
    Integer publishedCount,
    OffsetDateTime publishedAt
) {
}