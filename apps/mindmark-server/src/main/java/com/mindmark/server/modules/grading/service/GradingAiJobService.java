package com.mindmark.server.modules.grading.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.domain.AuthUserEntity;
import com.mindmark.server.modules.auth.domain.UserStatus;
import com.mindmark.server.modules.auth.repository.AuthUserRepository;
import com.mindmark.server.modules.auth.service.AuthRolePolicy;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.grading.domain.GradingAiJobEntity;
import com.mindmark.server.modules.grading.domain.GradingAiJobStatus;
import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import com.mindmark.server.modules.grading.dto.GradingAiJobResponse;
import com.mindmark.server.modules.grading.repository.GradingAiJobRepository;
import com.mindmark.server.modules.grading.repository.GradingTaskRepository;
import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

@Service
public class GradingAiJobService {

    private static final Set<GradingAiJobStatus> ACTIVE_STATUSES = Set.of(
        GradingAiJobStatus.PENDING,
        GradingAiJobStatus.RUNNING
    );

    private final GradingAiJobRepository jobRepository;
    private final GradingTaskRepository gradingTaskRepository;
    private final AuthUserRepository authUserRepository;
    private final GradingAiJobProcessor processor;
    private final GradingAiJobMapper mapper;
    private final ClassScopeService classScopeService;
    private final boolean asyncEnabled;
    private final long jobTimeoutMs;

    public GradingAiJobService(
        GradingAiJobRepository jobRepository,
        GradingTaskRepository gradingTaskRepository,
        AuthUserRepository authUserRepository,
        GradingAiJobProcessor processor,
        GradingAiJobMapper mapper,
        ClassScopeService classScopeService,
        @Value("${mindmark.ai.grading.async-enabled:true}") boolean asyncEnabled,
        @Value("${mindmark.ai.grading.job-timeout-ms:60000}") long jobTimeoutMs
    ) {
        this.jobRepository = jobRepository;
        this.gradingTaskRepository = gradingTaskRepository;
        this.authUserRepository = authUserRepository;
        this.processor = processor;
        this.mapper = mapper;
        this.classScopeService = classScopeService;
        this.asyncEnabled = asyncEnabled;
        this.jobTimeoutMs = jobTimeoutMs;
    }

    @Transactional
    public GradingAiJobResponse enqueueIfNeeded(String gradingTaskId) {
        classScopeService.requireStaffRole();
        return enqueue(gradingTaskId, true);
    }

    @Transactional
    public GradingAiJobResponse enqueueSystemIfNeeded(String gradingTaskId) {
        return enqueue(gradingTaskId, false);
    }

    private GradingAiJobResponse enqueue(String gradingTaskId, boolean checkScope) {
        if (!asyncEnabled) {
            return null;
        }
        GradingTaskEntity task = gradingTaskRepository.findWithItemsById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
        if (checkScope) {
            classScopeService.requireCanAccessExam(task.getExam());
        }
        if (task.getStatus() == GradingTaskStatus.REVIEWED || !hasSubjectiveItem(task)) {
            return latestJobInternal(gradingTaskId, checkScope);
        }
        if (jobRepository.existsByGradingTaskIdAndStatusIn(gradingTaskId, ACTIVE_STATUSES)) {
            return latestJobInternal(gradingTaskId, checkScope);
        }

        OffsetDateTime now = OffsetDateTime.now();
        GradingAiJobEntity job = new GradingAiJobEntity();
        job.setId("GAJ-" + UUID.randomUUID());
        job.setGradingTask(task);
        job.setStatus(GradingAiJobStatus.PENDING);
        // AI grading must use the exam creator's stable account ID so that a
        // teacher's personal provider setting cannot be confused with a
        // mutable display name from legacy exam rows.
        job.setTeacherId(resolveTeacherId(task));
        job.setSubjectiveItemCount(subjectiveItemCount(task));
        job.setProcessedItemCount(0);
        job.setRefreshedItemCount(0);
        job.setPromptVersion(SubjectiveGradingPolicy.AI_GRADING_PROMPT_VERSION);
        job.setRequestId(job.getId());
        job.setResultSummary("AI 主观题评分任务已进入队列。");
        job.setCreatedAt(now);
        job.setUpdatedAt(now);
        job = jobRepository.save(job);
        dispatchAfterCommit(job.getId());
        return mapper.toResponse(job);
    }

