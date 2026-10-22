package com.mindmark.server.modules.auth.dto;

public record LoginResponse(String token, CurrentUserResponse user, boolean mustChangePassword) {
}
