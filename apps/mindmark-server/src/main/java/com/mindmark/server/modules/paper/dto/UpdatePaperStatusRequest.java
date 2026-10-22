package com.mindmark.server.modules.paper.dto;

import com.mindmark.server.modules.paper.domain.PaperStatus;
import jakarta.validation.constraints.NotNull;

public record UpdatePaperStatusRequest(
    @NotNull PaperStatus status
) {
}