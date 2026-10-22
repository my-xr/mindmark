package com.mindmark.server.modules.auth.dto;

public record RosterImportErrorResponse(int rowNumber, String studentNo, String message) {
}
