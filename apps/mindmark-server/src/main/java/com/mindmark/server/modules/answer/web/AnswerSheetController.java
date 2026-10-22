package com.mindmark.server.modules.answer.web;

import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.modules.answer.dto.AnswerSheetResponse;
import com.mindmark.server.modules.answer.dto.SaveAnswerDraftRequest;
import com.mindmark.server.modules.answer.service.AnswerSheetService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/answer-sheets")
public class AnswerSheetController {

    private final AnswerSheetService answerSheetService;

    public AnswerSheetController(AnswerSheetService answerSheetService) {
        this.answerSheetService = answerSheetService;
    }

    @GetMapping("/{answerSheetId}")
    public ApiResponse<AnswerSheetResponse> getAnswerSheet(@PathVariable String answerSheetId) {
        return ApiResponse.success(answerSheetService.getAnswerSheet(answerSheetId));
    }

    @GetMapping("/by-exam/{examId}")
    public ApiResponse<AnswerSheetResponse> getAnswerSheetByExamAndStudent(@PathVariable String examId) {
        return ApiResponse.success(answerSheetService.getAnswerSheetByExamAndStudent(examId));
    }

    @PutMapping("/{answerSheetId}/draft")
    public ApiResponse<AnswerSheetResponse> saveDraft(
        @PathVariable String answerSheetId,
        @Valid @RequestBody SaveAnswerDraftRequest request
    ) {
        return ApiResponse.success(answerSheetService.saveDraft(answerSheetId, request));
    }

    @PostMapping("/{answerSheetId}/submit")
    public ApiResponse<AnswerSheetResponse> submit(@PathVariable String answerSheetId) {
        return ApiResponse.success(answerSheetService.submit(answerSheetId));
    }
}

