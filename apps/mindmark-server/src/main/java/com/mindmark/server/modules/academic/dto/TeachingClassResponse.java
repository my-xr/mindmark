package com.mindmark.server.modules.academic.dto;

import com.mindmark.server.modules.academic.domain.AcademicStatus;
import java.time.OffsetDateTime;

public record TeachingClassResponse(
    String id,
    String courseId,
    String courseName,
    String code,
    String name,
    String grade,
    String major,
    AcademicStatus status,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}
