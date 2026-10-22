package com.mindmark.server.modules.grading.domain;

import com.mindmark.server.modules.answer.domain.AnswerSheetEntity;
import com.mindmark.server.modules.exam.domain.ExamEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "grading_task")
public class GradingTaskEntity {

    @Id
    @Column(length = 96)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "exam_id", nullable = false)
    private ExamEntity exam;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "answer_sheet_id", nullable = false)
    private AnswerSheetEntity answerSheet;

    @Column(name = "student_id", nullable = false, length = 64)
    private String studentId;

    @Column(name = "student_name", nullable = false, length = 64)
    private String studentName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private GradingTaskStatus status;

    @Column(name = "objective_score", precision = 8, scale = 2)
    private BigDecimal objectiveScore;

    @Column(name = "subjective_score", precision = 8, scale = 2)
    private BigDecimal subjectiveScore;

    @Column(name = "ai_score", precision = 8, scale = 2)
    private BigDecimal aiScore;

    @Column(name = "final_score", precision = 8, scale = 2)
    private BigDecimal finalScore;

    @Column(columnDefinition = "text")
    private String comment;

    @OneToMany(mappedBy = "gradingTask", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    @OrderBy("createdAt ASC")
    private List<GradingItemEntity> items = new ArrayList<>();

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "reviewed_at")
    private OffsetDateTime reviewedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public ExamEntity getExam() { return exam; }
    public void setExam(ExamEntity exam) { this.exam = exam; }
    public AnswerSheetEntity getAnswerSheet() { return answerSheet; }
    public void setAnswerSheet(AnswerSheetEntity answerSheet) { this.answerSheet = answerSheet; }
    public String getStudentId() { return studentId; }
    public void setStudentId(String studentId) { this.studentId = studentId; }
    public String getStudentName() { return studentName; }
    public void setStudentName(String studentName) { this.studentName = studentName; }
    public GradingTaskStatus getStatus() { return status; }
    public void setStatus(GradingTaskStatus status) { this.status = status; }
    public BigDecimal getObjectiveScore() { return objectiveScore; }
    public void setObjectiveScore(BigDecimal objectiveScore) { this.objectiveScore = objectiveScore; }
    public BigDecimal getSubjectiveScore() { return subjectiveScore; }
    public void setSubjectiveScore(BigDecimal subjectiveScore) { this.subjectiveScore = subjectiveScore; }
    public BigDecimal getAiScore() { return aiScore; }
    public void setAiScore(BigDecimal aiScore) { this.aiScore = aiScore; }
    public BigDecimal getFinalScore() { return finalScore; }
    public void setFinalScore(BigDecimal finalScore) { this.finalScore = finalScore; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public List<GradingItemEntity> getItems() { return items; }
    public void setItems(List<GradingItemEntity> items) { this.items = items; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    public OffsetDateTime getReviewedAt() { return reviewedAt; }
    public void setReviewedAt(OffsetDateTime reviewedAt) { this.reviewedAt = reviewedAt; }
}