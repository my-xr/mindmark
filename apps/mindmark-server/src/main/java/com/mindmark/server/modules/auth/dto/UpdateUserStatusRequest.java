package com.mindmark.server.modules.auth.dto;

import com.mindmark.server.modules.auth.domain.UserStatus;

public record UpdateUserStatusRequest(UserStatus status) {
}