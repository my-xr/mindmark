package com.mindmark.server.modules.review.dto;

import com.mindmark.server.modules.storage.domain.ReviewArtifactType;
import java.time.OffsetDateTime;

public record ReviewArtifactResponse(
    String id,
    String examId,
    ReviewArtifactType artifactType,
    String fileName,
    String objectKey,
    String contentType,
    Long sizeBytes,
    String checksumSha256,
    OffsetDateTime createdAt,
    String downloadUrl
) {
}