    @Transactional
    public GradingAiJobResponse latestJob(String gradingTaskId) {
        classScopeService.requireStaffRole();
        return latestJobInternal(gradingTaskId, true);
    }

    private GradingAiJobResponse latestJobInternal(String gradingTaskId, boolean checkScope) {
        GradingTaskEntity task = gradingTaskRepository.findWithScopeById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
        if (checkScope) {
            classScopeService.requireCanAccessExam(task.getExam());
        }
        return jobRepository.findTopByGradingTaskIdOrderByCreatedAtDesc(gradingTaskId)
            .map(this::expireStalledRunningJobIfNeeded)
            .map(mapper::toResponse)
            .orElse(null);
    }

    private GradingAiJobEntity expireStalledRunningJobIfNeeded(GradingAiJobEntity job) {
        if (job.getStatus() != GradingAiJobStatus.RUNNING || job.getStartedAt() == null) {
            return job;
        }
        OffsetDateTime deadline = OffsetDateTime.now().minus(Duration.ofMillis(Math.max(1000L, jobTimeoutMs)));
        if (!job.getStartedAt().isBefore(deadline)) {
            return job;
        }
        OffsetDateTime now = OffsetDateTime.now();
        job.setStatus(GradingAiJobStatus.SKIPPED);
        job.setErrorMessage("AI 评分任务超过最大执行时间，已停止等待并保留系统基线分。");
        job.setResultSummary(job.getErrorMessage());
        job.setDurationMs(Math.max(0L, Duration.between(job.getStartedAt(), now).toMillis()));
        job.setFinishedAt(now);
        job.setUpdatedAt(now);
        return jobRepository.save(job);
    }

    private void dispatchAfterCommit(String jobId) {
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    processor.process(jobId);
                }
            });
            return;
        }
        processor.process(jobId);
    }

    private boolean hasSubjectiveItem(GradingTaskEntity task) {
        return task.getItems().stream().anyMatch(item -> !Boolean.TRUE.equals(item.getObjective()));
    }

    private int subjectiveItemCount(GradingTaskEntity task) {
        return (int) task.getItems().stream().filter(item -> !Boolean.TRUE.equals(item.getObjective())).count();
    }

    private String resolveTeacherId(GradingTaskEntity task) {
        String stableId = normalize(task.getExam().getCreatedByUserId());
        if (stableId != null) {
            return requireActiveStaff(stableId).getId();
        }

        String legacyOwner = normalize(task.getExam().getCreatedBy());
        if (legacyOwner == null) {
            throw new BusinessException(
                ErrorCode.CONFLICT,
                "考试创建人信息缺失，无法安全解析教师 AI 配置"
            );
        }

        AuthUserEntity resolved = authUserRepository.findById(legacyOwner)
            .or(() -> authUserRepository.findByUsernameIgnoreCase(legacyOwner))
            .or(() -> authUserRepository.findByEmailIgnoreCase(legacyOwner))
            .or(() -> authUserRepository.findFirstByNameIgnoreCase(legacyOwner))
            .map(this::requireActiveStaff)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.CONFLICT,
                "历史考试创建人无法解析，无法安全使用教师 AI 配置"
            ));

        return resolved.getId();
    }

    private AuthUserEntity requireActiveStaff(AuthUserEntity user) {
        if (user == null
            || user.getStatus() != UserStatus.ACTIVE
            || !AuthRolePolicy.isValid(user)
            || !AuthRolePolicy.isStaff(user)) {
            throw new BusinessException(
                ErrorCode.FORBIDDEN,
                "考试创建人账号不可用，无法执行 AI 批改"
            );
        }
        return user;
    }

    private AuthUserEntity requireActiveStaff(String userId) {
        return authUserRepository.findById(userId)
            .map(this::requireActiveStaff)
            .orElseThrow(() -> new BusinessException(
                ErrorCode.CONFLICT,
                "考试创建人账号不存在，无法执行 AI 批改"
            ));
    }

    private String normalize(String value) {
        if (value == null) {
            return null;
        }
        String normalized = value.trim();
        return normalized.isEmpty() ? null : normalized;
    }
}
