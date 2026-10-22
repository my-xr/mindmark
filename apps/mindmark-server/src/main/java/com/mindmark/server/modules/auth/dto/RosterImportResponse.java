package com.mindmark.server.modules.auth.dto;

import java.util.List;

public record RosterImportResponse(
    String taskId,
    String status,
    int totalCount,
    int createdCount,
    int skippedCount,
    int failedCount,
    List<RosterImportErrorResponse> errors,
    List<StudentAccountResponse> students
) {
}
