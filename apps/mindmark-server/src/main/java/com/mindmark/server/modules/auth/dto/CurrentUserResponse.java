package com.mindmark.server.modules.auth.dto;

import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.domain.UserStatus;
import java.util.List;

public record CurrentUserResponse(
    String id,
    String name,
    String email,
    String username,
    List<RoleCode> roles,
    UserStatus status,
    String studentId,
    boolean mustChangePassword
) {
}
