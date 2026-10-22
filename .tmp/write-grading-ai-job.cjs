const fs = require('fs');
const path = require('path');
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content.replace(/\n/g, '\r\n'), { encoding: 'utf8' });
}
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/domain/GradingAiJobStatus.java', `package com.mindmark.server.modules.grading.domain;

public enum GradingAiJobStatus {
    PENDING,
    RUNNING,
    SUCCEEDED,
    SKIPPED,
    FAILED
}
`);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/domain/GradingAiJobEntity.java', `package com.mindmark.server.modules.grading.domain;

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
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(OffsetDateTime startedAt) { this.startedAt = startedAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
`);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/repository/GradingAiJobRepository.java', `package com.mindmark.server.modules.grading.repository;

import com.mindmark.server.modules.grading.domain.GradingAiJobEntity;
import com.mindmark.server.modules.grading.domain.GradingAiJobStatus;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GradingAiJobRepository extends JpaRepository<GradingAiJobEntity, String> {

    @EntityGraph(attributePaths = {"gradingTask", "gradingTask.exam", "gradingTask.exam.classIds", "gradingTask.exam.paper"})
    Optional<GradingAiJobEntity> findTopByGradingTaskIdOrderByCreatedAtDesc(String gradingTaskId);

    boolean existsByGradingTaskIdAndStatusIn(String gradingTaskId, Collection<GradingAiJobStatus> statuses);

    List<GradingAiJobEntity> findByStatusInOrderByCreatedAtAsc(Collection<GradingAiJobStatus> statuses);
}
`);
write('apps/mindmark-server/src/main/java/com/mindmark/server/modules/grading/dto/GradingAiJobResponse.java', `package com.mindmark.server.modules.grading.dto;

import com.mindmark.server.modules.grading.domain.GradingAiJobStatus;
import java.time.OffsetDateTime;

public record GradingAiJobResponse(
    String id,
    String gradingTaskId,
    GradingAiJobStatus status,
    String teacherId,
    String provider,
    String model,
    int subjectiveItemCount,
    int processedItemCount,
    int refreshedItemCount,
    String errorMessage,
    OffsetDateTime createdAt,
    OffsetDateTime startedAt,
    OffsetDateTime finishedAt,
    OffsetDateTime updatedAt
) {
}
`);
write('apps/mindmark-server/src/main/resources/db/migration/V22__grading_ai_job_schema.sql', `create table if not exists grading_ai_job (
    id varchar(96) primary key,
    grading_task_id varchar(96) not null references grading_task(id) on delete cascade,
    status varchar(32) not null,
    teacher_id varchar(64) not null,
    provider varchar(32),
    model varchar(128),
    subjective_item_count integer not null default 0,
    processed_item_count integer not null default 0,
    refreshed_item_count integer not null default 0,
    error_message text,
    created_at timestamptz not null,
    started_at timestamptz,
    finished_at timestamptz,
    updated_at timestamptz not null
);

create index if not exists idx_grading_ai_job_task_created on grading_ai_job(grading_task_id, created_at desc);
create index if not exists idx_grading_ai_job_status_created on grading_ai_job(status, created_at asc);
create index if not exists idx_grading_ai_job_teacher_updated on grading_ai_job(teacher_id, updated_at desc);
`);