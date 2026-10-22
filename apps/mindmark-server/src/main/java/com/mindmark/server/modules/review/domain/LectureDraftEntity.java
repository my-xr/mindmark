package com.mindmark.server.modules.review.domain;

import com.mindmark.server.modules.exam.domain.ExamEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "review_lecture_draft")
public class LectureDraftEntity {
    @Id
    @Column(length = 96)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private ExamEntity exam;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private LectureDraftStatus status;

    @Column(nullable = false, length = 32)
    private String provider;

    @Column(nullable = false, precision = 5, scale = 4)
    private BigDecimal confidence;

    @Column(name = "risk_labels_json", nullable = false, columnDefinition = "text")
    private String riskLabelsJson;

    @Column(name = "outline_json", nullable = false, columnDefinition = "text")
    private String outlineJson;

    @Column(nullable = false, columnDefinition = "text")
    private String content;

    @Column(name = "teacher_edited_content", columnDefinition = "text")
    private String teacherEditedContent;

    @Column(name = "prompt_snapshot", nullable = false, columnDefinition = "text")
    private String promptSnapshot;

    @Column(name = "artifact_id", length = 96)
    private String artifactId;

    @Column(name = "generated_at", nullable = false)
    private OffsetDateTime generatedAt;

    @Column(name = "approved_at")
    private OffsetDateTime approvedAt;

    @Column(name = "created_by", nullable = false, length = 64)
    private String createdBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public ExamEntity getExam() { return exam; }
    public void setExam(ExamEntity exam) { this.exam = exam; }
    public LectureDraftStatus getStatus() { return status; }
    public void setStatus(LectureDraftStatus status) { this.status = status; }
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public BigDecimal getConfidence() { return confidence; }
    public void setConfidence(BigDecimal confidence) { this.confidence = confidence; }
    public String getRiskLabelsJson() { return riskLabelsJson; }
    public void setRiskLabelsJson(String riskLabelsJson) { this.riskLabelsJson = riskLabelsJson; }
    public String getOutlineJson() { return outlineJson; }
    public void setOutlineJson(String outlineJson) { this.outlineJson = outlineJson; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    public String getTeacherEditedContent() { return teacherEditedContent; }
    public void setTeacherEditedContent(String teacherEditedContent) { this.teacherEditedContent = teacherEditedContent; }
    public String getPromptSnapshot() { return promptSnapshot; }
    public void setPromptSnapshot(String promptSnapshot) { this.promptSnapshot = promptSnapshot; }
    public String getArtifactId() { return artifactId; }
    public void setArtifactId(String artifactId) { this.artifactId = artifactId; }
    public OffsetDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(OffsetDateTime generatedAt) { this.generatedAt = generatedAt; }
    public OffsetDateTime getApprovedAt() { return approvedAt; }
    public void setApprovedAt(OffsetDateTime approvedAt) { this.approvedAt = approvedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
