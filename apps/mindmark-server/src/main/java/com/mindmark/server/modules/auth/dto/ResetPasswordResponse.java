package com.mindmark.server.modules.auth.dto;

public record ResetPasswordResponse(String studentId, String username, boolean mustChangePassword) {
}
