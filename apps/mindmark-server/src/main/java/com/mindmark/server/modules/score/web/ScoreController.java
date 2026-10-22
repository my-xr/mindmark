package com.mindmark.server.modules.score.web;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.modules.score.dto.ExamScoreSummaryResponse;
import com.mindmark.server.modules.score.dto.PublishScoreResponse;
import com.mindmark.server.modules.score.dto.ScoreReportResponse;
import com.mindmark.server.modules.score.dto.ScoreSummaryItemResponse;
import com.mindmark.server.modules.score.service.ScoreService;
import com.mindmark.server.modules.auth.domain.RoleCode;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ScoreController {

    private final ScoreService scoreService;

    public ScoreController(ScoreService scoreService) {
        this.scoreService = scoreService;
    }

    @GetMapping("/api/v1/score-summaries")
    public ApiResponse<PageResponse<ExamScoreSummaryResponse>> listExamScoreSummaries(
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        requireScoreStaffRole();
        return ApiResponse.success(scoreService.listExamScoreSummaries(page, pageSize));
    }

    @GetMapping("/api/v1/exams/{examId}/scores")
    public ApiResponse<ExamScoreSummaryResponse> getExamScores(@PathVariable String examId) {
        requireScoreStaffRole();
        return ApiResponse.success(scoreService.getExamScores(examId));
    }

    @GetMapping("/api/v1/exams/{examId}/score-reports")
    public ApiResponse<PageResponse<ScoreSummaryItemResponse>> listExamScoreReports(
        @PathVariable String examId,
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        requireScoreStaffRole();
        return ApiResponse.success(scoreService.listExamScoreReports(examId, page, pageSize));
    }

    @PostMapping("/api/v1/exams/{examId}/publish-scores")
    public ApiResponse<PublishScoreResponse> publishScores(@PathVariable String examId) {
        requireScoreStaffRole();
        return ApiResponse.success(scoreService.publishScores(examId));
    }

    @GetMapping("/api/v1/student/score-reports")
    public ApiResponse<List<ScoreReportResponse>> listStudentReports() {
        StpUtil.checkRole(RoleCode.STUDENT.name());
        return ApiResponse.success(scoreService.listStudentReports());
    }

    private void requireScoreStaffRole() {
        StpUtil.checkRoleOr(RoleCode.ADMIN.name(), RoleCode.TEACHER.name(), RoleCode.TA.name());
    }
}
