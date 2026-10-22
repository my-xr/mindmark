package com.mindmark.server.modules.grading.domain;

import com.mindmark.server.modules.question.domain.QuestionEntity;
import com.mindmark.server.modules.question.domain.QuestionType;
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
@Table(name = "grading_item")
public class GradingItemEntity {

    @Id
    @Column(length = 128)
    private String id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "grading_task_id", nullable = false)
    private GradingTaskEntity gradingTask;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "question_id", nullable = false)
    private QuestionEntity question;

    @Enumerated(EnumType.STRING)
    @Column(name = "question_type", nullable = false, length = 32)
    private QuestionType questionType;

    @Column(name = "max_score", nullable = false, precision = 8, scale = 2)
    private BigDecimal maxScore;

    @Column(name = "auto_score", precision = 8, scale = 2)
    private BigDecimal autoScore;

    @Column(name = "final_score", precision = 8, scale = 2)
    private BigDecimal finalScore;

    @Column(name = "is_objective", nullable = false)
    private Boolean objective;

    @Column(name = "is_correct")
    private Boolean correct;

    @Column(name = "ai_confidence", precision = 5, scale = 2)
    private BigDecimal aiConfidence;

    @Column(name = "needs_review")
    private Boolean needsReview;

    @Column(columnDefinition = "text")
    private String comment;

    @Column(name = "grading_source", length = 32)
    private String gradingSource;

    @Column(name = "ai_provider", length = 32)
    private String aiProvider;

    @Column(name = "ai_model", length = 128)
    private String aiModel;

    @Column(name = "ai_rubric_version", length = 64)
    private String aiRubricVersion;

    @Column(name = "ai_raw_score", precision = 8, scale = 2)
    private BigDecimal aiRawScore;

    @Column(name = "teacher_override_reason", columnDefinition = "text")
    private String teacherOverrideReason;

    @Column(name = "score_diff", precision = 8, scale = 2)
    private BigDecimal scoreDiff;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public GradingTaskEntity getGradingTask() { return gradingTask; }
    public void setGradingTask(GradingTaskEntity gradingTask) { this.gradingTask = gradingTask; }
    public QuestionEntity getQuestion() { return question; }
    public void setQuestion(QuestionEntity question) { this.question = question; }
    public QuestionType getQuestionType() { return questionType; }
    public void setQuestionType(QuestionType questionType) { this.questionType = questionType; }
    public BigDecimal getMaxScore() { return maxScore; }
    public void setMaxScore(BigDecimal maxScore) { this.maxScore = maxScore; }
    public BigDecimal getAutoScore() { return autoScore; }
    public void setAutoScore(BigDecimal autoScore) { this.autoScore = autoScore; }
    public BigDecimal getFinalScore() { return finalScore; }
    public void setFinalScore(BigDecimal finalScore) { this.finalScore = finalScore; }
    public Boolean getObjective() { return objective; }
    public void setObjective(Boolean objective) { this.objective = objective; }
    public Boolean getCorrect() { return correct; }
    public void setCorrect(Boolean correct) { this.correct = correct; }
    public BigDecimal getAiConfidence() { return aiConfidence; }
    public void setAiConfidence(BigDecimal aiConfidence) { this.aiConfidence = aiConfidence; }
    public Boolean getNeedsReview() { return needsReview; }
    public void setNeedsReview(Boolean needsReview) { this.needsReview = needsReview; }
    public String getComment() { return comment; }
    public void setComment(String comment) { this.comment = comment; }
    public String getGradingSource() { return gradingSource; }
    public void setGradingSource(String gradingSource) { this.gradingSource = gradingSource; }
    public String getAiProvider() { return aiProvider; }
    public void setAiProvider(String aiProvider) { this.aiProvider = aiProvider; }
    public String getAiModel() { return aiModel; }
    public void setAiModel(String aiModel) { this.aiModel = aiModel; }
    public String getAiRubricVersion() { return aiRubricVersion; }
    public void setAiRubricVersion(String aiRubricVersion) { this.aiRubricVersion = aiRubricVersion; }
    public BigDecimal getAiRawScore() { return aiRawScore; }
    public void setAiRawScore(BigDecimal aiRawScore) { this.aiRawScore = aiRawScore; }
    public String getTeacherOverrideReason() { return teacherOverrideReason; }
    public void setTeacherOverrideReason(String teacherOverrideReason) { this.teacherOverrideReason = teacherOverrideReason; }
    public BigDecimal getScoreDiff() { return scoreDiff; }
    public void setScoreDiff(BigDecimal scoreDiff) { this.scoreDiff = scoreDiff; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}