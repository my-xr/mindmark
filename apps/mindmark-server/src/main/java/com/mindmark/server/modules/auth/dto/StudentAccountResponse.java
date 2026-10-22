package com.mindmark.server.modules.auth.dto;

import com.mindmark.server.modules.auth.domain.UserStatus;
import java.time.OffsetDateTime;

public record StudentAccountResponse(
    String id,
    String userId,
    String username,
    String name,
    String email,
    String studentNo,
    String classId,
    String className,
    String grade,
    String major,
    UserStatus status,
    boolean mustChangePassword,
    OffsetDateTime lastLoginAt,
    OffsetDateTime createdAt
) {
}
