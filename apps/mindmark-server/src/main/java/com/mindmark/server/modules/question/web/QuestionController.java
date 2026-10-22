package com.mindmark.server.modules.question.web;

import cn.dev33.satoken.stp.StpUtil;
import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.ai.dto.QuestionCreateRequest;
import com.mindmark.server.modules.ai.dto.QuestionImportRequest;
import com.mindmark.server.modules.ai.dto.QuestionImportResponse;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.service.AuthContextService;
import com.mindmark.server.modules.question.domain.Difficulty;
import com.mindmark.server.modules.question.domain.QuestionSource;
import com.mindmark.server.modules.question.domain.QuestionStatus;
import com.mindmark.server.modules.question.domain.QuestionType;
import com.mindmark.server.modules.question.dto.MarkdownQuestionImportRequest;
import com.mindmark.server.modules.question.dto.MarkdownQuestionImportResponse;
import com.mindmark.server.modules.question.dto.QuestionDeleteResponse;
import com.mindmark.server.modules.question.dto.QuestionQuery;
import com.mindmark.server.modules.question.dto.QuestionResponse;
import com.mindmark.server.modules.question.dto.QuestionReviewRequest;
import com.mindmark.server.modules.question.service.QuestionService;
import com.mindmark.server.modules.question.service.QuestionWriteService;
import java.util.Locale;
import java.util.Set;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/questions")
public class QuestionController {

    private static final Set<RoleCode> QUESTION_WRITE_ROLES = Set.of(RoleCode.ADMIN, RoleCode.TEACHER, RoleCode.TA);

    private final QuestionService questionService;
    private final QuestionWriteService questionWriteService;
    private final AuthContextService authContextService;

    public QuestionController(
        QuestionService questionService,
        QuestionWriteService questionWriteService,
        AuthContextService authContextService
    ) {
        this.questionService = questionService;
        this.questionWriteService = questionWriteService;
        this.authContextService = authContextService;
    }

    @GetMapping
    public ApiResponse<PageResponse<QuestionResponse>> listQuestions(
        @RequestParam(required = false) String keyword,
        @RequestParam(required = false) String type,
        @RequestParam(required = false) String difficulty,
        @RequestParam(required = false) String status,
        @RequestParam(required = false) String source,
        @RequestParam(required = false) String courseId,
        @RequestParam(required = false) String chapterId,
        @RequestParam(required = false) Integer chapterFromNo,
        @RequestParam(required = false) Integer chapterToNo,
        @RequestParam(required = false) String knowledgePoint,
        @RequestParam(required = false) String excludePaperId,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "20") int pageSize
    ) {
        requireQuestionReadRole();
        QuestionQuery query = new QuestionQuery(
            keyword,
            parseEnum(type, QuestionType.class),
            parseEnum(difficulty, Difficulty.class),
            parseEnum(status, QuestionStatus.class),
            parseEnum(source, QuestionSource.class),
            normalizeId(courseId),
            normalizeId(chapterId),
            chapterFromNo,
            chapterToNo,
            knowledgePoint,
            normalizeId(excludePaperId),
            page,
            pageSize
        );

        return ApiResponse.success(questionService.listQuestions(query));
    }

    @GetMapping("/{questionId}")
    public ApiResponse<QuestionResponse> getQuestion(@PathVariable String questionId) {
        requireQuestionReadRole();
        return ApiResponse.success(questionService.getQuestion(questionId));
    }

    @PostMapping
    public ApiResponse<QuestionResponse> createQuestion(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody QuestionCreateRequest request
    ) {
        AuthUserEntity teacher = requireQuestionWriteRole(authorization);
        return ApiResponse.success(questionWriteService.createManualQuestion(request, teacher.getName()));
    }

    @DeleteMapping("/{questionId}")
    public ApiResponse<QuestionDeleteResponse> deleteQuestion(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String questionId
    ) {
        AuthUserEntity teacher = requireQuestionWriteRole(authorization);
        return ApiResponse.success(questionWriteService.deleteQuestion(questionId, teacher));
    }

    @PutMapping("/{questionId}")
    public ApiResponse<QuestionResponse> updateQuestion(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String questionId,
        @RequestBody QuestionCreateRequest request
    ) {
        AuthUserEntity teacher = requireQuestionWriteRole(authorization);
        return ApiResponse.success(questionWriteService.updateQuestion(questionId, request, teacher));
    }

    @PostMapping("/import")
    public ApiResponse<QuestionImportResponse> importQuestions(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody QuestionImportRequest request
    ) {
        AuthUserEntity teacher = requireQuestionWriteRole(authorization);
        return ApiResponse.success(questionWriteService.importQuestions(request, teacher.getName()));
    }

    @PostMapping("/import/markdown")
    public ApiResponse<MarkdownQuestionImportResponse> importMarkdownQuestions(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody MarkdownQuestionImportRequest request
    ) {
        AuthUserEntity teacher = requireQuestionWriteRole(authorization);
        return ApiResponse.success(questionWriteService.importMarkdownQuestions(request, teacher));
    }

    @PostMapping("/{questionId}/review")
    public ApiResponse<QuestionResponse> reviewAiQuestion(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String questionId,
        @RequestBody QuestionReviewRequest request
    ) {
        AuthUserEntity reviewer = requireQuestionWriteRole(authorization);
        return ApiResponse.success(questionWriteService.reviewAiQuestion(questionId, request, reviewer));
    }

    private AuthUserEntity requireQuestionWriteRole(String authorization) {
        AuthUserEntity user = authContextService.getCurrentAuthUser(authorization, null, null);
        if (user.getRoles().stream().noneMatch(QUESTION_WRITE_ROLES::contains)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only teachers, TAs or admins can write questions");
        }
        return user;
    }

    private void requireQuestionReadRole() {
        StpUtil.checkRoleOr(RoleCode.ADMIN.name(), RoleCode.TEACHER.name(), RoleCode.TA.name());
    }

    private String normalizeId(String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        return value.trim();
    }

    private <T extends Enum<T>> T parseEnum(String value, Class<T> enumType) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return Enum.valueOf(enumType, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Invalid enum value: " + value);
        }
    }
}

