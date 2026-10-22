package com.mindmark.server.modules.dashboard.web;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.dashboard.dto.TeacherDashboardResponse;
import com.mindmark.server.modules.dashboard.service.TeacherDashboardService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/teacher/dashboard")
public class TeacherDashboardController {

    private final TeacherDashboardService teacherDashboardService;

    public TeacherDashboardController(TeacherDashboardService teacherDashboardService) {
        this.teacherDashboardService = teacherDashboardService;
    }

    @GetMapping
    public ApiResponse<TeacherDashboardResponse> getDashboard() {
        StpUtil.checkRoleOr(
            RoleCode.ADMIN.name(),
            RoleCode.TEACHER.name(),
            RoleCode.TA.name()
        );
        return ApiResponse.success(teacherDashboardService.getDashboard());
    }
}
