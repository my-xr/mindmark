package com.mindmark.server.modules.auth.dto;

public record StudentImportRowRequest(
    String studentNo,
    String name,
    String email,
    String className,
    String grade,
    String major
) {
}
