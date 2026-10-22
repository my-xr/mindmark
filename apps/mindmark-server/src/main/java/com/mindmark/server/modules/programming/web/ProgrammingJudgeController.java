package com.mindmark.server.modules.programming.web;

import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.modules.programming.dto.ProgrammingSubmissionRequest;
import com.mindmark.server.modules.programming.dto.ProgrammingSubmissionResponse;
import com.mindmark.server.modules.programming.dto.ProgrammingTestCaseRequest;
import com.mindmark.server.modules.programming.dto.ProgrammingTestCaseResponse;
import com.mindmark.server.modules.programming.service.ProgrammingJudgeService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1")
public class ProgrammingJudgeController {

    private final ProgrammingJudgeService programmingJudgeService;

    public ProgrammingJudgeController(ProgrammingJudgeService programmingJudgeService) {
        this.programmingJudgeService = programmingJudgeService;
    }

    @GetMapping("/questions/{questionId}/programming-test-cases")
    public ApiResponse<PageResponse<ProgrammingTestCaseResponse>> listTestCases(
        @PathVariable String questionId,
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "20") Integer pageSize
    ) {
        return ApiResponse.success(programmingJudgeService.listTestCases(questionId, page, pageSize));
    }

    @PostMapping("/questions/{questionId}/programming-test-cases")
    public ApiResponse<ProgrammingTestCaseResponse> createTestCase(
        @PathVariable String questionId,
        @Valid @RequestBody ProgrammingTestCaseRequest request
    ) {
        return ApiResponse.success(programmingJudgeService.createTestCase(questionId, request));
    }

    @PutMapping("/programming-test-cases/{caseId}")
    public ApiResponse<ProgrammingTestCaseResponse> updateTestCase(
        @PathVariable String caseId,
        @Valid @RequestBody ProgrammingTestCaseRequest request
    ) {
        return ApiResponse.success(programmingJudgeService.updateTestCase(caseId, request));
    }

    @DeleteMapping("/programming-test-cases/{caseId}")
    public ApiResponse<ProgrammingTestCaseResponse> deleteTestCase(@PathVariable String caseId) {
        return ApiResponse.success(programmingJudgeService.deleteTestCase(caseId));
    }

    @PostMapping("/exams/{examId}/answer-sheets/{answerSheetId}/programming-submissions")
    public ApiResponse<ProgrammingSubmissionResponse> createSubmission(
        @PathVariable String examId,
        @PathVariable String answerSheetId,
        @Valid @RequestBody ProgrammingSubmissionRequest request
    ) {
        return ApiResponse.success(programmingJudgeService.createSubmission(examId, answerSheetId, request));
    }

    @GetMapping("/programming-submissions/{submissionId}")
    public ApiResponse<ProgrammingSubmissionResponse> getSubmission(@PathVariable String submissionId) {
        return ApiResponse.success(programmingJudgeService.getSubmission(submissionId));
    }

    @GetMapping("/grading-tasks/{gradingTaskId}/programming-judge-results")
    public ApiResponse<PageResponse<ProgrammingSubmissionResponse>> listGradingTaskJudgeResults(
        @PathVariable String gradingTaskId,
        @RequestParam(defaultValue = "1") Integer page,
        @RequestParam(defaultValue = "20") Integer pageSize
    ) {
        return ApiResponse.success(programmingJudgeService.listGradingTaskJudgeResults(gradingTaskId, page, pageSize));
    }
}
