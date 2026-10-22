package com.mindmark.server.modules.auth.web;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.domain.UserStatus;
import com.mindmark.server.modules.auth.dto.AdminUserResponse;
import com.mindmark.server.modules.auth.dto.AuthAuditLogResponse;
import com.mindmark.server.modules.auth.dto.ClassAssignmentRequest;
import com.mindmark.server.modules.auth.dto.ClassAssignmentResponse;
import com.mindmark.server.modules.auth.dto.UpdateUserRolesRequest;
import com.mindmark.server.modules.auth.dto.UpdateUserStatusRequest;
import com.mindmark.server.modules.auth.service.AdminAccountGovernanceService;
import java.util.List;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin")
public class AdminAccountGovernanceController {

    private final AdminAccountGovernanceService adminAccountGovernanceService;

    public AdminAccountGovernanceController(AdminAccountGovernanceService adminAccountGovernanceService) {
        this.adminAccountGovernanceService = adminAccountGovernanceService;
    }

    @GetMapping("/users")
    public ApiResponse<PageResponse<AdminUserResponse>> listUsers(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) RoleCode role,
        @RequestParam(required = false) UserStatus status,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize
    ) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(adminAccountGovernanceService.listUsers(keyword, role, status, page, pageSize));
    }

    @PatchMapping("/users/{userId}/status")
    public ApiResponse<AdminUserResponse> updateStatus(@PathVariable String userId, @RequestBody UpdateUserStatusRequest request) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(adminAccountGovernanceService.updateStatus(userId, request));
    }

    @PutMapping("/users/{userId}/roles")
    public ApiResponse<AdminUserResponse> updateRoles(@PathVariable String userId, @RequestBody UpdateUserRolesRequest request) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(adminAccountGovernanceService.updateRoles(userId, request));
    }

    @PostMapping("/users/{userId}/unlock")
    public ApiResponse<AdminUserResponse> unlockUser(@PathVariable String userId) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(adminAccountGovernanceService.unlockUser(userId));
    }

    @GetMapping("/users/{userId}/class-assignments")
    public ApiResponse<List<ClassAssignmentResponse>> listClassAssignments(@PathVariable String userId) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(adminAccountGovernanceService.listClassAssignments(userId));
    }

    @PostMapping("/users/{userId}/class-assignments")
    public ApiResponse<ClassAssignmentResponse> upsertClassAssignment(@PathVariable String userId, @RequestBody ClassAssignmentRequest request) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(adminAccountGovernanceService.upsertClassAssignment(userId, request));
    }

    @DeleteMapping("/users/{userId}/class-assignments/{assignmentId}")
    public ApiResponse<Boolean> deleteClassAssignment(@PathVariable String userId, @PathVariable String assignmentId) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        adminAccountGovernanceService.deleteClassAssignment(userId, assignmentId);
        return ApiResponse.success(Boolean.TRUE);
    }

    @GetMapping("/audit-logs")
    public ApiResponse<PageResponse<AuthAuditLogResponse>> listAuditLogs(
        @RequestParam(required = false) String actorId,
        @RequestParam(required = false) String targetUserId,
        @RequestParam(required = false) String action,
        @RequestParam(required = false) String result,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize
    ) {
        StpUtil.checkRole(RoleCode.ADMIN.name());
        return ApiResponse.success(adminAccountGovernanceService.listAuditLogs(actorId, targetUserId, action, result, page, pageSize));
    }
}