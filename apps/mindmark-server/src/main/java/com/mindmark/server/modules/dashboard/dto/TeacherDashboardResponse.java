package com.mindmark.server.modules.dashboard.dto;

import java.util.List;

public record TeacherDashboardResponse(
    List<TeacherDashboardMetricResponse> metrics,
    List<TeacherDashboardTaskResponse> tasks
) {
}
