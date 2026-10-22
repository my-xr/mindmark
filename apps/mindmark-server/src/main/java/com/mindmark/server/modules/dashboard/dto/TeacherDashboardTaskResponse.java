package com.mindmark.server.modules.dashboard.dto;

public record TeacherDashboardTaskResponse(
    String name,
    String meta,
    String status,
    String tone,
    String to
) {
}
