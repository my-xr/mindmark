package com.mindmark.server.modules.ai.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.api.PageResponse;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.academic.repository.CourseRepository;
import com.mindmark.server.modules.ai.domain.AiQuestionGenerationTaskEntity;
import com.mindmark.server.modules.ai.domain.AiQuestionGenerationTaskStatus;
import com.mindmark.server.modules.ai.dto.AiQuestionGenerateRequest;
import com.mindmark.server.modules.ai.dto.AiQuestionGenerationTaskResponse;
import com.mindmark.server.modules.ai.repository.AiQuestionGenerationTaskRepository;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.service.AuthAuditService;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class AiQuestionGenerationTaskService {

    private final AiQuestionGenerationTaskRepository taskRepository;
    private final CourseRepository courseRepository;
    private final AiProviderSettingService providerSettingService;
    private final AiQuestionGenerationTaskProcessor taskProcessor;
    private final AuthAuditService authAuditService;
    private final ClassScopeService classScopeService;

    public AiQuestionGenerationTaskService(
        AiQuestionGenerationTaskRepository taskRepository,
        CourseRepository courseRepository,
        AiProviderSettingService providerSettingService,
        AiQuestionGenerationTaskProcessor taskProcessor,
        AuthAuditService authAuditService,
        ClassScopeService classScopeService
    ) {
        this.taskRepository = taskRepository;
        this.courseRepository = courseRepository;
        this.providerSettingService = providerSettingService;
        this.taskProcessor = taskProcessor;
        this.authAuditService = authAuditService;
        this.classScopeService = classScopeService;
    }

    @Transactional
    public AiQuestionGenerationTaskResponse createTask(AiQuestionGenerateRequest request, AuthUserEntity teacher) {
        validate(request);
        classScopeService.requireUserCanAccessCourse(teacher.getId(), request.courseId());
        String provider = providerSettingService.normalizeProviderOrDefault(request.provider());
        providerSettingService.resolveRuntimeConfig(teacher.getId(), provider);

        taskRepository.findFirstByTeacherIdAndStatusInOrderByRequestedAtDesc(
            teacher.getId(),
            List.of(AiQuestionGenerationTaskStatus.PENDING, AiQuestionGenerationTaskStatus.RUNNING)
        ).ifPresent(existing -> {
            throw new BusinessException(
                ErrorCode.CONFLICT,
                "AI question generation task is already running. Please wait for it to finish before submitting again."
            );
        });

        OffsetDateTime now = OffsetDateTime.now();
        AiQuestionGenerationTaskEntity task = new AiQuestionGenerationTaskEntity();
        task.setId("ai-question-task-" + UUID.randomUUID());
        task.setTeacherId(teacher.getId());
        task.setTeacherName(teacher.getName());
        task.setStatus(AiQuestionGenerationTaskStatus.PENDING);
        task.setCourseId(request.courseId().trim());
        task.setProvider(provider);
        task.setPrompt(request.prompt().trim());
        task.setQuestionType(request.questionType());
        task.setDifficulty(request.difficulty());
        task.setCount(normalizeCount(request.count()));
        task.setKnowledgePoint(trimToNull(request.knowledgePoint()));
        task.setRequirement(trimToNull(request.requirement()));
        task.setGeneratedCount(0);
        task.setGeneratedQuestionIds("");
        task.setRequestedAt(now);
        task.setUpdatedAt(now);

        AiQuestionGenerationTaskEntity saved = taskRepository.save(task);
        authAuditService.record(teacher.getId(), "AI_QUESTION_GENERATION_TASK_SUBMIT", saved.getId(), "SUCCESS", "provider=" + provider + ", courseId=" + saved.getCourseId() + ", count=" + saved.getCount());
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                taskProcessor.process(saved.getId());
            }
        });
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public AiQuestionGenerationTaskResponse getTask(String taskId, AuthUserEntity teacher) {
        AiQuestionGenerationTaskEntity task = taskRepository.findById(taskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "AI question generation task not found"));
        if (!teacher.getId().equals(task.getTeacherId())) {
            throw new BusinessException(ErrorCode.FORBIDDEN, "Cannot access another teacher's AI question generation task");
        }
        return toResponse(task);
    }
    @Transactional(readOnly = true)
    public PageResponse<AiQuestionGenerationTaskResponse> listTasks(AuthUserEntity teacher, int page, int pageSize) {
        int safePage = Math.max(page, 1);
        int safePageSize = Math.min(Math.max(pageSize, 1), 50);
        var taskPage = taskRepository.findByTeacherIdOrderByRequestedAtDesc(
            teacher.getId(),
            PageRequest.of(safePage - 1, safePageSize, Sort.by(Sort.Direction.DESC, "requestedAt"))
        );
        return PageResponse.fromPage(taskPage.map(this::toResponse));
    }

    AiQuestionGenerationTaskResponse toResponse(AiQuestionGenerationTaskEntity task) {
        String courseName = courseRepository.findById(task.getCourseId())
            .map(course -> course.getName())
            .orElse(null);
        return new AiQuestionGenerationTaskResponse(
            task.getId(),
            task.getStatus(),
            task.getProvider(),
            task.getCourseId(),
            courseName,
            task.getPrompt(),
            task.getQuestionType(),
            task.getDifficulty(),
            task.getCount(),
            task.getKnowledgePoint(),
            task.getRequirement(),
            task.getTeacherName(),
            task.getGeneratedCount(),
            parseIds(task.getGeneratedQuestionIds()),
            task.getErrorMessage(),
            task.getRequestedAt(),
            task.getStartedAt(),
            task.getFinishedAt(),
            task.getUpdatedAt()
        );
    }

    private void validate(AiQuestionGenerateRequest request) {
        if (request == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "AI question generation request is required");
        }
        if (!hasText(request.courseId())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "courseId is required");
        }
        if (!courseRepository.existsById(request.courseId().trim())) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "Course not found");
        }
        if (!hasText(request.prompt())) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "prompt is required");
        }
        if (request.questionType() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "questionType is required");
        }
        if (request.difficulty() == null) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "difficulty is required");
        }
        normalizeCount(request.count());
    }

    private int normalizeCount(Integer count) {
        int normalized = count == null ? 1 : count;
        if (normalized < 1 || normalized > 5) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "count must be between 1 and 5");
        }
        return normalized;
    }

    private boolean hasText(String value) {
        return value != null && !value.isBlank();
    }

    private String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private List<String> parseIds(String value) {
        if (value == null || value.isBlank()) {
            return List.of();
        }
        return Arrays.stream(value.split(","))
            .map(String::trim)
            .filter(item -> !item.isEmpty())
            .toList();
    }
}
