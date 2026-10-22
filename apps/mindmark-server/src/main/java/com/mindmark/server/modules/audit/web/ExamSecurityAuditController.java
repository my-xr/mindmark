package com.mindmark.server.modules.audit.web;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.modules.audit.dto.ExamSecurityEventReportRequest;
import com.mindmark.server.modules.audit.dto.ExamSecurityEventResponse;
import com.mindmark.server.modules.audit.service.ExamSecurityAuditService;
import com.mindmark.server.modules.auth.domain.RoleCode;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/exams/{examId}/security-events")
public class ExamSecurityAuditController {

    private final ExamSecurityAuditService examSecurityAuditService;

    public ExamSecurityAuditController(ExamSecurityAuditService examSecurityAuditService) {
        this.examSecurityAuditService = examSecurityAuditService;
    }

    @GetMapping
    public ApiResponse<PageResponse<ExamSecurityEventResponse>> listExamEvents(
        @PathVariable String examId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize
    ) {
        StpUtil.checkRoleOr(RoleCode.ADMIN.name(), RoleCode.TEACHER.name(), RoleCode.TA.name());
        return ApiResponse.success(examSecurityAuditService.listExamEventsPage(examId, page, pageSize));
    }

    @PostMapping
    public ApiResponse<ExamSecurityEventResponse> reportEvent(
        @PathVariable String examId,
        @RequestBody ExamSecurityEventReportRequest request,
        @RequestHeader(value = "User-Agent", required = false) String userAgent
    ) {
        StpUtil.checkRole(RoleCode.STUDENT.name());
        return ApiResponse.success(examSecurityAuditService.reportStudentEvent(examId, request, userAgent));
    }
}
