package com.mindmark.server.modules.auth.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;

@Entity
@Table(name = "roster_import_task")
public class RosterImportTaskEntity {

    @Id
    @Column(length = 64)
    private String id;

    @Column(name = "operator_id", nullable = false, length = 64)
    private String operatorId;

    @Column(name = "class_id", nullable = false, length = 64)
    private String classId;

    @Column(name = "class_name", nullable = false, length = 128)
    private String className;

    @Column(nullable = false, length = 32)
    private String status;

    @Column(name = "total_count", nullable = false)
    private int totalCount;

    @Column(name = "created_count", nullable = false)
    private int createdCount;

    @Column(name = "skipped_count", nullable = false)
    private int skippedCount;

    @Column(name = "failed_count", nullable = false)
    private int failedCount;

    @Column(name = "error_report_json", nullable = false, columnDefinition = "text")
    private String errorReportJson;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "finished_at", nullable = false)
    private OffsetDateTime finishedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getOperatorId() { return operatorId; }
    public void setOperatorId(String operatorId) { this.operatorId = operatorId; }
    public String getClassId() { return classId; }
    public void setClassId(String classId) { this.classId = classId; }
    public String getClassName() { return className; }
    public void setClassName(String className) { this.className = className; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public int getTotalCount() { return totalCount; }
    public void setTotalCount(int totalCount) { this.totalCount = totalCount; }
    public int getCreatedCount() { return createdCount; }
    public void setCreatedCount(int createdCount) { this.createdCount = createdCount; }
    public int getSkippedCount() { return skippedCount; }
    public void setSkippedCount(int skippedCount) { this.skippedCount = skippedCount; }
    public int getFailedCount() { return failedCount; }
    public void setFailedCount(int failedCount) { this.failedCount = failedCount; }
    public String getErrorReportJson() { return errorReportJson; }
    public void setErrorReportJson(String errorReportJson) { this.errorReportJson = errorReportJson; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getFinishedAt() { return finishedAt; }
    public void setFinishedAt(OffsetDateTime finishedAt) { this.finishedAt = finishedAt; }
}
