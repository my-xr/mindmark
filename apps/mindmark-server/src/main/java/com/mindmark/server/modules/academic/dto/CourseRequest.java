package com.mindmark.server.modules.academic.dto;

import com.mindmark.server.modules.academic.domain.AcademicStatus;
import jakarta.validation.constraints.NotBlank;

public record CourseRequest(
    @NotBlank String code,
    @NotBlank String name,
    String description,
    AcademicStatus status
) {}
