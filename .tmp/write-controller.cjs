const fs = require('fs');
const file = 'apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/web/GradingTaskController.java';
const content = `package com.mindmark.server.modules.grading.web;

import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.modules.grading.dto.BatchConfirmGradingTasksRequest;
import com.mindmark.server.modules.grading.dto.BatchGradingTaskOperationResponse;
import com.mindmark.server.modules.grading.dto.GradingAiJobResponse;
import com.mindmark.server.modules.grading.dto.GradingItemResponse;
import com.mindmark.server.modules.grading.dto.GradingTaskResponse;
import com.mindmark.server.modules.grading.dto.ReviewGradingItemRequest;
import com.mindmark.server.modules.grading.dto.ReviewGradingTaskRequest;
import com.mindmark.server.modules.grading.service.GradingAiJobService;
import com.mindmark.server.modules.grading.service.GradingTaskService;
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
@RequestMapping("/api/v1/grading-tasks")
public class GradingTaskController {

    private final GradingTaskService gradingTaskService;
    private final GradingAiJobService gradingAiJobService;

    public GradingTaskController(GradingTaskService gradingTaskService, GradingAiJobService gradingAiJobService) {
        this.gradingTaskService = gradingTaskService;
        this.gradingAiJobService = gradingAiJobService;
    }

    @GetMapping(params = "!page")
    public ApiResponse<List<GradingTaskResponse>> listTasks(
        @RequestParam(required = false) String examId,
        @RequestParam(required = false) String courseName,
        @RequestParam(required = false) String scoreBand
    ) {
        return ApiResponse.success(gradingTaskService.listTasks(examId, courseName, scoreBand));
    }

    @GetMapping(params = {"page", "pageSize"})
    public ApiResponse<PageResponse<GradingTaskResponse>> listTasksPage(
        @RequestParam(required = false) String examId,
        @RequestParam(required = false) String courseName,
        @RequestParam(required = false) String scoreBand,
        @RequestParam Integer page,
        @RequestParam Integer pageSize
    ) {
        return ApiResponse.success(gradingTaskService.listTasksPage(examId, courseName, scoreBand, page, pageSize));
    }

    @GetMapping("/{gradingTaskId}/items")
    public ApiResponse<PageResponse<GradingItemResponse>> listTaskItems(
        @PathVariable String gradingTaskId,
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "10") Integer pageSize
    ) {
        return ApiResponse.success(gradingTaskService.listTaskItems(gradingTaskId, page, pageSize));
    }

    @GetMapping("/{gradingTaskId}")
    public ApiResponse<GradingTaskResponse> getTask(@PathVariable String gradingTaskId) {
        return ApiResponse.success(gradingTaskService.getTask(gradingTaskId));
    }

    @PostMapping("/{gradingTaskId}/auto-grade")
    public ApiResponse<GradingTaskResponse> autoGrade(@PathVariable String gradingTaskId) {
        return ApiResponse.success(gradingTaskService.autoGrade(gradingTaskId));
    }

    @PostMapping("/{gradingTaskId}/ai-grading-job")
    public ApiResponse<GradingAiJobResponse> enqueueAiGradingJob(@PathVariable String gradingTaskId) {
        return ApiResponse.success(gradingAiJobService.enqueueIfNeeded(gradingTaskId));
    }

    @GetMapping("/{gradingTaskId}/ai-grading-job/latest")
    public ApiResponse<GradingAiJobResponse> latestAiGradingJob(@PathVariable String gradingTaskId) {
        return ApiResponse.success(gradingAiJobService.latestJob(gradingTaskId));
    }

    @PostMapping("/{gradingTaskId}/confirm-system-score")
    public ApiResponse<GradingTaskResponse> confirmSystemScore(
        @PathVariable String gradingTaskId,
        @RequestParam(defaultValue = "false") boolean includeFailed
    ) {
        return ApiResponse.success(gradingTaskService.confirmSystemScore(gradingTaskId, includeFailed));
    }

    @PostMapping("/batch-auto-grade")
    public ApiResponse<BatchGradingTaskOperationResponse> batchAutoGrade(
        @RequestBody BatchConfirmGradingTasksRequest request
    ) {
        return ApiResponse.success(gradingTaskService.batchAutoGrade(request));
    }

    @PostMapping("/batch-confirm")
    public ApiResponse<BatchGradingTaskOperationResponse> batchConfirm(
        @RequestBody BatchConfirmGradingTasksRequest request
    ) {
        return ApiResponse.success(gradingTaskService.batchConfirm(request));
    }

    @PostMapping("/{gradingTaskId}/items/{questionId}/review")
    public ApiResponse<GradingTaskResponse> reviewItem(
        @PathVariable String gradingTaskId,
        @PathVariable String questionId,
        @Valid @RequestBody ReviewGradingItemRequest request
    ) {
        return ApiResponse.success(gradingTaskService.reviewItem(gradingTaskId, questionId, request));
    }

    @PostMapping("/{gradingTaskId}/review")
    public ApiResponse<GradingTaskResponse> review(
        @PathVariable String gradingTaskId,
        @Valid @RequestBody ReviewGradingTaskRequest request
    ) {
        return ApiResponse.success(gradingTaskService.review(gradingTaskId, request));
    }
}
`;
fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), 'utf8');