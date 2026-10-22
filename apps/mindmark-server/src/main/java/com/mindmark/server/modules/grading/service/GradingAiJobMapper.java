package com.mindmark.server.modules.grading.service;

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
            job.getDurationMs(),
            job.getPromptVersion(),
            job.getRequestId(),
            job.getResultSummary(),
            job.getCreatedAt(),
            job.getStartedAt(),
            job.getFinishedAt(),
            job.getUpdatedAt()
        );
    }
}
