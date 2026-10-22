package com.mindmark.server.modules.auth.dto;

public record LoginRequest(String userId, String username, String password) {
}