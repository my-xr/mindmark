package com.mindmark.server.modules.review.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import com.mindmark.server.modules.exam.repository.ExamRepository;
import com.mindmark.server.modules.review.domain.LectureDraftTaskEntity;
import com.mindmark.server.modules.review.domain.LectureDraftTaskStatus;
import com.mindmark.server.modules.review.dto.AiLectureDraftResponse;
import com.mindmark.server.modules.review.dto.LectureDraftTaskResponse;
import com.mindmark.server.modules.review.repository.LectureDraftTaskRepository;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class LectureDraftTaskService {

    private final LectureDraftTaskRepository taskRepository;
    private final ExamRepository examRepository;
    private final ClassScopeService classScopeService;
    private final LectureDraftTaskProcessor taskProcessor;
    private final ReviewService reviewService;

    public LectureDraftTaskService(
        LectureDraftTaskRepository taskRepository,
        ExamRepository examRepository,
        ClassScopeService classScopeService,
        LectureDraftTaskProcessor taskProcessor,
        ReviewService reviewService
    ) {
        this.taskRepository = taskRepository;
        this.examRepository = examRepository;
        this.classScopeService = classScopeService;
        this.taskProcessor = taskProcessor;
        this.reviewService = reviewService;
    }

    @Transactional
    public LectureDraftTaskResponse createTask(String examId) {
        classScopeService.requireStaffRole();
        ExamEntity exam = examRepository.findWithDetailsById(examId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Exam not found"));
        classScopeService.requireCanAccessExam(exam);
        taskRepository.findFirstByExamIdAndStatusInOrderByRequestedAtDesc(
            examId,
            List.of(LectureDraftTaskStatus.PENDING, LectureDraftTaskStatus.RUNNING)
        ).ifPresent(existing -> {
            throw new BusinessException(ErrorCode.CONFLICT, "Lecture draft generation task is already running for this exam");
        });
        AuthUserEntity user = classScopeService.currentUser();
        OffsetDateTime now = OffsetDateTime.now();
        LectureDraftTaskEntity task = new LectureDraftTaskEntity();
        task.setId("lecture-task-" + UUID.randomUUID());
        task.setExam(exam);
        task.setStatus(LectureDraftTaskStatus.PENDING);
        task.setRequestedBy(user.getId());
        task.setRequestedAt(now);
        task.setUpdatedAt(now);
        LectureDraftTaskEntity saved = taskRepository.save(task);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                taskProcessor.process(saved.getId());
            }
        });
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public LectureDraftTaskResponse getTask(String taskId) {
        classScopeService.requireStaffRole();
        LectureDraftTaskEntity task = taskRepository.findWithExamById(taskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Lecture draft task not found"));
        classScopeService.requireCanAccessExam(task.getExam());
        return toResponse(task);
    }

    LectureDraftTaskResponse toResponse(LectureDraftTaskEntity task) {
        AiLectureDraftResponse draft = task.getDraftId() == null ? null : reviewService.getLectureDraft(task.getDraftId());
        return new LectureDraftTaskResponse(
            task.getId(),
            task.getExam().getId(),
            task.getStatus(),
            task.getProvider(),
            task.getDraftId(),
            draft,
            task.getErrorMessage(),
            task.getRequestedAt(),
            task.getStartedAt(),
            task.getFinishedAt(),
            task.getUpdatedAt()
        );
    }
}
