const fs = require('fs');
const path = require('path');
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), { encoding: 'utf8' });
}
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingAiJobMapper.java', `package com.mindmark.server.modules.grading.service;

import com.mindmark.server.modules.grading.domain.GradingAiJobEntity;
import com.mindmark.server.modules.grading.dto.GradingAiJobResponse;
import org.springframework.stereotype.Component;

@Component
public class GradingAiJobMapper {

    public GradingAiJobResponse toResponse(GradingAiJobEntity job) {
        return new GradingAiJobResponse(
            job.getId(),
            job.getGradingTask().getId(),
            job.getStatus(),
            job.getTeacherId(),
            job.getProvider(),
            job.getModel(),
            job.getSubjectiveItemCount(),
            job.getProcessedItemCount(),
            job.getRefreshedItemCount(),
            job.getErrorMessage(),
            job.getCreatedAt(),
            job.getStartedAt(),
            job.getFinishedAt(),
            job.getUpdatedAt()
        );
    }
}
`);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/service/GradingAiJobService.java', `package com.mindmark.server.modules.grading.service;

import com.mindmark.server.common.api.ErrorCode;
import com.mindmark.server.common.exception.BusinessException;
import com.mindmark.server.modules.auth.service.ClassScopeService;
import com.mindmark.server.modules.grading.domain.GradingAiJobEntity;
import com.mindmark.server.modules.grading.domain.GradingAiJobStatus;
import com.mindmark.server.modules.grading.domain.GradingTaskEntity;
import com.mindmark.server.modules.grading.domain.GradingTaskStatus;
import com.mindmark.server.modules.grading.dto.GradingAiJobResponse;
import com.mindmark.server.modules.grading.repository.GradingAiJobRepository;
import com.mindmark.server.modules.grading.repository.GradingTaskRepository;
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
    private final GradingAiJobProcessor processor;
    private final GradingAiJobMapper mapper;
    private final ClassScopeService classScopeService;
    private final boolean asyncEnabled;

    public GradingAiJobService(
        GradingAiJobRepository jobRepository,
        GradingTaskRepository gradingTaskRepository,
        GradingAiJobProcessor processor,
        GradingAiJobMapper mapper,
        ClassScopeService classScopeService,
        @Value("\${mindmark.ai.grading.async-enabled:true}") boolean asyncEnabled
    ) {
        this.jobRepository = jobRepository;
        this.gradingTaskRepository = gradingTaskRepository;
        this.processor = processor;
        this.mapper = mapper;
        this.classScopeService = classScopeService;
        this.asyncEnabled = asyncEnabled;
    }

    @Transactional
    public GradingAiJobResponse enqueueIfNeeded(String gradingTaskId) {
        if (!asyncEnabled) {
            return latestJob(gradingTaskId);
        }
        GradingTaskEntity task = gradingTaskRepository.findWithItemsById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
        classScopeService.requireCanAccessExam(task.getExam());
        if (task.getStatus() == GradingTaskStatus.REVIEWED || !hasSubjectiveItem(task)) {
            return latestJob(gradingTaskId);
        }
        if (jobRepository.existsByGradingTaskIdAndStatusIn(gradingTaskId, ACTIVE_STATUSES)) {
            return latestJob(gradingTaskId);
        }

        OffsetDateTime now = OffsetDateTime.now();
        GradingAiJobEntity job = new GradingAiJobEntity();
        job.setId("GAJ-" + UUID.randomUUID());
        job.setGradingTask(task);
        job.setStatus(GradingAiJobStatus.PENDING);
        job.setTeacherId(task.getExam().getCreatedBy());
        job.setSubjectiveItemCount(subjectiveItemCount(task));
        job.setProcessedItemCount(0);
        job.setRefreshedItemCount(0);
        job.setCreatedAt(now);
        job.setUpdatedAt(now);
        job = jobRepository.save(job);
        dispatchAfterCommit(job.getId());
        return mapper.toResponse(job);
    }

    @Transactional(readOnly = true)
    public GradingAiJobResponse latestJob(String gradingTaskId) {
        GradingTaskEntity task = gradingTaskRepository.findWithScopeById(gradingTaskId)
            .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Grading task not found"));
        classScopeService.requireCanAccessExam(task.getExam());
        return jobRepository.findTopByGradingTaskIdOrderByCreatedAtDesc(gradingTaskId)
            .map(mapper::toResponse)
            .orElse(null);
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
}
`);