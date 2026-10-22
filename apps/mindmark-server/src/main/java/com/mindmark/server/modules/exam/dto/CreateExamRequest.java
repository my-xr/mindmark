package com.mindmark.server.modules.exam.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.time.OffsetDateTime;
import java.util.List;

public record CreateExamRequest(
    @NotBlank String title,
    @NotBlank String paperId,
    @NotEmpty List<@NotBlank String> classIds,
    @NotNull OffsetDateTime startAt,
    @NotNull OffsetDateTime endAt,
    @Min(1) Integer durationMinutes
) {
}
