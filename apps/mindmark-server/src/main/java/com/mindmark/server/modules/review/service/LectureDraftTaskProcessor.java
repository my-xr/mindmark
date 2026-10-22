package com.mindmark.server.modules.review.service;

import com.mindmark.server.modules.review.domain.LectureDraftTaskEntity;
import com.mindmark.server.modules.review.domain.LectureDraftTaskStatus;
import com.mindmark.server.modules.review.dto.AiLectureDraftResponse;
import com.mindmark.server.modules.review.repository.LectureDraftTaskRepository;
import java.time.OffsetDateTime;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

@Service
public class LectureDraftTaskProcessor {

    private final LectureDraftTaskRepository taskRepository;
    private final ReviewService reviewService;
    private final TransactionTemplate transactionTemplate;

    public LectureDraftTaskProcessor(
        LectureDraftTaskRepository taskRepository,
        ReviewService reviewService,
        TransactionTemplate transactionTemplate
    ) {
        this.taskRepository = taskRepository;
        this.reviewService = reviewService;
        this.transactionTemplate = transactionTemplate;
    }

    @Async("lectureDraftTaskExecutor")
    public void process(String taskId) {
        TaskExecutionContext context = markRunning(taskId);
        if (context == null) {
            return;
        }

        try {
            AiLectureDraftResponse draft = reviewService.generateLectureDraftForTask(context.examId(), context.requestedBy());
            markSucceeded(taskId, draft);
        } catch (RuntimeException exception) {
            markFailed(taskId, exception);
        }
    }

    private TaskExecutionContext markRunning(String taskId) {
        return transactionTemplate.execute(status -> {
            LectureDraftTaskEntity task = taskRepository.findWithExamById(taskId).orElse(null);
            if (task == null || task.getStatus() != LectureDraftTaskStatus.PENDING) {
                return null;
            }
            OffsetDateTime now = OffsetDateTime.now();
            task.setStatus(LectureDraftTaskStatus.RUNNING);
            task.setStartedAt(now);
            task.setUpdatedAt(now);
            taskRepository.save(task);
            return new TaskExecutionContext(task.getExam().getId(), task.getRequestedBy());
        });
    }

    private void markSucceeded(String taskId, AiLectureDraftResponse draft) {
        transactionTemplate.executeWithoutResult(status -> {
            LectureDraftTaskEntity task = taskRepository.findById(taskId).orElse(null);
            if (task == null) {
                return;
            }
            OffsetDateTime now = OffsetDateTime.now();
            task.setStatus(LectureDraftTaskStatus.SUCCEEDED);
            task.setProvider(draft.provider());
            task.setDraftId(draft.id());
            task.setFinishedAt(now);
            task.setUpdatedAt(now);
            taskRepository.save(task);
        });
    }

    private void markFailed(String taskId, RuntimeException exception) {
        transactionTemplate.executeWithoutResult(status -> {
            LectureDraftTaskEntity task = taskRepository.findById(taskId).orElse(null);
            if (task == null) {
                return;
            }
            OffsetDateTime now = OffsetDateTime.now();
            task.setStatus(LectureDraftTaskStatus.FAILED);
            task.setErrorMessage(exception.getMessage());
            task.setFinishedAt(now);
            task.setUpdatedAt(now);
            taskRepository.save(task);
        });
    }

    private record TaskExecutionContext(String examId, String requestedBy) {}
}



