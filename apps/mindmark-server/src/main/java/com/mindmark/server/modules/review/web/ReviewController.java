package com.mindmark.server.modules.review.web;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.modules.review.dto.AiLectureDraftResponse;
import com.mindmark.server.modules.review.dto.ApproveLectureDraftRequest;
import com.mindmark.server.modules.review.dto.CreateReviewArtifactRequest;
import com.mindmark.server.modules.review.dto.ExamReviewReportResponse;
import com.mindmark.server.modules.review.dto.LectureDraftTaskResponse;
import com.mindmark.server.modules.review.dto.ReviewArtifactResponse;
import com.mindmark.server.modules.review.service.LectureDraftTaskService;
import com.mindmark.server.modules.review.service.ReviewService;
import com.mindmark.server.modules.review.service.ReviewService.ReviewArtifactFile;
import com.mindmark.server.modules.auth.domain.RoleCode;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReviewController {

    private final ReviewService reviewService;
    private final LectureDraftTaskService lectureDraftTaskService;

    public ReviewController(ReviewService reviewService, LectureDraftTaskService lectureDraftTaskService) {
        this.reviewService = reviewService;
        this.lectureDraftTaskService = lectureDraftTaskService;
    }

    @GetMapping("/api/v1/exams/reviews")
    public ApiResponse<PageResponse<ExamReviewReportResponse>> listReports(
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize
    ) {
        requireReviewStaffRole();
        return ApiResponse.success(reviewService.listReports(page, pageSize));
    }

    @GetMapping("/api/v1/exams/{examId}/review")
    public ApiResponse<ExamReviewReportResponse> getReport(@PathVariable String examId) {
        requireReviewStaffRole();
        return ApiResponse.success(reviewService.getReport(examId));
    }

    @PostMapping("/api/v1/exams/{examId}/lecture-draft/regenerate")
    public ApiResponse<AiLectureDraftResponse> regenerateLectureDraft(@PathVariable String examId) {
        requireReviewStaffRole();
        return ApiResponse.success(reviewService.regenerateLectureDraft(examId));
    }

    @PostMapping("/api/v1/exams/{examId}/lecture-draft/tasks")
    public ApiResponse<LectureDraftTaskResponse> createLectureDraftTask(@PathVariable String examId) {
        requireReviewStaffRole();
        return ApiResponse.success(lectureDraftTaskService.createTask(examId));
    }

    @GetMapping("/api/v1/lecture-draft-tasks/{taskId}")
    public ApiResponse<LectureDraftTaskResponse> getLectureDraftTask(@PathVariable String taskId) {
        requireReviewStaffRole();
        return ApiResponse.success(lectureDraftTaskService.getTask(taskId));
    }

    @PostMapping("/api/v1/exams/{examId}/lecture-draft/approve")
    public ApiResponse<AiLectureDraftResponse> approveLectureDraft(
        @PathVariable String examId,
        @RequestBody(required = false) ApproveLectureDraftRequest request
    ) {
        requireReviewStaffRole();
        return ApiResponse.success(reviewService.approveLectureDraft(examId, request));
    }

    @PostMapping("/api/v1/exams/{examId}/review-artifacts")
    public ApiResponse<ReviewArtifactResponse> createArtifact(
        @PathVariable String examId,
        @Valid @RequestBody CreateReviewArtifactRequest request
    ) {
        requireReviewStaffRole();
        return ApiResponse.success(reviewService.createArtifact(examId, request));
    }

    @GetMapping("/api/v1/review-artifacts/{artifactId}/download")
    public ApiResponse<ReviewArtifactResponse> getArtifactDownload(@PathVariable String artifactId) {
        requireReviewStaffRole();
        return ApiResponse.success(reviewService.getArtifactDownload(artifactId));
    }

    @GetMapping("/api/v1/review-artifacts/{artifactId}/file")
    public ResponseEntity<ByteArrayResource> downloadArtifactFile(@PathVariable String artifactId) {
        requireReviewStaffRole();
        ReviewArtifactFile file = reviewService.downloadArtifactFile(artifactId);
        return ResponseEntity.ok()
            .contentType(MediaType.parseMediaType(file.contentType()))
            .contentLength(file.bytes().length)
            .header(
                HttpHeaders.CONTENT_DISPOSITION,
                ContentDisposition.attachment()
                    .filename(file.fileName(), StandardCharsets.UTF_8)
                    .build()
                    .toString()
            )
            .body(new ByteArrayResource(file.bytes()));
    }

    private void requireReviewStaffRole() {
        StpUtil.checkRoleOr(RoleCode.ADMIN.name(), RoleCode.TEACHER.name(), RoleCode.TA.name());
    }
}
