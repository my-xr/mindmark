package com.mindmark.server.modules.auth.web;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.modules.auth.dto.ResetPasswordResponse;
import com.mindmark.server.modules.auth.dto.RosterImportResponse;
import com.mindmark.server.modules.auth.dto.StudentAccountResponse;
import com.mindmark.server.modules.auth.dto.StudentRosterImportRequest;
import com.mindmark.server.modules.auth.service.StudentAccountService;
import com.mindmark.server.modules.auth.domain.RoleCode;
import java.nio.charset.StandardCharsets;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class StudentAccountController {

    private final StudentAccountService studentAccountService;

    public StudentAccountController(StudentAccountService studentAccountService) {
        this.studentAccountService = studentAccountService;
    }

    @GetMapping("/student-roster-template")
    public ResponseEntity<byte[]> downloadTemplate() {
        StpUtil.checkRoleOr(RoleCode.ADMIN.name(), RoleCode.TEACHER.name(), RoleCode.TA.name());
        byte[] content = studentAccountService.downloadTemplate();
        ContentDisposition disposition = ContentDisposition.attachment()
            .filename("mindmark-student-roster-template.csv", StandardCharsets.UTF_8)
            .build();
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
            .contentType(new MediaType("text", "csv", StandardCharsets.UTF_8))
            .body(content);
    }

    @PostMapping("/classes/{classId}/students/import")
    public ApiResponse<RosterImportResponse> importStudents(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestHeader(value = "X-MindMark-User-Id", required = false) String userId,
        @RequestHeader(value = "X-MindMark-Roles", required = false) String roles,
        @PathVariable String classId,
        @RequestBody StudentRosterImportRequest request
    ) {
        StudentRosterImportRequest normalized = new StudentRosterImportRequest(classId, request == null ? null : request.className(), request == null ? null : request.students());
        return ApiResponse.success(studentAccountService.importStudents(authorization, userId, roles, normalized));
    }

    @GetMapping("/roster-import-tasks/{taskId}")
    public ApiResponse<RosterImportResponse> getImportTask(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestHeader(value = "X-MindMark-User-Id", required = false) String userId,
        @RequestHeader(value = "X-MindMark-Roles", required = false) String roles,
        @PathVariable String taskId
    ) {
        return ApiResponse.success(studentAccountService.getImportTask(authorization, userId, roles, taskId));
    }

    @GetMapping("/classes/{classId}/students")
    public ApiResponse<PageResponse<StudentAccountResponse>> listClassStudents(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestHeader(value = "X-MindMark-User-Id", required = false) String userId,
        @RequestHeader(value = "X-MindMark-Roles", required = false) String roles,
        @PathVariable String classId,
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "20") Integer pageSize
    ) {
        return ApiResponse.success(studentAccountService.listClassStudents(authorization, userId, roles, classId, page, pageSize));
    }

    @PostMapping("/students/{studentId}/reset-password")
    public ApiResponse<ResetPasswordResponse> resetPassword(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestHeader(value = "X-MindMark-User-Id", required = false) String userId,
        @RequestHeader(value = "X-MindMark-Roles", required = false) String roles,
        @PathVariable String studentId
    ) {
        return ApiResponse.success(studentAccountService.resetPassword(authorization, userId, roles, studentId));
    }
}
