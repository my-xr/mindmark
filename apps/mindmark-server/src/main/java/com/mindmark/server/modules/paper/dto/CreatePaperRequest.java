package com.mindmark.server.modules.paper.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record CreatePaperRequest(
    @NotBlank String title,
    @NotBlank String courseId,
    String description,
    @Min(1) Integer durationMinutes
) {
}
