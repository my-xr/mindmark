package com.mindmark.server.modules.ai.service;

import com.mindmark.server.modules.ai.domain.AiQuestionGenerationTaskEntity;
import com.mindmark.server.modules.ai.domain.AiQuestionGenerationTaskStatus;
import com.mindmark.server.modules.ai.dto.AiQuestionGenerateRequest;
import com.mindmark.server.modules.ai.repository.AiQuestionGenerationTaskRepository;
import com.mindmark.server.modules.auth.service.AuthAuditService;
import com.mindmark.server.modules.question.dto.QuestionResponse;
import java.time.OffsetDateTime;
import java.util.List;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class AiQuestionGenerationTaskProcessor {

    private final AiQuestionGenerationTaskRepository taskRepository;
    private final LangGraphQuestionGenerationService generationService;
    private final TransactionTemplate transactionTemplate;
    private final AuthAuditService authAuditService;

    public AiQuestionGenerationTaskProcessor(
        AiQuestionGenerationTaskRepository taskRepository,
        LangGraphQuestionGenerationService generationService,
        TransactionTemplate transactionTemplate,
        AuthAuditService authAuditService
    ) {
        this.taskRepository = taskRepository;
        this.generationService = generationService;
        this.transactionTemplate = transactionTemplate;
        this.authAuditService = authAuditService;
    }

    @Async("aiQuestionTaskExecutor")
    public void process(String taskId) {
        TaskExecutionContext context = markRunning(taskId);
        if (context == null) {
            return;
        }

        try {
            List<QuestionResponse> savedQuestions = generationService.generateAndPersist(
                context.request(),
                context.teacherId(),
                context.teacherName()
            );
            markSucceeded(taskId, savedQuestions);
        } catch (RuntimeException exception) {
            markFailed(taskId, exception);
        }
    }

    private TaskExecutionContext markRunning(String taskId) {
        return transactionTemplate.execute(status -> {
            AiQuestionGenerationTaskEntity task = taskRepository.findById(taskId).orElse(null);
            if (task == null || task.getStatus() != AiQuestionGenerationTaskStatus.PENDING) {
                return null;
            }
            OffsetDateTime now = OffsetDateTime.now();
            task.setStatus(AiQuestionGenerationTaskStatus.RUNNING);
            task.setStartedAt(now);
            task.setUpdatedAt(now);
            taskRepository.save(task);
            return new TaskExecutionContext(
                new AiQuestionGenerateRequest(
                    task.getCourseId(),
                    task.getProvider(),
                    task.getPrompt(),
                    task.getQuestionType(),
                    task.getDifficulty(),
                    task.getCount(),
                    task.getKnowledgePoint(),
                    task.getRequirement()
                ),
                task.getTeacherId(),
                task.getTeacherName()
            );
        });
    }

    private void markSucceeded(String taskId, List<QuestionResponse> savedQuestions) {
        transactionTemplate.executeWithoutResult(status -> {
            AiQuestionGenerationTaskEntity task = taskRepository.findById(taskId).orElse(null);
            if (task == null) {
                return;
            }
            OffsetDateTime now = OffsetDateTime.now();
            List<String> ids = savedQuestions.stream().map(QuestionResponse::id).toList();
            task.setStatus(AiQuestionGenerationTaskStatus.SUCCEEDED);
            task.setGeneratedQuestionIds(String.join(",", ids));
            task.setGeneratedCount(savedQuestions.size());
            task.setErrorMessage(null);
            task.setFinishedAt(now);
            task.setUpdatedAt(now);
            taskRepository.save(task);
            authAuditService.record(task.getTeacherId(), "AI_QUESTION_GENERATION_TASK_SUCCEEDED", task.getId(), "SUCCESS", "generatedCount=" + savedQuestions.size());
        });
    }

    private void markFailed(String taskId, RuntimeException exception) {
        transactionTemplate.executeWithoutResult(status -> {
            AiQuestionGenerationTaskEntity task = taskRepository.findById(taskId).orElse(null);
            if (task == null) {
                return;
            }
            OffsetDateTime now = OffsetDateTime.now();
            task.setStatus(AiQuestionGenerationTaskStatus.FAILED);
            task.setErrorMessage(summarize(exception.getMessage()));
            task.setFinishedAt(now);
            task.setUpdatedAt(now);
            taskRepository.save(task);
            authAuditService.record(task.getTeacherId(), "AI_QUESTION_GENERATION_TASK_FAILED", task.getId(), "FAILED", task.getErrorMessage());
        });
    }

    private String summarize(String value) {
        if (value == null || value.isBlank()) {
            return "AI question generation failed without detailed message";
        }
        String compact = value.replaceAll("\\s+", " ").trim();
        return compact.length() > 500 ? compact.substring(0, 500) : compact;
    }

    private record TaskExecutionContext(
        AiQuestionGenerateRequest request,
        String teacherId,
        String teacherName
    ) {}
}