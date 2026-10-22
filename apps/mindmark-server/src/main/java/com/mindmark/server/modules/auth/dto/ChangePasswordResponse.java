package com.mindmark.server.modules.auth.dto;

public record ChangePasswordResponse(
    boolean success,
    boolean mustChangePassword,
    boolean requiresRelogin
) {
}
