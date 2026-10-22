package com.mindmark.server.modules.exam.web;

import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.PageResponse;
import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.exam.dto.CreateExamRequest;
import com.mindmark.server.modules.exam.dto.ExamResponse;
import com.mindmark.server.modules.exam.dto.StudentExamResponse;
import com.mindmark.server.modules.exam.service.ExamService;
import com.mindmark.server.modules.paper.dto.PaperResponse;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ExamController {

    private final ExamService examService;

    public ExamController(ExamService examService) {
        this.examService = examService;
    }

    @GetMapping("/api/v1/exams")
    public ApiResponse<PageResponse<ExamResponse>> listExams(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize
    ) {
        StpUtil.checkRoleOr(RoleCode.ADMIN.name(), RoleCode.TEACHER.name(), RoleCode.TA.name());
        return ApiResponse.success(examService.listExams(page, pageSize));
    }

    @GetMapping("/api/v1/exams/{examId}")
    public ApiResponse<ExamResponse> getExam(@PathVariable String examId) {
        return ApiResponse.success(examService.getExam(examId));
    }

    @PostMapping("/api/v1/exams")
    public ApiResponse<ExamResponse> createExam(@Valid @RequestBody CreateExamRequest request) {
        StpUtil.checkRoleOr(RoleCode.ADMIN.name(), RoleCode.TEACHER.name(), RoleCode.TA.name());
        return ApiResponse.success(examService.createExam(request));
    }

    @GetMapping("/api/v1/student/exams")
    public ApiResponse<List<StudentExamResponse>> listStudentExams() {
        StpUtil.checkRole(RoleCode.STUDENT.name());
        return ApiResponse.success(examService.listStudentExams());
    }

    @GetMapping("/api/v1/student/exams/{examId}/paper")
    public ApiResponse<PaperResponse> getStudentPaper(@PathVariable String examId) {
        StpUtil.checkRole(RoleCode.STUDENT.name());
        return ApiResponse.success(examService.getStudentPaper(examId));
    }
}

