package com.mindmark.server.modules.academic.dto;

import com.mindmark.server.modules.academic.domain.AcademicStatus;
import java.time.OffsetDateTime;

public record CourseChapterResponse(
    String id,
    String courseId,
    String courseName,
    Integer chapterNo,
    String title,
    String description,
    AcademicStatus status,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}
