package com.mindmark.server.modules.review.dto;

import com.mindmark.server.modules.storage.domain.ReviewArtifactType;
import jakarta.validation.constraints.NotNull;

public record CreateReviewArtifactRequest(
    @NotNull ReviewArtifactType artifactType
) {
}
