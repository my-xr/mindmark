package com.mindmark.server.modules.auth.dto;

import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.domain.UserStatus;
import java.time.OffsetDateTime;
import java.util.List;

public record AdminUserResponse(
    String id,
    String name,
    String email,
    String username,
    List<RoleCode> roles,
    UserStatus status,
    boolean mustChangePassword,
    int failedLoginCount,
    OffsetDateTime lockedUntil,
    String accountSource,
    String studentId,
    OffsetDateTime lastLoginAt,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {
}