package com.mindmark.server.modules.academic.dto;

import com.mindmark.server.modules.academic.domain.AcademicStatus;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CourseChapterRequest(
    @NotNull @Min(0) Integer chapterNo,
    @NotBlank String title,
    String description,
    AcademicStatus status
) {
}
