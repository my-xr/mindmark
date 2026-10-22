package com.mindmark.server.modules.programming.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "programming_judge_result")
public class ProgrammingJudgeResultEntity {
    @Id @Column(length = 128) private String id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "submission_id", nullable = false) private ProgrammingJudgeSubmissionEntity submission;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "test_case_id") private ProgrammingTestCaseEntity testCase;
    @Enumerated(EnumType.STRING) @Column(nullable = false, length = 32) private ProgrammingJudgeStatus status;
    @Column(name = "actual_output_summary", columnDefinition = "text") private String actualOutputSummary;
    @Column(name = "stderr_summary", columnDefinition = "text") private String stderrSummary;
    @Column(name = "time_ms") private Integer timeMs;
    @Column(name = "memory_kb") private Integer memoryKb;
    private Boolean passed;
    @Column(precision = 8, scale = 2) private BigDecimal score;
    @Column(name = "created_at", nullable = false) private OffsetDateTime createdAt;
    public String getId() { return id; } public void setId(String id) { this.id = id; }
    public ProgrammingJudgeSubmissionEntity getSubmission() { return submission; } public void setSubmission(ProgrammingJudgeSubmissionEntity submission) { this.submission = submission; }
    public ProgrammingTestCaseEntity getTestCase() { return testCase; } public void setTestCase(ProgrammingTestCaseEntity testCase) { this.testCase = testCase; }
    public ProgrammingJudgeStatus getStatus() { return status; } public void setStatus(ProgrammingJudgeStatus status) { this.status = status; }
    public String getActualOutputSummary() { return actualOutputSummary; } public void setActualOutputSummary(String actualOutputSummary) { this.actualOutputSummary = actualOutputSummary; }
    public String getStderrSummary() { return stderrSummary; } public void setStderrSummary(String stderrSummary) { this.stderrSummary = stderrSummary; }
    public Integer getTimeMs() { return timeMs; } public void setTimeMs(Integer timeMs) { this.timeMs = timeMs; }
    public Integer getMemoryKb() { return memoryKb; } public void setMemoryKb(Integer memoryKb) { this.memoryKb = memoryKb; }
    public Boolean getPassed() { return passed; } public void setPassed(Boolean passed) { this.passed = passed; }
    public BigDecimal getScore() { return score; } public void setScore(BigDecimal score) { this.score = score; }
    public OffsetDateTime getCreatedAt() { return createdAt; } public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
