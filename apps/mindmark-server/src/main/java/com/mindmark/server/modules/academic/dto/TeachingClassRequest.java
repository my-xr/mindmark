package com.mindmark.server.modules.academic.dto;

import com.mindmark.server.modules.academic.domain.AcademicStatus;
import jakarta.validation.constraints.NotBlank;

public record TeachingClassRequest(
    String courseId,
    @NotBlank String code,
    @NotBlank String name,
    String grade,
    String major,
    AcademicStatus status
) {}
