package com.mindmark.server.modules.auth.dto;

import java.time.OffsetDateTime;

public record ClassAssignmentResponse(
    String id,
    String userId,
    String classId,
    String assignmentRole,
    OffsetDateTime createdAt
) {
}