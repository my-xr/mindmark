package com.mindmark.server.modules.ai.web;

import com.mindmark.server.common.api.ApiResponse;
import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.ai.dto.AiProviderConnectionTestRequest;
import com.mindmark.server.modules.ai.dto.AiProviderConnectionTestResponse;
import com.mindmark.server.modules.ai.dto.AiProviderRuntimeConfig;
import com.mindmark.server.modules.ai.dto.AiProviderSettingRequest;
import com.mindmark.server.modules.ai.dto.AiProviderSettingResponse;
import com.mindmark.server.modules.ai.dto.AiQuestionGenerateRequest;
import com.mindmark.server.modules.ai.dto.AiQuestionGenerationTaskResponse;
import com.mindmark.server.modules.ai.service.AiChatQuestionGenerationClient;
import com.mindmark.server.modules.ai.service.AiProviderSettingService;
import com.mindmark.server.modules.ai.service.AiQuestionGenerationTaskService;
import com.mindmark.server.modules.ai.service.LangGraphQuestionGenerationService;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.RoleCode;
import com.mindmark.server.modules.auth.service.AuthContextService;
import com.mindmark.server.modules.question.dto.QuestionResponse;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;
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
@RequestMapping("/api/v1/ai")
public class AiQuestionController {

    private static final Set<RoleCode> AI_ALLOWED_ROLES = Set.of(RoleCode.ADMIN, RoleCode.TEACHER, RoleCode.TA);

    private final AuthContextService authContextService;
    private final AiProviderSettingService providerSettingService;
    private final AiChatQuestionGenerationClient questionGenerationClient;
    private final LangGraphQuestionGenerationService generationService;
    private final AiQuestionGenerationTaskService generationTaskService;

    public AiQuestionController(
        AuthContextService authContextService,
        AiProviderSettingService providerSettingService,
        AiChatQuestionGenerationClient questionGenerationClient,
        LangGraphQuestionGenerationService generationService,
        AiQuestionGenerationTaskService generationTaskService
    ) {
        this.authContextService = authContextService;
        this.providerSettingService = providerSettingService;
        this.questionGenerationClient = questionGenerationClient;
        this.generationService = generationService;
        this.generationTaskService = generationTaskService;
    }

    @GetMapping("/provider-settings")
    public ApiResponse<AiProviderSettingResponse> getProviderSetting(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(value = "provider", required = false) String provider
    ) {
        AuthUserEntity teacher = requireAiRole(authorization);
        return ApiResponse.success(providerSettingService.getSetting(teacher.getId(), provider));
    }

    @PutMapping("/provider-settings")
    public ApiResponse<AiProviderSettingResponse> saveProviderSetting(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody AiProviderSettingRequest request
    ) {
        AuthUserEntity teacher = requireAiRole(authorization);
        return ApiResponse.success(providerSettingService.saveSetting(teacher.getId(), request));
    }

    @PostMapping("/provider-settings/test")
    public ApiResponse<AiProviderConnectionTestResponse> testProviderSetting(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody(required = false) AiProviderConnectionTestRequest request
    ) {
        AuthUserEntity teacher = requireAiRole(authorization);
        long startedAt = System.nanoTime();
        try {
            AiProviderRuntimeConfig config = providerSettingService.buildAdHocRuntimeConfig(teacher.getId(), request);
            String preview = questionGenerationClient.testConnection(config);
            return ApiResponse.success(new AiProviderConnectionTestResponse(
                true,
                config.provider(),
                providerSettingService.providerLabel(config.provider()),
                config.baseUrl(),
                config.model(),
                elapsedMillis(startedAt),
                "连接测试成功",
                preview,
                OffsetDateTime.now()
            ));
        } catch (BusinessException exception) {
            String provider = requestedProvider(request);
            return ApiResponse.success(new AiProviderConnectionTestResponse(
                false,
                provider,
                providerSettingService.providerLabel(provider),
                request == null ? null : request.baseUrl(),
                request == null ? null : request.model(),
                elapsedMillis(startedAt),
                exception.getMessage(),
                null,
                OffsetDateTime.now()
            ));
        }
    }

    // Legacy aliases kept for backward compatibility with older frontend builds.
    @GetMapping("/provider-settings/kimi")
    public ApiResponse<AiProviderSettingResponse> getLegacyKimiSetting(
        @RequestHeader(value = "Authorization", required = false) String authorization
    ) {
        return getProviderSetting(authorization, null);
    }

    @PutMapping("/provider-settings/kimi")
    public ApiResponse<AiProviderSettingResponse> saveLegacyKimiSetting(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody AiProviderSettingRequest request
    ) {
        return saveProviderSetting(authorization, request);
    }

    @GetMapping("/questions/generation-tasks")
    public ApiResponse<PageResponse<AiQuestionGenerationTaskResponse>> listAiQuestionGenerationTasks(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestParam(defaultValue = "1") int page,
        @RequestParam(defaultValue = "10") int pageSize
    ) {
        AuthUserEntity teacher = requireAiRole(authorization);
        return ApiResponse.success(generationTaskService.listTasks(teacher, page, pageSize));
    }

    @PostMapping("/questions/generation-tasks")
    public ApiResponse<AiQuestionGenerationTaskResponse> createAiQuestionGenerationTask(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody AiQuestionGenerateRequest request
    ) {
        AuthUserEntity teacher = requireAiRole(authorization);
        return ApiResponse.success(generationTaskService.createTask(request, teacher));
    }

    @GetMapping("/questions/generation-tasks/{taskId}")
    public ApiResponse<AiQuestionGenerationTaskResponse> getAiQuestionGenerationTask(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @PathVariable String taskId
    ) {
        AuthUserEntity teacher = requireAiRole(authorization);
        return ApiResponse.success(generationTaskService.getTask(taskId, teacher));
    }

    @PostMapping("/questions/generate")
    public ApiResponse<List<QuestionResponse>> generateAiQuestions(
        @RequestHeader(value = "Authorization", required = false) String authorization,
        @RequestBody AiQuestionGenerateRequest request
    ) {
        AuthUserEntity teacher = requireAiRole(authorization);
        return ApiResponse.success(generationService.generateAndPersist(request, teacher.getId(), teacher.getName()));
    }

    private AuthUserEntity requireAiRole(String authorization) {
        AuthUserEntity user = authContextService.getCurrentAuthUser(authorization, null, null);
        if (user.getRoles().stream().noneMatch(AI_ALLOWED_ROLES::contains)) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Only teachers, TAs or admins can use AI question generation");
        }
        return user;
    }

    private Long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }

    private String requestedProvider(AiProviderConnectionTestRequest request) {
        String provider = request == null ? null : request.provider();
        if (provider == null || provider.isBlank()) {
            return providerSettingService.defaultProvider();
        }
        String normalized = provider.trim().toUpperCase();
        return "KIMI".equals(normalized) ? AiProviderSettingService.OPENAI_PROVIDER : normalized;
    }
}