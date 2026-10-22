package com.mindmark.server.modules.auth.dto;

public record ChangePasswordRequest(String oldPassword, String newPassword) {
}
