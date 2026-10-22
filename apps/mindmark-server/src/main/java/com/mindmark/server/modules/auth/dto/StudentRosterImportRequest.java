package com.mindmark.server.modules.auth.dto;

import java.util.List;

public record StudentRosterImportRequest(
    String classId,
    String className,
    List<StudentImportRowRequest> students
) {
}
