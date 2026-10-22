package com.mindmark.server.modules.paper.web;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.modules.paper.dto.AddPaperQuestionRequest;
import com.mindmark.server.modules.auth.service.AuthContextService;
import com.mindmark.server.modules.paper.dto.CreatePaperRequest;
import com.mindmark.server.modules.paper.dto.PaperComposeRequest;
import com.mindmark.server.modules.paper.dto.PaperComposePreviewResponse;
import com.mindmark.server.modules.paper.dto.PaperComposeStrategy;
import com.mindmark.server.modules.paper.dto.PaperComposeResultResponse;
import com.mindmark.server.modules.paper.dto.PaperQuestionResponse;
import com.mindmark.server.modules.paper.dto.PaperResponse;
import com.mindmark.server.modules.paper.dto.PaperAnswerKeyResponse;
import com.mindmark.server.modules.paper.dto.UpdatePaperStatusRequest;
import com.mindmark.server.modules.paper.service.PaperService;
import com.mindmark.server.modules.auth.domain.RoleCode;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/papers")
public class PaperController {

    private final PaperService paperService;
    private final AuthContextService authContextService;

    public PaperController(PaperService paperService, AuthContextService authContextService) {
        this.paperService = paperService;
        this.authContextService = authContextService;
    }

    @GetMapping
    public ApiResponse<PageResponse<PaperResponse>> listPapers(
        @RequestParam(required = false) String keyword,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.listPapers(keyword, page, pageSize));
    }

    @PostMapping
    public ApiResponse<PaperResponse> createPaper(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @Valid @RequestBody CreatePaperRequest request
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.createPaper(
            request,
            authContextService.getCurrentAuthUser(authorization, null, null)
        ));
    }

    @GetMapping("/{paperId}")
    public ApiResponse<PaperResponse> getPaper(@PathVariable String paperId) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.getPaper(paperId));
    }

    @PatchMapping("/{paperId}/status")
    public ApiResponse<PaperResponse> updatePaperStatus(
        @PathVariable String paperId,
        @Valid @RequestBody UpdatePaperStatusRequest request
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.updateStatus(paperId, request));
    }

    @GetMapping("/{paperId}/questions")
    public ApiResponse<PageResponse<PaperQuestionResponse>> listPaperQuestions(
        @PathVariable String paperId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.listPaperQuestions(paperId, page, pageSize));
    }

    @GetMapping("/{paperId}/answer-key")
    public ApiResponse<PaperAnswerKeyResponse> getAnswerKey(@PathVariable String paperId) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.getAnswerKey(paperId));
    }

    @PostMapping("/{paperId}/questions")
    public ApiResponse<PaperResponse> addQuestionToPaper(
        @PathVariable String paperId,
        @Valid @RequestBody AddPaperQuestionRequest request
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.addQuestion(paperId, request));
    }

    @PostMapping("/{paperId}/compose/random/preview")
    public ApiResponse<PaperComposePreviewResponse> previewComposeRandom(
        @PathVariable String paperId,
        @Valid @RequestBody PaperComposeRequest request
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.previewCompose(paperId, request, PaperComposeStrategy.RANDOM));
    }

    @PostMapping("/{paperId}/compose/agent/preview")
    public ApiResponse<PaperComposePreviewResponse> previewComposeAgent(
        @PathVariable String paperId,
        @Valid @RequestBody PaperComposeRequest request
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.previewCompose(paperId, request, PaperComposeStrategy.AGENT));
    }

    @PostMapping("/{paperId}/compose/random")
    public ApiResponse<PaperComposeResultResponse> composeRandom(
        @PathVariable String paperId,
        @Valid @RequestBody PaperComposeRequest request
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.composeRandom(paperId, request));
    }

    @PostMapping("/{paperId}/compose/agent")
    public ApiResponse<PaperComposeResultResponse> composeAgent(
        @PathVariable String paperId,
        @Valid @RequestBody PaperComposeRequest request
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.composeAgent(paperId, request));
    }

    @DeleteMapping("/{paperId}")
    public ApiResponse<Boolean> deletePaper(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String paperId
    ) {
        requirePaperStaffRole();
        paperService.deletePaper(
            paperId,
            authContextService.getCurrentAuthUser(authorization, null, null)
        );
        return ApiResponse.success(true);
    }

    @DeleteMapping("/{paperId}/questions/{questionId}")
    public ApiResponse<PaperResponse> removeQuestionFromPaper(
        @PathVariable String paperId,
        @PathVariable String questionId
    ) {
        requirePaperStaffRole();
        return ApiResponse.success(paperService.removeQuestion(paperId, questionId));
    }

    private void requirePaperStaffRole() {
        StpUtil.checkRoleOr(RoleCode.ADMIN.name(), RoleCode.TEACHER.name(), RoleCode.TA.name());
    }
}
