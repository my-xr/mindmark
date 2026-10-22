package com.mindmark.server.modules.grading.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "grading_ai_job")
public class GradingAiJobEntity {

    @Id
    @Column(length = 96)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grading_task_id", nullable = false)
    private GradingTaskEntity gradingTask;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private GradingAiJobStatus status;

    @Column(name = "teacher_id", nullable = false, length = 64)
    private String teacherId;

    @Column(length = 32)
    private String provider;

    @Column(length = 128)
    private String model;

    @Column(name = "subjective_item_count", nullable = false)
    private int subjectiveItemCount;

    @Column(name = "processed_item_count", nullable = false)
    private int processedItemCount;

    @Column(name = "refreshed_item_count", nullable = false)
    private int refreshedItemCount;

    @Column(name = "error_message", columnDefinition = "text")
    private String errorMessage;

    @Column(name = "duration_ms")
    private Long durationMs;

    @Column(name = "prompt_version", length = 64)
    private String promptVersion;

    @Column(name = "request_id", length = 128)
    private String requestId;

    @Column(name = "result_summary", columnDefinition = "text")
    private String resultSummary;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "started_at")
    private OffsetDateTime startedAt;

    @Column(name = "finished_at")
    private OffsetDateTime finishedAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public GradingTaskEntity getGradingTask() { return gradingTask; }
    public void setGradingTask(GradingTaskEntity gradingTask) { this.gradingTask = gradingTask; }
    public GradingAiJobStatus getStatus() { return status; }
    public void setStatus(GradingAiJobStatus status) { this.status = status; }
    public String getTeacherId() { return teacherId; }
    public void setTeacherId(String teacherId) { this.teacherId = teacherId; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }
    public int getSubjectiveItemCount() { return subjectiveItemCount; }
    public void setSubjectiveItemCount(int subjectiveItemCount) { this.subjectiveItemCount = subjectiveItemCount; }
    public int getProcessedItemCount() { return processedItemCount; }
    public void setProcessedItemCount(int processedItemCount) { this.processedItemCount = processedItemCount; }
    public int getRefreshedItemCount() { return refreshedItemCount; }
    public void setRefreshedItemCount(int refreshedItemCount) { this.refreshedItemCount = refreshedItemCount; }
    public String getErrorMessage() { return errorMessage; }
    public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
    public Long getDurationMs() { return durationMs; }
    public void setDurationMs(Long durationMs) { this.durationMs = durationMs; }
    public String getPromptVersion() { return promptVersion; }
    public void setPromptVersion(String promptVersion) { this.promptVersion = promptVersion; }
    public String getRequestId() { return requestId; }
    public void setRequestId(String requestId) { this.requestId = requestId; }
    public String getResultSummary() { return resultSummary; }
    public void setResultSummary(String resultSummary) { this.resultSummary = resultSummary; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
