package com.mindmark.server.modules.academic.dto;

import com.mindmark.server.modules.academic.domain.AcademicStatus;
import java.time.OffsetDateTime;

public record CourseResponse(
    String id,
    String code,
    String name,
    String description,
    AcademicStatus status,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
